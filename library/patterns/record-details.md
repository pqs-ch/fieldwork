# Pattern: record details

## Recommended default

Help people understand one record's current state and choose what to do next. Start with the information useful to that task, adding related sections and history when they help. Compose the page within the [application layout](application-layout.md).

## Identity and key facts

Use a [page header](../elements/page-headers.md) to identify the record. Show meaningful state beside its subject, and prioritize the facts people need to understand or act on it. Avoid repeating the same information across the title, status, and supporting metadata.

Use [description lists](../elements/description-lists.md) for labeled facts and [formatted content](../elements/formatted-content.md) for substantial prose. Distinguish absent, unknown, and inapplicable information; an empty value should not imply a fact the application does not know.

## Actions and editing

Keep record-wide actions near the record identity and section-specific actions beside the information they affect. Label narrower edit scopes when needed. Offer permitted, relevant operations; use [action dropdowns](../elements/action-dropdowns.md) for secondary actions.

Follow the [editing pattern](editing.md) for changing current information. Several entry points can lead to one editor; they do not require separate save operations. Keep Save and Discard with the form being edited. Destructive actions follow the [deletion-confirmation contract](../elements/deletion-confirmation.md).

For work that returns to the same record across several activities, follow [successive record activities](record-activities.md) to connect detail, focused forms, recorded outcomes and outstanding work.

## Related information

Group related information under meaningful headings, using [layout primitives](../elements/layout-primitives.md). Keep the record title and related sections in one continuous white working area; use a [section stack](../elements/layout-primitives.md#continuous-page-sections) where dividers improve scanning. The optional [content grouping](../elements/layout-primitives.md#shared-content-surface) adds no enclosure, following [page composition](application-layout.md#page-composition). Keep related facts, prose, history and supporting context together in this flow. Reserve [panels](../elements/panels.md) for independently operated modules or content whose context needs a visible boundary. Do not map every record attribute, prose section or sidebar child to its own surface. Choose the grouping from the record and task rather than imposing a fixed set of sections.

Keep a straightforward page when the content fits. Use [section navigation](../elements/page-navigation.md#section-navigation) for separate pages within the record, or [tabs](../elements/tabs.md) for content already present in the same view. Retain the record identity as people move between sections.

Use [data tables](tables.md) or [collection search](search.md) for related collections. Present saved files through [attachments](../elements/attachments.md); adding files is a separate intake task. Preserve the surrounding record context when following related links or returning from an operation.

## Minimal Rails show/edit recipe

For a small record page, start with a title, a named settings section and its related collection. The application layout supplies the single main landmark and `.stack[data-gap="section"]` around the view, giving 24px between these regions. `.page-header-content` supplies 8px between a plain parent link and the title; each section's `.stack` supplies 16px between its contents. Use these existing defaults before adding custom gaps, panels or a sidebar.

This illustrative application supplies an authorized `@project`, a small complete `@reviews` collection, ordinary project routes and nested review routes. Each view has one `h1`. Navigation uses plain links; Edit belongs beside the settings it changes, and Add review belongs beside the reviews. The editor contains only its title and form, keeping the record summary and review list on the show page.

`app/views/projects/show.html.erb`:

```erb
<header class="page-header">
  <div class="page-header-content">
    <%= link_to "Projects", projects_path %>
    <h1><%= @project.name %></h1>
  </div>
</header>

<section class="stack" aria-labelledby="settings-title">
  <header class="split">
    <h2 id="settings-title">Settings</h2>
    <%= link_to "Edit", edit_project_path(@project), aria: { label: "Edit settings" } %>
  </header>
  <dl class="description-list">
    <div><dt>Owner</dt><dd><%= @project.owner.presence || "Not assigned" %></dd></div>
    <div><dt>Due date</dt><dd><%= @project.due_on ? l(@project.due_on) : "Not set" %></dd></div>
  </dl>
</section>

<section class="stack" aria-labelledby="reviews-title">
  <header class="split">
    <h2 id="reviews-title">Reviews <span class="badge"><%= @reviews.size %></span></h2>
    <%= link_to "Add review", new_project_review_path(@project) %>
  </header>
  <% if @reviews.empty? %>
    <p class="hint">No reviews yet.</p>
  <% else %>
    <div class="table-scroll" role="region" aria-label="Project reviews" tabindex="0">
      <table class="data-table">
        <caption class="visually-hidden">Reviews for <%= @project.name %></caption>
        <thead><tr><th scope="col">Review</th><th scope="col">Status</th></tr></thead>
        <tbody>
          <% @reviews.each do |review| %>
            <tr>
              <th scope="row"><%= link_to review.title, project_review_path(@project, review) %></th>
              <td><%= review.status %></td>
            </tr>
          <% end %>
        </tbody>
      </table>
    </div>
  <% end %>
</section>
```

`app/views/projects/edit.html.erb`:

```erb
<header class="page-header">
  <div class="page-header-content">
    <%= link_to @project.name, project_path(@project) %>
    <h1>Edit settings</h1>
  </div>
</header>

<%= fieldwork_form_with model: @project, url: project_path(@project), local: true,
      baseline: @saved_settings, submit_label: "Save settings",
      cancel: project_path(@project) do |form| %>
  <%= fieldwork_field form, :owner, label: "Owner" %>
  <%= fieldwork_field form, :due_on, type: :date, label: "Due date" %>
<% end %>
```

After loading and authorizing the record, the application's controller captures the saved baseline before assigning attempted values:

```ruby
def edit
  @saved_settings = settings_baseline
end

def update
  @saved_settings = settings_baseline
  if @project.update(params.require(:project).permit(:owner, :due_on))
    redirect_to project_path(@project), status: :see_other, notice: "Settings saved."
  else
    render :edit, status: :unprocessable_entity
  end
end

private

def settings_baseline
  { owner: @project.owner.to_s, due_on: @project.due_on&.iso8601.to_s }
end
```

Render the notice through the application's usual feedback region. Model validation errors retain attempted values in the editor, while the baseline still describes persisted values. With the [Rails installation](../rails.md#installation), the form bridge supplies editing state, validation focus and Discard; native submission, server errors and Cancel remain usable without JavaScript. Follow the [editing pattern](editing.md) for draft protection and the [response contract](../rails.md#form-responses-and-baselines) for richer saves or stale-write recovery. The field choices and review model belong to the application.

## History

Use [activity](../elements/activity-timeline.md) for concise recorded events and [content revisions](../elements/content-revisions.md) for complete past versions. When activity is useful, combine relevant record changes and related-item events in one timeline. Render only events the application actually records.

For authored documents with saved revisions and published editions, use [versioned documents](versioned-documents.md) for the reading/editing/comparison workflow.

Make past content visibly read-only and provide a return to the current version. Label which values are historical and which remain current when showing them together. Viewing history must not silently replace current attributes or an editing draft; editing and restoration are explicit application operations. Follow the [editing pattern's draft protection](editing.md#leaving-the-editor) when a transition could lose work.

## Feedback and availability

Keep action feedback near the affected information and preserve useful context after failure. Distinguish an empty section from unavailable information, and offer recovery for the affected scope. Preserve or recover keyboard focus when content or actions are replaced.

The application owns data, permissions, freshness, persistence, and loading. The elements above own markup, accessibility, and optional runtime behavior.
