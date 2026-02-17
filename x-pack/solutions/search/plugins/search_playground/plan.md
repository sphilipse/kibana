# Search Relevance Workbench -- PRD

## Problem

Users tuning Elasticsearch search relevance lack a structured workflow within Kibana. Today they manually run queries, eyeball results, and have no systematic way to measure whether changes to queries, analyzers, pipelines, or mappings actually improved relevance. There is no way to track evaluation history or compare runs over time.

## Goals

- Let users define **query suites** (named sets of test queries with expected results/ratings).
- Let users curate **relevance judgments** (document-level ratings per query).
- Run **evaluation runs** against those suites, primarily using the ES `_rank_eval` API, with support for custom client-side metrics.
- **Track history** of evaluation runs so users can see metrics trend over time.
- Support the full improvement loop: users can change **queries, index mappings, analyzers, ingest pipelines**, re-run evaluations, and compare results.

## Non-Goals (v1)

- Automated relevance tuning / auto-optimization.
- A/B testing with live traffic.
- Integration with ML Learning-to-Rank (future phase).

## Architecture

Extends `search_playground` at `x-pack/solutions/search/plugins/search_playground/`.

### Data Model -- New Saved Object Types

Two new saved object types registered alongside the existing `search_playground` SO:

**1. `search_judgment_set`** -- A named collection of query-document judgments.

```typescript
interface JudgmentSet {
  name: string;
  indices: string[];
  judgments: Judgment[];
}

interface Judgment {
  query: string;
  ratings: Array<{
    _index: string;
    _id: string;
    rating: number; // 0-3 (irrelevant, marginal, relevant, highly relevant)
  }>;
}
```

**2. `search_evaluation_run`** -- A snapshot of a single evaluation execution.

```typescript
interface EvaluationRun {
  judgmentSetId: string;
  name?: string;
  timestamp: string;
  // The query template and parameters used
  queryTemplateJSON: string;
  // Metric configuration
  metric: {
    type: 'precision' | 'recall' | 'mean_reciprocal_rank' | 'dcg' | 'ndcg' | 'expected_reciprocal_rank';
    params: Record<string, unknown>; // k, normalize, etc.
  };
  // Snapshot of results
  overallScore: number;
  perQueryScores: Array<{
    query: string;
    score: number;
    unratedDocs: number;
  }>;
  // Optional: snapshot of index settings/mappings for comparison
  indexSettingsSnapshot?: Record<string, unknown>;
}
```

### API Routes

All new routes live under `/internal/search_playground/relevance/` and reuse the existing `DefineRoutesOptions` pattern from `server/routes.ts`.

- `GET /relevance/judgment_sets` -- List judgment sets
- `PUT /relevance/judgment_sets` -- Create judgment set
- `GET /relevance/judgment_sets/{id}` -- Get judgment set
- `PUT /relevance/judgment_sets/{id}` -- Update judgment set
- `DELETE /relevance/judgment_sets/{id}` -- Delete judgment set
- `POST /relevance/evaluate` -- Run evaluation (calls ES `_rank_eval` + optional client-side metrics)
- `GET /relevance/runs` -- List evaluation runs (with pagination, filtering by judgment set)
- `GET /relevance/runs/{id}` -- Get single run detail
- `DELETE /relevance/runs/{id}` -- Delete run
- `POST /relevance/runs/compare` -- Compare two runs side-by-side

The **evaluate** route is the core:
1. Accepts: judgment set ID, query template JSON, metric config, indices.
2. Transforms judgments + query template into an ES `_rank_eval` request body.
3. Calls `client.asCurrentUser.rankEval(...)`.
4. Optionally computes additional client-side metrics.
5. Persists the result as a `search_evaluation_run` saved object.
6. Returns the result.

### UI Routes / Pages

New routes added to `public/routes.ts` and `PlaygroundRouter`:

- `/relevance` -- Relevance workbench landing (list judgment sets + recent runs).
- `/relevance/judgments/new` -- Create/edit judgment set.
- `/relevance/judgments/:id` -- View/edit a judgment set; rate documents inline.
- `/relevance/evaluate/:judgmentSetId` -- Configure and run an evaluation.
- `/relevance/runs` -- Evaluation run history with metric trend chart.
- `/relevance/runs/:runId` -- Run detail: per-query breakdown, unrated docs, comparison.

### UI Components (key new ones)

- **JudgmentEditor** -- Table of queries; expand a query to see candidate docs; inline star-rating or numeric-rating per doc. Users can search the index for additional docs to judge.
- **EvaluationConfigPanel** -- Pick metric, set k, pick query template (code editor reusing `@kbn/code-editor`), pick indices.
- **RunHistoryChart** -- EUI line/area chart showing metric score over time per judgment set.
- **RunComparisonView** -- Side-by-side per-query score diff between two runs, highlighting regressions and improvements.
- **IndexConfigPanel** -- View/edit index settings, mappings, analyzers, and ingest pipelines directly from the workbench. Uses existing ES APIs (`_settings`, `_mapping`, `_ingest/pipeline`). Changes here trigger a prompt to re-run evaluation.

