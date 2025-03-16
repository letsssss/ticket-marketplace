import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 응답 객체 생성
  const response = NextResponse.next();

  // CORS 헤더 설정
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

// 미들웨어를 적용할 경로 설정
export const config = {
  matcher: '/api/:path*',
}; 