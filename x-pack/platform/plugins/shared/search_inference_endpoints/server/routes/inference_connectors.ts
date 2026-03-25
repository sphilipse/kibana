/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IRouter, KibanaRequest, Logger } from '@kbn/core/server';
import { schema } from '@kbn/config-schema';
import type { InferenceConnector } from '@kbn/inference-common';
import { APIRoutes } from '../../common/types';
import { ROUTE_VERSIONS } from '../../common/constants';
import type { ResolvedInferenceEndpoints } from '../types';
import { errorHandler } from '../utils/error_handler';

export const defineInferenceConnectorsRoute = ({
  logger,
  router,
  getForFeature,
  getConnectorList,
}: {
  logger: Logger;
  router: IRouter;
  getForFeature: (featureId: string) => Promise<ResolvedInferenceEndpoints>;
  getConnectorList: (request: KibanaRequest) => Promise<InferenceConnector[]>;
}) => {
  router.versioned
    .get({
      access: 'internal',
      path: APIRoutes.GET_INFERENCE_CONNECTORS,
      security: {
        authz: {
          enabled: false,
          reason: 'This route delegates authorization to the scoped ES client',
        },
      },
    })
    .addVersion(
      {
        security: {
          authz: {
            enabled: false,
            reason: 'This route delegates authorization to the scoped ES client',
          },
        },
        validate: {
          request: {
            query: schema.object({
              featureId: schema.string(),
            }),
          },
        },
        version: ROUTE_VERSIONS.v1,
      },
      errorHandler(logger)(async (_context, request, response) => {
        const { featureId } = request.query;

        const featureResult = await getForFeature(featureId);
        const connectors = await getConnectorList(request);

        if (featureResult.endpoints.length > 0) {
          return response.ok({
            body: {
              connectors: featureResult.endpoints,
              allConnectors: connectors,
              isFromRecommendation: featureResult.isFromRecommendation,
            },
          });
        }

        return response.ok({
          body: { connectors: [], allConnectors: connectors, isFromRecommendation: false },
        });
      })
    );
};
