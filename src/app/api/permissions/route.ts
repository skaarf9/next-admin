import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';


// 权限分页查询
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const code = searchParams.get('code');

    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (code) where.code = { contains: code };

    const [permissions, total] = await Promise.all([
      prisma.permission.findMany({
        where,
        skip,
        take: limit,
        include: {
          roles: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.permission.count({ where })
    ]);

    return NextResponse.json({
      data: permissions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: '获取权限列表失败' },
      { status: 500 }
    );
  }
}

// 创建新权限
export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    
    // 检查权限编码是否已存在
    const existingPermission = await prisma.permission.findUnique({
      where: { code }
    });
    
    if (existingPermission) {
      return NextResponse.json(
        { error: '权限编码已存在' },
        { status: 400 }
      );
    }

    const permission = await prisma.permission.create({
      data: { code }
    });

    return NextResponse.json(permission);
  } catch (error) {
    return NextResponse.json(
      { error: '创建权限失败' },
      { status: 400 }
    );
  }
}