import { PrismaClient } from '@prisma/client';
import languagesJson from './data/languages.json';
import {
  AGENCY_TYPE,
  CRITERION_FULFILLMENT_TYPE,
  DOCUMENT_CATEGORIES,
  DOCUMENT_TYPE_MAP,
  RuleSets,
  STAKEHOLDER_GROUP_ROLES,
} from '../src/lib/constants';
const prisma = new PrismaClient();

async function createStakeholderGroups() {
  await prisma.$transaction(async prisma => {
    const stakeholderGroupCount = await prisma.stakeholderGroup.count();
    if (stakeholderGroupCount > 0) {
      console.warn('stakeholder groups already seeded: ', stakeholderGroupCount);
      return;
    }

    await prisma.stakeholderGroup.createMany({
      data: [
        {
          Name: STAKEHOLDER_GROUP_ROLES.CLIENT,
          Description:
            'The client is the main user of My File. They create applications to different agencies and manage files for subsequent use on applications.',
        },
        {
          Name: STAKEHOLDER_GROUP_ROLES.TRUSTED_USER,
          Description:
            'A trusted user is someone who is trusted by the client to access their files and communicate with their case manager on their behalf',
        },
        {
          Name: STAKEHOLDER_GROUP_ROLES.HPD_ADMIN,
          Description: 'HPD Admin Agents are the responsible of HPD programs on the platform',
        },
        {
          Name: STAKEHOLDER_GROUP_ROLES.PATH_AGENT,
          Description: 'PATH Team Members take part PATH programs on the platform',
        },
        {
          Name: STAKEHOLDER_GROUP_ROLES.DHS_ADMIN,
          Description: 'DHS Admin Agents are the responsible of DHS programs on the platform',
        },
        {
          Name: STAKEHOLDER_GROUP_ROLES.DHS_AGENT,
          Description: 'DHS Agents are Members responsible of DHS programs on the platform',
        },
        {
          Name: STAKEHOLDER_GROUP_ROLES.SPONSOR,
          Description: 'A sponsor is someone who is sponsoring the platform',
        },
        {
          Name: STAKEHOLDER_GROUP_ROLES.CBO_STAFFER,
          Description: 'Community Base Organization Staffer wanting to take part in a FLOW',
        },
        {
          Name: STAKEHOLDER_GROUP_ROLES.HPD_AGENT,
          Description: 'HPD Agents are the responsible of HPD programs on the platform',
        },
        {
          Name: STAKEHOLDER_GROUP_ROLES.CBO_SUPERVISOR,
          Description: 'Community Base Organization Supervisors wanting to take part in a FLOW',
        },
      ],
    });

    const rolesMap = {
      [STAKEHOLDER_GROUP_ROLES.CLIENT]: STAKEHOLDER_GROUP_ROLES.CLIENT,
      [STAKEHOLDER_GROUP_ROLES.TRUSTED_USER]: STAKEHOLDER_GROUP_ROLES.TRUSTED_USER,
      [STAKEHOLDER_GROUP_ROLES.PATH_AGENT]: STAKEHOLDER_GROUP_ROLES.PATH_AGENT,
      [STAKEHOLDER_GROUP_ROLES.PATH_ADMIN]: STAKEHOLDER_GROUP_ROLES.PATH_ADMIN,
      [STAKEHOLDER_GROUP_ROLES.PLATFORM_ADMIN]: STAKEHOLDER_GROUP_ROLES.PLATFORM_ADMIN,
      [STAKEHOLDER_GROUP_ROLES.PLATFORM_DEV]: STAKEHOLDER_GROUP_ROLES.PLATFORM_DEV,
      [STAKEHOLDER_GROUP_ROLES.PLATFORM_SUPPORT]: STAKEHOLDER_GROUP_ROLES.PLATFORM_DEV,
      [STAKEHOLDER_GROUP_ROLES.HPD_ADMIN]: STAKEHOLDER_GROUP_ROLES.HPD_ADMIN,
      [STAKEHOLDER_GROUP_ROLES.DHS_ADMIN]: STAKEHOLDER_GROUP_ROLES.DHS_ADMIN,
      [STAKEHOLDER_GROUP_ROLES.DHS_AGENT]: STAKEHOLDER_GROUP_ROLES.DHS_AGENT,
      [STAKEHOLDER_GROUP_ROLES.SPONSOR]: STAKEHOLDER_GROUP_ROLES.SPONSOR,
      [STAKEHOLDER_GROUP_ROLES.CBO_STAFFER]: STAKEHOLDER_GROUP_ROLES.CBO_STAFFER,
      [STAKEHOLDER_GROUP_ROLES.CBO_SUPERVISOR]: STAKEHOLDER_GROUP_ROLES.CBO_SUPERVISOR,
    };

    const stakeHolderGroup = await prisma.stakeholderGroup.findMany();

    const stakeholderGroupRoles: {
      Name: keyof typeof rolesMap | null;
      Description: string | null;
      StakeholderGroupId?: string;
    }[] = stakeHolderGroup.map(ele => {
      return {
        Name: ele.Name! as keyof typeof rolesMap,
        Description: ele.Description,
        StakeholderGroupId: ele.id,
      };
    });

    // These StakeholderGroupRoles are not linked to any StakeholderGroup

    stakeholderGroupRoles.push({
      Name: STAKEHOLDER_GROUP_ROLES.PLATFORM_ADMIN,
      Description: 'Administrator of the platform',
    });

    await prisma.stakeholderGroupRole.createMany({
      data: stakeholderGroupRoles,
    });
  });
}

