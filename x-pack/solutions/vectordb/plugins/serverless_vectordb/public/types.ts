/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CoreStart } from '@kbn/core/public';
import type { SharePluginStart } from '@kbn/share-plugin/public';
import type { ConsolePluginStart } from '@kbn/console-plugin/public';
import type { ServerlessPluginStart } from '@kbn/serverless/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ServerlessVectordbPluginSetup {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ServerlessVectordbPluginStart {}

export interface ServerlessVectordbAppStartDependencies {
  share: SharePluginStart;
  console?: ConsolePluginStart;
}

export interface ServerlessVectordbStartDependencies
  extends ServerlessVectordbAppStartDependencies {
  serverless: ServerlessPluginStart;
}

export type ServerlessVectordbServices = CoreStart & ServerlessVectordbAppStartDependencies;
