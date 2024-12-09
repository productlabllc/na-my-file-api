/*
  Warnings:

  - The `FileUploadedAt` column on the `UserFile` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "UserFile" DROP COLUMN "FileUploadedAt",
ADD COLUMN     "FileUploadedAt" TIMESTAMP(3);
