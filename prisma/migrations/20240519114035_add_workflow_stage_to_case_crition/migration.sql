-- AlterTable
ALTER TABLE "CaseCriterion" ADD COLUMN     "WorkflowStageId" UUID;

-- AddForeignKey
ALTER TABLE "CaseCriterion" ADD CONSTRAINT "CaseCriterion_WorkflowStageId_fkey" FOREIGN KEY ("WorkflowStageId") REFERENCES "WorkflowStage"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
