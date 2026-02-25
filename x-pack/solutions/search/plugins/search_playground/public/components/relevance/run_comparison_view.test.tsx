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

import type { RunComparisonResult } from '../../types';
import { RunComparisonView } from './run_comparison_view';

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <IntlProvider locale="en">
      <EuiThemeProvider>{ui}</EuiThemeProvider>
    </IntlProvider>
  );

const mockComparison: RunComparisonResult = {
  baselineRunId: 'run-1',
  comparisonRunId: 'run-2',
  baselineScore: 0.72,
  comparisonScore: 0.85,
  scoreDelta: 0.13,
  perQueryComparison: [
    {
      query: 'laptop reviews',
      baselineScore: 0.6,
      comparisonScore: 0.9,
      delta: 0.3,
      improved: true,
      regressed: false,
    },
    {
      query: 'best headphones',
      baselineScore: 0.8,
      comparisonScore: 0.5,
      delta: -0.3,
      improved: false,
      regressed: true,
    },
    {
      query: 'wireless keyboard',
      baselineScore: 0.75,
      comparisonScore: 0.75,
      delta: 0,
      improved: false,
      regressed: false,
    },
  ],
};

describe('RunComparisonView', () => {
  it('renders empty state when no comparison data', () => {
    renderWithProviders(<RunComparisonView comparison={null} />);

    expect(screen.getByTestId('runComparisonView')).toBeInTheDocument();
    expect(screen.getByTestId('runComparisonEmpty')).toBeInTheDocument();
    expect(screen.getByText('Select two runs to compare')).toBeInTheDocument();
  });

  it('renders overall scores', () => {
    renderWithProviders(<RunComparisonView comparison={mockComparison} />);

    expect(screen.getByTestId('comparisonBaselineScore')).toHaveTextContent('0.7200');
    expect(screen.getByTestId('comparisonComparisonScore')).toHaveTextContent('0.8500');
    expect(screen.getByTestId('comparisonScoreDelta')).toHaveTextContent('+0.1300');
  });

  it('renders per-query comparison table', () => {
    renderWithProviders(<RunComparisonView comparison={mockComparison} />);

    expect(screen.getByTestId('comparisonTable')).toBeInTheDocument();
    expect(screen.getByText('laptop reviews')).toBeInTheDocument();
    expect(screen.getByText('best headphones')).toBeInTheDocument();
    expect(screen.getByText('wireless keyboard')).toBeInTheDocument();
  });

  it('highlights improved queries with success badge', () => {
    renderWithProviders(<RunComparisonView comparison={mockComparison} />);

    const improvedBadges = screen.getAllByTestId('comparisonImproved');
    expect(improvedBadges).toHaveLength(1);
    expect(improvedBadges[0]).toHaveTextContent('+0.3000');
  });

  it('highlights regressed queries with danger badge', () => {
    renderWithProviders(<RunComparisonView comparison={mockComparison} />);

    const regressedBadges = screen.getAllByTestId('comparisonRegressed');
    expect(regressedBadges).toHaveLength(1);
    expect(regressedBadges[0]).toHaveTextContent('-0.3000');
  });

  it('shows unchanged queries with default badge', () => {
    renderWithProviders(<RunComparisonView comparison={mockComparison} />);

    const unchangedBadges = screen.getAllByTestId('comparisonUnchanged');
    expect(unchangedBadges).toHaveLength(1);
    expect(unchangedBadges[0]).toHaveTextContent('0.0000');
  });

  it('renders summary counts', () => {
    renderWithProviders(<RunComparisonView comparison={mockComparison} />);

    expect(screen.getByTestId('comparisonImprovedCount')).toHaveTextContent('1 improved');
    expect(screen.getByTestId('comparisonRegressedCount')).toHaveTextContent('1 regressed');
    expect(screen.getByTestId('comparisonUnchangedCount')).toHaveTextContent('1 unchanged');
  });

  it('handles all-improved comparison', () => {
    const allImproved: RunComparisonResult = {
      baselineRunId: 'run-1',
      comparisonRunId: 'run-2',
      baselineScore: 0.5,
      comparisonScore: 0.9,
      scoreDelta: 0.4,
      perQueryComparison: [
        {
          query: 'q1',
          baselineScore: 0.4,
          comparisonScore: 0.8,
          delta: 0.4,
          improved: true,
          regressed: false,
        },
        {
          query: 'q2',
          baselineScore: 0.6,
          comparisonScore: 1.0,
          delta: 0.4,
          improved: true,
          regressed: false,
        },
      ],
    };

    renderWithProviders(<RunComparisonView comparison={allImproved} />);

    expect(screen.getByTestId('comparisonImprovedCount')).toHaveTextContent('2 improved');
    expect(screen.getByTestId('comparisonRegressedCount')).toHaveTextContent('0 regressed');
    expect(screen.getByTestId('comparisonUnchangedCount')).toHaveTextContent('0 unchanged');
  });

  it('handles negative overall delta', () => {
    const regression: RunComparisonResult = {
      baselineRunId: 'run-1',
      comparisonRunId: 'run-2',
      baselineScore: 0.9,
      comparisonScore: 0.5,
      scoreDelta: -0.4,
      perQueryComparison: [],
    };

    renderWithProviders(<RunComparisonView comparison={regression} />);

    expect(screen.getByTestId('comparisonScoreDelta')).toHaveTextContent('-0.4000');
  });

  it('renders comparison title', () => {
    renderWithProviders(<RunComparisonView comparison={mockComparison} />);

    expect(screen.getByText('Run Comparison')).toBeInTheDocument();
  });
});
