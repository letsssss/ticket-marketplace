import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { comparePassword, generateAccessToken, generateRefreshToken } from "@/lib/auth"

// 개발 환경에서 사용할 메모리 사용자 저장소
interface MemoryUser {
  id: number;
  email: string;
  password: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// 사용자 목록을 저장할 인메모리 DB (개발 환경 전용)
const memoryUsers: MemoryUser[] = [];

// 회원가입 시 사용자 추가 (다른 API에서 호출)
export function addMemoryUser(user: Omit<MemoryUser, 'id' | 'createdAt' | 'updatedAt'>) {
  const newUser: MemoryUser = {
    ...user,
    id: memoryUsers.length + 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  memoryUsers.push(newUser);
  console.log("메모리 사용자 추가됨:", newUser.email);
  return newUser;
}

// OPTIONS 메서드 처리
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: Request) {
  try {
    // 요청 본문 파싱
    const body = await request.json();
    const { email, password } = body;

    // 비밀번호는 로그에 출력하지 않음
    console.log("로그인 요청:", email);

    // 필수 입력값 검증
    if (!email || !password) {
      return NextResponse.json({ error: "이메일과 비밀번호는 필수 입력값입니다." }, { status: 400 })
    }

    // 개발 환경 확인
    const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
    
    // 개발 환경에서 데이터베이스 없이 테스트
    if (isDevelopment && (!process.env.DATABASE_URL || process.env.DATABASE_URL === "")) {
      console.log("개발 환경에서 로그인 처리");
      
      // 테스트 계정으로 로그인 허용
      if (email === "test@example.com" && password === "test123") {
        console.log("테스트 계정으로 로그인 성공");
        
        const dummyUser = {
          id: 999,
          email: "test@example.com",
          name: "테스트계정",
          role: "USER",
        };
        
        const dummyToken = `dev-jwt-${Date.now()}`;
        
        const response = NextResponse.json({
          message: "로그인 성공",
          user: dummyUser,
          token: dummyToken,
        });
        
        response.cookies.set("auth-token", dummyToken, {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          maxAge: 60 * 60, // 1시간 (초 단위)
          path: "/",
        });
        
        return response;
      }
      
      // 메모리에 저장된 사용자 검색
      const memoryUser = memoryUsers.find(user => 
        user.email.toLowerCase() === email.toLowerCase()
      );
      
      // 사용자가 없으면 오류 반환
      if (!memoryUser) {
        console.log("로그인 실패: 사용자를 찾을 수 없음");
        return NextResponse.json({ 
          error: "이메일 또는 비밀번호가 올바르지 않습니다." 
        }, { status: 401 });
      }
      
      // 비밀번호 검증 (실제 환경에서는 해시된 비밀번호와 비교)
      if (memoryUser.password !== password) {
        console.log("로그인 실패: 비밀번호 불일치");
        return NextResponse.json({ 
          error: "이메일 또는 비밀번호가 올바르지 않습니다." 
        }, { status: 401 });
      }
      
      console.log("로그인 성공:", memoryUser.email);
      
      // 민감한 정보 제외
      const userForResponse = {
        id: memoryUser.id,
        email: memoryUser.email,
        name: memoryUser.name,
        role: memoryUser.role,
      };
      
      // 개발환경용 토큰 생성
      const dummyToken = `dev-jwt-${Date.now()}-${userForResponse.id}`;
      
      const response = NextResponse.json({
        message: "로그인 성공",
        user: userForResponse,
        token: dummyToken,
      });
      
      // 쿠키 설정
      response.cookies.set("auth-token", dummyToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 60 * 60, // 1시간 (초 단위)
        path: "/",
      });
      
      return response;
    }

    // 프로덕션 환경 또는 DATABASE_URL이 설정된 개발 환경
    try {
      // 사용자 조회
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (!user) {
        return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 })
      }

      // 비밀번호 검증
      const isPasswordValid = await comparePassword(password, user.password)

      if (!isPasswordValid) {
        return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 })
      }

      // JWT 토큰 생성
      const accessToken = generateAccessToken(user.id, user.email, user.role)
      const refreshToken = generateRefreshToken(user.id)

      // 리프레시 토큰을 데이터베이스에 저장
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      })

      // 응답에서 민감한 정보 제외
      const { password: _, refreshToken: __, ...userWithoutSensitiveInfo } = user

      // 응답 객체 생성
      const response = NextResponse.json({
        message: "로그인 성공",
        user: userWithoutSensitiveInfo,
        token: accessToken, // 클라이언트에서 필요할 경우
      })

      // 응답 헤더에 쿠키 설정
      response.cookies.set("auth-token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60, // 1시간 (초 단위)
        path: "/",
      })

      return response
    } catch (dbError) {
      console.error("데이터베이스 오류:", dbError)
      
      return NextResponse.json({ 
        error: "서버 오류가 발생했습니다. 나중에 다시 시도해주세요." 
      }, { status: 500 })
    }
  } catch (error) {
    console.error("로그인 처리 오류:", error)
    return NextResponse.json({ error: "로그인 중 오류가 발생했습니다." }, { status: 500 })
  }
}

