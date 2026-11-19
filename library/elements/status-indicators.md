# Badges and status indicators

<a id="status-indicators"></a>

Assets: [ui.css](../assets/fieldwork/ui.css).

## Default markup

```html
<span class="status-indicator">Pending review</span>
```

## Behavior and variations

Use `.status-indicator` beside the subject whose state it describes. Neutral is the default, including pending workflow states, and renders as plain muted text without a filled badge. Use [feedback](feedback.md) for action outcomes.

Keep labels short: a concise state such as “In progress” or “Pending review”, with explanations in adjacent text. Indicators stay on one line, including spaces, and resist shrinking. Give the label room or let its surrounding layout wrap; keep wide tables in their local scroll region. Do not truncate the state or put sentences inside an indicator.

### Semantic tones

```html
<span class="status-indicator" data-tone="success">Available</span>
<span class="status-indicator" data-tone="warning">Review required</span>
<span class="status-indicator" data-tone="error">Unavailable</span>
```

Use success for confirmed positive conditions, warning for attention, and error for problems. Applications choose state meanings; text is not automatically mapped to tones. Keep meaning explicit in words and explain blockers nearby.

These semantic tones retain a compact tinted background and stronger label weight, so confirmed outcomes and exceptions stand apart from routine neutral states. Do not assign a tone merely to decorate metadata.

Static indicators do not need live-region roles. Announce asynchronous changes through scoped feedback rather than making each table cell a live region.

`.table-status` is a compatibility alias; use `.status-indicator` in new markup.

### Counts and metadata

Use `.badge` for counts or metadata, following the same short-label and single-line rules:

```html
<span class="badge">12 files</span>
```

Counts and routine metadata use plain muted text with no enclosing fill or padding. Keep them beside the heading, view or label that explains them; a count alone does not need another colored surface.
