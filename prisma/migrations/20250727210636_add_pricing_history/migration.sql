-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "product_pricing_history" (
    "id" SERIAL NOT NULL,
    "product_pricing_id" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_type" "ChangeType" NOT NULL,
    "changed_by" VARCHAR(255),
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
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
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

    CONSTRAINT "product_pricing_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_pricing_history_product_pricing_id_idx" ON "product_pricing_history"("product_pricing_id");

-- CreateIndex
CREATE INDEX "product_pricing_history_item_code_idx" ON "product_pricing_history"("item_code");

-- CreateIndex
CREATE INDEX "product_pricing_history_changed_at_idx" ON "product_pricing_history"("changed_at");

-- CreateIndex
CREATE INDEX "product_pricing_history_change_type_idx" ON "product_pricing_history"("change_type");

-- AddForeignKey
ALTER TABLE "product_pricing_history" ADD CONSTRAINT "product_pricing_history_product_pricing_id_fkey" FOREIGN KEY ("product_pricing_id") REFERENCES "product_pricing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
