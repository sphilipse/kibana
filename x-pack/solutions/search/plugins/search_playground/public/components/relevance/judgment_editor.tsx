/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  EuiBasicTable,
  EuiButtonEmpty,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiSpacer,
  EuiText,
  EuiButtonGroup,
} from '@elastic/eui';
import type { EuiBasicTableColumn } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

import type { JudgmentRating } from '../../types';

const RATING_OPTIONS = [
  {
    id: 'rating-0',
    label: i18n.translate('xpack.searchPlayground.relevance.judgmentEditor.rating.irrelevant', {
      defaultMessage: '0 - Irrelevant',
    }),
    value: 0,
  },
  {
    id: 'rating-1',
    label: i18n.translate('xpack.searchPlayground.relevance.judgmentEditor.rating.marginal', {
      defaultMessage: '1 - Marginal',
    }),
    value: 1,
  },
  {
    id: 'rating-2',
    label: i18n.translate('xpack.searchPlayground.relevance.judgmentEditor.rating.relevant', {
      defaultMessage: '2 - Relevant',
    }),
    value: 2,
  },
  {
    id: 'rating-3',
    label: i18n.translate(
      'xpack.searchPlayground.relevance.judgmentEditor.rating.highlyRelevant',
      { defaultMessage: '3 - Highly Relevant' }
    ),
    value: 3,
  },
];

export interface JudgmentEditorProps {
  judgments: JudgmentRating[];
  onJudgmentsChange: (judgments: JudgmentRating[]) => void;
}

const ratingValueByOptionId = new Map<string, number>();

