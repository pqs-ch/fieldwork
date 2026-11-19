# Reorderable list

<a id="reordering"></a>

Assets: [ui.css](../assets/fieldwork/ui.css) · [reorderable-list.js](../assets/fieldwork/reorderable-list.js).

## Default markup

```html
<ol class="reorderable-list" aria-label="Section order">
  <li class="reorderable-item" data-reorder-item="summary" data-label="Summary">
    <button class="button reorder-handle" data-variant="quiet" type="button" data-reorder-handle aria-label="Reorder Summary" disabled><span class="icon" data-icon="grip-vertical" aria-hidden="true"></span></button>
    <span>Summary</span>
    <div class="reorder-moves">
      <button class="button" data-variant="quiet" type="button" data-reorder-move="up" aria-label="Move up: Summary" disabled><span class="icon" data-icon="arrow-up" aria-hidden="true"></span></button>
      <button class="button" data-variant="quiet" type="button" data-reorder-move="down" aria-label="Move down: Summary" disabled><span class="icon" data-icon="arrow-down" aria-hidden="true"></span></button>
    </div>
  </li>
  <!-- More items with unique keys and contextual labels. -->
</ol>
```

## Initialization and cleanup

```js
import { enhanceReorderableList } from 'fieldwork/reorderable-list';
const list = document.querySelector('.reorderable-list');
const order = enhanceReorderableList(list);
// Before removing/caching this view: order.destroy();
list.addEventListener('fieldwork:reorder', event => {
  // event.detail.keys is the committed DOM order; update the application's draft or save it.
});
```

## Supported scope

One vertical list with every item movable; no nesting or cross-list transfer. Applications own persistence and draft/commit policy.

## Behavior and variations

Use direct children with unique nonempty `data-reorder-item` keys, readable `data-label`, button handles, and move buttons. Keep controls disabled until enhancement. The second child holds item content. Use the [bundled icons](icons.md) for the handle and move controls.

Dragging starts only from a handle. Release commits; Escape, pointer cancellation, page exit, or `cancel()` restores the starting order without a change event. Handle Up/Down moves one position; Home/End moves to a boundary. Move buttons supply a non-drag alternative. Focus follows the item and status announces its position.

Initialization is idempotent. `value` returns a copy of the ordered keys. Cancel active dragging before mutating items, then call `refresh()`. `destroy()` cancels dragging, removes generated UI/listeners, and restores control availability while retaining committed DOM order. Destroy before replacement/cache.
