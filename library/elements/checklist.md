# Checklist

Assets: [ui.css](../assets/fieldwork/ui.css).

## Default markup

```html
<section class="stack" aria-labelledby="setup-title">
  <h2 id="setup-title">Set up your workspace</h2>
  <ul class="checklist" role="list">
    <li class="checklist-item" data-state="ready">
      <span class="checklist-marker" aria-hidden="true"></span>
      <div class="checklist-content">
        <h3 class="checklist-title">Confirm workspace details</h3>
        <p class="checklist-state">Ready</p>
        <p class="checklist-description">Check your team name and contact details.</p>
      </div>
      <div class="checklist-actions"><a class="button" href="/settings">Review details</a></div>
    </li>
  </ul>
</section>
```

## Usage

Repeat the item for remaining tasks, including tasks with application-owned prerequisites. For navigation through an ordered task, use a [step indicator](step-indicators.md#step-indicators). The [record-activities pattern](../patterns/record-activities.md) composes outstanding work with available activities and recorded history.

| `data-state` | Visible state / action |
| --- | --- |
| `ready` | Ready, with an available next action. |
| `complete` | Completed; retain a review link when useful. |
| `blocked` | Blocked, with an explanation and an action only when it can resolve the blocker. |

Keep the visible state text and decorative marker as shown. Description and actions can be omitted when unnecessary. These are task states, not editable checkboxes.

Applications supply tasks, destinations, permissions, prerequisites, and confirmed completion. Visiting a link does not complete a task. Preserve focus when updating/removing the task being used; background updates must not steal focus.
