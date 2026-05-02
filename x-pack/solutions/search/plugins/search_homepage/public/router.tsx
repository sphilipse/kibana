/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { Route, Routes } from '@kbn/shared-ux-router';
import { OnboardingApiPathsProvider, OnboardingApp } from '@kbn/serverless-onboarding-ui';

import { SearchHomepagePage } from './components/search_homepage/search_homepage';
import { useKibana } from './hooks/use_kibana';

const ONBOARDING_API_PATHS = {
  apiKey: '/internal/search_homepage/onboarding/api_key',
  deploymentStats: '/internal/search_homepage/onboarding/deployment_stats',
};

export const HomepageRouter = () => {
  const {
    services: { cloud },
  } = useKibana();

  // In Serverless Elasticsearch the home app is replaced by the onboarding
  // wizard + deployment dashboard. Stateful Kibana keeps the existing homepage.
  if (cloud?.isServerlessEnabled) {
    return (
      <OnboardingApiPathsProvider paths={ONBOARDING_API_PATHS}>
        <OnboardingApp />
      </OnboardingApiPathsProvider>
    );
  }

  return (
    <Routes>
      <Route>
        <SearchHomepagePage />
      </Route>
    </Routes>
  );
};
