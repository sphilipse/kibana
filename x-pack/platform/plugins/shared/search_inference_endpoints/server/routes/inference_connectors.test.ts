/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { loggingSystemMock } from '@kbn/core-logging-server-mocks';
import type { RequestHandlerContext } from '@kbn/core/server';
import { InferenceConnectorType } from '@kbn/inference-common';
import { MockRouter } from '../../__mocks__/router.mock';
import { ROUTE_VERSIONS } from '../../common/constants';
import { APIRoutes } from '../../common/types';
import { defineInferenceConnectorsRoute } from './inference_connectors';

const inferenceConnector = (connectorId: string) => ({
  type: InferenceConnectorType.Inference,
  name: connectorId,
  connectorId,
  config: {},
  capabilities: {},
  isInferenceEndpoint: true,
  isPreconfigured: false,
});

describe('GET /internal/search_inference_endpoints/connectors', () => {
  const mockLogger = loggingSystemMock.createLogger().get();
  let mockRouter: MockRouter;
  let context: jest.Mocked<RequestHandlerContext>;
  let getForFeature: jest.Mock;
  let getConnectorList: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    context = {} as jest.Mocked<RequestHandlerContext>;
    getForFeature = jest.fn();
    getConnectorList = jest.fn();
    mockRouter = new MockRouter({
      context,
      method: 'get',
      path: APIRoutes.GET_INFERENCE_CONNECTORS,
      version: ROUTE_VERSIONS.v1,
    });
    defineInferenceConnectorsRoute({
      logger: mockLogger,
      router: mockRouter.router,
      getForFeature,
      getConnectorList,
    });
  });

  it('always loads the full connector catalog so the client can merge prioritized endpoints with the rest', async () => {
    const resolved = inferenceConnector('feature-ep');
    const fullCatalog = [resolved, inferenceConnector('other')];
    getForFeature.mockResolvedValue({
      endpoints: [resolved],
      warnings: [],
      isFromRecommendation: true,
    });
    getConnectorList.mockResolvedValue(fullCatalog);

    await mockRouter.callRoute({ query: { featureId: 'my_feature' } });

    expect(getForFeature).toHaveBeenCalledWith('my_feature');
    expect(getConnectorList).toHaveBeenCalledTimes(1);
    expect(mockRouter.response.ok).toHaveBeenCalledWith({
      body: {
        connectors: [resolved],
        allConnectors: fullCatalog,
        isFromRecommendation: true,
      },
    });
  });

  it('returns admin SO-selected endpoints as connectors with isFromRecommendation false', async () => {
    const soEp = inferenceConnector('so-ep');
    const fullCatalog = [soEp, inferenceConnector('noise')];
    getForFeature.mockResolvedValue({
      endpoints: [soEp],
      warnings: [],
      isFromRecommendation: false,
    });
    getConnectorList.mockResolvedValue(fullCatalog);

    await mockRouter.callRoute({ query: { featureId: 'my_feature' } });

    expect(mockRouter.response.ok).toHaveBeenCalledWith({
      body: {
        connectors: [soEp],
        allConnectors: fullCatalog,
        isFromRecommendation: false,
      },
    });
  });

  it('returns the full catalog as connectors when the feature resolves to no endpoints', async () => {
    const fullCatalog = [inferenceConnector('a'), inferenceConnector('b')];
    getForFeature.mockResolvedValue({
      endpoints: [],
      warnings: [],
      isFromRecommendation: false,
    });
    getConnectorList.mockResolvedValue(fullCatalog);

    await mockRouter.callRoute({ query: { featureId: 'my_feature' } });

    expect(mockRouter.response.ok).toHaveBeenCalledWith({
      body: {
        connectors: fullCatalog,
        allConnectors: fullCatalog,
        isFromRecommendation: false,
      },
    });
  });
});
