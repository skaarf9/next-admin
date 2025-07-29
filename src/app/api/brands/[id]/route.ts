import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: '未认证' }, { status: 401 });
    }

    const brandId = parseInt(params.id);
    if (isNaN(brandId)) {
      return NextResponse.json({ error: '无效的品牌ID' }, { status: 400 });
    }

    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id as number },
      include: {
        roles: {
          include: {
            role: {
              include: {
                brands: true
              }
            }
          }
        }
      }
    });

    const isAdmin = userWithRoles?.roles?.some(ur => ur.role.name === 'admin') || false;

    // 检查权限
    const hasPermission = isAdmin || userWithRoles?.roles?.some(ur =>
      ur.role.brands?.some(bp => bp.brandId === brandId)
    );

    if (!hasPermission) {
      return NextResponse.json({ error: '无修改权限' }, { status: 403 });
    }

    const body = await req.json();

    const updatedBrand = await prisma.brand.update({
      where: { id: brandId },
      data: {
        name: body.name,
        country: body.country,
        discount: parseInt(body.discount) || 0,
        contact: body.contact || null
      }
    });

    return NextResponse.json(updatedBrand);
  } catch (error) {
    console.error('更新品牌失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: '未认证' }, { status: 401 });
    }

    const brandId = parseInt(params.id);
    if (isNaN(brandId)) {
      return NextResponse.json({ error: '无效的品牌ID' }, { status: 400 });
    }

    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id as number },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    const isAdmin = userWithRoles?.roles?.some(ur => ur.role.name === 'admin') || false;
    if (!isAdmin) {
      return NextResponse.json({ error: '无删除权限' }, { status: 403 });
    }

    await prisma.brand.delete({
      where: { id: brandId }
    });

    return NextResponse.json({ message: '品牌删除成功' });
  } catch (error) {
    console.error('删除品牌失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
