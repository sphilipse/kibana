/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { loggingSystemMock } from '@kbn/core-logging-server-mocks';
import type { RequestHandlerContext, StartServicesAccessor } from '@kbn/core/server';
import { SavedObjectsErrorHelpers } from '@kbn/core/server';
import { coreMock } from '@kbn/core/server/mocks';
import { MockRouter } from '../../../__mocks__/router.mock';
import type {
  SearchPlaygroundPluginStart,
  SearchPlaygroundPluginStartDependencies,
} from '../../types';
import { APIRoutes } from '../../types';
import { ROUTE_VERSIONS } from '../../../common';
import { defineEvaluationRunRoutes } from './runs';

const makeRunAttributes = (overrides = {}) => ({
  judgmentSetId: 'js-1',
  name: 'Run 1',
  timestamp: '2026-02-16T00:00:00Z',
  queryTemplateJSON: '{"query":{"match_all":{}}}',
  metric: { type: 'ndcg', params: { k: 10 } },
  overallScore: 0.85,
  perQueryScores: [
    { query: 'q1', score: 0.9, unratedDocs: 1 },
    { query: 'q2', score: 0.8, unratedDocs: 0 },
  ],
  ...overrides,
});

describe('Relevance Workbench - Evaluation Runs API', () => {
  const mockLogger = loggingSystemMock.createLogger().get();
  let mockRouter: MockRouter;
  const mockSOClient = {
    create: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    get: jest.fn(),
    bulkGet: jest.fn(),
  };
  const mockCore = {
    savedObjects: { client: mockSOClient },
  };

  let context: jest.Mocked<RequestHandlerContext>;
  let mockGetStartServices: jest.Mocked<
    StartServicesAccessor<SearchPlaygroundPluginStartDependencies, SearchPlaygroundPluginStart>
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    const coreStart = coreMock.createStart();
    mockGetStartServices = jest.fn().mockResolvedValue([coreStart, {}, {}]);
    context = {
      core: Promise.resolve(mockCore),
    } as unknown as jest.Mocked<RequestHandlerContext>;
  });

  describe('GET /internal/search_playground/relevance/runs', () => {
    describe('v1', () => {
      beforeEach(() => {
        mockRouter = new MockRouter({
          context,
          method: 'get',
          path: APIRoutes.GET_EVALUATION_RUNS,
          version: ROUTE_VERSIONS.v1,
        });
        defineEvaluationRunRoutes({
          logger: mockLogger,
          router: mockRouter.router,
          getStartServices: mockGetStartServices,
        });
      });

      it('lists evaluation runs', async () => {
        mockSOClient.find.mockResolvedValue({
          total: 1,
          page: 1,
          per_page: 10,
          saved_objects: [
            {
              id: 'run-1',
              type: 'search_evaluation_run',
              created_at: '2026-02-16T00:00:00Z',
              attributes: makeRunAttributes(),
            },
          ],
        });

        await mockRouter.callRoute({
          query: { page: 1, size: 10, sortField: 'updated_at', sortOrder: 'desc' },
        });

        expect(mockSOClient.find).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'search_evaluation_run',
            perPage: 10,
            page: 1,
          })
        );
        expect(mockRouter.response.ok).toHaveBeenCalledWith({
          body: {
            _meta: { page: 1, size: 10, total: 1 },
            items: [
              expect.objectContaining({
                id: 'run-1',
                judgmentSetId: 'js-1',
                overallScore: 0.85,
                metricType: 'ndcg',
              }),
            ],
          },
          headers: { 'content-type': 'application/json' },
        });
      });

      it('filters by judgmentSetId', async () => {
        mockSOClient.find.mockResolvedValue({
          total: 0,
          page: 1,
          per_page: 10,
          saved_objects: [],
        });

        await mockRouter.callRoute({
          query: {
            page: 1,
            size: 10,
            sortField: 'updated_at',
            sortOrder: 'desc',
            judgmentSetId: 'js-1',
          },
        });

        expect(mockSOClient.find).toHaveBeenCalledWith(
          expect.objectContaining({
            filter: expect.stringContaining('js-1'),
          })
        );
      });
    });
  });

  describe('GET /internal/search_playground/relevance/runs/{id}', () => {
    describe('v1', () => {
      beforeEach(() => {
        mockRouter = new MockRouter({
          context,
          method: 'get',
          path: APIRoutes.GET_EVALUATION_RUN,
          version: ROUTE_VERSIONS.v1,
        });
        defineEvaluationRunRoutes({
          logger: mockLogger,
          router: mockRouter.router,
          getStartServices: mockGetStartServices,
        });
      });

      it('returns an evaluation run by id', async () => {
        const attrs = makeRunAttributes();
        mockSOClient.get.mockResolvedValue({
          id: 'run-1',
          type: 'search_evaluation_run',
          created_at: '2026-02-16T00:00:00Z',
          updated_at: '2026-02-16T00:00:00Z',
          attributes: attrs,
        });

        await mockRouter.callRoute({ params: { id: 'run-1' } });

        expect(mockSOClient.get).toHaveBeenCalledWith('search_evaluation_run', 'run-1');
        expect(mockRouter.response.ok).toHaveBeenCalledWith({
          body: {
            _meta: expect.objectContaining({ id: 'run-1' }),
            data: attrs,
          },
          headers: { 'content-type': 'application/json' },
        });
      });

      it('returns 404 when not found', async () => {
        mockSOClient.get.mockResolvedValue({ error: { statusCode: 404 } });

        await mockRouter.callRoute({ params: { id: 'missing' } });

        expect(mockRouter.response.notFound).toHaveBeenCalled();
      });
    });
  });

  describe('DELETE /internal/search_playground/relevance/runs/{id}', () => {
    describe('v1', () => {
      beforeEach(() => {
        mockRouter = new MockRouter({
          context,
          method: 'delete',
          path: APIRoutes.DELETE_EVALUATION_RUN,
          version: ROUTE_VERSIONS.v1,
        });
        defineEvaluationRunRoutes({
          logger: mockLogger,
          router: mockRouter.router,
          getStartServices: mockGetStartServices,
        });
      });

      it('deletes an evaluation run', async () => {
        mockSOClient.delete.mockResolvedValue({});

        await mockRouter.callRoute({ params: { id: 'run-1' } });

        expect(mockSOClient.delete).toHaveBeenCalledWith('search_evaluation_run', 'run-1');
        expect(mockRouter.response.ok).toHaveBeenCalledWith();
      });

      it('handles not found on delete', async () => {
        mockSOClient.delete.mockRejectedValue(
          SavedObjectsErrorHelpers.createGenericNotFoundError('run-1', 'search_evaluation_run')
        );

        await mockRouter.callRoute({ params: { id: 'run-1' } });

        expect(mockRouter.response.customError).toHaveBeenCalledWith({
          statusCode: 404,
          body: { message: 'Saved object [run-1/search_evaluation_run] not found' },
        });
      });
    });
  });

  describe('POST /internal/search_playground/relevance/runs/compare', () => {
    describe('v1', () => {
      beforeEach(() => {
        mockRouter = new MockRouter({
          context,
          method: 'post',
          path: APIRoutes.POST_COMPARE_RUNS,
          version: ROUTE_VERSIONS.v1,
        });
        defineEvaluationRunRoutes({
          logger: mockLogger,
          router: mockRouter.router,
          getStartServices: mockGetStartServices,
        });
      });

      it('compares two runs and returns delta', async () => {
        mockSOClient.bulkGet.mockResolvedValue({
          saved_objects: [
            {
              id: 'run-a',
              type: 'search_evaluation_run',
              attributes: makeRunAttributes({
                overallScore: 0.7,
                perQueryScores: [
                  { query: 'q1', score: 0.6, unratedDocs: 0 },
                  { query: 'q2', score: 0.8, unratedDocs: 0 },
                ],
              }),
            },
            {
              id: 'run-b',
              type: 'search_evaluation_run',
              attributes: makeRunAttributes({
                overallScore: 0.85,
                perQueryScores: [
                  { query: 'q1', score: 0.9, unratedDocs: 0 },
                  { query: 'q2', score: 0.8, unratedDocs: 0 },
                ],
              }),
            },
          ],
        });

        await mockRouter.callRoute({
          body: { baselineRunId: 'run-a', comparisonRunId: 'run-b' },
        });

        expect(mockRouter.response.ok).toHaveBeenCalledWith({
          body: {
            baselineRunId: 'run-a',
            comparisonRunId: 'run-b',
            baselineScore: 0.7,
            comparisonScore: 0.85,
            scoreDelta: expect.closeTo(0.15, 5),
            perQueryComparison: [
              {
                query: 'q1',
                baselineScore: 0.6,
                comparisonScore: 0.9,
                delta: expect.closeTo(0.3, 5),
                improved: true,
                regressed: false,
              },
              {
                query: 'q2',
                baselineScore: 0.8,
                comparisonScore: 0.8,
                delta: 0,
                improved: false,
                regressed: false,
              },
            ],
          },
          headers: { 'content-type': 'application/json' },
        });
      });

      it('returns 404 if a run is not found', async () => {
        mockSOClient.bulkGet.mockResolvedValue({
          saved_objects: [
            { id: 'run-a', error: { statusCode: 404, message: 'Not found' } },
            {
              id: 'run-b',
              type: 'search_evaluation_run',
              attributes: makeRunAttributes(),
            },
          ],
        });

        await mockRouter.callRoute({
          body: { baselineRunId: 'run-a', comparisonRunId: 'run-b' },
        });

        expect(mockRouter.response.notFound).toHaveBeenCalled();
      });
    });
  });
});
