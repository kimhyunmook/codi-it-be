/*
  Warnings:

  - A unique constraint covering the columns `[id,orderId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Payment_id_orderId_key" ON "Payment"("id", "orderId");
