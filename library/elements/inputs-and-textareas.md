# Text inputs and textareas

<a id="text-entry"></a>

Assets: [ui.css](../assets/fieldwork/ui.css).

## Default markup

### Text inputs

```html
<div class="field">
  <label for="contact-email">Email</label>
  <input id="contact-email" name="email" type="email" required
    aria-describedby="contact-email-hint">
  <p class="hint" id="contact-email-hint">Use an address you check regularly.</p>
</div>
```

## Behavior and variations

Associate hints/errors with `aria-describedby` and mark invalid controls with `aria-invalid="true"`. Retain values after failed submission.

Single-line fields share the [button](buttons-and-links.md) and select sizing: a 32px minimum height, 4px vertical/12px horizontal padding and a 6px radius at the default desktop size. Textareas retain a taller multiline region and normal prose line spacing. Control boundaries remain stronger than passive table dividers; hover, focus, invalid, readonly and disabled states keep distinct styling.

For money, percentages and quantities, follow [business values](business-values.md).

For native date/date-time controls, explicit timezones and clock-change recovery, follow [dates, times and timezones](date-and-time.md).

### Textareas

Use for multiline plain text.

```html
<div class="field">
  <label for="project-description">Description (optional)</label>
  <textarea id="project-description" name="description" rows="4"
    aria-describedby="project-description-hint"></textarea>
  <p class="hint" id="project-description-hint">Explain the purpose of this project.</p>
</div>
```

### Server-rendered error

```html
<div class="field">
  <label for="contact-name">Name</label>
  <input id="contact-name" name="name" value="" required
    aria-invalid="true" aria-describedby="contact-name-error">
  <p class="field-error" id="contact-name-error">Enter a name.</p>
</div>
```
