import { PrismaClient } from '@prisma/client';
import { contextStorage } from './context';

declare global {
  var prisma: PrismaClient | undefined;
}

// 定义上下文类型
type Context = {
  userId?: string;
};

const basePrisma = global.prisma || new PrismaClient();
const isInitialized = global.prisma!== undefined;
let prisma: PrismaClient;
if (!isInitialized) {
  // 创建扩展的 Prisma 客户端
  const extendedPrisma = basePrisma.$extends({
    name: "history-recorder",
    query: {
      productPricing: {
        async $allOperations({ operation, args, query }) {
          const store = contextStorage.getStore();
          const userId = store?.userId;

          // 旧数据逻辑
          let oldData = null;
          if (operation === 'update' || operation === 'delete') {
            oldData = await basePrisma.productPricing.findUniqueOrThrow({
              where: args.where
            });
          }

          const result = await query(args);

          // 记录历史
          if (operation === 'create') {
            await recordHistory(result, 'CREATE', userId);
          } else if (operation === 'update' && oldData) {
            await recordHistory(oldData, 'UPDATE', userId);
          } else if (operation === 'delete' && oldData) {
            await recordHistory(oldData, 'DELETE', userId);
          }

          return result;
        }
      }
    }
  }) as PrismaClient;
  prisma = extendedPrisma;

  // 历史记录函数
  async function recordHistory(
    data: any, 
    changeType: 'CREATE' | 'UPDATE' | 'DELETE',
    userId?: string
  ) {
    try {
      // 移除不需要的字段
      const { id, createdAt, updatedAt, ...historyData } = data;
      
      // 创建历史记录
      await basePrisma.productPricingHistory.create({
        data: {
          ...historyData,
          productPricingId: id,
          changeType,
          changedBy: userId || 'system'
        }
      });
    } catch (error) {
      console.error('记录历史失败:', error);
      // 在实际应用中，你可能想要记录这个错误
    }
  }
}else {
  prisma = basePrisma;
}

if (!isInitialized && process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;