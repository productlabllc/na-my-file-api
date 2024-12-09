import Joi = require('joi');
import { BaseCaseCriterionSchema, BaseWorkFlowSchema, BaseWorkflowStage } from './base-models.schema';

export const WorkflowStageCriterionSchema = Joi.object({
  id: Joi.string().uuid().required(),
  CaseWorkflowStageId: Joi.string().uuid(),
  Name: Joi.string(),
  CaseCriteria: Joi.array().items(BaseCaseCriterionSchema),
  CriterionFulfillmentType: Joi.string(),
  DeletedAt: Joi.date(),
  CriterionSubGroupName: Joi.string(),
  CriterionGroupName: Joi.string(),
  WorkflowStage: BaseWorkflowStage,
}).meta({ className: 'WorkflowStageCriterion' });

export const WorkflowStageSchema = Joi.object({
  id: Joi.string().uuid().required(),
  StageName: Joi.string(),
  WorkflowId: Joi.string().uuid(),
  StagePosition: Joi.number(),
  Workflow: BaseWorkFlowSchema,
  WorkflowStateCriteria: Joi.array().items(WorkflowStageCriterionSchema),
}).meta({ className: 'WorkflowStage' });

export const WorkFlowSchema = Joi.object({
  id: Joi.string().uuid().required(),
  WorkflowStages: Joi.array().items(WorkflowStageSchema),
  Type: Joi.string(),
  Name: Joi.string(),
  Description: Joi.string().allow(''),
}).meta({ className: 'Workflow' });
