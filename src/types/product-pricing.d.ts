import { ProductPricing, ProductPricingHistory } from '@prisma/client';

export type ProductPricingInput = Omit<
  ProductPricing, 
  'id' | 'createdAt' | 'updatedAt'
>;

export type ProductPricingHistoryWithUser = ProductPricingHistory & {
  changedByUser?: { name: string; email: string }; // 可扩展用户信息
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};