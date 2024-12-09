import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { CreateUserFileRequestSchema, CreateUserFileResponseSchema } from '../../lib/route-schemas/user-file.schema';
import { CreateUserFileRequest } from '../../lib/route-interfaces';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { getDB } from '../../lib/db';
import { getPresignedUploadUrl } from '../../lib/s3';
import { EnvironmentVariablesEnum } from '../../lib/environment';
import {
  CAN_ADD_CASE_FILE_WORKFLOW_ROLES,
  CASE_FILE_STATUS,
  CASE_STATUS,
  CLIENT,
  S3Prefix,
  USER_FILE_STATUS,
} from '../../lib/constants';
import { logActivity, triggerCaseCriterionCalculation, triggerPdfGeneration } from '../../lib/sqs';
import { ActivityLogMessageType, ActivityLogType } from '../../lib/types-and-interfaces';
import { Case, UserFamilyMember } from '@prisma/client';

export const routeSchema: RouteSchema = {
  requestBody: CreateUserFileRequestSchema,
  responseBody: CreateUserFileResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const body: CreateUserFileRequest = input.body;

  try {
    const db = getDB();
    const jwt: CognitoJwtType = input.routeData.jwt;

    const user = await getUserByEmail(jwt?.email);

    const userId = body.ForUserId ?? user.id;

    const familyMemberId = body.UserFamilyMemberId;

    let familyMember: UserFamilyMember | null = {} as UserFamilyMember;

    const agentUserId = body.ForUserId && body.ForUserId !== user.id ? user.id : null;

    const caseCriterionId = body.CaseCriterionId;

    /**
     * If Agent User exists, let's make sure the have the right permission to operate on the case
     * and create a file on the behalf of the user.
     */

    if (agentUserId) {
      const overallCase = await db.case.findFirst({
        where: {
          AND: [
            {
              CaseCriteria: {
                some: {
                  id: caseCriterionId,
                },
              },
            },
            { DeletedAt: null },
            {
              CaseTeamAssignments: {
                some: {
                  UserId: agentUserId,
                  CaseRole: {
                    in: CAN_ADD_CASE_FILE_WORKFLOW_ROLES,
                  },
                },
              },
            },
          ],
        },
      });

      if (!overallCase) {
        throw new CustomError(JSON.stringify({ message: 'User does not have permission to perform this task' }), 400);
      }
    }

    // check if family member exists
    if (familyMemberId) {
      familyMember = await db.userFamilyMember.findFirst({
        where: {
          id: familyMemberId,
          UserId: userId,
          DeletedAt: null,
        },
      });

      if (!familyMember) {
        throw new CustomError(JSON.stringify({ message: `Family member ${familyMemberId} not found` }), 400);
      }
    }

    const userFile = await db.$transaction(async db => {
      /**
       * Link newly created files to case file
       */
      let caseItem: Case | null = null;
      if (caseCriterionId) {
        caseItem = await db.case.findFirst({
          where: {
            DeletedAt: null,
            CaseCriteria: {
              some: {
                id: caseCriterionId,
              },
            },
          },
        });

        if (!caseItem) {
          throw new CustomError(
            JSON.stringify({ message: `Case for criterion id: ${caseCriterionId} does not exists`, caseCriterionId }),
            400,
          );
        }
      }

      // create generated file
      const generatedFile = body.GeneratedFileId
        ? await db.generatedFile.update({
            where: {
              id: body.GeneratedFileId,
              DeletedAt: null,
            },
            data: {
              ...(body.Title ? { Title: body.Title } : {}),
              ...(body.Description ? { Description: body.Description } : {}),
              ...(body.Files[0]?.OriginalFilename ? { OriginalFilename: body.Files[0].OriginalFilename } : {}),
              ...(body.FileType ? { FileType: body.FileType } : {}),
              ...(body.UserFamilyMemberId ? { FamilyMemberId: body.UserFamilyMemberId } : {}),
            },
            include: {
              UserFamilyMember: {
                where: {
                  DeletedAt: null,
                },
              },
              FromUserFiles: {
                where: {
                  DeletedAt: null,
                },
                include: {
                  User: {
                    where: {
                      DeletedAt: null,
                    },
                  },
                },
              },
              CaseFiles: {
                where: {
                  DeletedAt: null,
                },
                include: {
                  Case: {
                    where: {
                      DeletedAt: null,
                    },
                    include: {
                      CaseTeamAssignments: {
                        where: {
                          CaseRole: CLIENT,
                          DeletedAt: null,
                        },
                        include: {
                          User: {
                            where: {
                              DeletedAt: null,
                            },
                          },
                        },
                      },
                    },
                  },
                  CaseCriterion: {
                    where: {
                      DeletedAt: null,
                    },
                  },
                  GeneratedFile: {
                    where: {
                      DeletedAt: null,
                    },
                    include: {
                      UserFamilyMember: {
                        where: {
                          DeletedAt: null,
                        },
                      },
                    },
                  },
                },
              },
            },
          })
        : await db.generatedFile.create({
            data: {
              Title: body.Title,
              Status: USER_FILE_STATUS.DRAFT,
              OriginalFilename: body.Files[0].OriginalFilename,
              FileType: body.FileType,
              CreatedByUserId: userId,
              Description: body.Description,
              ...(body.UserFamilyMemberId ? { FamilyMemberId: body.UserFamilyMemberId } : {}),
              ...(agentUserId ? { CreatedByAgentUserId: agentUserId } : {}),
              ...(caseCriterionId
                ? {
                    CaseFiles: {
                      create: {
                        CaseId: caseItem?.id,
                        CaseCriterionId: caseCriterionId,
                        CreatedByAgentUserId: agentUserId,
                        Status: CASE_FILE_STATUS.PENDING,
                      },
                    },
                  }
                : {}),
            },
            include: {
              UserFamilyMember: {
                where: {
                  DeletedAt: null,
                },
              },
              FromUserFiles: {
                where: {
                  DeletedAt: null,
                },
                include: {
                  User: {
                    where: {
                      DeletedAt: null,
                    },
                  },
                },
              },
              CaseFiles: {
                where: {
                  DeletedAt: null,
                },
                include: {
                  Case: {
                    where: {
                      DeletedAt: null,
                    },
                    include: {
                      CaseTeamAssignments: {
                        where: {
                          CaseRole: CLIENT,
                          DeletedAt: null,
                        },
                        include: {
                          User: {
                            where: {
                              DeletedAt: null,
                            },
                          },
                        },
                      },
                    },
                  },
                  CaseCriterion: {
                    where: {
                      DeletedAt: null,
                    },
                  },
                  GeneratedFile: {
                    where: {
                      DeletedAt: null,
                    },
                    include: {
                      UserFamilyMember: {
                        where: {
                          DeletedAt: null,
                        },
                      },
                    },
                  },
                },
              },
            },
          });

      if (body.DeletedFiles && body.DeletedFiles.length > 0) {
        await db.uploadedMediaAssetVersion.softDeleteMany({
          where: {
            UserFileId: {
              in: body.DeletedFiles,
            },
          },
        });
        await db.userFile.softDeleteMany({
          where: {
            id: {
              in: body.DeletedFiles,
            },
          },
        });
      }

      const oldToNewIdMap: Record<string, string> = {};

      const userFiles = await Promise.all(
        body.Files.map(async (fileItem, index: number) => {
          // create user file
          const file = await db.userFile.create({
            data: {
              ...(body.UserFamilyMemberId ? { UserFamilyMemberId: body.UserFamilyMemberId } : {}),
              Title: `${body.Title} - page ${index + 1}`,
              OwnerUserId: userId,
              Description: body.Description,
              FileType: body.FileType,
              PageNumber: index + 1,
              Status: USER_FILE_STATUS.DRAFT,
              ContentType: fileItem.ContentType,
              ...(generatedFile?.id ? { GeneratedFileId: generatedFile.id } : {}),
              OriginalFilename: fileItem.OriginalFilename,
            },
            include: {
              GeneratedFile: {
                include: {
                  CaseFiles: {
                    include: {
                      Case: true,
                      CaseCriterion: true,
                      GeneratedFile: true,
                    },
                  },
                },
              },
            },
          });

          oldToNewIdMap[fileItem.id] = file.id;

          // create upload version
          const uploadVersion = await db.uploadedMediaAssetVersion.create({
            data: {
              UserFileId: file.id,
              CreatedByUserId: userId,
              ContentType: fileItem.ContentType,
              SizeInBytes: fileItem.SizeInBytes,
              OriginalFilename: fileItem.OriginalFilename,
            },
            select: {
              id: true,
              UserFileId: true,
              ContentType: true,
              SizeInBytes: true,
              OriginalFilename: true,
              CreatedByUserId: true,
              CreatedAt: true,
              LastModifiedAt: true,
            },
          });

          // append upload version to user file

          const filePath = `${S3Prefix.USER_FILES}${userId}/${file.id}/${uploadVersion.id}/${fileItem.OriginalFilename}`;
          await db.userFile.update({
            where: {
              id: file.id,
            },
            data: {
              ActiveVersionId: uploadVersion.id,
              FilePath: filePath,
            },
          });

          const uploadUrl = await getPresignedUploadUrl(
            process.env[EnvironmentVariablesEnum.CLIENT_FILE_BUCKET_NAME]!,
            filePath,
          );

          return {
            ...file,
            UploadedMediaAssetVersions: [uploadVersion],
            UploadUrl: uploadUrl,
            oldId: fileItem.id,
          };
        }),
      );

      // Update Family member in user files if different

      if (
        body.GeneratedFileId &&
        body.UserFamilyMemberId &&
        userFiles?.[0]?.UserFamilyMemberId !== body.UserFamilyMemberId
      ) {
        await db.userFile.updateMany({
          where: {
            GeneratedFileId: body.GeneratedFileId,
          },
          data: {
            UserFamilyMemberId: body.UserFamilyMemberId,
          },
        });

        userFiles.forEach(ele => {
          ele.UserFamilyMemberId = body.UserFamilyMemberId!;
        });
      }

      // Fix files order
      if ((body.FilesOrder?.length ?? 0) > 0 && body.GeneratedFileId) {
        const currentUserFiles = await db.userFile.findMany({
          where: {
            GeneratedFileId: body.GeneratedFileId,
            DeletedAt: null,
          },
        });

        if (body.FilesOrder?.length === currentUserFiles.length) {
          await Promise.all(
            body.FilesOrder.map(async (order, index) => {
              const id = order.old ? order.id : oldToNewIdMap[order.id];

              const userFile = await db.userFile.findFirst({ where: { id } });

              if (userFile) {
                await db.userFile.update({
                  where: {
                    id: id,
                    DeletedAt: null,
                  },
                  data: {
                    PageNumber: index + 1,
                    Title: `${userFile.Title?.split('- page')[0]} - page ${index + 1}`,
                  },
                });
              } else {
                throw new Error(`Corresponding UserFile for old? ${order.old} id: ${id} does not exists`);
              }
            }),
          );
        } else {
          throw new Error('Files Order size does not match number of files generated');
        }
      }

      // manually trigger pdf generation incase no new files were added
      if (body.GeneratedFileId && body.Files.length === 0) {
        await triggerPdfGeneration(body.GeneratedFileId);
      }

      return {
        UserFiles: userFiles,
        GeneratedFile: generatedFile,
      };
    });

    if (body.GeneratedFileId) {
      const cases = await db.case.findMany({
        where: {
          CaseFiles: {
            some: {
              GeneratedFileId: body.GeneratedFileId,
            },
          },
        },
      });

      await Promise.all(cases.map(ele => triggerCaseCriterionCalculation({ caseId: ele.id })));
    }

    // Attempt log Resubmit case file
    if (body.GeneratedFileId && !agentUserId) {
      const rejectedGeneratedCaseFiles = await db.caseFile.findMany({
        where: {
          GeneratedFileId: body.GeneratedFileId,
          Status: CASE_FILE_STATUS.REJECT,
          Case: {
            Status: CASE_STATUS.OPEN,
          },
        },
        include: {
          CaseCriterion: true,
          GeneratedFile: {
            include: {
              UserFamilyMember: true,
            },
          },
          Case: {
            include: {
              CaseTeamAssignments: {
                where: {
                  CaseRole: CLIENT,
                },
              },
            },
          },
        },
      });

      if (rejectedGeneratedCaseFiles.length) {
        for (const rejectedGeneratedCaseFile of rejectedGeneratedCaseFiles) {
          let activityType: ActivityLogType = 'CLIENT_RESUBMIT_CASE_FILES_SELF';
          const familyMember = rejectedGeneratedCaseFile.GeneratedFile?.FamilyMemberId;
          if (familyMember) {
            activityType = 'CLIENT_RESUBMIT_CASE_FILES_FAMILY_MEMBER';
          }
          const activityData: ActivityLogMessageType = {
            activityType,
            activityValue: JSON.stringify({
              newValue: { ...rejectedGeneratedCaseFile, Case: null },
              case: rejectedGeneratedCaseFile.Case,
            }),
            userId: user.id,
            timestamp: new Date(),
            metadataJson: JSON.stringify({ request: input }),
            activityCategory: 'case',
            caseFilIds: [rejectedGeneratedCaseFile.id],
            familyMemberIds: familyMember ? [familyMember] : [],
          };

          await logActivity(activityData);
        }
      }
    }

    let logType: ActivityLogType = 'CLIENT_UPLOAD_DOCUMENT_SELF';

    if (agentUserId) {
      if (body.GeneratedFileId && !body.UserFamilyMemberId) {
        logType = 'AGENT_UPDATE_DOCUMENT_FAMILY_MEMBER';
      } else if (body.GeneratedFileId) {
        logType = 'AGENT_UPDATE_DOCUMENT_CLIENT';
      } else if (body.UserFamilyMemberId) {
        logType = 'AGENT_UPLOAD_DOCUMENT_FAMILY_MEMBER';
      } else {
        logType = 'AGENT_UPLOAD_DOCUMENT_CLIENT';
      }
    } else {
      if (body.UserFamilyMemberId && body.GeneratedFileId) {
        logType = 'CLIENT_UPDATE_DOCUMENT_FAMILY_MEMBER';
      } else if (body.UserFamilyMemberId && !body.GeneratedFileId) {
        logType = 'CLIENT_UPLOAD_DOCUMENT_FAMILY_MEMBER';
      } else if (body.GeneratedFileId && !body.UserFamilyMemberId) {
        logType = 'CLIENT_UPDATE_DOCUMENT_SELF';
      }
    }

    const client = userFile.GeneratedFile.FromUserFiles[0]?.User;

    await logActivity({
      activityType: logType,
      activityValue: JSON.stringify({ newValue: body, familyMember, client }),
      userId: user.id,
      familyMemberIds: familyMember?.id ? [familyMember.id] : [],
      timestamp: new Date(),
      metadataJson: JSON.stringify({ request: input }),
      activityRelatedEntityId: userFile.GeneratedFile?.id,
      activityRelatedEntity: 'USER_FILE',
    });

    if (caseCriterionId && !body.GeneratedFileId) {
      const hasPreviousCaseFiles = await db.caseFile.findMany({
        where: {
          CaseCriterionId: caseCriterionId,
          ...(body.UserFamilyMemberId
            ? {
                GeneratedFile: {
                  FamilyMemberId: body.UserFamilyMemberId,
                },
              }
            : {}),
          DeletedAt: {
            not: null,
          },
        },
      });
      const hasRejectedCaseFiles = hasPreviousCaseFiles.find(cf => cf.Status === CASE_FILE_STATUS.REJECT);

      if (body.UserFamilyMemberId) {
        if (hasPreviousCaseFiles.length) {
          if (hasRejectedCaseFiles) {
            logType = 'AGENT_RESUBMIT_CASE_FILES_FAMILY_MEMBER';
          } else {
            logType = 'AGENT_UPDATE_CASE_FILE_FAMILY_MEMBER';
          }
        } else {
          logType = 'AGENT_ADD_CASE_FILES_FAMILY_MEMBER';
        }
      } else {
        if (hasPreviousCaseFiles.length) {
          if (hasRejectedCaseFiles) logType = 'AGENT_RESUBMIT_CASE_FILES_CLIENT';
        } else {
          logType = 'AGENT_ADD_CASE_FILE_CLIENT';
        }
      }

      const caseFiles = userFile.GeneratedFile.CaseFiles;

      const activityData: ActivityLogMessageType = {
        activityType: logType,
        activityValue: JSON.stringify({
          newValue: caseFiles,
          case: caseFiles[0].Case!,
          familyMember,
        }),
        userId: user.id,
        caseFilIds: caseFiles.map(cf => cf.id),
        timestamp: new Date(),
        metadataJson: JSON.stringify({ request: input }),
        activityRelatedEntityId: caseFiles?.[0]?.CaseId!,
        activityRelatedEntity: 'CASE_FILE',
      };

      await logActivity({ ...activityData, activityCategory: 'case' });
    }

    return userFile;
  } catch (error: any) {
    console.warn('error: is: ', error);
    throw new CustomError(error._message || JSON.stringify(error), error._httpStatusCode || 500);
  }
};

const routeModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
