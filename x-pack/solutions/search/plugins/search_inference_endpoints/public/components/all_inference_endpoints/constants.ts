/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  SortFieldInferenceEndpoint,
  QueryParams,
  AllInferenceEndpointsTableState,
  SortOrder,
  FilterOptions,
} from './types';

export const DEFAULT_TABLE_ACTIVE_PAGE = 1;
export const DEFAULT_TABLE_LIMIT = 25;

export const DEFAULT_QUERY_PARAMS: QueryParams = {
  page: DEFAULT_TABLE_ACTIVE_PAGE,
  perPage: DEFAULT_TABLE_LIMIT,
  sortField: SortFieldInferenceEndpoint.inference_id,
  sortOrder: SortOrder.asc,
};

export const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  provider: [],
  type: [],
};

export const DEFAULT_INFERENCE_ENDPOINTS_TABLE_STATE: AllInferenceEndpointsTableState = {
  filterOptions: DEFAULT_FILTER_OPTIONS,
  queryParams: DEFAULT_QUERY_PARAMS,
};

export const PIPELINE_URL = 'ingest/ingest_pipelines';
export const SERVERLESS_INDEX_MANAGEMENT_URL = 'index_details';
