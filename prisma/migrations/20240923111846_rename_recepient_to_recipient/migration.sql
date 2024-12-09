/*
  Warnings:

  - You are about to drop the column `RecepientUserId` on the `EmailNotification` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "EmailNotification" DROP CONSTRAINT "EmailNotification_RecepientUserId_fkey";

-- AlterTable
ALTER TABLE "EmailNotification" DROP COLUMN "RecepientUserId",
ADD COLUMN     "RecipientUserId" UUID;

-- AddForeignKey
ALTER TABLE "EmailNotification" ADD CONSTRAINT "EmailNotification_RecipientUserId_fkey" FOREIGN KEY ("RecipientUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
