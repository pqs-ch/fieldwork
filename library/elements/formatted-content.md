# Formatted content

<a id="rich-content"></a>

Assets: [ui.css](../assets/fieldwork/ui.css).

## Default markup

```html
<article class="rich-content" aria-labelledby="update-title">
  <h1 id="update-title">Project updates in one place</h1>
  <p>Use the project workspace to share progress and decisions.</p>
  <h2>What to include</h2>
  <ul>
    <li>Summarize what changed.</li>
    <li>Name the next milestone.</li>
  </ul>
  <blockquote><p>A short update with a clear next step helps everyone catch up.</p></blockquote>
  <p>Review <a href="/projects/123/activity">recent activity</a> before posting.</p>
</article>
```

## Behavior and variations

Scope `.rich-content` to authored content, outside application navigation and editing controls. It styles semantic prose, lists, quotes, code, tables, and media with a `70ch` reading width and `1rem` reading text, independently of the compact workspace type. Applications own Markdown rendering and sanitization of untrusted HTML.

### Scrollable examples

Give scrollable code/table regions a name and `tabindex="0"`:

```html
<div class="rich-content">
  <pre tabindex="0" role="region" aria-label="Example request"><code>GET /projects?status=active&amp;owner=alex</code></pre>
  <div class="rich-content-scroll" tabindex="0" role="region" aria-label="Permission options">
    <table>
      <caption>Permission options</caption>
      <thead><tr><th scope="col">Scope</th><th scope="col">Access</th></tr></thead>
      <tbody><tr><td>projects.read</td><td>Project information</td></tr></tbody>
    </table>
  </div>
</div>
```

Interactive queries and selection use the [data-table pattern](../patterns/tables.md).

Table header typography and shading apply to `<thead>` cells. Body row headers (`<th scope="row">`) retain their semantics while using the same presentation as ordinary body cells.

## Reading layout

```html
<div class="reading-layout">
  <div class="reading-layout-body">
    <article class="rich-content" aria-labelledby="guide-title">
      <h1 id="guide-title">Workspace guide</h1>
      <p>Confirm the workspace details before inviting your team.</p>
    </article>
  </div>
</div>
```

Use `.reading-layout` and `.reading-layout-body` for an article with optional contents navigation. Contents move above the article in narrow containers. Keep page headers outside the article.

### Optional local contents

```html
<div class="reading-layout">
  <div class="reading-layout-body">
    <nav class="reading-contents" aria-labelledby="contents-title">
      <h2 class="reading-contents-title" id="contents-title">On this page</h2>
      <ul role="list">
        <li>
          <a href="#contact-details">Contact details</a>
        </li>
      </ul>
    </nav>
    <article class="rich-content" aria-labelledby="article-title">
      <h1 id="article-title">Workspace guide</h1>
      <h2 id="contact-details" tabindex="-1">Contact details</h2>
      <p>Keep the support contact current.</p>
    </article>
  </div>
</div>
```

Each contents item contains one descriptive section link. Labels wrap within the navigation region.

Supply heading IDs and matching links; `tabindex="-1"` permits fragment focus without another Tab stop. Omit contents for short articles. Preserve established fragments. Covering headers may require a larger heading scroll margin.

For authored documents with drafts or publications, follow [versioned documents](../patterns/versioned-documents.md#read-a-document). Applications supply stable section identities and revision-pinned permanent links; a changed heading need not change its section ID. Keep edition metadata and editing controls outside `.rich-content`.
