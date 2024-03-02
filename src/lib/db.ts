import { Prisma, PrismaClient } from '@prisma/client';

const getNewClient = () => {
  const prisma = new PrismaClient({
    datasources: { db: { url: getConnectionString() } },
    log:
      NODE_ENV === 'prod'
        ? ['error']
        : [
            {
              emit: 'event',
              level: 'query',
            },
            {
              emit: 'stdout',
              level: 'error',
            },
            {
              emit: 'stdout',
              level: 'info',
            },
            {
              emit: 'stdout',
              level: 'warn',
            },
          ],
  });

  // @ts-ignore
  prisma.$on('query', (e: any) => {
    console.log('Query: ' + e.query);
    console.log('Params: ' + e.params);
    console.log('Duration: ' + e.duration + 'ms');
  });

  return prisma.$extends({
    name: 'softDelete',
    model: {
      uploadedMediaAssetVersion: {
        async softDelete({
          where,
          select,
        }: {
          where: Prisma.UploadedMediaAssetVersionWhereUniqueInput;
          select?: Prisma.UploadedMediaAssetVersionSelect;
        }) {
          await prisma.uploadedMediaAssetVersion.update({
            where,
            select,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
        async softDeleteMany({ where }: { where: Prisma.UploadedMediaAssetVersionWhereInput }) {
          await prisma.uploadedMediaAssetVersion.updateMany({
            where,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
      },
      userFile: {
        async softDelete({
          where,
          select,
        }: {
          where: Prisma.UserFileWhereUniqueInput;
          select?: Prisma.UserFileSelect;
        }) {
          await prisma.userFile.update({
            where,
            select,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
        async softDeleteMany({ where }: { where: Prisma.UserFileWhereInput }) {
          await prisma.userFile.updateMany({
            where,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
      },
      user: {
        async softDelete({ where, select }: { where: Prisma.UserWhereUniqueInput; select?: Prisma.UserSelect }) {
          await prisma.user.update({
            where,
            select,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
        async softDeleteMany({ where }: { where: Prisma.UserWhereInput }) {
          await prisma.user.updateMany({
            where,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
      },
      userWorkflow: {
        async softDelete({
          where,
          select,
        }: {
          where: Prisma.UserWorkflowWhereUniqueInput;
          select?: Prisma.UserWorkflowSelect;
        }) {
          await prisma.userWorkflow.update({
            where,
            select,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
        async softDeleteMany({ where }: { where: Prisma.UserWorkflowWhereInput }) {
          await prisma.userWorkflow.updateMany({
            where,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
      },
      case: {
        async softDelete({ where, select }: { where: Prisma.CaseWhereUniqueInput; select?: Prisma.CaseSelect }) {
          await prisma.case.update({
            where,
            select,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
        async softDeleteMany({ where }: { where: Prisma.CaseWhereInput }) {
          await prisma.case.updateMany({
            where,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
      },
      caseApplicant: {
        async softDelete({
          where,
          select,
        }: {
          where: Prisma.CaseApplicantWhereUniqueInput;
          select?: Prisma.CaseApplicantSelect;
        }) {
          await prisma.caseApplicant.update({
            where,
            select,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
        async softDeleteMany({ where }: { where: Prisma.CaseApplicantWhereInput }) {
          await prisma.caseApplicant.updateMany({
            where,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
      },
      caseNote: {
        async softDelete({
          where,
          select,
        }: {
          where: Prisma.CaseNoteWhereUniqueInput;
          select?: Prisma.CaseNoteSelect;
        }) {
          await prisma.caseNote.update({
            where,
            select,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
        async softDeleteMany({ where }: { where: Prisma.CaseNoteWhereInput }) {
          await prisma.caseNote.updateMany({
            where,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
      },
      caseTeamAssignment: {
        async softDelete({
          where,
          select,
        }: {
          where: Prisma.CaseTeamAssignmentWhereUniqueInput;
          select?: Prisma.CaseTeamAssignmentSelect;
        }) {
          await prisma.caseTeamAssignment.update({
            where,
            select,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
        async softDeleteMany({ where }: { where: Prisma.CaseTeamAssignmentWhereInput }) {
          await prisma.caseTeamAssignment.updateMany({
            where,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
      },
      caseCriterion: {
        async softDelete({
          where,
          select,
        }: {
          where: Prisma.CaseCriterionWhereUniqueInput;
          select?: Prisma.CaseCriterionSelect;
        }) {
          await prisma.caseCriterion.update({
            where,
            select,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
        async softDeleteMany({ where }: { where: Prisma.CaseCriterionWhereInput }) {
          await prisma.caseCriterion.updateMany({
            where,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
      },
      caseFile: {
        async softDelete({
          where,
          select,
        }: {
          where: Prisma.CaseFileWhereUniqueInput;
          select?: Prisma.CaseFileSelect;
        }) {
          await prisma.caseFile.update({
            where,
            select,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
        async softDeleteMany({ where }: { where: Prisma.CaseFileWhereInput }) {
          await prisma.caseFile.updateMany({
            where,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
      },
      userFamilyMember: {
        async softDelete({
          where,
          select,
        }: {
          where: Prisma.UserFamilyMemberWhereUniqueInput;
          select?: Prisma.UserFamilyMemberSelect;
        }) {
          await prisma.userFamilyMember.update({
            where,
            select,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
        async softDeleteMany({ where }: { where: Prisma.UserFamilyMemberWhereInput }) {
          await prisma.userFamilyMember.updateMany({
            where,
            data: {
              DeletedAt: new Date(),
            },
          });
        },
      },
    },
  });
};
let db: ReturnType<typeof getNewClient>;
const { DB_CREDS, NODE_ENV = 'dev' } = process.env;

export const getConnectionString = () => {
  if (!DB_CREDS) {
    throw new Error('DB_CREDS environment variable must be set.');
  }
  const { username, password, host, port, dbname } = JSON.parse(DB_CREDS);
  const connectionString = `postgresql://${username}:${password}@${host}:${port}/${dbname}`;
  return connectionString;
};

export const getDB = () => {
  if (db) {
    return db;
  }
  try {
    db = getNewClient();
  } catch (err) {
    throw err;
    // db = new PrismaClient({
    //   // log: ['query', 'info', 'warn', 'error'],
    // });
  }

  return db;
};

// const addExtensions = (prisma: PrismaClient) => {
//   prisma.$extends({
//     result: {
//       dailyClaims: {

// postgresql://postgres:LiAaS4cr4Ltp__0e.VpnaryMW0gNTy@my-file-core-infra-my-file-db-dev.ca3qgwuwxsft.us-east-1.rds.amazonaws.com:5432/postgres

//       },
//       user: {
//         fullName: {
//           needs: { GivenName: true, FamilyName: true },
//           compute(user) {
//             return `${user.GivenName} ${user.FamilyName}`
//           },
//         },
//       },
//     },
//   })
// };
