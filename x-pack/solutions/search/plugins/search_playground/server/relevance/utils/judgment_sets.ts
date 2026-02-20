/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SavedObjectsFindResponse } from '@kbn/core/server';
import { type SavedObject } from '@kbn/core/server';
import type {
  JudgmentSetSavedObject,
  JudgmentSetResponse,
  JudgmentSetListResponse,
  JudgmentSetListObject,
} from '../../../common/types';

export const parseJudgmentSetSO = (
  so: SavedObject<JudgmentSetSavedObject>
): JudgmentSetResponse => {
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

export const parseJudgmentSetSOList = (
  response: SavedObjectsFindResponse<JudgmentSetSavedObject, unknown>
): JudgmentSetListResponse => {
  const items: JudgmentSetListObject[] = response.saved_objects.map((so) => {
    const {
      id,
      created_at: createdAt,
      created_by: createdBy,
      updated_at: updatedAt,
      updated_by: updatedBy,
      attributes: { name, judgments },
    } = so;
    return {
      id,
      name,
      judgmentCount: judgments.length,
      createdAt,
      createdBy,
      updatedAt,
      updatedBy,
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
