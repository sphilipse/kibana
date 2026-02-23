/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';
import type { CriteriaWithPagination, EuiBasicTableColumn, EuiTableSortingType } from '@elastic/eui';
import {
  EuiBasicTable,
  EuiBadge,
  EuiButton,
  EuiEmptyPrompt,
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

import type { JudgmentSetListObject } from '../../types';
import { useJudgmentSetsList } from '../../hooks/use_judgment_sets';
import { RELEVANCE_JUDGMENTS_NEW_PATH, RELEVANCE_JUDGMENTS_DETAIL_PATH } from '../../routes';
import { SearchPlaygroundPageTemplate } from '../../layout/page_template';
import { usePlaygroundBreadcrumbs } from '../../hooks/use_playground_breadcrumbs';

interface JudgmentSetsQueryParams {
  page: number;
  sortField: 'name' | 'updated_at';
  sortOrder: 'asc' | 'desc';
}

function JudgmentSetFieldToSortField(field: string): 'name' | 'updated_at' {
  switch (field) {
    case 'name':
      return 'name';
    case 'updatedAt':
    default:
      return 'updated_at';
  }
}

function SortFieldToJudgmentSetField(sortField: string): 'name' | 'updatedAt' {
  switch (sortField) {
    case 'name':
      return 'name';
    case 'updated_at':
    default:
      return 'updatedAt';
  }
}

export const RelevanceLanding: React.FC = () => {
  usePlaygroundBreadcrumbs();
  const history = useHistory();

  const [queryParams, setQueryParams] = useState<JudgmentSetsQueryParams>({
    page: 1,
    sortField: 'updated_at',
    sortOrder: 'desc',
  });

  const { data, isLoading, isError, error } = useJudgmentSetsList(queryParams);

  const onNewJudgmentSet = useCallback(() => {
    history.push(RELEVANCE_JUDGMENTS_NEW_PATH);
  }, [history]);

  const onNavigateToJudgmentSet = useCallback(
    (id: string) => {
      history.push(RELEVANCE_JUDGMENTS_DETAIL_PATH.replace(':id', id));
    },
    [history]
  );

  const onTableChange = useCallback(
    (criteria: CriteriaWithPagination<JudgmentSetListObject>) => {
      setQueryParams((prev) => ({
        page: criteria.page.index + 1,
        sortOrder: criteria.sort?.direction ?? prev.sortOrder,
        sortField: JudgmentSetFieldToSortField(criteria.sort?.field ?? 'updatedAt'),
      }));
    },
    []
  );

  const columns: Array<EuiBasicTableColumn<JudgmentSetListObject>> = useMemo(
    () => [
      {
        name: i18n.translate(
          'xpack.searchPlayground.relevance.landing.columns.name',
          { defaultMessage: 'Judgment Set' }
        ),
        render: ({ id, name }: JudgmentSetListObject) => (
          <EuiLink
            data-test-subj={`judgmentSetLink-${id}`}
            onClick={() => onNavigateToJudgmentSet(id)}
          >
            {name}
          </EuiLink>
        ),
      },
      {
        field: 'judgmentCount',
        name: i18n.translate(
          'xpack.searchPlayground.relevance.landing.columns.queries',
          { defaultMessage: 'Queries' }
        ),
        render: (count: number) => <EuiBadge color="hollow">{count}</EuiBadge>,
        width: '120px',
      },
      {
        field: 'updatedAt',
        name: i18n.translate(
          'xpack.searchPlayground.relevance.landing.columns.updatedAt',
          { defaultMessage: 'Updated' }
        ),
        render: (updatedAt?: string) => (updatedAt ? formatDate(updatedAt) : '---'),
        sortable: true,
      },
    ],
    [onNavigateToJudgmentSet]
  );

  const sorting: EuiTableSortingType<JudgmentSetListObject> = {
    sort: {
      field: SortFieldToJudgmentSetField(queryParams.sortField) as keyof JudgmentSetListObject,
      direction: queryParams.sortOrder,
    },
    enableAllColumns: false,
    readOnly: false,
  };

  if (isLoading) {
    return (
      <SearchPlaygroundPageTemplate restrictWidth={false} data-test-subj="relevanceLandingPage">
        <KibanaPageTemplate.Section>
          <EuiLoadingSpinner size="l" data-test-subj="relevanceLandingLoading" />
        </KibanaPageTemplate.Section>
      </SearchPlaygroundPageTemplate>
    );
  }

  if (isError || data === undefined) {
    return (
      <SearchPlaygroundPageTemplate restrictWidth={false} data-test-subj="relevanceLandingPage">
        <KibanaPageTemplate.Section>
          <EuiEmptyPrompt
            data-test-subj="relevanceLandingError"
            iconType="warning"
            title={
              <h2>
                <FormattedMessage
                  id="xpack.searchPlayground.relevance.landing.errorTitle"
                  defaultMessage="Unable to load judgment sets"
                />
              </h2>
            }
            body={<p>{error?.message}</p>}
          />
        </KibanaPageTemplate.Section>
      </SearchPlaygroundPageTemplate>
    );
  }

  if (data._meta.total === 0) {
    return (
      <SearchPlaygroundPageTemplate restrictWidth={false} data-test-subj="relevanceLandingPage">
        <KibanaPageTemplate.Section>
          <EuiEmptyPrompt
            data-test-subj="relevanceLandingEmptyState"
            iconType="beaker"
            title={
              <h2>
                <FormattedMessage
                  id="xpack.searchPlayground.relevance.landing.emptyTitle"
                  defaultMessage="Relevance Workbench"
                />
              </h2>
            }
            body={
              <p>
                <FormattedMessage
                  id="xpack.searchPlayground.relevance.landing.emptyBody"
                  defaultMessage="Create a judgment set to start measuring and improving your search relevance."
                />
              </p>
            }
            actions={
              <EuiButton
                data-test-subj="newJudgmentSetButton"
                fill
                iconType="plusInCircle"
                onClick={onNewJudgmentSet}
              >
                <FormattedMessage
                  id="xpack.searchPlayground.relevance.landing.createButton"
                  defaultMessage="Create Judgment Set"
                />
              </EuiButton>
            }
          />
        </KibanaPageTemplate.Section>
      </SearchPlaygroundPageTemplate>
    );
  }

  return (
    <SearchPlaygroundPageTemplate restrictWidth={false} data-test-subj="relevanceLandingPage">
      <KibanaPageTemplate.Header
        pageTitle={i18n.translate('xpack.searchPlayground.relevance.landing.pageTitle', {
          defaultMessage: 'Relevance Workbench',
        })}
        description={i18n.translate(
          'xpack.searchPlayground.relevance.landing.pageDescription',
          {
            defaultMessage:
              'Measure and improve your search relevance with judgment sets and evaluation runs.',
          }
        )}
        rightSideItems={[
          <EuiButton
            data-test-subj="newJudgmentSetButton"
            fill
            iconType="plusInCircle"
            onClick={onNewJudgmentSet}
          >
            <FormattedMessage
              id="xpack.searchPlayground.relevance.landing.newButton"
              defaultMessage="Create Judgment Set"
            />
          </EuiButton>,
        ]}
      />
      <KibanaPageTemplate.Section color="plain">
        <EuiText size="xs">
          <FormattedMessage
            id="xpack.searchPlayground.relevance.landing.table.resultsCount"
            defaultMessage="Showing {totalCount} judgment {totalCount, plural, one {set} other {sets}}"
            values={{ totalCount: data._meta.total }}
          />
        </EuiText>
        <EuiSpacer size="s" />
        <EuiBasicTable
          data-test-subj="judgmentSetsTable"
          items={data.items}
          columns={columns}
          tableCaption={i18n.translate(
            'xpack.searchPlayground.relevance.landing.table.caption',
            { defaultMessage: 'Judgment sets' }
          )}
          pagination={{
            pageIndex: data._meta.page - 1,
            pageSize: data._meta.size,
            totalItemCount: data._meta.total,
            showPerPageOptions: false,
          }}
          sorting={sorting}
          onChange={onTableChange}
        />
      </KibanaPageTemplate.Section>
    </SearchPlaygroundPageTemplate>
  );
};
