import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeaders, getTokenFromCookies, verifyAccessToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // 헤더 또는 쿠키에서 토큰 가져오기
    let token = getTokenFromHeaders(request.headers);
    
    if (!token) {
      token = getTokenFromCookies(request);
    }
    
    if (!token) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
    }

    // 토큰 검증
    const decoded = verifyAccessToken(token);
    
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      return NextResponse.json({ error: "유효하지 않은 인증 토큰입니다." }, { status: 401 });
    }

    const userId = decoded.userId as number;

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileImage: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
        // 비밀번호와 리프레시 토큰은 제외
      },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("사용자 정보 조회 에러:", error);
    return NextResponse.json({ error: "사용자 정보를 가져오는 중 오류가 발생했습니다." }, { status: 500 });
  }
} 