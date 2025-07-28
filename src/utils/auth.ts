import { jwtDecode } from "jwt-decode";

export async function getUserIdFromHeaders(headers: Headers): Promise<string> {
  // 在实际应用中，这里应该验证 JWT 或 session
  const userId = headers.get('x-user-id') || 'system';
  return userId;
}

export async function getUserId(): Promise<string | undefined> {
  const token = getTokenFromCookie()
  if (!token) return undefined;

  // 解析token获取用户id
  let userId: number | undefined;
  try {
    const payload: any = jwtDecode(token);
    userId = payload.userId;
  } catch {
    userId = undefined;
  }
  if (!userId) return;
  return userId.toString();
}

const getTokenFromCookie = (): string | null => {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token') {
        return decodeURIComponent(value);
      }
    }
    return null;
  };