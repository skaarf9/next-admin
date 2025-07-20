import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string, pdfId: string } }) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: '未认证' }, { status: 401 });
    }

    const p = await params
    const roleId = parseInt(p.id);
    const pdfId = parseInt(p.pdfId);
    
    // 从角色移除权限
    await prisma.rolePDFPermission.delete({
      where: {
        roleId_productPDFId: {
          roleId,
          productPDFId: pdfId
        }
      }
    });

    return NextResponse.json(
      { message: 'pdf权限删除成功' },
      { status: 200 }
    );
  } catch (error) {
    console.error('从角色移除权限失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}