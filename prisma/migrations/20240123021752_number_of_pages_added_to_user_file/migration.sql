/*
  Warnings:

  - You are about to drop the column `NumberOfFiles` on the `UserFile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserFile" DROP COLUMN "NumberOfFiles",
ADD COLUMN     "NumberOfPages" INTEGER;
