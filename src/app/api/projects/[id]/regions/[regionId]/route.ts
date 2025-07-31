import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 获取单个区域
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; regionId: string } }
) {
  try {
    const regionId = parseInt(params.regionId);

    const region = await prisma.region.findUnique({
      where: { id: regionId },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });

    if (!region) {
      return NextResponse.json({ error: '区域不存在' }, { status: 404 });
    }

    return NextResponse.json(region);
  } catch (error) {
    return NextResponse.json({ error: '获取区域详情失败' }, { status: 500 });
  }
}

// 更新区域
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; regionId: string } }
) {
  try {
    const regionId = parseInt(params.regionId);
    const body = await request.json();

    const region = await prisma.region.update({
      where: { id: regionId },
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        manager: body.manager
      }
    });

    return NextResponse.json(region);
  } catch (error) {
    return NextResponse.json({ error: '更新区域失败' }, { status: 500 });
  }
}

// 删除区域
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; regionId: string } }
) {
  try {
    const regionId = parseInt(params.regionId);

    await prisma.region.delete({
      where: { id: regionId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '删除区域失败' }, { status: 500 });
  }
}
