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
    
    // 获取角色下的用户
    const users = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            roleId: roleId
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('获取角色用户失败:', error);
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
    const { userIds } = await req.json();
    
    // 添加用户到角色
    const created = await Promise.all(
      userIds.map((userId: number) => 
        prisma.userRole.create({
          data: {
            userId: userId,
            roleId: roleId
          }
        })
      )
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('添加用户到角色失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: '未认证' }, { status: 401 });
    }

    const roleId = parseInt(params.id);
    
    // 删除角色下的所有用户关联
    await prisma.userRole.deleteMany({
      where: {
        roleId: roleId
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('删除角色用户失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}