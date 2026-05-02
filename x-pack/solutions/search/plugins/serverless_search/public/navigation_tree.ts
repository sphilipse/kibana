/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ApplicationStart } from '@kbn/core-application-browser';
import type { NavigationTreeDefinition } from '@kbn/core-chrome-browser';
import { DATA_MANAGEMENT_NAV_ID } from '@kbn/deeplinks-management';
import { i18n } from '@kbn/i18n';

const NAV_TITLE = i18n.translate('xpack.serverlessSearch.nav.title', {
  defaultMessage: 'Elasticsearch',
});

export function createNavigationTree(
  _options?: ApplicationStart & {
    showAiAssistant?: boolean;
    showAlertingV2?: boolean;
  }
): NavigationTreeDefinition {
  return {
    body: [
      {
        link: 'searchHomepage',
        title: NAV_TITLE,
        icon: 'logoElasticsearch',
        renderAs: 'home',
        breadcrumbStatus: 'hidden',
      },
      {
        link: 'agent_builder',
        icon: 'productAgent',
      },
      {
        link: 'workflows',
      },
      {
        link: 'discover',
        icon: 'productDiscover',
      },
      {
        id: DATA_MANAGEMENT_NAV_ID, // important for tour
        title: i18n.translate('xpack.serverlessSearch.nav.dataManagement', {
          defaultMessage: 'Data management',
        }),
        icon: 'database',
        renderAs: 'panelOpener',
        children: [
          {
            title: i18n.translate('xpack.serverlessSearch.nav.dataManagement.indices', {
              defaultMessage: 'Indices and data streams',
            }),
            breadcrumbStatus: 'hidden',
            children: [
              { link: 'management:index_management', breadcrumbStatus: 'hidden' },
              { link: 'management:transform', breadcrumbStatus: 'hidden' },
            ],
          },
          {
            title: i18n.translate('xpack.serverlessSearch.nav.dataManagement.ingest', {
              defaultMessage: 'Ingest',
            }),
            breadcrumbStatus: 'hidden',
            children: [{ link: 'management:ingest_pipelines', breadcrumbStatus: 'hidden' }],
          },
          {
            title: i18n.translate('xpack.serverlessSearch.nav.dataManagement.dataViews', {
              defaultMessage: 'Data views',
            }),
            breadcrumbStatus: 'hidden',
            children: [{ link: 'management:dataViews', breadcrumbStatus: 'hidden' }],
          },
        ],
      },
    ],
    footer: [
      {
        id: 'devTools',
        title: i18n.translate('xpack.serverlessSearch.nav.developerTools', {
          defaultMessage: 'Developer tools',
        }),
        link: 'dev_tools',
        icon: 'code',
      },
      {
        id: 'management',
        title: i18n.translate('xpack.serverlessSearch.nav.management', {
          defaultMessage: 'Management',
        }),
        icon: 'gear',
        renderAs: 'panelOpener',
        children: [
          {
            title: i18n.translate('xpack.serverlessSearch.nav.management.access', {
              defaultMessage: 'Access',
            }),
            breadcrumbStatus: 'hidden',
            children: [{ link: 'management:api_keys', breadcrumbStatus: 'hidden' }],
          },
          {
            title: i18n.translate('xpack.serverlessSearch.nav.management.content', {
              defaultMessage: 'Content',
            }),
            breadcrumbStatus: 'hidden',
            children: [
              { link: 'management:spaces', breadcrumbStatus: 'hidden' },
              { link: 'management:objects', breadcrumbStatus: 'hidden' },
              { link: 'management:settings', breadcrumbStatus: 'hidden' },
            ],
          },
        ],
      },
    ],
  };
}

export const navigationTree = (application: ApplicationStart): NavigationTreeDefinition => {
  return createNavigationTree(application);
};
