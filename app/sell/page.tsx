"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

// 임시 공연 데이터 (실제로는 API에서 가져와야 합니다)
const concertData = [
  { id: 1, title: "세븐틴 콘서트", date: "2024-03-20", venue: "잠실종합운동장 주경기장" },
  { id: 2, title: "방탄소년단 월드투어", date: "2024-04-15", venue: "부산 아시아드 주경기장" },
  { id: 3, title: "아이유 콘서트", date: "2024-05-01", venue: "올림픽공원 체조경기장" },
  { id: 4, title: "블랙핑크 인 유어 에어리어", date: "2024-06-10", venue: "고척스카이돔" },
]

export default function SellPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [selectedConcert, setSelectedConcert] = useState(null)
  const [quantity, setQuantity] = useState("1")
  const [seatInfo, setSeatInfo] = useState("")
  const [price, setPrice] = useState("")
  const [ticketDescription, setTicketDescription] = useState("")
  const [isConsecutiveSeats, setIsConsecutiveSeats] = useState(false)

  useEffect(() => {
    if (searchTerm.length > 0) {
      const results = concertData.filter((concert) => concert.title.toLowerCase().includes(searchTerm.toLowerCase()))
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [searchTerm])

  const handleConcertSelect = (concert) => {
    setSelectedConcert(concert)
    setSearchTerm("")
    setSearchResults([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // 여기에 판매 등록 로직을 구현합니다.
    console.log("판매 등록:", {
      concert: selectedConcert,
      quantity,
      seatInfo,
      price,
      ticketDescription,
      isConsecutiveSeats,
    })
    // 실제로는 API 호출 등의 로직이 들어갑니다.
    // API 호출 성공 후 리다이렉트
    router.push("/sell/success")
  }

  const isFormValid = selectedConcert && seatInfo && price && ticketDescription

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>홈으로 돌아가기</span>
          </Link>
          <h1 className="text-3xl font-bold mt-4">티켓 판매하기</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  공연 검색 <span className="text-red-500">(필수)</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="공연 제목을 입력하세요"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                {searchResults.length > 0 && (
                  <ul className="mt-2 border rounded-md shadow-sm">
                    {searchResults.map((concert) => (
                      <li
                        key={concert.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleConcertSelect(concert)}
                      >
                        {concert.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {selectedConcert && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      공연 제목 <span className="text-red-500">(필수)</span>
                    </label>
                    <Input type="text" value={selectedConcert.title} readOnly />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      공연 날짜 <span className="text-red-500">(필수)</span>
                    </label>
                    <Input type="text" value={selectedConcert.date} readOnly />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      공연장 <span className="text-red-500">(필수)</span>
                    </label>
                    <Input type="text" value={selectedConcert.venue} readOnly />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  좌석 정보 <span className="text-red-500">(필수)</span>
                </label>
                <Input
                  type="text"
                  placeholder="좌석 구역, 열, 번호를 입력해주세요"
                  required
                  value={seatInfo}
                  onChange={(e) => setSeatInfo(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  티켓 상세설명 <span className="text-red-500">(필수)</span>
                </label>
                <Textarea
                  placeholder="티켓에 대한 상세한 설명을 입력해주세요"
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  한장당 판매가격 <span className="text-red-500">(필수)</span>
                </label>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Select value={quantity} onValueChange={setQuantity}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="전체 수량" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1장</SelectItem>
                        <SelectItem value="2">2장</SelectItem>
                        <SelectItem value="3">3장</SelectItem>
                        <SelectItem value="4">4장</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="판매 가격을 입력해주세요"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                      <span className="text-gray-500">원</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="consecutive-seats"
                      checked={isConsecutiveSeats}
                      onCheckedChange={setIsConsecutiveSeats}
                    />
                    <label htmlFor="consecutive-seats" className="text-sm text-gray-600">
                      연속된 좌석입니다.
                    </label>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">동록 상품 기준</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">최저가</p>
                        <p className="font-medium">-</p>
                      </div>
                      <div>
                        <p className="text-gray-500">평균가</p>
                        <p className="font-medium">-</p>
                      </div>
                      <div>
                        <p className="text-gray-500">매수 당 가격</p>
                        <p className="font-medium">-</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  티켓 사진 <span className="text-gray-500">(선택)</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>티켓 사진 업로드</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                      </label>
                      <p className="pl-1">또는 드래그 앤 드롭</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white transition-colors"
                disabled={!isFormValid}
              >
                판매 등록하기
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

