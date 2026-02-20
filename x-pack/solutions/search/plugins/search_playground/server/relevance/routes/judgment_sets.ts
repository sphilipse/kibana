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
} from '../../../common';
import type { DefineRoutesOptions } from '../../types';
import { APIRoutes } from '../../types';
import type {
  JudgmentSetSavedObject,
  JudgmentSetResponse,
  JudgmentSetListResponse,
} from '../../../common/types';
import { errorHandler } from '../../utils/error_handler';
import { judgmentSetAttributesSchema } from '../judgment_set_saved_object/schema/v1/v1';
import { parseJudgmentSetSO, parseJudgmentSetSOList } from '../utils/judgment_sets';

export const defineJudgmentSetRoutes = ({ logger, router }: DefineRoutesOptions) => {
  // List
  router.versioned
    .get({
      access: 'internal',
      path: APIRoutes.GET_JUDGMENT_SETS,
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
            }),
          },
        },
        version: ROUTE_VERSIONS.v1,
      },
      errorHandler(logger)(async (context, request, response) => {
        const soClient = (await context.core).savedObjects.client;
        const soResult = await soClient.find<JudgmentSetSavedObject>({
          type: JUDGMENT_SET_SAVED_OBJECT_TYPE,
          perPage: request.query.size,
          page: request.query.page,
          sortField: request.query.sortField,
          sortOrder: request.query.sortOrder,
        });
        const body: JudgmentSetListResponse = parseJudgmentSetSOList(soResult);
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
      path: APIRoutes.GET_JUDGMENT_SET,
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
        const so = await soClient.get<JudgmentSetSavedObject>(
          JUDGMENT_SET_SAVED_OBJECT_TYPE,
          request.params.id
        );
        if (so.error) {
          if (so.error.statusCode === 404) {
            return response.notFound({
              body: {
                message: i18n.translate(
                  'xpack.searchPlayground.relevance.judgmentSetNotFound',
                  {
                    defaultMessage: '{id} judgment set not found',
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
        const body: JudgmentSetResponse = parseJudgmentSetSO(so);
        return response.ok({
          body,
          headers: { 'content-type': 'application/json' },
        });
      })
    );

  // Create
  router.versioned
    .put({
      access: 'internal',
      path: APIRoutes.PUT_JUDGMENT_SET_CREATE,
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
            body: judgmentSetAttributesSchema,
          },
        },
      },
      errorHandler(logger)(async (context, request, response) => {
        const soClient = (await context.core).savedObjects.client;
        const so = await soClient.create<JudgmentSetSavedObject>(
          JUDGMENT_SET_SAVED_OBJECT_TYPE,
          request.body
        );
        if (so.error) {
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
        const body: JudgmentSetResponse = parseJudgmentSetSO(so);
        return response.ok({
          body,
          headers: { 'content-type': 'application/json' },
        });
      })
    );

  // Update
  router.versioned
    .put({
      access: 'internal',
      path: APIRoutes.PUT_JUDGMENT_SET_UPDATE,
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
            body: judgmentSetAttributesSchema,
          },
        },
      },
      errorHandler(logger)(async (context, request, response) => {
        const soClient = (await context.core).savedObjects.client;
        const so = await soClient.update<JudgmentSetSavedObject>(
          JUDGMENT_SET_SAVED_OBJECT_TYPE,
          request.params.id,
          request.body
        );
        if (so.error) {
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
        const updated = await soClient.get<JudgmentSetSavedObject>(
          JUDGMENT_SET_SAVED_OBJECT_TYPE,
          request.params.id
        );
        const body: JudgmentSetResponse = parseJudgmentSetSO(updated);
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
      path: APIRoutes.DELETE_JUDGMENT_SET,
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
        await soClient.delete(JUDGMENT_SET_SAVED_OBJECT_TYPE, request.params.id);
        return response.ok();
      })
    );
};
