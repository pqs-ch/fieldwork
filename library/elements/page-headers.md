# Page headers

Assets: [ui.css](../assets/fieldwork/ui.css).

Follow [application layout](../patterns/application-layout.md#page-composition) for screen placement and [record details](../patterns/record-details.md#identity-and-key-facts) for record identity and actions. This element owns the header's markup and optional parts.

## Default markup

```html
<header class="page-header">
  <div class="page-header-content">
    <div class="page-header-title"><h1>Settings</h1></div>
  </div>
</header>
```

## Behavior and variations

Add context and actions only when needed. Form Save/Discard controls normally remain with the form. Place the header and task body in `.stack[data-gap="section"]` to keep a consistent gap. Both share the white page background and alignment, following [page composition](../patterns/application-layout.md#page-composition). When a document or standalone task has an intentional outer boundary, include its title inside it.

Do not autofocus the title on ordinary page entry or navigation. Headings can remain explicit anchor or recovery targets when the task needs them; use `tabindex="-1"` for those targets without adding them to the normal Tab order. Follow the [application focus guidance](../patterns/application-layout.md#keyboard-entry-and-optional-compact-layouts).

### Optional context and actions

```html
<header class="page-header">
  <div class="page-header-content">
    <div class="page-header-title">
      <h1>Website refresh</h1>
      <span class="status-indicator">In progress</span>
    </div>
    <p class="page-header-description">Make our services easier to find and use.</p>
    <ul class="page-header-meta">
      <li>Owner: Alex Morgan</li>
      <li>Due: <time datetime="2026-10-30">30 October 2026</time></li>
    </ul>
  </div>
  <div class="page-header-actions">
    <a class="button" href="/projects/123/activity">View activity</a>
    <a class="button" data-intent="primary" href="/projects/123/edit">Edit project</a>
  </div>
</header>
```

### Parts and composition

- `.page-header-description`: supporting explanation.
- `.page-header-meta`: supporting facts; use [local timestamps](local-timestamps.md) for instants.
- `.page-header-actions`: view actions; use an [action dropdown](action-dropdowns.md) for secondary actions when needed.

An optional `.eyebrow`, [breadcrumb or plain parent link](breadcrumbs-and-pagination.md#behavior-and-variations) can precede the title inside `.page-header-content`. The header content owns their 8px separation; breadcrumbs add no extra bottom margin. Use status indicators for record state and badges for counts.
