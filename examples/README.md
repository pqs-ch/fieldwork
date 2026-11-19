# Examples review app

One Rails app hosts all 11 maintained Fieldwork workflows using `../library` as a local gem. Open the catalogue and use a screen’s URL when giving development feedback. The **Review guide** for each example owns its walkthrough, concrete review cases and expected results. This README owns setup, verification and implementation limits; reusable behavior belongs to the linked library contracts.

## Run

Use the repository’s [Ruby/Bundler environment](../DEVELOPMENT.md#verification). From the repository root:

```sh
cd examples
bin/setup
```

Open <http://127.0.0.1:8100>. `bin/setup --skip-server` checks dependencies without starting Rails; `bin/dev` starts it again. Use `PORT=8101 bin/dev` for another port. No database setup is needed. The bundle includes the import example’s existing `csv` dependency; document comparisons require the host’s `diff` command.

Use **All examples** to return to the catalogue. **Reset example…** opens a confirmation before restoring starting data. Project records, service requests and document revisions are shared across browsers on this server; their reset pages explain that scope. Other workspace data resets only in the current browser session. Resetting draft protection also clears its browser reminder when JavaScript and browser storage are available.

## Structure and limits

Each workflow has namespaced controllers, models, services and views under `app/`, a workflow route prefix and its own JavaScript entry point. Navigation through the catalogue uses full page loads to keep lifecycle policies separate. Navigation inside an example retains its existing Turbo behavior. The catalogue, guides and resets use native links and forms.

All server data is synthetic and process-local. Run one Rails process; restarting or reloading application code restores server data. Random signed-session workspace keys separate sample workspaces but do not implement business authorization. The fixed local secret and in-memory stores are for local review. Applications own production storage, permissions, transport, validation and retention; examples do not add these policies to Fieldwork.

## Verification

Run commands from the repository root, following [Development verification](../DEVELOPMENT.md#verification). Review complete desktop workflows, keyboard efficiency, recovery, Turbo return and native use according to the [product priorities](../library/index.md#product-priorities). The in-app guides supply manual cases; focused checks own executable regression coverage. Browser-native close/reload warnings still require manual review.

| Coverage | Command |
| --- | --- |
| Catalogue, all guide/entry pages, confirmed resets, scenario isolation and native review navigation | `python3 tests/check-examples.py` |
| Table filtering, sorting, numeric/date transport and restoration | `python3 tests/check-tables.py` |
| Saved views, personal defaults, sharing and task return | `python3 tests/check-work-views.py` |
| Record activity progression, replay, stale/expired attempts, retained drafts and native forms | `python3 tests/check-record-activities.py` |
| Mixed-form coordination, dynamic rows, files and searchable selection | `python3 tests/check-forms.py` |
| Business values, reviewed totals and supplier Frame/Stream lifecycle | `python3 tests/check-purchase-request.py` |
| CSV mapping, strict/partial acceptance, retry and replay | `python3 tests/check-file-import.py` |
| Partial drafts, conditional steps, stale review and creation retry | `python3 tests/check-multi-step-creation.py` |
| Protected exits, pending saves, file retention and browser reminder | `python3 tests/check-draft-protection.py` |
| Review capture, assessments, evidence and historical comparisons | `python3 tests/check-population-reviews.py` |
| Clock changes, occurrence binding, elapsed targets and viewer zones | `python3 tests/check-event-times.py` |
| Document preview, revision pairs, conflict recovery and native comparison | `python3 tests/check-documents.py` |

The focused checks boot this same app on ephemeral ports and include their native failure/recovery boundaries. Application layout has a manual journey in its in-app guide. Run `python3 tests/check-links.py` after reference or example changes, and `python3 tests/check-installation.py` after installation or asset-integration changes. No screenshot baselines are maintained. Follow the [workflow review guidance](../DEVELOPMENT.md#workflow-review) after library interaction changes.

## Application layout

[Review guide](http://127.0.0.1:8100/review/application-layout) · [Owning pattern](../library/patterns/application-layout.md)

Read-only summaries demonstrate top navigation and a global top bar with a local workspace rail. The example sets `--width-workspace: none` to review wide working views. It owns destination data, current-state logic and route focus; shell styling and native markup come from the library.

Main navigation pairs visible labels with bundled icons. Desktop and compact copies use the same destination meanings and selected state; the workplace rail uses the same icon treatment for its work queue, visits and equipment.

Summary tables mark each row's identifying project, request, visit description or asset as a scoped row header. These use the library's row-heading color while retaining ordinary body-cell spacing, wrapping and borders.

## Record activities

[Review guide](http://127.0.0.1:8100/review/record-activities) · [Owning pattern](../library/patterns/record-activities.md)

A service request advances through assessment, order and installation. The application owns prerequisites, saved facts, history and attempt tokens; successful POST replay returns the existing result. Progress notes add history without advancing the request. Alex Morgan is the fixed synthetic actor. Server-rendered timestamps include a UTC fallback.

Recorded findings keep their paragraphs beside short facts. History links to immutable activity details instead of repeating those findings. A stale or expired form retains its answers with submission disabled; the current request opens separately for recovery. The completed starting request makes all recorded stages available for direct review.

## Population reviews

[Review guide](http://127.0.0.1:8100/review/population-review) · [Review pattern](../library/patterns/population-reviews.md) · [Evidence pattern](../library/patterns/supporting-evidence.md) · [Record comparison](../library/elements/record-comparison.md)

Scope, assessments, evidence bytes, findings and comparisons are isolated by browser workspace. Evidence is optional; linking it does not establish sufficiency. Completion records finished checking while findings remain open, with no treatment-execution workflow. The satellite-office example requires an explanation of independent checking for its empty population.

The overview keeps compact readiness counts with the account list. Review guidance and activity appear below the working content. Assessment places the current account facts, supporting evidence, outcome and basis in one task surface. Saved results put the latest assessment first, with earlier assessments and captured facts in labeled sections below. A stale assessment, finding or conclusion retains attempted text and disables the obsolete submission, with recovery opening separately; temporary service failures permit retry with the same attempt.

Evidence intake accepts up to five nonempty TXT, CSV or PDF files, at most 2 MB each, with source, date and a batch explanation. Originals are shared within the workspace and served as downloads. Removing a link preserves the original and other uses. Withdrawal suppresses downloads while retaining bytes internally; it is not erasure. Recorded assessments retain their evidence references and metadata. Changes to facts, links or availability require reassessment in unfinished reviews; completed results stay recorded. Comparison covers named fields and evidence against an explicit assessment number, without modifying readiness or recorded outcomes.

## Operations and tables

[Review guide](http://127.0.0.1:8100/review/operations) · [Table pattern](../library/patterns/tables.md)

Project collections, details and editors use shared process-local records. Numeric/date queries are server-validated; relative-date exercises use 12 November 2026 UTC and Monday-start weeks. Project saves check the recorded version and retain attempted values on conflict. Business fields and milestones are sample application choices.

Projects uses one title and a compact count/filter/action toolbar. The editor keeps the ownership consequence beside its field and omits routine instructional sidebars. Project names receive more default width than short attributes. Work queue defaults likewise prioritize Task; saved widths and order remain independent, including through native routes and task return.

### Saved work views

[Owning pattern](../library/patterns/saved-table-views.md)

Personal views, defaults and queue tasks are isolated by browser session. Shared links contain filters and sort only; personal view identities, defaults, columns, page and selection stay private. Saved columns render on the server; interactive resize/reorder requires enhancement. Shared editable views and access management are outside this example.

The Work view picker selects built-in or personal views. View options contains Save as…, Reset and View settings; Save changes appears for modified personal views. The queue shows ten tasks per page and keeps its count with pagination. Naming, settings and deletion confirmation use native pages that retain the working query, columns, page and revision. The example review bar links to failure simulation.

## Mixed forms and selection

[Review guide](http://127.0.0.1:8100/review/mixed-forms) · [Mixed-form contract](../library/elements/form-controller.md#mixed-forms) · [Element mounting](../library/rails.md#optional-element-mounting)

The default form uses application-owned in-place submission; `/mixed-forms/mixed-form?transport=native` uses ordinary Turbo multipart submission. Successful uploads retain file names and descriptions only, not attachment bytes. A server-replaced form retains text and file notes and requests file reselection. No-cache navigation returns authoritative saved values because cloned snapshots cannot preserve live File objects or structural baselines.

Without JavaScript, Add expands the draft and Remove opens a server confirmation. Keep editing retains the draft and returns focus to the removal action. Confirmation removes only the chosen row and focuses the next row or Add when empty; Save project persists the resulting structure. Row actions retain incomplete fields and file notes and do not consume simulated save failures. Ordinary entry, Turbo navigation and history return do not autofocus titles; explicit row-action recovery and server validation retain their useful focus targets.

The action row and result feedback precede the fields. Save is the first submit action, so Enter in a project name or deliverable title validates and saves rather than opening removal or adding a row. Explicit row actions retain their separate draft behavior.

The starting brief includes three deliverables. Compact repeated rows keep their titles, due dates and removal actions together, and compact file intake keeps uploads secondary to the editor. Reselection notes remain visible through subsequent native row additions and rejected saves; Discard clears them, and notes alone never become saved attachments.

To fail the next save without navigating away, run this in the example page’s browser console, then save the form:

```js
fetch('/mixed-forms/mixed-form/fail-next', {
  method: 'POST',
  headers: { 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content }
});
```

In-place failure retains actual selected files and descriptions for retry. Native failure requests file reselection. Lookup failures can be exercised directly by searching reviewers for `failure`; lookup callbacks and failure simulation belong to the example.

## Purchase requests and business values

[Review guide](http://127.0.0.1:8100/review/purchase-request) · [Business-value contract](../library/elements/business-values.md) · [Date-range contract](../library/elements/date-and-time.md#date-ranges)

Parsing accepts dot or comma decimal separators without grouping, signs or exponents. CHF/USD support two price decimals and JPY whole amounts; hours permit three quantity decimals and items require whole quantities. Discounts are percentages from 0–100 with two decimals. Delivery dates are inclusive calendar dates, limited to 366 days. Changing currency or unit preserves the entered number without conversion.

Exact decimal calculations round the subtotal half up to currency minor units, then round the discount from that subtotal half up and subtract it. Tax and currency conversion are excluded. Recorded values use integer currency minor units, discount basis points, quantity thousandths with a unit, and date-only endpoints. These are example storage choices; no order or payment is sent.

The editor uses a native supplier select for its short list and one error summary for rejected fields. The review and recorded result group purchase details with a separate cost breakdown and prominent total with its currency. Review scenarios in the example navigation opens confirmation-failure simulation without adding it to the purchasing task. Stale editing retains attempted values while opening the saved draft in a separate tab.

### Supplier directory and element mounting

[Owning lifecycle](../library/rails.md#optional-element-mounting)

The supplier directory exercises affected-root cleanup across Frames, Streams, canceled rendering, pending lookups and history return. The form bridge retains ownership of editing forms; explicit element registrations own searchable roots and hint listeners. Permanent/morph semantics and custom Stream actions are outside this demonstration. Supplier refresh has native server destinations and does not change purchase data.

## Supplier CSV imports

[Review guide](http://127.0.0.1:8100/review/file-import) · [Owning pattern](../library/patterns/file-imports.md)

Intake accepts UTF-8 comma-separated CSV with an optional BOM, a unique nonempty header row, at most 100 data records, 12 columns and 100,000 bytes. Every record must match the header’s cell count. The app checks the `.csv` extension and parses content. Source row numbers count parsed records including the header; quoted multiline cells remain one record.

The working screens use task headings and contextual actions without a step bar. Mapping sits beside the source preview; rejected assignments retain their values with field errors and summary links. Compact problem links lead to rows, and one result summary reconciles all outcomes. Failure simulation is available through Review scenarios in the example navigation.

Required mapped values are supplier reference (`SUP-` plus three digits), name (1–80 characters) and owner email (up to 120 characters). Values are trimmed and unmapped columns ignored. Existing references are skipped without updates. Only the first in-file occurrence is considered, even when it needs correction. A corrected source starts a new import against the current register.

Execution is synchronous and bounded. All or nothing rolls back the eligible batch on a simulated temporary failure; valid-only acceptance excludes invalid rows and retains partial successes. Retry accepts the recorded unsuccessful subset and attempt reference. Accepted source bytes, mappings and outcomes remain in session-isolated process memory. There is no background worker or cancellation operation. `/file-import/imports/new?transport=native` exercises normal multipart transport.

## Multi-step creation and review

[Review guide](http://127.0.0.1:8100/review/multi-step-creation) · [Owning pattern](../library/patterns/multi-step-creation.md)

Drafts save only on explicit actions; Save and leave and Save and go back can retain incomplete answers. Continue and final creation enforce server prerequisites and validation. An assessor retained from an independent-assessment draft is omitted from the check page and created record when Internal review is selected. Creation is reconciled by the application’s attempt/revision checks. No notification or assessment work starts with request creation.

Task headings and contextual actions replace the step bar. Drafts show the owner, a saved due date where available and the work to resume. Scope paragraphs remain readable in checks, confirmed records and stale comparisons; recovery opens the saved page separately. The normal progression action is the first submitter so Enter validates and continues in native and enhanced forms. Due dates accept calendar dates, excluding timestamps, compact date strings and year zero. Creation-failure simulation lives under Review scenarios.

## Draft protection

[Review guide](http://127.0.0.1:8100/review/draft-protection) · [Owning integration](../library/rails.md#draft-protection)

The example opts into protected visits, Frames, indexed same-document history and unload for its marked forms. It uses no cloned page snapshots so live files can remain in canceled edits. The personal reminder is retained only in this browser’s localStorage and is hidden without enhancement; unavailable storage is reported honestly. The library does not persist drafts or attachments.

The brief editor starts with a realistic scope and compact file intake. **Review controls** exposes synthetic save outcomes and Frame reloads without treating those choices as brief edits. Personal reminder, brief guidance and project search are separate sections below the editor. Workspace shows the current saved name and scope. Saved brief text is scoped to this browser session; uploaded bytes are acknowledged and discarded, with the same explicit result for enhanced and native saves.

`/draft-protection/workbench?transport=native` uses normal Turbo multipart submission; append `&drive=off` for full native navigation with enhancement enabled. Successful saves retain that transport choice. Native errors retain text and ask for files again. Refresh/morph/custom Stream handling is outside this demonstration; follow the owning contract for lifecycle scope. Automated unload checks verify listener registration, while actual browser close/reload prompts need manual review.

## Event times and deadlines

[Review guide](http://127.0.0.1:8100/review/event-times) · [Owning contract](../library/elements/date-and-time.md)

This example records past events in Europe/Zurich, America/New_York, Asia/Kolkata or UTC, resolving candidate timezone periods through Rails’ existing TZInfo dependency. Its follow-up target is four elapsed hours after the resolved instant, including nights and weekends. It is not a business-hours calendar. The event instant, entered clock fields, zone/occurrence, independent Review by calendar date and actual Recorded at time stay distinct. Changing zone preserves the entered clock fields and requires a fresh review.

Entry pairs the local clock fields and timezone. Review places event time and the follow-up target together, with UTC equivalents, the calendar review date and confirmation in the same task surface. **Review scenarios** returns to the current reviewed event after setting a one-time recording failure. Use the shared confirmed **Reset example…** to clear the workspace; expired entry forms retain attempted values, disable another submission and open fresh recovery separately.

Explicit event-zone and UTC values stay stable across viewer timezones. Event entry protects visits and unload, rather than installing a global history guard; review/save before Back/Forward traversal.

## Document patterns

[Review guide](http://127.0.0.1:8100/review/versioned-documents) · [Owning pattern](../library/patterns/versioned-documents.md)

The app renders authored HTML for fixed Markdown fixtures, including the unsaved “two days” variant. Arbitrary edits are safely escaped and labeled as source preview. This is not a general Markdown renderer; consuming applications supply their own renderer and sanitizer. Preview uses a 303 redirect to a bounded process-local snapshot without recording a revision, and snapshots expire on eviction or restart.

Save actions precede the source fields so Enter in Change summary saves; Preview remains an explicit action. The application normalizes submitted textarea line endings to LF before preview or save, keeping native transport consistent with the editor and saved baseline.

The adapter invokes the host’s `diff` command and supplies explicit word segments for known fixture text; other changes use whole-line highlighting. It assumes newline-terminated UTF-8 and does not represent newline-at-end changes. It is application code, not a Fieldwork diff API. Historical publications and fixed revision pairs remain separate from the saved draft; authorization, production persistence, approval and publication actions are outside the example.

The document entry point mounts comparison behavior after the editing bridge and owns source-preview freshness and editor exit guards. It exercises Drive/body responses; consuming applications follow the owning Rails lifecycle for Frames and Streams.
