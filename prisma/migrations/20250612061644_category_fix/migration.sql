/*
  Warnings:

  - You are about to drop the `_ProductCategory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `categoryId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_ProductCategory" DROP CONSTRAINT "_ProductCategory_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProductCategory" DROP CONSTRAINT "_ProductCategory_B_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "categoryId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_ProductCategory";

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
