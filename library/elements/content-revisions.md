# Content revisions

Shared implementation: [ui.css](../assets/fieldwork/ui.css) · [content-revisions.js](../assets/fieldwork/content-revisions.js).

## Default markup

```html
<section data-content-revisions aria-labelledby="description-title">
  <header class="panel-header">
    <h3 id="description-title">Description</h3>
    <div class="action-dropdown revision-picker" data-revision-picker>
      <button class="button" type="button" popovertarget="description-versions"
        aria-labelledby="description-title description-version-label">
        <span id="description-version-label" data-revision-label>Current version</span>
      </button>
      <nav class="action-menu" id="description-versions" popover="auto"
        aria-label="Description revisions">
        <ul>
          <li><a class="action-item" href="#description-current" data-revision-link
            data-revision-label="Current version" aria-current="true">
            <span>Current version</span><span class="hint">Alex Morgan · <time datetime="2026-10-17T14:30:00Z">17 Oct 2026, 14:30 UTC</time></span>
          </a></li>
          <li><a class="action-item" href="#description-previous" data-revision-link
            >
            <span><time data-revision-label datetime="2026-10-16T09:15:00Z">16 Oct 2026, 09:15 UTC</time></span><span class="hint">Jamie Chen</span>
          </a></li>
        </ul>
      </nav>
    </div>
  </header>
  <div class="panel-body">
    <section class="revision-view stack" id="description-current" data-revision-view
      aria-label="Current description">
      <p class="hint">Current version · Alex Morgan · <time datetime="2026-10-17T14:30:00Z">17 Oct 2026, 14:30 UTC</time></p>
      <p class="revision-content">The current description.</p>
    </section>
    <section class="revision-view stack" id="description-previous" data-revision-view
      aria-label="Description from 16 October">
      <div class="revision-notice"><strong>Past revision · Read-only</strong>
        <a href="#description-current">Back to current</a></div>
      <p class="hint">Jamie Chen · <time datetime="2026-10-16T09:15:00Z">16 Oct 2026, 09:15 UTC</time></p>
      <p class="revision-content">An earlier description.</p>
    </section>
  </div>
</section>
```

## Initialization and cleanup

```js
import { enhanceContentRevisions } from 'fieldwork/content-revisions';
const revisions = enhanceContentRevisions(document.querySelector('[data-content-revisions]'));
// Before removing/caching the view:
// revisions.destroy();
```

## Usage

Omit the picker for a single version. Follow the [record-detail pattern](../patterns/record-details.md#history) for composing past versions with current information and editing.

The optional module switches between views already rendered in the same root. It owns the picker; do not initialize that dropdown separately.

| Part | Requirement |
| --- | --- |
| Links/views | Each `[data-revision-link]` targets a unique local `[data-revision-view]` in the same root. Use document-unique IDs. |
| Button label | Set `data-revision-label` on a link for a fixed label, or on a nested `time` for a localized timestamp. Otherwise the full link text is used. |

Initial selection uses a matching URL fragment, then `aria-current="true"`, then the first link. Mark the current version as selected by default. Leave all local views visible for native fragment navigation without enhancement.

Selection shows one complete view, returns focus to the picker, and leaves the URL unchanged. It does not change fields or submit forms.

`fieldwork:revisionselected` bubbles with `event.detail.view`, including during initialization. Register listeners before enhancement when synchronizing application-owned metadata or actions.

Repeated initialization returns the same controller. Call `destroy()` before replacement or caching; it removes listeners and restores original labels, selection, and visibility. Initialize the new or restored root.

Applications own revision loading, saving/restoration, and draft guards.

### Server-rendered variation

Use revision URLs, mark the selected link `aria-current="true"`, and render the chosen view. Initialize only the [action dropdown](action-dropdowns.md); application routing owns navigation. Guard transitions that could discard an editing draft.

For authored documents, follow [versioned documents](../patterns/versioned-documents.md) for publication labels, history entry points and draft protection. Editing revisions and named publications are separate application concepts; labels such as “Current version” above are illustrative. Use [document comparison](document-comparison.md) for source changes between a fixed saved pair. Its selectors use server URLs; do not pass them to `enhanceContentRevisions`, which only switches already-rendered local views.
