/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@kbn/react-query';

import { useKibana } from './use_kibana';
import {
  useIndexConfig,
  usePipelines,
  useUpdateIndexSettings,
  useUpdateIndexMappings,
  useUpdatePipeline,
} from './use_index_config';

jest.mock('./use_kibana', () => ({
  useKibana: jest.fn(),
}));

const mockHttp = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
};

const mockedUseKibana = useKibana as jest.MockedFunction<typeof useKibana>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { Wrapper, queryClient };
};

describe('useIndexConfig hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseKibana.mockReturnValue({
      services: { http: mockHttp },
    } as unknown as ReturnType<typeof useKibana>);
  });

  describe('useIndexConfig', () => {
    it('fetches index config for given indices', async () => {
      const mockData = {
        settings: { 'my-index': { index: { number_of_shards: '1' } } },
        mappings: { 'my-index': { properties: { title: { type: 'text' } } } },
      };
      mockHttp.post.mockResolvedValue(mockData);
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useIndexConfig(['my-index']), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockData);
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/internal/search_playground/relevance/index_config',
        expect.objectContaining({
          body: JSON.stringify({ indices: ['my-index'] }),
          version: '1',
        })
      );
    });

    it('is disabled when indices array is empty', async () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useIndexConfig([]), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
      expect(mockHttp.post).not.toHaveBeenCalled();
    });

    it('handles errors', async () => {
      mockHttp.post.mockRejectedValue(new Error('Failed to fetch'));
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useIndexConfig(['my-index']), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(new Error('Failed to fetch'));
    });
  });

  describe('usePipelines', () => {
    it('fetches list of pipelines', async () => {
      const mockData = {
        pipelines: [
          { id: 'p1', description: 'Pipeline 1', processors: [] },
        ],
      };
      mockHttp.get.mockResolvedValue(mockData);
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => usePipelines(), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockData);
      expect(mockHttp.get).toHaveBeenCalledWith(
        '/internal/search_playground/relevance/pipelines',
        expect.objectContaining({ version: '1' })
      );
    });
  });

  describe('useUpdateIndexSettings', () => {
    it('sends update request and invalidates cache', async () => {
      mockHttp.put.mockResolvedValue({ settings: { index: { number_of_replicas: '2' } } });
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateIndexSettings(), {
        wrapper: Wrapper,
      });

      act(() => {
        result.current.updateSettings({
          index: 'my-index',
          settings: { index: { number_of_replicas: '2' } },
        });
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(mockHttp.put).toHaveBeenCalledWith(
        '/internal/search_playground/relevance/index_config/settings',
        expect.objectContaining({
          body: JSON.stringify({
            index: 'my-index',
            settings: { index: { number_of_replicas: '2' } },
          }),
        })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['searchPlaygroundIndexConfig'],
        })
      );
    });

    it('exposes error on failure', async () => {
      mockHttp.put.mockRejectedValue(new Error('Update failed'));
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useUpdateIndexSettings(), {
        wrapper: Wrapper,
      });

      act(() => {
        result.current.updateSettings({
          index: 'my-index',
          settings: {},
        });
      });

      await waitFor(() => expect(result.current.error).not.toBeNull());
      expect(result.current.error).toEqual(new Error('Update failed'));
    });
  });

  describe('useUpdateIndexMappings', () => {
    it('sends update request and invalidates cache', async () => {
      mockHttp.put.mockResolvedValue({ mappings: { properties: {} } });
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateIndexMappings(), {
        wrapper: Wrapper,
      });

      act(() => {
        result.current.updateMappings({
          index: 'my-index',
          mappings: { properties: { title: { type: 'text' } } },
        });
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(mockHttp.put).toHaveBeenCalledWith(
        '/internal/search_playground/relevance/index_config/mappings',
        expect.objectContaining({
          body: JSON.stringify({
            index: 'my-index',
            mappings: { properties: { title: { type: 'text' } } },
          }),
        })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['searchPlaygroundIndexConfig'],
        })
      );
    });
  });

  describe('useUpdatePipeline', () => {
    it('sends update request and invalidates pipelines cache', async () => {
      mockHttp.put.mockResolvedValue({
        id: 'my-pipeline',
        description: 'Updated',
        processors: [],
      });
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdatePipeline(), {
        wrapper: Wrapper,
      });

      act(() => {
        result.current.updatePipeline({
          id: 'my-pipeline',
          description: 'Updated',
          processors: [],
        });
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(mockHttp.put).toHaveBeenCalledWith(
        '/internal/search_playground/relevance/pipelines/my-pipeline',
        expect.objectContaining({
          body: JSON.stringify({ description: 'Updated', processors: [] }),
        })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['searchPlaygroundPipelines'],
        })
      );
    });

    it('exposes error on failure', async () => {
      mockHttp.put.mockRejectedValue(new Error('Pipeline update failed'));
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useUpdatePipeline(), {
        wrapper: Wrapper,
      });

      act(() => {
        result.current.updatePipeline({
          id: 'my-pipeline',
          processors: [{ set: { field: 'a', value: 'b' } }],
        });
      });

      await waitFor(() => expect(result.current.error).not.toBeNull());
      expect(result.current.error).toEqual(new Error('Pipeline update failed'));
    });
  });
});
