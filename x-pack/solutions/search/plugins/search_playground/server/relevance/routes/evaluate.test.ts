/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { loggingSystemMock } from '@kbn/core-logging-server-mocks';
import type { RequestHandlerContext, StartServicesAccessor } from '@kbn/core/server';
import { coreMock } from '@kbn/core/server/mocks';
import { MockRouter } from '../../../__mocks__/router.mock';
import type {
  SearchPlaygroundPluginStart,
  SearchPlaygroundPluginStartDependencies,
} from '../../types';
import { APIRoutes } from '../../types';
import { ROUTE_VERSIONS } from '../../../common';
import { defineEvaluateRoute } from './evaluate';

describe('Relevance Workbench - Evaluate API', () => {
  const mockLogger = loggingSystemMock.createLogger().get();
  let mockRouter: MockRouter;

  const mockSOClient = {
    create: jest.fn(),
    get: jest.fn(),
  };

  const mockEsClient = {
    rankEval: jest.fn(),
  };

  const mockCore = {
    savedObjects: { client: mockSOClient },
    elasticsearch: { client: { asCurrentUser: mockEsClient } },
  };

  let context: jest.Mocked<RequestHandlerContext>;
  let mockGetStartServices: jest.Mocked<
    StartServicesAccessor<SearchPlaygroundPluginStartDependencies, SearchPlaygroundPluginStart>
  >;

  const judgmentSet = {
    name: 'Test Set',
    indices: ['my-index'],
    judgments: [
      {
        query: 'search term',
        ratings: [
          { index: 'my-index', id: 'doc1', rating: 3 },
          { index: 'my-index', id: 'doc2', rating: 1 },
        ],
      },
      {
        query: 'another query',
        ratings: [{ index: 'my-index', id: 'doc3', rating: 2 }],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const coreStart = coreMock.createStart();
    mockGetStartServices = jest.fn().mockResolvedValue([coreStart, {}, {}]);
    context = {
      core: Promise.resolve(mockCore),
    } as unknown as jest.Mocked<RequestHandlerContext>;
  });

  describe('POST /internal/search_playground/relevance/evaluate', () => {
    describe('v1', () => {
      beforeEach(() => {
        mockRouter = new MockRouter({
          context,
          method: 'post',
          path: APIRoutes.POST_EVALUATE,
          version: ROUTE_VERSIONS.v1,
        });
        defineEvaluateRoute({
          logger: mockLogger,
          router: mockRouter.router,
          getStartServices: mockGetStartServices,
        });
      });

      it('fetches judgment set, calls _rank_eval, and persists run', async () => {
        mockSOClient.get.mockResolvedValue({
          id: 'js-1',
          type: 'search_judgment_set',
          attributes: judgmentSet,
        });

        mockEsClient.rankEval.mockResolvedValue({
          metric_score: 0.75,
          details: {
            'search term': {
              metric_score: 0.8,
              unrated_docs: [{ _index: 'my-index', _id: 'doc5' }],
            },
            'another query': {
              metric_score: 0.7,
              unrated_docs: [],
            },
          },
        });

        mockSOClient.create.mockResolvedValue({
          id: 'run-1',
          type: 'search_evaluation_run',
          created_at: '2026-02-16T00:00:00Z',
          updated_at: '2026-02-16T00:00:00Z',
          attributes: {
            judgmentSetId: 'js-1',
            timestamp: expect.any(String),
            queryTemplateJSON: '{"query":{"match":{"title":"{{query}}"}}}',
            metric: { type: 'ndcg', params: { k: 10 } },
            overallScore: 0.75,
            perQueryScores: [
              { query: 'search term', score: 0.8, unratedDocs: 1 },
              { query: 'another query', score: 0.7, unratedDocs: 0 },
            ],
            clientMetrics: {
              totalQueries: 2,
              medianScore: 0.75,
              scoreStandardDeviation: expect.any(Number),
              minScore: 0.7,
              maxScore: 0.8,
              queryPassRate: 1,
              queriesWithUnratedDocs: 1,
              unratedDocRate: 0.5,
            },
          },
        });

        await mockRouter.callRoute({
          body: {
            judgmentSetId: 'js-1',
            queryTemplateJSON: '{"query":{"match":{"title":"{{query}}"}}}',
            metric: { type: 'ndcg', params: { k: 10 } },
            indices: ['my-index'],
          },
        });

        expect(mockSOClient.get).toHaveBeenCalledWith('search_judgment_set', 'js-1');

        expect(mockEsClient.rankEval).toHaveBeenCalledWith({
          index: ['my-index'],
          requests: [
            {
              id: 'search term',
              request: { query: { match: { title: '{{query}}' } } },
              params: { query: 'search term' },
              ratings: [
                { _index: 'my-index', _id: 'doc1', rating: 3 },
                { _index: 'my-index', _id: 'doc2', rating: 1 },
              ],
            },
            {
              id: 'another query',
              request: { query: { match: { title: '{{query}}' } } },
              params: { query: 'another query' },
              ratings: [{ _index: 'my-index', _id: 'doc3', rating: 2 }],
            },
          ],
          metric: { ndcg: { k: 10 } },
        });

        expect(mockSOClient.create).toHaveBeenCalledWith(
          'search_evaluation_run',
          expect.objectContaining({
            judgmentSetId: 'js-1',
            overallScore: 0.75,
            metric: { type: 'ndcg', params: { k: 10 } },
            clientMetrics: expect.objectContaining({
              totalQueries: 2,
              medianScore: 0.75,
              minScore: 0.7,
              maxScore: 0.8,
              queryPassRate: 1,
              queriesWithUnratedDocs: 1,
              unratedDocRate: 0.5,
            }),
          })
        );

        expect(mockRouter.response.ok).toHaveBeenCalled();
      });

      it('returns 404 if judgment set not found', async () => {
        mockSOClient.get.mockResolvedValue({
          error: { statusCode: 404 },
        });

        await mockRouter.callRoute({
          body: {
            judgmentSetId: 'missing',
            queryTemplateJSON: '{"query":{"match_all":{}}}',
            metric: { type: 'precision', params: {} },
            indices: ['my-index'],
          },
        });

        expect(mockRouter.response.notFound).toHaveBeenCalled();
        expect(mockEsClient.rankEval).not.toHaveBeenCalled();
      });

      it('returns bad request on invalid query template JSON', async () => {
        mockSOClient.get.mockResolvedValue({
          id: 'js-1',
          type: 'search_judgment_set',
          attributes: judgmentSet,
        });

        await mockRouter.callRoute({
          body: {
            judgmentSetId: 'js-1',
            queryTemplateJSON: 'not valid json',
            metric: { type: 'ndcg', params: {} },
            indices: ['my-index'],
          },
        });

        expect(mockRouter.response.badRequest).toHaveBeenCalled();
        expect(mockEsClient.rankEval).not.toHaveBeenCalled();
      });

      it('handles ES rankEval errors', async () => {
        mockSOClient.get.mockResolvedValue({
          id: 'js-1',
          type: 'search_judgment_set',
          attributes: judgmentSet,
        });

        mockEsClient.rankEval.mockRejectedValue(new Error('ES error'));

        await mockRouter.callRoute({
          body: {
            judgmentSetId: 'js-1',
            queryTemplateJSON: '{"query":{"match_all":{}}}',
            metric: { type: 'ndcg', params: {} },
            indices: ['my-index'],
          },
        });

        expect(mockRouter.response.customError).toHaveBeenCalledWith({
          statusCode: 502,
          body: {
            message: expect.stringContaining('ES error'),
          },
        });
      });
    });
  });
});
