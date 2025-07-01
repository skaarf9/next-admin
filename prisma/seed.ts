import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 创建权限
  const dashboardPermission = await prisma.permission.create({
    data: { code: "/" }
  });

  // 创建管理员角色（不分配具体权限，后续代码逻辑里 admin 跳过权限校验）
  const adminRole = await prisma.role.create({
    data: { name: "admin" }
  });

  // 创建普通用户角色，只赋予 / 路由权限
  const userRole = await prisma.role.create({
    data: {
      name: "user",
      permissions: { connect: [{ id: dashboardPermission.id }] }
    }
  });

  // 加密密码
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  // 创建管理员账号
  await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: adminPassword,
      name: "管理员",
      roles: {
        create: [{ roleId: adminRole.id }]
      }
    }
  });

  // 创建普通用户账号
  await prisma.user.create({
    data: {
      email: "user@example.com",
      password: userPassword,
      name: "普通用户",
      roles: {
        create: [{ roleId: userRole.id }]
      }
    }
  });
}

main()
  .then(() => {
    console.log('Seed finished.');
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect();
  });