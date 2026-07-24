/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  IndicesGetMappingResponse,
  MappingProperty,
  SearchHit,
} from '@elastic/elasticsearch/lib/api/types';
import type { MetaDataProps, FieldProps } from './result_types';

const TITLE_KEYS = ['title', 'name'];

const isRecord = (source: unknown | undefined): source is Record<PropertyKey, unknown> => {
  return typeof source === 'object' && source !== null;
};

function hasStringKey<T extends Record<PropertyKey, unknown>, K extends PropertyKey>(
  source: T,
  key: K
): source is T & Record<K, string> {
  return typeof source[key] === 'string';
}

export const resultTitle = (result: SearchHit): string | undefined => {
  if (isRecord(result._source)) {
    for (const key of TITLE_KEYS) {
      if (hasStringKey(result._source, key)) {
        return result._source[key];
      }
    }
  }
  return undefined;
};

export const resultMetaData = (result: SearchHit): MetaDataProps => ({
  id: result._id!,
  title: resultTitle(result),
  score: result._score,
});

const MAPPING_TYPE_ORDER = ['semantic_text', 'dense_vector', 'sparse_vector'];
const SPECIAL_NAME_FIELDS = ['headings'];

/**
 * Reorders an array of fields based on their importance.
 *
 * The function sorts the fields by checking if their names are in the `SPECIAL_NAME_FIELDS` array first and then by
 * their mapping type (semantic_text, dense_vector, sparse_vector) if they are not in the `SPECIAL_NAME_FIELDS` array.
 *
 * @param fields - An array of field properties to be reordered.
 * @returns The reordered array of field properties.
 */
export const reorderFieldsInImportance = (fields: FieldProps[]) => {
  return fields.sort((a, b) => {
    const specialA = SPECIAL_NAME_FIELDS.indexOf(a.fieldName);
    const specialB = SPECIAL_NAME_FIELDS.indexOf(b.fieldName);

    if (specialA !== -1 || specialB !== -1) {
      if (specialA === -1) return 1;
      if (specialB === -1) return -1;
      return specialA - specialB;
    }

    const typeA = MAPPING_TYPE_ORDER.indexOf(a.fieldType);
    const typeB = MAPPING_TYPE_ORDER.indexOf(b.fieldType);
    const orderA = typeA === -1 ? MAPPING_TYPE_ORDER.length : typeA;
    const orderB = typeB === -1 ? MAPPING_TYPE_ORDER.length : typeB;

    if (orderA === orderB) {
      return a.fieldName.localeCompare(b.fieldName);
    }
    return orderA - orderB;
  });
};

export const resultToFieldFromMappingResponse = (
  result: SearchHit,
  mappings?: IndicesGetMappingResponse
): FieldProps[] => {
  if (mappings && mappings[result._index] && result._source && !Array.isArray(result._source)) {
    if (typeof result._source === 'object') {
      return Object.entries(result._source).map(([key, value]) => {
        return {
          fieldName: key,
          fieldType: mappings[result._index]?.mappings?.properties?.[key]?.type ?? 'object',
          fieldValue: JSON.stringify(value, null, 2),
        };
      });
    }
  }
  return [];
};

const INFERENCE_FIELDS_KEY = '_inference_fields';

interface InferenceChunk {
  embeddings?: unknown;
}

interface InferenceFieldMetadata {
  inference?: {
    model_settings?: {
      task_type?: string;
      dimensions?: number;
    };
    chunks?: Record<string, InferenceChunk[]>;
  };
}

const isDenseEmbedding = (embeddings: unknown): embeddings is number[] =>
  Array.isArray(embeddings) && embeddings.every((value) => typeof value === 'number');

/**
 * Extracts the dense (text_embedding) vectors and dimension count for a semantic_text field from its
 * `_inference_fields` metadata. Returns `undefined` for sparse embeddings or when no dense vector is present.
 */
const getSemanticTextDenseVector = (
  fieldName: string,
  metadata: InferenceFieldMetadata | undefined
): { dimensions: number; embeddings: number[][] } | undefined => {
  const inference = metadata?.inference;
  if (inference?.model_settings?.task_type !== 'text_embedding') {
    return undefined;
  }
  const chunks = inference.chunks?.[fieldName];
  if (!Array.isArray(chunks)) {
    return undefined;
  }
  const embeddings = chunks.map((chunk) => chunk.embeddings).filter(isDenseEmbedding);
  if (embeddings.length === 0) {
    return undefined;
  }
  return {
    dimensions: inference.model_settings.dimensions ?? embeddings[0].length,
    embeddings,
  };
};

export const resultToFieldFromMappings = (
  result: SearchHit,
  mappings?: Record<string, MappingProperty>
): FieldProps[] => {
  if (mappings && result._source && !Array.isArray(result._source)) {
    const source = result._source as Record<string, unknown>;
    const inferenceFields = isRecord(source[INFERENCE_FIELDS_KEY])
      ? (source[INFERENCE_FIELDS_KEY] as Record<string, InferenceFieldMetadata>)
      : {};

    return Object.entries(source)
      .filter(([key]) => key !== INFERENCE_FIELDS_KEY)
      .map(([key, value]) => {
        const fieldType = mappings[key]?.type ?? 'object';
        if (fieldType === 'semantic_text') {
          const denseVector = getSemanticTextDenseVector(key, inferenceFields[key]);
          if (denseVector) {
            const { dimensions, embeddings } = denseVector;
            return {
              fieldName: key,
              fieldType,
              fieldValue: JSON.stringify(value, null, 2),
              dimensions,
              embeddings: JSON.stringify(embeddings.length === 1 ? embeddings[0] : embeddings),
            };
          }
        }
        return {
          fieldName: key,
          fieldType,
          fieldValue: JSON.stringify(value, null, 2),
        };
      });
  }
  return [];
};
