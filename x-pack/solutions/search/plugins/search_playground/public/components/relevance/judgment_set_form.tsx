/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiLoadingSpinner,
  EuiSpacer,
  EuiComboBox,
} from '@elastic/eui';
import type { EuiComboBoxOptionOption } from '@elastic/eui';
import { KibanaPageTemplate } from '@kbn/shared-ux-page-kibana-template';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { useHistory, useParams } from 'react-router-dom';

import type { JudgmentRating, JudgmentSetSavedObject } from '../../types';
import {
  useJudgmentSet,
  useCreateJudgmentSet,
  useUpdateJudgmentSet,
} from '../../hooks/use_judgment_sets';
import { SearchPlaygroundPageTemplate } from '../../layout/page_template';
import { usePlaygroundBreadcrumbs } from '../../hooks/use_playground_breadcrumbs';
import { ROOT_PATH, RELEVANCE_INDEX_CONFIG_PATH } from '../../routes';

import { useQueryIndices } from '../../hooks/use_query_indices';
import { JudgmentEditor } from './judgment_editor';

export const JudgmentSetCreatePage: React.FC = () => {
  usePlaygroundBreadcrumbs();
  const history = useHistory();
  const { createJudgmentSet, isPending: isCreating } = useCreateJudgmentSet();

  const [name, setName] = useState('');
  const [indices, setIndices] = useState<EuiComboBoxOptionOption[]>([]);
  const [indexSearchValue, setIndexSearchValue] = useState('');
  const { indices: availableIndices, isLoading: isLoadingIndices } = useQueryIndices({
    query: indexSearchValue,
  });
  const indexOptions = useMemo(
    () => availableIndices.map((idx) => ({ label: idx })),
    [availableIndices]
  );
  const [query, setQuery] = useState('');
  const [judgments, setJudgments] = useState<JudgmentRating[]>([]);

  const handleSave = useCallback(() => {
    const judgmentSet: JudgmentSetSavedObject = {
      name: name.trim(),
      indices: indices.map((opt) => opt.label),
      query: query.trim(),
      judgments,
    };
    createJudgmentSet(judgmentSet, {
      onSuccess: () => {
        history.push(ROOT_PATH);
      },
    });
  }, [name, indices, query, judgments, createJudgmentSet, history]);

  const handleCancel = useCallback(() => {
    history.push(ROOT_PATH);
  }, [history]);

  const isValid = name.trim().length > 0 && indices.length > 0 && query.trim().length > 0;

  return (
    <SearchPlaygroundPageTemplate restrictWidth={false} data-test-subj="judgmentSetCreatePage">
      <KibanaPageTemplate.Header
        pageTitle={i18n.translate(
          'xpack.searchPlayground.relevance.judgmentSetForm.createTitle',
          { defaultMessage: 'Create Judgment Set' }
        )}
      />
      <KibanaPageTemplate.Section color="plain">
        <EuiFormRow
          label={i18n.translate(
            'xpack.searchPlayground.relevance.judgmentSetForm.nameLabel',
            { defaultMessage: 'Name' }
          )}
          fullWidth
        >
          <EuiFieldText
            data-test-subj="judgmentSetNameInput"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={i18n.translate(
              'xpack.searchPlayground.relevance.judgmentSetForm.namePlaceholder',
              { defaultMessage: 'My judgment set' }
            )}
          />
        </EuiFormRow>

        <EuiSpacer size="m" />

        <EuiFormRow
          label={i18n.translate(
            'xpack.searchPlayground.relevance.judgmentSetForm.indicesLabel',
            { defaultMessage: 'Indices' }
          )}
          fullWidth
        >
          <EuiComboBox
            data-test-subj="judgmentSetIndicesInput"
            fullWidth
            options={indexOptions}
            selectedOptions={indices}
            onSearchChange={setIndexSearchValue}
            isLoading={isLoadingIndices}
            onCreateOption={(value) => {
              setIndices((prev) => [...prev, { label: value }]);
            }}
            onChange={setIndices}
            placeholder={i18n.translate(
              'xpack.searchPlayground.relevance.judgmentSetForm.indicesPlaceholder',
              { defaultMessage: 'Search for an index' }
            )}
          />
        </EuiFormRow>

        <EuiSpacer size="m" />

        <EuiFormRow
          label={i18n.translate(
            'xpack.searchPlayground.relevance.judgmentSetForm.queryLabel',
            { defaultMessage: 'Query' }
          )}
          fullWidth
        >
          <EuiFieldText
            data-test-subj="judgmentSetQueryInput"
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={i18n.translate(
              'xpack.searchPlayground.relevance.judgmentSetForm.queryPlaceholder',
              { defaultMessage: 'Enter the search query for this judgment set' }
            )}
          />
        </EuiFormRow>

        <EuiSpacer size="l" />

        <JudgmentEditor judgments={judgments} onJudgmentsChange={setJudgments} />

        <EuiSpacer size="l" />

        <EuiFlexGroup justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              data-test-subj="judgmentSetCancelButton"
              onClick={handleCancel}
            >
              <FormattedMessage
                id="xpack.searchPlayground.relevance.judgmentSetForm.cancel"
                defaultMessage="Cancel"
              />
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              data-test-subj="judgmentSetSaveButton"
              fill
              onClick={handleSave}
              isLoading={isCreating}
              disabled={!isValid}
            >
              <FormattedMessage
                id="xpack.searchPlayground.relevance.judgmentSetForm.save"
                defaultMessage="Save"
              />
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </KibanaPageTemplate.Section>
    </SearchPlaygroundPageTemplate>
  );
};

