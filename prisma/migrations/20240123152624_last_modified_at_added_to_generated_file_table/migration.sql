/*
  Warnings:

  - You are about to drop the column `LastUpdate` on the `GeneratedFile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GeneratedFile" DROP COLUMN "LastUpdate",
ADD COLUMN     "LastModifiedAt" DATE;
