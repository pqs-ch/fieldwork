# Application layout

Assets: [ui.css](../assets/fieldwork/ui.css).

Use the [application-layout pattern](../patterns/application-layout.md) for shell composition and navigation choices. This element owns the reusable structure and responsive behavior.

## Default markup

```html
<a class="skip-link" href="#main">Skip to content</a>
<div class="application-layout">
  <div class="application-layout-frame">
    <header class="application-layout-compact">
      <a class="brand" href="/projects"><span>Design studio</span></a>
      <div class="stack">
        <nav class="primary-navigation" aria-label="Compact workspace">
          <ul class="primary-navigation-list">
            <li><a href="/projects" aria-current="page"><span class="icon" data-icon="folder" aria-hidden="true"></span><span>Projects</span></a></li>
            <li><a href="/settings"><span class="icon" data-icon="settings" aria-hidden="true"></span><span>Settings</span></a></li>
          </ul>
        </nav>
      </div>
    </header>
    <aside class="application-layout-sidebar">
      <a class="brand" href="/projects"><span>Design studio</span></a>
      <nav class="primary-navigation" aria-label="Workspace">
        <ul class="primary-navigation-list">
          <li><a href="/projects" aria-current="page"><span class="icon" data-icon="folder" aria-hidden="true"></span><span>Projects</span></a></li>
          <li><a href="/settings"><span class="icon" data-icon="settings" aria-hidden="true"></span><span>Settings</span></a></li>
        </ul>
      </nav>
    </aside>
    <div class="application-layout-content">
      <main class="application-layout-main stack" data-gap="section" id="main" tabindex="-1">
        <header class="page-header">
          <div class="page-header-content">
            <div class="page-header-title"><h1>Projects</h1></div>
          </div>
        </header>
        <div class="content-surface stack">
          <!-- Compose related task sections and actions here. -->
        </div>
      </main>
      <footer class="application-layout-footer">Optional supporting links</footer>
    </div>
  </div>
</div>
```

## Structure and behavior

- The shell provides separate desktop and compact navigation regions around one content area. Navigation labels and IDs must remain distinct when both copies are rendered; follow [page navigation](page-navigation.md) for destination icons, labels, markup and state.
- Preserve the skip-link target and one main landmark. Application names, destinations and footer text are illustrative. The footer is optional.
- Navigation switches to the compact header at `50rem` container width or less. Direct links stay visible and wrap in document flow.
- Keep document scrolling; avoid fixed body heights or `overflow: hidden`. Use local scroll regions for wide tables/code, and add `.page` to the main area when a bounded width is needed.
- `.application-layout-sidebar` is the shell's application-navigation region. Page-level supporting sidebars use the separate [sidebar layout primitive](layout-primitives.md#grid-sidebar-and-split) inside main content.

### Default branding

Use the application name in the `.brand` home link in desktop and compact navigation. To include an application-owned mark, put it beside the name inside the link. Use `.brand-mark` to keep the image 24px high with its original aspect ratio, and set `alt=""` when the visible name labels the link.

### Workspace presentation

