# Layout primitives

<a id="layouts"></a>

Assets: [ui.css](../assets/fieldwork/ui.css).

## Default markup

```html
<div class="stack" data-gap="section">
  <header class="page-header">
    <div class="page-header-content">
      <div class="page-header-title"><h1>Settings</h1></div>
      <p class="page-header-description">Manage this workspace.</p>
    </div>
  </header>
  <div class="content-surface stack">
    <section class="stack" aria-labelledby="workspace-title">
      <h2 id="workspace-title">Workspace details</h2>
      <p>Current values for this workspace.</p>
      <a class="button" href="/settings/edit">Edit settings</a>
    </section>
    <section class="stack" aria-labelledby="access-title">
      <h2 id="access-title">Access</h2>
      <p>People with access to this workspace.</p>
      <a href="/settings/people">Manage access</a>
    </section>
  </div>
</div>
```

## Behavior and variations

Use `.stack` vertically and `.cluster` for wrapping rows. `data-gap="tight"` or `"section"` changes spacing. The page header and task body share the white page background; layout classes arrange content without adding a box.

### Spacing and grouping

Headings and paragraphs have their browser margins reset. Give each group an explicit layout. The page or application main area supplies outer padding; `.stack`, `.cluster` and `.section-stack` space its contents without another inset.

- Use `.stack[data-gap="tight"]` (8px at the default root size) within a heading/description or metadata group.
- Use `.stack` (16px) between related blocks, and `data-gap="section"` (24px) between task regions or field groups.
- Use `.cluster` for wrapping actions and links, with a 12px gap. Use the [page header](page-headers.md) parts for title, context and page actions.
- Use `.section-stack` when related sections benefit from dividers; it supplies 32px on either side of internal boundaries. Avoid adding a stack gap to the same divided sections.

Apply the layout to the immediate parent of the items being spaced. A stack around a wrapper does not space that wrapper’s children. Components own their documented internal gaps; compose their outer spacing with these primitives. Lists can use `.stack` to space entries while retaining native list markers and indentation. Check long wrapped content and visible errors at desktop working widths; keep the gap within a group smaller than the gap to the next group. Review narrow layouts when that presentation is in scope.

[Breadcrumbs](breadcrumbs-and-pagination.md#behavior-and-variations) have no outer margin, so the chosen parent gap also determines breadcrumb/title separation. A tight stack stays at 8px without a scoped margin override.

### Shared content surface

```html
<div class="content-surface">
  <div class="section-stack">
    <section class="stack" aria-labelledby="overview-title">
      <h2 id="overview-title">Overview</h2>
      <p>Current project information.</p>
    </section>
    <section class="stack" aria-labelledby="delivery-title">
      <h2 id="delivery-title">Delivery</h2>
      <p>Current delivery information.</p>
    </section>
  </div>
</div>
```

The page title and main task body share one continuous white working area, following [page composition](../patterns/application-layout.md#page-composition). `.content-surface` is an optional task-body grouping with minimum-width and text-wrapping protection; it adds no background, border, radius or padding. Existing forms and wrappers can retain it. Compose closely related sections, guidance, feedback and actions with layout primitives, keeping their left edge aligned with the page header. Do not add a wrapper solely to create a surface. Use a [panel](panels.md) when an independent module needs a visible boundary. A deliberately bounded document or standalone task should include its title within that boundary.

### Continuous page sections

```html
<div class="section-stack">
  <section class="stack" aria-labelledby="summary-title">
    <h2 id="summary-title">Summary</h2>
    <p>The work is ready for review.</p>
  </section>
  <section class="stack" aria-labelledby="activity-title">
    <h2 id="activity-title">Recent activity</h2>
    <ol><!-- Recorded events --></ol>
  </section>
</div>
```

Use `.section-stack` for related sibling sections that should read as one continuous page. It separates direct children with spacing and a divider within the shared task surface. Each child owns its semantic element, heading and internal layout. Prefer this to giving every section a separate surface.

### Grid, sidebar, and split

```html
<div class="grid">
  <section class="stack" aria-labelledby="delivery-title">
    <h2 id="delivery-title">Delivery</h2>
    <p>Current delivery information.</p>
  </section>
  <section class="stack" aria-labelledby="ownership-title">
    <h2 id="ownership-title">Ownership</h2>
    <p>Current ownership information.</p>
  </section>
</div>

<div class="sidebar-layout" data-divider>
  <div class="section-stack">
    <section class="stack" aria-labelledby="project-title">
      <h2 id="project-title">Project</h2>
      <p>Main task content.</p>
    </section>
  </div>
  <aside class="stack" aria-labelledby="context-title">
    <h2 id="context-title">Context</h2>
    <p>Supporting information.</p>
  </aside>
</div>

<div class="split">
  <div class="stack" data-gap="tight">
    <h2>Project settings</h2>
    <p class="hint">Manage project details and access.</p>
  </div>
  <div class="cluster">
    <a class="button" href="/project/edit">Edit settings</a>
  </div>
</div>
```

| Class | Layout |
| --- | --- |
| `.grid` | Equal-width columns with a `16rem` target minimum; wraps to fit. |
| `.sidebar-layout` | Exactly two children, main first and supporting second; stacks when space is insufficient. Wrap multiple sections in a `div` per area. Keep both areas in the continuous page flow; add `data-divider` when the supporting region needs clearer separation. |
| `.split` | Two groups at opposite ends of a wrapping row; nest `.cluster` for related actions. |

All support `data-gap="tight"` and `"section"`. Add `data-width="wide"` to `.page` for a maximum `72rem` workspace. Layout classes arrange their children but do not imply a surface. Use a [panel](panels.md) only when a visible boundary communicates a distinct module or context.

`.sidebar-layout` is a page-level composition, independent of the application shell's navigation sidebar. It keeps the task first in document order and places supporting content after it when stacked. Follow the [application-layout pattern](../patterns/application-layout.md#page-composition) for deciding whether supporting content belongs alongside the task. Use an `aside` for complementary information; ordinary sections or labeled navigation suit other content roles.

With `data-divider`, the supporting child has an inline divider when the two areas fit side by side. The divider moves above that child when the layout stacks, with spacing before and after the boundary so the main task and supporting content remain distinct on narrow containers.
