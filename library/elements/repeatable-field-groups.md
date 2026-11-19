# Repeatable field groups

Assets: [ui.css](../assets/fieldwork/ui.css) · [repeatable-group.js](../assets/fieldwork/repeatable-group.js).

## Default markup

```html
<div data-repeatable-group data-repeat-label="Contact" data-repeat-max="20">
  <p class="hint">Add up to 20 contacts.</p>
  <div class="repeatable-list" data-repeat-list>
    <fieldset class="repeatable-item" data-repeat-item data-repeat-key="0">
      <legend data-repeat-title>Contact 1</legend>
      <div class="field">
        <label for="contact-0-name">Name</label>
        <input id="contact-0-name" name="contacts[0][name]" required>
      </div>
      <div class="field">
        <label for="contact-0-email">Email (optional)</label>
        <input id="contact-0-email" name="contacts[0][email]" type="email">
      </div>
      <button type="button" class="button" data-repeat-remove disabled>Remove contact</button>
    </fieldset>
  </div>
  <template data-repeat-template>
    <fieldset class="repeatable-item" data-repeat-item>
      <legend data-repeat-title>Contact</legend>
      <div class="field">
        <label for="contact-__KEY__-name">Name</label>
        <input id="contact-__KEY__-name" name="contacts[__KEY__][name]" required>
      </div>
      <div class="field">
        <label for="contact-__KEY__-email">Email (optional)</label>
        <input id="contact-__KEY__-email" name="contacts[__KEY__][email]" type="email">
      </div>
      <button type="button" class="button" data-repeat-remove disabled>Remove contact</button>
    </fieldset>
  </template>
  <button type="button" class="button" data-repeat-add disabled>Add contact</button>
</div>
```

## Initialization and cleanup

```js
import { enhanceRepeatableGroup } from 'fieldwork/repeatable-group';
const root = document.querySelector('[data-repeatable-group]');
const controller = enhanceRepeatableGroup(root);
// Before removing/caching this view: controller.destroy();
```

## Supported scope

Draft fieldsets inside an application-owned form. No nested repeaters, reordering, standalone native-reset list restoration, built-in file serialization or Rails `_destroy` handling. Use the [mixed-form composition](form-controller.md#mixed-forms) for coordinated Save/Discard alongside ordinary fields and file queues; it owns this controller.

## Behavior and variations

The helper manages Add/Remove availability, numbered headings, unique template keys, focus, and status announcements. Applications own native/Turbo multipart submission, validation, and server limits.

For short records in an existing task surface, add `data-density="compact"` to `.repeatable-list` to separate entries with dividers instead of boxes. Inside each fieldset, `.repeatable-item-fields` places the main field, shorter fields and Remove action together when space allows and wraps them when needed. Keep the numbered legend and every field label; use the default stacked layout for longer records or substantial guidance. A quiet Remove button reduces repeated visual emphasis without hiding the action.

### Markup requirements

| Part | Requirement |
| --- | --- |
| Structure | One list, one template with a single item root, and an Add button. |
| Template identity | Unique IDs containing `__KEY__`; use the same token in `for`, ARIA references, and indexed field names. Prefix IDs per group. |
| Existing entries | Render their keys in `data-repeat-key`. |
| Actions | Native `type="button"` Add/Remove controls, initially disabled until enhancement. The helper owns their availability. |
| Initial count | Within the configured min/max. Initial fields remain usable without JavaScript. |
| Status | Optional `[data-repeat-status]`; otherwise a polite status region is generated. |

Tokens are replaced in attributes, never application text; generated keys avoid existing document IDs. Display titles can change their numbers, but existing keys and field names are never renumbered. Untouched field/file values survive additions and removals.

### Limits

| Attribute | Default |
| --- | --- |
| `data-repeat-min` | `0` |
| `data-repeat-max` | No client limit |

Show configured minimum/maximum limits beside the group so disabled Add/Remove controls have an understandable reason. The application enforces server limits independently. Use [file selection](attachments.md#adding-attachments) for upload queues; repeatable field groups alone do not serialize files.

### Adding, removing, and focus

- Add focuses the first enabled field in the new entry.
- Remove asks for shared styled confirmation using Remove wording for the draft entry. Cancel preserves every value. No second confirmation API is needed. Native server actions use an application-owned confirmation page and retain the other draft fields; removing a draft row must not implicitly save the form.
- Confirmed removal of a focused entry moves focus to the next entry, then previous, then Add when empty. Other entries retain values, IDs, and focus.

### Events

All events bubble from the group.

| Event | Contract |
| --- | --- |
| `fieldwork:repeat-before-remove` | Cancelable; prevent it to veto removal or apply a persisted-record policy before shared confirmation. |
| `fieldwork:repeat-added` | `detail: { item, key }` for application setup. |
| `fieldwork:repeat-restored` | `detail: { items, removed }` after restoring an in-memory baseline; clean up enhancements on detached `removed` rows and remount restored `items` as needed. |
| `fieldwork:repeat-removed` | `detail: { item, key }` for application cleanup. |

### Lifecycle

Initialization is idempotent. `destroy()` removes listeners and restores button availability/accessible names; added fields remain in the DOM. Reinitialize after replacement or cache restoration.

### Composition API

`setBusy(boolean)` blocks Add/Remove, including pending confirmation completion. `captureState()` returns an opaque in-memory snapshot of this controller's row nodes and native values; `restoreState(state)` restores only a snapshot from the same live controller. `baselineState` uses `template[data-repeat-baseline]` when supplied, otherwise the initially rendered rows. These operations do not persist drafts or delete server records. The mixed form owns them when composed; use the [form baseline contract](form-controller.md#saved-row-baseline-after-a-server-response) instead of coordinating resets independently.
