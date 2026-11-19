# Error summaries

Assets: [ui.css](../assets/fieldwork/ui.css) · [error-summary.js](../assets/fieldwork/error-summary.js).

## Default markup

```html
<div class="stack" data-gap="section">
  <div class="error-summary" role="region" tabindex="-1" aria-labelledby="errors-title">
    <h2 id="errors-title">The review could not be saved</h2>
    <p>Correct these details and try again.</p>
    <ul><li><a href="#reviewer">Enter the reviewer's name.</a></li></ul>
  </div>
  <div class="field">
    <label for="reviewer">Reviewed by</label>
    <input id="reviewer" name="reviewer" required aria-invalid="true"
      aria-describedby="reviewer-error">
    <p class="field-error" id="reviewer-error">Enter the reviewer's name.</p>
  </div>
</div>
```

## Initialization and cleanup

```js
import { enhanceErrorSummary } from 'fieldwork/error-summary';
const controller = enhanceErrorSummary(document.querySelector('.error-summary'));
// Before removing/caching this view: controller.destroy();
```

## Behavior and variations

Render above fields after failed submission, retaining entered values and inline field errors. General errors without a field can be plain list items.

The optional helper focuses the summary on initialization. Links focus their controls. Keep invalid fields and their guidance visible. Use `{ focus: false }` when the application owns initial focus. `controller.focus()` focuses an updated summary; `destroy()` removes listeners and restores the original tabindex. Initialization is idempotent; reinitialize after replacement.

Applications supply validation and update/remove stale errors. For fixed-field `enhanceForm` forms, use the [managed summary](form-controller.md#managed-error-summary) without initializing a second summary controller. The form controller otherwise focuses the first invalid field.
