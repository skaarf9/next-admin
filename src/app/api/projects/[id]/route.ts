// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("开始处理项目详情请求");

    const user = await verifyToken();
    console.log("用户验证结果:", user);

    if (!user) {
      return NextResponse.json({ error: "未认证" }, { status: 401 });
    }

    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: '无效的项目ID' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        regions: true,
        _count: {
          select: { regions: true }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    const projectWithRegionCount = {
      ...project,
      regionCount: project._count.regions
    };

    console.log("项目详情查询成功:", projectId);
    return NextResponse.json(projectWithRegionCount);

  } catch (error) {
    console.error('获取项目详情失败:', error);
    // @ts-ignore
    return NextResponse.json({
      error: '获取项目详情失败',
      message: error.message
    }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: '未认证' }, { status: 401 });
    }

    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: '无效的项目ID' }, { status: 400 });
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

    // 简化权限检查，管理员或项目经理可以修改
    if (!isAdmin) {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (project?.manager !== user.username) {
        return NextResponse.json({ error: '无修改权限' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { name, description, status, manager } = body;

    if (!name || !manager) {
      return NextResponse.json({
        error: '参数错误',
        message: '项目名称和项目经理不能为空'
      }, { status: 400 });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name,
        description: description || null,
        status,
        manager
      }
    });

    console.log('项目更新成功:', updatedProject);
    return NextResponse.json(updatedProject);

  } catch (error) {
    console.error('更新项目失败:', error);
    // @ts-ignore
    return NextResponse.json({
      error: '更新项目失败',
      message: error.message
    }, { status: 500 });
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

    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: '无效的项目ID' }, { status: 400 });
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

    // 检查是否有关联的区域
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        _count: {
          select: { regions: true }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    if (project._count.regions > 0) {
      return NextResponse.json({
        error: '删除失败',
        message: '该项目下还有区域，无法删除'
      }, { status: 400 });
    }

    await prisma.project.delete({
      where: { id: projectId }
    });

    console.log('项目删除成功:', projectId);
    return NextResponse.json({ message: '项目删除成功' });

  } catch (error) {
    console.error('删除项目失败:', error);
    return NextResponse.json({
      error: '删除项目失败',
      message: error.message
    }, { status: 500 });
  }
}
