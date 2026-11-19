# Destination navigation

Assets: [ui.css](../assets/fieldwork/ui.css).

Choose cards for independent destination summaries and lists for compact destination choices. Use [page navigation](page-navigation.md) for application areas or record/task sections.

## Navigation cards

### Default markup

```html
<a class="navigation-card" href="/settings/notifications"
   aria-labelledby="notifications-card-title"
   aria-describedby="notifications-card-description">
  <h2 class="navigation-card-title" id="notifications-card-title">Notifications</h2>
  <p class="navigation-card-description" id="notifications-card-description">
    Choose which updates you receive and how often.
  </p>
</a>
```

Descriptions and `.navigation-card-meta` are optional. Arrange cards with [layout primitives](layout-primitives.md). A whole-card link must not contain other interactive controls.

### Multiple actions

Use a non-interactive container with explicit links/buttons when there is more than one action:

```html
<article class="navigation-card" aria-labelledby="studio-card-title">
  <h2 class="navigation-card-title" id="studio-card-title">Design studio</h2>
  <p class="navigation-card-description">Shared projects and resources for the design team.</p>
  <p class="navigation-card-meta">8 members · 3 active projects</p>
  <div class="navigation-card-actions">
    <a href="/workspaces/studio">Open workspace<span class="visually-hidden">: Design studio</span></a>
    <a href="/workspaces/studio/members">Manage members<span class="visually-hidden">: Design studio</span></a>
  </div>
</article>
```

## Navigation lists

### Default markup

```html
<ul class="navigation-list">
  <li>
    <a href="/settings/notifications" aria-labelledby="delivery-title" aria-describedby="delivery-description">
      <span class="navigation-list-content">
        <span class="navigation-list-title" id="delivery-title">Notifications</span>
        <span class="navigation-list-description" id="delivery-description">Choose which updates you receive.</span>
      </span>
      <span class="navigation-list-indicator" aria-hidden="true">→</span>
    </a>
  </li>
</ul>
```

Descriptions and direction indicators are optional; omit `aria-describedby` when omitting the description. Each row has one destination, without nested controls. Group related destinations under named headings.
