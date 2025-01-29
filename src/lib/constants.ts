import { ActivityLogRelatedEntityType } from './types-and-interfaces';

export const CLIENT = 'Client';

export const AGENCY_TYPE = {
  HPD: 'HPD',
  DHS: 'DHS',
  PATH: 'PATH',
} as const;

export const USER_FILE_STATUS = {
  DRAFT: 'UPLOAD_PENDING',
  UPLOADED: 'UPLOADED',
} as const;

export const ACTIVITY_LOG_ENTITIES: ActivityLogRelatedEntityType[] = [
  'CASE',
  'USER_CASE',
  'CASE_FILE',
  'FAMILY_MEMBER',
  'CASE_APPLICANT',
  'USER_FILE',
  'CASE_FAMILY_MEMBER',
];

export const S3Prefix = {
  USER_FILES: 'user-files/',
  GENERATED_FILES: 'generated-files/',
} as const;

export const CRITERION_FULFILLMENT_TYPE = {
  REQUIRED: 'REQUIRED',
  OPTIONAL: 'OPTIONAL',
} as const;

export const CASE_CRITERION_FULFILLMENT_STATUS = {
  PENDING: 'PENDING',
  DONE: 'DONE',
} as const;

export const CASE_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
} as const;

export const CASE_FILE_STATUS = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  ACCEPTED: 'ACCEPTED',
  REJECT: 'REJECT',
} as const;

export const STAKEHOLDER_GROUPS = {
  PLATFORM: 'Platform Development',
  CLIENT: 'Client',
  TRUSTED_USER: 'Client Trusted User',
  PATH_AGENCY: 'PATH Agency',
  HPD_AGENCY: 'HPD Agency',
  DHS_AGENCY: 'DHS Agency',
  LANDLORD: 'Building Landlord / Owner',
  SPONSOR: 'Sponsor / Marketing Agent',
  HOUSING_SPECIALIST_AGENT: 'Housing Specialist Agent',
  CBO: 'Community-Based Organization',
} as const;

export const STAKEHOLDER_GROUP_ROLES = {
  PLATFORM_ADMIN: 'Platform Administrator',
  PLATFORM_DEV: 'Platform Development',
  PLATFORM_SUPPORT: 'Platform Support',
  CLIENT: 'Client',
  TRUSTED_USER: 'Client Trusted User',
  PATH_AGENT: 'PATH Employee',
  PATH_ADMIN: 'PATH Administrator',
  HPD_AGENT: 'HPD Employee',
  HPD_ADMIN: 'HPD Administrator',
  DHS_AGENT: 'DHS Employee',
  DHS_ADMIN: 'DHS Administrator',
  SPONSOR: 'Sponsor',
  CBO_SUPERVISOR: 'CBO Supervisor',
  CBO_STAFFER: 'CBO Staffer',
} as const;

const SUPERVISORS = [
  STAKEHOLDER_GROUP_ROLES.CBO_STAFFER,
  STAKEHOLDER_GROUP_ROLES.CBO_SUPERVISOR,
  STAKEHOLDER_GROUP_ROLES.SPONSOR,
];

export const WORKFLOW_USER_ROLES = {
  HPD: [
    STAKEHOLDER_GROUP_ROLES.PLATFORM_ADMIN,
    STAKEHOLDER_GROUP_ROLES.HPD_AGENT,
    STAKEHOLDER_GROUP_ROLES.HPD_ADMIN,
    STAKEHOLDER_GROUP_ROLES.DHS_AGENT,
    STAKEHOLDER_GROUP_ROLES.DHS_ADMIN,
    ...SUPERVISORS,
  ],
  PATH: [
    STAKEHOLDER_GROUP_ROLES.PLATFORM_ADMIN,
    STAKEHOLDER_GROUP_ROLES.PATH_AGENT,
    STAKEHOLDER_GROUP_ROLES.PATH_ADMIN,
  ],
  DHS: [STAKEHOLDER_GROUP_ROLES.PLATFORM_ADMIN, STAKEHOLDER_GROUP_ROLES.DHS_AGENT, STAKEHOLDER_GROUP_ROLES.DHS_ADMIN],
};

