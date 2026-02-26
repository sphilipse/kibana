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
  useJudgmentSetsList,
  useJudgmentSet,
  useCreateJudgmentSet,
  useUpdateJudgmentSet,
  useDeleteJudgmentSet,
} from './use_judgment_sets';
import type {
  JudgmentSetListResponse,
  JudgmentSetResponse,
  JudgmentSetSavedObject,
} from '../types';

jest.mock('./use_kibana', () => ({
  useKibana: jest.fn(),
}));

const mockHttp = {
  get: jest.fn(),
  put: jest.fn(),
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

const mockListResponse: JudgmentSetListResponse = {
  _meta: { page: 1, size: 10, total: 2 },
  items: [
    {
      id: 'set-1',
      name: 'Test Set 1',
      judgmentCount: 5,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'set-2',
      name: 'Test Set 2',
      judgmentCount: 3,
      createdAt: '2026-01-02T00:00:00Z',
    },
  ],
};

const mockSetResponse: JudgmentSetResponse = {
  _meta: {
    id: 'set-1',
    createdAt: '2026-01-01T00:00:00Z',
  },
  data: {
    name: 'Test Set 1',
    indices: ['my-index'],
    query: 'test query',
    judgments: [
      { index: 'my-index', id: 'doc-1', rating: 3 },
    ],
  },
};

describe('useJudgmentSets hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseKibana.mockReturnValue({
      services: { http: mockHttp },
    } as unknown as ReturnType<typeof useKibana>);
  });

  describe('useJudgmentSetsList', () => {
    it('fetches judgment sets list with correct parameters', async () => {
      mockHttp.get.mockResolvedValue(mockListResponse);
      const { Wrapper } = createWrapper();

      const { result } = renderHook(
        () => useJudgmentSetsList({ page: 1, sortField: 'updated_at', sortOrder: 'desc' }),
        { wrapper: Wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/internal/search_playground/relevance/judgment_sets',
        expect.objectContaining({
          query: { page: 1, sortField: 'updated_at', sortOrder: 'desc' },
          version: '1',
        })
      );
      expect(result.current.data).toEqual(mockListResponse);
    });

    it('uses default sort parameters', async () => {
      mockHttp.get.mockResolvedValue(mockListResponse);
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useJudgmentSetsList({ page: 1 }), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/internal/search_playground/relevance/judgment_sets',
        expect.objectContaining({
          query: { page: 1, sortField: 'updated_at', sortOrder: 'desc' },
        })
      );
    });

    it('handles fetch errors', async () => {
      mockHttp.get.mockRejectedValue(new Error('Network error'));
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useJudgmentSetsList({ page: 1 }), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(new Error('Network error'));
    });
  });

  describe('useJudgmentSet', () => {
    it('fetches a single judgment set by id', async () => {
      mockHttp.get.mockResolvedValue(mockSetResponse);
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useJudgmentSet('set-1'), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/internal/search_playground/relevance/judgment_sets/set-1',
        expect.objectContaining({ version: '1' })
      );
      expect(result.current.data).toEqual(mockSetResponse);
    });

    it('does not fetch when id is empty', () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useJudgmentSet(''), { wrapper: Wrapper });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockHttp.get).not.toHaveBeenCalled();
    });
  });

  describe('useCreateJudgmentSet', () => {
    it('creates a judgment set and invalidates list cache', async () => {
      mockHttp.put.mockResolvedValue(mockSetResponse);
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateJudgmentSet(), { wrapper: Wrapper });

      const newSet: JudgmentSetSavedObject = {
        name: 'New Set',
        indices: ['my-index'],
        query: 'test query',
        judgments: [],
      };

      act(() => {
        result.current.createJudgmentSet(newSet);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockHttp.put).toHaveBeenCalledWith(
        '/internal/search_playground/relevance/judgment_sets',
        expect.objectContaining({
          body: JSON.stringify(newSet),
          version: '1',
        })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['searchPlaygroundJudgmentSetsList'],
        })
      );
    });
  });

  describe('useUpdateJudgmentSet', () => {
    it('updates a judgment set and invalidates both list and detail caches', async () => {
      mockHttp.put.mockResolvedValue(mockSetResponse);
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateJudgmentSet(), { wrapper: Wrapper });

      const updatedSet: JudgmentSetSavedObject = {
        name: 'Updated Set',
        indices: ['my-index'],
        query: 'test',
        judgments: [
          { index: 'my-index', id: 'doc-1', rating: 2 },
        ],
      };

      act(() => {
        result.current.updateJudgmentSet({ id: 'set-1', judgmentSet: updatedSet });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockHttp.put).toHaveBeenCalledWith(
        '/internal/search_playground/relevance/judgment_sets/set-1',
        expect.objectContaining({
          body: JSON.stringify(updatedSet),
          version: '1',
        })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['searchPlaygroundJudgmentSetsList'],
        })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['searchPlaygroundJudgmentSet', 'set-1'],
        })
      );
    });
  });

  describe('useDeleteJudgmentSet', () => {
    it('deletes a judgment set and invalidates list cache', async () => {
      mockHttp.delete.mockResolvedValue({});
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteJudgmentSet(), { wrapper: Wrapper });

      act(() => {
        result.current.deleteJudgmentSet('set-1');
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockHttp.delete).toHaveBeenCalledWith(
        '/internal/search_playground/relevance/judgment_sets/set-1',
        expect.objectContaining({ version: '1' })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['searchPlaygroundJudgmentSetsList'],
        })
      );
    });

    it('handles delete errors', async () => {
      mockHttp.delete.mockRejectedValue(new Error('Not found'));
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useDeleteJudgmentSet(), { wrapper: Wrapper });

      act(() => {
        result.current.deleteJudgmentSet('nonexistent-id');
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(new Error('Not found'));
    });
  });
});
