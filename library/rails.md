# Rails setup and lifecycle

Fieldwork supplies UI patterns, markup, styles, Rails form helpers, and optional interaction behavior for Rails applications. Rails owns requests, server validation, and response rendering; Turbo manages navigation and form transport. No additional frontend package or library build step is needed.

## Installation

Fieldwork targets Rails 8.1 with ERB, Propshaft, importmap, and Turbo. Turbo must be installed and loaded by the application JavaScript.

From the application repository root, add Fieldwork as a Git submodule and check out a release. The example uses `v0.3.1`. Anyone fetching the submodule, including CI, needs Git access to the Fieldwork repository.

```sh
git submodule add git@github.com:pqs-ch/fieldwork.git vendor/fieldwork
git -C vendor/fieldwork checkout --detach v0.3.1
```

Add the path dependency to the application's `Gemfile`. If migrating an existing installation, replace the old GitHub Packages source block for Fieldwork and remove any Fieldwork-specific registry credentials from local and CI configuration.

```ruby
gem "fieldwork", path: "vendor/fieldwork/library"
```

Install the dependency and run the Rails installer.

```sh
bundle install
bin/rails generate fieldwork:install
```

Commit `.gitmodules`, the pinned `vendor/fieldwork` submodule entry, the Gemfile, `Gemfile.lock`, and the generated application changes together. The installer can be run again without duplicating its additions. It adds styles before application styles, initializes editing in `app/javascript/application.js`, and instructs application agents to run `bundle show fieldwork` and read `index.md` in the resolved library directory. It expects the normal ERB application layout, a stylesheet helper, and the application's existing importmap/Turbo setup.

After cloning or pulling the application, run `git submodule update --init` before `bundle install`. Run the same submodule checkout step in CI and keep `vendor/fieldwork/library` at that path in build and runtime deployments.

The gem registers Rails form helpers and namespaced assets. It does not copy assets into the application. Propshaft fingerprints the gem's assets; the integration's import map resolves both public module names and native sibling imports to those fingerprinted URLs. Keep `javascript_importmap_tags` in the layout and use `fieldwork/` module names in application JavaScript. The default supports assets served by the application, including a configured URL prefix, or a fixed string `config.asset_host`; request-dependent asset hosts need application-specific integration.

The generated stylesheet tag is:

```erb
<%= stylesheet_link_tag "fieldwork/ui", "fieldwork/tables", "data-turbo-track": "reload" %>
```

Omit `fieldwork/tables` when the application has no tables. Keep application overrides after these styles. Helpers such as `fieldwork_form_with` and [fieldwork_icon](elements/icons.md) are available automatically; no manual `require` or helper inclusion is needed.

## Updating Fieldwork

Run `git -C vendor/fieldwork fetch --tags`, then `git -C vendor/fieldwork checkout --detach <tag>` with the release you want. Run `bundle install` to refresh the lockfile. Review contract changes, run the application's relevant checks, and commit the updated submodule pointer and lockfile together. Restart Rails and use the application's normal asset precompilation and deployment process so helpers, modules, and contracts come from the same revision.

## Building interfaces

