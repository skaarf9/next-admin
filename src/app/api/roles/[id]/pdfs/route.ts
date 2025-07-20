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
    
    // 获取角色下的PDF权限
    const permissions = await prisma.rolePDFPermission.findMany({
      where: {
        roleId: roleId
      },
      select: {
        id: true,
        canEdit: true,
        productPDF: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // 格式化返回数据
    const formatted = permissions.map(p => ({
      id: p.id,
      pdfId: p.productPDF.id,
      pdfName: p.productPDF.name,
      canEdit: p.canEdit
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('获取角色PDF权限失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: '未认证' }, { status: 401 });
    }

    const roleId = parseInt((await params).id);
    const { pdfId, canEdit } = await req.json();
    
    // 更新或创建PDF权限
    const permission = await prisma.rolePDFPermission.upsert({
      where: {
        roleId_productPDFId: {
          roleId: roleId,
          productPDFId: pdfId
        }
      },
      update: {
        canEdit: canEdit
      },
      create: {
        roleId: roleId,
        productPDFId: pdfId,
        canEdit: canEdit
      }
    });

    return NextResponse.json(permission);
  } catch (error) {
    console.error('更新PDF权限失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}