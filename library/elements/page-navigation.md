# Page navigation

Assets: [ui.css](../assets/fieldwork/ui.css).

Follow the [application-layout pattern](../patterns/application-layout.md#navigation) for choosing the shell and separating global, application, and local scopes. This contract owns primary and section navigation markup, current-page state, and native behavior.

## Primary navigation

```html
<nav class="primary-navigation" aria-label="Workspace">
  <ul class="primary-navigation-list">
    <li><a href="/work"><span class="icon" data-icon="list-todo" aria-hidden="true"></span><span>Work queue</span></a></li>
  </ul>
  <div>
    <p class="primary-navigation-label" id="work-navigation-label">Work</p>
    <ul class="primary-navigation-list" aria-labelledby="work-navigation-label">
      <li><a href="/projects" aria-current="page"><span class="icon" data-icon="folder" aria-hidden="true"></span><span>Projects</span></a></li>
      <li><a href="/reports"><span class="icon" data-icon="file-text" aria-hidden="true"></span><span>Reports</span></a></li>
    </ul>
  </div>
</nav>
```

Use visible destination labels. Groups are optional; connect each `.primary-navigation-label` to its list using a unique ID and `aria-labelledby`. Mark the displayed page with `aria-current="page"`. Use `aria-current="true"` for the containing application area on a deeper record or task page, including when local navigation in a combined shell represents the exact page. Leave unrelated links unmarked. Both current states receive the shared selected styling.

Pair main destination labels with a recognizable [bundled icon](icons.md). Navigation uses a compact 16px icon beside its 14px label, with a small gap; account utilities use the same treatment. Keep the icon decorative and the text visible; Rails can use `fieldwork_icon` in the same position. Icons inherit the link color, including current, hover and focus states. Use the same icon for a destination in desktop and compact navigation. Choose stable meanings such as a folder for Projects, a task list for Work queue, and people for People. Plain text links remain supported.

Vertical navigation uses muted sentence-case group captions and 40px minimum rows at the default desktop size, with a 12px icon/label gap and 4px between rows. Groups separate through spacing rather than rules. The current item has accent text and a short 2px left-edge marker, without a permanent filled background. Hover adds a subtle neutral surface; keyboard focus retains its own outline. Captions align with the icons, and long labels wrap within the rail. Coarse-pointer targets retain the larger shared control height.

### Horizontal navigation

Set `data-orientation="horizontal"` on `.primary-navigation` for a short row of direct links, including the application top bar. Links wrap when needed. The current item uses accent text and a 3px bottom underline with no filled background. Every link reserves the underline space and uses the same label weight, so changing selection does not shift the items. Hover adds a subtle background; keyboard focus has a separate outline. The vertical list uses its short left selection marker. Group labels belong to vertical navigation.

As a direct child of `.application-layout-top-inner`, horizontal navigation stretches through the bar's vertical padding so the underline meets its bottom edge. In standalone or wrapped navigation, it follows the bottom of the item's row. Keep the existing native anchors and `aria-current` values; this presentation requires no JavaScript.

### Compact navigation

```html
<div class="stack">
  <nav class="primary-navigation" aria-label="Workspace">
    <ul class="primary-navigation-list">
      <li><a href="/projects" aria-current="page"><span class="icon" data-icon="folder" aria-hidden="true"></span><span>Projects</span></a></li>
      <li><a href="/people"><span class="icon" data-icon="users" aria-hidden="true"></span><span>People</span></a></li>
    </ul>
  </nav>
</div>
```

Keep navigation visible in the compact layout. Use wrapping direct links and clear groups rather than hiding destinations behind an extra control. The surrounding layout decides when to offer compact navigation.

## Section navigation

Follow [record details](../patterns/record-details.md#related-information) for organizing a record's related sections.

```html
<nav class="section-navigation" aria-label="Record sections">
  <ul>
    <li><a href="/records/42" aria-current="page"><span class="section-navigation-label">Overview</span></a></li>
    <li><a href="/records/42/items"><span class="section-navigation-label">Items</span><span class="badge">24<span class="visually-hidden"> total</span></span></a></li>
    <li><a href="/records/42/activity"><span class="section-navigation-label">Activity</span></a></li>
  </ul>
</nav>
```

Use for page destinations within one record or task. Mark the selected section with `aria-current="page"`; descendant pages keep their parent section current. Optional badges must explain what they count; omit unknown counts rather than reporting zero. Keep the section label when omitting a badge.

## Shared usage

- Give navigation landmarks distinct names. Use native anchors and ordinary lists; do not add menu/tab roles, arrow-key handlers, or roving tab stops.
- Update current state and counts after confirmed navigation or data changes. Do not fetch all sections to make them behave like tabs.
- If rendering separate desktop and compact copies, use unique IDs and expose only the appropriate copy. Generate both from the same application-owned destinations.
- Applications own URLs, permissions, routing, loading, draft protection, and focus/scroll after client navigation.
