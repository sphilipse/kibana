/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { chunk, uniq } from 'lodash';

import { i18n } from '@kbn/i18n';

import { IngestPipelineParams } from '../../../../../common/types/connectors';
import { Actions, createApiLogic } from '../../../shared/api_logic/create_api_logic';
import { HttpLogic } from '../../../shared/http';

export interface IndexDocumentsArgs {
  documents: unknown[];
  indexName: string;
  pipeline?: IngestPipelineParams;
}

export interface IndexDocumentsResponse {
  errors: string[];
}

interface FileUploadSummary {
  errors: string[];
  invalidDocuments: { examples: unknown[]; total: number };
  validDocuments: { examples: unknown[]; total: number };
}

export const indexDocuments = async ({
  indexName,
  documents,
  pipeline,
}: IndexDocumentsArgs): Promise<IndexDocumentsResponse> => {
  const route = `/internal/enterprise_search/indices/${indexName}/documents`;
  const CHUNK_SIZE = 100;
  const MAX_EXAMPLES = 5;
  const promises = chunk(documents, CHUNK_SIZE).map((documentsChunk) => {
    return HttpLogic.values.http.post<FileUploadSummary>(route, {
      body: JSON.stringify({ documents: documentsChunk, pipeline }),
    });
  });
  try {
    const responses = await Promise.all(promises);
    const summary: FileUploadSummary = {
      errors: [],
      invalidDocuments: { total: 0, examples: [] },
      validDocuments: { total: 0, examples: [] },
    };
    responses.forEach((response: FileUploadSummary) => {
      if (response.errors?.length > 0) {
        summary.errors = uniq([...summary.errors, ...response.errors]);
        return;
      }
      summary.validDocuments.total += response.validDocuments.total;
      summary.invalidDocuments.total += response.invalidDocuments.total;
      summary.validDocuments.examples = [
        ...summary.validDocuments.examples,
        ...response.validDocuments.examples,
      ].slice(0, MAX_EXAMPLES);
      summary.invalidDocuments.examples = [
        ...summary.invalidDocuments.examples,
        ...response.invalidDocuments.examples,
      ].slice(0, MAX_EXAMPLES);
    });
    return summary;
  } catch ({ body, message }) {
    const errors = body ? `[${body.statusCode} ${body.error}] ${body.message}` : message;
    return { errors };
  }
};

export const IndexDocumentsApiLogic = createApiLogic(
  ['content', 'index_documents_api_logic'],
  indexDocuments,
  {
    showSuccessFlashFn: () =>
      i18n.translate('xpack.enterpriseSearch.content.indices.pipelines.successToast.title', {
        defaultMessage: 'Indexed documents',
      }),
  }
);

export type IndexDocumentsActions = Actions<IndexDocumentsArgs, IndexDocumentsResponse>;
