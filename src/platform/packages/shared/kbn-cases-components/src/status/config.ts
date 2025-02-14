/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import * as i18n from './translations';
import { CaseStatuses } from './types';

export const getStatusConfiguration = () => ({
  [CaseStatuses.open]: {
    color: 'success',
    label: i18n.OPEN,
    icon: 'folderOpen' as const,
  },
  [CaseStatuses['in-progress']]: {
    color: 'primary',
    label: i18n.IN_PROGRESS,
    icon: 'folderExclamation' as const,
  },
  [CaseStatuses.closed]: {
    color: 'default',
    label: i18n.CLOSED,
    icon: 'folderCheck' as const,
  },
});