### Integration with Existing Playground

- The relevance workbench is a new "mode" alongside the existing Chat and Search modes, accessed via the top-level navigation tabs.
- Shares the existing index-selection and query-editing infrastructure (`parseElasticsearchQuery`, source field utilities).
- Reuses `@kbn/code-editor` for query template editing.
- Reuses the existing `features` registration; extends the SO privilege list to include the new SO types.

## TDD Anchors

Each phase is gated by tests written first.

### Phase 1: Data Model + Server Routes

Tests written first in:
- `server/relevance/judgment_set_saved_object.test.ts` -- SO schema validation.
- `server/relevance/routes/judgment_sets.test.ts` -- CRUD route handlers with mocked SO client.
- `server/relevance/routes/evaluate.test.ts` -- Core evaluation route: verifies `_rank_eval` request body construction from judgments + template, result parsing, and SO persistence.
- `server/relevance/routes/runs.test.ts` -- Run listing, detail, deletion, comparison.

### Phase 2: Evaluation Engine

Tests written first in:
- `server/relevance/lib/build_rank_eval_request.test.ts` -- Unit tests for transforming a JudgmentSet + query template + metric config into a valid ES `_rank_eval` request body.
- `server/relevance/lib/compute_client_metrics.test.ts` -- Client-side metric computation (for metrics not supported by `_rank_eval`).
- `server/relevance/lib/compare_runs.test.ts` -- Diffing two EvaluationRun objects into a comparison result.

### Phase 3: UI -- Judgment Management

Tests written first in:
- `public/components/relevance/judgment_editor.test.tsx` -- Renders query list, rating interactions, adding docs.
- `public/hooks/use_judgment_sets.test.ts` -- React Query hooks for CRUD.

### Phase 4: UI -- Evaluation + History

Tests written first in:
- `public/components/relevance/evaluation_config_panel.test.tsx` -- Metric selection, parameter validation.
- `public/components/relevance/run_history_chart.test.tsx` -- Chart renders with mock data, handles empty state.
- `public/components/relevance/run_comparison_view.test.tsx` -- Side-by-side display, regression highlighting.
- `public/hooks/use_evaluation.test.ts` -- Hook for triggering evaluation and polling results.

### Phase 5: Index Config + Full Loop

Tests written first in:
- `public/components/relevance/index_config_panel.test.tsx` -- Displays settings/mappings, edit interactions.
- Integration test (FTR or Scout): end-to-end flow of creating judgments, running evaluation, changing a mapping, re-running, and comparing.

## Key Files to Modify

- `common/index.ts` -- Add new SO type constants, feature flag.
- `common/types.ts` -- Add `APIRoutes` entries, new type interfaces.
- `server/plugin.ts` -- Register new SO types, extend feature privileges.
- `server/routes.ts` -- Call `defineRelevanceRoutes(routeOptions)`.
- `public/routes.ts` -- Add `/relevance/*` route constants.
- `public/playground_router.tsx` -- Add `<Route>` entries for relevance pages.
- `kibana.jsonc` -- No new plugin deps expected (reuses existing ES client + SO client).

## New Files (organized under `relevance/` subdirectories)

```
server/relevance/
  judgment_set_saved_object/
    judgment_set_saved_object.ts
    schema/v1/v1.ts
  evaluation_run_saved_object/
    evaluation_run_saved_object.ts
    schema/v1/v1.ts
  lib/
    build_rank_eval_request.ts
    build_rank_eval_request.test.ts
    compute_client_metrics.ts
    compute_client_metrics.test.ts
    compare_runs.ts
    compare_runs.test.ts
  routes/
    judgment_sets.ts
    judgment_sets.test.ts
    evaluate.ts
    evaluate.test.ts
    runs.ts
    runs.test.ts

public/components/relevance/
  judgment_editor.tsx
  judgment_editor.test.tsx
  evaluation_config_panel.tsx
  evaluation_config_panel.test.tsx
  run_history_chart.tsx
  run_history_chart.test.tsx
  run_comparison_view.tsx
  run_comparison_view.test.tsx
  index_config_panel.tsx
  index_config_panel.test.tsx
  relevance_landing.tsx

public/hooks/
  use_judgment_sets.ts
  use_judgment_sets.test.ts
  use_evaluation.ts
  use_evaluation.test.ts
  use_evaluation_runs.ts
  use_evaluation_runs.test.ts
```
