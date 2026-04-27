/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EuiThemeProvider } from '@elastic/eui';
import { I18nProvider } from '@kbn/i18n-react';
import { QueryClient, QueryClientProvider } from '@kbn/react-query';
import { InferenceConnectorType } from '@kbn/inference-common';
import type { InferenceConnector } from '@kbn/inference-common';
import type { InferenceAPIConfigResponse } from '@kbn/ml-trained-models-utils';
import { AddModelPopover } from './add_model_popover';
import { useConnectors } from '../../hooks/use_connectors';
import { useQueryInferenceEndpoints } from '../../hooks/use_inference_endpoints';

jest.mock('../../hooks/use_connectors');
jest.mock('../../hooks/use_inference_endpoints');

const mockUseConnectors = useConnectors as jest.Mock;
const mockUseQueryInferenceEndpoints = useQueryInferenceEndpoints as jest.Mock;

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <EuiThemeProvider>
        <I18nProvider>{children}</I18nProvider>
      </EuiThemeProvider>
    </QueryClientProvider>
  );
};

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

/**
 * Connectors returned by useConnectors():
 * - Stack connectors (OpenAI, Bedrock) — always chat_completion
 * - ES inference endpoints with chat_completion task type
 *
 * The server-side /internal/inference/connectors endpoint only returns
 * chat_completion inference endpoints, so non-chat_completion endpoints
 * (like text_embedding or completion) are NOT present here.
 */
const mockConnectors: InferenceConnector[] = [
  createConnector({
    connectorId: 'ep-1',
    name: 'OpenAI GPT-4o',
    type: InferenceConnectorType.Inference,
    config: { taskType: 'chat_completion', service: 'openai' },
    isInferenceEndpoint: true,
  }),
  createConnector({
    connectorId: 'ep-2',
    name: 'OpenAI GPT-4o-mini',
    type: InferenceConnectorType.Inference,
    config: { taskType: 'chat_completion', service: 'openai' },
    isInferenceEndpoint: true,
  }),
  createConnector({
    connectorId: 'ep-eis',
    name: 'Claude Sonnet',
    type: InferenceConnectorType.Inference,
    config: { taskType: 'chat_completion', service: 'elastic', modelCreator: 'Anthropic' },
    isInferenceEndpoint: true,
    isEis: true,
  }),
  createConnector({
    connectorId: 'stack-openai-1',
    name: 'My OpenAI Connector',
    type: InferenceConnectorType.OpenAI,
    config: { apiProvider: 'OpenAI' },
    isInferenceEndpoint: false,
  }),
  createConnector({
    connectorId: 'stack-bedrock-1',
    name: 'My Bedrock Connector',
    type: InferenceConnectorType.Bedrock,
    config: {},
    isInferenceEndpoint: false,
  }),
];

/**
 * Inference endpoints returned by useQueryInferenceEndpoints():
 * - ALL ES inference endpoints regardless of task type
 * - Includes the same chat_completion endpoints that appear in connectors,
 *   plus non-chat_completion endpoints (text_embedding, completion, etc.)
 */
const mockInferenceEndpoints = [
  // These overlap with connectors above — the merge deduplicates them
  {
    inference_id: 'ep-1',
    service: 'openai',
    task_type: 'chat_completion',
    service_settings: { model_id: 'gpt-4o' },
  },
  {
    inference_id: 'ep-2',
    service: 'openai',
    task_type: 'chat_completion',
    service_settings: { model_id: 'gpt-4o-mini' },
  },
  {
    inference_id: 'ep-eis',
    service: 'elastic',
    task_type: 'chat_completion',
    service_settings: { model_id: 'claude-sonnet' },
    metadata: { display: { name: 'Claude Sonnet', model_creator: 'Anthropic' } },
  },
  // These are ONLY in inference endpoints — not in connectors
  {
    inference_id: 'ep-embed',
    service: 'elastic',
    task_type: 'text_embedding',
    service_settings: { model_id: 'e5' },
    metadata: { display: { name: 'E5 Embedding' } },
  },
  {
    inference_id: 'ep-completion',
    service: 'openai',
    task_type: 'completion',
    service_settings: { model_id: 'gpt-4o-completion' },
  },
] as InferenceAPIConfigResponse[];

