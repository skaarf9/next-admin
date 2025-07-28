import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const p = await params
  const { id } = p;
  const { searchParams } = new URL(req.url);
  const column = searchParams.get('column');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  try {
    const whereClause = { productPricingId: Number(id) };
    
    const total = await prisma.productPricingHistory.count({
      where: whereClause,
    });

    const histories = await prisma.productPricingHistory.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { changedAt: 'desc' },
    });

    // 如果指定了列，只返回该列的历史数据
    const filteredHistories = column
      ? histories.map(history => ({
          id: history.id,
          changedAt: history.changedAt,
          changedBy: history.changedBy,
          changeType: history.changeType,
          [column]: history[column as keyof typeof history]
        }))
      : histories;

    return NextResponse.json({
      data: filteredHistories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching pricing histories:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}