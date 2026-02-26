/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback } from 'react';
import { EuiButton, EuiLoadingSpinner, EuiSpacer, EuiText } from '@elastic/eui';
import { KibanaPageTemplate } from '@kbn/shared-ux-page-kibana-template';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { useHistory, useParams } from 'react-router-dom';

import { useJudgmentSet } from '../../hooks/use_judgment_sets';
import {
  useIndexConfig,
  useUpdateIndexSettings,
  useUpdateIndexMappings,
  usePipelines,
  useUpdatePipeline,
} from '../../hooks/use_index_config';
import { SearchPlaygroundPageTemplate } from '../../layout/page_template';
import { usePlaygroundBreadcrumbs } from '../../hooks/use_playground_breadcrumbs';
import { RELEVANCE_EVALUATE_PATH } from '../../routes';

import { IndexConfigPanel } from './index_config_panel';

export const IndexConfigPage: React.FC = () => {
  usePlaygroundBreadcrumbs();
  const { judgmentSetId } = useParams<{ judgmentSetId: string }>();
  const history = useHistory();

  const {
    data: judgmentSetData,
    isLoading: isLoadingSet,
    isError: isSetError,
  } = useJudgmentSet(judgmentSetId);

  const indices = judgmentSetData?.data.indices ?? [];

  const {
    data: indexConfig,
    isLoading: isLoadingConfig,
    isError: isConfigError,
  } = useIndexConfig(indices);

  const { data: pipelinesData } = usePipelines();

  const { updateSettings, isLoading: isSavingSettings } = useUpdateIndexSettings();
  const { updateMappings, isLoading: isSavingMappings } = useUpdateIndexMappings();
  const { updatePipeline, isLoading: isSavingPipeline } = useUpdatePipeline();

  const handleSaveSettings = useCallback(
    (index: string, settings: Record<string, unknown>) => {
      updateSettings({ index, settings });
    },
    [updateSettings]
  );

  const handleSaveMappings = useCallback(
    (index: string, mappings: Record<string, unknown>) => {
      updateMappings({ index, mappings });
    },
    [updateMappings]
  );

  const handleSavePipeline = useCallback(
    (id: string, description: string | undefined, processors: unknown[]) => {
      updatePipeline({ id, description, processors });
    },
    [updatePipeline]
  );

  const handleNavigateToEvaluate = useCallback(() => {
    history.push(RELEVANCE_EVALUATE_PATH.replace(':judgmentSetId', judgmentSetId));
  }, [history, judgmentSetId]);

  if (isLoadingSet) {
    return (
      <SearchPlaygroundPageTemplate data-test-subj="indexConfigPage">
        <KibanaPageTemplate.Section>
          <EuiLoadingSpinner size="l" data-test-subj="indexConfigPageLoading" />
        </KibanaPageTemplate.Section>
      </SearchPlaygroundPageTemplate>
    );
  }

  if (isSetError || !judgmentSetData) {
    return (
      <SearchPlaygroundPageTemplate data-test-subj="indexConfigPage">
        <KibanaPageTemplate.Section>
          <EuiText>
            <FormattedMessage
              id="xpack.searchPlayground.relevance.indexConfigPage.loadError"
              defaultMessage="Unable to load judgment set."
            />
          </EuiText>
        </KibanaPageTemplate.Section>
      </SearchPlaygroundPageTemplate>
    );
  }

  return (
    <SearchPlaygroundPageTemplate restrictWidth={false} data-test-subj="indexConfigPage">
      <KibanaPageTemplate.Header
        pageTitle={i18n.translate('xpack.searchPlayground.relevance.indexConfigPage.title', {
          defaultMessage: 'Index Configuration',
        })}
        description={i18n.translate(
          'xpack.searchPlayground.relevance.indexConfigPage.description',
          {
            defaultMessage:
              'View and edit index settings, mappings, and ingest pipelines for "{name}"',
            values: { name: judgmentSetData.data.name },
          }
        )}
        rightSideItems={[
          <EuiButton
            data-test-subj="indexConfigRunEvaluationButton"
            fill
            iconType="play"
            onClick={handleNavigateToEvaluate}
          >
            <FormattedMessage
              id="xpack.searchPlayground.relevance.indexConfigPage.runEvaluation"
              defaultMessage="Run Evaluation"
            />
          </EuiButton>,
        ]}
      />
      <KibanaPageTemplate.Section color="plain">
        <EuiText size="s" color="subdued">
          <FormattedMessage
            id="xpack.searchPlayground.relevance.indexConfigPage.indicesLabel"
            defaultMessage="Indices: {indices}"
            values={{ indices: indices.join(', ') }}
          />
        </EuiText>

        <EuiSpacer size="l" />

        <IndexConfigPanel
          indexConfig={indexConfig}
          pipelines={pipelinesData?.pipelines ?? []}
          indices={indices}
          isLoading={isLoadingConfig}
          isError={isConfigError}
          onSaveSettings={handleSaveSettings}
          onSaveMappings={handleSaveMappings}
          onSavePipeline={handleSavePipeline}
          isSavingSettings={isSavingSettings}
          isSavingMappings={isSavingMappings}
          isSavingPipeline={isSavingPipeline}
        />
      </KibanaPageTemplate.Section>
    </SearchPlaygroundPageTemplate>
  );
};
