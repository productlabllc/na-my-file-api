import joi = require('joi');

import { ActivityLogTypesList } from '../types-and-interfaces';
import {
  AGENCY_TYPE,
  CASE_CRITERION_FULFILLMENT_STATUS,
  CASE_FILE_STATUS,
  CRITERION_FULFILLMENT_TYPE,
  STAKEHOLDER_GROUP_ROLES,
  STAKEHOLDER_GROUPS,
  USER_FILE_STATUS,
} from '../constants';
import permissions from '../permissions';

export const ActivityLogsSchema = joi
  .array()
  .items(
    joi
      .string()
      .valid(...ActivityLogTypesList)
      .required(),
  )
  .meta({ className: 'ActivityLogs' });

export const StakeholderGroupRolesSchema = joi
  .object(
    (Object.keys(STAKEHOLDER_GROUP_ROLES) as (keyof typeof STAKEHOLDER_GROUP_ROLES)[]).reduce(
      (acc, stk) => {
        return {
          ...acc,
          [stk]: joi.string().valid(STAKEHOLDER_GROUP_ROLES[stk]).required(),
        };
      },
      {} as Record<keyof typeof STAKEHOLDER_GROUP_ROLES, joi.Schema>,
    ),
  )
  .meta({ className: 'StakeHolderGroupRoles' });

export const PermissionsSchema = joi
  .object(
    (Object.keys(permissions) as (keyof typeof permissions)[]).reduce(
      (acc, current) => {
        return {
          ...acc,
          [current]: joi
            .array()
            .items(...permissions[current])
            .required(),
        };
      },
      {} as Record<keyof typeof permissions, joi.Schema>,
    ),
  )
  .meta({ className: 'Permissions' });

export const StakeHolderGroupsSchema = joi
  .object(
    (Object.keys(STAKEHOLDER_GROUPS) as (keyof typeof STAKEHOLDER_GROUPS)[]).reduce(
      (acc, current) => {
        return {
          ...acc,
          [current]: joi.string().valid(STAKEHOLDER_GROUPS[current]).required(),
        };
      },
      {} as Record<string, joi.Schema>,
    ),
  )
  .meta({ className: 'StakeHolderGroups' });

export const UserFileStatusSchema = joi
  .object(
    (Object.keys(USER_FILE_STATUS) as (keyof typeof USER_FILE_STATUS)[]).reduce(
      (acc, current) => {
        return {
          ...acc,
          [current]: joi.string().valid(USER_FILE_STATUS[current]).required(),
        };
      },
      {} as Record<string, joi.Schema>,
    ),
  )
  .meta({ className: 'UserFileStatus' });

export const CriterionFulfillmentTypeSchema = joi
  .object(
    (Object.keys(CRITERION_FULFILLMENT_TYPE) as (keyof typeof CRITERION_FULFILLMENT_TYPE)[]).reduce(
      (acc, current) => {
        return {
          ...acc,
          [current]: joi.string().valid(CRITERION_FULFILLMENT_TYPE[current]).required(),
        };
      },
      {} as Record<string, joi.Schema>,
    ),
  )
  .meta({ className: 'CriterionFulfillmentType' });

export const CaseCriterionFulfillmentStatusSchema = joi
  .object(
    (Object.keys(CASE_CRITERION_FULFILLMENT_STATUS) as (keyof typeof CASE_CRITERION_FULFILLMENT_STATUS)[]).reduce(
      (acc, current) => {
        return {
          ...acc,
          [current]: joi.string().valid(CASE_CRITERION_FULFILLMENT_STATUS[current]).required(),
        };
      },
      {} as Record<string, joi.Schema>,
    ),
  )
  .meta({ className: 'CaseCriterionFulfillmentStatus' });

export const CaseFileStatusSchema = joi
  .object(
    (Object.keys(CASE_FILE_STATUS) as (keyof typeof CASE_FILE_STATUS)[]).reduce(
      (acc, current) => {
        return {
          ...acc,
          [current]: joi.string().valid(CASE_FILE_STATUS[current]).required(),
        };
      },
      {} as Record<string, joi.Schema>,
    ),
  )
  .meta({ className: 'CaseFileStatus' });

export const AgencyTypeSchema = joi
  .object(
    (Object.keys(AGENCY_TYPE) as (keyof typeof AGENCY_TYPE)[]).reduce(
      (acc, current) => {
        return {
          ...acc,
          [current]: joi.string().valid(AGENCY_TYPE[current]).required(),
        };
      },
      {} as Record<string, joi.Schema>,
    ),
  )
  .meta({ className: 'AgencyType' });

export const ConstantsSchema = joi
  .object({
    AgencyType: AgencyTypeSchema.required(),
    CaseFileStatus: CaseFileStatusSchema.required(),
    CaseCriterionFulfillmentStatus: CaseCriterionFulfillmentStatusSchema.required(),
    CriterionFulfillmentType: CriterionFulfillmentTypeSchema.required(),
    UserFileStatus: UserFileStatusSchema.required(),
    StakeHolderGroups: StakeHolderGroupsSchema.required(),
    StakeHolderGroupRoles: StakeholderGroupRolesSchema.required(),
    Permissions: PermissionsSchema.required(),
    ActivityLogs: ActivityLogsSchema.required(),
  })
  .meta({ className: 'Constants' });
