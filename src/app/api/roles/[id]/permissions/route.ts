import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: '未认证' }, { status: 401 });
    }

    const roleId = parseInt((await params).id);
    
    // 获取角色下的权限
    const roleWithPermissions = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          select: {
            id: true,
            code: true,
          }
        }
      }
    });

    if (!roleWithPermissions) {
      return NextResponse.json({ error: '角色未找到' }, { status: 404 });
    }

    // 格式化返回数据
    const formatted = roleWithPermissions.permissions.map(p => ({
      id: p.id,
      permission: {
        id: p.id,
        code: p.code,
      }
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('获取角色权限失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: '未认证' }, { status: 401 });
    }

    const roleId = parseInt((await params).id);
    const { permissionId } = await req.json();
    
    // 添加权限到角色
    const created = await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          connect: { id: permissionId }
        }
      }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('添加权限到角色失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

