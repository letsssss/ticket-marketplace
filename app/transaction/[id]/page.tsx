"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Calendar, MapPin, Clock, CreditCard, Play, ThumbsUp, CheckCircle, Send, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TransactionStepper } from "@/components/transaction-stepper"
import { TicketingStatusCard } from "@/components/ticketing-status-card"

// 임시 데이터 (실제로는 API에서 가져와야 합니다)
const transactionData = {
  id: "1",
  type: "purchase", // or 'sale'
  status: "취켓팅 시작",
  currentStep: "ticketing_started", // 현재 단계
  stepDates: {
    payment: "2024-03-15 14:30",
    ticketing_started: "2024-03-16 09:15",
    ticketing_completed: null,
    confirmed: null,
  },
  ticket: {
    title: "세븐틴 콘서트",
    date: "2024-03-20",
    time: "19:00",
    venue: "잠실종합운동장 주경기장",
    seat: "VIP석 A구역 23열 15번",
    image: "/placeholder.svg",
  },
  price: 165000,
  paymentMethod: "신용카드",
  paymentStatus: "결제 완료",
  ticketingStatus: "취켓팅 진행중",
  ticketingInfo: "취소표 발생 시 알림을 보내드립니다. 취소표 발생 시 빠르게 예매를 진행해 드립니다.",
  seller: {
    id: "seller123",
    name: "티켓마스터",
    profileImage: "/placeholder.svg?height=50&width=50",
  },
}

// 샘플 메시지 데이터
const initialMessages = [
  {
    id: 1,
    senderId: "seller123",
    text: "안녕하세요! 세븐틴 콘서트 티켓 구매해주셔서 감사합니다. 취켓팅 진행 중이니 조금만 기다려주세요.",
    timestamp: "2024-03-16T10:30:00",
  },
  {
    id: 2,
    senderId: "user",
    text: "네, 감사합니다. 혹시 취켓팅 완료 예상 시간이 언제인가요?",
    timestamp: "2024-03-16T10:35:00",
  },
  {
    id: 3,
    senderId: "seller123",
    text: "보통 공연 1-2일 전에 완료되지만, 취소표가 빨리 나오면 더 일찍 완료될 수도 있어요. 상황에 따라 다를 수 있으니 메시지로 안내해 드릴게요.",
    timestamp: "2024-03-16T10:40:00",
  },
]

