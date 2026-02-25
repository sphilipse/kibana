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

import { EvaluationConfigPanel } from './evaluation_config_panel';
import type { EvaluationConfig } from './evaluation_config_panel';

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

describe('EvaluationConfigPanel', () => {
  const mockOnRun = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all configuration fields', () => {
    renderWithProviders(
      <EvaluationConfigPanel
        onRun={mockOnRun}
        onCancel={mockOnCancel}
        isRunning={false}
      />
    );

    expect(screen.getByTestId('evaluationConfigPanel')).toBeInTheDocument();
    expect(screen.getByTestId('evaluationRunNameInput')).toBeInTheDocument();
    expect(screen.getByTestId('evaluationMetricSelect')).toBeInTheDocument();
    expect(screen.getByTestId('evaluationKInput')).toBeInTheDocument();
    expect(screen.getByTestId('evaluationQueryTemplateEditor')).toBeInTheDocument();
    expect(screen.getByTestId('evaluationRunButton')).toBeInTheDocument();
    expect(screen.getByTestId('evaluationCancelButton')).toBeInTheDocument();
  });

  it('has nDCG as the default metric', () => {
    renderWithProviders(
      <EvaluationConfigPanel
        onRun={mockOnRun}
        onCancel={mockOnCancel}
        isRunning={false}
      />
    );

    const select = screen.getByTestId('evaluationMetricSelect') as HTMLSelectElement;
    expect(select.value).toBe('ndcg');
  });

  it('defaults k to 10', () => {
    renderWithProviders(
      <EvaluationConfigPanel
        onRun={mockOnRun}
        onCancel={mockOnCancel}
        isRunning={false}
      />
    );

    const kInput = screen.getByTestId('evaluationKInput') as HTMLInputElement;
    expect(kInput.value).toBe('10');
  });

  it('allows changing the metric type', () => {
    renderWithProviders(
      <EvaluationConfigPanel
        onRun={mockOnRun}
        onCancel={mockOnCancel}
        isRunning={false}
      />
    );

    const select = screen.getByTestId('evaluationMetricSelect');
    fireEvent.change(select, { target: { value: 'precision' } });

    expect((select as HTMLSelectElement).value).toBe('precision');
  });

  it('allows changing k value', () => {
    renderWithProviders(
      <EvaluationConfigPanel
        onRun={mockOnRun}
        onCancel={mockOnCancel}
        isRunning={false}
      />
    );

    const kInput = screen.getByTestId('evaluationKInput');
    fireEvent.change(kInput, { target: { value: '20' } });

    expect((kInput as HTMLInputElement).value).toBe('20');
  });

  it('calls onRun with correct config when run button is clicked', () => {
    renderWithProviders(
      <EvaluationConfigPanel
        onRun={mockOnRun}
        onCancel={mockOnCancel}
        isRunning={false}
      />
    );

    const nameInput = screen.getByTestId('evaluationRunNameInput');
    fireEvent.change(nameInput, { target: { value: 'My Run' } });

    fireEvent.click(screen.getByTestId('evaluationRunButton'));

    expect(mockOnRun).toHaveBeenCalledTimes(1);
    const calledConfig: EvaluationConfig = mockOnRun.mock.calls[0][0];
    expect(calledConfig.metricType).toBe('ndcg');
    expect(calledConfig.k).toBe(10);
    expect(calledConfig.name).toBe('My Run');
    expect(() => JSON.parse(calledConfig.queryTemplateJSON)).not.toThrow();
  });

  it('calls onCancel when cancel button is clicked', () => {
    renderWithProviders(
      <EvaluationConfigPanel
        onRun={mockOnRun}
        onCancel={mockOnCancel}
        isRunning={false}
      />
    );

    fireEvent.click(screen.getByTestId('evaluationCancelButton'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('disables run button when isRunning is true', () => {
    renderWithProviders(
      <EvaluationConfigPanel
        onRun={mockOnRun}
        onCancel={mockOnCancel}
        isRunning={true}
      />
    );

    expect(screen.getByTestId('evaluationRunButton')).toBeDisabled();
  });

  it('shows error callout when error is provided', () => {
    renderWithProviders(
      <EvaluationConfigPanel
        onRun={mockOnRun}
        onCancel={mockOnCancel}
        isRunning={false}
        error={new Error('Something went wrong')}
      />
    );

    expect(screen.getByTestId('evaluationError')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('does not show error callout when no error', () => {
    renderWithProviders(
      <EvaluationConfigPanel
        onRun={mockOnRun}
        onCancel={mockOnCancel}
        isRunning={false}
      />
    );

    expect(screen.queryByTestId('evaluationError')).not.toBeInTheDocument();
  });

  it('validates JSON in query template', () => {
    renderWithProviders(
      <EvaluationConfigPanel
        onRun={mockOnRun}
        onCancel={mockOnCancel}
        isRunning={false}
      />
    );

    const editor = screen.getByTestId('mockCodeEditor');
    fireEvent.change(editor, { target: { value: '{invalid json' } });

    expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
    expect(screen.getByTestId('evaluationRunButton')).toBeDisabled();
  });

  it('all six metric types are available', () => {
    renderWithProviders(
      <EvaluationConfigPanel
        onRun={mockOnRun}
        onCancel={mockOnCancel}
        isRunning={false}
      />
    );

    const select = screen.getByTestId('evaluationMetricSelect');
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(6);

    const values = Array.from(options).map((opt) => opt.value);
    expect(values).toEqual([
      'precision',
      'recall',
      'mean_reciprocal_rank',
      'dcg',
      'ndcg',
      'expected_reciprocal_rank',
    ]);
  });
});
