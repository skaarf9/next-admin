import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const WHITE_LIST = [
  '/auth/sign-in',
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

  const { roles = [], permissions = [] } = await getUserInfoFromToken(token);

  // 管理员直接放行
  if (roles.includes("admin")) return NextResponse.next();

  // 权限校验
  const hasPermission = permissions.some((code: string) =>
    pathname.startsWith(code)
  );
  if (!hasPermission) {
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 排除 _next、static、favicon.ico、所有根目录下的静态文件（如 .png、.jpg、.svg、.css、.js 等）
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|css|js|ico|webp|gif|woff|woff2|ttf|eot|mp4|mp3)$).*)",
  ],
};

export async function getUserInfoFromToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    return {
      roles: payload.roles as string[] || [],
      permissions: payload.permissions as string[] || [],
    };
  } catch {
    return { roles: [], permissions: [] };
  }
}