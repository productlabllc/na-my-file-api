import Joi = require('joi');
import { CaseCriterionSchema } from './case.schema';

export const WorkflowStageCriterionSchema = Joi.object({
  id: Joi.string().uuid().required(),
  CaseWorkflowStageId: Joi.string().uuid(),
  Name: Joi.string(),
  CaseCriteria: Joi.array().items(Joi.object()),
  CriterionFulfillmentType: Joi.string(),
  WorkflowStage: Joi.object(),
}).meta({ className: 'WorkflowStageCriterion' });

export const WorkflowStageSchema = Joi.object({
  id: Joi.string().uuid().required(),
  StageName: Joi.string(),
  WorkflowId: Joi.string().uuid(),
  Workflow: Joi.object(),
  WorkflowStateCriteria: Joi.array().items(WorkflowStageCriterionSchema),
}).meta({ className: 'WorkflowStage' });

export const WorkFlowSchema = Joi.object({
  id: Joi.string().uuid().required(),
  WorkflowStages: Joi.array().items(WorkflowStageSchema),
  Name: Joi.string(),
  Description: Joi.string(),
}).meta({ className: 'Workflow' });
