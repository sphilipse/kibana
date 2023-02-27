/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { IScopedClusterClient } from '@kbn/core-elasticsearch-server';

import { IngestPipelineParams } from '../../../common/types/connectors';

export const postDocuments = async (
  client: IScopedClusterClient,
  indexName: string,
  documents: Array<Record<string, unknown>>,
  pipeline: IngestPipelineParams
) => {
  const operations = documents.flatMap((doc) => [{ index: { _index: indexName } }, doc]);
  // TODO: apply pipeline parameters
  return await client.asCurrentUser.bulk({ operations, pipeline: pipeline.name });
};
