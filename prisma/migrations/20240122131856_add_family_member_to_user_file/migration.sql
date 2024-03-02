/*
  Warnings:

  - You are about to drop the column `UserFamilMemberId` on the `UserFile` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserFile" DROP CONSTRAINT "UserFile_UserFamilMemberId_fkey";

-- AlterTable
ALTER TABLE "UserFile" DROP COLUMN "UserFamilMemberId",
ADD COLUMN     "UserFamilyMemberId" UUID;

-- AddForeignKey
ALTER TABLE "UserFile" ADD CONSTRAINT "UserFile_UserFamilyMemberId_fkey" FOREIGN KEY ("UserFamilyMemberId") REFERENCES "UserFamilyMember"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
