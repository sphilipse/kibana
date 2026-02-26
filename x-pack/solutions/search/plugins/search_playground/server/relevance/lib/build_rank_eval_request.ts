/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RankEvalRequest } from '@elastic/elasticsearch/lib/api/types';
import type { JudgmentSetSavedObject, MetricConfig } from '../../../common/types';

export const buildRankEvalRequest = (
  judgmentSet: JudgmentSetSavedObject,
  queryTemplate: Record<string, unknown>,
  metric: MetricConfig,
  indices: string[]
): RankEvalRequest => {
  const ratings = judgmentSet.judgments.map(({ index: idx, id: docId, rating }) => ({
    _index: idx,
    _id: docId,
    rating,
  }));

  return {
    index: indices,
    requests: [
      {
        id: judgmentSet.query,
        request: queryTemplate,
        params: { query: judgmentSet.query },
        ratings,
      },
    ],
    metric: { [metric.type]: metric.params },
  };
};
