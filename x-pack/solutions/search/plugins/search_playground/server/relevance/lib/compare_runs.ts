/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SavedObject } from '@kbn/core/server';
import type { EvaluationRunSavedObject, RunComparisonResult } from '../../../common/types';

export const compareRuns = (
  baselineRun: SavedObject<EvaluationRunSavedObject>,
  comparisonRun: SavedObject<EvaluationRunSavedObject>
): RunComparisonResult => {
  const baselineScoreMap = new Map(
    baselineRun.attributes.perQueryScores.map((s) => [s.query, s.score])
  );

  const perQueryComparison = comparisonRun.attributes.perQueryScores.map((compScore) => {
    const baselineScore = baselineScoreMap.get(compScore.query) ?? 0;
    const delta = compScore.score - baselineScore;
    return {
      query: compScore.query,
      baselineScore,
      comparisonScore: compScore.score,
      delta,
      improved: delta > 0,
      regressed: delta < 0,
    };
  });

  // Include queries only in baseline (regressions to zero)
  for (const baselineScore of baselineRun.attributes.perQueryScores) {
    if (!comparisonRun.attributes.perQueryScores.some((s) => s.query === baselineScore.query)) {
      perQueryComparison.push({
        query: baselineScore.query,
        baselineScore: baselineScore.score,
        comparisonScore: 0,
        delta: -baselineScore.score,
        improved: false,
        regressed: baselineScore.score > 0,
      });
    }
  }

  return {
    baselineRunId: baselineRun.id,
    comparisonRunId: comparisonRun.id,
    baselineScore: baselineRun.attributes.overallScore,
    comparisonScore: comparisonRun.attributes.overallScore,
    scoreDelta: comparisonRun.attributes.overallScore - baselineRun.attributes.overallScore,
    perQueryComparison,
  };
};
