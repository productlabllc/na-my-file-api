/*
  Warnings:

  - You are about to drop the column `UserFileId` on the `CaseFile` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CaseFile" DROP CONSTRAINT "CaseFile_UserFileId_fkey";

-- AlterTable
ALTER TABLE "CaseFile" DROP COLUMN "UserFileId",
ADD COLUMN     "GeneratedFileId" UUID;

-- AddForeignKey
ALTER TABLE "CaseFile" ADD CONSTRAINT "CaseFile_GeneratedFileId_fkey" FOREIGN KEY ("GeneratedFileId") REFERENCES "GeneratedFile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
