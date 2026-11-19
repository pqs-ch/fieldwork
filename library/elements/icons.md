# Icons

Assets: [ui.css](../assets/fieldwork/ui.css). Rails helper: [icon_helper.rb](../rails/icon_helper.rb).

## Default markup and setup

Use any icon from the bundled Lucide catalogue to support actions and content. There is no preferred subset. Choose icons that fit the application, and use the same icon consistently for the same concept within that application. Keep visible text when it helps users understand the task. Rails registers `fieldwork_icon` automatically:

```erb
<button class="button" type="submit">
  <%= fieldwork_icon "upload" %>
  Upload files
</button>
```

Plain HTML and application-owned JavaScript can use the same names through CSS masks, without initialization:

```html
<button class="button" type="submit">
  <span class="icon" data-icon="upload" aria-hidden="true"></span>
  Upload files
</button>
```

The Rails helper renders inline SVG. CSS masks and inline SVG inherit `currentColor`; `.icon` supplies the default 20px size. [Primary navigation](page-navigation.md#primary-navigation) and account utilities use a compact 16px variation. Keep Lucide's 24×24 viewBox and 2-unit stroke. Override width and height together through an application class when context calls for another size. Icons do not need JavaScript, mounting, or cleanup.

## Accessible names

Icons beside descriptive text are decorative. The helper defaults to `aria-hidden="true"` and `focusable="false"`; include `aria-hidden="true"` on decorative CSS spans. Put the accessible name on an icon-only control, using the [button contract](buttons-and-links.md):

```erb
<button class="button" data-icon-only type="button" aria-label="Edit project details">
  <%= fieldwork_icon "pencil" %>
</button>
```

When an icon conveys information without accompanying text, prefer adding visible or visually hidden text. For a standalone SVG image, `fieldwork_icon "file-spreadsheet", label: "Spreadsheet"` supplies `role="img"` and an escaped accessible label instead of hiding the icon. A tooltip alone does not provide an accessible name.

## Helper API

`fieldwork_icon(name, label: nil, **attributes)` accepts a catalogue name as a string or symbol. Additional SVG attributes are escaped by Rails. `class:` adds classes alongside `.icon`; `label:` controls the helper's accessible name. Unknown names raise `ArgumentError`. Names select bundled assets only; filenames, paths, and arbitrary SVG input are unsupported.

For explicit native SVG markup, use the corresponding bundled SVG and add `class="icon"`, `aria-hidden="true"`, and `focusable="false"` when decorative. An external `<img>` can reference `fieldwork/icons/NAME.svg` through the application's asset helper, but its SVG does not inherit surrounding text color; prefer inline SVG or CSS masks for controls and semantic colors.

## Choosing icons

Browse the [Lucide catalogue](https://lucide.dev/icons/) and use the kebab-case name with `fieldwork_icon` or `data-icon`. All icons in the bundled version are available through both APIs. Examples illustrate usage rather than prescribing particular icons or mappings for application concepts.

Keep labels understandable, use consistent sizes and strokes, and follow the accessible-name guidance above. Icons supplement task wording; they do not replace status labels, file extensions, or explanations of consequential actions.

## Source and license

Fieldwork bundles the full catalogue of 1,903 unmodified SVGs from [Lucide 1.61.0](https://github.com/lucide-icons/lucide/tree/1.61.0/icons). The upstream ISC and inherited Feather MIT notices ship in [LUCIDE-LICENSE](../LUCIDE-LICENSE). Consumers do not need to install Lucide or add a build step. The version is pinned so releases remain reproducible; update the full catalogue together when adopting a newer Lucide version. Catalogue availability is not limited to the icons used by Fieldwork’s examples.
