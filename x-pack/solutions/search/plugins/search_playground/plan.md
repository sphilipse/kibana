# Search Relevance Workbench -- PRD

## Implementation Progress

### Phase 1: Data Model + Server Routes -- COMPLETE

All server-side data model and route work is done. 39 tests passing, 0 regressions.

**Common types (modified):**
- `common/index.ts` -- Added `JUDGMENT_SET_SAVED_OBJECT_TYPE`, `EVALUATION_RUN_SAVED_OBJECT_TYPE`
- `common/types.ts` -- Added 10 new API routes, 15+ type interfaces (JudgmentRating uses `index`/`id`, mapped to `_index`/`_id` at the ES API boundary)
- `common/query_keys.ts` -- Added query/mutation keys for judgment sets, evaluation runs

**Saved object schemas (new, 17 tests):**
- `server/relevance/judgment_set_saved_object/schema/v1/v1.ts` + test
- `server/relevance/evaluation_run_saved_object/schema/v1/v1.ts` + test

**SO registrations (new):**
- `server/relevance/judgment_set_saved_object/judgment_set_saved_object.ts`
- `server/relevance/evaluation_run_saved_object/evaluation_run_saved_object.ts`
- Both registered in `server/plugin.ts` with feature privileges extended

**Server routes (new, 22 tests):**
- `server/relevance/routes/judgment_sets.ts` -- Full CRUD (list, get, create, update, delete)
- `server/relevance/routes/evaluate.ts` -- Fetches judgment set, builds `_rank_eval` request via `buildRankEvalRequest`, calls ES, persists run
- `server/relevance/routes/runs.ts` -- List (with filter by judgment set), get, delete, compare

**Utilities (new):**
- `server/relevance/lib/build_rank_eval_request.ts` -- Transforms judgment set + query template + metric config into ES `RankEvalRequest` (uses official `@elastic/elasticsearch` types)
- `server/relevance/utils/judgment_sets.ts` -- SO parsing helpers
- `server/relevance/utils/evaluation_runs.ts` -- SO parsing + run comparison logic

**Wiring:**
- `server/routes.ts` -- Calls `defineJudgmentSetRoutes`, `defineEvaluateRoute`, `defineEvaluationRunRoutes`

### Phase 2: Evaluation Engine -- COMPLETE

All evaluation engine logic is tested and wired. 83 tests passing, 0 regressions.

**Unit-tested library modules (new, 43 tests):**
- `server/relevance/lib/build_rank_eval_request.test.ts` -- 13 tests covering query mapping, rating boundary conversion (`index`/`id` → `_index`/`_id`), all metric types, edge cases (empty judgments, empty ratings, multi-index, complex templates)
- `server/relevance/lib/compare_runs.test.ts` -- 9 tests covering score deltas, per-query diffs, queries only in baseline (regressed to zero), queries only in comparison (new), zero-score edge case, empty runs
- `server/relevance/lib/compute_client_metrics.test.ts` -- 21 tests covering median, standard deviation, min/max, query pass rate (default + custom threshold), unrated doc metrics, empty input edge cases

**New modules:**
- `server/relevance/lib/compare_runs.ts` -- Extracted from `utils/evaluation_runs.ts` for cleaner separation; `utils/evaluation_runs.ts` re-exports for backward compatibility
- `server/relevance/lib/compute_client_metrics.ts` -- Computes client-side aggregate metrics (median, std dev, min/max, pass rate, unrated doc coverage) from per-query scores

**New type:**
- `common/types.ts` -- Added `ClientMetrics` interface, added optional `clientMetrics` field to `EvaluationRunSavedObject`

**Schema update:**
- `server/relevance/evaluation_run_saved_object/schema/v1/v1.ts` -- Added `clientMetricsSchema` and optional `clientMetrics` field

**Wiring:**
- `server/relevance/routes/evaluate.ts` -- Now calls `computeClientMetrics` after `_rank_eval` and persists `clientMetrics` alongside the run

**Post-review fixes:**
- `server/relevance/routes/evaluate.ts` -- Added optional `passThreshold` (0–1) to the evaluate request body schema; threaded through to `computeClientMetrics` so callers can override the default 0.5
- `server/relevance/routes/evaluate.test.ts` -- Updated mock `create` return to include `clientMetrics` in attributes; added assertion that `clientMetrics` is persisted in the saved object with expected values

### Phase 3: UI -- Judgment Management -- COMPLETE

All judgment management UI is implemented and tested. 26 new tests, 363 total tests passing, 0 regressions.

**Route constants (modified):**
- `public/routes.ts` -- Added `RELEVANCE_PATH`, `RELEVANCE_JUDGMENTS_NEW_PATH`, `RELEVANCE_JUDGMENTS_DETAIL_PATH`, `RELEVANCE_EVALUATE_PATH`, `RELEVANCE_RUNS_PATH`, `RELEVANCE_RUNS_DETAIL_PATH`

**React Query hooks (new, 9 tests):**
- `public/hooks/use_judgment_sets.ts` -- `useJudgmentSetsList` (list with pagination/sort), `useJudgmentSet` (get by id), `useCreateJudgmentSet`, `useUpdateJudgmentSet`, `useDeleteJudgmentSet` (all with cache invalidation via `useQueryClient`)
- `public/hooks/use_judgment_sets.test.ts` -- 9 tests: list fetch + default params + error handling, single fetch + disabled when empty id, create + cache invalidation, update + dual cache invalidation, delete + cache invalidation + error handling

**Components (new, 17 tests):**
- `public/components/relevance/judgment_editor.tsx` -- Core editing component: query table with expand-to-rate, inline rating via EuiButtonGroup (0-3 scale), add/remove queries, add/remove document ratings with duplicate prevention
- `public/components/relevance/judgment_editor.test.tsx` -- 17 tests covering empty state, adding queries (button + Enter key), whitespace rejection, query table rendering, badge counts, delete queries, expanding ratings panel, document management, duplicate prevention, disabled states
- `public/components/relevance/relevance_landing.tsx` -- Landing page: list judgment sets with table (name, query count, updated), pagination/sort, empty state, loading state, error state, "Create Judgment Set" CTA
- `public/components/relevance/judgment_set_form.tsx` -- `JudgmentSetCreatePage` (new set: name + indices + JudgmentEditor) and `JudgmentSetDetailPage` (edit existing: loads via `useJudgmentSet`, pre-populates form, update on save)

**Wiring:**
- `public/playground_router.tsx` -- Added `<Route>` entries for `/relevance`, `/relevance/judgments/new`, `/relevance/judgments/:id`

### Phase 4: UI -- Evaluation + History -- NOT STARTED
### Phase 5: Index Config + Full Loop -- NOT STARTED

---

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
    index: string;
    id: string;
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
