-- AlterTable
ALTER TABLE "CaseFile" ADD COLUMN     "CaseCriterionId" UUID;

-- AddForeignKey
ALTER TABLE "CaseFile" ADD CONSTRAINT "CaseFile_CaseCriterionId_fkey" FOREIGN KEY ("CaseCriterionId") REFERENCES "CaseCriterion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
