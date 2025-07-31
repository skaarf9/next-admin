// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    console.log("开始处理项目列表请求");

    const user = await verifyToken();
    console.log("用户验证结果:", user);

    if (!user) {
      return NextResponse.json({ error: "未认证" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const searchName = searchParams.get("searchName") || "";
    const skip = (page - 1) * pageSize;

    console.log("查询参数:", { page, pageSize, skip, searchName });

    const where = searchName ? {
      name: {
        contains: searchName,
        mode: 'insensitive' as const
      }
    } : {};

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          _count: {
            select: { regions: true }
          }
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.project.count({ where })
    ]);

    const projectsWithRegionCount = projects.map(project => ({
      ...project,
      regionCount: project._count.regions
    }));

    console.log("查询结果:", { projectsCount: projects.length, total });

    return NextResponse.json({
      data: projectsWithRegionCount,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error("获取项目列表详细错误:", error);
    // @ts-ignore
    return NextResponse.json({
      error: '获取项目列表失败',
      message: error.message
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('开始创建项目');

    const user = await verifyToken();
    console.log('用户验证:', user);

    if (!user) {
      return NextResponse.json({ error: '未认证' }, { status: 401 });
    }

    const body = await req.json();
    console.log('请求数据:', body);

    const { name, description, status, manager } = body;

    if (!name || !manager) {
      return NextResponse.json({
        error: '参数错误',
        message: '项目名称和项目经理不能为空'
      }, { status: 400 });
    }

    const newProject = await prisma.project.create({
      data: {
        name,
        description: description || null,
        status: status || 'PENDING',
        manager
      }
    });

    console.log('创建成功:', newProject);
    return NextResponse.json(newProject, { status: 201 });

  } catch (error) {
    console.error('创建项目详细错误:', error);
    // @ts-ignore
    return NextResponse.json({
      error: '创建失败',
      message: error.message,
      details: error
    }, { status: 500 });
  }
}
