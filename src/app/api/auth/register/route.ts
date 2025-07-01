import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import CryptoJS from 'crypto-js';

const prisma = new PrismaClient();
const SECRET = process.env.DATA_ENCRYPT_SECRET || 'default_secret';

export async function POST(req: Request) {
  try {
    const { payload } = await req.json();
    // 解密前端加密的数据
    const decrypted = CryptoJS.AES.decrypt(payload, SECRET).toString(CryptoJS.enc.Utf8);
    const { email, password, name } = JSON.parse(decrypted);

    // 检查用户是否已存在
    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) {
      return Response.json({ error: '用户已存在' }, { status: 409 });
    }
    // 加密密码
    const hash = await bcrypt.hash(password, 10);
    // 默认分配 user 角色
    const userRole = await prisma.role.findUnique({ where: { name: 'user' } });
    if (!userRole) {
      return Response.json({ error: '默认角色不存在' }, { status: 500 });
    }
    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        name,
        roles: { create: [{ roleId: userRole.id }] },
      },
      include: { roles: { include: { role: true } } },
    });
    return Response.json({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map((r: any) => r.role.name),
    });
  } catch (e) {
    return Response.json({ error: '请求格式错误' }, { status: 400 });
  }
}
