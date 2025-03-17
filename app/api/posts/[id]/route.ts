import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAuthenticatedUser } from "@/lib/auth"

const prisma = new PrismaClient()

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, PUT',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// 특정 게시글 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 게시글 ID입니다' },
        { status: 400, headers: corsHeaders }
      )
    }
    
    // 게시글 조회 및 조회수 증가
    const post = await prisma.post.update({
      where: {
        id,
        isDeleted: false,
      },
      data: {
        viewCount: { increment: 1 }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        }
      },
    })
    
    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다' },
        { status: 404, headers: corsHeaders }
      )
    }
    
    // 응답 형태 변환
    const formattedPost = {
      ...post,
      author: {
        ...post.author,
        image: post.author.profileImage,
      },
      _count: {
        comments: 0 // 댓글 기능은 아직 구현되지 않음
      }
    }
    
    return NextResponse.json({ post: formattedPost }, { headers: corsHeaders })
  } catch (error) {
    console.error('게시글 조회 오류:', error)
    return NextResponse.json(
      { error: '게시글 조회 중 오류가 발생했습니다' },
      { status: 500, headers: corsHeaders }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// 게시글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthenticatedUser(request)
    
    // 인증 확인
    if (!authUser) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401, headers: corsHeaders }
      )
    }
    
    const userId = authUser.id
    const postId = parseInt(params.id)
    
    if (isNaN(postId)) {
      return NextResponse.json(
        { error: '유효하지 않은 게시글 ID입니다' },
        { status: 400, headers: corsHeaders }
      )
    }
    
    // 게시글 조회
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
        isDeleted: false,
      },
      select: {
        authorId: true,
      },
    })
    
    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다' },
        { status: 404, headers: corsHeaders }
      )
    }
    
    // 작성자 확인
    if (post.authorId !== userId) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다' },
        { status: 403, headers: corsHeaders }
      )
    }
    
    // 소프트 삭제 - 데이터베이스에서 바로 삭제하지 않고 isDeleted 플래그만 설정
    await prisma.post.update({
      where: { id: postId },
      data: { isDeleted: true },
    })
    
    return NextResponse.json(
      { message: '게시글이 성공적으로 삭제되었습니다' },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('게시글 삭제 오류:', error)
    return NextResponse.json(
      { error: '게시글 삭제 중 오류가 발생했습니다' },
      { status: 500, headers: corsHeaders }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// CORS Preflight 요청 처리
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
} 