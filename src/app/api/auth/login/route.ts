import CryptoJS from 'crypto-js';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';
import prisma from '@/lib/prisma';

const SECRET = process.env.DATA_ENCRYPT_SECRET || 'default_secret';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export async function POST(req: Request) {
  try {
    const { payload } = await req.json();
    const decrypted = CryptoJS.AES.decrypt(payload, SECRET).toString(CryptoJS.enc.Utf8);
    const { email, password } = JSON.parse(decrypted);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        roles: { 
          include: { 
            role: { 
              include: { 
                permissions: true,
                // 添加PDF权限的关联查询
                pdfs: {
                  include: {
                    productPDF: true
                  }
                }
              } 
            } 
          } 
        } 
      },
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

    // 提取PDF权限
    const pdfPermissions: Record<number, boolean> = {};
    
    user.roles.forEach((ur: any) => {
      ur.role.pdfs.forEach((pdfPerm: any) => {
        const pdfId = pdfPerm.productPDFId;
        // 如果同一个PDF有多个权限，保留最高权限（canEdit为true则覆盖false）
        if (!pdfPermissions[pdfId] || pdfPerm.canEdit) {
          pdfPermissions[pdfId] = pdfPerm.canEdit;
        }
      });
    });
    
    // 转换为数组格式
    const pdfPermissionsArray = Object.entries(pdfPermissions).map(([pdfId, canEdit]) => ({
      pdfId: Number(pdfId),
      canEdit
    }));

    const jwt = await new SignJWT({
      userId: user.id,
      email: user.email,
      roles: userRoles,
      permissions, // 功能权限
      pdfPermissions: pdfPermissionsArray // PDF权限
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(JWT_SECRET));

    // 返回 token
    return Response.json({ token: jwt });
  } catch (e) {
    console.error('登录错误:', e);
    return Response.json({ error: '请求格式错误' }, { status: 400 });
  }
}