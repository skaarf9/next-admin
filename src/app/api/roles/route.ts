import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: '未认证' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const name = searchParams.get('name') || '';
    
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    
    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive'
      };
    }

    // 获取角色总数
    const total = await prisma.role.count({ where });

    // 获取角色列表
    const roles = await prisma.role.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({
      data: roles,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error('获取角色失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: '未认证' }, { status: 401 });
    }

    const body = await req.json();
    
    // 验证输入数据
    if (!body.name) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 });
    }

    // 创建新角色
    const newRole = await prisma.role.create({
      data: {
        name: body.name,
      }
    });

    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    console.error('创建角色失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}