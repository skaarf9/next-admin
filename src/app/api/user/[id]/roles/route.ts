import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 获取用户的角色列表
export async function GET(
  req: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const skip = (page - 1) * limit;
    
    const [roles, total] = await Promise.all([
      prisma.userRole.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          role: true
        }
      }),
      prisma.userRole.count({ where: { userId } })
    ]);
    
    return NextResponse.json({
      data: roles.map(ur => ur.role),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: '获取用户角色失败' },
      { status: 500 }
    );
  }
}

// 为用户分配角色
export async function POST(
  req: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    const { roleId } = await req.json();
    
    const userRole = await prisma.userRole.create({
      data: {
        userId,
        roleId
      }
    });
    
    return NextResponse.json(userRole);
  } catch (error) {
    return NextResponse.json(
      { error: '分配角色失败' },
      { status: 400 }
    );
  }
}

// 移除用户的角色
export async function DELETE(
  req: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    const { searchParams } = new URL(req.url);
    const roleId = parseInt(searchParams.get('roleId') || '');
    
    if (!roleId) {
      return NextResponse.json(
        { error: '缺少角色ID' },
        { status: 400 }
      );
    }
    
    await prisma.userRole.deleteMany({
      where: {
        userId,
        roleId
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: '移除角色失败' },
      { status: 500 }
    );
  }
}