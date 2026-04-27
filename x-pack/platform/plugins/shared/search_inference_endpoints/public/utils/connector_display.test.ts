/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { InferenceConnectorType } from '@kbn/inference-common';
import type { InferenceConnector } from '@kbn/inference-common';
import type { InferenceAPIConfigResponse } from '@kbn/ml-trained-models-utils';
import {
  getConnectorIcon,
  getConnectorTaskType,
  mergeConnectorsAndEndpoints,
} from './connector_display';

const createConnector = (overrides: Partial<InferenceConnector>): InferenceConnector => ({
  type: InferenceConnectorType.Inference,
  name: 'test-connector',
  connectorId: 'test-id',
  config: {},
  capabilities: {},
  isInferenceEndpoint: true,
  isPreconfigured: false,
  ...overrides,
});

describe('getConnectorTaskType', () => {
  it('returns chat_completion for stack OpenAI connectors', () => {
    const connector = createConnector({
      type: InferenceConnectorType.OpenAI,
      isInferenceEndpoint: false,
    });
    expect(getConnectorTaskType(connector)).toBe('chat_completion');
  });

  it('returns chat_completion for stack Bedrock connectors', () => {
    const connector = createConnector({
      type: InferenceConnectorType.Bedrock,
      isInferenceEndpoint: false,
    });
    expect(getConnectorTaskType(connector)).toBe('chat_completion');
  });

  it('returns chat_completion for stack Gemini connectors', () => {
    const connector = createConnector({
      type: InferenceConnectorType.Gemini,
      isInferenceEndpoint: false,
    });
    expect(getConnectorTaskType(connector)).toBe('chat_completion');
  });

  it('returns config.taskType for inference endpoint connectors', () => {
    const connector = createConnector({
      isInferenceEndpoint: true,
      config: { taskType: 'text_embedding' },
    });
    expect(getConnectorTaskType(connector)).toBe('text_embedding');
  });

  it('returns undefined when inference endpoint connector has no taskType', () => {
    const connector = createConnector({
      isInferenceEndpoint: true,
      config: {},
    });
    expect(getConnectorTaskType(connector)).toBeUndefined();
  });
});

describe('getConnectorIcon', () => {
  it('returns openai icon for OpenAI connectors', () => {
    const connector = createConnector({
      type: InferenceConnectorType.OpenAI,
      config: { apiProvider: 'OpenAI' },
    });
    expect(getConnectorIcon(connector)).not.toBe('compute');
  });

  it('returns azureopenai icon for Azure OpenAI connectors', () => {
    const connector = createConnector({
      type: InferenceConnectorType.OpenAI,
      config: { apiProvider: 'Azure OpenAI' },
    });
    expect(getConnectorIcon(connector)).not.toBe('compute');
  });

  it('returns compute fallback for unknown provider', () => {
    const connector = createConnector({
      type: InferenceConnectorType.Inference,
      config: { service: 'unknown_service_xyz' },
    });
    expect(getConnectorIcon(connector)).toBe('compute');
  });
});

describe('mergeConnectorsAndEndpoints', () => {
  const connectors: InferenceConnector[] = [
    createConnector({
      connectorId: 'ep-1',
      name: 'Connector EP-1',
      config: { taskType: 'chat_completion', service: 'openai' },
    }),
    createConnector({
      connectorId: 'stack-openai',
      name: 'My Stack OpenAI',
      type: InferenceConnectorType.OpenAI,
      isInferenceEndpoint: false,
      config: { apiProvider: 'OpenAI' },
    }),
  ];

  const endpoints = [
    // Overlaps with connector ep-1
    {
      inference_id: 'ep-1',
      service: 'openai',
      task_type: 'chat_completion',
      service_settings: { model_id: 'gpt-4o' },
    },
    // New — not in connectors
    {
      inference_id: 'ep-embed',
      service: 'elastic',
      task_type: 'text_embedding',
      service_settings: { model_id: 'e5' },
      metadata: { display: { name: 'E5 Embedding' } },
    },
    // New — not in connectors
    {
      inference_id: 'ep-completion',
      service: 'openai',
      task_type: 'completion',
      service_settings: { model_id: 'gpt-4o-completion' },
    },
  ] as InferenceAPIConfigResponse[];

  it('includes all connectors', () => {
    const result = mergeConnectorsAndEndpoints(connectors, endpoints);
    const ids = result.map((r) => r.id);
    expect(ids).toContain('ep-1');
    expect(ids).toContain('stack-openai');
  });

  it('includes inference endpoints not present in connectors', () => {
    const result = mergeConnectorsAndEndpoints(connectors, endpoints);
    const ids = result.map((r) => r.id);
    expect(ids).toContain('ep-embed');
    expect(ids).toContain('ep-completion');
  });

  it('does not duplicate overlapping entries', () => {
    const result = mergeConnectorsAndEndpoints(connectors, endpoints);
    const ep1Entries = result.filter((r) => r.id === 'ep-1');
    expect(ep1Entries).toHaveLength(1);
  });

  it('uses connector display name for overlapping entries', () => {
    const result = mergeConnectorsAndEndpoints(connectors, endpoints);
    const ep1 = result.find((r) => r.id === 'ep-1');
    // Connector name wins over inference endpoint model_id
    expect(ep1?.name).toBe('Connector EP-1');
  });

  it('uses inference endpoint display name for non-connector entries', () => {
    const result = mergeConnectorsAndEndpoints(connectors, endpoints);
    const embed = result.find((r) => r.id === 'ep-embed');
    expect(embed?.name).toBe('E5 Embedding');
  });

  it('falls back to model_id for endpoints without display name metadata', () => {
    const result = mergeConnectorsAndEndpoints(connectors, endpoints);
    const completion = result.find((r) => r.id === 'ep-completion');
    expect(completion?.name).toBe('gpt-4o-completion');
  });

  it('preserves task type from each source', () => {
    const result = mergeConnectorsAndEndpoints(connectors, endpoints);
    expect(result.find((r) => r.id === 'ep-1')?.taskType).toBe('chat_completion');
    expect(result.find((r) => r.id === 'stack-openai')?.taskType).toBe('chat_completion');
    expect(result.find((r) => r.id === 'ep-embed')?.taskType).toBe('text_embedding');
    expect(result.find((r) => r.id === 'ep-completion')?.taskType).toBe('completion');
  });

  it('handles empty connectors', () => {
    const result = mergeConnectorsAndEndpoints([], endpoints);
    expect(result).toHaveLength(3);
  });

  it('handles empty endpoints', () => {
    const result = mergeConnectorsAndEndpoints(connectors, []);
    expect(result).toHaveLength(2);
  });

  it('handles both empty', () => {
    const result = mergeConnectorsAndEndpoints([], []);
    expect(result).toHaveLength(0);
  });
});
