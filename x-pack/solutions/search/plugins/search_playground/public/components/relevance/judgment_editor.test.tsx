/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import { __IntlProvider as IntlProvider } from '@kbn/i18n-react';
import { EuiThemeProvider } from '@elastic/eui';

import type { Judgment } from '../../types';
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
      expect(screen.getByTestId('judgmentEditorNewQueryInput')).toBeInTheDocument();
      expect(screen.getByTestId('judgmentEditorAddQueryButton')).toBeInTheDocument();
    });

    it('disables add button when query input is empty', () => {
      renderWithProviders(
        <JudgmentEditor judgments={[]} onJudgmentsChange={mockOnChange} />
      );

      expect(screen.getByTestId('judgmentEditorAddQueryButton')).toBeDisabled();
    });
  });

  describe('adding queries', () => {
    it('adds a new query when clicking the add button', () => {
      renderWithProviders(
        <JudgmentEditor judgments={[]} onJudgmentsChange={mockOnChange} />
      );

      const input = screen.getByTestId('judgmentEditorNewQueryInput');
      fireEvent.change(input, { target: { value: 'test query' } });
      fireEvent.click(screen.getByTestId('judgmentEditorAddQueryButton'));

      expect(mockOnChange).toHaveBeenCalledWith([
        { query: 'test query', ratings: [] },
      ]);
    });

    it('adds a new query when pressing Enter', () => {
      renderWithProviders(
        <JudgmentEditor judgments={[]} onJudgmentsChange={mockOnChange} />
      );

      const input = screen.getByTestId('judgmentEditorNewQueryInput');
      fireEvent.change(input, { target: { value: 'enter query' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnChange).toHaveBeenCalledWith([
        { query: 'enter query', ratings: [] },
      ]);
    });

    it('does not add empty or whitespace-only queries', () => {
      renderWithProviders(
        <JudgmentEditor judgments={[]} onJudgmentsChange={mockOnChange} />
      );

      const input = screen.getByTestId('judgmentEditorNewQueryInput');
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(screen.getByTestId('judgmentEditorAddQueryButton'));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('clears the input after adding a query', () => {
      renderWithProviders(
        <JudgmentEditor judgments={[]} onJudgmentsChange={mockOnChange} />
      );

      const input = screen.getByTestId('judgmentEditorNewQueryInput') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'test query' } });
      fireEvent.click(screen.getByTestId('judgmentEditorAddQueryButton'));

      expect(input.value).toBe('');
    });
  });

  describe('query list', () => {
    const existingJudgments: Judgment[] = [
      {
        query: 'first query',
        ratings: [
          { index: 'my-index', id: 'doc-1', rating: 3 },
          { index: 'my-index', id: 'doc-2', rating: 1 },
        ],
      },
      {
        query: 'second query',
        ratings: [{ index: 'other-index', id: 'doc-3', rating: 2 }],
      },
    ];

    it('renders the query table with all queries', () => {
      renderWithProviders(
        <JudgmentEditor judgments={existingJudgments} onJudgmentsChange={mockOnChange} />
      );

      expect(screen.getByTestId('judgmentEditorQueryTable')).toBeInTheDocument();
      expect(screen.getByText('first query')).toBeInTheDocument();
      expect(screen.getByText('second query')).toBeInTheDocument();
    });

    it('shows rated documents count as badges', () => {
      renderWithProviders(
        <JudgmentEditor judgments={existingJudgments} onJudgmentsChange={mockOnChange} />
      );

      const badges = screen.getAllByText(/^[0-9]+$/);
      const badgeValues = badges.map((b) => b.textContent);
      expect(badgeValues).toContain('2');
      expect(badgeValues).toContain('1');
    });

    it('deletes a query when clicking the delete action', () => {
      renderWithProviders(
        <JudgmentEditor judgments={existingJudgments} onJudgmentsChange={mockOnChange} />
      );

      const deleteButtons = screen.getAllByTestId('judgmentEditorDeleteQueryButton');
      fireEvent.click(deleteButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith([existingJudgments[1]]);
    });

    it('appends new query to existing list', () => {
      renderWithProviders(
        <JudgmentEditor judgments={existingJudgments} onJudgmentsChange={mockOnChange} />
      );

      const input = screen.getByTestId('judgmentEditorNewQueryInput');
      fireEvent.change(input, { target: { value: 'third query' } });
      fireEvent.click(screen.getByTestId('judgmentEditorAddQueryButton'));

      expect(mockOnChange).toHaveBeenCalledWith([
        ...existingJudgments,
        { query: 'third query', ratings: [] },
      ]);
    });
  });

  describe('ratings panel', () => {
    const judgmentsWithRatings: Judgment[] = [
      {
        query: 'expandable query',
        ratings: [
          { index: 'my-index', id: 'doc-1', rating: 2 },
          { index: 'my-index', id: 'doc-2', rating: 0 },
        ],
      },
    ];

    it('shows ratings panel when expanding a query', () => {
      renderWithProviders(
        <JudgmentEditor judgments={judgmentsWithRatings} onJudgmentsChange={mockOnChange} />
      );

      expect(screen.queryByTestId('judgmentEditorRatingsPanel')).not.toBeInTheDocument();

      const expandButton = screen.getByTestId('judgmentEditorExpandButton');
      fireEvent.click(expandButton);

      expect(screen.getByTestId('judgmentEditorRatingsPanel')).toBeInTheDocument();
      expect(screen.getByTestId('judgmentEditorRatingsTable')).toBeInTheDocument();
    });

    it('displays document index and id in ratings table', () => {
      renderWithProviders(
        <JudgmentEditor judgments={judgmentsWithRatings} onJudgmentsChange={mockOnChange} />
      );

      fireEvent.click(screen.getByTestId('judgmentEditorExpandButton'));

      const ratingsPanel = screen.getByTestId('judgmentEditorRatingsPanel');
      expect(within(ratingsPanel).getByText('doc-1')).toBeInTheDocument();
      expect(within(ratingsPanel).getByText('doc-2')).toBeInTheDocument();
    });

    it('shows empty ratings message when query has no ratings', () => {
      const emptyJudgment: Judgment[] = [{ query: 'empty query', ratings: [] }];

      renderWithProviders(
        <JudgmentEditor judgments={emptyJudgment} onJudgmentsChange={mockOnChange} />
      );

      fireEvent.click(screen.getByTestId('judgmentEditorExpandButton'));

      expect(screen.getByTestId('judgmentEditorNoRatings')).toBeInTheDocument();
    });

    it('adds a document to the expanded query', () => {
      const singleJudgment: Judgment[] = [{ query: 'test query', ratings: [] }];

      renderWithProviders(
        <JudgmentEditor judgments={singleJudgment} onJudgmentsChange={mockOnChange} />
      );

      fireEvent.click(screen.getByTestId('judgmentEditorExpandButton'));

      fireEvent.change(screen.getByTestId('judgmentEditorNewDocIndex'), {
        target: { value: 'my-index' },
      });
      fireEvent.change(screen.getByTestId('judgmentEditorNewDocId'), {
        target: { value: 'new-doc' },
      });
      fireEvent.click(screen.getByTestId('judgmentEditorAddDocButton'));

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          query: 'test query',
          ratings: [{ index: 'my-index', id: 'new-doc', rating: 0 }],
        },
      ]);
    });

    it('does not add duplicate documents', () => {
      renderWithProviders(
        <JudgmentEditor judgments={judgmentsWithRatings} onJudgmentsChange={mockOnChange} />
      );

      fireEvent.click(screen.getByTestId('judgmentEditorExpandButton'));

      fireEvent.change(screen.getByTestId('judgmentEditorNewDocIndex'), {
        target: { value: 'my-index' },
      });
      fireEvent.change(screen.getByTestId('judgmentEditorNewDocId'), {
        target: { value: 'doc-1' },
      });
      fireEvent.click(screen.getByTestId('judgmentEditorAddDocButton'));

      expect(mockOnChange).toHaveBeenCalledWith(judgmentsWithRatings);
    });

    it('removes a document rating when clicking remove', () => {
      renderWithProviders(
        <JudgmentEditor judgments={judgmentsWithRatings} onJudgmentsChange={mockOnChange} />
      );

      fireEvent.click(screen.getByTestId('judgmentEditorExpandButton'));

      const removeButtons = screen.getAllByTestId('judgmentEditorRemoveDocButton');
      fireEvent.click(removeButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          query: 'expandable query',
          ratings: [{ index: 'my-index', id: 'doc-2', rating: 0 }],
        },
      ]);
    });

    it('disables add document button when fields are empty', () => {
      const singleJudgment: Judgment[] = [{ query: 'test', ratings: [] }];

      renderWithProviders(
        <JudgmentEditor judgments={singleJudgment} onJudgmentsChange={mockOnChange} />
      );

      fireEvent.click(screen.getByTestId('judgmentEditorExpandButton'));

      expect(screen.getByTestId('judgmentEditorAddDocButton')).toBeDisabled();
    });
  });
});
