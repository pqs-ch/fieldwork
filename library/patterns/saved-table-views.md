# Pattern: saved table views

Shared implementation: [data tables](tables.md) · [column layout](../elements/column-layout.md) · [page navigation](../elements/page-navigation.md).

## Supported scope

Named views coordinate an applied query, sorting and presentation preferences for a collection or work queue. The application owns view storage, authorization, default selection, query execution, schema migration and task navigation. This pattern composes existing tables and native forms; it adds no storage service or saved-view runtime.

Use the [table pattern](tables.md) for column filters, sorting, chips, pagination and failure states. Use [column layout](../elements/column-layout.md) for visibility, order, widths, required columns and hidden-column query recovery. A named view does not change either contract.

## Recommended default

Keep the selected view, modified state, Save and Reset close to the results. Put less frequent naming, sharing and management controls on dedicated native pages when they would compete with the collection. Carry the applied query, working layout, page and original revision through those pages and their Cancel links; entering management must not save or discard working settings.

Provide a small set of named built-in starting points for recurring tasks, followed by personal views when supported. Use ordinary labeled navigation or a native selector. Keep one compact set of view controls beside the table; avoid repeating the selected name as another heading. Show a changed state and Save only when there are unsaved settings. Ownership and default information can live in the picker or view settings. Group secondary actions under View options or on a management page. A shared query without access to its author's personal view must remain understandable on its own.

| State or action | Expected behavior |
| --- | --- |
| Built-in | A stable application-owned query/layout preset; save a personal copy to customize it. |
| Saved | Current applied query, sort and committed column layout match the named baseline. |
| Modified | One of those settings differs; changes do not silently overwrite the saved view or default. |
| Save changes | Explicitly persist current applied settings to an owned view, with revision/conflict checks. |
| Save as new | Name a personal view from the current working settings. Retain name/settings on failure. |
| Reset | Restore the selected saved baseline and start at its first result page. |
| Rename | Change only the personal view name; retain working query/layout without implicitly saving it. Check ownership, uniqueness and revision. |
| Delete | Confirm the named view and its consequences. Explicitly choose a replacement when deleting a default; preserve working settings or explain the destination before deletion. |
| Make default | Choose an acknowledged saved version for entry without an explicit view/query; modified settings need saving first. |

Keep query drafts distinct from applied filters. Capture only the query the user has applied and column changes committed through Columns Apply or completed resizing. Canceling a column/filter dialog must not modify the view. Normalize canonical values before comparing state so incidental parameter order or stale unused inputs do not produce a Modified state.

Save filter/sort criteria and stable column keys with their order, visibility and widths. Do not save result rows, counts, current page, selection, bulk-action scope or pending operations as view settings. Normalize effective nonwrapping widths through the owning layout controller. Validate complete known keys and required visibility on the server before persistence; migrate or reject obsolete schemas explicitly. Hidden columns are presentation, never authorization.

## Sharing and task continuity

A share link should encode or reference a documented query scope and sorting, resolved under the recipient's permissions. Decide explicitly whether presentation settings travel. A useful default is explicit filters/sort only: exclude personal view identifiers/names, personal defaults, column widths/visibility, selection and pagination. Do not silently fall back to a recipient's default when an explicit shared query was requested.

Keep one applied query through pagination and task entry. Opening an item should capture the current query, page, sorting and working layout, including unsaved presentation changes when the application supports that continuity. Carry the same return context through editing, validation, cancellation and completion. Validate local return destinations; do not accept an arbitrary redirect URL.

On return, resolve current authorized records under the captured criteria. Completed tasks may leave the queue, counts may change and an emptied page may need clamping. Preserve the user's query/layout rather than showing obsolete rows or restarting at an unrelated default. Focus meaningful result feedback or a useful collection destination after navigation.

## Failure and ownership

Save failure retains the current applied query, column layout and attempted name; provide a retry. A stale saved-view revision must not overwrite newer preferences: retain the working settings and offer an explicit reset to the saved version or Save as new. Replacing a baseline and continuing with a fresh revision without acknowledgment defeats conflict protection.

Resolve personal views and defaults within the current user's ownership boundary. Unknown, expired or inaccessible references need an explicit unavailable state and recovery destination, not silent substitution. Explain the persistence scope honestly; browser-session/process-memory examples do not establish production retention.

Native routes should support selecting views, applying filters/sort, saving/resetting, defaults, sharing and task return. Render saved column order/visibility on the server. If interactive column configuration needs JavaScript, retain the disabled native control specified by the element contract rather than claiming a nonexistent fallback. For enhancement, let `enhanceDataTable` own `columnLayout`; use its state/change events and keep URL, storage and route behavior in the application.

## Maintained example

The [operations work queue](../../examples/README.md#saved-work-views) combines review, delivery and follow-up tasks. It demonstrates built-in All open/Overdue/Awaiting review scopes, personal defaults, explicit modified/save/reset behavior, filter/sort-only sharing, failure/stale-view recovery and task return with query, page and working columns retained. Its fixed example date and session-isolated process memory are demonstration policies.