Fieldwork uses one compact presentation across all navigation compositions, following the [shared visual character](../foundations.md#visual-character).

- Compact shell and table spacing and a `0.875rem` workspace base size prioritize desktop working views. Keep the title and task body on one continuous white page, following [page composition](../patterns/application-layout.md#page-composition). Compose its sections with `.stack` or `.section-stack`; reserve panels for distinct bounded modules. Form controls retain their native semantics and editing behavior; table filter menus retain their own sizing and focus clearance.
- Coarse-pointer devices retain a minimum `2.75rem` control height and `1rem` form text. Use [formatted content](formatted-content.md) for readable authored text.
- The white working area continues through the page header, task body and outer gutters. Navigation uses a bright, nearly neutral cool-gray canvas background with a quiet divider beside the left rail. Deep blue identifies actions and current navigation, while small coral brand details add warmth. Horizontal primary navigation uses accent text and a bottom underline; vertical navigation uses accent text and a short left-edge marker, with sentence-case group captions and no filled active pill. Success, warning, danger and focus retain their semantic colors. See [palette overrides](../foundations.md#palette-overrides) for application branding.

Design and review desktop workflows first, following the [product priorities](../index.md#product-priorities). The supplied compact layout preserves navigation, local overflow and readable content; additional narrow-screen refinement is optional unless the project needs it. Top, left and combined navigation remain composition choices within the same presentation.

### Top-navigation variation

Set `data-navigation="top"` on `.application-layout` and replace the desktop sidebar with this header. Retain the compact header and content:

<!-- fieldwork:fragment -->

```html
<header class="application-layout-top">
  <div class="application-layout-top-inner">
    <a class="brand" href="/projects"><span>Northstar</span></a>
    <nav class="primary-navigation" data-orientation="horizontal" aria-label="Application areas">
      <ul class="primary-navigation-list">
        <li><a href="/projects" aria-current="page"><span class="icon" data-icon="folder" aria-hidden="true"></span><span>Projects</span></a></li>
        <li><a href="/workplace"><span class="icon" data-icon="building" aria-hidden="true"></span><span>Workplace</span></a></li>
        <li><a href="/people"><span class="icon" data-icon="users" aria-hidden="true"></span><span>People</span></a></li>
      </ul>
    </nav>
    <nav class="application-layout-tools" aria-label="Account">
      <a class="button" data-variant="quiet" href="/profile"><span class="icon" data-icon="user" aria-hidden="true"></span><span>Your account</span></a>
    </nav>
  </div>
</header>
```

The compact top bar gives the brand a subtle separator, direct navigation links a shared current state, and optional `.application-layout-tools` the remaining space at the end of the row. Its bottom border separates navigation from page content. Use ordinary links for destinations and buttons for actions.

Override `--width-workspace` on the layout to change the top layout's `72rem` maximum width. Set `style="--width-workspace: none"` for wide working views that use the available horizontal space. Bound individual reading/form content with [layout primitives](layout-primitives.md) as appropriate.

### Top bar and left navigation

The top bar can hold application areas while the left rail holds views in the selected workspace. Mark the containing top-level area with `aria-current="true"` and the exact left destination with `aria-current="page"`, following [page navigation](page-navigation.md). The same top bar can continue across areas that have no left rail.

Set `data-navigation="top-sidebar"` for a global header above left navigation and task content. Reuse `.application-layout-top` for global areas, workspace context or utilities; put the associated workspace destinations in `.application-layout-sidebar`. The markup below illustrates global utilities above application destinations. The global header scrolls with the document. The desktop sidebar fills the content row up to the viewport height and sticks at the viewport top as the document scrolls; longer navigation scrolls within it.

```html
<a class="skip-link" href="#workspace-main">Skip to content</a>
<div class="application-layout" data-navigation="top-sidebar">
  <div class="application-layout-frame">
    <header class="application-layout-top">
      <div class="application-layout-top-inner">
        <a class="brand" href="/projects"><span>Design studio</span></a>
        <nav class="cluster application-layout-tools" aria-label="Workspace tools">
          <a class="button" data-variant="quiet" href="/workspaces"><span class="icon" data-icon="building" aria-hidden="true"></span><span>Switch workspace</span></a>
          <a class="button" data-variant="quiet" href="/profile"><span class="icon" data-icon="user" aria-hidden="true"></span><span>Your account</span></a>
        </nav>
      </div>
    </header>
    <header class="application-layout-compact">
      <a class="brand" href="/projects"><span>Design studio</span></a>
      <div class="stack">
        <nav class="primary-navigation" aria-label="Compact workspace">
          <ul class="primary-navigation-list">
            <li><a href="/projects" aria-current="page"><span class="icon" data-icon="folder" aria-hidden="true"></span><span>Projects</span></a></li>
            <li><a href="/reports"><span class="icon" data-icon="file-text" aria-hidden="true"></span><span>Reports</span></a></li>
          </ul>
        </nav>
        <nav class="primary-navigation" aria-label="Compact workspace tools">
          <ul class="primary-navigation-list">
            <li><a href="/workspaces"><span class="icon" data-icon="building" aria-hidden="true"></span><span>Switch workspace</span></a></li>
            <li><a href="/profile"><span class="icon" data-icon="user" aria-hidden="true"></span><span>Your account</span></a></li>
          </ul>
        </nav>
      </div>
    </header>
    <aside class="application-layout-sidebar">
      <nav class="primary-navigation" aria-label="Workspace">
        <ul class="primary-navigation-list">
          <li><a href="/projects" aria-current="page"><span class="icon" data-icon="folder" aria-hidden="true"></span><span>Projects</span></a></li>
          <li><a href="/reports"><span class="icon" data-icon="file-text" aria-hidden="true"></span><span>Reports</span></a></li>
        </ul>
      </nav>
    </aside>
    <div class="application-layout-content">
      <main class="application-layout-main stack" data-gap="section" id="workspace-main" tabindex="-1">
        <header class="page-header">
          <div class="page-header-content">
            <div class="page-header-title"><h1>Projects</h1></div>
          </div>
        </header>
        <div class="content-surface stack">
          <!-- Compose related task sections and actions here. -->
        </div>
      </main>
    </div>
  </div>
</div>
```

At `50rem` container width or less, the desktop header and sidebar are hidden and the compact header is exposed. Include global utilities as well as application destinations in the compact markup; hiding the desktop header must not remove access to its functions. Keep direct links and utilities visible in the compact header, wrapping as needed. Generate equivalent desktop and compact controls from the same application-owned source, with unique IDs for any labels, fields, or menus. Account dropdowns follow their [own contract](action-dropdowns.md#account-menu).

The combined shell uses the available content width; bound individual pages or reading areas with [layout primitives](layout-primitives.md). Its global header spans the full shell. Keep document scrolling and the same skip-link/current-page/focus rules as the default layout; no additional JavaScript is required.
