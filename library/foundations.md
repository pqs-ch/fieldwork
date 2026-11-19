# Foundations

Fieldwork uses compact working surfaces, readable text, native controls, and consistent semantic colors. Load `library/assets/fieldwork/ui.css`; its CSS custom properties supply the shared defaults. [Element reference](elements/index.md) · [Shared palette](#palette-overrides).

## Color roles

| Role | Token | Use |
| --- | --- | --- |
| Text | `--color-text` | Primary content |
| Supporting text | `--color-muted` | Labels and secondary context |
| Surface / canvas | `--color-surface`, `--color-canvas` | White working area and bright, nearly neutral navigation/context |
| Accent | `--color-accent`, `--color-accent-soft` | Actions, links, selected controls |
| Brand detail | `--color-brand-detail` | Small decorative accents, separate from state or feedback |
| Success | `--color-success`, `--color-success-soft` | Confirmed positive outcomes |
| Warning | `--color-warning`, `--color-warning-soft` | Conditions needing attention |
| Danger | `--color-danger`, `--color-danger-soft` | Errors and destructive actions |
| Boundaries | `--color-control-border`, `--color-border`, `--color-divider` | Controls, surfaces, passive separators |

Keep meaning in labels and native state as well as color. Brand accent and success are independent roles. See [status and feedback](elements/status-indicators.md#status-indicators) for supported tones.

## Type, spacing, and controls

Follow the [product priorities](index.md#product-priorities). Optimize for capable desktop workflows: compact spacing, readable surfaces and clear task hierarchy. The default working text is `0.875rem`; authored [formatted content](elements/formatted-content.md) retains a larger reading size. Keep semantic feedback and visible focus distinct from the brand accent.

### Visual character

Use one crisp white working area for the page title and task content, with a bright, nearly neutral cool-gray canvas reserved for navigation and supporting context. Table headers and hover surfaces use a slightly stronger version of the same tint. Passive dividers remain quiet; control boundaries stay distinct. Deep blue identifies links, primary actions and current navigation. Small coral details, such as the marker beside an eyebrow, add warmth without carrying status meaning. Horizontal primary navigation marks the current item with accent text and a bottom underline; vertical navigation uses accent text and a short left-edge marker. Muted sentence-case captions and spacing establish navigation groups without heavy separators or filled active pills.

Routine counts, metadata and neutral states use plain muted text. Reserve tinted status indicators for meaningful confirmed outcomes, warnings and errors. Keep prose links underlined; table navigation links use accent text with an underline on hover or keyboard focus. Inputs, selects and buttons share compact dimensions and rounding while preserving native behavior.

Allow a restrained amount of character through color and small details while keeping working views direct. Place routine actions close to their task; use ordinary section headings and compact controls. Avoid promotional banners, oversized next-step headings and decorative panels around routine navigation. Follow the [action-panel guidance](elements/panels.md#action-panels) when pending work needs its own explanation.

Keep the page header and task body in a continuous flow without an enclosing box or extra body inset. Group related sections using headings, spacing and, when useful, dividers. Reserve bordered surfaces for regions whose independent behavior or context needs a visible boundary. Follow [page composition](patterns/application-layout.md#page-composition) and [layout primitives](elements/layout-primitives.md) for placement and intentional task boundaries.

Use the existing spacing scale to make related labels and metadata closer than separate fields, sections and actions. Follow the [spacing guidance](elements/layout-primitives.md#spacing-and-grouping) for composition.

The [application layout](elements/application-layout.md#workspace-presentation) shares the standalone elements' presentation. Use its existing compact-layout and touch behavior as supplied; focus refinement on desktop task quality unless the project needs another presentation.

## Interaction

Show pending and confirmed outcomes, retain edits after failure, and offer scoped recovery. [Form lifecycle](patterns/editing.md#the-editing-loop) · [Deletion confirmation](elements/deletion-confirmation.md).

Design each view around one clear outcome; give supporting content less emphasis.

Hover and pressed states use short color and shadow transitions only when reduced motion is not requested. Focus outlines, invalid, disabled and busy control states remain immediate; layout and size do not animate. Column-filter menus use a very light backdrop to retain table context, while confirmations retain their stronger separation.

## Palette overrides

Override tokens in application CSS after `ui.css`. Keep accent (`--color-accent`, `--color-accent-hover`, `--color-accent-soft`, `--color-on-accent`) separate from success. `--color-brand-detail` supplies decorative warmth; do not use it for text, control boundaries or semantic feedback. Destructive buttons use `--color-on-danger`; overlays share `--color-shadow`, `--color-backdrop`, and `--color-backdrop-subtle`.

When changing a palette, check text and control contrast in normal, selected, hover, and focus states. Preserve explicit state labels and structural selection/focus indicators.
