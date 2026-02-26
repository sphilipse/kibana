/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';
import { PLUGIN_ID, ROUTE_VERSIONS } from '../../../common';
import type { DefineRoutesOptions } from '../../types';
import { APIRoutes } from '../../types';
import type { IndexConfigResponse, PipelineListResponse, PipelineInfo } from '../../../common/types';
import { errorHandler } from '../../utils/error_handler';

export const defineIndexConfigRoutes = ({ logger, router }: DefineRoutesOptions) => {
  // Get index settings + mappings
  router.versioned
    .post({
      access: 'internal',
      path: APIRoutes.POST_INDEX_CONFIG,
      security: {
        authz: {
          requiredPrivileges: [PLUGIN_ID],
        },
      },
    })
    .addVersion(
      {
        security: {
          authz: {
            requiredPrivileges: [PLUGIN_ID],
          },
        },
        version: ROUTE_VERSIONS.v1,
        validate: {
          request: {
            body: schema.object({
              indices: schema.arrayOf(schema.string(), { minSize: 1 }),
            }),
          },
        },
      },
      errorHandler(logger)(async (context, request, response) => {
        const esClient = (await context.core).elasticsearch.client.asCurrentUser;
        const { indices } = request.body;

        const [settingsResult, mappingsResult] = await Promise.all([
          esClient.indices.getSettings({ index: indices }),
          esClient.indices.getMapping({ index: indices }),
        ]);

        const settings: Record<string, Record<string, unknown>> = {};
        const mappings: Record<string, Record<string, unknown>> = {};

        for (const indexName of Object.keys(settingsResult)) {
          settings[indexName] = (settingsResult[indexName].settings ?? {}) as Record<
            string,
            unknown
          >;
        }

        for (const indexName of Object.keys(mappingsResult)) {
          mappings[indexName] = (mappingsResult[indexName].mappings ?? {}) as Record<
            string,
            unknown
          >;
        }

        const body: IndexConfigResponse = { settings, mappings };
        return response.ok({
          body,
          headers: { 'content-type': 'application/json' },
        });
      })
    );

  // Update index settings
  router.versioned
    .put({
      access: 'internal',
      path: APIRoutes.PUT_INDEX_SETTINGS,
      security: {
        authz: {
          requiredPrivileges: [PLUGIN_ID],
        },
      },
    })
    .addVersion(
      {
        security: {
          authz: {
            requiredPrivileges: [PLUGIN_ID],
          },
        },
        version: ROUTE_VERSIONS.v1,
        validate: {
          request: {
            body: schema.object({
              index: schema.string(),
              settings: schema.recordOf(schema.string(), schema.any()),
            }),
          },
        },
      },
      errorHandler(logger)(async (context, request, response) => {
        const esClient = (await context.core).elasticsearch.client.asCurrentUser;
        const { index, settings: newSettings } = request.body;

        await esClient.indices.putSettings({
          index,
          settings: newSettings,
        });

        const updated = await esClient.indices.getSettings({ index });
        return response.ok({
          body: {
            settings: (updated[index]?.settings ?? {}) as Record<string, unknown>,
          },
          headers: { 'content-type': 'application/json' },
        });
      })
    );

  // Update index mappings
  router.versioned
    .put({
      access: 'internal',
      path: APIRoutes.PUT_INDEX_MAPPINGS,
      security: {
        authz: {
          requiredPrivileges: [PLUGIN_ID],
        },
      },
    })
    .addVersion(
      {
        security: {
          authz: {
            requiredPrivileges: [PLUGIN_ID],
          },
        },
        version: ROUTE_VERSIONS.v1,
        validate: {
          request: {
            body: schema.object({
              index: schema.string(),
              mappings: schema.recordOf(schema.string(), schema.any()),
            }),
          },
        },
      },
      errorHandler(logger)(async (context, request, response) => {
        const esClient = (await context.core).elasticsearch.client.asCurrentUser;
        const { index, mappings: newMappings } = request.body;

        await esClient.indices.putMapping({
          ...newMappings,
          index,
        });

        const updated = await esClient.indices.getMapping({ index });
        return response.ok({
          body: {
            mappings: (updated[index]?.mappings ?? {}) as Record<string, unknown>,
          },
          headers: { 'content-type': 'application/json' },
        });
      })
    );

  // List ingest pipelines
  router.versioned
    .get({
      access: 'internal',
      path: APIRoutes.GET_PIPELINES,
      security: {
        authz: {
          requiredPrivileges: [PLUGIN_ID],
        },
      },
    })
    .addVersion(
      {
        security: {
          authz: {
            requiredPrivileges: [PLUGIN_ID],
          },
        },
        version: ROUTE_VERSIONS.v1,
        validate: {
          request: {},
        },
      },
      errorHandler(logger)(async (context, request, response) => {
        const esClient = (await context.core).elasticsearch.client.asCurrentUser;

        const result = await esClient.ingest.getPipeline();

        const pipelines: PipelineInfo[] = Object.entries(result).map(([id, pipeline]) => ({
          id,
          description: pipeline.description,
          processors: pipeline.processors ?? [],
        }));

        const body: PipelineListResponse = { pipelines };
        return response.ok({
          body,
          headers: { 'content-type': 'application/json' },
        });
      })
    );

  // Update ingest pipeline
  router.versioned
    .put({
      access: 'internal',
      path: APIRoutes.PUT_PIPELINE,
      security: {
        authz: {
          requiredPrivileges: [PLUGIN_ID],
        },
      },
    })
    .addVersion(
      {
        security: {
          authz: {
            requiredPrivileges: [PLUGIN_ID],
          },
        },
        version: ROUTE_VERSIONS.v1,
        validate: {
          request: {
            params: schema.object({ id: schema.string() }),
            body: schema.object({
              description: schema.maybe(schema.string()),
              processors: schema.arrayOf(schema.recordOf(schema.string(), schema.any())),
            }),
          },
        },
      },
      errorHandler(logger)(async (context, request, response) => {
        const esClient = (await context.core).elasticsearch.client.asCurrentUser;
        const { id } = request.params;
        const { description, processors } = request.body;

        await esClient.ingest.putPipeline({
          id,
          description,
          processors,
        });

        const updated = await esClient.ingest.getPipeline({ id });
        const pipeline = updated[id];
        const pipelineInfo: PipelineInfo = {
          id,
          description: pipeline?.description,
          processors: pipeline?.processors ?? [],
        };

        return response.ok({
          body: pipelineInfo,
          headers: { 'content-type': 'application/json' },
        });
      })
    );
};
