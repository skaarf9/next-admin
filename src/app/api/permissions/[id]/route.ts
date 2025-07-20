import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// 根据ID查询权限
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的权限ID' },
        { status: 400 }
      );
    }

    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        roles: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!permission) {
      return NextResponse.json(
        { error: '权限不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(permission);
  } catch (error) {
    return NextResponse.json(
      { error: '获取权限详情失败' },
      { status: 500 }
    );
  }
}

// 更新权限
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的权限ID' },
        { status: 400 }
      );
    }

    const { code } = await req.json();
    
    // 检查新编码是否已被其他权限使用
    const existingPermission = await prisma.permission.findFirst({
      where: {
        code,
        NOT: { id }
      }
    });
    
    if (existingPermission) {
      return NextResponse.json(
        { error: '权限编码已被其他权限使用' },
        { status: 400 }
      );
    }

    const updatedPermission = await prisma.permission.update({
      where: { id },
      data: { code }
    });

    return NextResponse.json(updatedPermission);
  } catch (error) {
    return NextResponse.json(
      { error: '更新权限失败' },
      { status: 400 }
    );
  }
}

// 删除权限
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的权限ID' },
        { status: 400 }
      );
    }

    // 检查权限是否存在
    const permission = await prisma.permission.findUnique({
      where: { id }
    });

    if (!permission) {
      return NextResponse.json(
        { error: '权限不存在' },
        { status: 404 }
      );
    }

    // 删除权限（Prisma会自动处理关联的角色权限关系）
    await prisma.permission.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: '权限删除成功' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: '删除权限失败' },
      { status: 500 }
    );
  }
}