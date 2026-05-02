/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { IconType } from '@elastic/eui';

export interface Tutorial {
  /** Stable id used for localStorage progress tracking. */
  id: string;
  title: string;
  description: string;
  icon: IconType;
  /**
   * In-app sub-route to navigate to via React Router (e.g. `/onboarding`),
   * or an absolute external URL (will open in a new tab).
   */
  href: string;
  /** Estimated effort, shown as a small badge. */
  duration: string;
  /** Free-form tag chips. */
  tags: readonly string[];
}

/** ID of the onboarding-wizard tutorial. The wizard's Done button marks this complete. */
export const ONBOARDING_TUTORIAL_ID = 'onboarding-wizard';

export const TUTORIALS: readonly Tutorial[] = [
  {
    id: ONBOARDING_TUTORIAL_ID,
    title: 'Onboarding: ingest and search vectors',
    description:
      'A 3-step walkthrough that creates an index, loads a few documents, and runs your first vector query.',
    icon: 'rocket',
    href: '/onboarding',
    duration: '5 min',
    tags: ['Beginner', 'Wizard'],
  },
  {
    id: 'hybrid-search',
    title: 'Hybrid search: combine kNN with BM25',
    description:
      'Boost recall by combining lexical and vector retrieval, then rescore with reciprocal-rank fusion.',
    icon: 'visBarHorizontalStacked',
    href: 'https://www.elastic.co/search-labs/tutorials/hybrid-search',
    duration: '15 min',
    tags: ['Intermediate', 'Hybrid'],
  },
  {
    id: 'rag-pipeline',
    title: 'Build a RAG pipeline',
    description:
      'Wire vector search into a retrieval-augmented generation flow using LangChain and an Elastic inference endpoint.',
    icon: 'sparkles',
    href: 'https://www.elastic.co/search-labs/tutorials/rag',
    duration: '30 min',
    tags: ['RAG', 'LLM'],
  },
  {
    id: 'semantic-text',
    title: 'Auto-embed text with semantic_text',
    description:
      'Skip the embedding step and let Elasticsearch generate vectors for you on ingest and at query time.',
    icon: 'tokenSemanticText',
    href: 'https://www.elastic.co/docs/solutions/search/semantic-search',
    duration: '10 min',
    tags: ['Beginner', 'semantic_text'],
  },
  {
    id: 'quantization',
    title: 'Quantization deep dive',
    description:
      'Compare int8, int4, and bbq vector compression in terms of memory, latency, and recall.',
    icon: 'visGauge',
    href: 'https://www.elastic.co/search-labs/blog/quantization',
    duration: '20 min',
    tags: ['Performance', 'Advanced'],
  },
  {
    id: 'reranking',
    title: 'Rerank top-k results',
    description:
      'Run a small cross-encoder over the top vector hits to improve final-result precision.',
    icon: 'sortable',
    href: 'https://www.elastic.co/search-labs/tutorials/reranking',
    duration: '15 min',
    tags: ['Quality', 'Reranking'],
  },
];
