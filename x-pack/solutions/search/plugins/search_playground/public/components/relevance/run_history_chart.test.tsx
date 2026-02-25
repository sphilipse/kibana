/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { __IntlProvider as IntlProvider } from '@kbn/i18n-react';
import { EuiThemeProvider } from '@elastic/eui';

import type { EvaluationRunListObject } from '../../types';
import { RunHistoryChart } from './run_history_chart';

jest.mock('@elastic/charts', () => ({
  Chart: ({ children }: { children: React.ReactNode }) => (
    <div data-test-subj="mockChart">{children}</div>
  ),
  Settings: () => <div data-test-subj="mockChartSettings" />,
  LineSeries: ({ data }: { data: unknown[] }) => (
    <div data-test-subj="mockLineSeries" data-point-count={data.length} />
  ),
  Axis: ({ id }: { id: string }) => <div data-test-subj={`mockAxis-${id}`} />,
  Tooltip: () => null,
  Position: { Bottom: 'bottom', Left: 'left' },
  ScaleType: { Time: 'time', Linear: 'linear' },
  timeFormatter: () => (val: number) => new Date(val).toISOString(),
}));

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <IntlProvider locale="en">
      <EuiThemeProvider>{ui}</EuiThemeProvider>
    </IntlProvider>
  );

const mockRuns: EvaluationRunListObject[] = [
  {
    id: 'run-1',
    judgmentSetId: 'set-1',
    timestamp: '2026-02-18T00:00:00Z',
    metricType: 'ndcg',
    overallScore: 0.72,
    createdAt: '2026-02-18T00:00:00Z',
  },
  {
    id: 'run-2',
    judgmentSetId: 'set-1',
    timestamp: '2026-02-19T00:00:00Z',
    metricType: 'ndcg',
    overallScore: 0.78,
    createdAt: '2026-02-19T00:00:00Z',
  },
  {
    id: 'run-3',
    judgmentSetId: 'set-1',
    timestamp: '2026-02-20T00:00:00Z',
    metricType: 'ndcg',
    overallScore: 0.85,
    createdAt: '2026-02-20T00:00:00Z',
  },
];

describe('RunHistoryChart', () => {
  it('renders empty state when no runs are provided', () => {
    renderWithProviders(<RunHistoryChart runs={[]} />);

    expect(screen.getByTestId('runHistoryChart')).toBeInTheDocument();
    expect(screen.getByTestId('runHistoryChartEmpty')).toBeInTheDocument();
    expect(screen.getByText('No evaluation runs yet')).toBeInTheDocument();
  });

  it('renders chart with data points when runs are provided', () => {
    renderWithProviders(<RunHistoryChart runs={mockRuns} />);

    expect(screen.getByTestId('runHistoryChart')).toBeInTheDocument();
    expect(screen.queryByTestId('runHistoryChartEmpty')).not.toBeInTheDocument();
    expect(screen.getByTestId('runHistoryChartContainer')).toBeInTheDocument();
    expect(screen.getByTestId('mockChart')).toBeInTheDocument();
  });

  it('renders LineSeries with correct number of data points', () => {
    renderWithProviders(<RunHistoryChart runs={mockRuns} />);

    const lineSeries = screen.getByTestId('mockLineSeries');
    expect(lineSeries.getAttribute('data-point-count')).toBe('3');
  });

  it('renders both axes', () => {
    renderWithProviders(<RunHistoryChart runs={mockRuns} />);

    expect(screen.getByTestId('mockAxis-bottom')).toBeInTheDocument();
    expect(screen.getByTestId('mockAxis-left')).toBeInTheDocument();
  });

  it('renders chart title', () => {
    renderWithProviders(<RunHistoryChart runs={mockRuns} />);

    expect(screen.getByText('Score History')).toBeInTheDocument();
  });

  it('handles a single run', () => {
    renderWithProviders(<RunHistoryChart runs={[mockRuns[0]]} />);

    expect(screen.getByTestId('mockChart')).toBeInTheDocument();
    const lineSeries = screen.getByTestId('mockLineSeries');
    expect(lineSeries.getAttribute('data-point-count')).toBe('1');
  });
});
