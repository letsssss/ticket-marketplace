"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, User, ShoppingBag, Tag, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { WithdrawModal } from "@/components/withdraw-modal"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

// 임시 데이터 (실제로는 API나 데이터베이스에서 가져와야 합니다)
const ongoingPurchases = [
  { id: 1, title: "세븐틴 콘서트", date: "2024-03-20", price: "165,000원", status: "입금 대기중" },
  { id: 2, title: "데이식스 전국투어", date: "2024-02-01", price: "99,000원", status: "배송 준비중" },
]

// 판매 중인 상품 타입 정의
interface Sale {
  id: number;
  title: string;
  date: string;
  price: string;
  status: string;
}

export default function MyPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [ongoingSales, setOngoingSales] = useState<Sale[]>([])
  const [isLoadingSales, setIsLoadingSales] = useState(false)
  const [mounted, setMounted] = useState(false)

  // 마운트 확인
  useEffect(() => {
    setMounted(true)
  }, [])

  // 로그인 상태 확인
  useEffect(() => {
    if (mounted && !isLoading && !user) {
      toast.error("로그인이 필요한 페이지입니다")
      router.push("/login?callbackUrl=/mypage")
    }
  }, [user, isLoading, router, mounted])

  // 판매 중인 상품 목록 가져오기
  useEffect(() => {
    const fetchOngoingSales = async () => {
      if (!user) return;
      
      setIsLoadingSales(true);
      try {
        // 모든 카테고리(TICKET_SALE, TICKET_CANCELLATION 모두)의 본인 게시물을 가져옵니다
        const response = await fetch('/api/posts');
        
        if (!response.ok) {
          throw new Error('판매 목록을 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        
        // API 응답을 화면에 표시할 형식으로 변환
        const salesData = data.posts.map((post: any) => ({
          id: post.id,
          title: post.title || post.eventName,
          date: post.eventDate || new Date(post.createdAt).toLocaleDateString(),
          price: `${post.ticketPrice?.toLocaleString() || '가격 정보 없음'}원`,
          status: post.category === 'TICKET_CANCELLATION' ? "취켓팅 판매중" : "판매중"
        }));
        
        setOngoingSales(salesData);
      } catch (error) {
        console.error('판매 목록 로딩 오류:', error);
        toast.error('판매 목록을 불러오는데 실패했습니다.');
        // 에러 발생 시 기본 데이터 사용
        setOngoingSales([
          { id: 1, title: "아이브 팬미팅", date: "2024-04-05", price: "88,000원", status: "판매중" },
          { id: 2, title: "웃는 남자", date: "2024-01-09", price: "110,000원", status: "구매자 입금 대기중" },
        ]);
      } finally {
        setIsLoadingSales(false);
      }
    };

    if (mounted && user && activeTab === "ongoing-sales") {
      fetchOngoingSales();
    }
  }, [user, activeTab, mounted]);

  // 게시물 삭제 함수
  const deletePost = async (postId: number) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('게시물 삭제에 실패했습니다.');
      }
      
      // 삭제 성공 시 목록에서 제거
      setOngoingSales(prev => prev.filter(sale => sale.id !== postId));
      toast.success('게시물이 삭제되었습니다.');
    } catch (error) {
      console.error('게시물 삭제 오류:', error);
      toast.error('게시물 삭제에 실패했습니다.');
    }
  };

  // 로딩 중이거나 마운트되지 않은 경우 로딩 표시
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center h-screen">
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  // 로그인되지 않은 경우
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center h-screen">
          <p>로그인이 필요합니다. 로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout();
    toast.success("로그아웃 되었습니다");
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span>홈으로 돌아가기</span>
            </Link>
            <button 
              onClick={handleLogout} 
              className="text-gray-700 hover:text-[#0061FF] transition-colors"
            >
              로그아웃
            </button>
          </div>
          <h1 className="text-3xl font-bold mt-4">마이페이지</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-l-4 border-[#0061FF]">
              <h2 className="text-lg font-medium text-gray-700 mb-1">나의 예치금</h2>
              <p className="text-2xl font-bold text-[#0061FF]">120,000원</p>
              <div className="flex justify-between items-center mt-4">
                <Link
                  href="/mypage/deposit-history"
                  className="text-sm text-gray-500 hover:text-[#0061FF] transition-colors"
                >
                  거래내역 보기
                </Link>
                <Button
                  className="bg-[#FFD600] hover:bg-[#FFE600] text-black px-5 py-2"
                  onClick={() => setIsWithdrawModalOpen(true)}
                >
                  출금하기
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-l-4 border-[#FF2F6E]">
              <h2 className="text-lg font-medium text-gray-700 mb-1">포인트</h2>
              <p className="text-2xl font-bold text-[#FF2F6E]">3,500P</p>
              <div className="flex justify-between items-center mt-4">
                <Link
                  href="/mypage/point-history"
                  className="text-sm text-gray-500 hover:text-[#FF2F6E] transition-colors"
                >
                  적립/사용 내역
                </Link>
                <p className="text-xs text-gray-500">30일 후 소멸 예정: 500P</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-l-4 border-[#FFD600]">
              <h2 className="text-lg font-medium text-gray-700 mb-1">쿠폰</h2>
              <p className="text-2xl font-bold text-[#FFD600]">2장</p>
              <div className="flex justify-between items-center mt-4">
                <Link href="/mypage/coupons" className="text-sm text-gray-500 hover:text-[#FFD600] transition-colors">
                  쿠폰함 보기
                </Link>
                <Button variant="outline" className="text-gray-700 border-gray-300">
                  쿠폰 등록
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b">
            <button
              className={`flex-1 py-4 px-6 text-center ${activeTab === "profile" ? "bg-gray-100 font-semibold" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <User className="inline-block mr-2" />
              프로필
            </button>
            <button
              className={`flex-1 py-4 px-6 text-center ${activeTab === "ongoing-purchases" ? "bg-gray-100 font-semibold" : ""}`}
              onClick={() => setActiveTab("ongoing-purchases")}
            >
              <ShoppingBag className="inline-block mr-2" />
              구매중인 상품
            </button>
            <button
              className={`flex-1 py-4 px-6 text-center ${activeTab === "ongoing-sales" ? "bg-gray-100 font-semibold" : ""}`}
              onClick={() => setActiveTab("ongoing-sales")}
            >
              <Tag className="inline-block mr-2" />
              판매중인 상품
            </button>
          </div>

          <div className="p-6">
            {/* 이 부분은 현재 로그인한 사용자만 볼 수 있는 개인 정보입니다 */}
            {activeTab === "profile" && (
              <div>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-blue-700 text-sm">이 정보는 회원님만 볼 수 있는 개인 정보입니다.</p>
                </div>
                <h2 className="text-xl font-semibold mb-4">프로필 정보</h2>
                <p>
                  <strong>이름:</strong> {user.name}
                </p>
                <p>
                  <strong>이메일:</strong> {user.email}
                </p>
                <p>
                  <strong>가입일:</strong> {new Date().toLocaleDateString()}
                </p>
                <Link href="/mypage/edit-profile">
                  <Button className="mt-4 bg-[#FFD600] hover:bg-[#FFE600] text-black px-6 py-2">프로필 수정</Button>
                </Link>
              </div>
            )}

            {activeTab === "ongoing-purchases" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">구매중인 상품</h2>
                {ongoingPurchases.length > 0 ? (
                  ongoingPurchases.map((item) => (
                    <div key={item.id} className="border-b py-4 last:border-b-0">
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.date}</p>
                      <p className="text-sm font-semibold">{item.price}</p>
                      <p className="text-sm text-blue-600">{item.status}</p>
                      <Link href={`/transaction/${item.id}`}>
                        <Button className="mt-2 text-sm" variant="outline">
                          거래 상세
                        </Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">구매중인 상품이 없습니다.</p>
                )}
              </div>
            )}

            {activeTab === "ongoing-sales" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">판매중인 상품</h2>
                {isLoadingSales ? (
                  <p className="text-gray-500">판매 목록을 불러오는 중...</p>
                ) : ongoingSales.length > 0 ? (
                  ongoingSales.map((item) => (
                    <div key={item.id} className="border-b py-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-sm text-gray-600">{item.date}</p>
                          <p className="text-sm font-semibold">{item.price}</p>
                          <p className="text-sm text-green-600">{item.status}</p>
                          <div className="flex space-x-2 mt-2">
                            <Link href={`/transaction/${item.id}`}>
                              <Button className="text-sm" variant="outline">
                                거래 상세
                              </Button>
                            </Link>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" className="p-2 h-auto text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>게시물 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{item.title}" 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deletePost(item.id)} 
                                className="bg-red-500 hover:bg-red-600 text-white">
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">판매중인 상품이 없습니다.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} balance={120000} />
    </div>
  )
}

