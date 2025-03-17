import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/auth";
import { z } from "zod";

const prisma = new PrismaClient();

// 입력 데이터 유효성 검사를 위한 zod 스키마
const postSchema = z.object({
  title: z.string().min(2, "제목은 2글자 이상이어야 합니다."),
  content: z.string().min(10, "내용은 10글자 이상이어야 합니다."),
  category: z.string().optional(),
  eventName: z.string().optional(),
  eventDate: z.string().optional(),
  eventVenue: z.string().optional(),
  ticketPrice: z.number().optional(),
  contactInfo: z.string().optional(),
});

// CORS 헤더 설정을 위한 함수
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 캐시 방지 헤더
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

// OPTIONS 메서드 처리
export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

// 글 작성 API
export async function POST(request: NextRequest) {
  try {
    console.log("글 작성 API 호출됨");
    
    // 현재 인증된 사용자 정보 가져오기
    const authUser = await getAuthenticatedUser(request);
    
    if (!authUser) {
      console.log("인증된 사용자를 찾을 수 없음");
      return addCorsHeaders(NextResponse.json(
        { success: false, message: "인증되지 않은 사용자입니다." },
        { status: 401 }
      ));
    }

    console.log("인증된 사용자 ID:", authUser.id);

    // 요청 본문 파싱
    const body = await request.json();
    
    // 입력 데이터 유효성 검사
    const validationResult = postSchema.safeParse(body);
    
    if (!validationResult.success) {
      return addCorsHeaders(NextResponse.json(
        { 
          success: false, 
          message: "유효하지 않은 입력 데이터입니다.", 
          errors: validationResult.error.errors 
        },
        { status: 400 }
      ));
    }

    // 글 저장
    const post = await prisma.Post.create({
      data: {
        title: body.title,
        content: body.content,
        category: body.category || "GENERAL",
        authorId: authUser.id,
        eventName: body.eventName,
        eventDate: body.eventDate,
        eventVenue: body.eventVenue,
        ticketPrice: body.ticketPrice,
        contactInfo: body.contactInfo,
      }
    });

    console.log("글 작성 성공:", post.id);

    return addCorsHeaders(NextResponse.json(
      { 
        success: true, 
        message: "글이 성공적으로 작성되었습니다.", 
        post
      },
      { status: 201 }
    ));
  } catch (error) {
    console.error("글 작성 오류:", error);
    return addCorsHeaders(NextResponse.json(
      { success: false, message: "글 작성 중 오류가 발생했습니다." },
      { status: 500 }
    ));
  } finally {
    await prisma.$disconnect();
  }
}

// GET 요청 핸들러 - 글 목록 가져오기
export async function GET(request: NextRequest) {
  try {
    console.log("글 목록 API 호출됨");
    
    // 쿼리 파라미터 처리
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category') || undefined;
    
    // 페이지네이션 계산
    const skip = (page - 1) * limit;
    
    // where 조건 설정 - 삭제된 글 제외 및 카테고리 필터
    const where: any = { 
      isDeleted: false 
    };
    
    // 카테고리 필터링 추가
    if (category) {
      where.category = category;
    }
    
    // 총 게시글 수 조회
    const totalCount = await prisma.Post.count({ where });
    
    // 글 목록 조회 (작성자 정보 포함)
    const posts = await prisma.Post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });
    
    // 페이지네이션 메타데이터
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // 응답 데이터 생성
    const responseData = {
      success: true,
      posts,
      meta: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage
      }
    };
    
    return addCorsHeaders(NextResponse.json(responseData));
  } catch (error) {
    console.error("글 목록 조회 오류:", error);
    
    // 오류 응답
    const errorResponse = { 
      success: false, 
      message: "글 목록을 가져오는 중 오류가 발생했습니다." 
    };
    
    return addCorsHeaders(
      NextResponse.json(errorResponse, { status: 500 })
    );
  } finally {
    await prisma.$disconnect();
  }
} 