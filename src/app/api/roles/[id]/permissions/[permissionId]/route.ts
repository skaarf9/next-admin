import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string, permissionId: string } }) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: '未认证' }, { status: 401 });
    }

    const p = await params
    const roleId = parseInt(p.id);
    const permissionId = parseInt(p.permissionId);
    
    // 从角色移除权限
    await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          disconnect: { id: permissionId }
        }
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('从角色移除权限失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}