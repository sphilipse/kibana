/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { PerQueryScore, ClientMetrics } from '../../../common/types';

interface ClientMetricsOptions {
  passThreshold?: number;
}

const DEFAULT_PASS_THRESHOLD = 0.5;

export const computeClientMetrics = (
  perQueryScores: PerQueryScore[],
  options: ClientMetricsOptions = {}
): ClientMetrics => {
  const { passThreshold = DEFAULT_PASS_THRESHOLD } = options;
  const n = perQueryScores.length;

  if (n === 0) {
    return {
      totalQueries: 0,
      medianScore: 0,
      scoreStandardDeviation: 0,
      minScore: 0,
      maxScore: 0,
      queryPassRate: 0,
      queriesWithUnratedDocs: 0,
      unratedDocRate: 0,
    };
  }

  const scores = perQueryScores.map((s) => s.score);
  const sorted = [...scores].sort((a, b) => a - b);

  const medianScore =
    n % 2 === 1
      ? sorted[Math.floor(n / 2)]
      : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;

  const mean = scores.reduce((sum, s) => sum + s, 0) / n;
  const variance = scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / n;
  const scoreStandardDeviation = Math.sqrt(variance);

  const minScore = sorted[0];
  const maxScore = sorted[n - 1];

  const passingQueries = scores.filter((s) => s >= passThreshold).length;
  const queryPassRate = passingQueries / n;

  const queriesWithUnratedDocs = perQueryScores.filter((s) => s.unratedDocs > 0).length;
  const unratedDocRate = queriesWithUnratedDocs / n;

  return {
    totalQueries: n,
    medianScore,
    scoreStandardDeviation,
    minScore,
    maxScore,
    queryPassRate,
    queriesWithUnratedDocs,
    unratedDocRate,
  };
};
