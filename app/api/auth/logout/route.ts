import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTokenFromHeaders, verifyAccessToken } from "@/lib/auth"

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
    console.log("로그아웃 요청 수신");
    
    // 개발 환경에서는 데이터베이스 연결 없이 성공 응답 제공
    const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      console.log("개발 환경에서 더미 로그아웃 응답 제공");
      
      // 쿠키 제거
      const response = NextResponse.json({ 
        message: "로그아웃에 성공했습니다. (개발 환경 전용 응답)" 
      });
      
      response.cookies.set("auth-token", "", {
        httpOnly: true,
        expires: new Date(0),
        path: "/",
      });
      
      // CORS 헤더 설정
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return response;
    }
    
    // 토큰 가져오기
    const token = getTokenFromHeaders(request.headers)
    
    if (!token) {
      return NextResponse.json({ error: "인증 토큰이 필요합니다." }, { status: 401 })
    }

    // 토큰 검증
    const decoded = verifyAccessToken(token)
    
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다." }, { status: 401 })
    }

    const userId = decoded.userId as number

    try {
      // 리프레시 토큰 제거
      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      })
    } catch (dbError) {
      console.error("데이터베이스 오류:", dbError);
      // 데이터베이스 오류가 발생해도 쿠키는 제거
    }

    // 쿠키 제거
    const response = NextResponse.json({ message: "로그아웃에 성공했습니다." })
    
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    })

    return response
  } catch (error) {
    console.error("로그아웃 에러:", error)
    return NextResponse.json({ error: "로그아웃 중 오류가 발생했습니다." }, { status: 500 })
  }
}

