/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback } from 'react';
import { EuiLoadingSpinner, EuiSpacer, EuiText } from '@elastic/eui';
import { KibanaPageTemplate } from '@kbn/shared-ux-page-kibana-template';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { useHistory, useParams } from 'react-router-dom';

import { useJudgmentSet } from '../../hooks/use_judgment_sets';
import { useRunEvaluation } from '../../hooks/use_evaluation';
import { SearchPlaygroundPageTemplate } from '../../layout/page_template';
import { usePlaygroundBreadcrumbs } from '../../hooks/use_playground_breadcrumbs';
import { RELEVANCE_RUNS_DETAIL_PATH } from '../../routes';

import { EvaluationConfigPanel } from './evaluation_config_panel';
import type { EvaluationConfig } from './evaluation_config_panel';

export const EvaluatePage: React.FC = () => {
  usePlaygroundBreadcrumbs();
  const { judgmentSetId } = useParams<{ judgmentSetId: string }>();
  const history = useHistory();

  const { data: judgmentSetData, isLoading: isLoadingSet, isError } = useJudgmentSet(judgmentSetId);
  const { runEvaluation, isRunning, error } = useRunEvaluation();

  const handleRun = useCallback(
    (config: EvaluationConfig) => {
      if (!judgmentSetData) return;

      runEvaluation(
        {
          judgmentSetId,
          queryTemplateJSON: config.queryTemplateJSON,
          metric: {
            type: config.metricType,
            params: { k: config.k },
          },
          indices: judgmentSetData.data.indices,
          name: config.name || undefined,
        },
        {
          onSuccess: (result) => {
            history.push(RELEVANCE_RUNS_DETAIL_PATH.replace(':runId', result._meta.id));
          },
        }
      );
    },
    [judgmentSetId, judgmentSetData, runEvaluation, history]
  );

  const handleCancel = () => {
    history.goBack();
  };

  if (isLoadingSet) {
    return (
      <SearchPlaygroundPageTemplate data-test-subj="evaluatePage">
        <KibanaPageTemplate.Section>
          <EuiLoadingSpinner size="l" data-test-subj="evaluatePageLoading" />
        </KibanaPageTemplate.Section>
      </SearchPlaygroundPageTemplate>
    );
  }

  if (isError || !judgmentSetData) {
    return (
      <SearchPlaygroundPageTemplate data-test-subj="evaluatePage">
        <KibanaPageTemplate.Section>
          <EuiText>
            <FormattedMessage
              id="xpack.searchPlayground.relevance.evaluate.loadError"
              defaultMessage="Unable to load judgment set."
            />
          </EuiText>
        </KibanaPageTemplate.Section>
      </SearchPlaygroundPageTemplate>
    );
  }

  return (
    <SearchPlaygroundPageTemplate restrictWidth={false} data-test-subj="evaluatePage">
      <KibanaPageTemplate.Header
        pageTitle={i18n.translate('xpack.searchPlayground.relevance.evaluate.pageTitle', {
          defaultMessage: 'Run Evaluation',
        })}
        description={i18n.translate('xpack.searchPlayground.relevance.evaluate.pageDescription', {
          defaultMessage: 'Evaluate search relevance for "{name}"',
          values: { name: judgmentSetData.data.name },
        })}
      />
      <KibanaPageTemplate.Section color="plain">
        <EuiText size="s" color="subdued">
          <FormattedMessage
            id="xpack.searchPlayground.relevance.evaluate.indicesLabel"
            defaultMessage="Indices: {indices}"
            values={{ indices: judgmentSetData.data.indices.join(', ') }}
          />
        </EuiText>
        <EuiText size="s" color="subdued">
          <FormattedMessage
            id="xpack.searchPlayground.relevance.evaluate.queryLabel"
            defaultMessage='Query: "{query}"'
            values={{ query: judgmentSetData.data.query }}
          />
        </EuiText>
        <EuiText size="s" color="subdued">
          <FormattedMessage
            id="xpack.searchPlayground.relevance.evaluate.ratingsLabel"
            defaultMessage="{count} {count, plural, one {document rating} other {document ratings}} in judgment set"
            values={{ count: judgmentSetData.data.judgments.length }}
          />
        </EuiText>

        <EuiSpacer size="l" />

        <EvaluationConfigPanel
          onRun={handleRun}
          onCancel={handleCancel}
          isRunning={isRunning}
          error={error}
        />
      </KibanaPageTemplate.Section>
    </SearchPlaygroundPageTemplate>
  );
};
