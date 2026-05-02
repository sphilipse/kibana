/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { CoreStart } from '@kbn/core/public';
import type { SharePluginStart } from '@kbn/share-plugin/public';
import type { ConsolePluginStart } from '@kbn/console-plugin/public';
import type { CloudStart } from '@kbn/cloud-plugin/public';
import type { AgentBuilderPluginStart } from '@kbn/agent-builder-plugin/public';
import { useKibana as _useKibana } from '@kbn/kibana-react-plugin/public';

/**
 * The set of Kibana services the onboarding UI expects to find on the Kibana
 * context. The hosting plugin is responsible for providing them via
 * `KibanaContextProvider`.
 */
export type OnboardingServices = CoreStart & {
  share: SharePluginStart;
  console?: ConsolePluginStart;
  cloud?: CloudStart;
  agentBuilder?: AgentBuilderPluginStart;
};

export const useKibana = () => _useKibana<OnboardingServices>();
