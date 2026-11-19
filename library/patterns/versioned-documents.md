# Pattern: versioned documents

Compose [record details](record-details.md), [formatted content](../elements/formatted-content.md), [editing](editing.md), and [content revisions](../elements/content-revisions.md) for authored documents such as guides, policies, instructions, or articles. Use the [unified comparison](../elements/document-comparison.md) for changes to Markdown source.

## Compare saved revisions

Present comparison as a first-class reading task: identify the document, explicitly label **Earlier** and **Later**, and offer native revision selectors with an explicit Compare submit action. Label editing revisions separately from named published versions. Display which saved revision underlies a publication; several saves can contribute to one publication.

Use a unified, commit-style source comparison with readable changed blocks, surrounding context, +/− line markers, supplied word-level changes, context expansion, previous/next-change navigation, and separate links to read either revision. Keep document-metadata changes in a separate labeled summary. The [comparison element](../elements/document-comparison.md#application-input-and-markup-contract) owns the exact input/markup, focus behavior, and explicit identical/first/unavailable states. Missing or partial comparison data must never imply “no changes.” A formatting-only source change can leave rendered output unchanged.

Resolve each comparison to two stable saved revision IDs before rendering. Pin selectors, complete/context URLs, retry URLs, and rendered-preview links to that pair. New edits must not silently change an open comparison. A comparison of unsaved submitted text is a different, explicitly labeled application snapshot; do not call it a saved revision or silently substitute it for a saved-pair comparison.

| Entry point | Pair resolved by the application |
| --- | --- |
| Changes since publication | Latest published edition's underlying saved revision → selected saved draft revision. If no publication exists, explain that explicitly. |
| View changes | Selected saved revision's predecessor → that revision. The first revision has no predecessor. |

The labels “latest” and “current” can describe entry points, but the resulting view names and URLs identify concrete revisions. Applications own available selections and authorization; disallowed/deleted/missing revisions yield an unavailable state, not a fallback pair.

## Read a document

Use a [page header](../elements/page-headers.md) for identity, publication/version metadata and permitted actions, outside the rendered article. Use [description lists](../elements/description-lists.md) for additional facts. Keep publication and approval information separate: a publication label is not proof of approval. Names, statuses, attribution and dates come from recorded application data; omit unsupported approval claims.

Compose `.reading-layout`, `.reading-contents`, and `.rich-content` using the [formatted-content contract](../elements/formatted-content.md#reading-layout). Render semantic headings, paragraphs, nested lists, links, code and tables. Wrap wide authored tables in named, focusable `.rich-content-scroll` regions; wide code scrolls locally. Keep readable prose width while letting labels and headings wrap.

Applications assign stable document/section identities and supply heading IDs, contents links, and direct section links. Offer revision-pinned permanent URLs when an exact historical section is intended; a current-document URL may follow the current edition. Preserve established IDs as headings change, and define missing-section behavior rather than deriving a new slug on every render. Server-render each selected revision; do not load all historical documents into one page.

Make the edition unmistakable:

| Reading state | Presentation |
| --- | --- |
| Published edition | Named published version, its source revision, relevant date/attribution, and publication-specific metadata. |
| Published edition with a differing saved draft | Notice that the saved draft differs and publication is unchanged; offer Open saved draft and Changes since publication. The application determines meaningful content/metadata differences, not merely whether a newer revision ID exists. |
| Saved draft | Label Saved draft; distinguish saved content from publication and offer the published edition when available. |
| Unpublished document | Say it has no published edition; do not invent a publication version or compare against one. |
| Historical edition | Label the selected publication/revision and Read-only; offer return to the current edition. Make any simultaneously shown current metadata explicit. |

Historical content has no editable fields. An application may offer **Restore into draft**, which records a new revision without changing history. Restoration is an explicit application action, separate from reading or selecting a version; existing editor drafts require protection.

## Edit and preview

Follow the existing [Rails editing contract](editing.md#rails-default) using `fieldwork_form_with`, a Markdown textarea, and an application-supplied change-summary field. Use **Save draft**, **Discard**, and **Cancel**: Save creates/updates application-owned saved content; Discard restores the editor's saved baseline; Cancel leaves. Saving a draft does not imply publishing or approving it. Keep publication actions separate when the application supplies them.

For example, with an application-owned form object and endpoint:

```erb
<%= fieldwork_form_with model: @draft, url: document_draft_path(@document),
      id: "document-editor", baseline: @saved_fields, local: true,
      submit_label: "Save draft", discard_label: "Discard",
      cancel: document_path(@document), error: @save_error do |form| %>
  <%= hidden_field_tag :base_revision, @base_revision_id %>
  <%= fieldwork_field form, :body, type: :textarea, label: "Markdown source", rows: 20 %>
  <%= fieldwork_field form, :change_summary, label: "Change summary" %>
  <%= button_tag "Preview submitted text", type: "submit", name: "intent", value: "preview",
        class: "button", data: { editing_allow_unchanged: true } %>
<% end %>
```

Field names, routes and summary validation above are application choices. The helper's Cancel is an ordinary link; attach application-owned exit protection as described below. Render the preview as a separately labeled `.rich-content` article outside the editor form.

Capture the saved field baseline before assigning attempted values. Keep an application-owned base revision/concurrency token outside the tracked editable fields. Fieldwork's dirty indicator compares the form with its saved baseline, never with the published edition. Name the three states explicitly: unsaved editor text, saved draft, published edition.

Provide a separate rendered preview using the application's renderer/sanitizer. A server Preview submit action can post the current text without persistence, retaining all attempted fields, the base token and saved baseline in the response. Give it `data-editing-allow-unchanged` when it should work before edits. For client previews, the application owns requests, cancellation and freshness: only show a result for its submitted snapshot, and abort/ignore stale responses. Label unsaved previews **Unsaved text — not saved or published**; after further input/Discard, mark the old preview out of date or explicitly identify its snapshot. Never treat preview as a successful save or advance the baseline.

Define any source-normalization policy in the application and apply it consistently to preview, saving and saved baselines. Account for native textarea line endings when deciding whether source changed.

For Turbo POST previews, use a 303 redirect to an application-owned preview snapshot or an explicitly managed Stream response; a successful POST returning ordinary 200 HTML does not satisfy Turbo's redirect contract. The preview snapshot is not a saved editing revision. A redirect/response must still render the submitted fields against their original saved baseline.

| Response | Required application behavior |
| --- | --- |
| Validation failure | Return 422 with attempted Markdown and summary, associated errors, and the prior saved baseline. |
| Stale-edit conflict | Preserve submitted text, summary and base identity. Explain that newer saved content exists and nothing was overwritten. Return an appropriate failure response (for example 409), retaining dirty state. Offer explicit application recovery such as inspect newer content separately, copy/download submitted text, or a validated retry creating a new revision. Do not silently rebase, merge or overwrite. |
| Saved | Follow the [Rails response contract](../rails.md#form-responses-and-baselines): 303 redirect or confirmed whole-form replacement with a new saved baseline and feedback. A change-summary field for the next save normally starts empty. |

Browse revisions and comparisons in another browsing context or retain a reliably recoverable editor draft. Do not replace textarea content when a revision picker changes. Protect transitions that would lose work using [unsaved-change confirmation](../elements/confirmation.md); include the actual editor exits, not just Cancel when other page navigation can discard text. Native reload/close protection and Back/Forward behavior are explicit application policies. No autosave, collaborative editing, or global navigation guard is supplied by this pattern.

## Rails integration and ownership

Use the existing [gem installation and Turbo lifecycle](../rails.md). `fieldwork/ui` includes reading and comparison styling. Import `enhanceDocumentComparison` from `fieldwork/document-comparison` only on applicable views. Mount after real content renders, deduplicate by live root, and destroy before Turbo cache/replacement/removal; reinitialize on restored content. Use the generic [other-component lifecycle](../rails.md#other-component-lifecycles), including affected Frame/Stream roots. The form bridge continues to own helper-form initialization, baselines, result focus and cache preparation; application preview/guards may read `enhanceForm(form)` with no options after mounting.

A consuming Rails application supplies:

- Authorized document, publication and revision routes, explicit pair URLs, stable section IDs, labels and available actions.
- Rendered/sanitized article and preview HTML. Escape source separately when constructing comparison markup.
- Comparison results mapped into the element contract, metadata changes, context counts and complete/incomplete state.
- Persistence, validation, concurrency checks, restoration, recording attribution, publication records and any approval policy.

Fieldwork supplies presentation, markup, styling and optional interaction enhancement. It supplies no document model, Markdown renderer/sanitizer, diff engine, publication/approval workflow or business rules. Side-by-side/HTML/table diffs, move detection, merge/review suggestions and inline comments are outside the initial scope.
