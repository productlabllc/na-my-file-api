import { PrismaClient } from '@prisma/client';
import { CAN_ADD_CASE_FILE_WORKFLOW_ROLES } from './constants';

type Models = Omit<
  PrismaClient,
  | '$transaction'
  | '$queryRawUnsafe'
  | '$queryRaw'
  | '$on'
  | '$extends'
  | '$executeRawUnsafe'
  | '$executeRaw'
  | '$disconnect'
  | '$connect'
  | '$use'
  | symbol
>;
const generateSdMethods = <T extends PrismaClient, K extends keyof Models>({
  client,
  model,
}: {
  client: T;
  model: K;
}) => {
  return {
    async softDelete({
      where,
      select,
    }: {
      where: Parameters<T[K]['update']>[0]['where'];
      select?: Parameters<T[K]['update']>[0]['select'];
    }) {
      return (client[model] as any).update({
        where,
        select,
        data: {
          DeletedAt: new Date(),
        },
      });
    },
    async softDeleteMany({ where }: { where: Parameters<T[K]['updateMany']>[0]['where'] }) {
      return (client[model] as any).updateMany({
        where,
        data: {
          DeletedAt: new Date(),
        },
      });
    },
  };
};

const sdModules: (keyof Models)[] = [
  'case',
  'caseApplicant',
  'caseCriterion',
  'caseFile',
  'caseNote',
  'caseTeamAssignment',
  'generatedFile',
  'language',
  'language',
  'platformActivityLog',
  'stakeholderGroup',
  'stakeholderGroupRole',
  'uploadedMediaAssetVersion',
  'user',
  'userAttribute',
  'userFamilyMember',
  'userFile',
  'user_StakeholderGroupRole',
  'workflow',
  'workflowStage',
  'workflowStageCriterion',
];

export type SdModule = Record<
  (typeof sdModules)[0],
  ReturnType<typeof generateSdMethods<PrismaClient, (typeof sdModules)[0]>>
>;

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

  const sdMethods = sdModules.reduce((prev: SdModule, current) => {
    return {
      ...prev,
      [current]: generateSdMethods<typeof prisma, typeof current>({ client: prisma, model: current }),
    };
  }, {} as SdModule);

  return prisma.$extends({
    name: 'softDelete',
    result: {
      user: {
        isUserInGroup: {
          needs: { id: true },
          compute(user) {
            return async (group: Array<string>) => {
              const groupRoles = await prisma.stakeholderGroupRole.findMany({
                where: {
                  User_StakeholderGroupRole: {
                    some: {
                      UserId: user.id,
                    },
                  },
                },
              });

              return groupRoles.some(ele => group.includes(ele.Name!));
            };
          },
        },
        canViewGeneratedFile: {
          needs: { id: true },
          compute(user) {
            return async (id: string) => {
              /**
               * is user file linked to a case
               */

              const caseFiles = await db.caseFile.findMany({
                where: {
                  AND: {
                    GeneratedFileId: id,
                    Case: {
                      CaseTeamAssignments: {
                        some: {
                          CaseRole: {
                            in: CAN_ADD_CASE_FILE_WORKFLOW_ROLES,
                          },
                          UserId: user.id,
                        },
                      },
                    },
                  },
                },
              });

              return !!caseFiles.length;
            };
          },
        },
      },
    },
    model: sdMethods,
  });
};
let db: ReturnType<typeof getNewClient>;
const { DB_CREDS, NODE_ENV = 'dev' } = process.env;

const getConnectionString = () => {
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
  }

  return db;
};
