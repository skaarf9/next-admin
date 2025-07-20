import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function verifyToken() {
  const cookie = await cookies();
  const token = cookie.get('token')?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your_jwt_secret');
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('JWT验证失败:', error);
    return null;
  }
}