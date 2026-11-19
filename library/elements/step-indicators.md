# Step indicators

Assets: [ui.css](../assets/fieldwork/ui.css).

## Default markup

```html
<nav class="step-indicator" aria-label="Delivery setup progress">
  <ol class="step-indicator-list" role="list">
    <li data-state="complete">
      <a class="step-indicator-item" href="/delivery/details">
        <span class="step-indicator-number" aria-hidden="true">1</span>
        <span class="step-indicator-content">
          <span class="step-indicator-label">Delivery details</span>
          <span class="step-indicator-state">Completed</span>
        </span>
      </a>
    </li>
    <li aria-current="step">
      <span class="step-indicator-item">
        <span class="step-indicator-number" aria-hidden="true">2</span>
        <span class="step-indicator-content">
          <span class="step-indicator-label">Recipients</span>
          <span class="step-indicator-state">Current step</span>
        </span>
      </span>
    </li>
    <li>
      <span class="step-indicator-item">
        <span class="step-indicator-number" aria-hidden="true">3</span>
        <span class="step-indicator-content">
          <span class="step-indicator-label">Review</span>
          <span class="step-indicator-state">Not started</span>
        </span>
      </span>
    </li>
  </ol>
</nav>
```

## Behavior and variations

Use for an ordered task; use [Checklist](checklist.md) for independent tasks.

Show an indicator when the overall sequence helps people orient themselves. For familiar, frequently repeated workflows, a task heading, source or record identity and contextual navigation can be enough. Do not add a step bar merely because the implementation has several pages; repeated progress labels should not take attention from the work.

- Mark the current item with `aria-current="step"`. Set `data-state="complete"` only after confirmed completion, not merely visiting a step.
- Link only to available steps when returning preserves work. Use spans for current or unavailable destinations.
- Keep Continue/Back actions with the task content. Preserve inputs and errors across transitions; validation failure stays on the same step.
- Show a confirmed result after completion; completed markers alone do not establish server success.

Use a named `nav` when steps contain links; otherwise use a labeled group/section. Preserve the list semantics and decorative numbers shown above. Applications own branching, validation, draft storage, transitions, and destination focus.

For coordinated entry, check, correction and completion, follow [multi-step creation and review](../patterns/multi-step-creation.md).
