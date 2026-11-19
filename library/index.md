# Fieldwork library

Fieldwork is the company UI library for mostly internal business applications on Rails, using semantic HTML, shared CSS, and optional native JavaScript. Start with the pattern for the user's task. It owns the recommended interaction and links to supporting contracts. Read only the elements and integration details needed for that task.

## Product priorities

Optimize for people doing business work on desktop computers. Prioritize useful functionality, easy-to-understand task flows, discoverable controls, clear language and efficient repeated use. Provide filtering, sorting, selection, bulk operations, editing and history where they help the actual task. Keep current scope, state, consequences and recovery understandable. Use clear grouping and deliberate spacing to make rich working views easy to scan.

Assume people return to these tools almost daily. Put the working content and its controls first. Show step indicators or introductory explanations when they help with orientation or a decision, and keep guidance about constraints and recovery close to the affected work.

Responsiveness is secondary. Reuse the existing layout behavior, and spend additional effort on narrow-screen or touch-specific refinement only when the project calls for it. Dedicated assistive-technology implementation and review are not required by default. Reuse the library’s semantic HTML, native controls and existing markup contracts; keyboard efficiency and predictable focus remain part of desktop usability.

## Patterns

| Task | Pattern |
| --- | --- |
| Establish the application shell and navigation. | [Application layout](patterns/application-layout.md) |
| Find records in a list or card collection. | [Collection search](patterns/search.md) |
| Filter, sort, compare, or select tabular records. | [Data tables](patterns/tables.md) |
| Reuse named table settings and return from work-queue tasks. | [Saved table views](patterns/saved-table-views.md) |
| Inspect one record and its related information. | [Record details](patterns/record-details.md) |
| Carry out successive activities on one record. | [Record activities](patterns/record-activities.md) |
| Assess a captured set of subjects and track review readiness. | [Population reviews](patterns/population-reviews.md) |
| Read, edit, or compare versioned authored documents. | [Versioned documents](patterns/versioned-documents.md) |
| Import records from a file through mapping, validation and review. | [File imports](patterns/file-imports.md) |
| Add files or reuse evidence supporting a record or assessment. | [Supporting evidence](patterns/supporting-evidence.md) |
| Apply one operation to several selected records. | [Bulk actions](patterns/bulk-actions.md) |
| Create a record. | [Creation](patterns/creation.md) |
| Prepare, check and create a record across several steps. | [Multi-step creation](patterns/multi-step-creation.md) |
| Change saved information. | [Editing](patterns/editing.md) |
| Track a longer operation and recover unsuccessful work. | [Long-running actions](patterns/long-running-actions.md) |

## When a pattern does not fit

When the task is not covered or an existing pattern is unsuitable, follow the project developer's direction to implement the approach in the application. Reuse suitable Fieldwork elements and leave the installed gem unchanged.

## Setup

Follow [Rails setup](rails.md#installation) once, then follow the task pattern and its supporting contracts. Use the Rails form helpers for creation and editing; initialize other behaviors only when needed, following the [Turbo lifecycle rules](rails.md#other-component-lifecycles).

Consume the installed gem as one unit: these contracts define the interface, `assets/fieldwork/` supplies CSS and JavaScript, and `rails/` supplies Rails helpers. Run `bundle show fieldwork` to locate this reference for the application’s locked version. Applications own data, permissions, validation, transport, persistence, and routing. Element contracts own the underlying HTML, supported behavior, and APIs.

JavaScript examples use Rails import names such as `fieldwork/forms`. Element asset links point to the corresponding source files.

## Supporting reference

[Foundations](foundations.md) defines shared visual defaults. The [element reference](elements/index.md) provides direct lookup for focused changes and compositions outside the existing patterns. Keep interaction choices with the owning pattern and reusable implementation details with the owning element.

When the project developer asks for feedback on Fieldwork, use the [feedback instructions](feedback.md).
