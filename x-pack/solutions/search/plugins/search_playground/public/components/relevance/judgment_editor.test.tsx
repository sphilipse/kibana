/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { __IntlProvider as IntlProvider } from '@kbn/i18n-react';
import { EuiThemeProvider } from '@elastic/eui';

import type { JudgmentRating } from '../../types';
import { JudgmentEditor } from './judgment_editor';

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <IntlProvider locale="en">
      <EuiThemeProvider>{ui}</EuiThemeProvider>
    </IntlProvider>
  );

describe('JudgmentEditor', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('empty state', () => {
    it('renders empty state when no judgments are provided', () => {
      renderWithProviders(
        <JudgmentEditor judgments={[]} onJudgmentsChange={mockOnChange} />
      );

      expect(screen.getByTestId('judgmentEditorEmptyState')).toBeInTheDocument();
      expect(screen.getByTestId('judgmentEditorNewDocIndex')).toBeInTheDocument();
      expect(screen.getByTestId('judgmentEditorNewDocId')).toBeInTheDocument();
      expect(screen.getByTestId('judgmentEditorAddDocButton')).toBeInTheDocument();
    });

    it('disables add button when fields are empty', () => {
      renderWithProviders(
        <JudgmentEditor judgments={[]} onJudgmentsChange={mockOnChange} />
      );

      expect(screen.getByTestId('judgmentEditorAddDocButton')).toBeDisabled();
    });
  });

  describe('adding documents', () => {
    it('adds a new document when clicking the add button', () => {
      renderWithProviders(
        <JudgmentEditor judgments={[]} onJudgmentsChange={mockOnChange} />
      );

      fireEvent.change(screen.getByTestId('judgmentEditorNewDocIndex'), {
        target: { value: 'my-index' },
      });
      fireEvent.change(screen.getByTestId('judgmentEditorNewDocId'), {
        target: { value: 'doc-1' },
      });
      fireEvent.click(screen.getByTestId('judgmentEditorAddDocButton'));

      expect(mockOnChange).toHaveBeenCalledWith([
        { index: 'my-index', id: 'doc-1', rating: 0 },
      ]);
    });

    it('adds a new document when pressing Enter in the doc ID field', () => {
      renderWithProviders(
        <JudgmentEditor judgments={[]} onJudgmentsChange={mockOnChange} />
      );

      fireEvent.change(screen.getByTestId('judgmentEditorNewDocIndex'), {
        target: { value: 'my-index' },
      });
      const docIdInput = screen.getByTestId('judgmentEditorNewDocId');
      fireEvent.change(docIdInput, { target: { value: 'doc-1' } });
      fireEvent.keyDown(docIdInput, { key: 'Enter' });

      expect(mockOnChange).toHaveBeenCalledWith([
        { index: 'my-index', id: 'doc-1', rating: 0 },
      ]);
    });

    it('does not add empty documents', () => {
      renderWithProviders(
        <JudgmentEditor judgments={[]} onJudgmentsChange={mockOnChange} />
      );

      fireEvent.change(screen.getByTestId('judgmentEditorNewDocIndex'), {
        target: { value: '   ' },
      });
      fireEvent.change(screen.getByTestId('judgmentEditorNewDocId'), {
        target: { value: '   ' },
      });
      fireEvent.click(screen.getByTestId('judgmentEditorAddDocButton'));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not add duplicate documents', () => {
      const existing: JudgmentRating[] = [
        { index: 'my-index', id: 'doc-1', rating: 2 },
      ];

      renderWithProviders(
        <JudgmentEditor judgments={existing} onJudgmentsChange={mockOnChange} />
      );

      fireEvent.change(screen.getByTestId('judgmentEditorNewDocIndex'), {
        target: { value: 'my-index' },
      });
      fireEvent.change(screen.getByTestId('judgmentEditorNewDocId'), {
        target: { value: 'doc-1' },
      });
      fireEvent.click(screen.getByTestId('judgmentEditorAddDocButton'));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('clears the inputs after adding a document', () => {
      renderWithProviders(
        <JudgmentEditor judgments={[]} onJudgmentsChange={mockOnChange} />
      );

      const indexInput = screen.getByTestId('judgmentEditorNewDocIndex') as HTMLInputElement;
      const docIdInput = screen.getByTestId('judgmentEditorNewDocId') as HTMLInputElement;
      fireEvent.change(indexInput, { target: { value: 'my-index' } });
      fireEvent.change(docIdInput, { target: { value: 'doc-1' } });
      fireEvent.click(screen.getByTestId('judgmentEditorAddDocButton'));

      expect(indexInput.value).toBe('');
      expect(docIdInput.value).toBe('');
    });
  });

  describe('ratings table', () => {
    const existingJudgments: JudgmentRating[] = [
      { index: 'my-index', id: 'doc-1', rating: 3 },
      { index: 'my-index', id: 'doc-2', rating: 1 },
      { index: 'other-index', id: 'doc-3', rating: 2 },
    ];

    it('renders the ratings table with all documents', () => {
      renderWithProviders(
        <JudgmentEditor judgments={existingJudgments} onJudgmentsChange={mockOnChange} />
      );

      expect(screen.getByTestId('judgmentEditorRatingsTable')).toBeInTheDocument();
      expect(screen.getByText('doc-1')).toBeInTheDocument();
      expect(screen.getByText('doc-2')).toBeInTheDocument();
      expect(screen.getByText('doc-3')).toBeInTheDocument();
    });

    it('removes a document when clicking remove', () => {
      renderWithProviders(
        <JudgmentEditor judgments={existingJudgments} onJudgmentsChange={mockOnChange} />
      );

      const removeButtons = screen.getAllByTestId('judgmentEditorRemoveDocButton');
      fireEvent.click(removeButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith([existingJudgments[1], existingJudgments[2]]);
    });

    it('appends new document to existing list', () => {
      renderWithProviders(
        <JudgmentEditor judgments={existingJudgments} onJudgmentsChange={mockOnChange} />
      );

      fireEvent.change(screen.getByTestId('judgmentEditorNewDocIndex'), {
        target: { value: 'new-index' },
      });
      fireEvent.change(screen.getByTestId('judgmentEditorNewDocId'), {
        target: { value: 'new-doc' },
      });
      fireEvent.click(screen.getByTestId('judgmentEditorAddDocButton'));

      expect(mockOnChange).toHaveBeenCalledWith([
        ...existingJudgments,
        { index: 'new-index', id: 'new-doc', rating: 0 },
      ]);
    });
  });
});
