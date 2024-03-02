-- AlterTable
ALTER TABLE "User" ADD COLUMN     "LanguageId" UUID;

-- CreateTable
CREATE TABLE "Language" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "Name" TEXT NOT NULL,
    "Code" TEXT NOT NULL,
    "CreatedAt" DATE,
    "LastModifiedAt" DATE,
    "DeletedAt" DATE,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_LanguageId_fkey" FOREIGN KEY ("LanguageId") REFERENCES "Language"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
