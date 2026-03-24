/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { UseQueryResult } from '@kbn/react-query';
import { useQuery } from '@kbn/react-query';
import type { IHttpFetchError, HttpSetup } from '@kbn/core-http-browser';
import type { IToasts } from '@kbn/core-notifications-browser';
import type { OpenAiProviderType } from '@kbn/connector-schemas/openai';
import type { SettingsStart } from '@kbn/core-ui-settings-browser';
import { type InferenceConnector, defaultInferenceEndpoints } from '@kbn/inference-common';
import {
  GEN_AI_SETTINGS_DEFAULT_AI_CONNECTOR,
  GEN_AI_SETTINGS_DEFAULT_AI_CONNECTOR_DEFAULT_ONLY,
} from '@kbn/management-settings-ids';
import { i18n } from '@kbn/i18n';
import type { AIConnector } from './types';

const INFERENCE_CONNECTORS_PATH = '/internal/search_inference_endpoints/connectors';
const QUERY_KEY = ['kbn-inference-connectors', 'load-connectors'];

export interface UseLoadConnectorsProps {
  http: HttpSetup;
  toasts?: IToasts;
  /**
   * Feature identifier used to scope which inference endpoints are relevant.
   * Passed to the search_inference_endpoints API to resolve feature-specific endpoints.
   */
  featureId: string;
  settings: SettingsStart;
}

const toAIConnector = (
  connector: InferenceConnector & { isRecommended?: boolean }
): AIConnector => ({
  id: connector.connectorId,
  name: connector.name,
  actionTypeId: connector.type,
  config: connector.config,
  secrets: {},
  isPreconfigured: connector.isPreconfigured,
  isSystemAction: false,
  isDeprecated: false,
  isConnectorTypeDeprecated: false,
  isMissingSecrets: false,
  isRecommended: connector.isRecommended,
  apiProvider:
    !connector.isPreconfigured && connector.config?.apiProvider
      ? (connector.config.apiProvider as OpenAiProviderType)
      : undefined,
});

const applyConnectorSettings = <T extends { id: string }>(
  allConnectors: T[],
  settings: SettingsStart
): T[] => {
  const defaultConnectorId = settings.client.get<string>(GEN_AI_SETTINGS_DEFAULT_AI_CONNECTOR);
  const defaultConnectorOnly = settings.client.get<boolean>(
    GEN_AI_SETTINGS_DEFAULT_AI_CONNECTOR_DEFAULT_ONLY,
    false
  );

  if (defaultConnectorOnly && defaultConnectorId) {
    const connector = allConnectors.find((c) => c.id === defaultConnectorId);
    return connector ? [connector] : allConnectors;
  }
  return allConnectors;
};

interface FetchConnectorsResponse {
  connectors: InferenceConnector[];
  allConnectors: InferenceConnector[];
  isFromRecommendation: boolean;
}

const DEFAULT_KIBANA_ENDPOINT_ID = defaultInferenceEndpoints.KIBANA_DEFAULT_CHAT_COMPLETION;

const fetchConnectorsForFeature = async (
  http: HttpSetup,
  featureId: string
): Promise<InferenceConnector[]> => {
  const { connectors, allConnectors, isFromRecommendation } =
    await http.get<FetchConnectorsResponse>(INFERENCE_CONNECTORS_PATH, {
      query: { featureId },
      version: '1',
    });

  if (isFromRecommendation) {
    const recommendedIds = new Set(connectors.map((c) => c.connectorId));
    const otherConnectors = allConnectors.filter((c) => !recommendedIds.has(c.connectorId));
    return [...connectors, ...otherConnectors];
  }

  // No recommendations — return full list with default endpoint first if present.
  const defaultIndex = connectors.findIndex((c) => c.connectorId === DEFAULT_KIBANA_ENDPOINT_ID);
  if (defaultIndex > 0) {
    const reordered = [...connectors];
    const [defaultConnector] = reordered.splice(defaultIndex, 1);
    reordered.unshift(defaultConnector);
    return reordered;
  }

  return connectors;
};

export const useLoadConnectors = ({
  http,
  toasts,
  featureId,
  settings,
}: UseLoadConnectorsProps): UseQueryResult<AIConnector[], IHttpFetchError> => {
  return useQuery(
    [...QUERY_KEY, featureId],
    async () => {
      const connectors = await fetchConnectorsForFeature(http, featureId);
      return applyConnectorSettings(connectors.map(toAIConnector), settings);
    },
    {
      retry: false,
      keepPreviousData: true,
      onError: (error: IHttpFetchError) => {
        if (error.name !== 'AbortError') {
          toasts?.addError(
            error.body && (error.body as { message?: string }).message
              ? new Error((error.body as { message: string }).message)
              : error,
            {
              title: i18n.translate('inferenceConnectors.useLoadConnectors.errorMessage', {
                defaultMessage: 'Error loading connectors',
              }),
            }
          );
        }
      },
    }
  );
};
