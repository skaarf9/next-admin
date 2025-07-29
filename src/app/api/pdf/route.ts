import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: '未认证' }, { status: 401 });
    }

    // 提取用户有权限访问的PDF ID列表
    const allowedPdfIds = user.pdfPermissions.map(p => p.pdfId);
    
    console.log(user)
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const name = searchParams.get('name') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const skip = (page - 1) * limit;

    const where: any = {}
    // 构建查询条件
    if(!user?.roles?.includes('admin')){
      where.id = { in: allowedPdfIds }
    }
    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive'
      };
    }
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else if (startDate) {
      where.createdAt = {
        gte: new Date(startDate)
      };
    } else if (endDate) {
      where.createdAt = {
        lte: new Date(endDate)
      };
    }

    // 获取PDF总数
    const total = await prisma.productPDF.count({ where });

    // 获取PDF列表
    const pdfs = await prisma.productPDF.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({
      data: pdfs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error('获取PDF列表失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: '未认证' }, { status: 401 });
    }

    const body = await req.json();
    
    // 验证输入数据
    if (!body.name || !body.pdfUrl) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 });
    }

    // 创建新PDF
    const newPdf = await prisma.productPDF.create({
      data: {
        name: body.name,
        pdfUrl: body.pdfUrl,
        pageCount: parseInt(body.pageCount) || 0,
        discountFactor: parseFloat(body.discountFactor) || 1.0,
      }
    });

    return NextResponse.json(newPdf, { status: 201 });
  } catch (error) {
    console.error('创建PDF失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}