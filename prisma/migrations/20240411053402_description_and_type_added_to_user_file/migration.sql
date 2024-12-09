/*
  Warnings:

  - You are about to drop the column `Title` on the `UserFile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserFile" DROP COLUMN "Title",
ADD COLUMN     "Description" TEXT,
ADD COLUMN     "FileType" TEXT;
