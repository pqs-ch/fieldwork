# Pattern: application layout

## Recommended default

Give the application a consistent shell around its task content. Keep navigation, page identity, and the current task easy to distinguish. Reuse the shell across screens so each page can focus on its own workflow.

Use Fieldwork's compact defaults and [shared visual character](../foundations.md#visual-character), optimizing desktop working space, clear task flows and discoverable functionality. Follow the [product priorities](../index.md#product-priorities) when deciding where to spend design and review effort.

Use the [application-layout element](../elements/application-layout.md) for shell markup and responsive behavior. Compose its contents from the navigation and page elements below; the application supplies its name, destinations, permissions and routing. Use the application name as the home link, following [default branding](../elements/application-layout.md#default-branding).

## Navigation

Keep primary navigation for application areas and section navigation for separate pages within a record or task. Use [page navigation](../elements/page-navigation.md) for their markup and current-page state. Keep available destinations and their order consistent across desktop and compact navigation, using the same application-owned source.

### Choose the shell

First identify the scopes: global context and utilities (workspace switching, account, application-wide search), application areas, pages within an area or record, and supporting tools for the current task. Give each scope a clear home. Preserve an established shell when extending an application unless the requested work demonstrates a need to change it.

| Composition | Recommended when | Space and scope |
| --- | --- | --- |
| [Top navigation](../elements/application-layout.md#top-navigation-variation) | Default when the application areas fit comfortably in one row with recognizable labels. | Preserves horizontal room for tables and editors; check that real labels fit comfortably. |
| [Left navigation](../elements/application-layout.md#default-markup) | A workspace benefits from persistent, grouped views, hierarchy or longer labels that people scan and switch between repeatedly. | Gives destinations persistent scanning space, at the cost of content width. |
| [Global top bar and left navigation](../elements/application-layout.md#top-bar-and-left-navigation) | Application areas need a global home while the current workspace has its own frequently used views; or global utilities accompany grouped application areas. | Top bar owns global scope; left navigation owns the current workspace views or grouped application destinations. Give the two levels distinct destinations. |
| Contextual sidebar alongside any shell | Supporting information or tools need to remain beside the current task. | Uses page-level space; include only when the task benefits from simultaneous access. |

Start with top navigation when the application areas fit: preserving width benefits tables, forms and editors. Add left navigation where a workspace needs a persistent, scannable set of views. Frequent switching is served by visible direct links in either position; grouping and hierarchy are the stronger reasons for a left rail. Choose from actual labels, switching needs, and available task space rather than a fixed number of links. A workspace switcher or account action alone does not require another navigation region.

Before settling on a shell, check a demanding screen: a wide comparison table, a long form, or an editor. Keep comparison content wide and reading/form content appropriately bounded. Every extra navigation region must serve a distinct scope and leave sufficient working room. Combine global navigation and contextual sidebars only when both provide useful simultaneous access. Keep primary placement, names, and order stable across routes; local navigation and supporting tools may vary with the task.

In a combined shell, keep the selected application area marked in the top bar while the left rail identifies the exact workspace view. The left rail can change with the area; retain the top bar and its destination order. Use [section navigation](../elements/page-navigation.md#section-navigation) for a small set of routes within an area or record, and [tabs](../elements/tabs.md) for sections already present in one view. Keep these near their page context rather than adding them to global navigation. The chosen composition should have a short, task-based rationale; it does not need an explanation in the product UI.

When choosing a destination is the page's task, use [destination cards or lists](../elements/destination-navigation.md) in the main content. Add an [account menu](../elements/action-dropdowns.md#account-menu) when account actions need a consistent home.

## Page composition

Use one main content region with a clear [page header](../elements/page-headers.md). Keep the title and task context together, with relevant page actions nearby. Place optional [breadcrumbs](../elements/breadcrumbs-and-pagination.md#breadcrumbs) before the title within the header content when ancestry helps orientation.

Group the page header and task body in `.stack[data-gap="section"]` on one continuous white working area. Align their outer edges and let the page or application main area supply the padding. The optional [content grouping](../elements/layout-primitives.md#shared-content-surface) adds no enclosure. Keep closely related content, local guidance, feedback and task actions in this flow. Use headings and spacing for its structure, and a [section stack](../elements/layout-primitives.md#continuous-page-sections) when sibling sections benefit from dividers. Tables keep their internal header shading, row separators and controls without an outer box. Use a [panel](../elements/panels.md) only for a distinct bounded module, not for every meaningful group or layout child. For a deliberately bounded document or standalone task, include its title within the same boundary. Keep local actions and feedback with the content they affect; form actions follow the [creation](creation.md) or [editing](editing.md) pattern. Add a footer only when it has useful supporting content.

A contextual sidebar belongs inside the main page, independently of the shell's left navigation. Use the existing [main-first sidebar layout](../elements/layout-primitives.md#grid-sidebar-and-split) for a task with supporting details, an outline, or an inspector. Keep essential actions with the main task; supporting content follows it when the layout stacks. Do not add a sidebar just to fill available space.

Use [record details](record-details.md) when the page centers on one record and its related information.

## Keyboard entry and optional compact layouts

Use the existing compact layout when needed; additional narrow-screen refinement is secondary to the desktop workflow. Preserve destinations, global utilities, and task context as the shell adapts. Keep compact navigation links visible and wrapping; group destinations clearly when there are many. Let supporting sidebars stack after the task. Show useful supporting content directly or link to a dedicated page. Keep wide content in local scroll regions so it does not displace the whole page. When compact-layout work is in scope, review the actual container and long labels.

Keep a skip link to the main content, distinct navigation labels, and an accurate current-page marker. After client navigation, update the page identity and move focus to a useful destination before hiding navigation that contains focus. Follow the [navigation behavior](../elements/page-navigation.md#shared-usage); the application owns route focus, scroll, and draft protection.

Leave ordinary page entry and history focus/scroll restoration to the browser; do not autofocus the page title or main region on every mount or visit. Opt into initial field focus only for a dedicated entry task where immediate typing is expected. Preserve deliberate focus for validation errors, save acknowledgements, dialogs, explicit anchor navigation and recovery after a focused control is removed. Do not move focus merely because content remounts, and keep visible focus on controls.
