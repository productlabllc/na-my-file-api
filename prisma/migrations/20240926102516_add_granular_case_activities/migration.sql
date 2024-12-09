-- AlterTable
ALTER TABLE "CaseActivityLog" ADD COLUMN     "ActivityForClientUserId" UUID,
ADD COLUMN     "ActivityForFamilyMemberId" UUID;

-- AddForeignKey
ALTER TABLE "CaseActivityLog" ADD CONSTRAINT "CaseActivityLog_ActivityForClientUserId_fkey" FOREIGN KEY ("ActivityForClientUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CaseActivityLog" ADD CONSTRAINT "CaseActivityLog_ActivityForFamilyMemberId_fkey" FOREIGN KEY ("ActivityForFamilyMemberId") REFERENCES "UserFamilyMember"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
