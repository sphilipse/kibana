/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { Route, Routes } from '@kbn/shared-ux-router';
import React from 'react';
import { Redirect } from 'react-router-dom';
import { PlaygroundsListPage } from './playground_list_page';
import { PlaygroundOverview } from './playground_overview';
import { SavedPlaygroundPage } from './saved_playground';

import {
  ROOT_PATH,
  SAVED_PLAYGROUND_PATH,
  SEARCH_PLAYGROUND_CHAT_PATH,
  SEARCH_PLAYGROUND_NOT_FOUND,
  SEARCH_PLAYGROUND_SEARCH_PATH,
  RELEVANCE_PATH,
  RELEVANCE_JUDGMENTS_NEW_PATH,
  RELEVANCE_JUDGMENTS_DETAIL_PATH,
  RELEVANCE_EVALUATE_PATH,
  RELEVANCE_RUNS_PATH,
  RELEVANCE_RUNS_DETAIL_PATH,
} from './routes';
import { usePlaygroundLicenseStatus } from './hooks/use_license_status';
import { useSearchPlaygroundFeatureFlag } from './hooks/use_search_playground_feature_flag';
import { PlaygroundUnavailable } from './playground_unavailable_page';
import { PlaygroundRouteNotFound } from './components/not_found';
import { RelevanceLanding } from './components/relevance/relevance_landing';
import {
  JudgmentSetCreatePage,
  JudgmentSetDetailPage,
} from './components/relevance/judgment_set_form';
import { EvaluatePage } from './components/relevance/evaluate_page';
import { RunsListPage } from './components/relevance/runs_list_page';
import { RunDetailPage } from './components/relevance/run_detail_page';

export const PlaygroundRouter: React.FC = () => {
  const { hasRequiredLicense } = usePlaygroundLicenseStatus();
  const isSearchModeEnabled = useSearchPlaygroundFeatureFlag();

  if (!hasRequiredLicense) {
    return (
      <Routes>
        <Route component={PlaygroundUnavailable} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route exact path={ROOT_PATH} component={PlaygroundsListPage} />
      <Route exact path={RELEVANCE_PATH} component={RelevanceLanding} />
      <Route exact path={RELEVANCE_JUDGMENTS_NEW_PATH} component={JudgmentSetCreatePage} />
      <Route exact path={RELEVANCE_JUDGMENTS_DETAIL_PATH} component={JudgmentSetDetailPage} />
      <Route exact path={RELEVANCE_EVALUATE_PATH} component={EvaluatePage} />
      <Route exact path={RELEVANCE_RUNS_PATH} component={RunsListPage} />
      <Route exact path={RELEVANCE_RUNS_DETAIL_PATH} component={RunDetailPage} />
      <Route path={SAVED_PLAYGROUND_PATH} component={SavedPlaygroundPage} />
      {!isSearchModeEnabled && (
        <Redirect from={SEARCH_PLAYGROUND_SEARCH_PATH} to={SEARCH_PLAYGROUND_CHAT_PATH} />
      )}
      <Route exact path={SEARCH_PLAYGROUND_NOT_FOUND} component={PlaygroundRouteNotFound} />
      <Route path={`/:pageMode/:viewMode?`} component={PlaygroundOverview} />
    </Routes>
  );
};
