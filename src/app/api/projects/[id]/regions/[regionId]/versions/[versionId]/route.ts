// app/api/projects/[id]/regions/[regionId]/versions/[versionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 获取单个版本
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; regionId: string; versionId: string } }
) {
  try {
    const versionId = parseInt(params.versionId);

    const version = await prisma.version.findUnique({
      where: { id: versionId },
      include: {
        region: {
          select: { id: true, name: true }
        }
      }
    });

    if (!version) {
      return NextResponse.json({ error: '版本不存在' }, { status: 404 });
    }

    return NextResponse.json(version);
  } catch (error) {
    return NextResponse.json({ error: '获取版本详情失败' }, { status: 500 });
  }
}

// 更新版本
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; regionId: string; versionId: string } }
) {
  try {
    const versionId = parseInt(params.versionId);
    const body = await request.json();

    const version = await prisma.version.update({
      where: { id: versionId },
      data: {
        version: body.version,
        description: body.description,
        status: body.status,
        creator: body.creator,
        fileSize: body.fileSize,
        fileUrl: body.fileUrl
      }
    });

    return NextResponse.json(version);
  } catch (error) {
    return NextResponse.json({ error: '更新版本失败' }, { status: 500 });
  }
}

// 删除版本
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; regionId: string; versionId: string } }
) {
  try {
    const versionId = parseInt(params.versionId);

    await prisma.version.delete({
      where: { id: versionId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '删除版本失败' }, { status: 500 });
  }
}

// 更新下载计数
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; regionId: string; versionId: string } }
) {
  try {
    const versionId = parseInt(params.versionId);

    const version = await prisma.version.update({
      where: { id: versionId },
      data: { downloadCount: { increment: 1 } }
    });

    return NextResponse.json(version);
  } catch (error) {
    return NextResponse.json({ error: '更新下载计数失败' }, { status: 500 });
  }
}
