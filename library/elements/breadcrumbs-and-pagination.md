# Breadcrumbs and pagination

<a id="navigation"></a>

Assets: [ui.css](../assets/fieldwork/ui.css).

## Default markup

### Breadcrumbs

```html
<nav class="breadcrumbs" aria-label="Breadcrumb">
  <ol><li><a href="/settings">Settings</a></li>
    <li><span aria-current="page">Notifications</span></li></ol>
</nav>
```

## Behavior and variations

Use `.breadcrumbs` on a labeled `<nav>` containing an ordered list to show the current page’s ancestry. Link to ancestors and use `aria-current="page"` on the current location. Breadcrumbs complement primary navigation; they do not represent browsing history.

Breadcrumbs add no outer margin. Their immediate parent owns separation from the title: `.page-header-content` or `.stack[data-gap="tight"]` gives 8px, `.stack` gives 16px, and `.stack[data-gap="section"]` gives 24px at the default root size. Do not add a breadcrumb margin on top of that gap. Use the [layout spacing guidance](layout-primitives.md#spacing-and-grouping) when composing the page.

For a page with one useful ancestor, a plain parent link above the title is often sufficient. Name the current page once in its heading; a breadcrumb repeating it is optional:

```html
<header class="page-header">
  <div class="page-header-content">
    <a href="/projects">Projects</a>
    <h1>Website refresh</h1>
  </div>
</header>
```

This uses the header's existing 8px internal gap. Keep the ancestor link as ordinary navigation; it does not need a button, panel or extra hierarchy level.

### Pagination

```html
<nav class="pagination" aria-label="Result pages">
  <span aria-disabled="true">Previous</span>
  <a href="/records?status=active&amp;page=1" aria-current="page">1</a>
  <a href="/records?status=active&amp;page=2">2</a>
  <a href="/records?status=active&amp;page=2">Next</a>
</nav>
```

Use `.pagination` on a labeled `<nav>` to move between result pages, with one `aria-current="page"`. Unavailable previous/next links have no destination and are marked `aria-disabled="true"`. Page links retain the applied query; pagination does not describe ordered workflow steps.
