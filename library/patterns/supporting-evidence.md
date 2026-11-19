# Pattern: adding and reusing supporting evidence

## Recommended default

Let people **Add files** or **Link existing evidence** from the record or assessment the material supports. Compose [attachments](../elements/attachments.md), [file selection](../elements/attachments.md#adding-attachments), [searchable selection](../elements/searchable-select.md) and [creation forms](creation.md). An existing original can support several records without another upload.

Keep two things distinct: the original file and its source metadata, and each record's link explaining what that material supports. Linking a file does not establish that it is sufficient evidence or that an assessment is complete. Applications own those conclusions, access, ownership, storage and retention.

## Choose and explain

For new files, show the [drop zone and native chooser](../elements/attachments.md#adding-attachments), supported formats and limits. Identify the source and relevant evidence date separately from the upload time. If source, date or explanation applies to an entire batch, state that scope; use per-file fields when the task needs different values. Use [mixed forms](../elements/form-controller.md#mixed-forms) when files and other fields save together.

For reuse, show enough source/date context to distinguish similar filenames. Use native selection for a short list or searchable selection for larger collections. Keep committed choices visible, allow source inspection without losing a draft, and retain the selected ID and explanation after failure. The native/server fallback must also expose source context. Unavailable or withdrawn originals must not appear usable; the server rechecks submitted IDs, availability and permissions.

Ask what the material demonstrates for the current record. Keep this explanation on the link rather than overwriting the original's description or another record's explanation. State when a file is already linked instead of creating accidental duplicate references.

## Save and recover

Choosing or dropping files creates a local draft. Do not label them uploaded until the application acknowledges storage and the intended links. Record an original and its initial link consistently; linking existing evidence must not copy its contents.

After confirmation, return to the originating record with its context retained, display the saved material and explanation, and recover focus to the result. Clear acknowledged file choices or replace the intake form so a later save does not resend them.

Follow [upload recovery](../elements/attachments.md#upload-states-and-application-responsibilities). In-place failures can retain actual File objects. Full-page replacement requires staging or explicit reselection while preserving other entered values; filenames cannot reconstruct a lost upload. When an outcome is uncertain, reconcile or retry the same application-owned attempt rather than declaring failure or creating another original.

## Present saved material

Show the filename, source, evidence date, availability and the explanation for this record. Distinguish an evidence date from the time someone added the file. Offer a download only when available and authorized, and provide a route to the original and its source context.

Use the [linked-attachment composition](../elements/attachments.md#linked-supporting-material). Keep unavailable filenames and metadata readable with a reason; a missing file must not turn into an empty evidence section. Failed downloads must not return replacement bytes that appear to be the original.

## Remove a link or withdraw an original

**Remove link** affects only the current record's association. Its [confirmation](../elements/deletion-confirmation.md) names the record and file and explains that the original and other uses remain unchanged. Keep the link after a failed operation and recover focus to a useful result after confirmed removal.

**Withdraw original** belongs with management of the source file, subject to application permissions. Before committing, explain the actual effect on downloads and other uses, identify the affected scope, and collect any required reason. Preserve metadata, history and references according to application policy. Withdrawal is distinct from physical deletion; do not promise either retention or erasure unless the application guarantees it.

## Preserve the assessment basis

An assessment can retain the original identity/version, relevant source metadata and its own link explanation. Later link removal or original withdrawal must not silently rewrite that recorded basis. Show current download availability alongside retained historical context. [Structured record comparison](../elements/record-comparison.md) can distinguish added/removed links, changed explanations and changed availability; applications match originals by stable identity rather than filename.

Applications decide whether changed evidence requires reassessment and how it affects completion. For [population reviews](population-reviews.md), distinguish current links from the evidence recorded with each assessment and recheck the basis on submission. Preserve attempted explanations on conflict and give access to current information without losing the draft.
