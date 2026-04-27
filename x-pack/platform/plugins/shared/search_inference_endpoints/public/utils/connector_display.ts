/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { InferenceAPIConfigResponse } from '@kbn/ml-trained-models-utils';
import type { InferenceConnector } from '@kbn/inference-common';
import { InferenceConnectorType } from '@kbn/inference-common';
import { SERVICE_PROVIDERS } from '@kbn/inference-endpoint-ui-common';
import type { ServiceProviderKeys } from '@kbn/inference-endpoint-ui-common';
import {
  isEisEndpoint,
  getModelName,
  getModelCreator,
  getProviderKeyForCreator,
} from './eis_utils';
import { getModelId } from './get_model_id';

/**
 * Returns the icon identifier for a given connector, suitable for use with EuiIcon.
 */
export const getConnectorIcon = (connector: InferenceConnector): string => {
  let key: string | undefined;
  switch (connector.type) {
    case InferenceConnectorType.OpenAI:
      key = connector.config?.apiProvider === 'Azure OpenAI' ? 'azureopenai' : 'openai';
      break;
    case InferenceConnectorType.Bedrock:
      key = 'amazonbedrock';
      break;
    case InferenceConnectorType.Gemini:
      key = 'googlevertexai';
      break;
    case InferenceConnectorType.Inference:
      key =
        getProviderKeyForCreator(connector.config?.modelCreator) ??
        connector.config?.service ??
        connector.config?.provider;
      break;
  }
  return SERVICE_PROVIDERS[key as ServiceProviderKeys]?.icon ?? 'compute';
};

/**
 * Returns the task type of a connector.
 *
 * Stack connectors (OpenAI, Bedrock, Gemini) are inherently chat_completion connectors.
 * ES inference endpoint connectors store their task type in `config.taskType`.
 */
export const getConnectorTaskType = (connector: InferenceConnector): string | undefined => {
  if (connector.isInferenceEndpoint) {
    return connector.config?.taskType;
  }
  // Stack connectors (OpenAI, Bedrock, Gemini) are always chat_completion
  return 'chat_completion';
};

/** Normalised item used by the Add Model popover. */
export interface ModelOption {
  id: string;
  name: string;
  icon: string;
  taskType: string | undefined;
}

/**
 * Returns the icon for a raw ES inference endpoint (not wrapped in an InferenceConnector).
 */
const getEndpointIcon = (endpoint: InferenceAPIConfigResponse): string => {
  if (isEisEndpoint(endpoint)) {
    const creator = getModelCreator(endpoint);
    const providerKey = getProviderKeyForCreator(creator);
    return (providerKey && SERVICE_PROVIDERS[providerKey]?.icon) ?? 'compute';
  }
  const provider = SERVICE_PROVIDERS[endpoint.service as ServiceProviderKeys];
  return provider?.icon ?? 'compute';
};

/**
 * Returns the display name for a raw ES inference endpoint.
 */
const getEndpointName = (endpoint: InferenceAPIConfigResponse): string => {
  if (isEisEndpoint(endpoint)) {
    return getModelName(endpoint);
  }
  return getModelId(endpoint) ?? endpoint.inference_id;
};

/**
 * Merges connectors (from `useConnectors`, which includes stack connectors
 * and `chat_completion` inference endpoints) with the full set of ES inference
 * endpoints (from `useQueryInferenceEndpoints`, all task types).
 *
 * Connectors are the primary source because they carry richer display information.
 * Inference endpoints that are not already represented as connectors are added so
 * that non-`chat_completion` task types (e.g. `completion`, `text_embedding`) are
 * still available for selection.
 */
export const mergeConnectorsAndEndpoints = (
  connectors: InferenceConnector[],
  inferenceEndpoints: InferenceAPIConfigResponse[]
): ModelOption[] => {
  const seen = new Set<string>();
  const items: ModelOption[] = [];

  // 1. Add all connectors first (stack connectors + chat_completion inference endpoints).
  for (const connector of connectors) {
    seen.add(connector.connectorId);
    items.push({
      id: connector.connectorId,
      name: connector.name,
      icon: getConnectorIcon(connector),
      taskType: getConnectorTaskType(connector),
    });
  }

  // 2. Add inference endpoints that weren't already covered by connectors.
  //    This covers non-chat_completion task types (completion, text_embedding, etc.).
  for (const endpoint of inferenceEndpoints) {
    if (!seen.has(endpoint.inference_id)) {
      seen.add(endpoint.inference_id);
      items.push({
        id: endpoint.inference_id,
        name: getEndpointName(endpoint),
        icon: getEndpointIcon(endpoint),
        taskType: endpoint.task_type,
      });
    }
  }

  return items;
};
