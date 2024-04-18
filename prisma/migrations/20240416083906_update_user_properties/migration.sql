/*
  Warnings:

  - You are about to drop the column `LanguageId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_LanguageId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "LanguageId",
ADD COLUMN     "LanguageIsoCode" TEXT,
ADD COLUMN     "TOSAccepted" BOOLEAN;
