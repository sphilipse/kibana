/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type { estypes } from '@elastic/elasticsearch';
import type { AsApiContract } from '@kbn/actions-plugin/common';
import type { HttpSetup } from '@kbn/core/public';
import { BASE_RAC_ALERTS_API_PATH } from '@kbn/rule-registry-plugin/common/constants';
import { useKibana } from '../../common/lib/kibana';
import type { Alert, AlertSummaryTimeRange } from '../sections/alert_summary_widget/types';

interface UseLoadAlertSummaryProps {
  ruleTypeIds?: string[];
  consumers?: string[];
  timeRange: AlertSummaryTimeRange;
  filter?: estypes.QueryDslQueryContainer;
}

interface AlertSummary {
  activeAlertCount: number;
  activeAlerts: Alert[];
  recoveredAlertCount: number;
}

interface LoadAlertSummaryResponse {
  isLoading: boolean;
  alertSummary: AlertSummary;
  error?: string;
}

export function useLoadAlertSummary({
  ruleTypeIds,
  consumers,
  timeRange,
  filter,
}: UseLoadAlertSummaryProps) {
  const { http } = useKibana().services;
  const [alertSummary, setAlertSummary] = useState<LoadAlertSummaryResponse>({
    isLoading: true,
    alertSummary: {
      activeAlertCount: 0,
      activeAlerts: [],
      recoveredAlertCount: 0,
    },
  });
  const isCancelledRef = useRef(false);
  const abortCtrlRef = useRef(new AbortController());
  const loadAlertSummary = useCallback(async () => {
    if (!ruleTypeIds) return;
    isCancelledRef.current = false;
    abortCtrlRef.current.abort();
    abortCtrlRef.current = new AbortController();

    try {
      const { activeAlertCount, activeAlerts, recoveredAlertCount } = await fetchAlertSummary({
        ruleTypeIds,
        consumers,
        filter,
        http,
        signal: abortCtrlRef.current.signal,
        timeRange,
      });

      if (!isCancelledRef.current) {
        setAlertSummary(() => ({
          alertSummary: {
            activeAlertCount,
            activeAlerts,
            recoveredAlertCount,
          },
          isLoading: false,
        }));
      }
    } catch (error) {
      if (!isCancelledRef.current) {
        if (error.name !== 'AbortError') {
          setAlertSummary((oldState) => ({
            ...oldState,
            isLoading: false,
            error: error.message,
          }));
        }
      }
    }
  }, [ruleTypeIds, consumers, filter, http, timeRange]);

  useEffect(() => {
    loadAlertSummary();
  }, [loadAlertSummary]);

  return alertSummary;
}

async function fetchAlertSummary({
  ruleTypeIds,
  consumers,
  filter,
  http,
  signal,
  timeRange: { utcFrom, utcTo, fixedInterval },
}: {
  http: HttpSetup;
  ruleTypeIds: string[];
  consumers?: string[];
  signal: AbortSignal;
  timeRange: AlertSummaryTimeRange;
  filter?: estypes.QueryDslQueryContainer;
}): Promise<AlertSummary> {
  const res = ruleTypeIds.length
    ? await http.post<AsApiContract<any>>(`${BASE_RAC_ALERTS_API_PATH}/_alert_summary`, {
        signal,
        body: JSON.stringify({
          fixed_interval: fixedInterval,
          gte: utcFrom,
          lte: utcTo,
          ruleTypeIds,
          consumers,
          filter: [filter],
        }),
      })
    : {};

  const activeAlertCount = res?.activeAlertCount ?? 0;
  const activeAlerts = res?.activeAlerts ?? [];
  const recoveredAlertCount = res?.recoveredAlertCount ?? 0;

  return {
    activeAlertCount,
    activeAlerts,
    recoveredAlertCount,
  };
}
