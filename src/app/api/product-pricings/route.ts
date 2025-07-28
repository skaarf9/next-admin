import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromHeaders } from '@/utils/auth';
import { contextStorage } from '@/lib/context';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  try {
    const total = await prisma.productPricing.count();
    const data = await prisma.productPricing.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching product pricings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromHeaders(req.headers);
    const data = await req.json();
    

    return contextStorage.run({ userId }, async () => {
      const created = await prisma.productPricing.create({
        data: {
          ...data,
        },
      });

      return NextResponse.json(created, { status: 201 });
    })
  } catch (error) {
    console.error('Error creating product pricing:', error);
    return NextResponse.json(
      { message: 'Bad request' },
      { status: 400 }
    );
  }
}