# Panels

Assets: [ui.css](../assets/fieldwork/ui.css).

## When a bounded surface helps

Start page composition with semantic sections, headings and [layout primitives](layout-primitives.md). A subject or heading alone does not need a panel.

Use `.panel` when its visible boundary helps people understand a region as a distinct module—for example, independently operated or replaced content with its own controls or status, or supporting context that must remain distinct from the primary task. Tables and specialized elements own their documented surfaces.

Do not use panels merely to:

- separate consecutive page sections;
- fill the children of a grid or sidebar;
- wrap every field group in one save scope; or
- turn repeated records into cards when a list or table is easier to scan.

For ordinary related sections on one page, use a [continuous section stack](layout-primitives.md#continuous-page-sections) on the white page background. The title and body share that working area; the optional [content grouping](layout-primitives.md#shared-content-surface) adds no enclosure. Follow [page composition](../patterns/application-layout.md#page-composition) for intentional boundaries and specialized surfaces. Use spacing before adding dividers.

## Contained module markup

```html
<section class="panel" aria-labelledby="details-title">
  <header class="panel-header">
    <h2 id="details-title">Import status</h2>
    <span class="status-indicator">Needs attention</span>
  </header>
  <p>Three rows need correction before this import can continue.</p>
  <footer class="panel-footer">
    <a href="/imports/42/problems">Review problem rows</a>
  </footer>
</section>
```

## Behavior and variations

Once a bounded panel is warranted, add these parts as needed:

- `.panel-header`: a heading and optional description, with room for a separate action or status. Group heading/description in `.stack[data-gap="tight"]`.
- `.panel-body`: consistent spacing between content groups.
- `.panel-section`: an internal group. Adjacent sections receive a divider and spacing; use these inside the body rather than nesting bordered panels.
- `.panel-footer`: supporting information and actions, separated from the body. Items wrap naturally on small screens.

Inside an intentionally bounded form panel, use `fieldset.panel-section` with a legend for related controls. Forms in the shared task surface use ordinary fieldsets in a `.section-stack`. Keep editing Save/Discard controls in one `.form-actions` region for their save scope.

### Optional parts

```html
<section class="panel" aria-labelledby="account-title">
  <header class="panel-header">
    <div class="stack" data-gap="tight">
      <h2 id="account-title">Account details</h2>
      <p class="hint">Your personal account.</p>
    </div>
    <a href="/account/edit">Edit details</a>
  </header>
  <div class="panel-body">
    <div class="panel-section">
      <p><strong>Alex Morgan</strong></p>
      <p>alex@example.com</p>
    </div>
    <div class="panel-section">
      <h3>Organization</h3>
      <p>Acme Studio</p>
    </div>
  </div>
  <footer class="panel-footer">
    <p class="hint">Updated today</p>
    <a href="/account/history">View history</a>
  </footer>
</section>
```

## Action panels

```html
<section class="action-panel" aria-labelledby="review-title">
  <div class="action-panel-content">
    <h2 class="action-panel-title" id="review-title">Review imported rows</h2>
    <p class="action-panel-description">Three rows need correction before this import can continue.</p>
  </div>
  <div class="action-panel-actions">
    <a class="button" data-intent="primary" href="/imports/42/problems">Review 3 rows</a>
  </div>
</section>
```

Use an action panel when pending work needs a short explanation and a specific next action. It uses a compact white surface, an accent edge and a section-sized heading. Describe the actual work and consequence.

Keep routine actions and related destinations in the page header, toolbar or task footer. An ordinary link to another view does not need an action panel. Avoid oversized promotional headings, large tinted banners and invitation copy in working views.
