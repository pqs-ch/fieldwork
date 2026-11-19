# Pattern: editing existing information

[Form controller](../elements/form-controller.md) · [Rails/Turbo](../rails.md) · [Creation](creation.md)

## Supported scope

Saved-baseline editing of fixed controls, with native or callback saving. For [repeatable groups](../elements/repeatable-field-groups.md) and [file intake](../elements/attachments.md#adding-attachments) in the same save scope, opt in to the [mixed-form composition](../elements/form-controller.md#mixed-forms).

For Markdown source, separate rendered preview and saved/publication history, compose this contract through [versioned documents](versioned-documents.md#edit-and-preview).

## Rails default

Complete [Rails setup](../rails.md#installation), then render the existing record with its saved field values:

```erb
<%= fieldwork_form_with model: @project, url: project_path(@project), local: true,
      baseline: @saved_attributes, submit_label: "Save project", class: "content-surface",
      cancel: project_path(@project), message: flash[:notice] do |form| %>
  <%= fieldwork_field form, :name, label: "Project name", required: true,
        maxlength: 80 %>
<% end %>
```

The application loads and authorizes `@project`, captures `@saved_attributes` from persisted values before assigning submitted attributes, and saves through its ordinary Rails controller. Supply only the edited fields in the baseline, using values matching the controls’ native representation. The name and length limit are illustrative application choices.

Edit is the helper’s default mode. Save and Discard become available when values differ from the saved baseline; Cancel navigates to the record. The installed Turbo form bridge owns initialization and cache cleanup. On failure, re-render attempted values and errors with the previous saved baseline; on success, render or redirect to confirmed saved values. Follow the [Rails response contract](../rails.md#form-responses-and-baselines).

For custom HTML or callback saving, use the [form controller contract](../elements/form-controller.md#default-markup). The editing behavior below applies to both paths.

## Make editing scope discoverable

Follow [record details](record-details.md#actions-and-editing) for placing and naming editing entry points, and its [history guidance](record-details.md#history) when past content is visible. Entry points can target sections of the same form; give the editor a clear scope and starting position.

For a small record with settings and related reviews, use the [integrated show/edit recipe](record-details.md#minimal-rails-showedit-recipe). It keeps the editor focused on its form and uses the existing spacing defaults without a panel or sidebar.

Keep routine editors focused on their fields and actions. A sidebar explaining standard Save/Discard/Cancel behavior adds little to repeated use; place useful consequences or constraints beside the field they affect. Preserve substantive record context, validation guidance and recovery instructions.

## Longer forms: group first, save together

Keep the title and editor on the continuous white page described by [page composition](application-layout.md#page-composition). The optional `.content-surface` class groups the form without adding a box or inset. Group related fields with `fieldset`/`legend` inside a [section stack](../elements/layout-primitives.md#continuous-page-sections), so one save scope reads as one continuous form. Use `fieldset.panel-section` only when the form is already an intentionally bounded [panel](../elements/panels.md). Use the [text input](../elements/inputs-and-textareas.md) and [choice control](../elements/choice-controls.md) contracts for the fields. Keep one action row when all fields save together; name independent save scopes explicitly.

Save persists the form; Discard restores the saved baseline in place; Cancel leaves. For errors across sections, use the [managed summary](../elements/form-controller.md#managed-error-summary) alongside inline errors.

If the editor contains other native submit actions, keep normal saving first in document order. The [action placement contract](../elements/form-controller.md#actions) supports one action row before the fields with its result feedback nearby.

## The editing loop

| State | Behavior |
| --- | --- |
| Unchanged | Show No unsaved changes. Save/Discard are unavailable unless unchanged submission is explicitly allowed. |
| Unsaved | Show Unsaved changes; enable Save/Discard. Reverting all edits returns to Unchanged. |
| Saving | Show progress and block conflicting actions. |
| Saved | Confirm success and advance the baseline. |
| Failed | Retain edits and baseline; explain recovery and allow retry/Discard. |
| Discarded | Restore baseline, clear errors, confirm, and return to Unchanged. |

Validate on submit; focus the first invalid field or opted-in summary. Editing invalid fields updates their errors. Save/Discard success focuses feedback when its initiating action becomes disabled. Announce state transitions rather than each keystroke.

After Discard, `fieldwork:discarded` permits synchronous updates to conditional visibility/constraints. See the [form API](../elements/form-controller.md#conditional-fields-after-discard).

## Leaving the editor

Use [unsaved-changes confirmation](../elements/confirmation.md) only when leaving would lose work. Failed saves still leave unsaved work. Distinguish leaving during a save from canceling it; applications own pending-save policy, protected transitions, and draft retention.

For Rails, follow the [scoped Cancel lifecycle](../elements/confirmation.md#rails-cancel-lifecycle) when that exit would lose work. The owning contract also defines the [native adapter](../elements/confirmation.md#guarding-a-native-cancel-link) and [broader navigation policy](../elements/confirmation.md#broader-navigation-and-browser-close). For broader protected transitions, opt into [Rails/Turbo draft protection](../rails.md#draft-protection). No navigation or browser-close guard is installed by default.