/**
 * **Not Used Yet !**
 */
export const CAN_INVITE_TO_MY_FILE = [
  STAKEHOLDER_GROUP_ROLES.CBO_STAFFER,
  STAKEHOLDER_GROUP_ROLES.CBO_SUPERVISOR,
  STAKEHOLDER_GROUP_ROLES.SPONSOR,
];

/**
 * **Not Used Yet !**
 *
 * Right now on my file, every user types can register accounts and then assigned to
 * appropriate roles/cases based on their email addresses.
 */
export const CAN_CREATE_PROFILE = [
  STAKEHOLDER_GROUP_ROLES.CBO_STAFFER,
  STAKEHOLDER_GROUP_ROLES.CBO_SUPERVISOR,
  STAKEHOLDER_GROUP_ROLES.SPONSOR,
];

export const CAN_EDIT_PROFILE = [
  STAKEHOLDER_GROUP_ROLES.CBO_STAFFER,
  STAKEHOLDER_GROUP_ROLES.CBO_SUPERVISOR,
  STAKEHOLDER_GROUP_ROLES.CLIENT,
];

export const CAN_ADD_CASE_FILE = [
  STAKEHOLDER_GROUP_ROLES.CBO_STAFFER,
  STAKEHOLDER_GROUP_ROLES.CBO_SUPERVISOR,
  STAKEHOLDER_GROUP_ROLES.SPONSOR,
  STAKEHOLDER_GROUP_ROLES.CLIENT,
];

export const CAN_ADD_HPD_CASE_FILE = [
  STAKEHOLDER_GROUP_ROLES.HPD_ADMIN,
  STAKEHOLDER_GROUP_ROLES.HPD_AGENT,
  ...CAN_ADD_CASE_FILE,
];

export const CAN_ADD_DHS_CASE_FILE = [
  STAKEHOLDER_GROUP_ROLES.DHS_ADMIN,
  STAKEHOLDER_GROUP_ROLES.DHS_AGENT,
  ...CAN_ADD_CASE_FILE,
];

export const CAN_ADD_PATH_CASE_FILE = [
  STAKEHOLDER_GROUP_ROLES.PATH_ADMIN,
  STAKEHOLDER_GROUP_ROLES.PATH_AGENT,
  ...CAN_ADD_CASE_FILE,
];

export const CAN_ADD_CASE_FILE_WORKFLOW = {
  DHS: CAN_ADD_DHS_CASE_FILE,
  PATH: CAN_ADD_PATH_CASE_FILE,
  HPD: CAN_ADD_HPD_CASE_FILE,
};

export const CAN_ADD_CASE_FILE_WORKFLOW_ROLES = Array.from(new Set(Object.values(CAN_ADD_CASE_FILE_WORKFLOW).flat()));

export const CAN_UPDATE_CASE_STATUS = [
  STAKEHOLDER_GROUP_ROLES.HPD_ADMIN,
  STAKEHOLDER_GROUP_ROLES.PATH_ADMIN,
  STAKEHOLDER_GROUP_ROLES.DHS_ADMIN,
];

export const IS_ADMIN = [STAKEHOLDER_GROUP_ROLES.PLATFORM_ADMIN];

