/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import type { EuiBasicTableColumn } from '@elastic/eui';
import {
  EuiBasicTable,
  EuiBadge,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiStat,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

import type { RunComparisonResult } from '../../types';

interface RunComparisonViewProps {
  comparison: RunComparisonResult | null;
  isLoading?: boolean;
}

type PerQueryRow = RunComparisonResult['perQueryComparison'][number];

const formatScore = (score: number): string => score.toFixed(4);

const formatDelta = (delta: number): string => {
  const prefix = delta > 0 ? '+' : '';
  return `${prefix}${delta.toFixed(4)}`;
};

export const RunComparisonView: React.FC<RunComparisonViewProps> = ({
  comparison,
  isLoading,
}) => {
  const columns: Array<EuiBasicTableColumn<PerQueryRow>> = useMemo(
    () => [
      {
        field: 'query',
        name: i18n.translate(
          'xpack.searchPlayground.relevance.runComparison.columns.query',
          { defaultMessage: 'Query' }
        ),
        truncateText: true,
        width: '35%',
      },
      {
        field: 'baselineScore',
        name: i18n.translate(
          'xpack.searchPlayground.relevance.runComparison.columns.baseline',
          { defaultMessage: 'Baseline' }
        ),
        render: (score: number) => <EuiText size="s">{formatScore(score)}</EuiText>,
        width: '20%',
      },
      {
        field: 'comparisonScore',
        name: i18n.translate(
          'xpack.searchPlayground.relevance.runComparison.columns.comparison',
          { defaultMessage: 'Comparison' }
        ),
        render: (score: number) => <EuiText size="s">{formatScore(score)}</EuiText>,
        width: '20%',
      },
      {
        field: 'delta',
        name: i18n.translate(
          'xpack.searchPlayground.relevance.runComparison.columns.delta',
          { defaultMessage: 'Delta' }
        ),
        render: (_delta: number, row: PerQueryRow) => {
          if (row.improved) {
            return (
              <EuiBadge data-test-subj="comparisonImproved" color="success">
                {formatDelta(row.delta)}
              </EuiBadge>
            );
          }
          if (row.regressed) {
            return (
              <EuiBadge data-test-subj="comparisonRegressed" color="danger">
                {formatDelta(row.delta)}
              </EuiBadge>
            );
          }
          return (
            <EuiBadge data-test-subj="comparisonUnchanged" color="default">
              {formatDelta(row.delta)}
            </EuiBadge>
          );
        },
        width: '25%',
      },
    ],
    []
  );

  if (!comparison && !isLoading) {
    return (
      <EuiPanel data-test-subj="runComparisonView" paddingSize="l">
        <EuiEmptyPrompt
          data-test-subj="runComparisonEmpty"
          iconType="compareArrows"
          title={
            <h3>
              <FormattedMessage
                id="xpack.searchPlayground.relevance.runComparison.emptyTitle"
                defaultMessage="Select two runs to compare"
              />
            </h3>
          }
        />
      </EuiPanel>
    );
  }

  if (!comparison) {
    return null;
  }

  const { improvedCount, regressedCount, unchangedCount } = comparison.perQueryComparison.reduce(
    (acc, row) => ({
      improvedCount: acc.improvedCount + (row.improved ? 1 : 0),
      regressedCount: acc.regressedCount + (row.regressed ? 1 : 0),
      unchangedCount: acc.unchangedCount + (!row.improved && !row.regressed ? 1 : 0),
    }),
    { improvedCount: 0, regressedCount: 0, unchangedCount: 0 }
  );

  return (
    <EuiPanel data-test-subj="runComparisonView" paddingSize="l">
      <EuiTitle size="xs">
        <h4>
          <FormattedMessage
            id="xpack.searchPlayground.relevance.runComparison.title"
            defaultMessage="Run comparison"
          />
        </h4>
      </EuiTitle>

      <EuiSpacer size="m" />

      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiStat
            data-test-subj="comparisonBaselineScore"
            title={formatScore(comparison.baselineScore)}
            description={i18n.translate(
              'xpack.searchPlayground.relevance.runComparison.baselineScore',
              { defaultMessage: 'Baseline score' }
            )}
            titleSize="s"
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiStat
            data-test-subj="comparisonComparisonScore"
            title={formatScore(comparison.comparisonScore)}
            description={i18n.translate(
              'xpack.searchPlayground.relevance.runComparison.comparisonScore',
              { defaultMessage: 'Comparison score' }
            )}
            titleSize="s"
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiStat
            data-test-subj="comparisonScoreDelta"
            title={formatDelta(comparison.scoreDelta)}
            description={i18n.translate(
              'xpack.searchPlayground.relevance.runComparison.overallDelta',
              { defaultMessage: 'Overall delta' }
            )}
            titleSize="s"
            titleColor={
              comparison.scoreDelta > 0
                ? 'success'
                : comparison.scoreDelta < 0
                ? 'danger'
                : 'default'
            }
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiBadge data-test-subj="comparisonImprovedCount" color="success">
            <FormattedMessage
              id="xpack.searchPlayground.relevance.runComparison.improvedCount"
              defaultMessage="{count} improved"
              values={{ count: improvedCount }}
            />
          </EuiBadge>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiBadge data-test-subj="comparisonRegressedCount" color="danger">
            <FormattedMessage
              id="xpack.searchPlayground.relevance.runComparison.regressedCount"
              defaultMessage="{count} regressed"
              values={{ count: regressedCount }}
            />
          </EuiBadge>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiBadge data-test-subj="comparisonUnchangedCount" color="default">
            <FormattedMessage
              id="xpack.searchPlayground.relevance.runComparison.unchangedCount"
              defaultMessage="{count} unchanged"
              values={{ count: unchangedCount }}
            />
          </EuiBadge>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      <EuiBasicTable
        data-test-subj="comparisonTable"
        items={comparison.perQueryComparison}
        columns={columns}
        tableCaption={i18n.translate(
          'xpack.searchPlayground.relevance.runComparison.tableCaption',
          { defaultMessage: 'Per-query comparison' }
        )}
      />
    </EuiPanel>
  );
};