Start with the [pattern for the user’s task](index.md#patterns), then follow its supporting element contracts. Use Rails form helpers for creation and editing. Add other enhancements only where needed, following the Turbo lifecycle below.

Read the sections needed for the current change:

| Need | Owning reference |
| --- | --- |
| Full import/install order | [Complete application bootstrap](#complete-application-bootstrap) |
| Helper arguments and generated controls | [Helper options](#helper-options) |
| Failed/successful form responses | [Responses and baselines](#form-responses-and-baselines) |
| Optional selector-based element lifecycle | [Element mounting](#optional-element-mounting) |
| Component mounting after visits or failed submissions | [Other component lifecycles](#other-component-lifecycles) |
| State access for an already-enhanced form | [Existing form controllers](elements/form-controller.md#reading-an-existing-controller) |
| Draft protection across Rails/Turbo transitions | [Opt-in draft protection](#draft-protection) |
| Cancel protection in Rails | [Scoped Cancel lifecycle](elements/confirmation.md#rails-cancel-lifecycle) |
| Error summary or conditional fields | [Managed summary](elements/form-controller.md#managed-error-summary) · [After Discard](elements/form-controller.md#conditional-fields-after-discard) |

Follow these public contracts; reading helper/runtime source is not required for ordinary application use.


### Render a form

The controller supplies `@profile` and `@saved_attributes`, a hash of the persisted values for the fields being edited:

```erb
<%= fieldwork_form_with model: @profile, url: profile_path,
      baseline: @saved_attributes, message: flash[:notice], local: true do |form| %>
  <%= fieldwork_field form, :name, label: "Full name", required: true %>
  <%= fieldwork_field form, :email, type: :email, required: true,
        hint: "Use an address you check regularly." %>
<% end %>
```

The helper renders actions, layout, field errors, and status using Rails form helpers. `local: true` keeps Rails UJS remote submission out of this path; Turbo handles the ordinary form submission. Without JavaScript, Save, Rails errors, and redirects still work; Discard stays hidden.

Follow [editing](patterns/editing.md#rails-default) or [creation](patterns/creation.md#rails-default) for the task’s form mode, baseline, actions, and response requirements. Use the element contracts for custom markup.

## Turbo lifecycle

### Complete application bootstrap

For an application using forms, optional elements and draft protection, keep the imports and installers together in `app/javascript/application.js`:

```js
// The inert history hook must be evaluated before Turbo starts.
import { installTurboDraftProtection } from 'fieldwork/turbo-drafts';
import '@hotwired/turbo-rails';
import { installTurboEditing } from 'fieldwork/turbo';
import { installTurboElements } from 'fieldwork/turbo-elements';
import { enhanceSearchableSelect } from 'fieldwork/searchable-select';

installTurboEditing();
installTurboElements([
  { selector: '[data-searchable-selection]', mount(root) {
    return enhanceSearchableSelect(root);
  } }
]);
installTurboDraftProtection({ transitions: ['visit', 'frame', 'history', 'unload'] });

// Register application render guards after the lifecycle wrappers above.
```

Choose transitions deliberately and mark the forms to protect as described below. Omit unused optional imports/installers. The form bridge owns editing forms; element registrations own only their selected enhancements and application listeners. Keep all three installed for the document lifetime. Repeated installation returns the existing cleanup function; repeated cleanup, including an old cleanup after reinstalling, cannot disable a newer installation.

Application callbacks still own focus, transport and the interval after a Drive decision. Prevent further editing while that full-page visit is pending, or retain those edits reliably; see [draft protection](#draft-protection). Do not add a second navigation guard for forms already covered by the chosen policy.

### Form enhancement

The installer adds this once to `app/javascript/application.js`:

```js
import { installTurboEditing } from "fieldwork/turbo"
installTurboEditing()
```

`installTurboEditing()` is idempotent and returns an uninstall function. Keep it installed for the document's lifetime; call that function only when removing the integration. It initializes forms marked `data-fieldwork-editing`, as rendered by `fieldwork_form_with`, and manages their replacement and cache lifecycle. Do not initialize the bridge on every Turbo visit, reconfigure its forms, or call their `destroy()`/`prepareForCache()` methods from application code. For application behavior that needs form state, follow [reading an existing controller](elements/form-controller.md#reading-an-existing-controller): a no-options `enhanceForm(form)` call reuses the live controller while the bridge retains ownership.

### Form enhancement scope

The form bridge manages the UI lifecycle for supported forms replaced by Turbo Drive, Frames, or whole-form Streams. Rails/Turbo own transport and server validation; dynamic/permanent form morphing and navigation guards are outside this bridge. Opt-in mixed forms support their declared repeatable groups and file queues; their structural/File snapshots require the [mixed-form navigation policy](elements/form-controller.md#files-server-replacement-and-navigation).

See the form controller for [supported controls](elements/form-controller.md#supported-scope) and [shared options](elements/form-controller.md#behavior-and-variations).

### Draft protection

`fieldwork/turbo-drafts` is a separate, optional navigation adapter. Import this module **before the Turbo import**, then install it once **after the form bridge**. Importing registers an inert history hook before Turbo's window observer; application policy is enabled only by the installer. Mark only forms whose drafts need protection with a nonempty application task name:

```erb
<%= fieldwork_form_with model: @profile, data: { draft_protection: "Profile details" }, local: true do |form| %>
  <%= fieldwork_field form, :name, required: true %>
<% end %>
```

```js
import { installTurboDraftProtection } from 'fieldwork/turbo-drafts';
import '@hotwired/turbo-rails';
import { installTurboEditing } from 'fieldwork/turbo';
installTurboEditing();
const stopDraftProtection = installTurboDraftProtection({
  transitions: ['visit', 'frame', 'history', 'unload'],
  isRetained: (form, transition) => false
});
```

`transitions` is required; choose only the types the application intends to protect. Installation is idempotent; the first configuration wins until the returned uninstall function disables the policy, removes its listeners and aborts the pending dialog. The module-level history hook remains inert after uninstall. If Turbo has already started before this module is imported, omit `history`; keep native `unload` protection or guard history in the application. No guard is installed by the Rails generator or form bridge.

| Type | Protected boundary |
| --- | --- |
| `visit` | Ordinary current-context links, other-form submissions and programmatic Turbo Drive visits. |
| `frame` | Links/submissions targeting a Frame and replacement by a Frame response, including edits made after its request began. Only forms inside that Frame are affected. |
| `history` | Back/Forward between indexed Turbo entries in the same live document. The adapter returns to the current entry before asking; Keep editing retains the address, live controls and selected File objects. |
| `unload` | Native browser close, reload and full-document navigation, using the browser's own warning. Browser support and user-activation restrictions apply. |

The adapter reads bridge-owned `hasChanges` and `isSubmitting`; it never takes ownership of their controllers. A form's own submission is its save operation, so that form is excluded; other affected forms remain protected. For a callback submission that never navigates, set `data-draft-submit="in-place"` on the form: the application must prevent the submission and own its transport; the navigation adapter ignores it. Do not mark ordinary native/Turbo submissions this way. Pending saves block exits with a status message until the application finishes the submission, even when that same navigation was approved before the save began. Leaving does not cancel a request. Failed saves remain protected. A native browser submission exempts its submitted snapshot from one unload warning; the browser owns its transport and the adapter cannot report its pending/result state. Newer edits remain protected. Keep editing/Escape restores focus to the connected opener; confirmed exits replay the captured action once. Modified clicks, downloads, new browsing contexts and same-page fragment links keep their native behavior.

`isRetained(form, transition)` is an optional **synchronous** predicate. Only an explicit `true` exempts a dirty form; it never exempts a pending save. The transition supplies `type`, and where applicable `destination`, `scope` (a Frame or `null`) and `source` (the submitted form). Return true only after verifying the current complete draft can reliably be recovered for that transition. Storage, restoration, permissions and file persistence belong to the application. A filename or successful text write does not retain File bytes. Use the [mixed-form cache policy](elements/form-controller.md#files-server-replacement-and-navigation) as well; this adapter does not persist drafts.

Supported with Turbo 8 Drive and ordinary Frame replacement. History handling relies on Turbo's `history.state.turbo.restorationIndex`; unindexed entries and cross-document history use native unload protection when enabled. Drive decisions happen before starting a visit; applications must prevent further editing during a pending full-page visit or reliably retain those later edits. Frame responses are also checked immediately before replacement. Programmatic visits resume as ordinary advance visits; applications requiring custom visit options should guard their own call instead. Streams, refresh/morph, permanent forms, custom routers, arbitrary DOM replacement and server redirects that replace an editor independently of an initiated save/visit require application-owned decisions. Other lifecycle owners inside a guarded Frame must also defer destruction until the selected render actually runs; the form bridge already does so. Without JavaScript, forms and links remain native and no custom confirmation is available.

The [draft-protection example](../examples/README.md#draft-protection) demonstrates scope, history, failed/pending saves, File retention and application-owned browser storage.

### Optional element mounting

The separate `fieldwork/turbo-elements` integration removes repeated mount/cleanup loops for explicitly selected enhancement roots. It imports no Turbo or element implementation. Install once after `installTurboEditing()`; register render guards such as draft protection **after** this integration so a chosen no-op render retains live controllers.

```js
import { installTurboEditing } from 'fieldwork/turbo';
import { installTurboElements } from 'fieldwork/turbo-elements';
import { enhanceSearchableSelect } from 'fieldwork/searchable-select';
installTurboEditing();
const stopElements = installTurboElements([
  { selector: '[data-searchable-selection]', mount(root, { signal }) {
    return enhanceSearchableSelect(root);
  } }
]);
```

Applications import/start Turbo as usual; the snippet adds the Fieldwork integrations. When also choosing history draft protection, retain its required [import-before-Turbo order](#draft-protection), then call the installers in form bridge → element mounting → draft-protection order.

Each registration has a valid CSS `selector` and a **synchronous** `mount(element, {signal})` callback. Use stable server-authored root markers. Return the owned element controller with `destroy()`, a cleanup function, or nothing when the signal owns all listeners/work. Do not return a Promise. Read options, configure lookup transport and bind business behavior inside application callbacks. Use the supplied signal for listeners/asynchronous work and ignore results for aborted or disconnected roots. Callbacks that throw must clean their own partial allocation.

The first registration set wins until uninstall. Repeated installation returns the same uninstall function. Keep it installed for the document lifetime; uninstall aborts per-root signals, invokes cleanup and removes its observer/listeners. It is safe to call the same uninstall function again. Reconfiguration requires uninstall/reinstall and reestablishing render-guard ordering.

| Boundary | Lifecycle |
| --- | --- |
| Initial load, Drive render, Frame load, browser restore | Mount each matching live root once; skip Turbo previews. |
| Full-page replacement | Abort/clean all registered roots immediately before the selected renderer runs. |
| Frame replacement | Abort/clean roots inside that Frame immediately before rendering; unrelated roots stay live. |
| Stream replace/update/remove | Abort/clean owned roots removed or changed by the resolved targets, then mount current matching roots. |
| Stream append/prepend/before/after | Preserve unrelated existing roots; mount inserted roots. An owned root whose contents change is rebuilt. |
| Ordinary DOM insertion/removal | Observe child-list mutations, reap detached/no-longer-matching roots and mount inserted matching roots. Cleanup follows the mutation; use signal/lifetime checks for pending work. |
| Before Turbo caching or page hide | Clean up before a snapshot; remount native roots on restoration. |

Rendering wrappers defer cleanup until actual execution. A Frame guard registered later can pause or select a no-op renderer without destroying live UI. Make Drive exit decisions before its cache boundary; a canceled body render is not draft protection. Attribute-only selector changes are not observed; select stable roots and replace them when configuration/schema changes. A retained root whose internals change through ordinary application DOM mutation needs application-owned lifecycle handling; child-list observation is not a general subtree refresh API.

Keep one owner per enhancement. Do not register a second editing controller for bridge-owned forms, or mount mixed-form file/repeatable children or table-owned column/selection children again. A callback may read an existing bridge-owned form without taking ownership; return cleanup only for what that callback owns. Avoid overlapping adapters for the same element. The integration does not own save transport, router policy, focus, draft storage, lookup caching or component configuration changes.

Supported scope is Turbo 8 Drive, ordinary Frames/Streams and stable native element roots. Permanent-node/morph preservation, custom stream actions and router-specific transitions remain application-managed. There is no automatic mounting from an element name, no registry of library components and no generator change. Native markup remains useful without the integration.

The [purchase supplier directory](../examples/README.md#supplier-directory-and-element-mounting) exercises Frames, Streams, canceled renders, pending lookup cancellation, direct replacement and history restoration. The [mixed-form example](../examples/README.md#mixed-forms-and-selection) uses registrations for its application-owned searchable selectors while its mixed form remains owned by the form bridge.

### Other component lifecycles

**The form bridge manages forms only.** Search, row selection, tabs, dropdowns and standalone file queues need application-selected initialization and cleanup. Use [optional element mounting](#optional-element-mounting) for stable roots, or the manual lifecycle below when application behavior needs finer control. A mixed form owns its repeatable groups and file queues; do not mount those children separately. Searchable selects retain application-owned enhancement and lookup callbacks. Import only what the view uses and follow each element’s contract; do not attach an editing controller to query forms or standalone file-intake queues.

For page-level row selection, place this setup in `app/javascript/application.js` after `installTurboEditing()`. If using a separate module, export a setup function and call it after the bridge; a static import alone executes its module before the importing file’s body. `#project-selection` is an application-chosen root using the [row-selection markup](elements/row-selection.md#default-markup):

```js
import { enhanceTableSelection } from "fieldwork/table-selection";

let selection;
let selectionRoot = null;
function unmountSelection() {
  selection?.destroy();
  selection = undefined;
  selectionRoot = null;
}
function mountSelection() {
  if (document.documentElement.hasAttribute('data-turbo-preview')) return;
  const root = document.querySelector('#project-selection');
  if (root === selectionRoot) return;
  unmountSelection();
  selectionRoot = root;
  if (root) selection = enhanceTableSelection(root);
}
document.addEventListener('turbo:before-cache', unmountSelection);
document.addEventListener('turbo:before-render', unmountSelection);
document.addEventListener('turbo:render', mountSelection);
document.addEventListener('turbo:load', mountSelection);
mountSelection();
```

This example covers initial load, full-page visits, failed full-page form responses (such as 422/503), and cached restoration. `turbo:render` handles body replacement after failed submissions; `turbo:load` handles visits. Comparing the live root prevents double mounting when both events fire. Register application listeners after the installed form bridge. For stable Frame/Stream roots, prefer the optional mounting integration. Manual Frame owners must defer destruction until the selected `event.detail.render` actually runs, then initialize new roots on `turbo:frame-load`; a paused/canceled render must not destroy live UI. For application-owned Stream replacement or removal, destroy affected controllers before changing the DOM and initialize replacements after rendering. The page-only example does not manage those boundaries. Existing application controllers can own this lifecycle; no additional framework is required.

Destroy before caching or replacing a root, even when initialization is idempotent. Preserve drafts and state as specified by the owning contract, abort pending application work, and prevent late results from updating removed views. Use the form controller’s `prepareForCache()` only for application-managed forms; the form bridge already calls it for its forms. Applications also own route focus and [unsaved-changes decisions](elements/confirmation.md).

Mounting a component should not itself move focus. The form bridge focuses server errors, an opted-in summary, or result feedback. Do not override that with a heading focus on every `turbo:render`: a failed submission is a form result, not a new task. Apply route focus on actual navigation only, preserving existing result/control focus and browser autofocus. Keep query-result focus with its query controller.

## Form details

### Helper options

`fieldwork_form_with` yields an ordinary Rails form builder. Its Fieldwork-specific keywords are:

| Keyword | Default and behavior |
| --- | --- |
| `mode:` | `:edit`; use `:create` for new records (Create can submit unchanged defaults; no Discard/change indicator). |
| `composition:` | `:fixed` by default; `:mixed` coordinates repeatable groups and file queues in one save scope. Use `multipart: true` and follow the [mixed-form baseline/navigation contract](elements/form-controller.md#mixed-forms). |
| `baseline:` | `nil` uses rendered control values. Pass explicit saved/initial attributes to preserve the baseline across rejected input; see [responses](#form-responses-and-baselines). |
| `message:`, `error:` | `nil`; success or failure feedback. Model errors also mark a failed response. |
| `submit_label:` | “Save changes” or “Create record”, according to mode. |
| `pending_label:` | `nil` uses the mode’s standard pending text. Supply an accurate label for review, upload or validation steps, such as “Reviewing request…”. A submit button’s `data-editing-pending-label` overrides this form-wide label. |
| `discard_label:` | “Discard changes”; used in edit mode. |
| `cancel:` | `nil`; a URL adds an ordinary, unguarded Cancel link. |
| `actions:` | `nil`; a callable receiving the builder replaces default submit/reset buttons. See [custom actions](#custom-actions). |
| `actions_position:` | `:end` places actions after the fields. Use `:start` to render the action row before them, with result feedback beside it. This puts the normal submit action before native row or preview submit buttons, giving Enter a predictable default. |

Other keywords pass to Rails `form_with`, including `model:`, `url:`, `scope:`, `id:`, `data:`, and `local:`. Fieldwork supplies the fieldset, field stack, action row, change indicator, and result notice; author fields inside the block rather than duplicating those wrappers. For error summaries, use the [managed-summary markup](elements/form-controller.md#managed-error-summary) inside the block; there is no summary helper option.

| Helper | Arguments and supported options |
| --- | --- |
| `fieldwork_field(form, attribute, ...)` | `type: :text` by default; Rails text-like fields or `:textarea`. `label:` defaults to Rails' attribute label; `hint:` adds associated help. Other options are native/Rails field attributes such as `id:`, `required:`, `maxlength:`, `autocomplete:`, `data:`, and `aria:`. |
| `fieldwork_select(form, attribute, choices, ...)` | Rails choice collections; `label:`/`hint:` as above, plus `include_blank:`, `prompt:`, and `select_options:`. Other options are native select attributes; see [select fields](#select-fields). |

Both field helpers render labels, hints, and associated model errors. Use ordinary Rails/native markup for controls outside their scope, such as checkbox/radio groups; follow the owning [choice-control contract](elements/choice-controls.md).

### Form responses and baselines

Capture persisted `baseline:` values before assigning submitted attributes, and retain that baseline when re-rendering a failure. Attempted input must not become the saved baseline. The helper encodes it by input name in `data-editing-baseline`; values are lists of native input values, with an empty list for an unchecked checkbox/radio group.

| Response | Application behavior |
| --- | --- |
| Validation failure | Render the attempted model and its errors with status 422 and the previous baseline. |
| Operation failure | Retain attempted values and baseline, use an appropriate failure status, and pass `error:` with recovery guidance. |
| Saved | Redirect with status 303 to a view of saved values and confirmation, or replace the whole form/container with a Turbo Stream containing saved values, a new baseline, and `message:`. |

A response inside a Turbo Frame must include its matching frame, including on validation failure. Replace whole forms/containers when errors or normalized values change. Rails remains authoritative for server validation; the form controller manages [result focus and optional error summaries](elements/form-controller.md#managed-error-summary).

`fieldwork_field` supports Rails text-like fields and `type: :textarea`. `fieldwork_select` supplies the same label/hint/error associations for native selects. Custom groups use ordinary markup with an associated `.field-error[data-field-error-for="control-id"]`.

### Custom actions

The Rails helper accepts `submit_label:`, `discard_label:`, and `cancel:` (a URL). For multiple or specialized actions, supply an `actions:` callable receiving the ordinary Rails builder:

```erb
<% actions = ->(form) do %>
  <%= button_tag "Discard edits", type: "reset", class: "button", hidden: true %>
  <%= button_tag "Save profile", type: "submit", name: "intent", value: "save", class: "button" %>
  <%= button_tag "Save and close", type: "submit", name: "intent", value: "close",
        class: "button", data: { intent: "primary", editing_allow_unchanged: true } %>
<% end %>
<%= fieldwork_form_with model: @profile, baseline: @saved_attributes,
      cancel: profiles_path, actions: actions do |form| %>
  <%= fieldwork_field form, :name, required: true %>
<% end %>
```

The application decides what each submitted intent does and where Cancel goes. Hide custom reset buttons in server markup when they require enhancement; Fieldwork reveals them on setup. In a Turbo Frame, give a navigation action `data-turbo-frame="_top"` when it should leave the frame.

### Select fields

```erb
<%= fieldwork_select form, :reviewer_id, reviewer_choices,
      label: "Reviewed by", include_blank: "Choose a reviewer", required: true,
      hint: "The person who performed the review." %>
```

Choices use Rails' ordinary select conventions. `include_blank:` and `prompt:` are convenience options; `select_options:` passes Rails choice options such as `selected:` or disabled choices. Other options are native select attributes (`id:`, `multiple:`, `disabled:`, `data:`, `aria:`). Model selection, submitted values after errors, custom IDs, hints, existing described-by references, and server error associations are preserved. Multi-select hidden inputs remain Rails-owned.
