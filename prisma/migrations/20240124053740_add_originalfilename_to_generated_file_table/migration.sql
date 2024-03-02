/*
  Warnings:

  - You are about to drop the column `OriginalFileName` on the `GeneratedFile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GeneratedFile" DROP COLUMN "OriginalFileName",
ADD COLUMN     "OriginalFilename" TEXT;
