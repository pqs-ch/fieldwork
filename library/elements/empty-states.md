# Empty states

Assets: [ui.css](../assets/fieldwork/ui.css).

## Default markup

```html
<section class="empty-state" aria-labelledby="empty-projects-title">
  <h2 class="empty-state-title" id="empty-projects-title">No projects yet</h2>
  <p class="empty-state-description">Create a project to give your team a place to start.</p>
  <div class="empty-state-actions">
    <a class="button" data-intent="primary" href="/projects/new">Create project</a>
  </div>
</section>
```

## Behavior and variations

Place the message in the result region; retain query controls outside it.

| Situation | Next step |
| --- | --- |
| No records yet | Offer creation or setup when permitted. |
| No matches | Retain the query and offer adjustment or clearing. |
| Results unavailable | Explain failure and retry the same query; do not report zero records. |
| No action available | Explain the absence and omit actions. |

Initial loading uses [feedback](feedback.md), not an empty state. A refresh failure retains usable content and shows feedback beside it. When content is available, keep its actions in the task header, toolbar or footer; use an [action panel](panels.md#action-panels) only when pending work needs a separate explanation.

For client updates, announce outcomes outside busy regions. Preserve retry scope and prevent duplicate requests. If success removes the focused recovery control, move focus to a useful result heading only if focus has not moved elsewhere. See [collection search](../patterns/search.md).
