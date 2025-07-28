-- CreateTable
CREATE TABLE "product_pricing" (
    "id" SERIAL NOT NULL,
    "item_code" VARCHAR(50) NOT NULL,
    "item_code_base" VARCHAR(50) NOT NULL,
    "category" VARCHAR(50),
    "sub_category" VARCHAR(100),
    "reference_image_url" TEXT,
    "location" TEXT,
    "brand" VARCHAR(100),
    "product_name" TEXT,
    "material_description" TEXT,
    "material_image_url" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "comments" TEXT,
    "internal_note" TEXT,
    "list_price_eur" DECIMAL(12,2),
    "list_price_usd" DECIMAL(12,2),
    "list_price_rmb" DECIMAL(12,2),
    "list_price_gbp" DECIMAL(12,2),
    "supplier_discount" DECIMAL(5,3),
    "cost_local_currency" DECIMAL(12,2),
    "exchange_rate" DECIMAL(10,4),
    "target_gp" DECIMAL(5,3),
    "usd_budget_1" DECIMAL(12,2),
    "kerry_price" DECIMAL(12,2),
    "unit_budget" DECIMAL(12,2),
    "total_budget" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "spare_text_1" TEXT,
    "spare_text_2" TEXT,
    "spare_text_3" TEXT,
    "spare_text_4" TEXT,
    "spare_text_5" TEXT,
    "spare_numeric_1" DECIMAL(12,2),
    "spare_numeric_2" DECIMAL(12,2),
    "spare_numeric_3" DECIMAL(12,2),
    "spare_numeric_4" DECIMAL(12,2),
    "spare_boolean" BOOLEAN DEFAULT false,

    CONSTRAINT "product_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_pricing_item_code_idx" ON "product_pricing"("item_code");

-- CreateIndex
CREATE INDEX "product_pricing_item_code_base_idx" ON "product_pricing"("item_code_base");

-- CreateIndex
CREATE INDEX "product_pricing_category_idx" ON "product_pricing"("category");

-- CreateIndex
CREATE INDEX "product_pricing_brand_idx" ON "product_pricing"("brand");
