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
import { OnboardingApp } from '@kbn/serverless-onboarding-ui';
import type { ServerlessVectordbServices } from './types';

export const renderApp = (
  core: CoreStart,
  services: ServerlessVectordbServices,
  { element, history }: AppMountParameters
) => {
  ReactDOM.render(
    core.rendering.addContext(
      <KibanaContextProvider services={services}>
        <I18nProvider>
          <Router history={history}>
            <OnboardingApp />
          </Router>
        </I18nProvider>
      </KibanaContextProvider>
    ),
    element
  );
  return () => ReactDOM.unmountComponentAtNode(element);
};