export default function TransactionDetail() {
  const params = useParams()
  const router = useRouter()
  const [transaction, setTransaction] = useState(transactionData)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef(null)

  // 실제 구현에서는 이 부분에서 API를 호출하여 거래 정보를 가져와야 합니다
  useEffect(() => {
    // API 호출 및 데이터 설정 로직
    console.log("Transaction ID:", params.id)
  }, [params.id])

  // 채팅창이 열릴 때 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom()
    }
  }, [isChatOpen, messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // 거래 단계 정의 - 4단계로 수정
  const transactionSteps = [
    {
      id: "payment",
      label: "결제 완료",
      icon: <CreditCard className="w-5 h-5" />,
      date: transaction.stepDates.payment
        ? new Date(transaction.stepDates.payment).toLocaleDateString("ko-KR", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : undefined,
    },
    {
      id: "ticketing_started",
      label: "취켓팅 시작",
      icon: <Play className="w-5 h-5" />,
      date: transaction.stepDates.ticketing_started
        ? new Date(transaction.stepDates.ticketing_started).toLocaleDateString("ko-KR", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : undefined,
    },
    {
      id: "ticketing_completed",
      label: "취켓팅 완료",
      icon: <CheckCircle className="w-5 h-5" />,
      date: transaction.stepDates.ticketing_completed
        ? new Date(transaction.stepDates.ticketing_completed).toLocaleDateString("ko-KR", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : undefined,
    },
    {
      id: "confirmed",
      label: "구매 확정",
      icon: <ThumbsUp className="w-5 h-5" />,
      date: transaction.stepDates.confirmed
        ? new Date(transaction.stepDates.confirmed).toLocaleDateString("ko-KR", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : undefined,
    },
  ]

  const handleAction = () => {
    if (transaction.currentStep === "ticketing_started") {
      // 취켓팅 상태 확인 로직
      alert("현재 취켓팅이 진행 중입니다. 취소표 발생 시 알림을 보내드립니다.")
    } else if (transaction.currentStep === "ticketing_completed") {
      // 취켓팅 완료 후 구매 확정 로직
      alert("구매가 확정되었습니다.")
      // 실제로는 API 호출하여 상태 업데이트
      setTransaction({
        ...transaction,
        currentStep: "confirmed",
        status: "구매 확정",
        stepDates: {
          ...transaction.stepDates,
          confirmed: new Date().toISOString(),
        },
      })
    } else if (transaction.currentStep === "confirmed") {
      // 이미 구매 확정된 경우
      router.push(`/review/${transaction.id}`)
    }
  }

  const openChat = () => setIsChatOpen(true)
  const closeChat = () => setIsChatOpen(false)

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return

    const newMsg = {
      id: messages.length + 1,
      senderId: "user",
      text: newMessage,
      timestamp: new Date().toISOString(),
    }

    setMessages([...messages, newMsg])
    setNewMessage("")
  }

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
  }

  // 현재 단계에 따른 버튼 텍스트 결정
  const getActionButtonText = () => {
    switch (transaction.currentStep) {
      case "ticketing_started":
        return "취켓팅 상태 확인"
      case "ticketing_completed":
        return "구매 확정하기"
      case "confirmed":
        return "리뷰 작성하기"
      default:
        return "다음 단계로"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <Link href="/mypage" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>마이페이지로 돌아가기</span>
          </Link>
          <h1 className="text-3xl font-bold mt-4">구매 거래 상세</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 transition-all duration-300 hover:shadow-md">
          <div className="p-6 md:p-8">
            <div className="mb-8">
              <div>
                <span className="text-sm text-gray-500 mb-1 block">티켓 정보</span>
                <h2 className="text-2xl font-bold text-gray-900">{transaction.ticket.title}</h2>
              </div>
            </div>

            {/* 거래 진행 상태 스텝퍼 */}
            <div className="mb-10 bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h3 className="text-lg font-semibold mb-6 text-gray-800">거래 진행 상태</h3>
              <TransactionStepper currentStep={transaction.currentStep} steps={transactionSteps} />
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/3">
                <div className="relative h-60 md:h-full w-full rounded-xl overflow-hidden shadow-sm">
                  <Image
                    src={transaction.ticket.image || "/placeholder.svg"}
                    alt={transaction.ticket.title}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </div>
              <div className="md:w-2/3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 mr-3 text-blue-500" />
                    <div>
                      <span className="text-xs text-gray-500 block">공연 날짜</span>
                      <span className="font-medium">{transaction.ticket.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 mr-3 text-blue-500" />
                    <div>
                      <span className="text-xs text-gray-500 block">공연 시간</span>
                      <span className="font-medium">{transaction.ticket.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 mr-3 text-blue-500" />
                    <div>
                      <span className="text-xs text-gray-500 block">공연 장소</span>
                      <span className="font-medium">{transaction.ticket.venue}</span>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <CreditCard className="h-5 w-5 mr-3 text-blue-500" />
                    <div>
                      <span className="text-xs text-gray-500 block">결제 금액</span>
                      <span className="font-medium">{transaction.price.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-full mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-blue-600"
                      >
                        <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
                        <path d="M15 3v6h6" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-blue-600 block">좌석 정보</span>
                      <span className="font-medium text-blue-800">{transaction.ticket.seat}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t pt-8">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">결제 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500 block mb-1">결제 방법</span>
                  <span className="font-medium">{transaction.paymentMethod}</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500 block mb-1">결제 상태</span>
                  <span className="font-medium text-green-600">{transaction.paymentStatus}</span>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t pt-8">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">취켓팅 정보</h3>

              <TicketingStatusCard
                status="in_progress"
                message="취소표 발생 시 즉시 예매를 진행해 드립니다. 취소표 발생 알림을 받으시면 앱을 확인해주세요."
                updatedAt="2024-03-16 09:15"
              />

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500 block mb-1">취켓팅 상태</span>
                  <span className="font-medium text-blue-600">{transaction.ticketingStatus}</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500 block mb-1">예상 완료 시간</span>
                  <span className="font-medium">판매자와 협의</span>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 flex flex-col sm:flex-row justify-end gap-4">
              {transaction.currentStep === "confirmed" && (
                <Link href={`/review/${transaction.id}`}>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    판매자 리뷰 작성
                  </Button>
                </Link>
              )}
              {transaction.currentStep !== "ticketing_started" && (
                <Button
                  onClick={handleAction}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  {getActionButtonText()}
                </Button>
              )}
            </div>
            {/* 오른쪽 아래 구매확정 버튼 */}
            <div className="mt-10 flex justify-end gap-4">
              <Button onClick={openChat} variant="outline" className="flex items-center gap-2 border-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                판매자에게 메시지
              </Button>
              <Button
                onClick={handleAction}
                className="bg-[#FFD600] hover:bg-[#FFE600] text-black font-semibold px-6 py-3 rounded-lg shadow-md"
              >
                구매확정
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* 1:1 채팅 인터페이스 */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
            {/* 채팅 헤더 */}
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={transaction.seller.profileImage || "/placeholder.svg"}
                    alt={transaction.seller.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium">{transaction.seller.name}</h3>
                  <p className="text-xs text-gray-500">판매자</p>
                </div>
              </div>
              <button
                onClick={closeChat}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 채팅 메시지 영역 */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.senderId === "user"
                          ? "bg-blue-500 text-white rounded-tr-none"
                          : "bg-gray-200 text-gray-800 rounded-tl-none"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${message.senderId === "user" ? "text-blue-100" : "text-gray-500"}`}>
                        {formatMessageTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* 메시지 입력 영역 */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

