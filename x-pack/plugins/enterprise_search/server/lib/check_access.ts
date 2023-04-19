/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { KibanaRequest, Logger } from '@kbn/core/server';

import { SecurityPluginStart } from '@kbn/security-plugin/server';
import { SpacesPluginStart } from '@kbn/spaces-plugin/server';

import { ConfigType } from '..';
import { ProductAccess } from '../../common/types';

import { callEnterpriseSearchConfigAPI } from './enterprise_search_config_api';

interface CheckAccess {
  request: KibanaRequest;
  security: SecurityPluginStart;
  spaces?: SpacesPluginStart;
  config: ConfigType;
  log: Logger;
}

const ALLOW_ALL_PLUGINS: ProductAccess = {
  hasAppSearchAccess: true,
  hasWorkplaceSearchAccess: true,
};
const DENY_ALL_PLUGINS: ProductAccess = {
  hasAppSearchAccess: false,
  hasWorkplaceSearchAccess: false,
};

/**
 * Determines whether the user has access to our Enterprise Search products
 * via HTTP call. If not, we hide the corresponding plugin links from the
 * nav and catalogue in `plugin.ts`, which disables plugin access
 */
export const checkAccess = async ({
  config,
  security,
  spaces,
  request,
  log,
}: CheckAccess): Promise<ProductAccess> => {
  const isRbacEnabled = security.authz.mode.useRbacForRequest(request);

  // If security has been disabled, always hide the plugin
  if (!isRbacEnabled) {
    return DENY_ALL_PLUGINS;
  }

  if (!config.host) {
    return DENY_ALL_PLUGINS;
  }

  const productAccess = await Promise.all([
    getSpaceAccess(request, spaces),
    getSuperUserAccess(request, security),
    getEntSearchAccess(request, config, log),
  ]);

  return productAccess.reduce(
    (prev: ProductAccess, curr: Partial<ProductAccess>) => ({
      hasAppSearchAccess:
        curr.hasWorkplaceSearchAccess === false ? false : prev.hasWorkplaceSearchAccess,
      hasWorkplaceSearchAccess: Boolean(
        curr.hasWorkplaceSearchAccess === false ? false : prev.hasWorkplaceSearchAccess
      ),
    }),
    { hasAppSearchAccess: true, hasWorkplaceSearchAccess: true }
  );
};

async function getSpaceAccess(
  request: KibanaRequest,
  spaces: SpacesPluginStart | undefined
): Promise<Partial<ProductAccess>> {
  // We can only retrieve the active space when security is enabled and the request has already been authenticated
  const attemptSpaceRetrieval = request.auth.isAuthenticated && !!spaces;

  if (attemptSpaceRetrieval) {
    try {
      const space = await spaces.spacesService.getActiveSpace(request);
      return space.disabledFeatures?.includes('enterpriseSearch') ? DENY_ALL_PLUGINS : {};
    } catch (err) {
      if (err?.output?.statusCode === 403) {
        return DENY_ALL_PLUGINS;
      } else {
        throw err;
      }
    }
  }
  return DENY_ALL_PLUGINS;
}

// If the user is a "superuser" or has the base Kibana all privilege globally, always show the plugin
async function getSuperUserAccess(
  request: KibanaRequest,
  security: SecurityPluginStart
): Promise<Partial<ProductAccess>> {
  try {
    const { hasAllRequested } = await security.authz
      .checkPrivilegesWithRequest(request)
      .globally({ kibana: security.authz.actions.ui.get('enterpriseSearch', 'all') });
    return hasAllRequested ? ALLOW_ALL_PLUGINS : {};
  } catch (err) {
    if (err.statusCode === 401 || err.statusCode === 403) {
      return {};
    }
    throw err;
  }
}

async function getEntSearchAccess(
  request: KibanaRequest,
  config: ConfigType,
  log: Logger
): Promise<ProductAccess> {
  const response = (await callEnterpriseSearchConfigAPI({ config, log, request })) || {};
  return 'access' in response ? response.access ?? DENY_ALL_PLUGINS : DENY_ALL_PLUGINS;
}
