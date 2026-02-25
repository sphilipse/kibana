/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useQuery, useMutation, useQueryClient } from '@kbn/react-query';

import {
  ROUTE_VERSIONS,
  SearchPlaygroundQueryKeys,
  SearchPlaygroundMutationKeys,
} from '../../common';
import type {
  EvaluationRunListResponse,
  EvaluationRunResponse,
  RunComparisonResult,
} from '../types';
import { APIRoutes } from '../types';
import { useKibana } from './use_kibana';

export interface UseEvaluationRunsListParameters {
  page?: number;
  size?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  judgmentSetId?: string;
}

export const useEvaluationRunsList = ({
  page = 1,
  size = 10,
  sortField = 'updated_at',
  sortOrder = 'desc',
  judgmentSetId,
}: UseEvaluationRunsListParameters) => {
  const { http } = useKibana().services;

  return useQuery({
    queryKey: [SearchPlaygroundQueryKeys.EvaluationRunsList, page, size, sortField, sortOrder, judgmentSetId],
    queryFn: async () =>
      http.get<EvaluationRunListResponse>(APIRoutes.GET_EVALUATION_RUNS, {
        query: {
          page,
          size,
          sortField,
          sortOrder,
          ...(judgmentSetId && { judgmentSetId }),
        },
        version: ROUTE_VERSIONS.v1,
      }),
  });
};

export const useEvaluationRun = (id: string) => {
  const { http } = useKibana().services;

  return useQuery({
    queryKey: [SearchPlaygroundQueryKeys.EvaluationRun, id],
    queryFn: async () =>
      http.get<EvaluationRunResponse>(APIRoutes.GET_EVALUATION_RUN.replace('{id}', id), {
        version: ROUTE_VERSIONS.v1,
      }),
    enabled: !!id,
  });
};

export const useDeleteEvaluationRun = () => {
  const { http } = useKibana().services;
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationKey: [SearchPlaygroundMutationKeys.DeleteEvaluationRun],
    mutationFn: (id: string) =>
      http.delete(APIRoutes.DELETE_EVALUATION_RUN.replace('{id}', id), {
        version: ROUTE_VERSIONS.v1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SearchPlaygroundQueryKeys.EvaluationRunsList],
      });
    },
  });

  return { deleteEvaluationRun: mutate };
};

export const useCompareRuns = () => {
  const { http } = useKibana().services;

  const { mutate, data, isLoading } = useMutation({
    mutationFn: ({
      baselineRunId,
      comparisonRunId,
    }: {
      baselineRunId: string;
      comparisonRunId: string;
    }) =>
      http.post<RunComparisonResult>(APIRoutes.POST_COMPARE_RUNS, {
        body: JSON.stringify({ baselineRunId, comparisonRunId }),
        version: ROUTE_VERSIONS.v1,
      }),
  });

  return { compareRuns: mutate, data, isLoading };
};
