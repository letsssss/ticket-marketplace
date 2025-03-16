import { compare, hash } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';

// 환경 변수에서 JWT 시크릿 키를 가져옵니다. 실제 환경에서는 .env 파일에 설정해야 합니다.
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// 사용자 비밀번호를 해싱합니다.
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

// 해싱된 비밀번호와 일반 텍스트 비밀번호를 비교합니다.
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(plainPassword, hashedPassword);
}

// JWT 액세스 토큰 생성
export function generateAccessToken(userId: number, email: string, role: string): string {
  return sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '1h' } // 1시간 후 만료
  );
}

// JWT 리프레시 토큰 생성
export function generateRefreshToken(userId: number): string {
  return sign(
    { userId },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // 7일 후 만료
  );
}

// JWT 토큰 유효성 검증
export function verifyAccessToken(token: string) {
  try {
    return verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// 리프레시 토큰 유효성 검증
export function verifyRefreshToken(token: string) {
  try {
    return verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
}

// 요청 헤더에서 인증 토큰을 가져오는 함수
export function getTokenFromHeaders(headers: Headers): string | null {
  const authHeader = headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}

// 쿠키에서 인증 토큰을 가져오는 함수
export function getTokenFromCookies(request: Request): string | null {
  const cookies = request.headers.get('cookie');
  if (!cookies) return null;
  
  const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('auth-token='));
  if (!tokenCookie) return null;
  
  return tokenCookie.split('=')[1].trim();
} 