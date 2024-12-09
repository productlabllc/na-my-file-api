-- AlterTable
ALTER TABLE "CaseFile" ADD COLUMN     "CreatedByAgentUserId" UUID;

-- AlterTable
ALTER TABLE "GeneratedFile" ADD COLUMN     "CreatedByAgentUserId" UUID,
ADD COLUMN     "CreatedByUserId" UUID;

-- AddForeignKey
ALTER TABLE "CaseFile" ADD CONSTRAINT "CaseFile_CreatedByAgentUserId_fkey" FOREIGN KEY ("CreatedByAgentUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "GeneratedFile" ADD CONSTRAINT "GeneratedFile_CreatedByUserId_fkey" FOREIGN KEY ("CreatedByUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "GeneratedFile" ADD CONSTRAINT "GeneratedFile_CreatedByAgentUserId_fkey" FOREIGN KEY ("CreatedByAgentUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
