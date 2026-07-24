/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { I18nProvider } from '@kbn/i18n-react';
import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';

import { ResultField } from './result_field';

const renderField = (props: React.ComponentProps<typeof ResultField>) =>
  render(
    <I18nProvider>
      <table>
        <tbody>
          <ResultField {...props} />
        </tbody>
      </table>
    </I18nProvider>
  );

const iconTypeOf = (container: HTMLElement): string | null =>
  container.querySelector('[data-euiicon-type]')?.getAttribute('data-euiicon-type') ?? null;

describe('ResultField', () => {
  it('shows the text and embeddings type lines in the Field cell for a semantic_text field with vectors', () => {
    const { container } = renderField({
      fieldName: 'body',
      fieldType: 'semantic_text',
      fieldValue: '"the original text"',
      embeddings: JSON.stringify([0.1, 0.2]),
      dimensions: 2,
    });
    const icons = Array.from(container.querySelectorAll('[data-euiicon-type]'))
      .map((el) => el.getAttribute('data-euiicon-type'))
      .filter((i) => i?.startsWith('token'));
    expect(icons).toEqual(['tokenString', 'tokenVectorDense']);
    expect(screen.getByText('body')).toBeInTheDocument();
    expect(screen.getByText('embeddings')).toBeInTheDocument();
  });

  it('uses the semantic_text icon and shows the field name for a semantic_text field without vectors', () => {
    const { container } = renderField({
      fieldName: 'body',
      fieldType: 'semantic_text',
      fieldValue: '"the original text"',
    });
    expect(iconTypeOf(container)).toBe('tokenSemanticText');
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('uses the mapped icon for a plain field type', () => {
    const { container } = renderField({
      fieldName: 'title',
      fieldType: 'text',
      fieldValue: '"hello"',
    });
    expect(iconTypeOf(container)).toBe('tokenString');
  });
});
