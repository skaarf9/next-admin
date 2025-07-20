import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// 检查用户是否有权限操作PDF
async function checkPDFPermission(userId: number, pdfId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              pdfs: {
                where: {
                  productPDFId: pdfId,
                  canEdit: true
                }
              }
            }
          }
        }
      }
    }
  });

  // 检查是否是管理员
  const isAdmin = user?.roles.some(ur => ur.role.name === 'admin');
  if (isAdmin) return true;

  // 检查是否有编辑权限
  const hasPermission = user?.roles.some(ur => 
    ur.role.pdfs.some(p => p.productPDFId === pdfId && p.canEdit)
  );

  return hasPermission || false;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken();
    if (!user || !user.id) {
      return NextResponse.json({ error: '未认证' }, { status: 401 });
    }

    const p = await params;
    const pdfId = parseInt(p.id);
    const body = await req.json();

    // 验证权限
    const hasPermission = await checkPDFPermission(user.id as number, pdfId);
    if (!hasPermission) {
      return NextResponse.json({ error: '无操作权限' }, { status: 403 });
    }

    // 更新PDF
    const updatedPdf = await prisma.productPDF.update({
      where: { id: pdfId },
      data: {
        name: body.name,
        pdfUrl: body.pdfUrl,
        pageCount: parseInt(body.pageCount),
        discountFactor: parseFloat(body.discountFactor),
      },
    });

    return NextResponse.json(updatedPdf);
  } catch (error) {
    console.error('更新PDF失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken();
    if (!user || !user.id) {
      return NextResponse.json({ error: '未认证' }, { status: 401 });
    }

    const pdfId = parseInt((await params).id);

    // 验证权限
    const hasPermission = await checkPDFPermission(user.id as number, pdfId);
    if (!hasPermission) {
      return NextResponse.json({ error: '无操作权限' }, { status: 403 });
    }

    // 先删除关联的权限记录
    await prisma.rolePDFPermission.deleteMany({
      where: { productPDFId: pdfId }
    });

    // 删除PDF
    await prisma.productPDF.delete({
      where: { id: pdfId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('删除PDF失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}