export const JudgmentSetDetailPage: React.FC = () => {
  usePlaygroundBreadcrumbs();
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { data, isLoading, isError } = useJudgmentSet(id);
  const { updateJudgmentSet, isPending: isUpdating } = useUpdateJudgmentSet();

  const [name, setName] = useState<string | null>(null);
  const [indices, setIndices] = useState<EuiComboBoxOptionOption[] | null>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [judgments, setJudgments] = useState<JudgmentRating[] | null>(null);
  const [editIndexSearchValue, setEditIndexSearchValue] = useState('');
  const { indices: editAvailableIndices, isLoading: isLoadingEditIndices } = useQueryIndices({
    query: editIndexSearchValue,
  });
  const editIndexOptions = useMemo(
    () => editAvailableIndices.map((idx) => ({ label: idx })),
    [editAvailableIndices]
  );

  const effectiveName = name ?? data?.data.name ?? '';
  const effectiveIndices =
    indices ?? data?.data.indices.map((idx) => ({ label: idx })) ?? [];
  const effectiveQuery = query ?? data?.data.query ?? '';
  const effectiveJudgments = judgments ?? data?.data.judgments ?? [];

  const handleSave = useCallback(() => {
    const judgmentSet: JudgmentSetSavedObject = {
      name: effectiveName.trim(),
      indices: effectiveIndices.map((opt) => opt.label),
      query: effectiveQuery.trim(),
      judgments: effectiveJudgments,
    };
    updateJudgmentSet(
      { id, judgmentSet },
      {
        onSuccess: () => {
          history.push(ROOT_PATH);
        },
      }
    );
  }, [effectiveName, effectiveIndices, effectiveQuery, effectiveJudgments, updateJudgmentSet, id, history]);

  const handleCancel = useCallback(() => {
    history.push(ROOT_PATH);
  }, [history]);

  const isValid = effectiveName.trim().length > 0 && effectiveIndices.length > 0 && effectiveQuery.trim().length > 0;

  if (isLoading) {
    return (
      <SearchPlaygroundPageTemplate data-test-subj="judgmentSetDetailPage">
        <KibanaPageTemplate.Section>
          <EuiLoadingSpinner size="l" data-test-subj="judgmentSetDetailLoading" />
        </KibanaPageTemplate.Section>
      </SearchPlaygroundPageTemplate>
    );
  }

  if (isError || !data) {
    return (
      <SearchPlaygroundPageTemplate data-test-subj="judgmentSetDetailPage">
        <KibanaPageTemplate.Section>
          <FormattedMessage
            id="xpack.searchPlayground.relevance.judgmentSetDetail.error"
            defaultMessage="Unable to load judgment set."
          />
        </KibanaPageTemplate.Section>
      </SearchPlaygroundPageTemplate>
    );
  }

  return (
    <SearchPlaygroundPageTemplate restrictWidth={false} data-test-subj="judgmentSetDetailPage">
      <KibanaPageTemplate.Header
        pageTitle={i18n.translate(
          'xpack.searchPlayground.relevance.judgmentSetForm.editTitle',
          { defaultMessage: 'Edit Judgment Set' }
        )}
        rightSideItems={[
          <EuiButton
            data-test-subj="judgmentSetIndexConfigButton"
            iconType="gear"
            onClick={() =>
              history.push(RELEVANCE_INDEX_CONFIG_PATH.replace(':judgmentSetId', id))
            }
          >
            <FormattedMessage
              id="xpack.searchPlayground.relevance.judgmentSetForm.indexConfig"
              defaultMessage="Index Configuration"
            />
          </EuiButton>,
        ]}
      />
      <KibanaPageTemplate.Section color="plain">
        <EuiFormRow
          label={i18n.translate(
            'xpack.searchPlayground.relevance.judgmentSetForm.nameLabel',
            { defaultMessage: 'Name' }
          )}
          fullWidth
        >
          <EuiFieldText
            data-test-subj="judgmentSetNameInput"
            fullWidth
            value={effectiveName}
            onChange={(e) => setName(e.target.value)}
          />
        </EuiFormRow>

        <EuiSpacer size="m" />

        <EuiFormRow
          label={i18n.translate(
            'xpack.searchPlayground.relevance.judgmentSetForm.indicesLabel',
            { defaultMessage: 'Indices' }
          )}
          fullWidth
        >
          <EuiComboBox
            data-test-subj="judgmentSetIndicesInput"
            fullWidth
            options={editIndexOptions}
            selectedOptions={effectiveIndices}
            onSearchChange={setEditIndexSearchValue}
            isLoading={isLoadingEditIndices}
            onCreateOption={(value) => {
              setIndices((prev) => [...(prev ?? effectiveIndices), { label: value }]);
            }}
            onChange={(opts) => setIndices(opts)}
          />
        </EuiFormRow>

        <EuiSpacer size="m" />

        <EuiFormRow
          label={i18n.translate(
            'xpack.searchPlayground.relevance.judgmentSetForm.queryLabel',
            { defaultMessage: 'Query' }
          )}
          fullWidth
        >
          <EuiFieldText
            data-test-subj="judgmentSetQueryInput"
            fullWidth
            value={effectiveQuery}
            onChange={(e) => setQuery(e.target.value)}
          />
        </EuiFormRow>

        <EuiSpacer size="l" />

        <JudgmentEditor
          judgments={effectiveJudgments}
          onJudgmentsChange={(j) => setJudgments(j)}
        />

        <EuiSpacer size="l" />

        <EuiFlexGroup justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              data-test-subj="judgmentSetCancelButton"
              onClick={handleCancel}
            >
              <FormattedMessage
                id="xpack.searchPlayground.relevance.judgmentSetForm.cancel"
                defaultMessage="Cancel"
              />
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              data-test-subj="judgmentSetSaveButton"
              fill
              onClick={handleSave}
              isLoading={isUpdating}
              disabled={!isValid}
            >
              <FormattedMessage
                id="xpack.searchPlayground.relevance.judgmentSetForm.save"
                defaultMessage="Save"
              />
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </KibanaPageTemplate.Section>
    </SearchPlaygroundPageTemplate>
  );
};
