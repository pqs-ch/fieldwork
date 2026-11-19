# Pattern: creating records

Shared implementation: [ui.css](../assets/fieldwork/ui.css) · [forms.js](../assets/fieldwork/forms.js).

## Supported scope

Creation mode for the form controller’s fixed supported controls, with native or callback saving. The application owns record creation, destinations, and server deduplication; use the [mixed-form composition](../elements/form-controller.md#mixed-forms) when files or repeatable groups save with the record.

## Recommended default

Use a specific Create action and Cancel returning to the originating view. Create works with unchanged defaults. Validate on submit; retain attempted values and focus errors.

Keep required formats, limits, and material consequences visible. Place useful explanations beside the relevant field and omit background that does not help the task.

Use the [text input](../elements/inputs-and-textareas.md) and [choice control](../elements/choice-controls.md) contracts for field markup. Keep the title and form on the continuous white page described by [page composition](application-layout.md#page-composition). The optional `.content-surface` class groups the form without adding a box or inset. Group longer forms with semantic fieldsets in a [section stack](../elements/layout-primitives.md#continuous-page-sections). Use a [panel](../elements/panels.md) only when the form is a distinct bounded module rather than the page's primary task.

Creation omits Discard and the unchanged indicator. Cancel leaves; use the [scoped Rails Cancel guard](../elements/confirmation.md#rails-cancel-lifecycle) if it would lose a draft.

After confirmed success, show the created record or return it to the calling task. Start a fresh attempt for another record.

## Rails default

Complete [Rails setup](../rails.md#installation), then render a creation form with the existing helpers:

```erb
<%= fieldwork_form_with model: @project, url: projects_path, local: true,
      mode: :create, baseline: @initial_attributes, class: "content-surface",
      submit_label: "Create project", cancel: projects_path do |form| %>
  <%= hidden_field_tag :attempt, @attempt %>
  <%= fieldwork_field form, :name, label: "Project name", required: true,
        maxlength: 80 %>
<% end %>
```

The application supplies a new `@project`, its initial field values in `@initial_attributes`, and a server-validated `@attempt` reference. The name and length limit are illustrative application choices. `mode: :create` allows submission of unchanged defaults and omits Discard and the unchanged indicator. The installed Turbo form bridge owns enhancement; no view-level initializer is needed.

On failure, render the attempted model with its errors, the original defaults, and the same attempt reference. On confirmed creation, redirect with status 303 to the record or calling task. Follow the shared [Rails response contract](../rails.md#form-responses-and-baselines).

Keep one server-validated idempotency reference per creation attempt and deduplicate creation on the server. A fresh form starts a new attempt; button locking alone cannot prevent duplicate records. Reconcile uncertain outcomes before retry.

Use the form controller’s [creation mode contract](../elements/form-controller.md#creation-mode) for custom markup, callback saving, baseline encoding, and completion/cache behavior.

For grouped entry, saved drafts, a check page and targeted corrections, follow [multi-step creation and review](multi-step-creation.md).
