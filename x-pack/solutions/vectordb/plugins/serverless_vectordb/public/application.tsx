/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import type { AppMountParameters, CoreStart } from '@kbn/core/public';
import { I18nProvider } from '@kbn/i18n-react';
import { KibanaContextProvider } from '@kbn/kibana-react-plugin/public';
import { Router } from '@kbn/shared-ux-router';
import { OnboardingApiPathsProvider, OnboardingApp } from '@kbn/serverless-onboarding-ui';
import type { ServerlessVectordbServices } from './types';

const ONBOARDING_API_PATHS = {
  apiKey: '/internal/serverless_vectordb/api_key',
  deploymentStats: '/internal/serverless_vectordb/deployment_stats',
};

export const renderApp = (
  core: CoreStart,
  services: ServerlessVectordbServices,
  { element, history }: AppMountParameters
) => {
  ReactDOM.render(
    core.rendering.addContext(
      <KibanaContextProvider services={services}>
        <I18nProvider>
          <OnboardingApiPathsProvider paths={ONBOARDING_API_PATHS}>
            <Router history={history}>
              <OnboardingApp />
            </Router>
          </OnboardingApiPathsProvider>
        </I18nProvider>
      </KibanaContextProvider>
    ),
    element
  );
  return () => ReactDOM.unmountComponentAtNode(element);
};
