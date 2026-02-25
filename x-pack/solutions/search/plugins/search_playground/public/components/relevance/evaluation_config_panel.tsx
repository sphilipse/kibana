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
  EuiCallOut,
  EuiFieldNumber,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { CodeEditor } from '@kbn/code-editor';

import type { RankEvalMetricType } from '../../types';

const METRIC_OPTIONS: Array<{ value: RankEvalMetricType; text: string }> = [
  {
    value: 'precision',
    text: i18n.translate('xpack.searchPlayground.relevance.evalConfig.metric.precision', {
      defaultMessage: 'Precision',
    }),
  },
  {
    value: 'recall',
    text: i18n.translate('xpack.searchPlayground.relevance.evalConfig.metric.recall', {
      defaultMessage: 'Recall',
    }),
  },
  {
    value: 'mean_reciprocal_rank',
    text: i18n.translate('xpack.searchPlayground.relevance.evalConfig.metric.mrr', {
      defaultMessage: 'Mean Reciprocal Rank (MRR)',
    }),
  },
  {
    value: 'dcg',
    text: i18n.translate('xpack.searchPlayground.relevance.evalConfig.metric.dcg', {
      defaultMessage: 'Discounted Cumulative Gain (DCG)',
    }),
  },
  {
    value: 'ndcg',
    text: i18n.translate('xpack.searchPlayground.relevance.evalConfig.metric.ndcg', {
      defaultMessage: 'Normalized DCG (nDCG)',
    }),
  },
  {
    value: 'expected_reciprocal_rank',
    text: i18n.translate('xpack.searchPlayground.relevance.evalConfig.metric.err', {
      defaultMessage: 'Expected Reciprocal Rank (ERR)',
    }),
  },
];

const DEFAULT_QUERY_TEMPLATE = `{
  "match": {
    "text": "{{query_string}}"
  }
}`;

export interface EvaluationConfig {
  metricType: RankEvalMetricType;
  k: number;
  queryTemplateJSON: string;
  name: string;
}

interface EvaluationConfigPanelProps {
  onRun: (config: EvaluationConfig) => void;
  onCancel: () => void;
  isRunning: boolean;
  error?: Error | null;
}

export const EvaluationConfigPanel: React.FC<EvaluationConfigPanelProps> = ({
  onRun,
  onCancel,
  isRunning,
  error,
}) => {
  const [metricType, setMetricType] = useState<RankEvalMetricType>('ndcg');
  const [k, setK] = useState<number>(10);
  const [queryTemplateJSON, setQueryTemplateJSON] = useState<string>(DEFAULT_QUERY_TEMPLATE);
  const [name, setName] = useState<string>('');

  const isQueryTemplateValid = useMemo(() => {
    try {
      JSON.parse(queryTemplateJSON);
      return true;
    } catch {
      return false;
    }
  }, [queryTemplateJSON]);

  const isValid = isQueryTemplateValid && k > 0;

  const handleRun = useCallback(() => {
    onRun({
      metricType,
      k,
      queryTemplateJSON,
      name: name.trim(),
    });
  }, [onRun, metricType, k, queryTemplateJSON, name]);

  return (
    <EuiPanel data-test-subj="evaluationConfigPanel" paddingSize="l">
      <EuiTitle size="s">
        <h3>
          <FormattedMessage
            id="xpack.searchPlayground.relevance.evalConfig.title"
            defaultMessage="Evaluation Configuration"
          />
        </h3>
      </EuiTitle>

      <EuiSpacer size="m" />

      <EuiFormRow
        label={i18n.translate('xpack.searchPlayground.relevance.evalConfig.nameLabel', {
          defaultMessage: 'Run name (optional)',
        })}
        fullWidth
      >
        <EuiFieldText
          data-test-subj="evaluationRunNameInput"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={i18n.translate(
            'xpack.searchPlayground.relevance.evalConfig.namePlaceholder',
            { defaultMessage: 'e.g., Baseline run' }
          )}
        />
      </EuiFormRow>

      <EuiSpacer size="m" />

      <EuiFormRow
        label={i18n.translate('xpack.searchPlayground.relevance.evalConfig.metricLabel', {
          defaultMessage: 'Metric',
        })}
        fullWidth
      >
        <EuiSelect
          data-test-subj="evaluationMetricSelect"
          fullWidth
          options={METRIC_OPTIONS}
          value={metricType}
          onChange={(e) => setMetricType(e.target.value as RankEvalMetricType)}
        />
      </EuiFormRow>

      <EuiSpacer size="m" />

      <EuiFormRow
        label={i18n.translate('xpack.searchPlayground.relevance.evalConfig.kLabel', {
          defaultMessage: 'k (top results to evaluate)',
        })}
        fullWidth
      >
        <EuiFieldNumber
          data-test-subj="evaluationKInput"
          fullWidth
          min={1}
          max={1000}
          value={k}
          onChange={(e) => setK(Number(e.target.value))}
        />
      </EuiFormRow>

      <EuiSpacer size="m" />

      <EuiFormRow
        label={i18n.translate('xpack.searchPlayground.relevance.evalConfig.queryTemplateLabel', {
          defaultMessage: 'Query template',
        })}
        helpText={i18n.translate(
          'xpack.searchPlayground.relevance.evalConfig.queryTemplateHelp',
          {
            defaultMessage:
              'Use {{query_string}} as a placeholder for the test query text.',
          }
        )}
        isInvalid={!isQueryTemplateValid && queryTemplateJSON.length > 0}
        error={
          !isQueryTemplateValid && queryTemplateJSON.length > 0
            ? i18n.translate('xpack.searchPlayground.relevance.evalConfig.invalidJson', {
                defaultMessage: 'Invalid JSON',
              })
            : undefined
        }
        fullWidth
      >
        <div data-test-subj="evaluationQueryTemplateEditor" css={css`height: 200px;`}>
          <CodeEditor
            languageId="json"
            value={queryTemplateJSON}
            onChange={setQueryTemplateJSON}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />
        </div>
      </EuiFormRow>

      {error && (
        <>
          <EuiSpacer size="m" />
          <EuiCallOut
            data-test-subj="evaluationError"
            title={i18n.translate('xpack.searchPlayground.relevance.evalConfig.errorTitle', {
              defaultMessage: 'Evaluation failed',
            })}
            color="danger"
            iconType="warning"
          >
            <EuiText size="s">{error.message}</EuiText>
          </EuiCallOut>
        </>
      )}

      <EuiSpacer size="l" />

      <EuiFlexGroup justifyContent="flexEnd">
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty data-test-subj="evaluationCancelButton" onClick={onCancel}>
            <FormattedMessage
              id="xpack.searchPlayground.relevance.evalConfig.cancel"
              defaultMessage="Cancel"
            />
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            data-test-subj="evaluationRunButton"
            fill
            onClick={handleRun}
            isLoading={isRunning}
            disabled={!isValid}
            iconType="play"
          >
            <FormattedMessage
              id="xpack.searchPlayground.relevance.evalConfig.run"
              defaultMessage="Run Evaluation"
            />
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
