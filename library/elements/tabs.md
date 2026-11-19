# Tabs

Assets: [ui.css](../assets/fieldwork/ui.css) · [tabs.js](../assets/fieldwork/tabs.js).

## Default markup

```html
<div class="tabs">
  <nav class="tab-list" aria-label="Details">
    <a id="summary-tab" href="#summary-panel">Summary</a>
    <a id="history-tab" href="#history-panel">History</a>
  </nav>
  <section class="tab-panel stack" id="summary-panel" aria-labelledby="summary-tab">
    <h2>Summary</h2><p>Current record details.</p>
  </section>
  <section class="tab-panel stack" id="history-panel" aria-labelledby="history-tab">
    <h2>History</h2><p>Recorded updates.</p>
  </section>
</div>
```

## Initialization and cleanup

```js
import { enhanceTabs } from 'fieldwork/tabs';
const tabs = enhanceTabs(document.querySelector('.tabs'));
// Before replacing or caching the root:
// tabs.destroy();
```

Initialization reuses the controller without resetting selection. Destroy before replacement/cache; it removes listeners and restores roles, ARIA, tab stops, and visibility. Invalid/missing local targets leave native links unchanged and return no controller.

## Supported scope

Switches already rendered local sections with fragment links and keyboard selection. Use section navigation for page URLs; this helper does not fetch or route.

## Behavior and variations

Give links unique IDs and matching local `.tab-panel` targets within the root, each labeled by its link. Leave all panels visible for native fallback. Use a [stack](layout-primitives.md#spacing-and-grouping) within each panel for related content blocks.

Enhancement adds tab roles, one tab stop, and immediate selection. Arrows wrap; Home/End select boundaries; Tab enters the active panel. Matching fragments select a panel on initialization and later navigation. Tab clicks do not rewrite the URL.
