# Choice controls

<a id="choices"></a>

Assets: [ui.css](../assets/fieldwork/ui.css).

## Default markup

### Checkboxes

Choose any number of independent options.

```html
<fieldset class="stack" data-gap="tight">
  <legend>Delivery channels</legend>
  <label class="check"><input type="checkbox" name="email_updates" value="yes">Email</label>
  <label class="check"><input type="checkbox" name="in_app_updates" value="yes">In-app</label>
</fieldset>
```

<a id="single-choice-and-onoff-settings"></a>

### Selects

Choose one option from a compact list. Use [searchable select](searchable-select.md) when finding an option needs search.

For table filtering, follow the [data-table pattern](../patterns/tables.md#recommended-default) to choose the interaction before choosing individual controls.

```html
<div class="field">
  <label for="digest">Digest frequency</label>
  <select id="digest" name="digest">
    <option value="daily">Daily</option><option value="weekly">Weekly</option>
  </select>
</div>
```

Single-select fields share the [text field](inputs-and-textareas.md) and button height, padding and corner radius. They use a shared chevron with reserved text space and a consistent inset. Native selection and keyboard behavior remain intact. The chevron remains visible on disabled fields and moves to the inline end for right-to-left text. Multi-selects and visible listboxes keep their native presentation; forced-colors mode restores the native dropdown arrow.

### Radios

Choose one option from a visible group. Keep the same `name` for every radio in the group.

```html
<fieldset class="stack" data-gap="tight">
  <legend>Visibility</legend>
  <label class="check"><input type="radio" name="visibility" value="team" checked>Team</label>
  <label class="check"><input type="radio" name="visibility" value="private">Private</label>
</fieldset>
```

### Switches

Use for one on/off setting. Keep the label stable; the application decides when to save changes.

```html
<label class="switch"><input type="checkbox" name="enabled" value="yes">Notifications enabled</label>
```

## Grouping and availability

Keep each option label close to its control and use a tight stack between choices. Checkboxes and switches retain the shared control height so adjacent options remain easy to distinguish and click.

Use native `disabled` on unavailable controls. Wrapper labels and separate labels both receive the unavailable styling. Explain a restriction beside the group when its reason is useful; do not make someone submit to discover that a choice is unavailable. Use visible hints for consequences or dependencies, and keep the selected values after failed submission.
