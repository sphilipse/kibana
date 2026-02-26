/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { judgmentSetAttributesSchema } from './v1';

describe('judgmentSetAttributesSchema', () => {
  const validJudgmentSet = {
    name: 'My Judgment Set',
    indices: ['my-index'],
    query: 'search term',
    judgments: [
      { index: 'my-index', id: 'doc1', rating: 3 },
      { index: 'my-index', id: 'doc2', rating: 0 },
    ],
  };

  it('validates a valid judgment set', () => {
    expect(() => judgmentSetAttributesSchema.validate(validJudgmentSet)).not.toThrow();
  });

  it('requires a non-empty name', () => {
    expect(() =>
      judgmentSetAttributesSchema.validate({ ...validJudgmentSet, name: '' })
    ).toThrow();
  });

  it('requires at least one index', () => {
    expect(() =>
      judgmentSetAttributesSchema.validate({ ...validJudgmentSet, indices: [] })
    ).toThrow();
  });

  it('requires a non-empty query', () => {
    expect(() =>
      judgmentSetAttributesSchema.validate({ ...validJudgmentSet, query: '' })
    ).toThrow();
  });

  it('allows an empty judgments array', () => {
    expect(() =>
      judgmentSetAttributesSchema.validate({ ...validJudgmentSet, judgments: [] })
    ).not.toThrow();
  });

  it('requires each rating to have index, id, and rating', () => {
    expect(() =>
      judgmentSetAttributesSchema.validate({
        ...validJudgmentSet,
        judgments: [{ index: 'i', id: 'd' }],
      })
    ).toThrow();
  });

  it('rejects negative ratings', () => {
    expect(() =>
      judgmentSetAttributesSchema.validate({
        ...validJudgmentSet,
        judgments: [{ index: 'i', id: 'd', rating: -1 }],
      })
    ).toThrow();
  });

  it('rejects ratings above 3', () => {
    expect(() =>
      judgmentSetAttributesSchema.validate({
        ...validJudgmentSet,
        judgments: [{ index: 'i', id: 'd', rating: 4 }],
      })
    ).toThrow();
  });
});
