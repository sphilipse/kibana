/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { PerQueryScore } from '../../../common/types';
import { computeClientMetrics } from './compute_client_metrics';

const makeScores = (...scores: Array<[string, number, number]>): PerQueryScore[] =>
  scores.map(([query, score, unratedDocs]) => ({ query, score, unratedDocs }));

describe('computeClientMetrics', () => {
  describe('medianScore', () => {
    it('returns the median for an odd number of queries', () => {
      const scores = makeScores(['q1', 0.3, 0], ['q2', 0.5, 0], ['q3', 0.9, 0]);
      const result = computeClientMetrics(scores);

      expect(result.medianScore).toBe(0.5);
    });

    it('returns the average of two middle values for an even number of queries', () => {
      const scores = makeScores(['q1', 0.2, 0], ['q2', 0.4, 0], ['q3', 0.6, 0], ['q4', 0.8, 0]);
      const result = computeClientMetrics(scores);

      expect(result.medianScore).toBe(0.5);
    });

    it('returns 0 for empty scores', () => {
      const result = computeClientMetrics([]);

      expect(result.medianScore).toBe(0);
    });

    it('returns the single score for one query', () => {
      const scores = makeScores(['q1', 0.75, 0]);
      const result = computeClientMetrics(scores);

      expect(result.medianScore).toBe(0.75);
    });
  });

  describe('scoreStandardDeviation', () => {
    it('returns 0 for a single query', () => {
      const scores = makeScores(['q1', 0.5, 0]);
      const result = computeClientMetrics(scores);

      expect(result.scoreStandardDeviation).toBe(0);
    });

    it('returns 0 when all scores are identical', () => {
      const scores = makeScores(['q1', 0.5, 0], ['q2', 0.5, 0], ['q3', 0.5, 0]);
      const result = computeClientMetrics(scores);

      expect(result.scoreStandardDeviation).toBe(0);
    });

    it('computes population standard deviation', () => {
      // scores: 0.2, 0.4, 0.6, 0.8 -> mean = 0.5 -> var = 0.05 -> std = ~0.2236
      const scores = makeScores(['q1', 0.2, 0], ['q2', 0.4, 0], ['q3', 0.6, 0], ['q4', 0.8, 0]);
      const result = computeClientMetrics(scores);

      expect(result.scoreStandardDeviation).toBeCloseTo(0.2236, 3);
    });

    it('returns 0 for empty scores', () => {
      const result = computeClientMetrics([]);

      expect(result.scoreStandardDeviation).toBe(0);
    });
  });

  describe('minScore and maxScore', () => {
    it('finds the min and max from multiple queries', () => {
      const scores = makeScores(['q1', 0.3, 0], ['q2', 0.9, 0], ['q3', 0.1, 0], ['q4', 0.7, 0]);
      const result = computeClientMetrics(scores);

      expect(result.minScore).toBe(0.1);
      expect(result.maxScore).toBe(0.9);
    });

    it('returns 0 for both when scores are empty', () => {
      const result = computeClientMetrics([]);

      expect(result.minScore).toBe(0);
      expect(result.maxScore).toBe(0);
    });

    it('returns the same value when there is one query', () => {
      const scores = makeScores(['q1', 0.42, 0]);
      const result = computeClientMetrics(scores);

      expect(result.minScore).toBe(0.42);
      expect(result.maxScore).toBe(0.42);
    });
  });

  describe('queryPassRate', () => {
    it('uses the default threshold of 0.5', () => {
      const scores = makeScores(
        ['q1', 0.3, 0],
        ['q2', 0.5, 0],
        ['q3', 0.7, 0],
        ['q4', 0.9, 0]
      );
      const result = computeClientMetrics(scores);

      // 0.5, 0.7, 0.9 all >= 0.5 → 3/4
      expect(result.queryPassRate).toBe(0.75);
    });

    it('accepts a custom threshold', () => {
      const scores = makeScores(['q1', 0.3, 0], ['q2', 0.5, 0], ['q3', 0.7, 0]);
      const result = computeClientMetrics(scores, { passThreshold: 0.6 });

      // only 0.7 >= 0.6 → 1/3
      expect(result.queryPassRate).toBeCloseTo(1 / 3, 10);
    });

    it('returns 0 for empty scores', () => {
      const result = computeClientMetrics([]);

      expect(result.queryPassRate).toBe(0);
    });

    it('returns 1 when all queries pass', () => {
      const scores = makeScores(['q1', 0.8, 0], ['q2', 0.9, 0]);
      const result = computeClientMetrics(scores, { passThreshold: 0.5 });

      expect(result.queryPassRate).toBe(1);
    });

    it('returns 0 when no queries pass', () => {
      const scores = makeScores(['q1', 0.1, 0], ['q2', 0.2, 0]);
      const result = computeClientMetrics(scores, { passThreshold: 0.5 });

      expect(result.queryPassRate).toBe(0);
    });
  });

  describe('unrated doc metrics', () => {
    it('counts queries with unrated docs', () => {
      const scores = makeScores(['q1', 0.5, 3], ['q2', 0.7, 0], ['q3', 0.8, 1]);
      const result = computeClientMetrics(scores);

      expect(result.queriesWithUnratedDocs).toBe(2);
    });

    it('computes the fraction of queries with unrated docs', () => {
      const scores = makeScores(['q1', 0.5, 3], ['q2', 0.7, 0], ['q3', 0.8, 1]);
      const result = computeClientMetrics(scores);

      expect(result.unratedDocRate).toBeCloseTo(2 / 3, 10);
    });

    it('returns 0 when no queries have unrated docs', () => {
      const scores = makeScores(['q1', 0.5, 0], ['q2', 0.7, 0]);
      const result = computeClientMetrics(scores);

      expect(result.queriesWithUnratedDocs).toBe(0);
      expect(result.unratedDocRate).toBe(0);
    });

    it('returns 0 for empty scores', () => {
      const result = computeClientMetrics([]);

      expect(result.queriesWithUnratedDocs).toBe(0);
      expect(result.unratedDocRate).toBe(0);
    });
  });

  describe('totalQueries', () => {
    it('returns the count of per-query scores', () => {
      const scores = makeScores(['q1', 0.5, 0], ['q2', 0.7, 0]);
      const result = computeClientMetrics(scores);

      expect(result.totalQueries).toBe(2);
    });

    it('returns 0 for empty scores', () => {
      const result = computeClientMetrics([]);

      expect(result.totalQueries).toBe(0);
    });
  });
});
