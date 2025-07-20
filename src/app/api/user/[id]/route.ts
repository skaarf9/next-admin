import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const p = await params;
    const userId = parseInt(p.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: true,
                pdfs: {
                  include: {
                    productPDF: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roles = user.roles.map((ur) => ur.role.name);
    const permissions = new Set<string>();
    const pdfPermissions: {
      pdfId: number;
      pdfName: string;
      pdfUrl: string;
      canEdit: boolean;
    }[] = [];

    for (const userRole of user.roles) {
      for (const perm of userRole.role.permissions) {
        permissions.add(perm.code);
      }

      for (const pdfPerm of userRole.role.pdfs) {
        pdfPermissions.push({
          pdfId: pdfPerm.productPDF.id,
          pdfName: pdfPerm.productPDF.name,
          pdfUrl: pdfPerm.productPDF.pdfUrl,
          canEdit: pdfPerm.canEdit,
        });
      }
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      bio: user.bio,
      roles,
      permissions: Array.from(permissions),
      pdfPermissions,
    });
  } catch (e) {
    console.error("Failed to fetch user info:", e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const p = await params;
    const userId = parseInt(p.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // 解析请求体
    const requestBody = await req.json();
    const { name, phone, avatar, bio, roles } = requestBody;

    // 验证必要字段 - 只检查实际存在的用户字段
    const hasUserFields = name || phone || avatar || bio;
    if (!hasUserFields && !roles) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }

    // 开始事务处理
    const result = await prisma.$transaction(async (tx) => {
      // 1. 更新用户基本信息（仅更新实际存在的字段）
      const updateData: Record<string, any> = {};
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (bio !== undefined) updateData.bio = bio;

      // 只更新提供的字段
      const updatedUser = Object.keys(updateData).length > 0
        ? await tx.user.update({
            where: { id: userId },
            data: updateData
          })
        : await tx.user.findUnique({ where: { id: userId } });

      if (!updatedUser) {
        throw new Error('User not found');
      }

      // 2. 处理角色更新（如果提供了 roles 字段）
      if (roles && Array.isArray(roles)) {
        // 提取角色名称（兼容对象数组和字符串数组）
        const roleNames = roles.map(role => 
          typeof role === 'object' && role.name ? role.name : role
        );

        // 查找新角色ID
        const roleRecords = await tx.role.findMany({
          where: { name: { in: roleNames } },
          select: { id: true, name: true }
        });

        // 检查所有角色是否有效
        const validRoleNames = roleRecords.map(r => r.name);
        const invalidRoles = roleNames.filter(name => !validRoleNames.includes(name));
        
        if (invalidRoles.length > 0) {
          throw new Error(`Invalid role names: ${invalidRoles.join(', ')}`);
        }

        // 删除现有角色关联
        await tx.userRole.deleteMany({
          where: { userId }
        });

        // 创建新的角色关联
        await tx.userRole.createMany({
          data: roleRecords.map(role => ({
            userId,
            roleId: role.id
          })),
          skipDuplicates: true
        });
      }

      return updatedUser;
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        phone: result.phone,
        avatar: result.avatar,
        bio: result.bio
      }
    });
  } catch (e: any) {
    console.error("Failed to update user:", e);
    
    if (e.message.startsWith('Invalid role names')) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Server error', 
      details: e.message 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const p = await params;
  const userId = parseInt(p.id);

  try {
    // 先删除与该用户关联的所有UserRole记录
    await prisma.userRole.deleteMany({
      where: { userId: userId }
    });

    // 然后删除用户
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json(
      { message: '用户删除成功' },
      { status: 200 }
    );
  } catch (error) {
    console.error('删除用户时出错:', error);
    return NextResponse.json(
      { error: '删除用户失败，请检查服务器日志' },
      { status: 500 }
    );
  }
}