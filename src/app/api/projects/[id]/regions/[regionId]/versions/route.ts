// app/api/projects/[id]/regions/[regionId]/versions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 获取区域下的版本列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; regionId: string } }
) {
  try {
    const regionId = parseInt(params.regionId);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = { regionId };
    if (status) where.status = status;

    const [versions, total] = await Promise.all([
      prisma.version.findMany({
        where,
        include: {
          region: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.version.count({ where })
    ]);

    return NextResponse.json({ data: versions, total });
  } catch (error) {
    return NextResponse.json({ error: '获取版本列表失败' }, { status: 500 });
  }
}

// 创建版本
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; regionId: string } }
) {
  try {
    const regionId = parseInt(params.regionId);
    const body = await request.json();

    const version = await prisma.version.create({
      data: {
        regionId,
        version: body.version,
        description: body.description,
        status: body.status,
        creator: body.creator,
        fileSize: body.fileSize,
        fileUrl: body.fileUrl
      },
      include: {
        region: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '创建版本失败' }, { status: 500 });
  }
}
