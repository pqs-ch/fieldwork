# Pattern: successive activities on a record

## Recommended default

Use a stable record detail page as the working hub when people return to the same record to carry out several activities over time. Compose [record details](record-details.md) with focused activity forms and recorded history. The loop is **overview → detail → activity form → updated detail → next activity**.

An activity records something that happened: an assessment, an order, a visit, a payment or a progress note. Its completion may change the record's current state and available actions. Applications supply the activities, prerequisites, labels, permissions and resulting state changes.

## Overview and detail

Use [collection search](search.md) or [data tables](tables.md) to help people choose a record. Show its identity, current state and task-defining facts; a next-activity link can provide a shortcut when the activity is unambiguous. Keep a link to the detail page for people who need context first.

On the detail page, give four kinds of information distinct homes:

| User question | Presentation |
| --- | --- |
| Where does this record stand now? | Current state beside the identity in the [page header](../elements/page-headers.md), followed by relevant current facts in [description lists](../elements/description-lists.md). |
| What has happened? | A newest-first [activity timeline](../elements/activity-timeline.md) naming the actor, action and time, with recorded outcomes or links to read-only details. |
| What can I do now? | One prominent next activity near the record identity, with other available actions secondary. Section-specific actions stay with their information. |
| What still needs doing? | A [checklist](../elements/checklist.md) of outstanding work, with explicit ready or blocked text and the reason for a prerequisite. |

Keep history and current facts distinct: an old assessment remains a recorded event even when later work changes the current position. Completed work can leave the outstanding list while remaining in history. Show an explicit completion message when nothing remains. Progress notes and other activities may add history without changing state.

Keep timeline entries concise when current task sections already show the full outcome. Repeat historical attributes only when their earlier values add context; retain event descriptions, attribution and time.

Give longer findings and outcomes their own paragraph content rather than squeezing them into compact attribute rows. Keep dates, references and other short facts in description lists. History can link to an exact recorded section when it is immutable; if an activity can later change, link to its recorded version instead of current values.

The checklist describes remaining work. Use a [step indicator](../elements/step-indicators.md) when the sequence itself is the user's navigation through an ordered task. Choose these from the interaction rather than assuming every record lifecycle is a wizard.

For repeated assessments across a captured set of subjects, use [population reviews](population-reviews.md) to compose scope, review views, readiness and follow-up.

## Focused activity form

Give each substantial activity its own server-rendered URL. Preserve the record identity in breadcrumbs and show the current state and relevant prior facts beside the form. Collect only the information needed to record this activity. Describe the consequence before submission and use a specific action label such as **Record assessment** or **Confirm installation**.

Follow [creation](creation.md) when recording a new activity, including the Rails helper's creation mode, attempted-value retention, duplicate-submission protection and draft protection. Follow [editing](editing.md) when changing an existing saved activity. These contracts own form markup, initialization, validation and lifecycle behavior.

Cancel returns to the record; protect unsaved input before leaving. Opening prior information must preserve the entered values. A separate tab can support reviewing the latest record during recovery; label that destination clearly.

## Save, return and continue

After a successful submission, redirect to the same record's canonical detail URL. Show a specific success message, refreshed current facts, the new history event, the revised outstanding work and the next available action. Recover focus to the result or record heading after navigation. Do not open the next form automatically: people should be able to review what was recorded before continuing.

Applications must check availability and freshness again on submission. If an activity is no longer allowed, retain attempted values and explain how to review the current record and start a fresh activity. Validation failures return the same form with attempted values and field errors. A failure must not appear as a recorded event or completed task.

When a stale or expired attempt cannot succeed, make its submission unavailable and offer a route to the current record while preserving the entered text. A correctable validation error should still allow correction and retry. Describe the available next step rather than asking people to repeat an activity that has already completed.

Recording the event and updating the current state must have a consistent application-owned outcome. Retrying the same completed submission must not create another activity. Fieldwork supplies presentation and form behavior; the application owns transactions, concurrency checks, deduplication, persistence, attribution, routes and recovery decisions.