async function seedLanguages() {
  const languageCount = await prisma.language.count();
  if (languageCount > 0) {
    console.warn('languages already seeded: ', languageCount);
    return;
  }

  const languages = await prisma.language.createMany({
    data: languagesJson.map(ele => ({
      ...{
        Name: ele.name,
        Code: ele.code,
      },
    })),
  });

  return languages;
}

async function seedWorkflows() {
  await prisma.$transaction(async prisma => {
    const workflowCount = await prisma.workflow.count();
    if (workflowCount > 0) {
      console.warn('workflows already seeded: ', workflowCount);
      return;
    }

    await prisma.workflow.createMany({
      data: [
        {
          Name: 'HPD Set Aside Affordable Housing',
          Description: 'HPD Set Aside Affordable Housing',
          Type: AGENCY_TYPE.HPD,
        },
        {
          Name: 'PATH Temporary Housing Assistance',
          Description: 'PATH Temporary Housing Assistance',
          Type: AGENCY_TYPE.PATH,
        },
      ],
    });

    const pathWorkflow = await prisma.workflow.findFirst({
      where: {
        Type: AGENCY_TYPE.PATH,
      },
    });

    const HDPWorkflow = await prisma.workflow.findFirst({
      where: {
        Type: AGENCY_TYPE.HPD,
      },
    });

    await prisma.workflowStage.createMany({
      data: [
        {
          StageName: 'PATH Documentation',
          StagePosition: 1,
          WorkflowId: pathWorkflow?.id,
        },
      ],
    });

    const ckecklist1 = await prisma.workflowStage.findFirst({
      where: {
        StagePosition: 1,
        WorkflowId: pathWorkflow?.id,
      },
    });

    // add workflow stage criterion to path
    await prisma.workflowStageCriterion.createMany({
      data: [
        {
          CaseWorkflowStageId: ckecklist1?.id,
          Name: 'Birth Certificates',
          CriterionGroupName: 'Identification',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '<',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.BIRTH_CERTIFICATE],
            },
          ] as RuleSets[]),
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.REQUIRED,
        },

        {
          Name: 'Picture IDs',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionGroupName: 'Identification',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.REQUIRED,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                value: 18,
                operant: '>=',
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.PICTURE_ID],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Social Security Cards or Tax IDs (ITIN)',
          CriterionGroupName: 'Identification',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.REQUIRED,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                value: 18,
                operant: '>=',
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.SOCIAL_SECURITY_CARD_TAX_ID],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Marriage certificate or proof of domestic partnership',
          CriterionSubGroupName: 'If applicable',
          CriterionGroupName: 'Identification',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                value: 18,
                operant: '>=',
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.MARRIAGE_DOMESTIC_PARTNERSHIP_CERTIFICATE],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Divorce papers or certificate',
          CriterionSubGroupName: 'If applicable',
          CriterionGroupName: 'Identification',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                value: 18,
                operant: '>=',
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.DIVORCE_DOCUMENTS],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Proof of custody for family members',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName: 'If applicable',
          CriterionGroupName: 'Identification',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.CUSTODY_AGREEMENT_PATH],
              when: {
                field: 'age',
                value: 18,
                operant: '<=',
              },
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Proof of disability accommodation needs for family members',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName: 'If applicable',
          CriterionGroupName: 'Identification',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.DISABILITY_ACCOMMODATION_RECORD],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Pay stubs or W2',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionGroupName: 'Proof of Residency for last 2 years',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: 'all',
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.PAYSTAB_W2],
            },
          ] as RuleSets[]),
        },
        {
          Name: 'Legal documents with address',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionGroupName: 'Proof of Residency for last 2 years',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.LEGAL_DOCUMENTS_WITH_ADDRESS],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Utility statements & bills',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionGroupName: 'Proof of Residency for last 2 years',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.UTILITY_STATEMENT_BILL],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Lease agreements',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionGroupName: 'Proof of Residency for last 2 years',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.LEASE],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Residency letters from other family members or friends',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionGroupName: 'Proof of Residency for last 2 years',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.RESIDENCY_LETTER],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Medical/hospital bills or records',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionGroupName: 'Proof of Residency for last 2 years',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.HOSPITAL_BILL_RECORD],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Residency eviction papers or Marshal notices',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionGroupName: 'Proof of Residency for last 2 years',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.EVICTION_MARSHAL_NOTICE],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'School enrollment letters',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionGroupName: 'Proof of Residency for last 2 years',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: '<=',
                value: 18,
              },
              value: [DOCUMENT_TYPE_MAP.SCHOOL_ENROLLMENT_LETTER],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Employment Authorization Card',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName: 'For any family members who are not U.S citizens',
          CriterionGroupName: 'Immigration Status',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.EMPLOYMENT_AUTHORIZATION_CARD],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'I-94 Letter or Departure Record Card',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName: 'For any family members who are not U.S citizens',
          CriterionGroupName: 'Immigration Status',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.LETTER_OR_DEPARTURE_RECORD_CARD],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Letter of Asylum Approval',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName: 'For any family members who are not U.S citizens',
          CriterionGroupName: 'Immigration Status',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.LETTER_OF_ASYLUM_APPROVAL],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Immigration Court Order',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName: 'For any family members who are not U.S citizens',
          CriterionGroupName: 'Immigration Status',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.IMMIGRATION_COURT_ORDER],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'I-797 Notice of Action',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName: 'For any family members who are not U.S citizens',
          CriterionGroupName: 'Immigration Status',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.I_797_NOTICE_OF_ACTION],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'I-797(C) Notice of Action',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName: 'For any family members who are not U.S citizens',
          CriterionGroupName: 'Immigration Status',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.I_797_C_NOTICE_OF_ACTION],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Green Card',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName: 'For any family members who are not U.S citizens',
          CriterionGroupName: 'Immigration Status',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.IMMIGRATION_GREEN_CARD],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Valid Visa - Temporary I-551',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName: 'For any family members who are not U.S citizens',
          CriterionGroupName: 'Immigration Status',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.VALID_TEMPORAL_VISA],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Trafficking Victim Certification Letter',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName: 'For any family members who are not U.S citizens',
          CriterionGroupName: 'Immigration Status',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.TRACKING_VICTIM_CERT],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'VAWA Prima Facie Determination Letter',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName: 'For any family members who are not U.S citizens',
          CriterionGroupName: 'Immigration Status',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.VAWA_DETERMINATION_LETTER],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Order of Supervision Letter',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName: 'For any family members who are not U.S citizens',
          CriterionGroupName: 'Immigration Status',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.ORDER_OF_SUPERVISION_LETTER],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Interim Notice Authorizing Parole',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName:
            'For any family members who are not U.S citizens and have been detained and released or on parole',
          CriterionGroupName: 'Immigration Detention, Release, and Parole',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.INTERIM_NOTICE_PAROLE],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Employment Authorization Card',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName:
            'For any family members who are not U.S citizens and have been detained and released or on parole',
          CriterionGroupName: 'Immigration Detention, Release, and Parole',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.EMPLOYMENT_AUTHORIZATION_CARD],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'I-94 Letter or Departure Record Card',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName:
            'For any family members who are not U.S citizens and have been detained and released or on parole',
          CriterionGroupName: 'Immigration Detention, Release, and Parole',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.LETTER_OR_DEPARTURE_RECORD_CARD],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'I-862 Notice to Appear',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName:
            'For any family members who are not U.S citizens and have been detained and released or on parole',
          CriterionGroupName: 'Immigration Detention, Release, and Parole',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.NOTICE_TO_APPEAR],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'I-220A Order of Release on Recognizance',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName:
            'For any family members who are not U.S citizens and have been detained and released or on parole',
          CriterionGroupName: 'Immigration Detention, Release, and Parole',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.ORDER_OF_RELEASE_ON_RECOGNIZANCE],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'I-385 Alien Booking Record',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionSubGroupName:
            'For any family members who are not U.S citizens and have been detained and released or on parole',
          CriterionGroupName: 'Immigration Detention, Release, and Parole',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: 'all',
              },
              value: [DOCUMENT_TYPE_MAP.ALIEN_BOOKING_RECORD],
            },
          ] as RuleSets[]),
        },

        {
          Name: 'Previously shared documents',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionGroupName: 'Other documents',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.PREVIOUSLY_SHARED_DOCUMENTS],
            },
          ] as RuleSets[]),
        },
        {
          Name: 'Other documents',
          CaseWorkflowStageId: ckecklist1?.id,
          CriterionGroupName: 'Other documents',
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.OTHER_DOCUMENTS],
            },
          ] as RuleSets[]),
        },
      ],
    });

    // Create Workflow stage for HPD
    await prisma.workflowStage.createMany({
      data: [
        {
          WorkflowId: HDPWorkflow?.id,
          StagePosition: 1,
          StageName: 'ROI & Vital Document Checklist',
        },
        {
          WorkflowId: HDPWorkflow?.id,
          StagePosition: 2,
          StageName: 'Eligibility Appointment Checklist',
        },
      ],
    });

    const HpdStage1 = await prisma.workflowStage.findFirst({
      where: { StagePosition: 1, WorkflowId: HDPWorkflow?.id },
    });
    const HpdStage2 = await prisma.workflowStage.findFirst({
      where: { StagePosition: 2, WorkflowId: HDPWorkflow?.id },
    });

    await prisma.workflowStageCriterion.createMany({
      data: [
        {
          CaseWorkflowStageId: HpdStage1?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.REQUIRED,
          CriterionGroupName: 'Identification',
          Name: 'Birth Certificates',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: '<=',
                value: 18,
              },
              value: [DOCUMENT_TYPE_MAP.BIRTH_CERTIFICATE],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage1?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.REQUIRED,
          CriterionGroupName: 'Identification',
          Name: 'Picture IDs',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              value: [DOCUMENT_TYPE_MAP.PICTURE_ID],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage1?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.REQUIRED,
          CriterionGroupName: 'Identification',
          Name: 'Social Security Cards or Tax IDs (ITIN)',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.SOCIAL_SECURITY_CARD_TAX_ID],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage1?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionSubGroupName: 'If applicable',
          CriterionGroupName: 'Identification',
          Name: 'Marriage certificate or proof of domestic partnership',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.MARRIAGE_DOMESTIC_PARTNERSHIP_CERTIFICATE],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage1?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionSubGroupName: 'If applicable',
          CriterionGroupName: 'Identification',
          Name: 'Divorce papers or certificate',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.DIVORCE_DOCUMENTS],
            },
          ] as RuleSets[]),
        },

        {
          CaseWorkflowStageId: HpdStage1?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionSubGroupName: 'If applicable',
          CriterionGroupName: 'Identification',
          Name: 'Proof of legal custody or guardianship',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '<=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.CUSTODY_AGREEMENT_HPD],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage1?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionSubGroupName: 'If applicable',
          CriterionGroupName: 'Identification',
          Name: 'Proof of disability accommodation needs for family members',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: 'all',
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.DISABILITY_ACCOMMODATION_RECORD],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage1?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionSubGroupName: 'If applicable',
          CriterionGroupName: 'Other documents',
          Name: 'Other documents',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: 'all',
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.OTHER_DOCUMENTS],
            },
          ] as RuleSets[]),
        },
        /**
         * HPD Stage 2 Criteria
         */

        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Employment',
          CriterionSubGroupName: 'Only ONE of the following is required for all employed family members',
          Name: '4 to 6 most recent, consecutive pay stubs',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.PAYSTUB],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Employment',
          CriterionSubGroupName: 'Only ONE of the following is required for all employed family members',
          Name: 'Employment Verification Form (Attachment 1-3)',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              value: [DOCUMENT_TYPE_MAP.EMPLOYMENT_VERIFICATION_LETTER],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Employment',
          CriterionSubGroupName: 'Only ONE of the following is required for all employed family members',
          Name: 'Most recent complete federal and state tax returns',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'all',
              value: [DOCUMENT_TYPE_MAP.FEDERAL_AND_STATE_TAX_RETURN],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Employment',
          CriterionSubGroupName: 'Only ONE of the following is required for all employed family members',
          Name: 'Certification of Non-Filling of Income Tax Return (Attachment-R-6)',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.CERTIFICATION_NONE_FILING_INCOME_TAX_RETURN],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Employment',
          CriterionSubGroupName: 'If a family member is paid in cash',
          Name: 'Proof of cash payments',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.PROOF_CASH_PAYMENT],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Self-employed',
          CriterionSubGroupName: 'For all family members self-employed for at least the previous 2 years',
          Name: 'Most recent Form 1040',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.X1040_INCOME],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Self-employed',
          CriterionSubGroupName: 'For all family members self-employed for at least the previous 2 years',
          Name: "Most recent year's 1099s",
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.X1099_FORM],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Self-employed',
          CriterionSubGroupName: 'For all family members self-employed for at least the previous 2 years',
          Name: 'Most recent year’s state tax returns',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.TAX_RETURN],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Self-employed',
          CriterionSubGroupName: 'For all family members self-employed for at least the previous 2 years',
          Name: '12 month projection of NET self-employment income',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.SELF_EMPLOYMENT_INCOME_STATEMENT],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Self-employed',
          CriterionSubGroupName: 'For all family members self-employed for less than the last 2 years',
          Name: '12 month projection of NET self-employment income',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.SELF_EMPLOYMENT_INCOME_STATEMENT],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Self-employed',
          CriterionSubGroupName: 'For all family members self-employed for less than the last 2 years',
          Name: 'Self Employment Income Documentation (Third Party)',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.SELF_EMPLOYMENT_INCOME_STATEMENT],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Other Sources of Income',
          Name: 'Proof of rental subsidy or Valid Section 8 voucher',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              value: [DOCUMENT_TYPE_MAP.VALID_SECTION_8_TRANSFER_VOUCHER],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Other Sources of Income',
          Name: 'Most recent Social Security Award letter(s)',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              value: [DOCUMENT_TYPE_MAP.SOCIAL_SECURITY_AWARD_LETTER],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Other Sources of Income',
          Name: "Veteran's Benefits (annual documentation)",
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.VETERANS_BENEFITS],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Other Sources of Income',
          Name: 'Public Assistance budget letter',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.PUBLIC_ASSISTANCE_BUDGET_LETTER],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Other Sources of Income',
          Name: 'Armed Forces Reserves Award Letter',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              value: [DOCUMENT_TYPE_MAP.ARMED_FORCE_RESERVED],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Other Sources of Income',
          Name: 'Pension Award Letter',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              value: [DOCUMENT_TYPE_MAP.PENSION_LETTER],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Other Sources of Income',
          Name: 'Unemployment Payment history',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              value: [DOCUMENT_TYPE_MAP.UNEMPLOYMENT_PAYMENT_HISTORY],
            },
          ] as RuleSets[]),
        },

        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Household Assets',
          Name: 'Bank statement from all listed accounts',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.BANK_STATEMENT],
            },
          ] as RuleSets[]),
        },
        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Household Assets',
          Name: '6 months of statements for checking accounts',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.BANK_CHECKING_ACCOUNT_STATEMENT],
            },
          ] as RuleSets[]),
        },

        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Household Assets',
          Name: 'Recent statements for all other savings/retirement/investment accounts',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.SAVINGS_RETIREMENT_INVESTMENT_STATEMENT],
            },
          ] as RuleSets[]),
        },

        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Household Assets',
          Name: 'Dividend and/or annuities statements from issuing institution(s)',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.DIVIDEND_ANNUITIES_STATEMENT],
            },
          ] as RuleSets[]),
        },

        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Household Assets',
          CriterionSubGroupName: 'For assets totaling under $5,000',
          Name: 'Completed Asset Certification (Attachment T)',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.COMPLETE_ASSET_CERTIFICATION],
            },
          ] as RuleSets[]),
        },

        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Alimony and/or child support',
          CriterionSubGroupName: 'Only one of the following is required',
          Name: 'Separation/settlement agreement(s)',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.SEPARATION_OR_SETTLEMENT_AGREEMENT],
            },
          ] as RuleSets[]),
        },

        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Alimony and/or child support',
          CriterionSubGroupName: 'Only one of the following is required',
          Name: 'Alimony/child support official statements or print-outs',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.ALIMONY_CHILD_SUPPORT_STATEMENT],
            },
          ] as RuleSets[]),
        },

        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Alimony and/or child support',
          CriterionSubGroupName: 'Only one of the following is required',
          Name: 'Alimony/child support notarized affidavit',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              operant: 'in',
              value: [DOCUMENT_TYPE_MAP.NOTARIZED_AFFIDAVIT_ALIMONY_CHILD_SUPPORT_STATEMENT],
            },
          ] as RuleSets[]),
        },

        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Disability/Workers Comp Benefits',
          Name: 'Disability insurance, workers’ compensation and/or severance payments',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              value: [DOCUMENT_TYPE_MAP.DISABILITY_SEVERANCE_COMPENSATION_PAYMENTS],
            },
          ] as RuleSets[]),
        },

        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Recurring contributions and/or gifts',
          Name: 'Notarized statement and/or affidavit signed by the person providing assistance',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              value: [DOCUMENT_TYPE_MAP.RECURRING_GIFTS_STATEMENT],
            },
          ] as RuleSets[]),
        },

        {
          CaseWorkflowStageId: HpdStage2?.id,
          CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.OPTIONAL,
          CriterionGroupName: 'Recurring contributions and/or gifts',
          Name: 'Bank statements showing gift payments',
          RuleSets: JSON.stringify([
            {
              field: 'fileType',
              operant: 'in',
              when: {
                field: 'age',
                operant: '>=',
                value: 18,
              },
              value: [DOCUMENT_TYPE_MAP.RECURRING_GIFTS],
            },
          ] as RuleSets[]),
        },
      ],
    });
  });
}

