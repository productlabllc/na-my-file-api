-- AlterTable
ALTER TABLE "UserFile" ADD COLUMN     "ParentUserFileId" UUID;

-- AddForeignKey
ALTER TABLE "UserFile" ADD CONSTRAINT "UserFile_ParentUserFileId_fkey" FOREIGN KEY ("ParentUserFileId") REFERENCES "UserFile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
