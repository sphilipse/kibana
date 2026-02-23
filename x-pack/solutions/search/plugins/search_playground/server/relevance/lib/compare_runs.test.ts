/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SavedObject } from '@kbn/core/server';
import type { EvaluationRunSavedObject } from '../../../common/types';
import { compareRuns } from './compare_runs';

const makeRunSO = (
  id: string,
  overrides: Partial<EvaluationRunSavedObject> = {}
): SavedObject<EvaluationRunSavedObject> =>
  ({
    id,
    type: 'search_evaluation_run',
    attributes: {
      judgmentSetId: 'js-1',
      timestamp: '2026-02-16T00:00:00Z',
      queryTemplateJSON: '{"query":{"match_all":{}}}',
      metric: { type: 'ndcg', params: { k: 10 } },
      overallScore: 0.5,
      perQueryScores: [],
      ...overrides,
    },
    references: [],
  } as unknown as SavedObject<EvaluationRunSavedObject>);

describe('compareRuns', () => {
  it('returns the correct run IDs', () => {
    const baseline = makeRunSO('run-a');
    const comparison = makeRunSO('run-b');
    const result = compareRuns(baseline, comparison);

    expect(result.baselineRunId).toBe('run-a');
    expect(result.comparisonRunId).toBe('run-b');
  });

  it('computes scoreDelta as comparison minus baseline', () => {
    const baseline = makeRunSO('run-a', { overallScore: 0.6 });
    const comparison = makeRunSO('run-b', { overallScore: 0.85 });
    const result = compareRuns(baseline, comparison);

    expect(result.baselineScore).toBe(0.6);
    expect(result.comparisonScore).toBe(0.85);
    expect(result.scoreDelta).toBeCloseTo(0.25, 10);
  });

  it('computes per-query deltas for matching queries', () => {
    const baseline = makeRunSO('run-a', {
      overallScore: 0.7,
      perQueryScores: [
        { query: 'q1', score: 0.6, unratedDocs: 0 },
        { query: 'q2', score: 0.8, unratedDocs: 0 },
      ],
    });
    const comparison = makeRunSO('run-b', {
      overallScore: 0.85,
      perQueryScores: [
        { query: 'q1', score: 0.9, unratedDocs: 0 },
        { query: 'q2', score: 0.8, unratedDocs: 0 },
      ],
    });

    const result = compareRuns(baseline, comparison);

    expect(result.perQueryComparison).toEqual([
      {
        query: 'q1',
        baselineScore: 0.6,
        comparisonScore: 0.9,
        delta: expect.closeTo(0.3, 10),
        improved: true,
        regressed: false,
      },
      {
        query: 'q2',
        baselineScore: 0.8,
        comparisonScore: 0.8,
        delta: 0,
        improved: false,
        regressed: false,
      },
    ]);
  });

  it('marks regressions when comparison score is lower', () => {
    const baseline = makeRunSO('run-a', {
      overallScore: 0.9,
      perQueryScores: [{ query: 'q1', score: 0.9, unratedDocs: 0 }],
    });
    const comparison = makeRunSO('run-b', {
      overallScore: 0.5,
      perQueryScores: [{ query: 'q1', score: 0.5, unratedDocs: 0 }],
    });

    const result = compareRuns(baseline, comparison);

    expect(result.perQueryComparison[0]).toMatchObject({
      improved: false,
      regressed: true,
      delta: expect.closeTo(-0.4, 10),
    });
  });

  it('defaults baseline score to 0 for queries only in comparison', () => {
    const baseline = makeRunSO('run-a', {
      overallScore: 0.5,
      perQueryScores: [{ query: 'q1', score: 0.5, unratedDocs: 0 }],
    });
    const comparison = makeRunSO('run-b', {
      overallScore: 0.6,
      perQueryScores: [
        { query: 'q1', score: 0.6, unratedDocs: 0 },
        { query: 'q-new', score: 0.7, unratedDocs: 0 },
      ],
    });

    const result = compareRuns(baseline, comparison);

    const newQuery = result.perQueryComparison.find((q) => q.query === 'q-new');
    expect(newQuery).toEqual({
      query: 'q-new',
      baselineScore: 0,
      comparisonScore: 0.7,
      delta: 0.7,
      improved: true,
      regressed: false,
    });
  });

  it('includes queries only in baseline as regressions to zero', () => {
    const baseline = makeRunSO('run-a', {
      overallScore: 0.8,
      perQueryScores: [
        { query: 'q1', score: 0.8, unratedDocs: 0 },
        { query: 'q-removed', score: 0.9, unratedDocs: 0 },
      ],
    });
    const comparison = makeRunSO('run-b', {
      overallScore: 0.8,
      perQueryScores: [{ query: 'q1', score: 0.8, unratedDocs: 0 }],
    });

    const result = compareRuns(baseline, comparison);

    const removedQuery = result.perQueryComparison.find((q) => q.query === 'q-removed');
    expect(removedQuery).toEqual({
      query: 'q-removed',
      baselineScore: 0.9,
      comparisonScore: 0,
      delta: -0.9,
      improved: false,
      regressed: true,
    });
  });

  it('does not mark removed zero-score queries as regressed', () => {
    const baseline = makeRunSO('run-a', {
      overallScore: 0.5,
      perQueryScores: [{ query: 'q-zero', score: 0, unratedDocs: 0 }],
    });
    const comparison = makeRunSO('run-b', {
      overallScore: 0.5,
      perQueryScores: [],
    });

    const result = compareRuns(baseline, comparison);

    const zeroQuery = result.perQueryComparison.find((q) => q.query === 'q-zero');
    expect(zeroQuery).toMatchObject({
      regressed: false,
    });
    expect(Math.abs(zeroQuery!.delta)).toBe(0);
  });

  it('handles both runs having empty per-query scores', () => {
    const baseline = makeRunSO('run-a', { overallScore: 0, perQueryScores: [] });
    const comparison = makeRunSO('run-b', { overallScore: 0, perQueryScores: [] });

    const result = compareRuns(baseline, comparison);

    expect(result.perQueryComparison).toEqual([]);
    expect(result.scoreDelta).toBe(0);
  });

  it('handles negative score deltas correctly', () => {
    const baseline = makeRunSO('run-a', { overallScore: 0.9 });
    const comparison = makeRunSO('run-b', { overallScore: 0.3 });

    const result = compareRuns(baseline, comparison);

    expect(result.scoreDelta).toBeCloseTo(-0.6, 10);
  });
});
