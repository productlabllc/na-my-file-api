-- AlterTable
ALTER TABLE "User" ADD COLUMN     "DeletedAt" DATE;

-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN     "Description" TEXT,
ALTER COLUMN "Name" DROP NOT NULL;

-- CreateTable
CREATE TABLE "UserWorkflow" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "UserId" UUID,
    "WorkflowId" UUID,
    "CreatedAt" DATE,
    "LastModifiedAt" DATE,

    CONSTRAINT "UserWorkflow_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserWorkflow" ADD CONSTRAINT "UserWorkflow_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserWorkflow" ADD CONSTRAINT "UserWorkflow_WorkflowId_fkey" FOREIGN KEY ("WorkflowId") REFERENCES "Workflow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
