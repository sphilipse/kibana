/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { evaluationRunAttributesSchema } from './v1';

describe('evaluationRunAttributesSchema', () => {
  const validRun = {
    judgmentSetId: 'judgment-set-1',
    name: 'Run 1',
    timestamp: '2026-02-16T00:00:00.000Z',
    queryTemplateJSON: '{"query": {"match": {"title": "{{query}}"}}}',
    metric: {
      type: 'ndcg' as const,
      params: { k: 10 },
    },
    overallScore: 0.85,
    perQueryScores: [
      { query: 'search term', score: 0.9, unratedDocs: 2 },
    ],
  };

  it('validates a valid evaluation run', () => {
    expect(() => evaluationRunAttributesSchema.validate(validRun)).not.toThrow();
  });

  it('requires a judgmentSetId', () => {
    const { judgmentSetId, ...rest } = validRun;
    expect(() => evaluationRunAttributesSchema.validate(rest)).toThrow();
  });

  it('requires a timestamp', () => {
    const { timestamp, ...rest } = validRun;
    expect(() => evaluationRunAttributesSchema.validate(rest)).toThrow();
  });

  it('requires a queryTemplateJSON', () => {
    const { queryTemplateJSON, ...rest } = validRun;
    expect(() => evaluationRunAttributesSchema.validate(rest)).toThrow();
  });

  it('requires a metric with a valid type', () => {
    expect(() =>
      evaluationRunAttributesSchema.validate({
        ...validRun,
        metric: { type: 'invalid_metric', params: {} },
      })
    ).toThrow();
  });

  it('accepts all valid metric types', () => {
    const metricTypes = [
      'precision',
      'recall',
      'mean_reciprocal_rank',
      'dcg',
      'ndcg',
      'expected_reciprocal_rank',
    ];
    for (const type of metricTypes) {
      expect(() =>
        evaluationRunAttributesSchema.validate({
          ...validRun,
          metric: { type, params: {} },
        })
      ).not.toThrow();
    }
  });

  it('allows name to be optional', () => {
    const { name, ...rest } = validRun;
    expect(() => evaluationRunAttributesSchema.validate(rest)).not.toThrow();
  });

  it('allows indexSettingsSnapshot to be optional', () => {
    expect(() =>
      evaluationRunAttributesSchema.validate({
        ...validRun,
        indexSettingsSnapshot: { 'my-index': { analysis: {} } },
      })
    ).not.toThrow();
  });

  it('requires perQueryScores to have query, score, and unratedDocs', () => {
    expect(() =>
      evaluationRunAttributesSchema.validate({
        ...validRun,
        perQueryScores: [{ query: 'q' }],
      })
    ).toThrow();
  });
});
