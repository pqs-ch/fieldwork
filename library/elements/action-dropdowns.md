# Action dropdowns

Assets: [ui.css](../assets/fieldwork/ui.css) · [action-dropdown.js](../assets/fieldwork/action-dropdown.js).

## Default markup

```html
<div class="action-dropdown">
  <button class="button" type="button" popovertarget="project-actions"
    aria-label="Actions for Website refresh">Actions</button>
  <div class="action-menu" id="project-actions" popover="auto"
    role="group" aria-label="Website refresh actions">
    <ul>
      <li><a class="action-item" href="/projects/123/edit">Edit details</a></li>
      <li><button class="action-item" type="button">Request download</button></li>
      <li class="action-separator">
        <a class="action-item" data-intent="danger" href="/projects/123/delete">Delete project…</a>
      </li>
    </ul>
  </div>
</div>
```

## Initialization and cleanup

Optional JavaScript anchors the popover and supplies keyboard navigation, dismissal, and focus recovery.

```js
import { enhanceActionDropdown } from 'fieldwork/action-dropdown';
const root = document.querySelector('.action-dropdown');
const controller = enhanceActionDropdown(root);
// Before removing/caching this view: controller?.destroy();
```

Initialization is idempotent. `controller.close()` dismisses the dropdown; `destroy()` closes it, removes listeners, and restores modified attributes/styles. Initialize replacement roots through the application's lifecycle; the Turbo form bridge does not initialize dropdowns.

## Usage

- Group secondary actions for one record, view, or selection; keep frequent actions visible.
- Use unique popover IDs and contextual trigger labels. Apply `.action-item` to native links/buttons, `disabled` to unavailable buttons, and `.action-separator` to a list item starting another group.
- Replace example URLs and supply operation handlers. Deletion opens [styled confirmation](deletion-confirmation.md) before the operation.
- For table bulk actions, follow the [selection contract](row-selection.md#behavior-and-variations), including shared scope and availability hooks.

Without JavaScript, native popovers remain usable. Without Popover API support, actions display inline and enhancement returns no controller. Supports one action level; nested menus and typeahead are not supplied.

## Account menu

```html
<div class="action-dropdown account-menu">
  <button class="button" data-variant="quiet" type="button"
          popovertarget="personal-account" aria-label="Account for Alex Morgan">
    <span class="account-menu-name">Alex Morgan</span>
  </button>
  <div class="action-menu" id="personal-account" popover="auto">
    <a class="action-item" href="/profile">Your profile</a>
    <form action="/session/logout" method="post">
      <!-- Application-owned CSRF token and session endpoint. -->
      <button class="action-item" type="submit">Sign out</button>
    </form>
  </div>
</div>
```

Initialize the account-menu root with the same optional enhancement and lifecycle:

```js
import { enhanceActionDropdown } from 'fieldwork/action-dropdown';
const account = enhanceActionDropdown(document.querySelector('.account-menu'));
// Before removing or caching the root: account?.destroy();
```

Replace the identity, contextual trigger label, URLs, and CSRF token. Sign out uses a CSRF-protected POST; client navigation follows confirmed success.
