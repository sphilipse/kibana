/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { Route, Routes } from '@kbn/shared-ux-router';
import React from 'react';

import { RelevanceLanding } from './components/relevance/relevance_landing';
import {
  JudgmentSetCreatePage,
  JudgmentSetDetailPage,
} from './components/relevance/judgment_set_form';
import { EvaluatePage } from './components/relevance/evaluate_page';
import { RunsListPage } from './components/relevance/runs_list_page';
import { RunDetailPage } from './components/relevance/run_detail_page';
import { IndexConfigPage } from './components/relevance/index_config_page';
import {
  RELEVANCE_JUDGMENTS_NEW_PATH,
  RELEVANCE_JUDGMENTS_DETAIL_PATH,
  RELEVANCE_EVALUATE_PATH,
  RELEVANCE_RUNS_PATH,
  RELEVANCE_RUNS_DETAIL_PATH,
  RELEVANCE_INDEX_CONFIG_PATH,
  ROOT_PATH,
} from './routes';

export const RelevanceRouter: React.FC = () => {
  return (
    <Routes>
      <Route exact path={ROOT_PATH} component={RelevanceLanding} />
      <Route exact path={RELEVANCE_JUDGMENTS_NEW_PATH} component={JudgmentSetCreatePage} />
      <Route exact path={RELEVANCE_JUDGMENTS_DETAIL_PATH} component={JudgmentSetDetailPage} />
      <Route exact path={RELEVANCE_EVALUATE_PATH} component={EvaluatePage} />
      <Route exact path={RELEVANCE_RUNS_PATH} component={RunsListPage} />
      <Route exact path={RELEVANCE_RUNS_DETAIL_PATH} component={RunDetailPage} />
      <Route exact path={RELEVANCE_INDEX_CONFIG_PATH} component={IndexConfigPage} />
    </Routes>
  );
};
