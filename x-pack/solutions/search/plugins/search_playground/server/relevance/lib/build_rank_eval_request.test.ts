/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { JudgmentSetSavedObject, MetricConfig } from '../../../common/types';
import { buildRankEvalRequest } from './build_rank_eval_request';

describe('buildRankEvalRequest', () => {
  const judgmentSet: JudgmentSetSavedObject = {
    name: 'Test Judgments',
    indices: ['my-index'],
    judgments: [
      {
        query: 'laptop',
        ratings: [
          { index: 'products', id: 'doc1', rating: 3 },
          { index: 'products', id: 'doc2', rating: 1 },
        ],
      },
      {
        query: 'keyboard',
        ratings: [{ index: 'products', id: 'doc3', rating: 2 }],
      },
    ],
  };

  const queryTemplate = { query: { match: { title: '{{query}}' } } };

  it('produces one request entry per judgment', () => {
    const metric: MetricConfig = { type: 'ndcg', params: { k: 10 } };
    const result = buildRankEvalRequest(judgmentSet, queryTemplate, metric, ['products']);

    expect(result.requests).toHaveLength(2);
  });

  it('maps judgment query to request id and params', () => {
    const metric: MetricConfig = { type: 'precision', params: {} };
    const result = buildRankEvalRequest(judgmentSet, queryTemplate, metric, ['products']);

    expect(result.requests[0]).toMatchObject({
      id: 'laptop',
      params: { query: 'laptop' },
    });
    expect(result.requests[1]).toMatchObject({
      id: 'keyboard',
      params: { query: 'keyboard' },
    });
  });

  it('passes the query template as the request body for each entry', () => {
    const metric: MetricConfig = { type: 'ndcg', params: {} };
    const result = buildRankEvalRequest(judgmentSet, queryTemplate, metric, ['products']);

    for (const req of result.requests) {
      expect(req.request).toEqual(queryTemplate);
    }
  });

  it('maps ratings using _index and _id at the ES API boundary', () => {
    const metric: MetricConfig = { type: 'ndcg', params: {} };
    const result = buildRankEvalRequest(judgmentSet, queryTemplate, metric, ['products']);

    expect(result.requests[0].ratings).toEqual([
      { _index: 'products', _id: 'doc1', rating: 3 },
      { _index: 'products', _id: 'doc2', rating: 1 },
    ]);
    expect(result.requests[1].ratings).toEqual([
      { _index: 'products', _id: 'doc3', rating: 2 },
    ]);
  });

  it('sets the target indices on the request', () => {
    const metric: MetricConfig = { type: 'ndcg', params: {} };
    const result = buildRankEvalRequest(judgmentSet, queryTemplate, metric, [
      'products',
      'catalog',
    ]);

    expect(result.index).toEqual(['products', 'catalog']);
  });

  it('maps metric type and params using the metric type as the key', () => {
    const metric: MetricConfig = { type: 'ndcg', params: { k: 10, normalize: true } };
    const result = buildRankEvalRequest(judgmentSet, queryTemplate, metric, ['products']);

    expect(result.metric).toEqual({ ndcg: { k: 10, normalize: true } });
  });

  it('handles all supported metric types', () => {
    const metricTypes = [
      'precision',
      'recall',
      'mean_reciprocal_rank',
      'dcg',
      'ndcg',
      'expected_reciprocal_rank',
    ] as const;

    for (const type of metricTypes) {
      const metric: MetricConfig = { type, params: { k: 5 } };
      const result = buildRankEvalRequest(judgmentSet, queryTemplate, metric, ['products']);

      expect(result.metric).toEqual({ [type]: { k: 5 } });
    }
  });

  it('handles an empty judgments array', () => {
    const emptySet: JudgmentSetSavedObject = {
      name: 'Empty',
      indices: ['products'],
      judgments: [],
    };
    const metric: MetricConfig = { type: 'ndcg', params: {} };
    const result = buildRankEvalRequest(emptySet, queryTemplate, metric, ['products']);

    expect(result.requests).toEqual([]);
  });

  it('handles a judgment with no ratings', () => {
    const setWithEmptyRatings: JudgmentSetSavedObject = {
      name: 'Sparse',
      indices: ['products'],
      judgments: [{ query: 'orphan query', ratings: [] }],
    };
    const metric: MetricConfig = { type: 'precision', params: {} };
    const result = buildRankEvalRequest(setWithEmptyRatings, queryTemplate, metric, ['products']);

    expect(result.requests).toHaveLength(1);
    expect(result.requests[0].ratings).toEqual([]);
  });

  it('handles complex query templates', () => {
    const complexTemplate = {
      query: {
        bool: {
          must: [{ match: { title: '{{query}}' } }],
          filter: [{ term: { status: 'published' } }],
        },
      },
      size: 20,
    };
    const metric: MetricConfig = { type: 'ndcg', params: { k: 20 } };
    const result = buildRankEvalRequest(judgmentSet, complexTemplate, metric, ['products']);

    expect(result.requests[0].request).toEqual(complexTemplate);
  });

  it('handles ratings from multiple indices', () => {
    const multiIndexSet: JudgmentSetSavedObject = {
      name: 'Multi-index',
      indices: ['products', 'catalog'],
      judgments: [
        {
          query: 'laptop',
          ratings: [
            { index: 'products', id: 'p1', rating: 3 },
            { index: 'catalog', id: 'c1', rating: 2 },
          ],
        },
      ],
    };
    const metric: MetricConfig = { type: 'ndcg', params: {} };
    const result = buildRankEvalRequest(multiIndexSet, queryTemplate, metric, [
      'products',
      'catalog',
    ]);

    expect(result.requests[0].ratings).toEqual([
      { _index: 'products', _id: 'p1', rating: 3 },
      { _index: 'catalog', _id: 'c1', rating: 2 },
    ]);
  });

  it('preserves metric params with empty object', () => {
    const metric: MetricConfig = { type: 'recall', params: {} };
    const result = buildRankEvalRequest(judgmentSet, queryTemplate, metric, ['products']);

    expect(result.metric).toEqual({ recall: {} });
  });
});
