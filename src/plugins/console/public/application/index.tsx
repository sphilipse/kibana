/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { Observable } from 'rxjs';
import {
  HttpSetup,
  NotificationsSetup,
  I18nStart,
  CoreTheme,
  DocLinksStart,
} from '@kbn/core/public';

import { UsageCollectionSetup } from '@kbn/usage-collection-plugin/public';
import { KibanaThemeProvider } from '../shared_imports';
import {
  createStorage,
  createHistory,
  createSettings,
  AutocompleteInfo,
  setStorage,
} from '../services';
import { createUsageTracker } from '../services/tracker';
import * as localStorageObjectClient from '../lib/local_storage_object_client';
import { ServicesContextProvider } from './contexts';
export { ServicesContextProvider } from './contexts';
export type { ContextServices } from './contexts';
import { createApi, createEsHostService } from './lib';
import { MainConsole } from './containers';
export { MainConsole } from './containers';

export interface BootDependencies {
  http: HttpSetup;
  docLinkVersion: string;
  I18nContext: I18nStart['Context'];
  notifications: NotificationsSetup;
  usageCollection?: UsageCollectionSetup;
  element: HTMLElement;
  theme$: Observable<CoreTheme>;
  docLinks: DocLinksStart['links'];
  autocompleteInfo: AutocompleteInfo;
}

export interface ServicesDependencies {
  autocompleteInfo: AutocompleteInfo;
  http: HttpSetup;
  notifications: NotificationsSetup;
  usageCollection?: UsageCollectionSetup;
}

export function createContextServices({
  autocompleteInfo,
  http,
  notifications,
  usageCollection,
}: ServicesDependencies) {
  const trackUiMetric = createUsageTracker(usageCollection);
  trackUiMetric.load('opened_app');
  const storage = createStorage({
    engine: window.localStorage,
    prefix: 'sense:',
  });
  setStorage(storage);
  const history = createHistory({ storage });
  const settings = createSettings({ storage });
  const objectStorageClient = localStorageObjectClient.create(storage);
  const api = createApi({ http });
  const esHostService = createEsHostService({ api });

  autocompleteInfo.mapping.setup(http, settings);
  return {
    esHostService,
    storage,
    history,
    settings,
    notifications,
    trackUiMetric,
    objectStorageClient,
    http,
    autocompleteInfo,
  };
}

export function renderApp({
  I18nContext,
  notifications,
  docLinkVersion,
  usageCollection,
  element,
  http,
  theme$,
  docLinks,
  autocompleteInfo,
}: BootDependencies) {
  const services = createContextServices({ autocompleteInfo, http, notifications });

  render(
    <I18nContext>
      <KibanaThemeProvider theme$={theme$}>
        <ServicesContextProvider
          value={{
            docLinkVersion,
            docLinks,
            services,
            theme$,
          }}
        >
          <MainConsole settings={services.settings.toJSON()} />
        </ServicesContextProvider>
      </KibanaThemeProvider>
    </I18nContext>,
    element
  );

  return () => unmountComponentAtNode(element);
}
