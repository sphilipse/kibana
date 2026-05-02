/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

export type Language = 'python' | 'javascript' | 'java' | 'go' | 'rust' | 'csharp';

export interface LanguageDescriptor {
  id: Language;
  label: string;
  syntax: string;
}

export const LANGUAGES: readonly LanguageDescriptor[] = [
  { id: 'python', label: 'Python', syntax: 'python' },
  { id: 'javascript', label: 'JavaScript', syntax: 'javascript' },
  { id: 'java', label: 'Java', syntax: 'java' },
  { id: 'go', label: 'Go', syntax: 'go' },
  { id: 'rust', label: 'Rust', syntax: 'rust' },
  { id: 'csharp', label: 'C#', syntax: 'csharp' },
];

export const DEFAULT_LANGUAGE: Language = 'python';

export type SnippetSet = Record<Language, string>;
