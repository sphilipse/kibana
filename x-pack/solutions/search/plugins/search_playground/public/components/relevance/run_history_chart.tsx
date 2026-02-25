/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import {
  Chart,
  Settings,
  LineSeries,
  Axis,
  Position,
  ScaleType,
  timeFormatter,
  Tooltip,
} from '@elastic/charts';
import type { XYChartElementEvent } from '@elastic/charts';
import { css } from '@emotion/react';
import { EuiEmptyPrompt, EuiPanel, EuiTitle } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

import type { EvaluationRunListObject } from '../../types';

interface RunHistoryChartProps {
  runs: EvaluationRunListObject[];
  onRunClick?: (runId: string) => void;
}

export const RunHistoryChart: React.FC<RunHistoryChartProps> = ({ runs, onRunClick }) => {
  const chartData = useMemo(
    () =>
      [...runs]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((run) => ({
          x: new Date(run.timestamp).getTime(),
          y: run.overallScore,
          runId: run.id,
          name: run.name ?? run.id,
        })),
    [runs]
  );

  if (runs.length === 0) {
    return (
      <EuiPanel data-test-subj="runHistoryChart" paddingSize="l">
        <EuiEmptyPrompt
          data-test-subj="runHistoryChartEmpty"
          iconType="visLine"
          title={
            <h3>
              <FormattedMessage
                id="xpack.searchPlayground.relevance.runHistoryChart.emptyTitle"
                defaultMessage="No evaluation runs yet"
              />
            </h3>
          }
          body={
            <p>
              <FormattedMessage
                id="xpack.searchPlayground.relevance.runHistoryChart.emptyBody"
                defaultMessage="Run an evaluation to see score trends over time."
              />
            </p>
          }
        />
      </EuiPanel>
    );
  }

  return (
    <EuiPanel data-test-subj="runHistoryChart" paddingSize="l">
      <EuiTitle size="xs">
        <h4>
          <FormattedMessage
            id="xpack.searchPlayground.relevance.runHistoryChart.title"
            defaultMessage="Score History"
          />
        </h4>
      </EuiTitle>
      <div css={css`height: 300px;`} data-test-subj="runHistoryChartContainer">
        <Chart>
          <Settings
            theme={{
              lineSeriesStyle: {
                point: { visible: 'always', radius: 4 },
              },
            }}
            onElementClick={(elements) => {
              if (onRunClick && elements.length > 0) {
                const [geometry] = elements as XYChartElementEvent[];
                const datum = geometry[0]?.datum as { runId?: string } | undefined;
                if (datum?.runId) {
                  onRunClick(datum.runId);
                }
              }
            }}
          />
          <Tooltip type="follow" />
          <Axis
            id="bottom"
            position={Position.Bottom}
            tickFormat={timeFormatter('YYYY-MM-DD HH:mm')}
            title={i18n.translate(
              'xpack.searchPlayground.relevance.runHistoryChart.timeAxis',
              { defaultMessage: 'Time' }
            )}
          />
          <Axis
            id="left"
            position={Position.Left}
            domain={{ min: 0, max: 1 }}
            title={i18n.translate(
              'xpack.searchPlayground.relevance.runHistoryChart.scoreAxis',
              { defaultMessage: 'Score' }
            )}
          />
          <LineSeries
            id="score"
            name={i18n.translate(
              'xpack.searchPlayground.relevance.runHistoryChart.scoreSeries',
              { defaultMessage: 'Overall Score' }
            )}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            xAccessor="x"
            yAccessors={['y']}
            data={chartData}
          />
        </Chart>
      </div>
    </EuiPanel>
  );
};
