/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useMutation, useQueryClient } from '@kbn/react-query';

import {
  ROUTE_VERSIONS,
  SearchPlaygroundQueryKeys,
  SearchPlaygroundMutationKeys,
} from '../../common';
import type {
  EvaluationRunResponse,
  RankEvalMetricType,
} from '../types';
import { APIRoutes } from '../types';
import { useKibana } from './use_kibana';

export interface EvaluateRequest {
  judgmentSetId: string;
  queryTemplateJSON: string;
  metric: {
    type: RankEvalMetricType;
    params: Record<string, unknown>;
  };
  indices: string[];
  name?: string;
  passThreshold?: number;
}

export const useRunEvaluation = () => {
  const { http } = useKibana().services;
  const queryClient = useQueryClient();

  const { mutate, isLoading: isRunning, error } = useMutation<EvaluationRunResponse, Error, EvaluateRequest>({
    mutationKey: [SearchPlaygroundMutationKeys.RunEvaluation],
    mutationFn: (request) =>
      http.post<EvaluationRunResponse>(APIRoutes.POST_EVALUATE, {
        body: JSON.stringify(request),
        version: ROUTE_VERSIONS.v1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SearchPlaygroundQueryKeys.EvaluationRunsList],
      });
    },
  });

  return { runEvaluation: mutate, isRunning, error };
};
