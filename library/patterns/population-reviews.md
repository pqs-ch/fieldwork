# Pattern: reviewing a population

## Recommended default

Use a stable review workspace when people assess a defined set of subjects over several visits. Compose [record activities](record-activities.md) with a [table](tables.md) or [checklist](../elements/checklist.md), focused assessment forms and recorded results. A review is not necessarily an ordered wizard: subjects can be assessed independently.

Applications own the scope, capture rules, outcomes, evidence requirements, permissions and completion policy. The following composition makes those decisions visible; it does not prescribe governance rules for every review.

## Establish scope

Identify the review, responsible person, period or trigger, and what is being checked. If starting the review captures its population, use an explicit **Start review** action and explain which records it includes. Merely opening the page must not silently start work.

Show the capture time and subject count once confirmed. Explain whether later additions enter this review or a future one. Keep captured identity, current facts and facts used for an assessment distinct through [record references](../elements/record-references.md). A fixed population does not necessarily mean that an unfinished assessment can rely on outdated facts.

## Find and assess subjects

Show each subject's identity, assessment state, recorded outcome and next useful action. Separate unassessed subjects, changed facts, explained exclusions and results awaiting follow-up; do not report all of them as reviewed.

Offer useful review views such as outstanding subjects, changed facts and finished assessments. These can be application-defined [page destinations](../elements/page-navigation.md#section-navigation) over several attributes. For individual column criteria, follow [table filtering](tables.md). Keep the selected view in the URL and carry it into forms, Cancel and successful returns.

Give a focused assessment its own URL. Show the facts being assessed and relevant prior results without requiring the user to leave a draft. Follow [creation](creation.md) when recording a new assessment event, or [editing](editing.md) when changing saved information. Collect a conclusion and enough explanation or evidence for the application's task; an exclusion needs its own clear meaning and basis. For a short, stable outcome set, native radios can show the available conclusions and their consequences before selection.

For repeated use, keep the subject list ahead of progress decoration and general guidance. Compact counts can explain readiness without repeating them as prominent metrics and a progress bar. Keep source facts, evidence and the assessment form in one task surface, using available desktop width when it helps people read and decide together. Keep current blockers, recorded outcomes and recovery visible. Put general guidance and older history in labeled sections after the working content.

Open finished assessments as read-only results. Make recording another assessment an explicit action so viewing a result does not invite an accidental duplicate.

After saving, return to the review with a specific acknowledgement and access to the saved result. Keep the applied view even when the subject no longer matches it. Explain an empty filtered view and offer **Show all subjects**. Recover focus to the result, subject or review heading; do not automatically open the next assessment. Keep **Continue review** available when useful work remains.

## Supporting evidence

Follow [supporting evidence](supporting-evidence.md) to add files or reuse existing material. Distinguish current evidence links from the references retained with each recorded assessment. Applications decide whether evidence changes require reassessment; show that decision clearly and check the current basis again before recording a result or completing the review.

## Explain readiness

Show reviewed, excluded and outstanding counts with explicit meanings. Identify what prevents completion and link directly to work that resolves each blocker. A disabled completion action alone is insufficient explanation. Completion checks must cover the whole captured population, regardless of the active view.

Keep assessment completion distinct from treatment of identified problems. When the application permits open follow-up, show the linked findings, accountable owners and outstanding treatment after the review completes. Recording a plan is not evidence that its work is done.

An empty captured population needs an explicit outcome. If the task requires independently establishing completeness, ask what operating source was checked and why there is nothing to assess. Do not equate an empty register or an empty filtered view with verified absence.

## Changes, recovery and completion

When relevant facts change, identify affected unfinished assessments and explain whether reassessment is required. Use [structured record comparison](../elements/record-comparison.md) to show the assessed and current values, including supporting evidence where relevant. Keep each historical assessment identifiable when a newer result is recorded; label when the current side was read. Preserve earlier facts and results. Recheck freshness and availability on submission; stale or failed saves retain attempted values and provide a way to inspect current facts without losing them. Follow [record-activity recovery](record-activities.md#save-return-and-continue).

When an attempt requires a fresh form, disable its obsolete submission and open recovery separately from the retained draft. Keep temporary service failures retryable with the same attempt. These are different recovery states, even when both retain the person's explanation.

Before completing, summarize the scope, conclusion and any follow-up that will remain open. Recheck readiness and the reviewed basis on the server; a stale completion form must not silently conclude a changed review. Deduplicate successful submissions. Confirm completion explicitly and keep recorded results readable when source records later change.

Applications own persistence across visits, snapshots, invalidation, transactions, concurrency and deduplication. Fieldwork supplies presentation and form behavior, not a review engine.