describe('AddModelPopover', () => {
  const onAdd = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseConnectors.mockReturnValue({ data: mockConnectors });
    mockUseQueryInferenceEndpoints.mockReturnValue({ data: mockInferenceEndpoints });
  });

  it('renders the add model button', () => {
    render(
      <Wrapper>
        <AddModelPopover existingEndpointIds={[]} onAdd={onAdd} />
      </Wrapper>
    );

    expect(screen.getByTestId('add-model-button')).toBeInTheDocument();
  });

  it('opens popover on button click', () => {
    render(
      <Wrapper>
        <AddModelPopover existingEndpointIds={[]} onAdd={onAdd} />
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('add-model-button'));

    expect(screen.getByTestId('add-model-search')).toBeInTheDocument();
  });

  it('excludes existing endpoint IDs from the list', () => {
    render(
      <Wrapper>
        <AddModelPopover existingEndpointIds={['ep-1']} onAdd={onAdd} />
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('add-model-button'));

    expect(screen.queryByText('OpenAI GPT-4o')).not.toBeInTheDocument();
    expect(screen.getByText('OpenAI GPT-4o-mini')).toBeInTheDocument();
  });

  it('shows non-chat_completion inference endpoints via the endpoints source', () => {
    render(
      <Wrapper>
        <AddModelPopover existingEndpointIds={[]} onAdd={onAdd} taskType="text_embedding" />
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('add-model-button'));

    // text_embedding endpoint comes from useQueryInferenceEndpoints, not from useConnectors
    expect(screen.getByText('E5 Embedding')).toBeInTheDocument();
    expect(screen.queryByText('OpenAI GPT-4o')).not.toBeInTheDocument();
    expect(screen.queryByText('My OpenAI Connector')).not.toBeInTheDocument();
  });

  it('shows completion inference endpoints via the endpoints source', () => {
    render(
      <Wrapper>
        <AddModelPopover existingEndpointIds={[]} onAdd={onAdd} taskType="completion" />
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('add-model-button'));

    // completion endpoint comes from useQueryInferenceEndpoints, not from useConnectors
    expect(screen.getByText('gpt-4o-completion')).toBeInTheDocument();
    expect(screen.queryByText('OpenAI GPT-4o')).not.toBeInTheDocument();
  });

  it('lists stack connectors for chat_completion task type', () => {
    render(
      <Wrapper>
        <AddModelPopover existingEndpointIds={[]} onAdd={onAdd} taskType="chat_completion" />
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('add-model-button'));

    expect(screen.getByText('My OpenAI Connector')).toBeInTheDocument();
    expect(screen.getByText('My Bedrock Connector')).toBeInTheDocument();
    expect(screen.getByText('OpenAI GPT-4o')).toBeInTheDocument();
  });

  it('lists all models when no task type filter', () => {
    render(
      <Wrapper>
        <AddModelPopover existingEndpointIds={[]} onAdd={onAdd} />
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('add-model-button'));

    // Stack connectors
    expect(screen.getByText('My OpenAI Connector')).toBeInTheDocument();
    expect(screen.getByText('My Bedrock Connector')).toBeInTheDocument();
    // chat_completion inference endpoints (from connectors)
    expect(screen.getByText('OpenAI GPT-4o')).toBeInTheDocument();
    // non-chat_completion inference endpoints (from inference endpoints, filled in by merge)
    expect(screen.getByText('E5 Embedding')).toBeInTheDocument();
    expect(screen.getByText('gpt-4o-completion')).toBeInTheDocument();
  });

  it('deduplicates: connector representation wins over inference endpoint', () => {
    // ep-1 exists in both connectors (name='OpenAI GPT-4o') and inference endpoints
    // (model_id='gpt-4o'). The connector name should be used.
    render(
      <Wrapper>
        <AddModelPopover existingEndpointIds={[]} onAdd={onAdd} taskType="chat_completion" />
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('add-model-button'));

    // Connector name is used, not the model_id from inference endpoint
    expect(screen.getByText('OpenAI GPT-4o')).toBeInTheDocument();
    // Should not show the raw model_id as a separate entry
    expect(screen.queryByText('gpt-4o')).not.toBeInTheDocument();
  });

  it('calls onAdd with the selected connector ID', () => {
    render(
      <Wrapper>
        <AddModelPopover existingEndpointIds={[]} onAdd={onAdd} />
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('add-model-button'));
    fireEvent.click(screen.getByText('My OpenAI Connector'));

    expect(onAdd).toHaveBeenCalledWith('stack-openai-1');
  });

  it('calls onAdd with inference endpoint ID for non-connector endpoints', () => {
    render(
      <Wrapper>
        <AddModelPopover existingEndpointIds={[]} onAdd={onAdd} taskType="completion" />
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('add-model-button'));
    fireEvent.click(screen.getByText('gpt-4o-completion'));

    expect(onAdd).toHaveBeenCalledWith('ep-completion');
  });

  it('shows disambiguation suffix when multiple models share a name', () => {
    const duplicateConnectors = [
      createConnector({
        connectorId: 'ep-a',
        name: 'My Connector',
        type: InferenceConnectorType.Inference,
        config: { taskType: 'chat_completion', service: 'openai' },
        isInferenceEndpoint: true,
      }),
      createConnector({
        connectorId: 'ep-b',
        name: 'My Connector',
        type: InferenceConnectorType.Inference,
        config: { taskType: 'chat_completion', service: 'openai' },
        isInferenceEndpoint: true,
      }),
    ];
    mockUseConnectors.mockReturnValue({ data: duplicateConnectors });
    mockUseQueryInferenceEndpoints.mockReturnValue({ data: [] });

    render(
      <Wrapper>
        <AddModelPopover existingEndpointIds={[]} onAdd={onAdd} />
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('add-model-button'));

    expect(screen.getByText('My Connector (ep-a)')).toBeInTheDocument();
    expect(screen.getByText('My Connector (ep-b)')).toBeInTheDocument();
  });

  it('handles empty connectors gracefully, showing only inference endpoints', () => {
    mockUseConnectors.mockReturnValue({ data: [] });

    render(
      <Wrapper>
        <AddModelPopover existingEndpointIds={[]} onAdd={onAdd} />
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('add-model-button'));

    expect(screen.getByText('E5 Embedding')).toBeInTheDocument();
    expect(screen.getByText('gpt-4o-completion')).toBeInTheDocument();
  });

  it('handles empty inference endpoints gracefully, showing only connectors', () => {
    mockUseQueryInferenceEndpoints.mockReturnValue({ data: [] });

    render(
      <Wrapper>
        <AddModelPopover existingEndpointIds={[]} onAdd={onAdd} />
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('add-model-button'));

    expect(screen.getByText('My OpenAI Connector')).toBeInTheDocument();
    expect(screen.getByText('My Bedrock Connector')).toBeInTheDocument();
  });
});
