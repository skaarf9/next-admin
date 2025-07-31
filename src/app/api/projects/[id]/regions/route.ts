import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
console.log('🔥 route.ts 文件已加载 - regions');
const prisma = new PrismaClient();

// 获取区域列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 修改这一行：await params
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const searchName = searchParams.get('searchName') || '';

    const where = {
      projectId,
      ...(searchName && {
        name: {
          contains: searchName,
          mode: 'insensitive' as const
        }
      })
    };

    const [regions, total] = await Promise.all([
      prisma.region.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.region.count({ where })
    ]);

    return NextResponse.json({
      data: regions,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page
    });
  } catch (error) {
    return NextResponse.json({ error: '获取区域列表失败' }, { status: 500 });
  }
}

// 创建区域
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const resolvedParams = await params;
  const projectId = parseInt(resolvedParams.id);
  console.log('POST regions API 被调用, projectId:', projectId);
  try {
    const body = await request.json();
    console.log(body)
    const region = await prisma.region.create({
      data: {
        projectId,
        name: body.name,
        description: body.description,
        status: body.status || 'PENDING',
        manager: body.manager
      }
    });

    return NextResponse.json(region);
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: '创建区域失败' }, { status: 500 });
  }
}
