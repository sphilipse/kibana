/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { InferenceConnector } from '@kbn/inference-common';
import { InferenceConnectorType } from '@kbn/inference-common';
import { SERVICE_PROVIDERS } from '@kbn/inference-endpoint-ui-common';
import type { ServiceProviderKeys } from '@kbn/inference-endpoint-ui-common';
import { getProviderKeyForCreator } from './eis_utils';

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
