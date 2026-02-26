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
import { defineJudgmentSetRoutes } from './judgment_sets';

const validJudgmentSet = {
  name: 'My Judgment Set',
  indices: ['my-index'],
  query: 'search term',
  judgments: [
    { index: 'my-index', id: 'doc1', rating: 3 },
    { index: 'my-index', id: 'doc2', rating: 0 },
  ],
};

describe('Relevance Workbench - Judgment Sets API', () => {
  const mockLogger = loggingSystemMock.createLogger().get();
  let mockRouter: MockRouter;
  const mockSOClient = {
    create: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    get: jest.fn(),
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

  describe('GET /internal/search_playground/relevance/judgment_sets', () => {
    describe('v1', () => {
      beforeEach(() => {
        mockRouter = new MockRouter({
          context,
          method: 'get',
          path: APIRoutes.GET_JUDGMENT_SETS,
          version: ROUTE_VERSIONS.v1,
        });
        defineJudgmentSetRoutes({
          logger: mockLogger,
          router: mockRouter.router,
          getStartServices: mockGetStartServices,
        });
      });

      it('lists judgment sets', async () => {
        mockSOClient.find.mockResolvedValue({
          total: 1,
          page: 1,
          per_page: 10,
          saved_objects: [
            {
              id: 'js-1',
              type: 'search_judgment_set',
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
              attributes: {
                name: 'My Judgment Set',
                indices: ['my-index'],
                query: 'q1',
                judgments: [
                  { index: 'my-index', id: 'd1', rating: 2 },
                ],
              },
            },
          ],
        });

        await mockRouter.callRoute({
          query: { page: 1, size: 10, sortField: 'updated_at', sortOrder: 'desc' },
        });

        expect(mockSOClient.find).toHaveBeenCalledWith({
          type: 'search_judgment_set',
          perPage: 10,
          page: 1,
          sortField: 'updated_at',
          sortOrder: 'desc',
        });
        expect(mockRouter.response.ok).toHaveBeenCalledWith({
          body: {
            _meta: { page: 1, size: 10, total: 1 },
            items: [
              {
                id: 'js-1',
                name: 'My Judgment Set',
                judgmentCount: 1,
                createdAt: '2026-01-01T00:00:00Z',
                createdBy: undefined,
                updatedAt: '2026-01-01T00:00:00Z',
                updatedBy: undefined,
              },
            ],
          },
          headers: { 'content-type': 'application/json' },
        });
      });

      it('handles SO client errors', async () => {
        mockSOClient.find.mockRejectedValue(
          SavedObjectsErrorHelpers.decorateForbiddenError(new Error('Forbidden'))
        );

        await mockRouter.callRoute({
          query: { page: 1, size: 10, sortField: 'updated_at', sortOrder: 'desc' },
        });

        expect(mockRouter.response.customError).toHaveBeenCalledWith({
          statusCode: 403,
          body: { message: 'Forbidden' },
        });
      });
    });
  });

  describe('GET /internal/search_playground/relevance/judgment_sets/{id}', () => {
    describe('v1', () => {
      beforeEach(() => {
        mockRouter = new MockRouter({
          context,
          method: 'get',
          path: APIRoutes.GET_JUDGMENT_SET,
          version: ROUTE_VERSIONS.v1,
        });
        defineJudgmentSetRoutes({
          logger: mockLogger,
          router: mockRouter.router,
          getStartServices: mockGetStartServices,
        });
      });

      it('returns a judgment set by id', async () => {
        mockSOClient.get.mockResolvedValue({
          id: 'js-1',
          type: 'search_judgment_set',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          attributes: validJudgmentSet,
        });

        await mockRouter.callRoute({ params: { id: 'js-1' } });

        expect(mockSOClient.get).toHaveBeenCalledWith('search_judgment_set', 'js-1');
        expect(mockRouter.response.ok).toHaveBeenCalledWith({
          body: {
            _meta: {
              id: 'js-1',
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
            data: validJudgmentSet,
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

  describe('PUT /internal/search_playground/relevance/judgment_sets (create)', () => {
    describe('v1', () => {
      beforeEach(() => {
        mockRouter = new MockRouter({
          context,
          method: 'put',
          path: APIRoutes.PUT_JUDGMENT_SET_CREATE,
          version: ROUTE_VERSIONS.v1,
        });
        defineJudgmentSetRoutes({
          logger: mockLogger,
          router: mockRouter.router,
          getStartServices: mockGetStartServices,
        });
      });

      it('creates and returns a judgment set', async () => {
        mockSOClient.create.mockResolvedValue({
          id: 'js-new',
          type: 'search_judgment_set',
          created_at: '2026-02-16T00:00:00Z',
          updated_at: '2026-02-16T00:00:00Z',
          attributes: validJudgmentSet,
        });

        await mockRouter.callRoute({ body: validJudgmentSet });

        expect(mockSOClient.create).toHaveBeenCalledWith(
          'search_judgment_set',
          validJudgmentSet
        );
        expect(mockRouter.response.ok).toHaveBeenCalledWith({
          body: {
            _meta: {
              id: 'js-new',
              createdAt: '2026-02-16T00:00:00Z',
              updatedAt: '2026-02-16T00:00:00Z',
            },
            data: validJudgmentSet,
          },
          headers: { 'content-type': 'application/json' },
        });
      });

      it('handles SO client errors on create', async () => {
        mockSOClient.create.mockResolvedValue({
          error: { statusCode: 409, message: 'Conflict', error: 'conflict' },
        });

        await mockRouter.callRoute({ body: validJudgmentSet });

        expect(mockRouter.response.customError).toHaveBeenCalledWith({
          statusCode: 409,
          body: {
            message: 'Conflict',
            attributes: { error: 'conflict' },
          },
        });
      });
    });
  });

  describe('PUT /internal/search_playground/relevance/judgment_sets/{id} (update)', () => {
    describe('v1', () => {
      beforeEach(() => {
        mockRouter = new MockRouter({
          context,
          method: 'put',
          path: APIRoutes.PUT_JUDGMENT_SET_UPDATE,
          version: ROUTE_VERSIONS.v1,
        });
        defineJudgmentSetRoutes({
          logger: mockLogger,
          router: mockRouter.router,
          getStartServices: mockGetStartServices,
        });
      });

      it('updates a judgment set', async () => {
        const updatedSet = { ...validJudgmentSet, name: 'Updated' };
        mockSOClient.update.mockResolvedValue({});
        mockSOClient.get.mockResolvedValue({
          id: 'js-1',
          type: 'search_judgment_set',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-02-16T00:00:00Z',
          attributes: updatedSet,
        });

        await mockRouter.callRoute({
          params: { id: 'js-1' },
          body: updatedSet,
        });

        expect(mockSOClient.update).toHaveBeenCalledWith(
          'search_judgment_set',
          'js-1',
          updatedSet
        );
        expect(mockRouter.response.ok).toHaveBeenCalledWith({
          body: {
            _meta: {
              id: 'js-1',
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-02-16T00:00:00Z',
            },
            data: updatedSet,
          },
          headers: { 'content-type': 'application/json' },
        });
      });

      it('handles not found on update', async () => {
        mockSOClient.update.mockRejectedValue(
          SavedObjectsErrorHelpers.createGenericNotFoundError('js-1', 'search_judgment_set')
        );

        await mockRouter.callRoute({
          params: { id: 'js-1' },
          body: validJudgmentSet,
        });

        expect(mockRouter.response.customError).toHaveBeenCalledWith({
          statusCode: 404,
          body: { message: 'Saved object [js-1/search_judgment_set] not found' },
        });
      });
    });
  });

  describe('DELETE /internal/search_playground/relevance/judgment_sets/{id}', () => {
    describe('v1', () => {
      beforeEach(() => {
        mockRouter = new MockRouter({
          context,
          method: 'delete',
          path: APIRoutes.DELETE_JUDGMENT_SET,
          version: ROUTE_VERSIONS.v1,
        });
        defineJudgmentSetRoutes({
          logger: mockLogger,
          router: mockRouter.router,
          getStartServices: mockGetStartServices,
        });
      });

      it('deletes a judgment set', async () => {
        mockSOClient.delete.mockResolvedValue({});

        await mockRouter.callRoute({ params: { id: 'js-1' } });

        expect(mockSOClient.delete).toHaveBeenCalledWith('search_judgment_set', 'js-1');
        expect(mockRouter.response.ok).toHaveBeenCalledWith();
      });

      it('handles not found on delete', async () => {
        mockSOClient.delete.mockRejectedValue(
          SavedObjectsErrorHelpers.createGenericNotFoundError('js-1', 'search_judgment_set')
        );

        await mockRouter.callRoute({ params: { id: 'js-1' } });

        expect(mockRouter.response.customError).toHaveBeenCalledWith({
          statusCode: 404,
          body: { message: 'Saved object [js-1/search_judgment_set] not found' },
        });
      });
    });
  });
});
