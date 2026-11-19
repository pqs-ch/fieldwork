/** Editing UI without a transport dependency.
 * Supply fields and optional save(FormData). Without save, native/Turbo submission
 * is left intact. Existing server-rendered editing UI is reused.
 */
import { enhanceErrorSummary } from './error-summary.js';
import { composeMixedForm } from './internal/mixed-form.js';
import { fieldValue, restoreField } from './internal/field-values.js';
import { showConfirmation } from './internal/confirmation.js';

const controllers = new WeakMap();
let nextErrorId = 0;

export function enhanceForm(
  form,
  {
    save,
    composition = form.dataset.formComposition || 'fixed',
    mode = form.dataset.formMode || 'edit',
    successMessage = mode === 'create' ? 'Record created.' : 'Changes saved.',
  } = {}
) {
  if (controllers.has(form)) return controllers.get(form);
  if (!['edit', 'create'].includes(mode)) throw new TypeError('Form mode must be edit or create.');
  if (!['fixed', 'mixed'].includes(composition)) throw new TypeError('Composition must be fixed or mixed.');
  const creating = mode === 'create';
  if (save !== undefined && typeof save !== 'function')
    throw new TypeError('save must be a function.');
  if (composition !== 'mixed' && form.querySelector('input[type="file"]'))
    throw new Error('File inputs are not supported by this editing pattern.');
  const summary = form.querySelector('[data-form-error-summary]');
  const summaryList = summary?.querySelector('[data-form-error-list]');
  if (summary && !summaryList)
    throw new Error('The form error summary needs a data-form-error-list.');
  const readFields = () => [...form.querySelectorAll('input, select, textarea')].filter(
    field => field.form === form && !['hidden', 'submit', 'reset', 'button', 'image'].includes(field.type)
  );
  let fields;
  const existingActions = form.querySelector('.form-actions');
  if (
    existingActions &&
    ![...form.querySelectorAll('button, input')].some(control => control.type === 'submit')
  )
    throw new Error('The editing form needs a submit action.');
  const baselineValues = form.dataset.editingBaseline
    ? JSON.parse(form.dataset.editingBaseline)
    : null;
  if (
    form.dataset.editingBaseline &&
    (!baselineValues || typeof baselineValues !== 'object' || Array.isArray(baselineValues))
  )
    throw new TypeError('The editing baseline must be an object keyed by input name.');
  if (creating) form.dataset.formMode = 'create';
  let group = form.querySelector('[data-form-fields]');
  if (!group) {
    group =
      form.children.length === 1 && form.firstElementChild.matches('fieldset')
        ? form.firstElementChild
        : null;
    if (!group) {
      group = document.createElement('fieldset');
      group.append(...form.childNodes);
      form.append(group);
    }
    group.dataset.formFields = '';
    const content = document.createElement('div');
    content.className = 'stack';
    content.dataset.gap = 'section';
    const directActions = existingActions?.parentElement === group ? existingActions : null;
    content.append(
      ...[...group.childNodes].filter(node => node.nodeName !== 'LEGEND' && node !== directActions)
    );
    group.insertBefore(content, directActions);
  }
  let actions = form.querySelector('.form-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'form-actions';
    // Fixed library markup; application values never enter this template.
    actions.innerHTML = creating
      ? '<button class="button" type="submit" data-intent="primary">Create record</button>'
      : '<p class="hint" data-form-changes role="status" aria-atomic="true"></p><button class="button" type="reset">Discard changes</button><button class="button" type="submit" data-intent="primary">Save changes</button>';
    group.append(actions);
  }
  let changes = actions.querySelector('[data-form-changes]');
  if (!changes) {
    changes = document.createElement('p');
    changes.className = 'hint';
    changes.dataset.formChanges = '';
    changes.setAttribute('role', 'status');
    changes.setAttribute('aria-atomic', 'true');
    actions.prepend(changes);
  }
  const originalChangesHidden = changes.hidden;
  changes.hidden = creating || originalChangesHidden;
  const actionControls = [...form.querySelectorAll('button, input')];
  const submits = actionControls.filter(control => control.type === 'submit');
  const resets = actionControls.filter(control => control.type === 'reset');
  if (!submits.length) throw new Error('The editing form needs a submit action.');
  const actionStates = new Map(
    [...submits, ...resets].map(control => [
      control,
      {
        disabled: control.disabled,
        hidden: control.hidden,
        nodes: [...control.childNodes],
        value: control.value,
      },
    ])
  );
  resets.forEach(control => {
    control.hidden = false;
  });
  const allowsUnchanged = control => control?.hasAttribute('data-editing-allow-unchanged');
  let activeSubmit;
  function restoreAction(control) {
    const original = actionStates.get(control);
    if (control instanceof HTMLInputElement) control.value = original.value;
    else control.replaceChildren(...original.nodes);
  }
  let status = form.querySelector('[data-form-status]');
  if (!status) {
    status = document.createElement('p');
    status.className = 'notice';
    status.dataset.formStatus = '';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-atomic', 'true');
    status.tabIndex = -1;
    form.append(status);
  }

  const mixed = composition === 'mixed' ? composeMixedForm(form) : null;
  const trackedFields = readFields().filter(field => !mixed?.owns(field));
  const errorGroups = [];
  const fieldErrors = new Map();
  const summaryController = summary ? enhanceErrorSummary(summary, { focus: false }) : null;
  function registerFields() {
    fields = readFields();
    const previous = new Map(fieldErrors);
    errorGroups.length = 0;
    fieldErrors.clear();
    for (const field of fields) {
      if (fieldErrors.has(field)) continue;
      const members =
        field.type === 'radio' && field.name
          ? fields.filter(candidate => candidate.type === 'radio' && candidate.name === field.name)
          : [field];
      const described = (field.getAttribute('aria-describedby') || '').split(/\s+/);
      let error = [...form.querySelectorAll('.field-error')].find(
        node => (field.id && node.dataset.fieldErrorFor === field.id) || described.includes(node.id)
      );
      if (!error) {
        error = document.createElement('p');
        do {
          error.id = `fieldwork-error-${++nextErrorId}`;
        } while (document.getElementById(error.id) || form.querySelector(`#${error.id}`));
        error.className = 'field-error';
        error.hidden = true;
        if (field.id) error.dataset.fieldErrorFor = field.id;
        const fieldset = field.closest('fieldset');
        if (
          field.type === 'radio' &&
          fieldset !== group &&
          members.every(member => fieldset.contains(member))
        )
          fieldset.append(error);
        else {
          const last = members.at(-1);
          const container = last.closest('.field');
          if (container) container.append(error);
          else (last.closest('.check') || last.closest('label') || last).after(error);
        }
      }
      const entry = {
        members, error,
        serverMessage: previous.get(field)?.serverMessage ?? (error.hidden ? '' : error.textContent),
      };
      errorGroups.push(entry);
      for (const member of members) {
        const describedBy = new Set(
          (member.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)
        );
        describedBy.add(error.id);
        member.setAttribute('aria-describedby', [...describedBy].join(' '));
        fieldErrors.set(member, entry);
      }
    }
  }
  registerFields();
  function capture() {
    return { values: trackedFields.map(fieldValue), parts: mixed?.capture() };
  }
  let baseline = capture();
  if (baselineValues) {
    const values = baselineValues;
    baseline.values = trackedFields.map((field, index) => {
      if (!Object.hasOwn(values, field.name)) return baseline.values[index];
      const saved = [].concat(values[field.name]).map(String);
      if (['radio', 'checkbox'].includes(field.type)) return saved.includes(field.value);
      if (field instanceof HTMLSelectElement && field.multiple)
        return saved.sort();
      return saved[0] ?? '';
    });
  }
  if (mixed) baseline.parts = mixed.baseline;
  function rememberBaseline() {
    const values = Object.create(null);
    trackedFields.forEach((field, index) => {
      if (!field.name) return;
      values[field.name] ||= [];
      if (['checkbox', 'radio'].includes(field.type)) {
        if (baseline.values[index]) values[field.name].push(field.value);
      } else if (field instanceof HTMLSelectElement && field.multiple) {
        values[field.name].push(...baseline.values[index]);
      } else values[field.name].push(baseline.values[index]);
    });
    form.dataset.editingBaseline = JSON.stringify(values);
  }
  function restore(state) {
    if (mixed) mixed.restore(state.parts);
    trackedFields.forEach((field, index) => restoreField(field, state.values[index]));
    registerFields();
  }
  const isDirty = () => {
    const current = capture();
    return JSON.stringify(current.values) !== JSON.stringify(baseline.values) ||
      Boolean(mixed?.changed(current.parts, baseline.parts));
  };
  let complete =
    creating && (form.dataset.formComplete === 'true' || form.dataset.editingResult === 'saved');
  if (complete) form.dataset.formComplete = 'true';
  let busy = false;
  let active = true, resetting = false;
  let previousFocus;
  let submitted;
  const originalNoValidate = form.noValidate;
  const events = new AbortController();
  const on = (type, listener) => form.addEventListener(type, listener, { signal: events.signal });
  const constraints = mixed ? new MutationObserver(records => {
    if (!active || busy || complete || !records.some(({ target }) =>
      target.matches('fieldset') || (target.matches('input,select,textarea') && target.form === form))) return;
    registerFields();
    errorGroups.filter(entry => !entry.error.hidden).forEach(showFieldError);
    updateSummary();
  }) : null;
  constraints?.observe(form, {
    attributes: true, subtree: true, attributeFilter: ['required', 'disabled', 'readonly'],
  });

  function updateActions() {
    const dirty = !complete && isDirty();
    form.dataset.dirty = String(dirty);
    submits.forEach(control => {
      control.disabled =
        actionStates.get(control).disabled ||
        busy ||
        complete ||
        (!creating && !dirty && !allowsUnchanged(control));
    });
    resets.forEach(control => {
      control.disabled = actionStates.get(control).disabled || busy || complete || !dirty;
    });
    const text = dirty ? 'Unsaved changes' : 'No unsaved changes';
    if (changes.textContent !== text) changes.textContent = text;
  }
  function announce(state, message = '') {
    form.dataset.state = creating
      ? { unchanged: 'ready', unsaved: 'draft', saving: 'creating', saved: 'created' }[state] ||
        state
      : state;
    status.textContent = message;
    status.dataset.tone = state === 'failed' ? 'error' : state === 'saved' ? 'success' : 'neutral';
    updateActions();
  }
  function showFieldError(entry) {
    const invalid = entry.members.find(field => field.willValidate && !field.validity.valid);
    const message = invalid?.validationMessage || entry.serverMessage;
    entry.members.forEach(member => {
      if (message && member.willValidate) member.setAttribute('aria-invalid', 'true');
      else member.removeAttribute('aria-invalid');
    });
    entry.error.hidden = !message;
    entry.error.textContent = message;
  }
  function clearErrors() {
    fields.forEach(field => field.removeAttribute('aria-invalid'));
    errorGroups.forEach(entry => {
      entry.serverMessage = '';
      entry.error.hidden = true;
      entry.error.textContent = '';
    });
    updateSummary();
  }
  function updateSummary() {
    if (!summary) return;
    summaryList.replaceChildren();
    for (const entry of errorGroups) {
      if (entry.error.hidden || !entry.error.textContent) continue;
      const field = entry.members.find(member => member.willValidate) || entry.members[0];
      const item = document.createElement('li');
      const message = document.createElement(field.id ? 'a' : 'span');
      if (field.id) message.setAttribute('href', `#${encodeURIComponent(field.id)}`);
      // Native validation messages can be generic; identify the affected field too.
      const legend =
        field.type === 'radio' ? field.closest('fieldset')?.querySelector(':scope > legend') : null;
      const rowTitle = field.closest('[data-repeat-item]')?.querySelector('[data-repeat-title]')?.textContent.trim();
      const fieldLabel = (legend || field.labels?.[0])?.textContent.trim();
      const label = [rowTitle, fieldLabel].filter(Boolean).join(' — ');
      message.textContent = `${label ? `${label}: ` : ''}${entry.error.textContent}`;
      item.append(message);
      summaryList.append(item);
    }
    summary.hidden = !summaryList.childElementCount;
  }
  function customPendingLabel() {
    return activeSubmit?.dataset.editingPendingLabel || form.dataset.editingPendingLabel;
  }
  function pending(value, restoreFocus = true) {
    if (value)
      previousFocus = form.contains(document.activeElement) ? document.activeElement : null;
    busy = value;
    group.disabled = value || complete;
    mixed?.setBusy(value || complete);
    form.setAttribute('aria-busy', String(value));
    if (activeSubmit) {
      if (!value) restoreAction(activeSubmit);
      else if (activeSubmit instanceof HTMLInputElement)
        activeSubmit.value = customPendingLabel() || (creating ? 'Creating…' : 'Saving…');
      else {
        const spinner = document.createElement('span');
        spinner.className = 'spinner';
        spinner.setAttribute('aria-hidden', 'true');
        activeSubmit.replaceChildren(spinner, customPendingLabel() || (creating ? 'Creating…' : 'Saving…'));
      }
    }
    updateActions();
    if (
      !value &&
      restoreFocus &&
      previousFocus?.isConnected &&
      (document.activeElement === document.body || document.activeElement === previousFocus)
    ) {
      (previousFocus.matches(':disabled') ? status : previousFocus).focus();
    }
  }
  function edited(event) {
    if (!active || busy || complete || resetting) return;
    if (mixed) registerFields();
    if (!fields.includes(event.target) && !event.type.startsWith('fieldwork:')) return;
    const entry = fieldErrors.get(event.target);
    if (entry) {
      entry.serverMessage = '';
      if (!entry.error.hidden) showFieldError(entry);
    }
    const dirty = isDirty();
    if (!dirty) clearErrors();
    else if (summary && !summary.hidden) updateSummary();
    announce(dirty ? 'unsaved' : 'unchanged');

  }
  function startSubmission(submitter) {
    if (!active || busy || complete || resetting) return;
    activeSubmit = submits.includes(submitter)
      ? submitter
      : submits.find(control => !control.disabled) || submits[0];
    submitted = capture();
    pending(true);
    announce('saving', customPendingLabel() || (creating ? 'Creating the record…' : 'Saving your changes…'));
  }
  function finishSubmission({ success, message } = {}) {
    if (!active || !busy) return;
    if (success) {
      if (creating) {
        complete = true;
        form.dataset.formComplete = 'true';
      }
      baseline = submitted;
      if (mixed) baseline.parts = mixed.accepted(submitted.parts);
      rememberBaseline();
      announce(
        !creating && isDirty() ? 'unsaved' : 'saved',
        !creating && isDirty()
          ? `${successMessage} Newer changes are still unsaved.`
          : successMessage
      );
    } else
      announce(
        'failed',
        message ||
          (creating
            ? 'Could not create the record. Your entries are preserved. Try again.'
            : 'Could not save your changes. Your entries are preserved. Try again.')
      );
    pending(false);
  }
  form.noValidate = true;
  on('input', edited);
  on('change', edited);
  if (mixed) for (const type of ['fieldwork:repeat-added', 'fieldwork:repeat-removed', 'fieldwork:repeat-restored', 'fieldwork:fileschange']) on(type, edited);
  on('submit', async event => {
    if (event.defaultPrevented) return;
    if (busy || complete || resetting || (!creating && !isDirty() && !allowsUnchanged(event.submitter))) {
      event.preventDefault();
      return;
    }
    if (mixed) registerFields();
    if (!event.submitter?.formNoValidate) {
      errorGroups.forEach(showFieldError);
      updateSummary();
      if (!form.checkValidity()) {
        event.preventDefault();
        announce('unsaved', 'Check the highlighted fields and try again.');
        status.dataset.tone = 'error';
        if (summary && !summary.hidden) summaryController.focus();
        else fields.find(field => field.willValidate && !field.validity.valid)?.focus();
        return;
      }
    }
    if (!save) return; // Rails, Turbo, or the browser owns submission.
    event.preventDefault();
    const data = new FormData(form, event.submitter); // Include the chosen action before disabling controls.
    startSubmission(event.submitter);
    try {
      await save(data);
      finishSubmission({ success: true });
    } catch (error) {
      finishSubmission({
        success: false,
        message: error instanceof Error ? error.message : undefined,
      });
    }
  });
  on('reset', async event => {
    if (event.defaultPrevented) return;
    event.preventDefault();
    if (busy || complete || resetting || !isDirty()) return;
    const opener = document.activeElement;
    const focusWasOnReset = resets.includes(opener);
    if (mixed?.changed(capture().parts, baseline.parts)) {
      resetting = true;
      const approved = await showConfirmation({
        title: 'Discard form changes?',
        description: 'Restore saved fields and rows and remove unsaved file choices. Saved attachments will not be deleted.',
        cancelLabel: 'Keep editing', confirmLabel: 'Discard changes', kind: 'discard',
        opener, signal: events.signal,
      });
      resetting = false;
      if (!approved || !active || busy || complete) return;
    }
    restore(baseline);
    clearErrors();
    announce(
      'unchanged',
      creating
        ? 'Draft reset to its initial values.'
        : 'Changes discarded. Your saved values have been restored.'
    );
    // Applications can now update dependent visibility/constraints synchronously.
    form.dispatchEvent(new CustomEvent('fieldwork:discarded', { bubbles: true }));
    if (!active) return;
    form.dataset.state = creating
      ? isDirty()
        ? 'draft'
        : 'ready'
      : isDirty()
        ? 'unsaved'
        : 'unchanged';
    updateActions();
    if (focusWasOnReset && form.isConnected) status.focus();
  });

  const controller = {
    get hasChanges() {
      return !complete && isDirty();
    },
    get isComplete() {
      return complete;
    },
    get isSubmitting() {
      return busy;
    },
    startSubmission,
    finishSubmission,
    focusResult() {
      if (form.dataset.editingResult === 'invalid') {
        if (summary && !summary.hidden) summaryController.focus();
        else
          (fields.find(field => field.getAttribute('aria-invalid') === 'true') || status).focus();
      } else if (complete || form.dataset.editingResult === 'saved') status.focus();
    },
    prepareForCache() {
      if (busy) pending(false, false);
      rememberBaseline();
      const current = capture();
      // Snapshot caches clone attributes; retain current edits as well as baseline.
      fields.forEach(field => {
        if (field.type === 'file') return;
        if (['checkbox', 'radio'].includes(field.type)) field.defaultChecked = field.checked;
        else if (field instanceof HTMLSelectElement)
          [...field.options].forEach(option => {
            option.defaultSelected = option.selected;
          });
        else field.defaultValue = field.value;
      });
      restore(current);
      delete form.dataset.editingResult;
      if (complete) announce('saved', status.textContent || successMessage);
      else if (status.dataset.tone !== 'error') announce(isDirty() ? 'unsaved' : 'unchanged');
    },
    destroy() {
      if (!active) return;
      if (busy) pending(false, false);
      active = false;
      events.abort();
      constraints?.disconnect();
      mixed?.destroy();
      summaryController?.destroy();
      form.noValidate = originalNoValidate;
      changes.hidden = creating || originalChangesHidden;
      actionStates.forEach((original, control) => {
        restoreAction(control);
        control.disabled = original.disabled;
        control.hidden = original.hidden;
      });
      controllers.delete(form);
    },
  };
  controllers.set(form, controller);
  group.disabled = complete;
  mixed?.setBusy(complete);
  updateSummary();
  rememberBaseline();
  if (errorGroups.some(entry => entry.serverMessage) || status.dataset.tone === 'error') {
    announce('failed', status.textContent || 'Check the highlighted fields and try again.');
  } else if (complete || form.dataset.editingResult === 'saved')
    announce('saved', status.textContent || successMessage);
  else announce(isDirty() ? 'unsaved' : 'unchanged');
  return controller;
}
