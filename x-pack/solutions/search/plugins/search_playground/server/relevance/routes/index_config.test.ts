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
import { defineIndexConfigRoutes } from './index_config';

describe('Relevance Workbench - Index Config API', () => {
  const mockLogger = loggingSystemMock.createLogger().get();
  let mockRouter: MockRouter;

  const mockEsClient = {
    indices: {
      getSettings: jest.fn(),
      getMapping: jest.fn(),
      putSettings: jest.fn(),
      putMapping: jest.fn(),
    },
    ingest: {
      getPipeline: jest.fn(),
      putPipeline: jest.fn(),
    },
  };

  const mockCore = {
    elasticsearch: { client: { asCurrentUser: mockEsClient } },
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

  describe('POST /internal/search_playground/relevance/index_config', () => {
    beforeEach(() => {
      mockRouter = new MockRouter({
        context,
        method: 'post',
        path: APIRoutes.POST_INDEX_CONFIG,
        version: ROUTE_VERSIONS.v1,
      });
      defineIndexConfigRoutes({
        logger: mockLogger,
        router: mockRouter.router,
        getStartServices: mockGetStartServices,
      });
    });

    it('returns settings and mappings for requested indices', async () => {
      mockEsClient.indices.getSettings.mockResolvedValue({
        'my-index': {
          settings: {
            index: { number_of_shards: '1', number_of_replicas: '1' },
          },
        },
      });
      mockEsClient.indices.getMapping.mockResolvedValue({
        'my-index': {
          mappings: {
            properties: { title: { type: 'text' } },
          },
        },
      });

      await mockRouter.callRoute({
        body: { indices: ['my-index'] },
      });

      expect(mockEsClient.indices.getSettings).toHaveBeenCalledWith({ index: ['my-index'] });
      expect(mockEsClient.indices.getMapping).toHaveBeenCalledWith({ index: ['my-index'] });
      expect(mockRouter.response.ok).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            settings: {
              'my-index': {
                index: { number_of_shards: '1', number_of_replicas: '1' },
              },
            },
            mappings: {
              'my-index': {
                properties: { title: { type: 'text' } },
              },
            },
          },
        })
      );
    });

    it('handles multiple indices', async () => {
      mockEsClient.indices.getSettings.mockResolvedValue({
        'index-a': { settings: { index: { number_of_shards: '1' } } },
        'index-b': { settings: { index: { number_of_shards: '2' } } },
      });
      mockEsClient.indices.getMapping.mockResolvedValue({
        'index-a': { mappings: { properties: { a: { type: 'text' } } } },
        'index-b': { mappings: { properties: { b: { type: 'keyword' } } } },
      });

      await mockRouter.callRoute({
        body: { indices: ['index-a', 'index-b'] },
      });

      expect(mockRouter.response.ok).toHaveBeenCalled();
      const responseBody = mockRouter.response.ok.mock.calls[0][0]?.body as any;
      expect(Object.keys(responseBody.settings)).toEqual(['index-a', 'index-b']);
      expect(Object.keys(responseBody.mappings)).toEqual(['index-a', 'index-b']);
    });
  });

  describe('PUT /internal/search_playground/relevance/index_config/settings', () => {
    beforeEach(() => {
      mockRouter = new MockRouter({
        context,
        method: 'put',
        path: APIRoutes.PUT_INDEX_SETTINGS,
        version: ROUTE_VERSIONS.v1,
      });
      defineIndexConfigRoutes({
        logger: mockLogger,
        router: mockRouter.router,
        getStartServices: mockGetStartServices,
      });
    });

    it('updates settings and returns the updated values', async () => {
      mockEsClient.indices.putSettings.mockResolvedValue({ acknowledged: true });
      mockEsClient.indices.getSettings.mockResolvedValue({
        'my-index': {
          settings: {
            index: { number_of_replicas: '2' },
          },
        },
      });

      await mockRouter.callRoute({
        body: {
          index: 'my-index',
          settings: { index: { number_of_replicas: '2' } },
        },
      });

      expect(mockEsClient.indices.putSettings).toHaveBeenCalledWith({
        index: 'my-index',
        settings: { index: { number_of_replicas: '2' } },
      });
      expect(mockRouter.response.ok).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            settings: { index: { number_of_replicas: '2' } },
          },
        })
      );
    });
  });

  describe('PUT /internal/search_playground/relevance/index_config/mappings', () => {
    beforeEach(() => {
      mockRouter = new MockRouter({
        context,
        method: 'put',
        path: APIRoutes.PUT_INDEX_MAPPINGS,
        version: ROUTE_VERSIONS.v1,
      });
      defineIndexConfigRoutes({
        logger: mockLogger,
        router: mockRouter.router,
        getStartServices: mockGetStartServices,
      });
    });

    it('updates mappings and returns the updated values', async () => {
      mockEsClient.indices.putMapping.mockResolvedValue({ acknowledged: true });
      mockEsClient.indices.getMapping.mockResolvedValue({
        'my-index': {
          mappings: {
            properties: {
              title: { type: 'text' },
              description: { type: 'text' },
            },
          },
        },
      });

      await mockRouter.callRoute({
        body: {
          index: 'my-index',
          mappings: { properties: { description: { type: 'text' } } },
        },
      });

      expect(mockEsClient.indices.putMapping).toHaveBeenCalledWith({
        index: 'my-index',
        properties: { description: { type: 'text' } },
      });
      expect(mockRouter.response.ok).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            mappings: {
              properties: {
                title: { type: 'text' },
                description: { type: 'text' },
              },
            },
          },
        })
      );
    });
  });

  describe('GET /internal/search_playground/relevance/pipelines', () => {
    beforeEach(() => {
      mockRouter = new MockRouter({
        context,
        method: 'get',
        path: APIRoutes.GET_PIPELINES,
        version: ROUTE_VERSIONS.v1,
      });
      defineIndexConfigRoutes({
        logger: mockLogger,
        router: mockRouter.router,
        getStartServices: mockGetStartServices,
      });
    });

    it('returns a list of pipelines', async () => {
      mockEsClient.ingest.getPipeline.mockResolvedValue({
        'my-pipeline': {
          description: 'Test pipeline',
          processors: [{ set: { field: 'foo', value: 'bar' } }],
        },
        'another-pipeline': {
          processors: [{ remove: { field: 'baz' } }],
        },
      });

      await mockRouter.callRoute({});

      expect(mockRouter.response.ok).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            pipelines: [
              {
                id: 'my-pipeline',
                description: 'Test pipeline',
                processors: [{ set: { field: 'foo', value: 'bar' } }],
              },
              {
                id: 'another-pipeline',
                description: undefined,
                processors: [{ remove: { field: 'baz' } }],
              },
            ],
          },
        })
      );
    });
  });

  describe('PUT /internal/search_playground/relevance/pipelines/{id}', () => {
    beforeEach(() => {
      mockRouter = new MockRouter({
        context,
        method: 'put',
        path: APIRoutes.PUT_PIPELINE,
        version: ROUTE_VERSIONS.v1,
      });
      defineIndexConfigRoutes({
        logger: mockLogger,
        router: mockRouter.router,
        getStartServices: mockGetStartServices,
      });
    });

    it('updates a pipeline and returns the updated version', async () => {
      mockEsClient.ingest.putPipeline.mockResolvedValue({ acknowledged: true });
      mockEsClient.ingest.getPipeline.mockResolvedValue({
        'my-pipeline': {
          description: 'Updated pipeline',
          processors: [{ set: { field: 'foo', value: 'updated' } }],
        },
      });

      await mockRouter.callRoute({
        params: { id: 'my-pipeline' },
        body: {
          description: 'Updated pipeline',
          processors: [{ set: { field: 'foo', value: 'updated' } }],
        },
      });

      expect(mockEsClient.ingest.putPipeline).toHaveBeenCalledWith({
        id: 'my-pipeline',
        description: 'Updated pipeline',
        processors: [{ set: { field: 'foo', value: 'updated' } }],
      });
      expect(mockRouter.response.ok).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            id: 'my-pipeline',
            description: 'Updated pipeline',
            processors: [{ set: { field: 'foo', value: 'updated' } }],
          },
        })
      );
    });
  });
});
