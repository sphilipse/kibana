/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  EuiBasicTable,
  EuiButton,
  EuiButtonEmpty,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiSpacer,
  EuiText,
  EuiBadge,
  EuiButtonGroup,
  EuiPanel,
  EuiTitle,
  useEuiTheme,
  transparentize,
} from '@elastic/eui';
import type { EuiBasicTableColumn } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

import type { Judgment, JudgmentRating } from '../../types';

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
  judgments: Judgment[];
  onJudgmentsChange: (judgments: Judgment[]) => void;
}

interface RatingRowItem extends JudgmentRating {
  queryIndex: number;
  ratingIndex: number;
}

const ratingValueByOptionId = new Map<string, number>();

export const JudgmentEditor: React.FC<JudgmentEditorProps> = ({
  judgments,
  onJudgmentsChange,
}) => {
  const { euiTheme } = useEuiTheme();
  const [expandedQueryIndex, setExpandedQueryIndex] = useState<number | null>(null);
  const [newQueryText, setNewQueryText] = useState('');
  const [newDocId, setNewDocId] = useState('');
  const [newDocIndex, setNewDocIndex] = useState('');

  const handleAddQuery = useCallback(() => {
    const trimmed = newQueryText.trim();
    if (!trimmed) return;

    const updated = [...judgments, { query: trimmed, ratings: [] }];
    onJudgmentsChange(updated);
    setNewQueryText('');
    setExpandedQueryIndex(updated.length - 1);
  }, [judgments, newQueryText, onJudgmentsChange]);

  const handleRemoveQuery = useCallback(
    (queryIndex: number) => {
      const updated = judgments.filter((_, idx) => idx !== queryIndex);
      onJudgmentsChange(updated);
      if (expandedQueryIndex === queryIndex) {
        setExpandedQueryIndex(null);
      } else if (expandedQueryIndex !== null && expandedQueryIndex > queryIndex) {
        setExpandedQueryIndex(expandedQueryIndex - 1);
      }
    },
    [judgments, expandedQueryIndex, onJudgmentsChange]
  );

  const handleAddDocument = useCallback(() => {
    if (expandedQueryIndex === null || !newDocId.trim() || !newDocIndex.trim()) return;

    const updated = judgments.map((judgment, idx) => {
      if (idx !== expandedQueryIndex) return judgment;
      const alreadyRated = judgment.ratings.some(
        (r) => r.id === newDocId.trim() && r.index === newDocIndex.trim()
      );
      if (alreadyRated) return judgment;
      return {
        ...judgment,
        ratings: [...judgment.ratings, { index: newDocIndex.trim(), id: newDocId.trim(), rating: 0 }],
      };
    });
    onJudgmentsChange(updated);
    setNewDocId('');
    setNewDocIndex('');
  }, [expandedQueryIndex, judgments, newDocId, newDocIndex, onJudgmentsChange]);

  const handleRatingChange = useCallback(
    (queryIndex: number, ratingIndex: number, newRating: number) => {
      const updated = judgments.map((judgment, qIdx) => {
        if (qIdx !== queryIndex) return judgment;
        return {
          ...judgment,
          ratings: judgment.ratings.map((r, rIdx) =>
            rIdx === ratingIndex ? { ...r, rating: newRating } : r
          ),
        };
      });
      onJudgmentsChange(updated);
    },
    [judgments, onJudgmentsChange]
  );

  const handleRemoveRating = useCallback(
    (queryIndex: number, ratingIndex: number) => {
      const updated = judgments.map((judgment, qIdx) => {
        if (qIdx !== queryIndex) return judgment;
        return {
          ...judgment,
          ratings: judgment.ratings.filter((_, rIdx) => rIdx !== ratingIndex),
        };
      });
      onJudgmentsChange(updated);
    },
    [judgments, onJudgmentsChange]
  );

  const queryColumns: Array<EuiBasicTableColumn<Judgment & { originalIndex: number }>> = useMemo(
    () => [
      {
        field: 'query',
        name: i18n.translate('xpack.searchPlayground.relevance.judgmentEditor.queryColumn', {
          defaultMessage: 'Query',
        }),
        'data-test-subj': 'judgmentEditorQueryColumn',
      },
      {
        name: i18n.translate('xpack.searchPlayground.relevance.judgmentEditor.ratingsColumn', {
          defaultMessage: 'Rated Documents',
        }),
        render: (item: Judgment) => (
          <EuiBadge color="hollow">{item.ratings.length}</EuiBadge>
        ),
        width: '140px',
      },
      {
        actions: [
          {
            name: i18n.translate(
              'xpack.searchPlayground.relevance.judgmentEditor.expandAction',
              { defaultMessage: 'Expand' }
            ),
            description: i18n.translate(
              'xpack.searchPlayground.relevance.judgmentEditor.expandDescription',
              { defaultMessage: 'Expand to view and edit ratings' }
            ),
            icon: 'expand',
            type: 'icon',
            'data-test-subj': 'judgmentEditorExpandButton',
            onClick: (item: Judgment & { originalIndex: number }) => {
              setExpandedQueryIndex(
                expandedQueryIndex === item.originalIndex ? null : item.originalIndex
              );
            },
          },
          {
            name: i18n.translate(
              'xpack.searchPlayground.relevance.judgmentEditor.deleteQueryAction',
              { defaultMessage: 'Delete' }
            ),
            description: i18n.translate(
              'xpack.searchPlayground.relevance.judgmentEditor.deleteQueryDescription',
              { defaultMessage: 'Delete this query' }
            ),
            icon: 'trash',
            color: 'danger',
            type: 'icon',
            'data-test-subj': 'judgmentEditorDeleteQueryButton',
            onClick: (item: Judgment & { originalIndex: number }) => {
              handleRemoveQuery(item.originalIndex);
            },
          },
        ],
      },
    ],
    [expandedQueryIndex, handleRemoveQuery]
  );

  const ratingColumns: Array<EuiBasicTableColumn<RatingRowItem>> = useMemo(
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
        render: (item: RatingRowItem) => (
          <EuiButtonGroup
            legend={i18n.translate(
              'xpack.searchPlayground.relevance.judgmentEditor.ratingLegend',
              { defaultMessage: 'Rating for document {docId}', values: { docId: item.id } }
            )}
            options={RATING_OPTIONS.map((opt) => {
              const optId = `${item.queryIndex}-${item.ratingIndex}-${opt.id}`;
              ratingValueByOptionId.set(optId, opt.value);
              return { id: optId, label: String(opt.value) };
            })}
            idSelected={`${item.queryIndex}-${item.ratingIndex}-rating-${item.rating}`}
            onChange={(optionId) => {
              const ratingValue = ratingValueByOptionId.get(optionId) ?? 0;
              handleRatingChange(item.queryIndex, item.ratingIndex, ratingValue);
            }}
            buttonSize="compressed"
            data-test-subj={`judgmentEditorRatingGroup-${item.queryIndex}-${item.ratingIndex}`}
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
            onClick: (item: RatingRowItem) => {
              handleRemoveRating(item.queryIndex, item.ratingIndex);
            },
          },
        ],
        width: '80px',
      },
    ],
    [handleRatingChange, handleRemoveRating]
  );

  const queriesWithIndex = useMemo(
    () => judgments.map((j, idx) => ({ ...j, originalIndex: idx })),
    [judgments]
  );

  const expandedRatings: RatingRowItem[] = useMemo(() => {
    if (expandedQueryIndex === null || expandedQueryIndex >= judgments.length) return [];
    return judgments[expandedQueryIndex].ratings.map((r, rIdx) => ({
      ...r,
      queryIndex: expandedQueryIndex,
      ratingIndex: rIdx,
    }));
  }, [expandedQueryIndex, judgments]);

  return (
    <div data-test-subj="judgmentEditor">
      <EuiFlexGroup gutterSize="s" alignItems="flexEnd">
        <EuiFlexItem>
          <EuiFormRow
            label={i18n.translate(
              'xpack.searchPlayground.relevance.judgmentEditor.addQueryLabel',
              { defaultMessage: 'Add query' }
            )}
          >
            <EuiFieldText
              data-test-subj="judgmentEditorNewQueryInput"
              placeholder={i18n.translate(
                'xpack.searchPlayground.relevance.judgmentEditor.queryPlaceholder',
                { defaultMessage: 'Enter a test query...' }
              )}
              value={newQueryText}
              onChange={(e) => setNewQueryText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddQuery();
                }
              }}
            />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            data-test-subj="judgmentEditorAddQueryButton"
            onClick={handleAddQuery}
            disabled={!newQueryText.trim()}
            iconType="plusInCircle"
          >
            <FormattedMessage
              id="xpack.searchPlayground.relevance.judgmentEditor.addQuery"
              defaultMessage="Add"
            />
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      {judgments.length === 0 ? (
        <EuiText color="subdued" data-test-subj="judgmentEditorEmptyState">
          <p>
            <FormattedMessage
              id="xpack.searchPlayground.relevance.judgmentEditor.emptyState"
              defaultMessage="No queries added yet. Add a query above to begin rating documents."
            />
          </p>
        </EuiText>
      ) : (
        <EuiBasicTable
          data-test-subj="judgmentEditorQueryTable"
          items={queriesWithIndex}
          columns={queryColumns}
          tableCaption={i18n.translate(
            'xpack.searchPlayground.relevance.judgmentEditor.tableCaption',
            { defaultMessage: 'Judgment queries' }
          )}
          rowProps={(item) => ({
            'data-test-subj': `judgmentEditorQueryRow-${item.originalIndex}`,
            onClick: () =>
              setExpandedQueryIndex(
                expandedQueryIndex === item.originalIndex ? null : item.originalIndex
              ),
            style: {
              cursor: 'pointer',
              backgroundColor:
                expandedQueryIndex === item.originalIndex
                  ? transparentize(euiTheme.colors.primary, 0.05)
                  : undefined,
            },
          })}
        />
      )}

      {expandedQueryIndex !== null && expandedQueryIndex < judgments.length && (
        <>
          <EuiSpacer size="m" />
          <EuiPanel paddingSize="m" hasBorder data-test-subj="judgmentEditorRatingsPanel">
            <EuiTitle size="xs">
              <h4>
                <FormattedMessage
                  id="xpack.searchPlayground.relevance.judgmentEditor.ratingsTitle"
                  defaultMessage='Ratings for "{query}"'
                  values={{ query: judgments[expandedQueryIndex].query }}
                />
              </h4>
            </EuiTitle>

            <EuiSpacer size="s" />

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

            <EuiSpacer size="s" />

            {expandedRatings.length === 0 ? (
              <EuiText color="subdued" size="s" data-test-subj="judgmentEditorNoRatings">
                <p>
                  <FormattedMessage
                    id="xpack.searchPlayground.relevance.judgmentEditor.noRatings"
                    defaultMessage="No documents rated for this query yet."
                  />
                </p>
              </EuiText>
            ) : (
              <EuiBasicTable
                data-test-subj="judgmentEditorRatingsTable"
                items={expandedRatings}
                columns={ratingColumns}
                tableCaption={i18n.translate(
                  'xpack.searchPlayground.relevance.judgmentEditor.ratingsTableCaption',
                  { defaultMessage: 'Document ratings' }
                )}
              />
            )}
          </EuiPanel>
        </>
      )}
    </div>
  );
};
