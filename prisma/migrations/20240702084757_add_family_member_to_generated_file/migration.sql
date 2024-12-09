-- AlterTable
ALTER TABLE "GeneratedFile" ADD COLUMN     "FamilyMemberId" UUID;

-- AddForeignKey
ALTER TABLE "GeneratedFile" ADD CONSTRAINT "GeneratedFile_FamilyMemberId_fkey" FOREIGN KEY ("FamilyMemberId") REFERENCES "UserFamilyMember"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
