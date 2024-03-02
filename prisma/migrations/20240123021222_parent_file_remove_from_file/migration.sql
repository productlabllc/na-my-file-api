/*
  Warnings:

  - You are about to drop the column `ParentUserFileId` on the `UserFile` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserFile" DROP CONSTRAINT "UserFile_ParentUserFileId_fkey";

-- AlterTable
ALTER TABLE "UserFile" DROP COLUMN "ParentUserFileId",
ADD COLUMN     "NumberOfFiles" INTEGER,
ADD COLUMN     "Status" TEXT;
