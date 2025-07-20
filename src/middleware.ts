import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, errors } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const WHITE_LIST = [
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/register',
  '/api',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (WHITE_LIST.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  if (!token) {
    const loginUrl = new URL('/auth/sign-in', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 直接验证 token 并获取 payload
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    
    // 从 payload 中提取角色和权限
    const roles = payload.roles as string[] || [];
    const permissions = payload.permissions as string[] || [];

    // 管理员直接放行
    if (roles.includes("admin")) return NextResponse.next();

    // 权限校验
    const hasPermission = permissions.some((code: string) => {
      // 特殊处理首页权限
      if (code === '/') return pathname === '/';
      return pathname.startsWith(code);
    });

    if (!hasPermission) {
      return NextResponse.rewrite(new URL('/404', request.url));
    }

  } catch (error) {
    console.error("Token验证失败:", error);
    
    // 创建重定向响应
    const loginUrl = new URL('/auth/sign-in', request.url);
    const response = NextResponse.redirect(loginUrl);
    
    // 清除过期或无效的 token
    response.cookies.delete('token');
    
    // 添加错误消息查询参数
    if (error instanceof errors.JWTExpired) {
      loginUrl.searchParams.set('error', 'SESSION_EXPIRED');
    } else {
      loginUrl.searchParams.set('error', 'INVALID_TOKEN');
    }
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|css|js|ico|webp|gif|woff|woff2|ttf|eot|mp4|mp3)$).*)",
  ],
};