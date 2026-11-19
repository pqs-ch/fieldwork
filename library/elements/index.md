# Element reference

Start with a [task pattern](../index.md#patterns) when building a screen or workflow. Use this catalogue for a focused element change, supporting details linked by a pattern, or a composition the existing patterns do not cover. Read only the contracts needed for the task.

Elements own reusable markup, accessibility, APIs, and cleanup. Patterns own how these parts work together.

## Fields and forms

| Element | Use when |
| --- | --- |
| [Text inputs](inputs-and-textareas.md) | Enter a single value. |
| [Business values](business-values.md) | Enter money, percentages and quantities with explicit currency/unit, precision and application-owned calculations. |
| [File selection and drop zones](attachments.md#adding-attachments) | Choose or drop files for upload/import, with single-file, list, or table review. |
| [Dates, times and timezones](date-and-time.md) | Enter date-only values or resolve an explicit local time/zone, including clock-change choices and reviewed instants. |
| [Textareas](inputs-and-textareas.md) | Enter multiline plain text. |
| [Selects](choice-controls.md) | Choose one option from a short list. |
| [Checkboxes](choice-controls.md) | Choose independent options. |
| [Radios](choice-controls.md) | Choose one option from a visible group. |
| [Switches](choice-controls.md) | Turn one setting on or off. |
| [Searchable select](searchable-select.md) | Find one or several existing options using search, with visible committed selections. |
| [Error summary](error-summaries.md) | Find and correct errors across a form. |
| [Repeatable field groups](repeatable-field-groups.md) | Add or remove groups of draft fields. |
| [Form controller](form-controller.md) | Track edits and save/discard fixed fields or opt-in mixed forms with repeatable groups and file queues. |

## Actions and feedback

| Element | Use when |
| --- | --- |
| [Buttons and links](buttons-and-links.md) | Invoke an action or navigate. |
| [Icons](icons.md) | Use bundled Lucide icons for actions, navigation, feedback, and file types. |
| [Action dropdowns](action-dropdowns.md) | Group secondary actions. |
| [Badges and status indicators](status-indicators.md) | Show counts, metadata, or a subject’s state. |
| [Feedback](feedback.md) | Report an action outcome or loading status. |
| [Empty states](empty-states.md) | Explain absent or unavailable results and offer a next step. |
| [Progress](feedback.md) | Report measured or indeterminate progress. |
| [Dialogs](dialogs.md) | Complete a short task in a modal. |
| [Deletion confirmation](deletion-confirmation.md) | Confirm a scoped deletion or removal. |
| [Unsaved-changes confirmation](confirmation.md) | Approve leaving when edits would be lost; optional [Rails/Turbo draft protection](../rails.md#draft-protection). |

## Layout

| Element | Use when |
| --- | --- |
| [Application layout](application-layout.md) | Supply company branding, top, left or combined shells, a compact direct-link top bar with optional end utilities, responsive regions and landmarks. |
| [Page headers](page-headers.md) | Introduce a view and its actions. |
| [Content surfaces, stacks, section stacks, clusters and grids](layout-primitives.md) | Give the main task a shared surface and arrange its sections vertically, in rows, or in columns. |
| [Panels](panels.md) | Give a distinct module or context a visible boundary, or highlight a next action. |

## Navigation

| Element | Use when |
| --- | --- |
| [Destination navigation](destination-navigation.md) | Choose destinations using cards or a compact list. |
| [Page navigation](page-navigation.md) | Navigate between application areas, workspace views or record/task pages, with exact-page and containing-area states. |
| [Account menu](action-dropdowns.md) | Offer profile and sign-out actions. |
| [Tabs](tabs.md) | Switch between content already present in one view. |
| [Breadcrumbs](breadcrumbs-and-pagination.md) | Show the current page’s ancestry. |
| [Pagination](breadcrumbs-and-pagination.md) | Move between result pages. |
| [Step indicator](step-indicators.md) | Show position in an ordered task. |

## Tables

| Element | Use when |
| --- | --- |
| [Data table](data-table.md) | Present records with explicit column wrapping, text, numeric and date comparisons, relative date periods, searchable value selection with replace/add behavior, and sorting through column menus. |
| [Row selection](row-selection.md) | Supply row controls and scoped selection state. |
| [Column layout](column-layout.md) | Let users show, hide, reorder, or resize columns while respecting nonwrapping content widths. |

## Lists

| Element | Use when |
| --- | --- |
| [Checklist](checklist.md) | Show independent tasks and their next actions. |
| [Reorderable list](reorderable-list.md) | Change the order of a vertical list. |

## Content and records

| Element | Use when |
| --- | --- |
| [Formatted content](formatted-content.md) | Display authored prose, code, tables, or media. |
| [Local timestamps](local-timestamps.md) | Display instants in the viewer’s local time. |
| [Description lists](description-lists.md) | Display read-only labeled attributes. |
| [Record references](record-references.md) | Quote source-record context for another task. |
| [Activity timeline](activity-timeline.md) | Show recorded events for the current record or task. |
| [Attachments](attachments.md) | Display saved files, linked supporting material, availability and scoped actions. |
| [Content revisions](content-revisions.md) | Read complete past versions of content. |
| [Structured record comparison](record-comparison.md) | Compare labeled earlier/later field values, additions, removals and retained context. |
| [Document comparison](document-comparison.md) | Read application-supplied unified Markdown-source changes between saved revisions. |

## Common choices

- Status describes a subject; a notice reports an action’s outcome.
- Keep useful guidance visible beside its field or value; omit content that does not help the task.
- Checklists contain independent tasks; step indicators describe an ordered task.
- Activity summarizes related events; revisions show complete past content.
