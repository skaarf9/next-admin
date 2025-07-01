import { PrismaClient } from '@prisma/client';
import CryptoJS from 'crypto-js';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';

const prisma = new PrismaClient();
const SECRET = process.env.DATA_ENCRYPT_SECRET || 'default_secret';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export async function POST(req: Request) {
  try {
    const { payload } = await req.json();
    const decrypted = CryptoJS.AES.decrypt(payload, SECRET).toString(CryptoJS.enc.Utf8);
    const { email, password } = JSON.parse(decrypted);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: { include: { permissions: true } } } } },
    });
    if (!user) return Response.json({ error: '用户不存在' }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return Response.json({ error: '密码错误' }, { status: 401 });

    // 组装角色和所有权限
    const userRoles = user.roles.map((ur: any) => ur.role.name);
    // 合并所有角色的权限
    const permissions = [
      ...new Set(
        user.roles.flatMap((ur: any) =>
          ur.role.permissions.map((perm: any) => perm.code)
        )
      ),
    ];

    const jwt = await new SignJWT({
      userId: user.id,
      email: user.email,
      roles: userRoles,
      permissions, // 直接写入所有权限
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(JWT_SECRET));

    // 返回 token
    return Response.json({ token: jwt });
  } catch (e) {
    return Response.json({ error: '请求格式错误' }, { status: 400 });
  }
}
