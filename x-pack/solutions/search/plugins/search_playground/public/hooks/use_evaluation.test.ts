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
import { useRunEvaluation } from './use_evaluation';
import type { EvaluateRequest } from './use_evaluation';

jest.mock('./use_kibana', () => ({
  useKibana: jest.fn(),
}));

const mockHttp = {
  post: jest.fn(),
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

describe('useEvaluation hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseKibana.mockReturnValue({
      services: { http: mockHttp },
    } as unknown as ReturnType<typeof useKibana>);
  });

  describe('useRunEvaluation', () => {
    it('sends evaluation request with correct parameters', async () => {
      mockHttp.post.mockResolvedValue({});
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useRunEvaluation(), { wrapper: Wrapper });

      const request: EvaluateRequest = {
        judgmentSetId: 'set-1',
        queryTemplateJSON: '{"match":{"text":"{{query_string}}"}}',
        metric: { type: 'ndcg', params: { k: 10 } },
        indices: ['my-index'],
      };

      act(() => {
        result.current.runEvaluation(request);
      });

      await waitFor(() => expect(result.current.isRunning).toBe(false));

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/internal/search_playground/relevance/evaluate',
        expect.objectContaining({
          body: JSON.stringify(request),
          version: '1',
        })
      );
    });

    it('invalidates evaluation runs list cache on success', async () => {
      mockHttp.post.mockResolvedValue({});
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useRunEvaluation(), { wrapper: Wrapper });

      act(() => {
        result.current.runEvaluation({
          judgmentSetId: 'set-1',
          queryTemplateJSON: '{}',
          metric: { type: 'precision', params: {} },
          indices: ['idx'],
        });
      });

      await waitFor(() => expect(result.current.isRunning).toBe(false));

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['searchPlaygroundEvaluationRunsList'],
        })
      );
    });

    it('exposes error on failure', async () => {
      mockHttp.post.mockRejectedValue(new Error('Rank eval failed'));
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useRunEvaluation(), { wrapper: Wrapper });

      act(() => {
        result.current.runEvaluation({
          judgmentSetId: 'set-1',
          queryTemplateJSON: '{}',
          metric: { type: 'precision', params: {} },
          indices: ['idx'],
        });
      });

      await waitFor(() => expect(result.current.error).not.toBeNull());
      expect(result.current.error).toEqual(new Error('Rank eval failed'));
    });

    it('includes optional name and passThreshold in request', async () => {
      mockHttp.post.mockResolvedValue({});
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useRunEvaluation(), { wrapper: Wrapper });

      const request: EvaluateRequest = {
        judgmentSetId: 'set-1',
        queryTemplateJSON: '{}',
        metric: { type: 'ndcg', params: { k: 10 } },
        indices: ['my-index'],
        name: 'My Run',
        passThreshold: 0.7,
      };

      act(() => {
        result.current.runEvaluation(request);
      });

      await waitFor(() => expect(result.current.isRunning).toBe(false));

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/internal/search_playground/relevance/evaluate',
        expect.objectContaining({
          body: JSON.stringify(request),
        })
      );
    });
  });
});
