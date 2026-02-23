/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useState } from 'react';
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

import type { Judgment, JudgmentSetSavedObject } from '../../types';
import {
  useJudgmentSet,
  useCreateJudgmentSet,
  useUpdateJudgmentSet,
} from '../../hooks/use_judgment_sets';
import { SearchPlaygroundPageTemplate } from '../../layout/page_template';
import { usePlaygroundBreadcrumbs } from '../../hooks/use_playground_breadcrumbs';
import { RELEVANCE_PATH } from '../../routes';

import { JudgmentEditor } from './judgment_editor';

export const JudgmentSetCreatePage: React.FC = () => {
  usePlaygroundBreadcrumbs();
  const history = useHistory();
  const { createJudgmentSet, isPending: isCreating } = useCreateJudgmentSet();

  const [name, setName] = useState('');
  const [indices, setIndices] = useState<EuiComboBoxOptionOption[]>([]);
  const [judgments, setJudgments] = useState<Judgment[]>([]);

  const handleSave = useCallback(() => {
    const judgmentSet: JudgmentSetSavedObject = {
      name: name.trim(),
      indices: indices.map((opt) => opt.label),
      judgments,
    };
    createJudgmentSet(judgmentSet, {
      onSuccess: () => {
        history.push(RELEVANCE_PATH);
      },
    });
  }, [name, indices, judgments, createJudgmentSet, history]);

  const handleCancel = useCallback(() => {
    history.push(RELEVANCE_PATH);
  }, [history]);

  const isValid = name.trim().length > 0 && indices.length > 0;

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
            selectedOptions={indices}
            onCreateOption={(value) => {
              setIndices((prev) => [...prev, { label: value }]);
            }}
            onChange={setIndices}
            placeholder={i18n.translate(
              'xpack.searchPlayground.relevance.judgmentSetForm.indicesPlaceholder',
              { defaultMessage: 'Type index name and press Enter' }
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
  const [judgments, setJudgments] = useState<Judgment[] | null>(null);

  const effectiveName = name ?? data?.data.name ?? '';
  const effectiveIndices =
    indices ?? data?.data.indices.map((idx) => ({ label: idx })) ?? [];
  const effectiveJudgments = judgments ?? data?.data.judgments ?? [];

  const handleSave = useCallback(() => {
    const judgmentSet: JudgmentSetSavedObject = {
      name: effectiveName.trim(),
      indices: effectiveIndices.map((opt) => opt.label),
      judgments: effectiveJudgments,
    };
    updateJudgmentSet(
      { id, judgmentSet },
      {
        onSuccess: () => {
          history.push(RELEVANCE_PATH);
        },
      }
    );
  }, [effectiveName, effectiveIndices, effectiveJudgments, updateJudgmentSet, id, history]);

  const handleCancel = useCallback(() => {
    history.push(RELEVANCE_PATH);
  }, [history]);

  const isValid = effectiveName.trim().length > 0 && effectiveIndices.length > 0;

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
            selectedOptions={effectiveIndices}
            onCreateOption={(value) => {
              setIndices((prev) => [...(prev ?? effectiveIndices), { label: value }]);
            }}
            onChange={(opts) => setIndices(opts)}
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
