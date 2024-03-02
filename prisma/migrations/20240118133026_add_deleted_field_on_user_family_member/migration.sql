/*
  Warnings:

  - Added the required column `DeletedAt` to the `UserFamilyMember` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserFamilyMember" ADD COLUMN     "DeletedAt" DATE NOT NULL;
