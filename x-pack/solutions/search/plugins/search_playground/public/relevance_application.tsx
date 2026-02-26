/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { QueryClientProvider } from '@kbn/react-query';
import type { CoreStart } from '@kbn/core/public';
import { KibanaContextProvider } from '@kbn/kibana-react-plugin/public';
import { I18nProvider } from '@kbn/i18n-react';
import { Router } from '@kbn/shared-ux-router';
import type { AppServices } from './types';
import { queryClient } from './utils/query_client';

export const renderRelevanceApp = async (
  core: CoreStart,
  services: AppServices,
  element: HTMLElement
) => {
  const { RelevanceRouter } = await import('./relevance_router');

  ReactDOM.render(
    core.rendering.addContext(
      <KibanaContextProvider services={{ ...core, ...services }}>
        <I18nProvider>
          <Router history={services.history}>
            <QueryClientProvider client={queryClient}>
              <RelevanceRouter />
            </QueryClientProvider>
          </Router>
        </I18nProvider>
      </KibanaContextProvider>
    ),
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
