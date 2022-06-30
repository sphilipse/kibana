/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { SearchIndex } from '../types';

export const searchIndices: SearchIndex[] = [
  {
    document_count: 100,
    elasticsearch_index_name: 'ent-search-api-one',
    indexName: 'index-1',
    name: 'Our API Index',
    search_engines: 'Search Engine One, Search Engine Two',
    source_type: 'API',
  },
];
