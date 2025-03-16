"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function EditProfilePage() {
  const [userData, setUserData] = useState({
    name: "홍길동",
    email: "hong@example.com",
    phoneNumber: "010-1234-5678",
    address: "서울특별시 강남구",
    bankName: "", // 은행명 추가
    accountNumber: "", // 계좌번호 추가
    accountHolder: "", // 예금주명 추가
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUserData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert("프로필이 성공적으로 수정되었습니다.")
    console.log("수정된 프로필:", userData)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <Link href="/mypage" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>마이페이지로 돌아가기</span>
          </Link>
          <h1 className="text-3xl font-bold mt-4">프로필 수정</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <Input id="name" name="name" type="text" value={userData.name} onChange={handleChange} required />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <Input id="email" name="email" type="email" value={userData.email} onChange={handleChange} required />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                휴대폰번호
              </label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={userData.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                주소
              </label>
              <Input
                id="address"
                name="address"
                type="text"
                value={userData.address}
                onChange={handleChange}
                required
              />
            </div>

            {/* 계좌 정보 섹션 추가 */}
            <div className="pt-4 border-t mt-6">
              <h3 className="text-lg font-medium text-gray-700 mb-4">계좌 정보</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                    은행명
                  </label>
                  <Input
                    id="bankName"
                    name="bankName"
                    type="text"
                    value={userData.bankName}
                    onChange={handleChange}
                    placeholder="예: 신한은행, 국민은행"
                  />
                </div>

                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    계좌번호
                  </label>
                  <Input
                    id="accountNumber"
                    name="accountNumber"
                    type="text"
                    value={userData.accountNumber}
                    onChange={handleChange}
                    placeholder="'-' 없이 입력해주세요"
                  />
                </div>

                <div>
                  <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-700 mb-1">
                    예금주명
                  </label>
                  <Input
                    id="accountHolder"
                    name="accountHolder"
                    type="text"
                    value={userData.accountHolder}
                    onChange={handleChange}
                    placeholder="예금주명을 입력해주세요"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-[#0061FF] hover:bg-[#0052D6] text-white">
              변경사항 저장
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}

