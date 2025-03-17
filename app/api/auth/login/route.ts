import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { comparePassword, generateAccessToken, generateRefreshToken } from "@/lib/auth"
import { memoryUsers, addMemoryUser } from "../me/route"; // me/route.ts에서 가져옴
import jwt from "jsonwebtoken"

// JWT 시크릿 키 정의
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 개발 환경 확인 함수
const isDevelopment = () => !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

// Edge 브라우저를 포함한 모든 브라우저에서 쿠키를 올바르게 설정하는 헬퍼 함수
function setAuthCookie(response: NextResponse, name: string, value: string, httpOnly: boolean = true) {
  response.cookies.set(name, value, {
    httpOnly,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7일 (초)
    path: '/',
  });
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
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "이메일과 비밀번호는 필수 입력값입니다." }, { status: 400 })
    }

    // 개발 환경에서 테스트 계정 로그인 허용
    if (isDevelopment() && (email === 'test@example.com' || email === 'admin@example.com')) {
      const testUser = memoryUsers.find(u => u.email === email);
      if (testUser && (password === 'password' || password === '1234')) {
        const token = jwt.sign({ userId: testUser.id }, JWT_SECRET, { expiresIn: '7d' });
        const response = NextResponse.json({
          success: true,
          message: "로그인 성공",
          user: testUser,
          token
        });
        
        // 쿠키 설정 (헬퍼 함수 사용)
        setAuthCookie(response, 'auth-token', token);
        setAuthCookie(response, 'auth-status', 'authenticated', false);
        
        return response;
      }
    }

    // 개발 환경 확인
    const isDevMode = isDevelopment();
    
    // 테스트 계정으로 로그인 허용
    if (email === "test@example.com" && password === "test123") {
      console.log("테스트 계정으로 로그인 성공");
      
      const dummyUser = {
        id: 999,
        email: "test@example.com",
        name: "테스트계정",
        role: "USER",
      };
      
      const dummyToken = `dev-jwt-${Date.now()}-999`;
      
      const response = NextResponse.json({
        message: "로그인 성공",
        user: dummyUser,
        token: dummyToken,
      });
      
      // 쿠키 설정 강화
      return setAuthCookie(response, dummyToken);
    }

    try {
      // 데이터베이스 연결 확인
      const dbUserPromise = prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      
      let memoryUserFound = false;
      
      // 개발 환경에서 메모리 사용자 검색
      if (isDevMode) {
        console.log("개발 환경에서 메모리 사용자 검색");
        const memoryUser = memoryUsers.find(user => 
          user.email.toLowerCase() === email.toLowerCase()
        );
        
        if (memoryUser) {
          memoryUserFound = true;
          
          // 비밀번호 검증
          if (memoryUser.password !== password) {
            console.log("비밀번호 불일치");
            return NextResponse.json({ 
              error: "이메일 또는 비밀번호가 올바르지 않습니다." 
            }, { status: 401 });
          }
          
          console.log("메모리 사용자로 로그인 성공:", memoryUser.email);
          
          // 민감한 정보 제외
          const { password: _, ...userWithoutPassword } = memoryUser;
          
          // 개발환경용 토큰 생성
          const dummyToken = `dev-jwt-${Date.now()}-${userWithoutPassword.id}`;
          
          const response = NextResponse.json({
            message: "로그인 성공",
            user: userWithoutPassword,
            token: dummyToken,
          });
          
          // 쿠키 설정 강화
          return setAuthCookie(response, dummyToken);
        }
      }
      
      // 데이터베이스 사용자 확인
      const user = await dbUserPromise;
      
      if (user) {
        console.log("DB에서 사용자 찾음:", user.email);
        
        // 사용자가 있으면 비밀번호 검증
        // 개발 환경에서는 간단한 비교, 프로덕션에서는 해시 비교
        let isPasswordValid;
        
        if (isDevMode) {
          // 개발 환경에서는 일단 정확한 비밀번호 비교를 시도
          // 그러나 SQLite에 저장된 비밀번호는 해시되어 있지 않을 수 있음
          isPasswordValid = user.password === password;
          
          // 해시된 비밀번호일 경우 comparePassword 사용 시도
          if (!isPasswordValid) {
            try {
              isPasswordValid = await comparePassword(password, user.password);
            } catch (hashError) {
              console.error("비밀번호 해시 비교 실패, 일반 비교 사용:", hashError);
              // 에러가 발생하면 결과는 이미 false이므로 추가 작업 불필요
            }
          }
        } else {
          // 프로덕션 환경에서는 항상 해시 비교
          isPasswordValid = await comparePassword(password, user.password);
        }

        if (!isPasswordValid) {
          console.log("비밀번호 불일치");
          return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
        }

        // 로그인 성공
        console.log("로그인 성공:", user.email);
        
        // JWT 토큰 생성
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        // 리프레시 토큰을 데이터베이스에 저장
        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken },
        });

        // 응답에서 민감한 정보 제외
        const { password: _, refreshToken: __, ...userWithoutSensitiveInfo } = user;

        // 응답 객체 생성
        const response = NextResponse.json({
          success: true,
          message: "로그인 성공",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          token
        });

        // 쿠키 설정 (헬퍼 함수 사용)
        setAuthCookie(response, 'auth-token', token);
        setAuthCookie(response, 'auth-status', 'authenticated', false);
        
        // 캐시 방지 헤더 추가
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        
        return response;
      }
      
      // 개발 환경에서 자동으로 사용자 생성 (라이브에서는 절대 사용하지 않음)
      if (isDevMode && !memoryUserFound && !user) {
        console.log("개발 환경에서 새 사용자 자동 생성:", email);
        
        const newUser = addMemoryUser({
          email,
          password,
          name: email.split('@')[0] || "새사용자",
          role: "USER",
        });
        
        const { password: _, ...userWithoutPassword } = newUser;
        
        // 개발환경용 토큰 생성
        const dummyToken = `dev-jwt-${Date.now()}-${userWithoutPassword.id}`;
        
        const response = NextResponse.json({
          message: "개발환경: 사용자 자동 생성 및 로그인 성공",
          user: userWithoutPassword,
          token: dummyToken,
        });
        
        // 쿠키 설정 강화
        return setAuthCookie(response, dummyToken);
      }

      console.log("사용자 없음:", email);
      return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
    } catch (dbError) {
      console.error("데이터베이스 오류:", dbError);
      
      // 개발 환경에서는 오류가 발생해도 사용자 생성 시도
      if (isDevMode) {
        try {
          console.log("개발 환경에서 DB 오류로 인한 메모리 사용자 생성 시도");
          
          // 기존 사용자 찾기
          const existingUser = memoryUsers.find(user => 
            user.email.toLowerCase() === email.toLowerCase()
          );
          
          if (existingUser) {
            // 비밀번호 검증
            if (existingUser.password !== password) {
              return NextResponse.json({ 
                error: "이메일 또는 비밀번호가 올바르지 않습니다." 
              }, { status: 401 });
            }
            
            const { password: _, ...userWithoutPassword } = existingUser;
            
            // 개발환경용 토큰 생성
            const dummyToken = `dev-jwt-${Date.now()}-${userWithoutPassword.id}`;
            
            const response = NextResponse.json({
              message: "로그인 성공",
              user: userWithoutPassword,
              token: dummyToken,
            });
            
            // 쿠키 설정 강화
            return setAuthCookie(response, dummyToken);
          }
          
          // 새 사용자 생성
          const newUser = addMemoryUser({
            email,
            password,
            name: email.split('@')[0] || "새사용자",
            role: "USER",
          });
          
          const { password: _, ...userWithoutPassword } = newUser;
          
          // 개발환경용 토큰 생성
          const dummyToken = `dev-jwt-${Date.now()}-${userWithoutPassword.id}`;
          
          const response = NextResponse.json({
            message: "개발환경: DB 오류로 인한 사용자 자동 생성 및 로그인 성공",
            user: userWithoutPassword,
            token: dummyToken,
          });
          
          // 쿠키 설정 강화
          return setAuthCookie(response, dummyToken);
        } catch (memoryError) {
          console.error("메모리 사용자 생성 오류:", memoryError);
        }
      }
      
      return NextResponse.json({ 
        error: "서버 오류가 발생했습니다. 나중에 다시 시도해주세요." 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "로그인 중 오류가 발생했습니다."
    }, { status: 500 });
  }
}

