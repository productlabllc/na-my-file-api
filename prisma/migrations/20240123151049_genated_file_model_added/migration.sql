/*
  Warnings:

  - You are about to drop the column `NumberOfPages` on the `UserFile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserFile" DROP COLUMN "NumberOfPages",
ADD COLUMN     "GeneratedFileId" UUID,
ADD COLUMN     "PageNumber" INTEGER;

-- CreateTable
CREATE TABLE "GeneratedFile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "CreatedAt" DATE,
    "DeletedAt" DATE,
    "LastUpdate" DATE,
    "OriginalFileName" TEXT,
    "ContentType" TEXT,
    "SizeInBytes" INTEGER,
    "Title" TEXT,
    "Status" TEXT,

    CONSTRAINT "GeneratedFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserFile" ADD CONSTRAINT "UserFile_GeneratedFileId_fkey" FOREIGN KEY ("GeneratedFileId") REFERENCES "GeneratedFile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