export const DOCUMENT_TYPE = {
  BIRTH_CERTIFICATE: {
    category: 'Identification',
    name: 'Birth Certificates',
  },

  PICTURE_ID: {
    name: 'Picture IDs',
    category: 'Identification',
  },

  SOCIAL_SECURITY_CARD_TAX_ID: {
    category: 'Identification',
    name: 'Social Security Cards or Tax IDs (ITIN)',
  },

  MARRIAGE_DOMESTIC_PARTNERSHIP_CERTIFICATE: {
    category: 'Identification',
    name: 'Marriage certificate or proof of domestic partnership',
  },

  DIVORCE_DOCUMENTS: {
    category: 'Identification',
    name: 'Divorce papers or certificate',
  },

  DISABILITY_ACCOMMODATION_RECORD: {
    category: 'Identification',
    name: 'Proof of disability accommodation needs for family members',
  },

  DISABILITY_SEVERANCE_COMPENSATION_PAYMENTS: {
    category: 'Disability/Workers Comp Benefits',
    name: 'Disability insurance, workers’ compensation and/or severance payments',
  },

  CUSTODY_AGREEMENT_HPD: {
    category: 'Identification',
    name: 'Proof of legal custody or guardianship',
  },

  CUSTODY_AGREEMENT_PATH: {
    category: 'Identification',
    name: 'Proof of custody for family members',
  },

  PAYSTAB_W2: {
    category: 'Proof of Residency for last 2 years ',
    name: 'Pay stubs or W2',
  },

  LEGAL_DOCUMENTS_WITH_ADDRESS: {
    category: 'Proof of Residency for last 2 years ',
    name: 'Legal Documents with address',
  },

  UTILITY_STATEMENT_BILL: {
    category: 'Proof of Residency for last 2 years ',
    name: 'Utility statements & bills',
  },

  LEASE: {
    category: 'Proof of Residency for last 2 years',
    name: 'Lease agreements',
  },

  RESIDENCY_LETTER: {
    category: 'Proof of Residency for last 2 years',
    name: 'Residency letters from other family members or friends',
  },

  HOSPITAL_BILL_RECORD: {
    category: 'Proof of Residency for last 2 years',
    name: 'Medical/hospital bills or records ',
  },

  EVICTION_MARSHAL_NOTICE: {
    category: 'Proof of Residency for last 2 years',
    name: 'Residency eviction papers or Marshal notices',
  },

  SCHOOL_ENROLLMENT_LETTER: {
    category: 'Proof of Residency for last 2 years',
    name: 'School enrollment letters',
  },

  X1040_INCOME: {
    category: 'Self-employed',
    name: 'Most recent Form 1040',
  },

  X1099_FORM: {
    name: `Most recent year's 1099s`,
    category: 'Self-employed',
  },

  TAX_RETURN: {
    category: 'Self-employed',
    name: 'Most recent year’s state tax returns',
  },

  BANK_STATEMENT: {
    category: 'Household Assets',
    name: 'Bank statement from all listed accounts',
  },

  BANK_CHECKING_ACCOUNT_STATEMENT: {
    category: 'Household Assets',
    name: '6 months of statements for checking accounts',
  },

  SAVINGS_RETIREMENT_INVESTMENT_STATEMENT: {
    category: 'Household Assets',
    name: 'Recent statements for all other savings/retirement/investment accounts',
  },

  DIVIDEND_ANNUITIES_STATEMENT: {
    category: 'Household Assets',
    name: 'Dividend and/or annuities statements from issuing institution(s)',
  },

  COMPLETE_ASSET_CERTIFICATION: {
    category: 'Household Assets',
    name: 'Completed Asset Certification (Attachment T)',
  },

  SEPARATION_OR_SETTLEMENT_AGREEMENT: {
    name: 'Separation/settlement agreement(s)',
    category: 'Alimony and/or child support',
  },

  ALIMONY_CHILD_SUPPORT_STATEMENT: {
    name: 'Alimony/child support official statements or print-outs',
    category: 'Alimony and/or child support',
  },

  NOTARIZED_AFFIDAVIT_ALIMONY_CHILD_SUPPORT_STATEMENT: {
    category: 'Alimony and/or child support',
    name: 'Alimony/child support notarized affidavit',
  },

  SELF_EMPLOYMENT_INCOME_STATEMENT: {
    category: 'Self-employed',
    name: '12 month projection of NET self-employment income',
  },

  PAYSTUB: {
    category: 'Employment',
    name: '4 to 6 most recent, consecutive pay stubs',
  },

  PROOF_CASH_PAYMENT: {
    category: 'Employment',
    name: 'Proof of cash payments',
  },

  FEDERAL_AND_STATE_TAX_RETURN: {
    category: 'Employment',
    name: 'Most recent complete federal and state tax returns',
  },

  CERTIFICATION_NONE_FILING_INCOME_TAX_RETURN: {
    category: 'Employment',
    name: 'Certification of Non-Filling of Income Tax Return (Attachment-R-6)',
  },

  EMPLOYMENT_VERIFICATION_LETTER: {
    category: 'Employment',
    name: 'Employment Verification Form (Attachment 1-3)',
  },

  VALID_SECTION_8_TRANSFER_VOUCHER: {
    category: 'Other Sources of Income',
    name: 'Proof of rental subsidy or Valid Section 8 voucher',
  },

  SOCIAL_SECURITY_AWARD_LETTER: {
    category: 'Other Sources of Income',
    name: 'Most recent Social Security Award letter(s)',
  },

  VETERANS_BENEFITS: {
    category: 'Other Sources of Income',
    name: "Veteran's Benefits (annual documentation)",
  },

  PUBLIC_ASSISTANCE_BUDGET_LETTER: {
    category: 'Other Sources of Income',
    name: 'Public Assistance budget letter',
  },

  ARMED_FORCE_RESERVED: {
    category: 'Other Sources of Income',
    name: 'Armed Forces Reserves??',
  },

  PENSION_LETTER: {
    category: 'Other Sources of Income',
    name: 'Pension Award Letter',
  },

  UNEMPLOYMENT_PAYMENT_HISTORY: {
    category: 'Other Sources of Income',
    name: 'Unemployment Payment history',
  },

  ARMED_FORCES_RESERVES_SERVICE: {
    category: 'Other Income',
    name: 'Armed Forces Reserves Award Letter',
  },

  ANNUAL_BENEFIT_REPORT: {
    category: 'Other Income',
    name: 'Annual Benefits Report (ABR)',
  },

  SUMMARY_BENEFIT_LETTER: {
    category: 'Other Income',
    name: 'Summary of Benefits Letter',
  },

  SAVING_OR_RETIREMENT_STATEMENT: {
    category: 'Other Income',
    name: 'Other savings/retirement statements',
  },

  RECURRING_GIFTS_STATEMENT: {
    category: 'Recurring contributions and/or gifts',
    name: 'Notarized statement and/or affidavit signed by the person providing assistance',
  },

  RECURRING_GIFTS: {
    category: 'Recurring contributions and/or gifts',
    name: 'Bank statements showing gift payments',
  },

  /**
   * Added When adding Workflow stage criteria
   */

  EMPLOYMENT_AUTHORIZATION_CARD: {
    name: 'Employment Authorization Card',
    category: 'Immigration Status',
  },

  LETTER_OR_DEPARTURE_RECORD_CARD: {
    name: 'I-94 Letter or Departure Record Card',
    category: 'Immigration Status',
  },

  LETTER_OF_ASYLUM_APPROVAL: {
    name: 'Letter of Asylum Approval',
    category: 'Immigration Status',
  },

  IMMIGRATION_COURT_ORDER: {
    name: 'Immigration Court Order',
    category: 'Immigration Status',
  },

  I_797_NOTICE_OF_ACTION: {
    name: 'I-797 Notice of Action',
    category: 'Immigration Status',
  },

  I_797_C_NOTICE_OF_ACTION: {
    name: 'I-797(C) Notice of Action',
    category: 'Immigration Status',
  },

  IMMIGRATION_GREEN_CARD: {
    name: 'Green Card',
    category: 'Immigration Status',
  },

  VALID_TEMPORAL_VISA: {
    name: 'Valid Visa - Temporary I-551',
    category: 'Immigration Status',
  },

  TRACKING_VICTIM_CERT: {
    name: 'Trafficking Victim Certification Letter',
    category: 'Immigration Status',
  },

  VAWA_DETERMINATION_LETTER: {
    name: 'VAWA Prima Facie Determination Letter',
    category: 'Immigration Status',
  },

  ORDER_OF_SUPERVISION_LETTER: {
    name: 'Order of Supervision Letter',
    category: 'Immigration Status',
  },

  INTERIM_NOTICE_PAROLE: {
    name: 'Interim Notice Authorizing Parole',
    category: 'Immigration Detention, Release, and Parole',
  },

  NOTICE_TO_APPEAR: {
    name: 'I-862 Notice to Appear',
    category: 'Immigration Detention, Release, and Parole',
  },

  ORDER_OF_RELEASE_ON_RECOGNIZANCE: {
    name: 'I-220A Order of Release on Recognizance',
    category: 'Immigration Detention, Release, and Parole',
  },

  ALIEN_BOOKING_RECORD: {
    name: 'I-385 Alien Booking Record',
    category: 'Immigration Detention, Release, and Parole',
  },

  OTHER_DOCUMENTS: {
    name: 'Other Documents',
    category: 'Other Documents',
  },

  PREVIOUSLY_SHARED_DOCUMENTS: {
    name: 'Previously Shared Documents',
    category: 'Other Documents ',
  },
} as const;

