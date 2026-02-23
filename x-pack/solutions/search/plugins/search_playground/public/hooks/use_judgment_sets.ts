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
  JudgmentSetListResponse,
  JudgmentSetResponse,
  JudgmentSetSavedObject,
} from '../types';
import { APIRoutes } from '../types';
import { useKibana } from './use_kibana';

export interface UseJudgmentSetsListParameters {
  page: number;
  sortField?: 'name' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

export const useJudgmentSetsList = ({
  page,
  sortField = 'updated_at',
  sortOrder = 'desc',
}: UseJudgmentSetsListParameters) => {
  const { http } = useKibana().services;

  return useQuery({
    queryKey: [SearchPlaygroundQueryKeys.JudgmentSetsList, page, sortField, sortOrder],
    queryFn: async () =>
      http.get<JudgmentSetListResponse>(APIRoutes.GET_JUDGMENT_SETS, {
        query: { page, sortField, sortOrder },
        version: ROUTE_VERSIONS.v1,
      }),
  });
};

export const useJudgmentSet = (id: string) => {
  const { http } = useKibana().services;

  return useQuery({
    queryKey: [SearchPlaygroundQueryKeys.JudgmentSet, id],
    queryFn: async () =>
      http.get<JudgmentSetResponse>(APIRoutes.GET_JUDGMENT_SET.replace('{id}', id), {
        version: ROUTE_VERSIONS.v1,
      }),
    enabled: !!id,
  });
};

export const useCreateJudgmentSet = () => {
  const { http } = useKibana().services;
  const queryClient = useQueryClient();

  const { mutate: createJudgmentSet, ...rest } = useMutation({
    mutationKey: [SearchPlaygroundMutationKeys.CreateJudgmentSet],
    mutationFn: async (judgmentSet: JudgmentSetSavedObject) =>
      http.put<JudgmentSetResponse>(APIRoutes.PUT_JUDGMENT_SET_CREATE, {
        body: JSON.stringify(judgmentSet),
        version: ROUTE_VERSIONS.v1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SearchPlaygroundQueryKeys.JudgmentSetsList],
      });
    },
  });

  return { createJudgmentSet, ...rest };
};

export const useUpdateJudgmentSet = () => {
  const { http } = useKibana().services;
  const queryClient = useQueryClient();

  const { mutate: updateJudgmentSet, ...rest } = useMutation({
    mutationKey: [SearchPlaygroundMutationKeys.UpdateJudgmentSet],
    mutationFn: async ({ id, judgmentSet }: { id: string; judgmentSet: JudgmentSetSavedObject }) =>
      http.put<JudgmentSetResponse>(APIRoutes.PUT_JUDGMENT_SET_UPDATE.replace('{id}', id), {
        body: JSON.stringify(judgmentSet),
        version: ROUTE_VERSIONS.v1,
      }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: [SearchPlaygroundQueryKeys.JudgmentSetsList],
      });
      queryClient.invalidateQueries({
        queryKey: [SearchPlaygroundQueryKeys.JudgmentSet, id],
      });
    },
  });

  return { updateJudgmentSet, ...rest };
};

export const useDeleteJudgmentSet = () => {
  const { http } = useKibana().services;
  const queryClient = useQueryClient();

  const { mutate: deleteJudgmentSet, ...rest } = useMutation({
    mutationKey: [SearchPlaygroundMutationKeys.DeleteJudgmentSet],
    mutationFn: async (id: string) =>
      http.delete(APIRoutes.DELETE_JUDGMENT_SET.replace('{id}', id), {
        version: ROUTE_VERSIONS.v1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SearchPlaygroundQueryKeys.JudgmentSetsList],
      });
    },
  });

  return { deleteJudgmentSet, ...rest };
};
