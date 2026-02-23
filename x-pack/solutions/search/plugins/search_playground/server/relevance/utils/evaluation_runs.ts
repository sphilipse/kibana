/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SavedObjectsFindResponse, SavedObject } from '@kbn/core/server';
import type {
  EvaluationRunSavedObject,
  EvaluationRunResponse,
  EvaluationRunListResponse,
  EvaluationRunListObject,
} from '../../../common/types';

export { compareRuns } from '../lib/compare_runs';

export const parseEvaluationRunSO = (
  so: SavedObject<EvaluationRunSavedObject>
): EvaluationRunResponse => {
  const {
    id,
    created_at: createdAt,
    created_by: createdBy,
    updated_at: updatedAt,
    updated_by: updatedBy,
    attributes,
  } = so;

  return {
    _meta: { id, createdAt, createdBy, updatedAt, updatedBy },
    data: attributes,
  };
};

export const parseEvaluationRunSOList = (
  response: SavedObjectsFindResponse<EvaluationRunSavedObject, unknown>
): EvaluationRunListResponse => {
  const items: EvaluationRunListObject[] = response.saved_objects.map((so) => {
    const {
      id,
      created_at: createdAt,
      created_by: createdBy,
      attributes: { name, judgmentSetId, timestamp, metric, overallScore },
    } = so;
    return {
      id,
      name,
      judgmentSetId,
      timestamp,
      metricType: metric.type,
      overallScore,
      createdAt,
      createdBy,
    };
  });

  return {
    _meta: {
      total: response.total,
      page: response.page,
      size: response.per_page,
    },
    items,
  };
};

