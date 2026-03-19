/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { STREAMS_API_PRIVILEGES } from '../../../../common/constants';
import { createServerRoute } from '../../create_server_route';

export const getConnectorsRoute = createServerRoute({
  endpoint: 'GET /internal/streams/connectors',
  options: {
    access: 'internal',
    summary: 'Get GenAI connectors',
    description: 'Fetches all available GenAI connectors for AI features',
  },
  security: {
    authz: {
      requiredPrivileges: [STREAMS_API_PRIVILEGES.read],
    },
  },
  handler: async ({ request, server }) => {
    const connectors = await server.inference.getConnectorList(request);

    return { connectors };
  },
});

export const connectorRoutes = {
  ...getConnectorsRoute,
};
