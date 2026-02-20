/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SavedObjectsType } from '@kbn/core/server';
import { SEARCH_SOLUTION_SAVED_OBJECT_INDEX } from '@kbn/core-saved-objects-server';
import { EVALUATION_RUN_SAVED_OBJECT_TYPE } from '../../../common';
import { evaluationRunAttributesSchema } from './schema/v1/v1';

export const createEvaluationRunSavedObjectType = (): SavedObjectsType => ({
  name: EVALUATION_RUN_SAVED_OBJECT_TYPE,
  indexPattern: SEARCH_SOLUTION_SAVED_OBJECT_INDEX,
  hidden: false,
  namespaceType: 'multiple-isolated',
  mappings: {
    dynamic: false,
    properties: {
      judgmentSetId: {
        type: 'keyword',
      },
      timestamp: {
        type: 'date',
      },
      overallScore: {
        type: 'float',
      },
    },
  },
  modelVersions: {
    1: {
      changes: [],
      schemas: {
        forwardCompatibility: evaluationRunAttributesSchema.extends({}, { unknowns: 'ignore' }),
        create: evaluationRunAttributesSchema,
      },
    },
  },
});
