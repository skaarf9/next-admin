// types/prisma.d.ts
import { Prisma } from '@prisma/client';

// 定义上下文类型
export type PrismaContext = {
  userId?: string;
};

// 扩展 Prisma 客户端类型
declare module '@prisma/client' {
  // 为每个模型的操作添加上下文支持
  interface PrismaClient {
    $extends: any; // 避免 $extends 的类型错误
  }

  // 为每个操作添加上下文参数
  namespace Prisma {
    interface MiddlewareParams {
      context?: PrismaContext;
    }

    // 为特定模型的操作添加上下文支持
    interface ProductPricingCreateArgs {
      context?: PrismaContext;
    }
    
    interface ProductPricingUpdateArgs {
      context?: PrismaContext;
    }
    
    interface ProductPricingDeleteArgs {
      context?: PrismaContext;
    }
    
    // 为所有模型添加通用支持
    interface Args<T, F extends Operation> {
      context?: PrismaContext;
    }
    
    // 为事务操作添加支持
    interface PrismaPromise<T> {
      context?: PrismaContext;
    }
  }
}