export const JudgmentEditor: React.FC<JudgmentEditorProps> = ({
  judgments,
  onJudgmentsChange,
}) => {
  const [newDocId, setNewDocId] = useState('');
  const [newDocIndex, setNewDocIndex] = useState('');

  const handleAddDocument = useCallback(() => {
    const trimmedId = newDocId.trim();
    const trimmedIndex = newDocIndex.trim();
    if (!trimmedId || !trimmedIndex) return;

    const alreadyExists = judgments.some(
      (r) => r.id === trimmedId && r.index === trimmedIndex
    );
    if (alreadyExists) return;

    onJudgmentsChange([...judgments, { index: trimmedIndex, id: trimmedId, rating: 0 }]);
    setNewDocId('');
    setNewDocIndex('');
  }, [judgments, newDocId, newDocIndex, onJudgmentsChange]);

  const handleRatingChange = useCallback(
    (ratingIndex: number, newRating: number) => {
      const updated = judgments.map((r, idx) =>
        idx === ratingIndex ? { ...r, rating: newRating } : r
      );
      onJudgmentsChange(updated);
    },
    [judgments, onJudgmentsChange]
  );

  const handleRemoveRating = useCallback(
    (ratingIndex: number) => {
      onJudgmentsChange(judgments.filter((_, idx) => idx !== ratingIndex));
    },
    [judgments, onJudgmentsChange]
  );

  const columns: Array<EuiBasicTableColumn<JudgmentRating & { originalIndex: number }>> = useMemo(
    () => [
      {
        field: 'index',
        name: i18n.translate('xpack.searchPlayground.relevance.judgmentEditor.indexColumn', {
          defaultMessage: 'Index',
        }),
        width: '25%',
      },
      {
        field: 'id',
        name: i18n.translate('xpack.searchPlayground.relevance.judgmentEditor.docIdColumn', {
          defaultMessage: 'Document ID',
        }),
        width: '25%',
      },
      {
        name: i18n.translate('xpack.searchPlayground.relevance.judgmentEditor.ratingColumn', {
          defaultMessage: 'Rating',
        }),
        render: (item: JudgmentRating & { originalIndex: number }) => (
          <EuiButtonGroup
            legend={i18n.translate(
              'xpack.searchPlayground.relevance.judgmentEditor.ratingLegend',
              { defaultMessage: 'Rating for document {docId}', values: { docId: item.id } }
            )}
            options={RATING_OPTIONS.map((opt) => {
              const optId = `${item.originalIndex}-${opt.id}`;
              ratingValueByOptionId.set(optId, opt.value);
              return { id: optId, label: String(opt.value) };
            })}
            idSelected={`${item.originalIndex}-rating-${item.rating}`}
            onChange={(optionId) => {
              const ratingValue = ratingValueByOptionId.get(optionId) ?? 0;
              handleRatingChange(item.originalIndex, ratingValue);
            }}
            buttonSize="compressed"
            data-test-subj={`judgmentEditorRatingGroup-${item.originalIndex}`}
          />
        ),
        width: '30%',
      },
      {
        actions: [
          {
            name: i18n.translate(
              'xpack.searchPlayground.relevance.judgmentEditor.removeDocAction',
              { defaultMessage: 'Remove' }
            ),
            description: i18n.translate(
              'xpack.searchPlayground.relevance.judgmentEditor.removeDocDescription',
              { defaultMessage: 'Remove this document rating' }
            ),
            icon: 'trash',
            color: 'danger',
            type: 'icon',
            'data-test-subj': 'judgmentEditorRemoveDocButton',
            onClick: (item: JudgmentRating & { originalIndex: number }) => {
              handleRemoveRating(item.originalIndex);
            },
          },
        ],
        width: '80px',
      },
    ],
    [handleRatingChange, handleRemoveRating]
  );

  const itemsWithIndex = useMemo(
    () => judgments.map((r, idx) => ({ ...r, originalIndex: idx })),
    [judgments]
  );

  return (
    <div data-test-subj="judgmentEditor">
      <EuiFlexGroup gutterSize="s" alignItems="flexEnd">
        <EuiFlexItem>
          <EuiFormRow
            label={i18n.translate(
              'xpack.searchPlayground.relevance.judgmentEditor.docIndexLabel',
              { defaultMessage: 'Index' }
            )}
          >
            <EuiFieldText
              data-test-subj="judgmentEditorNewDocIndex"
              value={newDocIndex}
              onChange={(e) => setNewDocIndex(e.target.value)}
              placeholder={i18n.translate(
                'xpack.searchPlayground.relevance.judgmentEditor.docIndexPlaceholder',
                { defaultMessage: 'my-index' }
              )}
            />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow
            label={i18n.translate(
              'xpack.searchPlayground.relevance.judgmentEditor.docIdLabel',
              { defaultMessage: 'Document ID' }
            )}
          >
            <EuiFieldText
              data-test-subj="judgmentEditorNewDocId"
              value={newDocId}
              onChange={(e) => setNewDocId(e.target.value)}
              placeholder={i18n.translate(
                'xpack.searchPlayground.relevance.judgmentEditor.docIdPlaceholder',
                { defaultMessage: 'doc-id' }
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddDocument();
                }
              }}
            />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            data-test-subj="judgmentEditorAddDocButton"
            onClick={handleAddDocument}
            disabled={!newDocId.trim() || !newDocIndex.trim()}
            iconType="plusInCircle"
            size="s"
          >
            <FormattedMessage
              id="xpack.searchPlayground.relevance.judgmentEditor.addDoc"
              defaultMessage="Add document"
            />
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      {judgments.length === 0 ? (
        <EuiText color="subdued" data-test-subj="judgmentEditorEmptyState">
          <p>
            <FormattedMessage
              id="xpack.searchPlayground.relevance.judgmentEditor.emptyState"
              defaultMessage="No document ratings yet. Add a document above to begin rating."
            />
          </p>
        </EuiText>
      ) : (
        <EuiBasicTable
          data-test-subj="judgmentEditorRatingsTable"
          items={itemsWithIndex}
          columns={columns}
          tableCaption={i18n.translate(
            'xpack.searchPlayground.relevance.judgmentEditor.ratingsTableCaption',
            { defaultMessage: 'Document ratings' }
          )}
        />
      )}
    </div>
  );
};
