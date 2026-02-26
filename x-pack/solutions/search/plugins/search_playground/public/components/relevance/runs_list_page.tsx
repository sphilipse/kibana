/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';
import type { CriteriaWithPagination, EuiBasicTableColumn } from '@elastic/eui';
import {
  EuiBasicTable,
  EuiBadge,
  EuiButton,
  EuiButtonIcon,
  EuiCheckbox,
  EuiConfirmModal,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiLoadingSpinner,
  EuiSpacer,
  EuiText,
  formatDate,
} from '@elastic/eui';
import { KibanaPageTemplate } from '@kbn/shared-ux-page-kibana-template';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { useHistory } from 'react-router-dom';

import type { EvaluationRunListObject } from '../../types';
import { useEvaluationRunsList, useDeleteEvaluationRun, useCompareRuns } from '../../hooks/use_evaluation_runs';
import { SearchPlaygroundPageTemplate } from '../../layout/page_template';
import { usePlaygroundBreadcrumbs } from '../../hooks/use_playground_breadcrumbs';
import { RELEVANCE_RUNS_DETAIL_PATH, ROOT_PATH } from '../../routes';
import { getErrorMessage } from '../../../common/errors';

import { RunHistoryChart } from './run_history_chart';
import { RunComparisonView } from './run_comparison_view';

const RunSelectCheckbox: React.FC<{
  runId: string;
  selectedRuns: string[];
  onToggle: (id: string) => void;
}> = React.memo(({ runId, selectedRuns, onToggle }) => (
  <EuiCheckbox
    id={`runSelect-${runId}`}
    data-test-subj={`runSelect-${runId}`}
    checked={selectedRuns.includes(runId)}
    onChange={() => onToggle(runId)}
    aria-label={i18n.translate('xpack.searchPlayground.relevance.runsList.selectAriaLabel', {
      defaultMessage: 'Select run',
    })}
  />
));

