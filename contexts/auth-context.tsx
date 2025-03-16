"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { toast } from "sonner"

type User = {
  id: number
  email: string
  name: string
  role?: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 페이지 로드 시 로컬 스토리지에서 사용자 정보 가져오기
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  // 로그인 함수
  const login = async (email: string, password: string) => {
    try {
      // 상대 경로 사용으로 포트 변경에 영향 받지 않음
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // 쿠키를 포함시키기 위해 필요
      });

      // 응답이 JSON이 아닐 경우 처리
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("JSON 파싱 오류:", jsonError);
        return {
          success: false, 
          message: "서버 응답을 처리할 수 없습니다."
        };
      }

      if (!response.ok) {
        return {
          success: false,
          message: data?.error || "로그인 중 오류가 발생했습니다.",
        };
      }

      // 로그인 성공
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || "사용자",
        role: data.user.role,
      };

      // 로컬 스토리지에 사용자 정보 저장
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", data.token); // 토큰 저장
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "로그인 중 오류가 발생했습니다.",
      };
    }
  }

  // 로그아웃 함수
  const logout = async () => {
    try {
      // 토큰 가져오기
      const token = localStorage.getItem("token");
      
      // 개발 환경에서는 토큰 검증 없이 로컬 로그아웃 진행
      const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
      
      if (token && !isDevelopment) {
        // 백엔드에 로그아웃 요청 보내기 (프로덕션 환경에서만)
        try {
          await fetch("/api/auth/logout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            credentials: "include", // 쿠키를 포함시키기 위해 필요
          });
        } catch (fetchError) {
          console.error("로그아웃 API 호출 중 오류:", fetchError);
          // 오류가 발생해도 로컬 로그아웃은 진행
        }
      }

      // 로컬 스토리지에서 사용자 정보 및 토큰 제거
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
      toast.success("로그아웃 되었습니다.");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("로그아웃 중 오류가 발생했습니다.");
    }
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

// 커스텀 훅으로 AuthContext 사용하기 쉽게 만들기
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

