# Pattern: multi-step creation and review

Shared implementation: [form controller](../elements/form-controller.md) · [step indicators](../elements/step-indicators.md) · [panels](../elements/panels.md) · [description lists](../elements/description-lists.md).

## Supported scope

An ordered task with application-owned draft storage: enter related groups of answers, check the complete request, correct specific answers, then confirm creation. Use [creation](creation.md) for a short single form. Use [record activities](record-activities.md) for independent work on an existing record.

This pattern coordinates existing native forms and links. It adds no wizard runtime. The application owns steps, branching, permissions, validation, routes, retention, expiry and idempotent creation.

## Recommended default

Start from the originating collection with a specific New action. Give the draft a stable server-owned reference and distinguish it from created records. Explain when progress is saved and what confirmation will do.

Use one task heading per page and focus explanation on the decision at hand. Add a [step indicator](../elements/step-indicators.md) when seeing the sequence helps people orient themselves. Mark completion only after valid answers are acknowledged by the application. Link to available steps only; visiting a step does not complete it. Put Continue, Back and Save and leave beside the form, with labels that describe their actual effects.

| Transition | Expected behavior |
| --- | --- |
| Continue | Save attempted answers, validate the current step and advance only after success. Keep failures on the same step with values, associated errors and useful focus. |
| Save and go back | Save current answers before moving to the previous step; allow an incomplete draft when the application supports it. |
| Save and leave | Acknowledge draft persistence, then return to the collection with a Resume action. State retention/expiry honestly. |
| Step link or browser navigation | Preserve work or [protect the unsaved draft](../rails.md#draft-protection). A saved draft does not retain edits made since its last save. |
| Change from the check page | Open the relevant step with saved answers; a valid correction returns directly to checking. Retain answers from other steps. |
| Confirm creation | Validate the complete authoritative draft and the exact reviewed revision. Create once; show a durable confirmed result. |

Draft saving may accept incomplete values; validation before progressing or creating remains mandatory. On helper forms, creation mode allows unchanged defaults to advance and omits Discard. Name the submit action for the current step; the label need not be Create. A native `formnovalidate` submitter can carry an application intent such as Save and leave; follow the [form actions contract](../elements/form-controller.md#actions). Native and enhanced submissions must enforce the same server rules.

Keep conditional fields in the owning step. Make the condition understandable without JavaScript; enhanced visibility and required-state changes are optional. Retain useful draft answers when switching a branch, but omit inapplicable values from the canonical created record. Recheck dependent steps after an earlier change; unavailable steps must also be rejected or redirected by the server.

## Check, correction and completion

Present saved answers in labeled sections using [description lists](../elements/description-lists.md) and specific Change links. Display meaningful missing/optional states rather than blank rows. Explain material effects beside the final action. The check page is a review of saved data, not a preview of unsaved browser inputs.

A correction invalidates the previous reviewed revision. On a stale check page, refuse creation and link to the current saved answers. If another tab changed an editing step, retain the attempted answers in a recovery view alongside the saved values; require an explicit return to the saved draft before accepting further edits. Do not silently merge or overwrite conflicting answers.

Keep one idempotency reference for the entire draft through corrections and retries. A failed creation retains the reviewed draft and provides retry. A retry or concurrent confirmation that already succeeded returns the existing record. After creation, old draft links reconcile to that result; creating another record starts a fresh draft. Expired/inaccessible drafts need a clear recovery destination without claiming that unsaved answers can be reconstructed.

Use heading focus on actual step navigation. Preserve the form controller's error focus after validation and focus recoverable result feedback after a server failure. Review the order and wrapping of steps, summaries and actions at narrow widths. No-JavaScript use must retain server-rendered navigation, validation, draft save, correction and completion.

## Maintained example

The [multi-step creation example](../../examples/README.md#multi-step-creation-and-review) prepares a supplier-review request through Supplier details → Review scope → Check review request. It demonstrates partial draft save/resume, an independent-assessor branch, targeted correction, stale editing/review pages, failure/retry, deduplication and confirmed completion. Its process-local synthetic storage is an example policy, not a production persistence recommendation.
