import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromHeaders } from '@/utils/auth';
import { contextStorage } from '@/lib/context';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const pricing = await prisma.productPricing.findUnique({
      where: { id: Number(id) },
    });

    if (!pricing) {
      return NextResponse.json(
        { message: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Error fetching product pricing:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = (await params);
  const userId = await getUserIdFromHeaders(req.headers);
  
  try {
    const data = await req.json();
    
    return contextStorage.run({ userId }, async () => {
      const updated = await prisma.productPricing.update({
        where: { id: Number(id) },
        data: {
          ...data,
        },
      });
      return NextResponse.json(updated);
    })
    
  } catch (error) {
    console.error('Error updating product pricing:', error);
    return NextResponse.json(
      { message: 'Bad request' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const userId = await getUserIdFromHeaders(req.headers);
  try {
    return contextStorage.run({ userId }, async () => {
      const deleted = await prisma.productPricing.delete({
        where: { id: Number(id) },
      });  

      return NextResponse.json(deleted);
    })
  } catch (error) {
    console.error('Error deleting product pricing:', error);
    return NextResponse.json(
      { message: 'Bad request' },
      { status: 400 }
    );
  }
}