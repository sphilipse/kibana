/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';

const judgmentRatingSchema = schema.object({
  index: schema.string(),
  id: schema.string(),
  rating: schema.number({ min: 0, max: 3 }),
});

const judgmentSchema = schema.object({
  query: schema.string({ minLength: 1 }),
  ratings: schema.arrayOf(judgmentRatingSchema),
});

export const judgmentSetAttributesSchema = schema.object({
  name: schema.string({ minLength: 1, maxLength: 100 }),
  indices: schema.arrayOf(schema.string(), { minSize: 1 }),
  judgments: schema.arrayOf(judgmentSchema, { minSize: 1 }),
});
