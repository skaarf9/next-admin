import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';



// 用户分页查询
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const email = searchParams.get('email');
    const name = searchParams.get('name');

    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (email) where.email = { contains: email };
    if (name) where.name = { contains: name };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
          roles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      data: users.map(user => ({
        ...user,
        roles: user.roles.map(r => r.role)
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

// 创建新用户
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // 密码加密
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword
      }
    });
    
    // 不返回密码
    const { password, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error) {
    return NextResponse.json(
      { error: '创建用户失败' },
      { status: 400 }
    );
  }
}