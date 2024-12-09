import { SQSEvent } from 'aws-lambda';
import { getDB } from '../lib/db';
import { CASE_CRITERION_FULFILLMENT_STATUS, CLIENT, RuleSets } from '../lib/constants';

export const handler = async (event: SQSEvent, context: any) => {
  const db = getDB();

  console.log('event', event);
  console.log('context', context);

  for (const record of event.Records) {
    const data = JSON.parse(record.body) as { caseCriterionId?: string; caseId: string };

    const getAge = (birthDate: Date) => Math.floor((Date.now() - new Date(birthDate).getTime()) / 3.15576e10);

    const checkFulfillment = async (caseCriterionId: string) => {
      const caseCriterion = await db.caseCriterion.findFirst({
        where: { id: caseCriterionId },
        include: {
          Case: {
            include: {
              CaseFiles: {
                where: {
                  CaseCriterionId: caseCriterionId,
                },
                include: {
                  GeneratedFile: {
                    include: {
                      UserFamilyMember: true,
                      FromUserFiles: {
                        include: {
                          UserFamilyMember: true,
                        },
                      },
                    },
                  },
                },
              },
              CaseTeamAssignments: {
                where: {
                  CaseRole: CLIENT,
                },
                include: {
                  User: {
                    include: {
                      UserFamilyMembers: true,
                    },
                  },
                },
              },
              CaseApplicants: {
                include: {
                  UserFamilyMember: true,
                },
              },
            },
          },
        },
      });

      const caseCriterionRuleSets = JSON.parse((caseCriterion?.RuleSets as string) ?? '{}') as RuleSets[];

      const thisUser = caseCriterion?.Case?.CaseTeamAssignments[0]?.User;

      const familyMembers = caseCriterion?.Case?.CaseApplicants.map(ele => ele.UserFamilyMember);

      /**
       * Doing this because FamilyMember and User types does not overlap
       */
      familyMembers?.push({
        id: thisUser?.id ?? '',
        DOB: thisUser?.DOB ?? new Date(),
        FirstName: thisUser?.FirstName ?? '',
        LastName: thisUser?.LastName ?? '',
        CreatedAt: thisUser?.CreatedAt ?? null,
        UserId: thisUser?.id ?? '',
        DeletedAt: null,
        LastModifiedAt: null,
        Relationship: 'parent',
      });

      const familyMemberFieldMatch = {
        age: 'DOB',
      } as const;

      const familyMemberOpsMatch = {
        age: getAge,
      } as const;

      const fulfills = caseCriterionRuleSets.every(caseCriterionRuleSet => {
        const concernedUsers =
          caseCriterionRuleSet.when.operant === 'all'
            ? familyMembers
            : familyMembers?.filter(
                familyMember =>
                  familyMember &&
                  eval(`
            ${familyMemberOpsMatch[caseCriterionRuleSet.when.field](
              familyMember[familyMemberFieldMatch[caseCriterionRuleSet.when.field]],
            )} ${caseCriterionRuleSet.when.operant} ${caseCriterionRuleSet.when.value}`),
              );

        const fulfillsInner = concernedUsers?.every(async user => {
          const generatedFiles = caseCriterion?.Case?.CaseFiles.filter(
            caseFile => caseFile.GeneratedFile?.FromUserFiles?.[0]?.UserFamilyMember?.id === user?.id,
          )?.map(ele => ele.GeneratedFile);

          const fieldMap = {
            fileType: 'FileType',
          } as const;

          const operantMap = {
            in: 'some',
            all: 'every',
          } as const;

          return caseCriterionRuleSet.value[operantMap[caseCriterionRuleSet.operant]](type =>
            generatedFiles
              ?.map(generatedFile => generatedFile?.[fieldMap[caseCriterionRuleSet.field]])
              .includes(type.name),
          );
        });

        return fulfillsInner;
      });

      await db.caseCriterion.update({
        where: {
          id: caseCriterionId,
        },
        data: {
          CriterionFulfillmentStatus: fulfills
            ? CASE_CRITERION_FULFILLMENT_STATUS.DONE
            : CASE_CRITERION_FULFILLMENT_STATUS.PENDING,
        },
      });
    };

    if (data.caseCriterionId) {
      return await checkFulfillment(data.caseCriterionId);
    } else {
      const caseCriteria = (
        await db.case.findFirst({
          where: {
            id: data.caseId,
          },
          include: {
            CaseCriteria: true,
          },
        })
      )?.CaseCriteria;

      if (caseCriteria?.length) {
        await Promise.all(caseCriteria.map(caseCriterion => checkFulfillment(caseCriterion.id)));
      }
    }
  }
};
