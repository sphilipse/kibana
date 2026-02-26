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
  IndexConfigResponse,
  PipelineListResponse,
  PipelineInfo,
} from '../types';
import { APIRoutes } from '../types';
import { useKibana } from './use_kibana';

export const useIndexConfig = (indices: string[]) => {
  const { http } = useKibana().services;

  return useQuery({
    queryKey: [SearchPlaygroundQueryKeys.IndexConfig, ...indices],
    queryFn: async () =>
      http.post<IndexConfigResponse>(APIRoutes.POST_INDEX_CONFIG, {
        body: JSON.stringify({ indices }),
        version: ROUTE_VERSIONS.v1,
      }),
    enabled: indices.length > 0,
  });
};

/** Fetches all ingest pipelines in the cluster, including system/managed ones. */
export const usePipelines = () => {
  const { http } = useKibana().services;

  return useQuery({
    queryKey: [SearchPlaygroundQueryKeys.Pipelines],
    queryFn: async () =>
      http.get<PipelineListResponse>(APIRoutes.GET_PIPELINES, {
        version: ROUTE_VERSIONS.v1,
      }),
  });
};

export const useUpdateIndexSettings = () => {
  const { http } = useKibana().services;
  const queryClient = useQueryClient();

  const { mutate, isLoading, error } = useMutation<
    { settings: Record<string, unknown> },
    Error,
    { index: string; settings: Record<string, unknown> }
  >({
    mutationKey: [SearchPlaygroundMutationKeys.UpdateIndexSettings],
    mutationFn: (request) =>
      http.put(APIRoutes.PUT_INDEX_SETTINGS, {
        body: JSON.stringify(request),
        version: ROUTE_VERSIONS.v1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SearchPlaygroundQueryKeys.IndexConfig],
      });
    },
  });

  return { updateSettings: mutate, isLoading, error };
};

export const useUpdateIndexMappings = () => {
  const { http } = useKibana().services;
  const queryClient = useQueryClient();

  const { mutate, isLoading, error } = useMutation<
    { mappings: Record<string, unknown> },
    Error,
    { index: string; mappings: Record<string, unknown> }
  >({
    mutationKey: [SearchPlaygroundMutationKeys.UpdateIndexMappings],
    mutationFn: (request) =>
      http.put(APIRoutes.PUT_INDEX_MAPPINGS, {
        body: JSON.stringify(request),
        version: ROUTE_VERSIONS.v1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SearchPlaygroundQueryKeys.IndexConfig],
      });
    },
  });

  return { updateMappings: mutate, isLoading, error };
};

export const useUpdatePipeline = () => {
  const { http } = useKibana().services;
  const queryClient = useQueryClient();

  const { mutate, isLoading, error } = useMutation<
    PipelineInfo,
    Error,
    { id: string; description?: string; processors: unknown[] }
  >({
    mutationKey: [SearchPlaygroundMutationKeys.UpdatePipeline],
    mutationFn: ({ id, ...body }) =>
      http.put(APIRoutes.PUT_PIPELINE.replace('{id}', id), {
        body: JSON.stringify(body),
        version: ROUTE_VERSIONS.v1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SearchPlaygroundQueryKeys.Pipelines],
      });
    },
  });

  return { updatePipeline: mutate, isLoading, error };
};