async function seedUsers() {
  const usersCount = await prisma.user.count();

  const stakeholderGroup = await prisma.stakeholderGroupRole.findMany();

  const idpId = 'e4790d3d69ac4d0a9162908bc33602f0';

  if (usersCount > 0) {
    console.warn('users already seeded: ', usersCount);
  } else {
    await prisma.user.createMany({
      data: [
        {
          LegacyId: 'e4790d3d69ac4d0a9162908bc33602f0',
          IdpId: idpId,
          FirstName: 'First',
          LastName: 'User',
          Email: 'myfile-001@example.com',
        },
      ],
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      IdpId: idpId,
    },
    select: {
      id: true,
    },
  });

  const userStakeholderGroupRole = [
    {
      StakeholderGroupRoleId: stakeholderGroup.find(ele => ele.Name === STAKEHOLDER_GROUP_ROLES.CLIENT)?.id,
      UserId: user?.id,
    },
  ];

  // check if user already has stakeholder group role

  const userStakeholderGroupRoleCount = await prisma.user_StakeholderGroupRole.count({
    where: {
      UserId: user?.id,
    },
  });

  if (userStakeholderGroupRoleCount > 0) {
    console.warn('user already has stakeholder group role: ', userStakeholderGroupRoleCount);
    return;
  }

  await prisma.user_StakeholderGroupRole.createMany({
    data: userStakeholderGroupRole,
  });
}

async function seedHPDUsers() {
  const hpdUsers = [];
  const usersCount = await prisma.user.count();

  if (usersCount > 0) {
    console.warn('users already seeded: ', usersCount);
  } else {
  }
}

async function main() {
  await createStakeholderGroups();

  await seedLanguages();

  await seedWorkflows();

  // await seedUsers()

  await seedHPDUsers();
}

main()
  .then(async () => {
    const newCount = await prisma.user.count();
    console.warn('seeding completed: ', newCount);
    await prisma.$disconnect();
  })
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
  });
