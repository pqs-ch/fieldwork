# Pattern: file imports

Shared implementation: [file selection](../elements/attachments.md#single-file-import) · [step indicators](../elements/step-indicators.md) · [data tables](../elements/data-table.md) · [long-running actions](long-running-actions.md).

## Supported scope

A coordinated upload → column mapping → validation/check → import outcome workflow. The application owns supported formats, parsing, validation, permissions, duplicate rules, persistence, execution and source retention. This pattern adds no parser, import engine or background-job dependency to the library.

Use [supporting evidence](supporting-evidence.md) when files themselves support a record; use this pattern when file contents become application records. A selected file is not an upload acknowledgement, and an accepted upload is not a completed import.

For frequent operators, lead with the current file, mapping or row results. A clear task heading and contextual actions usually provide enough orientation; a large step indicator and repeated walkthrough text are optional. Keep constraints and recovery guidance where they affect the work.

## Upload and mapping

Use a visible single-file [drop zone with a native chooser](../elements/attachments.md#single-file-import). State supported encoding/format, headers, size and row limits before selection. Keep a sample or template beside the intake when it makes the expected shape clearer. Validate content on the server; `accept` guides selection only.

On upload rejection, explain how to correct the source. In-place failures can keep the live File selection; server replacement must request reselection honestly. Do not represent a filename as retained file contents. After acknowledgement, use a server-owned source reference so mapping and review do not require another upload. Define retention/expiry and a recovery destination.

Map source columns to named application fields using labeled native selects. Include a source preview and required target formats. Suggestions need explicit confirmation; use unambiguous source column identities rather than assuming header text is unique. Detect missing or incompatible assignments and preserve attempted mappings on failure. State what happens to unmapped columns.

Changes to source or mapping invalidate previous validation and check pages. Revisit a retained source to correct its mapping; use a new accepted source to correct file contents. Keep completed operations bound to the exact original source/mapping rather than editing their scope in place.

## Validation and confirmation

Validate the complete captured source, then show counts that reconcile to its total. Identify each source row, application fields, state and actionable issue. State how row references account for headers, blank lines and quoted multiline values. Escape source values as untrusted text.

Use [error summaries](../elements/error-summaries.md) to reach affected rows; use a labeled, keyboard-scrollable table region when genuine tabular comparison needs width. Do not clip offscreen fields or render a check result as success. Bound previews/error lists and state clearly when rows are omitted.

| State | Useful information and next action |
| --- | --- |
| Ready | Values that will become records after confirmation. |
| Needs correction | Exact row/field problem; change the mapping or correct the source and upload again. |
| Skipped | Concrete duplicate/inapplicable reason and whether an existing record changes. |
| Excluded | Invalid rows deliberately omitted by the selected partial-acceptance policy. |

Keep duplicate handling explicit: within-source duplicates and existing application records can need different decisions. Do not silently merge, overwrite or select an arbitrary occurrence. The application decides whether partial acceptance is allowed. If supported, require an explicit choice beside its consequences; a strict option should remain strict through execution failures, not just validation.

The final action must describe the captured scope and resulting writes. Recheck source/mapping revision, authorization, validation and relevant current application state before executing. If any reviewed facts changed materially, import nothing and ask for a fresh check. Do not trust client-supplied row counts or row subsets as authorization.

## Outcome and recovery

Keep a stable operation reference and [persistent outcome](long-running-actions.md#state-and-recovery), even for a bounded synchronous import. Show requesting/queued/running states only when the application actually supports them; use progress only with a known denominator.

Reconcile every captured row to confirmed imported, skipped, excluded or unsuccessful outcomes. Distinguish source validation errors from temporary execution failures. Preserve successful results. Retry only the operation's server-confirmed retryable subset; retries and repeated confirmation must not duplicate previously imported records. For atomic imports, roll back the eligible batch on failure and make the retry scope clear.

Unknown acceptance needs Check status before retrying. Leaving a status page does not cancel server work. Return visits show authoritative results and recoverable actions. Corrected files start a new operation with application-owned duplicate checks; they must not rewrite the historical result. Keep expiry and authorization boundaries consistent for source, review, retry and results.

Without JavaScript, preserve native upload, mapping, validation, confirmation, result and retry routes. Optional enhancement may retain a live selection on failure, add drop handling or update status; it must not weaken server rules. Follow [Rails lifecycles](../rails.md#other-component-lifecycles) and [draft protection](../rails.md#draft-protection) for unsaved local selection/mapping changes.

## Maintained example

The [supplier CSV import example](../../examples/README.md#supplier-csv-imports) demonstrates bounded UTF-8 parsing, explicit source-column mapping, row correction links, duplicate skips, all-or-nothing and valid-only policies, stale review rejection and retry without duplicate suppliers. Its process-local source/result storage and synchronous execution are demonstration choices, not production infrastructure requirements.
