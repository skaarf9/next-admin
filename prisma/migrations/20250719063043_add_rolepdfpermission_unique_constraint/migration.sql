/*
  Warnings:

  - A unique constraint covering the columns `[roleId,productPDFId]` on the table `RolePDFPermission` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RolePDFPermission_roleId_productPDFId_key" ON "RolePDFPermission"("roleId", "productPDFId");
