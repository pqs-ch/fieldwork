# Buttons and links

<a id="actions"></a>

Assets: [ui.css](../assets/fieldwork/ui.css).

## Default markup

```html
<button class="button" type="button">Run report</button>
```

## Behavior and variations

Use `.button` on native buttons or navigation links. `data-intent="primary"` marks the main action; `data-intent="danger"` marks destructive actions. `data-variant="quiet"` reduces emphasis. Use the [bundled icons](icons.md); icon-only controls need `data-icon-only` and a contextual accessible name.

Buttons share the single-line field height, padding and corner radius: 32px minimum height, 4px vertical/12px horizontal padding and a 6px radius at the default desktop size. Local component sizing and coarse-pointer defaults can increase or override the minimum. Primary actions use the solid accent; ordinary secondary actions keep a light outline, and quiet actions have no permanent border.

Prose links remain underlined. [Table navigation links](data-table.md#behavior-and-variations) use a quieter resting style with underlines on hover and keyboard focus. Focus outlines remain visible on both links and buttons.

### Intent and emphasis

```html
<button class="button" type="submit" data-intent="primary">Save changes</button>
<a class="button" data-variant="quiet" href="/settings">Cancel</a>
<a class="button" data-intent="danger" href="/records/123/delete">Delete record…</a>
```

Supply operation handlers, pending/duplicate prevention, and result feedback. Deletion requires [styled confirmation](deletion-confirmation.md).

### Availability and selected state

Use native `disabled` on unavailable operation buttons and explain a non-obvious restriction nearby. An unavailable destination can be plain text with its reason. Applications own pending state, duplicate prevention and the final outcome; a busy cursor alone does not prevent another request.

For a toggle action, keep the label stable and use `aria-pressed` to show its state:

```html
<button class="button" type="button" data-variant="quiet" aria-pressed="true">Show completed</button>
```

The application updates the state when the action succeeds. Quiet buttons retain readable intent colors and a visible selected fill; quiet emphasis does not erase the toggle state. Use [choice controls](choice-controls.md) for form values that save with other fields.