export const RunsListPage: React.FC = () => {
  usePlaygroundBreadcrumbs();
  const history = useHistory();

  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useEvaluationRunsList({ page });
  const { deleteEvaluationRun } = useDeleteEvaluationRun();
  const { compareRuns, data: comparisonData, isLoading: isComparing } = useCompareRuns();

  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const onNavigateToRun = useCallback(
    (runId: string) => {
      history.push(RELEVANCE_RUNS_DETAIL_PATH.replace(':runId', runId));
    },
    [history]
  );

  const confirmDelete = useCallback(() => {
    if (pendingDeleteId) {
      deleteEvaluationRun(pendingDeleteId);
      setPendingDeleteId(null);
    }
  }, [pendingDeleteId, deleteEvaluationRun]);

  const handleCompare = useCallback(() => {
    if (selectedRuns.length === 2) {
      compareRuns({
        baselineRunId: selectedRuns[0],
        comparisonRunId: selectedRuns[1],
      });
    }
  }, [selectedRuns, compareRuns]);

  const toggleRunSelection = useCallback(
    (runId: string) => {
      setSelectedRuns((prev) => {
        if (prev.includes(runId)) {
          return prev.filter((id) => id !== runId);
        }
        if (prev.length >= 2) {
          return [prev[1], runId];
        }
        return [...prev, runId];
      });
    },
    []
  );

  const onTableChange = useCallback(
    (criteria: CriteriaWithPagination<EvaluationRunListObject>) => {
      setPage(criteria.page.index + 1);
    },
    []
  );

  const columns: Array<EuiBasicTableColumn<EvaluationRunListObject>> = useMemo(
    () => [
      {
        field: 'id',
        name: '',
        width: '40px',
        render: (id: string) => (
          <RunSelectCheckbox
            runId={id}
            selectedRuns={selectedRuns}
            onToggle={toggleRunSelection}
          />
        ),
      },
      {
        name: i18n.translate('xpack.searchPlayground.relevance.runsList.columns.name', {
          defaultMessage: 'Run',
        }),
        render: ({ id, name }: EvaluationRunListObject) => (
          <EuiLink data-test-subj={`runLink-${id}`} onClick={() => onNavigateToRun(id)}>
            {name ?? id}
          </EuiLink>
        ),
      },
      {
        field: 'metricType',
        name: i18n.translate('xpack.searchPlayground.relevance.runsList.columns.metric', {
          defaultMessage: 'Metric',
        }),
        render: (metricType: string) => <EuiBadge color="hollow">{metricType}</EuiBadge>,
        width: '150px',
      },
      {
        field: 'overallScore',
        name: i18n.translate('xpack.searchPlayground.relevance.runsList.columns.score', {
          defaultMessage: 'Score',
        }),
        render: (score: number) => <EuiText size="s">{score.toFixed(4)}</EuiText>,
        width: '120px',
      },
      {
        field: 'timestamp',
        name: i18n.translate('xpack.searchPlayground.relevance.runsList.columns.timestamp', {
          defaultMessage: 'Time',
        }),
        render: (timestamp: string) => formatDate(timestamp),
        width: '200px',
      },
      {
        name: i18n.translate('xpack.searchPlayground.relevance.runsList.columns.actions', {
          defaultMessage: 'Actions',
        }),
        width: '80px',
        render: ({ id }: EvaluationRunListObject) => (
          <EuiButtonIcon
            data-test-subj={`runDelete-${id}`}
            iconType="trash"
            color="danger"
            aria-label={i18n.translate(
              'xpack.searchPlayground.relevance.runsList.deleteAriaLabel',
              { defaultMessage: 'Delete run' }
            )}
            onClick={() => setPendingDeleteId(id)}
          />
        ),
      },
    ],
    [onNavigateToRun, selectedRuns, toggleRunSelection]
  );

  if (isLoading) {
    return (
      <SearchPlaygroundPageTemplate restrictWidth={false} data-test-subj="runsListPage">
        <KibanaPageTemplate.Section>
          <EuiLoadingSpinner size="l" data-test-subj="runsListLoading" />
        </KibanaPageTemplate.Section>
      </SearchPlaygroundPageTemplate>
    );
  }

  if (isError || !data) {
    return (
      <SearchPlaygroundPageTemplate restrictWidth={false} data-test-subj="runsListPage">
        <KibanaPageTemplate.Section>
          <EuiEmptyPrompt
            data-test-subj="runsListError"
            iconType="warning"
            title={
              <h2>
                <FormattedMessage
                  id="xpack.searchPlayground.relevance.runsList.errorTitle"
                  defaultMessage="Unable to load evaluation runs"
                />
              </h2>
            }
            body={<p>{getErrorMessage(error)}</p>}
          />
        </KibanaPageTemplate.Section>
      </SearchPlaygroundPageTemplate>
    );
  }

  if (data._meta.total === 0) {
    return (
      <SearchPlaygroundPageTemplate restrictWidth={false} data-test-subj="runsListPage">
        <KibanaPageTemplate.Section>
          <EuiEmptyPrompt
            data-test-subj="runsListEmpty"
            iconType="visLine"
            title={
              <h2>
                <FormattedMessage
                  id="xpack.searchPlayground.relevance.runsList.emptyTitle"
                  defaultMessage="No evaluation runs"
                />
              </h2>
            }
            body={
              <p>
                <FormattedMessage
                  id="xpack.searchPlayground.relevance.runsList.emptyBody"
                  defaultMessage="Run an evaluation from a judgment set to see results here."
                />
              </p>
            }
            actions={
              <EuiButton
                data-test-subj="backToRelevanceButton"
                onClick={() => history.push(ROOT_PATH)}
              >
                <FormattedMessage
                  id="xpack.searchPlayground.relevance.runsList.backButton"
                  defaultMessage="Back to Relevance Workbench"
                />
              </EuiButton>
            }
          />
        </KibanaPageTemplate.Section>
      </SearchPlaygroundPageTemplate>
    );
  }

  return (
    <SearchPlaygroundPageTemplate restrictWidth={false} data-test-subj="runsListPage">
      <KibanaPageTemplate.Header
        pageTitle={i18n.translate('xpack.searchPlayground.relevance.runsList.pageTitle', {
          defaultMessage: 'Evaluation Runs',
        })}
        description={i18n.translate('xpack.searchPlayground.relevance.runsList.pageDescription', {
          defaultMessage: 'Track evaluation history and compare runs.',
        })}
      />
      <KibanaPageTemplate.Section color="plain">
        <RunHistoryChart runs={data.items} onRunClick={onNavigateToRun} />

        <EuiSpacer size="l" />

        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiText size="xs">
              <FormattedMessage
                id="xpack.searchPlayground.relevance.runsList.resultsCount"
                defaultMessage="Showing {total} {total, plural, one {run} other {runs}}"
                values={{ total: data._meta.total }}
              />
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              data-test-subj="compareRunsButton"
              size="s"
              onClick={handleCompare}
              disabled={selectedRuns.length !== 2}
              isLoading={isComparing}
            >
              <FormattedMessage
                id="xpack.searchPlayground.relevance.runsList.compareButton"
                defaultMessage="Compare Selected"
              />
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="s" />

        <EuiBasicTable
          data-test-subj="runsTable"
          items={data.items}
          columns={columns}
          tableCaption={i18n.translate(
            'xpack.searchPlayground.relevance.runsList.tableCaption',
            { defaultMessage: 'Evaluation runs' }
          )}
          pagination={{
            pageIndex: data._meta.page - 1,
            pageSize: data._meta.size,
            totalItemCount: data._meta.total,
            showPerPageOptions: false,
          }}
          onChange={onTableChange}
        />

        {comparisonData && (
          <>
            <EuiSpacer size="l" />
            <RunComparisonView comparison={comparisonData} />
          </>
        )}
      </KibanaPageTemplate.Section>

      {pendingDeleteId && (
        <EuiConfirmModal
          data-test-subj="deleteRunConfirmModal"
          title={i18n.translate('xpack.searchPlayground.relevance.runsList.deleteConfirmTitle', {
            defaultMessage: 'Delete evaluation run?',
          })}
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={confirmDelete}
          cancelButtonText={i18n.translate(
            'xpack.searchPlayground.relevance.runsList.deleteConfirmCancel',
            { defaultMessage: 'Cancel' }
          )}
          confirmButtonText={i18n.translate(
            'xpack.searchPlayground.relevance.runsList.deleteConfirmButton',
            { defaultMessage: 'Delete' }
          )}
          buttonColor="danger"
        >
          <FormattedMessage
            id="xpack.searchPlayground.relevance.runsList.deleteConfirmBody"
            defaultMessage="This action cannot be undone."
          />
        </EuiConfirmModal>
      )}
    </SearchPlaygroundPageTemplate>
  );
};