type DocumentKey = keyof typeof DOCUMENT_TYPE;

export const DOCUMENT_TYPE_MAP = (Object.keys(DOCUMENT_TYPE) as DocumentKey[]).reduce(
  (prev, current) => {
    return {
      ...prev,
      [current]: DOCUMENT_TYPE[current],
    };
  },
  {} as Record<DocumentKey, (typeof DOCUMENT_TYPE)[DocumentKey]>,
);

export const DOCUMENT_CATEGORIES = (Object.keys(DOCUMENT_TYPE) as DocumentKey[]).reduce(
  (prev, current) => {
    const catKey = DOCUMENT_TYPE[current].category;
    if (prev[catKey]) {
      prev[catKey].push(current);
    } else {
      prev[catKey] = [current];
    }
    return {
      ...prev,
    };
  },
  {} as Record<(typeof DOCUMENT_TYPE)[DocumentKey]['category'], DocumentKey[]>,
);

type CategoryKey = keyof typeof DOCUMENT_CATEGORIES;

export const DOCUMENT_CATEGORY_MAP = (Object.keys(DOCUMENT_CATEGORIES) as CategoryKey[]).reduce(
  (prev, current) => {
    return {
      ...prev,
      [current]: current,
    };
  },
  {} as Record<CategoryKey, CategoryKey>,
);

type Operant = '<' | '>' | '===' | '<=' | '>=' | 'in' | 'all';
export interface RuleSets {
  field: 'fileType';
  operant: 'in' | 'all';
  when: {
    field: 'age' /**| Some other field goes here */;
    operant: Operant;
    value: number /**| Some other value type */;
  };
  value: (typeof DOCUMENT_TYPE_MAP)[DocumentKey][];
}

type Email = string;
export const PATH_AGENTS: Email[] = ['path_agent@example.com'];
export const HPD_AGENTS: Email[] = ['hpd_agent@example.com'];
export const DHS_AGENTS: Email[] = ['dhs_agent@example.com'];
export const CBO_STAFF_AGENTS: Email[] = ['cbo_staff@example.com'];
export const SPONSOR_USERS: Email[] = ['sponsor@example.com'];
export const SPONSOR_SUPERVISORS: Email[] = [];
export const HPD_ADMINS: Email[] = [];
export const PATH_ADMINS: Email[] = [];
export const DHS_ADMINS: Email[] = [];
export const CBO_SUPERVISORS: Email[] = [];
