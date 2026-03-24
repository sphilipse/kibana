/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { InferenceConnector } from '@kbn/inference-common';
import { defaultInferenceEndpoints } from '@kbn/inference-common';

/**
 * Turns the internal inference-connectors API payload into the ordered list the UI consumes.
 *
 * When `isFromRecommendation` is true, `connectors` is a prioritized subset (feature
 * recommendations or platform default from the server). Those entries are listed first;
 * remaining entries from `allConnectors` follow without duplicates.
 *
 * When `isFromRecommendation` is false, `connectors` is already the full catalog. The
 * platform default chat-completion inference id is moved to the front when it appears
 * later in the list so default-first UX matches the recommendation path.
 */
export const mergeConnectorsFromApiResponse = (
  connectors: InferenceConnector[],
  allConnectors: InferenceConnector[],
  isFromRecommendation: boolean
): InferenceConnector[] => {
  if (isFromRecommendation) {
    const recommendedIds = new Set(connectors.map((c) => c.connectorId));
    const otherConnectors = allConnectors.filter((c) => !recommendedIds.has(c.connectorId));
    return [...connectors, ...otherConnectors];
  }

  const defaultId = defaultInferenceEndpoints.KIBANA_DEFAULT_CHAT_COMPLETION;
  const defaultIndex = connectors.findIndex((c) => c.connectorId === defaultId);
  if (defaultIndex > 0) {
    const reordered = [...connectors];
    const [defaultConnector] = reordered.splice(defaultIndex, 1);
    reordered.unshift(defaultConnector);
    return reordered;
  }

  return connectors;
};
