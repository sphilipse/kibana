/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { __IntlProvider as IntlProvider } from '@kbn/i18n-react';
import { EuiThemeProvider } from '@elastic/eui';

import { IndexConfigPanel } from './index_config_panel';
import type { IndexConfigResponse, PipelineInfo } from '../../types';

jest.mock('@kbn/code-editor', () => ({
  CodeEditor: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (val: string) => void;
  }) => (
    <textarea
      data-test-subj="mockCodeEditor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <IntlProvider locale="en">
      <EuiThemeProvider>{ui}</EuiThemeProvider>
    </IntlProvider>
  );

const mockIndexConfig: IndexConfigResponse = {
  settings: {
    'my-index': {
      index: { number_of_shards: '1', number_of_replicas: '1' },
    },
  },
  mappings: {
    'my-index': {
      properties: { title: { type: 'text' }, body: { type: 'text' } },
    },
  },
};

const multiIndexConfig: IndexConfigResponse = {
  settings: {
    'index-a': { index: { number_of_shards: '1' } },
    'index-b': { index: { number_of_shards: '2' } },
  },
  mappings: {
    'index-a': { properties: { a: { type: 'text' } } },
    'index-b': { properties: { b: { type: 'keyword' } } },
  },
};

const mockPipelines: PipelineInfo[] = [
  {
    id: 'my-pipeline',
    description: 'Test pipeline',
    processors: [{ set: { field: 'foo', value: 'bar' } }],
  },
  {
    id: 'another-pipeline',
    processors: [{ remove: { field: 'baz' } }],
  },
];

const defaultProps = {
  indexConfig: mockIndexConfig,
  pipelines: mockPipelines,
  indices: ['my-index'],
  isLoading: false,
  isError: false,
  onSaveSettings: jest.fn(),
  onSaveMappings: jest.fn(),
  onSavePipeline: jest.fn(),
  isSavingSettings: false,
  isSavingMappings: false,
  isSavingPipeline: false,
};

describe('IndexConfigPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the panel with settings and mappings sections', () => {
    renderWithProviders(<IndexConfigPanel {...defaultProps} />);

    expect(screen.getByTestId('indexConfigPanel')).toBeInTheDocument();
    expect(screen.getByTestId('indexConfigSettingsAccordion')).toBeInTheDocument();
    expect(screen.getByTestId('indexConfigMappingsAccordion')).toBeInTheDocument();
    expect(screen.getByTestId('indexConfigPipelinesAccordion')).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading is true', () => {
    renderWithProviders(<IndexConfigPanel {...defaultProps} isLoading={true} />);

    expect(screen.getByTestId('indexConfigLoading')).toBeInTheDocument();
    expect(screen.queryByTestId('indexConfigSettingsAccordion')).not.toBeInTheDocument();
  });

  it('shows error state when isError is true', () => {
    renderWithProviders(<IndexConfigPanel {...defaultProps} isError={true} />);

    expect(screen.getByTestId('indexConfigError')).toBeInTheDocument();
  });

  it('shows error state when indexConfig is undefined', () => {
    renderWithProviders(<IndexConfigPanel {...defaultProps} indexConfig={undefined} />);

    expect(screen.getByTestId('indexConfigError')).toBeInTheDocument();
  });

  it('displays settings JSON in the editor', () => {
    renderWithProviders(<IndexConfigPanel {...defaultProps} />);

    const editors = screen.getAllByTestId('mockCodeEditor');
    const settingsEditor = editors[0] as HTMLTextAreaElement;
    const parsed = JSON.parse(settingsEditor.value);
    expect(parsed).toEqual({
      index: { number_of_shards: '1', number_of_replicas: '1' },
    });
  });

  it('displays mappings JSON in the editor', () => {
    renderWithProviders(<IndexConfigPanel {...defaultProps} />);

    const editors = screen.getAllByTestId('mockCodeEditor');
    const mappingsEditor = editors[1] as HTMLTextAreaElement;
    const parsed = JSON.parse(mappingsEditor.value);
    expect(parsed).toEqual({
      properties: { title: { type: 'text' }, body: { type: 'text' } },
    });
  });

  it('shows index selector when multiple indices are provided', () => {
    renderWithProviders(
      <IndexConfigPanel
        {...defaultProps}
        indexConfig={multiIndexConfig}
        indices={['index-a', 'index-b']}
      />
    );

    expect(screen.getByTestId('indexConfigIndexSelect')).toBeInTheDocument();
    const select = screen.getByTestId('indexConfigIndexSelect') as HTMLSelectElement;
    const options = Array.from(select.querySelectorAll('option'));
    expect(options).toHaveLength(2);
    expect(options.map((o) => o.value)).toEqual(['index-a', 'index-b']);
  });

  it('does not show index selector with a single index', () => {
    renderWithProviders(<IndexConfigPanel {...defaultProps} />);

    expect(screen.queryByTestId('indexConfigIndexSelect')).not.toBeInTheDocument();
  });

  it('save settings button is disabled when no changes have been made', () => {
    renderWithProviders(<IndexConfigPanel {...defaultProps} />);

    expect(screen.getByTestId('indexConfigSaveSettingsButton')).toBeDisabled();
  });

  it('save mappings button is disabled when no changes have been made', () => {
    renderWithProviders(<IndexConfigPanel {...defaultProps} />);

    expect(screen.getByTestId('indexConfigSaveMappingsButton')).toBeDisabled();
  });

  it('calls onSaveSettings when save button is clicked after editing', () => {
    renderWithProviders(<IndexConfigPanel {...defaultProps} />);

    const editors = screen.getAllByTestId('mockCodeEditor');
    const settingsEditor = editors[0];
    const newSettings = JSON.stringify({ index: { number_of_replicas: '2' } });
    fireEvent.change(settingsEditor, { target: { value: newSettings } });

    const saveButton = screen.getByTestId('indexConfigSaveSettingsButton');
    expect(saveButton).not.toBeDisabled();
    fireEvent.click(saveButton);

    expect(defaultProps.onSaveSettings).toHaveBeenCalledWith(
      'my-index',
      { index: { number_of_replicas: '2' } }
    );
  });

  it('calls onSaveMappings when save button is clicked after editing', () => {
    renderWithProviders(<IndexConfigPanel {...defaultProps} />);

    const editors = screen.getAllByTestId('mockCodeEditor');
    const mappingsEditor = editors[1];
    const newMappings = JSON.stringify({ properties: { title: { type: 'keyword' } } });
    fireEvent.change(mappingsEditor, { target: { value: newMappings } });

    const saveButton = screen.getByTestId('indexConfigSaveMappingsButton');
    expect(saveButton).not.toBeDisabled();
    fireEvent.click(saveButton);

    expect(defaultProps.onSaveMappings).toHaveBeenCalledWith(
      'my-index',
      { properties: { title: { type: 'keyword' } } }
    );
  });

  it('shows invalid JSON error for settings', () => {
    renderWithProviders(<IndexConfigPanel {...defaultProps} />);

    const editors = screen.getAllByTestId('mockCodeEditor');
    fireEvent.change(editors[0], { target: { value: '{invalid json' } });

    expect(screen.getByTestId('indexConfigSettingsInvalidJson')).toBeInTheDocument();
    expect(screen.getByTestId('indexConfigSaveSettingsButton')).toBeDisabled();
  });

  it('shows invalid JSON error for mappings', () => {
    renderWithProviders(<IndexConfigPanel {...defaultProps} />);

    const editors = screen.getAllByTestId('mockCodeEditor');
    fireEvent.change(editors[1], { target: { value: '{invalid json' } });

    expect(screen.getByTestId('indexConfigMappingsInvalidJson')).toBeInTheDocument();
    expect(screen.getByTestId('indexConfigSaveMappingsButton')).toBeDisabled();
  });

  it('shows pipeline editor when a pipeline is selected', () => {
    renderWithProviders(<IndexConfigPanel {...defaultProps} />);

    expect(screen.queryByTestId('indexConfigPipelineEditor')).not.toBeInTheDocument();

    const pipelineSelect = screen.getByTestId('indexConfigPipelineSelect');
    fireEvent.change(pipelineSelect, { target: { value: 'my-pipeline' } });

    expect(screen.getByTestId('indexConfigPipelineEditor')).toBeInTheDocument();
    expect(screen.getByTestId('indexConfigSavePipelineButton')).toBeInTheDocument();
  });

  it('pipeline select shows all available pipelines', () => {
    renderWithProviders(<IndexConfigPanel {...defaultProps} />);

    const pipelineSelect = screen.getByTestId('indexConfigPipelineSelect') as HTMLSelectElement;
    const options = Array.from(pipelineSelect.querySelectorAll('option'));
    expect(options).toHaveLength(3);
    expect(options[0].value).toBe('');
    expect(options[1].value).toBe('my-pipeline');
    expect(options[2].value).toBe('another-pipeline');
  });

  it('disables save settings button when isSavingSettings is true', () => {
    renderWithProviders(
      <IndexConfigPanel {...defaultProps} isSavingSettings={true} />
    );

    expect(screen.getByTestId('indexConfigSaveSettingsButton')).toBeDisabled();
  });

  it('disables save mappings button when isSavingMappings is true', () => {
    renderWithProviders(
      <IndexConfigPanel {...defaultProps} isSavingMappings={true} />
    );

    expect(screen.getByTestId('indexConfigSaveMappingsButton')).toBeDisabled();
  });
});
