/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';

export const metricConfigSchema = schema.object({
  type: schema.oneOf([
    schema.literal('precision'),
    schema.literal('recall'),
    schema.literal('mean_reciprocal_rank'),
    schema.literal('dcg'),
    schema.literal('ndcg'),
    schema.literal('expected_reciprocal_rank'),
  ]),
  params: schema.recordOf(schema.string(), schema.any()),
});

const perQueryScoreSchema = schema.object({
  query: schema.string(),
  score: schema.number(),
  unratedDocs: schema.number(),
});

const clientMetricsSchema = schema.object({
  totalQueries: schema.number(),
  medianScore: schema.number(),
  scoreStandardDeviation: schema.number(),
  minScore: schema.number(),
  maxScore: schema.number(),
  queryPassRate: schema.number(),
  queriesWithUnratedDocs: schema.number(),
  unratedDocRate: schema.number(),
});

export const evaluationRunAttributesSchema = schema.object({
  judgmentSetId: schema.string(),
  name: schema.maybe(schema.string()),
  timestamp: schema.string(),
  queryTemplateJSON: schema.string(),
  metric: metricConfigSchema,
  overallScore: schema.number(),
  perQueryScores: schema.arrayOf(perQueryScoreSchema),
  clientMetrics: schema.maybe(clientMetricsSchema),
  indexSettingsSnapshot: schema.maybe(schema.recordOf(schema.string(), schema.any())),
});
