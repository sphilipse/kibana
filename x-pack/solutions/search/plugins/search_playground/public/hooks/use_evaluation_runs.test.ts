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
  useEvaluationRunsList,
  useEvaluationRun,
  useDeleteEvaluationRun,
  useCompareRuns,
} from './use_evaluation_runs';
import type {
  EvaluationRunListResponse,
  EvaluationRunResponse,
  RunComparisonResult,
} from '../types';

jest.mock('./use_kibana', () => ({
  useKibana: jest.fn(),
}));

const mockHttp = {
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
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

const mockRunListResponse: EvaluationRunListResponse = {
  _meta: { page: 1, size: 10, total: 2 },
  items: [
    {
      id: 'run-1',
      judgmentSetId: 'set-1',
      timestamp: '2026-02-20T00:00:00Z',
      metricType: 'ndcg',
      overallScore: 0.85,
      createdAt: '2026-02-20T00:00:00Z',
    },
    {
      id: 'run-2',
      judgmentSetId: 'set-1',
      timestamp: '2026-02-19T00:00:00Z',
      metricType: 'ndcg',
      overallScore: 0.72,
      createdAt: '2026-02-19T00:00:00Z',
    },
  ],
};

const mockRunResponse: EvaluationRunResponse = {
  _meta: {
    id: 'run-1',
    createdAt: '2026-02-20T00:00:00Z',
  },
  data: {
    judgmentSetId: 'set-1',
    timestamp: '2026-02-20T00:00:00Z',
    queryTemplateJSON: '{"match":{"text":"{{query_string}}"}}',
    metric: { type: 'ndcg', params: { k: 10 } },
    overallScore: 0.85,
    perQueryScores: [
      { query: 'test query', score: 0.85, unratedDocs: 0 },
    ],
  },
};

const mockComparisonResult: RunComparisonResult = {
  baselineRunId: 'run-1',
  comparisonRunId: 'run-2',
  baselineScore: 0.72,
  comparisonScore: 0.85,
  scoreDelta: 0.13,
  perQueryComparison: [
    {
      query: 'test query',
      baselineScore: 0.72,
      comparisonScore: 0.85,
      delta: 0.13,
      improved: true,
      regressed: false,
    },
  ],
};

describe('useEvaluationRuns hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseKibana.mockReturnValue({
      services: { http: mockHttp },
    } as unknown as ReturnType<typeof useKibana>);
  });

  describe('useEvaluationRunsList', () => {
    it('fetches evaluation runs with correct parameters', async () => {
      mockHttp.get.mockResolvedValue(mockRunListResponse);
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useEvaluationRunsList({ page: 1 }), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/internal/search_playground/relevance/runs',
        expect.objectContaining({
          query: { page: 1, size: 10, sortField: 'updated_at', sortOrder: 'desc' },
          version: '1',
        })
      );
      expect(result.current.data).toEqual(mockRunListResponse);
    });

    it('supports filtering by judgmentSetId', async () => {
      mockHttp.get.mockResolvedValue(mockRunListResponse);
      const { Wrapper } = createWrapper();

      const { result } = renderHook(
        () => useEvaluationRunsList({ page: 1, judgmentSetId: 'set-1' }),
        { wrapper: Wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/internal/search_playground/relevance/runs',
        expect.objectContaining({
          query: expect.objectContaining({ judgmentSetId: 'set-1' }),
        })
      );
    });

    it('handles fetch errors', async () => {
      mockHttp.get.mockRejectedValue(new Error('Network error'));
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useEvaluationRunsList({ page: 1 }), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(new Error('Network error'));
    });
  });

  describe('useEvaluationRun', () => {
    it('fetches a single evaluation run by id', async () => {
      mockHttp.get.mockResolvedValue(mockRunResponse);
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useEvaluationRun('run-1'), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/internal/search_playground/relevance/runs/run-1',
        expect.objectContaining({ version: '1' })
      );
      expect(result.current.data).toEqual(mockRunResponse);
    });

    it('does not fetch when id is empty', () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useEvaluationRun(''), { wrapper: Wrapper });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockHttp.get).not.toHaveBeenCalled();
    });
  });

  describe('useDeleteEvaluationRun', () => {
    it('deletes a run and invalidates list cache', async () => {
      mockHttp.delete.mockResolvedValue({});
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteEvaluationRun(), { wrapper: Wrapper });

      act(() => {
        result.current.deleteEvaluationRun('run-1');
      });

      await waitFor(() =>
        expect(mockHttp.delete).toHaveBeenCalledWith(
          '/internal/search_playground/relevance/runs/run-1',
          expect.objectContaining({ version: '1' })
        )
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['searchPlaygroundEvaluationRunsList'],
        })
      );
    });

    it('handles delete errors', async () => {
      mockHttp.delete.mockRejectedValue(new Error('Not found'));
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useDeleteEvaluationRun(), { wrapper: Wrapper });

      act(() => {
        result.current.deleteEvaluationRun('nonexistent-id');
      });

      await waitFor(() => expect(mockHttp.delete).toHaveBeenCalled());
    });
  });

  describe('useCompareRuns', () => {
    it('compares two runs and returns comparison result', async () => {
      mockHttp.post.mockResolvedValue(mockComparisonResult);
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useCompareRuns(), { wrapper: Wrapper });

      act(() => {
        result.current.compareRuns({
          baselineRunId: 'run-1',
          comparisonRunId: 'run-2',
        });
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/internal/search_playground/relevance/runs/compare',
        expect.objectContaining({
          body: JSON.stringify({ baselineRunId: 'run-1', comparisonRunId: 'run-2' }),
          version: '1',
        })
      );
      expect(result.current.data).toEqual(mockComparisonResult);
    });

    it('handles comparison errors', async () => {
      mockHttp.post.mockRejectedValue(new Error('Run not found'));
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useCompareRuns(), { wrapper: Wrapper });

      act(() => {
        result.current.compareRuns({
          baselineRunId: 'run-1',
          comparisonRunId: 'nonexistent',
        });
      });

      await waitFor(() => expect(mockHttp.post).toHaveBeenCalled());
    });
  });
});
