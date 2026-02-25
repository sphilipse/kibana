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
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiPanel,
  EuiSpacer,
  EuiStat,
  EuiText,
  EuiTitle,
  formatDate,
} from '@elastic/eui';
import { KibanaPageTemplate } from '@kbn/shared-ux-page-kibana-template';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { useHistory, useParams } from 'react-router-dom';

import type { PerQueryScore } from '../../types';
import { useEvaluationRun } from '../../hooks/use_evaluation_runs';
import { SearchPlaygroundPageTemplate } from '../../layout/page_template';
import { usePlaygroundBreadcrumbs } from '../../hooks/use_playground_breadcrumbs';
import { RELEVANCE_RUNS_PATH } from '../../routes';

export const RunDetailPage: React.FC = () => {
  usePlaygroundBreadcrumbs();
  const { runId } = useParams<{ runId: string }>();
  const history = useHistory();
  const { data, isLoading, isError } = useEvaluationRun(runId);

  const columns: Array<EuiBasicTableColumn<PerQueryScore>> = useMemo(
    () => [
      {
        field: 'query',
        name: i18n.translate(
          'xpack.searchPlayground.relevance.runDetail.columns.query',
          { defaultMessage: 'Query' }
        ),
        truncateText: true,
        width: '45%',
      },
      {
        field: 'score',
        name: i18n.translate(
          'xpack.searchPlayground.relevance.runDetail.columns.score',
          { defaultMessage: 'Score' }
        ),
        render: (score: number) => <EuiText size="s">{score.toFixed(4)}</EuiText>,
        width: '25%',
      },
      {
        field: 'unratedDocs',
        name: i18n.translate(
          'xpack.searchPlayground.relevance.runDetail.columns.unratedDocs',
          { defaultMessage: 'Unrated docs' }
        ),
        render: (count: number) =>
          count > 0 ? (
            <EuiBadge data-test-subj="unratedDocsBadge" color="warning">
              {count}
            </EuiBadge>
          ) : (
            <EuiBadge color="success">0</EuiBadge>
          ),
        width: '30%',
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <SearchPlaygroundPageTemplate data-test-subj="runDetailPage">
        <KibanaPageTemplate.Section>
          <EuiLoadingSpinner size="l" data-test-subj="runDetailLoading" />
        </KibanaPageTemplate.Section>
      </SearchPlaygroundPageTemplate>
    );
  }

  if (isError || !data) {
    return (
      <SearchPlaygroundPageTemplate data-test-subj="runDetailPage">
        <KibanaPageTemplate.Section>
          <EuiText>
            <FormattedMessage
              id="xpack.searchPlayground.relevance.runDetail.error"
              defaultMessage="Unable to load evaluation run."
            />
          </EuiText>
        </KibanaPageTemplate.Section>
      </SearchPlaygroundPageTemplate>
    );
  }

  const { data: run } = data;
  const { clientMetrics } = run;

  return (
    <SearchPlaygroundPageTemplate restrictWidth={false} data-test-subj="runDetailPage">
      <KibanaPageTemplate.Header
        pageTitle={
          run.name ??
          i18n.translate('xpack.searchPlayground.relevance.runDetail.pageTitle', {
            defaultMessage: 'Evaluation run',
          })
        }
        description={
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow">{run.metric.type}</EuiBadge>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="s" color="subdued">
                {formatDate(run.timestamp)}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        }
        rightSideItems={[
          <EuiButtonEmpty
            data-test-subj="backToRunsButton"
            iconType="arrowLeft"
            onClick={() => history.push(RELEVANCE_RUNS_PATH)}
          >
            <FormattedMessage
              id="xpack.searchPlayground.relevance.runDetail.backButton"
              defaultMessage="Back to Runs"
            />
          </EuiButtonEmpty>,
        ]}
      />
      <KibanaPageTemplate.Section color="plain">
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiStat
              data-test-subj="runOverallScore"
              title={run.overallScore.toFixed(4)}
              description={i18n.translate(
                'xpack.searchPlayground.relevance.runDetail.overallScore',
                { defaultMessage: 'Overall Score' }
              )}
              titleSize="l"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              data-test-subj="runQueryCount"
              title={run.perQueryScores.length}
              description={i18n.translate(
                'xpack.searchPlayground.relevance.runDetail.queryCount',
                { defaultMessage: 'Queries' }
              )}
              titleSize="l"
            />
          </EuiFlexItem>
          {clientMetrics && (
            <>
              <EuiFlexItem>
                <EuiStat
                  data-test-subj="runMedianScore"
                  title={clientMetrics.medianScore.toFixed(4)}
                  description={i18n.translate(
                    'xpack.searchPlayground.relevance.runDetail.medianScore',
                    { defaultMessage: 'Median Score' }
                  )}
                  titleSize="l"
                />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiStat
                  data-test-subj="runPassRate"
                  title={`${(clientMetrics.queryPassRate * 100).toFixed(0)}%`}
                  description={i18n.translate(
                    'xpack.searchPlayground.relevance.runDetail.passRate',
                    { defaultMessage: 'Pass Rate' }
                  )}
                  titleSize="l"
                />
              </EuiFlexItem>
            </>
          )}
        </EuiFlexGroup>

        {clientMetrics && (
          <>
            <EuiSpacer size="m" />
            <EuiPanel data-test-subj="clientMetricsPanel" color="subdued" paddingSize="m">
              <EuiTitle size="xxs">
                <h5>
                  <FormattedMessage
                    id="xpack.searchPlayground.relevance.runDetail.clientMetricsTitle"
                    defaultMessage="Detailed Metrics"
                  />
                </h5>
              </EuiTitle>
              <EuiSpacer size="s" />
              <EuiFlexGroup wrap>
                <EuiFlexItem grow={false}>
                  <EuiText size="xs">
                    <FormattedMessage
                      id="xpack.searchPlayground.relevance.runDetail.minScore"
                      defaultMessage="Min: {score}"
                      values={{ score: clientMetrics.minScore.toFixed(4) }}
                    />
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size="xs">
                    <FormattedMessage
                      id="xpack.searchPlayground.relevance.runDetail.maxScore"
                      defaultMessage="Max: {score}"
                      values={{ score: clientMetrics.maxScore.toFixed(4) }}
                    />
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size="xs">
                    <FormattedMessage
                      id="xpack.searchPlayground.relevance.runDetail.stdDev"
                      defaultMessage="Std Dev: {score}"
                      values={{ score: clientMetrics.scoreStandardDeviation.toFixed(4) }}
                    />
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size="xs">
                    <FormattedMessage
                      id="xpack.searchPlayground.relevance.runDetail.unratedDocRate"
                      defaultMessage="Unrated Doc Rate: {rate}%"
                      values={{ rate: (clientMetrics.unratedDocRate * 100).toFixed(0) }}
                    />
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </>
        )}

        <EuiSpacer size="l" />

        <EuiTitle size="xs">
          <h4>
            <FormattedMessage
              id="xpack.searchPlayground.relevance.runDetail.perQueryTitle"
              defaultMessage="Per-Query Scores"
            />
          </h4>
        </EuiTitle>

        <EuiSpacer size="s" />

        <EuiBasicTable
          data-test-subj="perQueryScoresTable"
          items={run.perQueryScores}
          columns={columns}
          tableCaption={i18n.translate(
            'xpack.searchPlayground.relevance.runDetail.tableCaption',
            { defaultMessage: 'Per-query evaluation scores' }
          )}
        />
      </KibanaPageTemplate.Section>
    </SearchPlaygroundPageTemplate>
  );
};
