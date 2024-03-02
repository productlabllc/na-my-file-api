-- AlterTable
ALTER TABLE "UserWorkflow" ADD COLUMN     "DeletedAt" DATE;

-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN     "DeletedAt" DATE;

-- AlterTable
ALTER TABLE "WorkflowStage" ADD COLUMN     "DeletedAt" DATE;

-- AlterTable
ALTER TABLE "WorkflowStageCriterion" ADD COLUMN     "DeletedAt" DATE;
