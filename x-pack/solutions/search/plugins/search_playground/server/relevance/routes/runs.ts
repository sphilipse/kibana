/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';
import { i18n } from '@kbn/i18n';
import {
  PLUGIN_ID,
  ROUTE_VERSIONS,
  EVALUATION_RUN_SAVED_OBJECT_TYPE,
} from '../../../common';
import type { DefineRoutesOptions } from '../../types';
import { APIRoutes } from '../../types';
import type {
  EvaluationRunSavedObject,
  EvaluationRunResponse,
  EvaluationRunListResponse,
} from '../../../common/types';
import { errorHandler } from '../../utils/error_handler';
import {
  parseEvaluationRunSO,
  parseEvaluationRunSOList,
  compareRuns,
} from '../utils/evaluation_runs';
import { SavedObjectsFindOptions } from '@kbn/core/server';

export const defineEvaluationRunRoutes = ({ logger, router }: DefineRoutesOptions) => {
  // List
  router.versioned
    .get({
      access: 'internal',
      path: APIRoutes.GET_EVALUATION_RUNS,
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
        validate: {
          request: {
            query: schema.object({
              page: schema.number({ defaultValue: 1, min: 1 }),
              size: schema.number({ defaultValue: 10, min: 1, max: 1000 }),
              sortField: schema.string({ defaultValue: 'updated_at' }),
              sortOrder: schema.oneOf([schema.literal('desc'), schema.literal('asc')], {
                defaultValue: 'desc',
              }),
              judgmentSetId: schema.maybe(schema.string()),
            }),
          },
        },
        version: ROUTE_VERSIONS.v1,
      },
      errorHandler(logger)(async (context, request, response) => {
        const soClient = (await context.core).savedObjects.client;
        const { page, size, sortField, sortOrder, judgmentSetId } = request.query;

        const findOptions: SavedObjectsFindOptions = {
          type: EVALUATION_RUN_SAVED_OBJECT_TYPE,
          perPage: size,
          page,
          sortField,
          sortOrder,
        };

        if (judgmentSetId) {
          findOptions.filter = `${EVALUATION_RUN_SAVED_OBJECT_TYPE}.attributes.judgmentSetId: ${judgmentSetId}`;
        }

        const soResult = await soClient.find<EvaluationRunSavedObject>(findOptions);
        const body: EvaluationRunListResponse = parseEvaluationRunSOList(soResult);
        return response.ok({
          body,
          headers: { 'content-type': 'application/json' },
        });
      })
    );

  // Get by ID
  router.versioned
    .get({
      access: 'internal',
      path: APIRoutes.GET_EVALUATION_RUN,
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
        validate: {
          request: {
            params: schema.object({ id: schema.string() }),
          },
        },
        version: ROUTE_VERSIONS.v1,
      },
      errorHandler(logger)(async (context, request, response) => {
        const soClient = (await context.core).savedObjects.client;
        const so = await soClient.get<EvaluationRunSavedObject>(
          EVALUATION_RUN_SAVED_OBJECT_TYPE,
          request.params.id
        );
        if (so.error) {
          if (so.error.statusCode === 404) {
            return response.notFound({
              body: {
                message: i18n.translate(
                  'xpack.searchPlayground.relevance.evaluationRunNotFound',
                  {
                    defaultMessage: 'Evaluation run {id} not found',
                    values: { id: request.params.id },
                  }
                ),
              },
            });
          }
          return response.customError({
            statusCode: so.error.statusCode,
            body: {
              message: so.error.message,
              attributes: {
                error: so.error.error,
                ...(so.error.metadata ?? {}),
              },
            },
          });
        }
        const body: EvaluationRunResponse = parseEvaluationRunSO(so);
        return response.ok({
          body,
          headers: { 'content-type': 'application/json' },
        });
      })
    );

  // Delete
  router.versioned
    .delete({
      access: 'internal',
      path: APIRoutes.DELETE_EVALUATION_RUN,
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
          },
        },
      },
      errorHandler(logger)(async (context, request, response) => {
        const soClient = (await context.core).savedObjects.client;
        await soClient.delete(EVALUATION_RUN_SAVED_OBJECT_TYPE, request.params.id);
        return response.ok();
      })
    );

  // Compare two runs
  router.versioned
    .post({
      access: 'internal',
      path: APIRoutes.POST_COMPARE_RUNS,
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
              baselineRunId: schema.string(),
              comparisonRunId: schema.string(),
            }),
          },
        },
      },
      errorHandler(logger)(async (context, request, response) => {
        const soClient = (await context.core).savedObjects.client;
        const { baselineRunId, comparisonRunId } = request.body;

        const bulkResult = await soClient.bulkGet<EvaluationRunSavedObject>([
          { type: EVALUATION_RUN_SAVED_OBJECT_TYPE, id: baselineRunId },
          { type: EVALUATION_RUN_SAVED_OBJECT_TYPE, id: comparisonRunId },
        ]);

        const notFound = bulkResult.saved_objects.find((so) => so.error);
        if (notFound) {
          return response.notFound({
            body: {
              message: i18n.translate(
                'xpack.searchPlayground.relevance.compareRunNotFound',
                {
                  defaultMessage: 'Evaluation run {id} not found',
                  values: { id: notFound.id },
                }
              ),
            },
          });
        }

        const [baselineSO, comparisonSO] = bulkResult.saved_objects;
        const body = compareRuns(baselineSO, comparisonSO);

        return response.ok({
          body,
          headers: { 'content-type': 'application/json' },
        });
      })
    );
};
