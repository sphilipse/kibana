/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

export enum SearchPlaygroundQueryKeys {
  PlaygroundsList = 'searchPlaygroundPlaygroundsList',
  SearchPlaygroundMutationKeys = 'search-preview-results',
  SearchPreviewResults = 'searchPlaygroundSearchPreviewResults',
  SearchQueryTest = 'searchPlaygroundQueryTest',
  LoadConnectors = 'searchPlaygroundLoadConnectors',
  LLMsQuery = 'searchPlaygroundLLMsQuery',
  QueryIndices = 'searchPlaygroundQueryIndices',
  IndicesFields = 'searchPlaygroundIndicesFields',
  IndexMappings = 'searchPlaygroundIndexMappings',
  JudgmentSetsList = 'searchPlaygroundJudgmentSetsList',
  JudgmentSet = 'searchPlaygroundJudgmentSet',
  EvaluationRunsList = 'searchPlaygroundEvaluationRunsList',
  EvaluationRun = 'searchPlaygroundEvaluationRun',
}

export enum SearchPlaygroundMutationKeys {
  DeletePlayground = 'searchPlaygroundDeletePlayground',
  SavePlayground = 'searchPlaygroundSavePlayground',
  UpdatePlayground = 'searchPlaygroundUpdatePlayground',
  CreateJudgmentSet = 'searchPlaygroundCreateJudgmentSet',
  UpdateJudgmentSet = 'searchPlaygroundUpdateJudgmentSet',
  DeleteJudgmentSet = 'searchPlaygroundDeleteJudgmentSet',
  RunEvaluation = 'searchPlaygroundRunEvaluation',
  DeleteEvaluationRun = 'searchPlaygroundDeleteEvaluationRun',
}
