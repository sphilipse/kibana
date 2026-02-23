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
  JUDGMENT_SET_SAVED_OBJECT_TYPE,
  EVALUATION_RUN_SAVED_OBJECT_TYPE,
} from '../../../common';
import type { DefineRoutesOptions } from '../../types';
import { APIRoutes } from '../../types';
import type {
  JudgmentSetSavedObject,
  EvaluationRunSavedObject,
  EvaluationRunResponse,
  PerQueryScore,
} from '../../../common/types';
import { errorHandler } from '../../utils/error_handler';
import { buildRankEvalRequest } from '../lib/build_rank_eval_request';
import { computeClientMetrics } from '../lib/compute_client_metrics';
import { metricConfigSchema } from '../evaluation_run_saved_object/schema/v1/v1';

const evaluateBodySchema = schema.object({
  judgmentSetId: schema.string(),
  queryTemplateJSON: schema.string(),
  metric: metricConfigSchema,
  indices: schema.arrayOf(schema.string(), { minSize: 1 }),
  name: schema.maybe(schema.string()),
  passThreshold: schema.maybe(schema.number({ min: 0, max: 1 })),
});

export const defineEvaluateRoute = ({ logger, router }: DefineRoutesOptions) => {
  router.versioned
    .post({
      access: 'internal',
      path: APIRoutes.POST_EVALUATE,
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
            body: evaluateBodySchema,
          },
        },
      },
      errorHandler(logger)(async (context, request, response) => {
        const { judgmentSetId, queryTemplateJSON, metric, indices, name, passThreshold } =
          request.body;
        const core = await context.core;
        const soClient = core.savedObjects.client;
        const esClient = core.elasticsearch.client.asCurrentUser;

        // Fetch the judgment set
        const judgmentSetSO = await soClient.get<JudgmentSetSavedObject>(
          JUDGMENT_SET_SAVED_OBJECT_TYPE,
          judgmentSetId
        );

        if (judgmentSetSO.error) {
          if (judgmentSetSO.error.statusCode === 404) {
            return response.notFound({
              body: {
                message: i18n.translate(
                  'xpack.searchPlayground.relevance.judgmentSetNotFoundForEval',
                  {
                    defaultMessage: 'Judgment set {id} not found',
                    values: { id: judgmentSetId },
                  }
                ),
              },
            });
          }
          return response.customError({
            statusCode: judgmentSetSO.error.statusCode,
            body: { message: judgmentSetSO.error.message },
          });
        }

        // Parse query template
        let queryTemplate: Record<string, unknown>;
        try {
          queryTemplate = JSON.parse(queryTemplateJSON);
        } catch (e) {
          return response.badRequest({
            body: {
              message: i18n.translate(
                'xpack.searchPlayground.relevance.invalidQueryTemplate',
                {
                  defaultMessage: 'Invalid query template JSON: {error}',
                  values: { error: e.message },
                }
              ),
            },
          });
        }

        // Build and execute _rank_eval
        const rankEvalRequest = buildRankEvalRequest(
          judgmentSetSO.attributes,
          queryTemplate,
          metric,
          indices
        );

        let rankEvalResponse;
        try {
          rankEvalResponse = await esClient.rankEval(rankEvalRequest);
        } catch (e) {
          return response.customError({
            statusCode: 502,
            body: {
              message: i18n.translate(
                'xpack.searchPlayground.relevance.rankEvalFailed',
                {
                  defaultMessage: 'Elasticsearch _rank_eval request failed: {error}',
                  values: { error: e.message },
                }
              ),
            },
          });
        }

        // Parse results
        const perQueryScores: PerQueryScore[] = Object.entries(
          rankEvalResponse.details
        ).map(([query, detail]) => ({
          query,
          score: detail.metric_score,
          unratedDocs: detail.unrated_docs?.length ?? 0,
        }));

        const clientMetricsResult = computeClientMetrics(perQueryScores, {
          ...(passThreshold != null && { passThreshold }),
        });

        const runAttributes: EvaluationRunSavedObject = {
          judgmentSetId,
          name,
          timestamp: new Date().toISOString(),
          queryTemplateJSON,
          metric,
          overallScore: rankEvalResponse.metric_score,
          perQueryScores,
          clientMetrics: clientMetricsResult,
        };

        // Persist the run
        const runSO = await soClient.create<EvaluationRunSavedObject>(
          EVALUATION_RUN_SAVED_OBJECT_TYPE,
          runAttributes
        );

        const body: EvaluationRunResponse = {
          _meta: {
            id: runSO.id,
            createdAt: runSO.created_at,
            createdBy: runSO.created_by,
            updatedAt: runSO.updated_at,
            updatedBy: runSO.updated_by,
          },
          data: runSO.attributes,
        };

        return response.ok({
          body,
          headers: { 'content-type': 'application/json' },
        });
      })
    );
};
