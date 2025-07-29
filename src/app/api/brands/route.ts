import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    console.log("开始处理品牌请求");

    const user = await verifyToken();
    console.log("用户验证结果:", user);

    if (!user) {
      return NextResponse.json({ error: "未认证" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    console.log("查询参数:", { page, limit, skip });

    // 先简化查询，不做权限检查
    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.brand.count(),
    ]);

    console.log("查询结果:", { brandsCount: brands.length, total });

    return NextResponse.json({
      data: brands,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("详细错误信息:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('开始创建品牌');

    const user = await verifyToken();
    console.log('用户验证:', user);

    if (!user) {
      return NextResponse.json({ error: '未认证' }, { status: 401 });
    }

    const body = await req.json();
    console.log('请求数据:', body);

    // 简化创建逻辑，先不做权限检查
    const newBrand = await prisma.brand.create({
      data: {
        name: body.name,
        country: body.country || '',
        discount: parseInt(body.discount) || 0,
        contact: body.contact || ''
      }
    });

    console.log('创建成功:', newBrand);
    return NextResponse.json(newBrand, { status: 201 });

  } catch (error) {
    console.error('创建品牌详细错误:', error);
    return NextResponse.json({
      error: '创建失败',
      message: error.message,
      details: error
    }, { status: 500 });
  }
}

