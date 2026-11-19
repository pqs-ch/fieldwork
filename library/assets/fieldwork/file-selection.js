// Review files and optional descriptions before native or application-owned upload.
import { confirmDeletion } from './confirm-deletion.js';
import { captureFields, restoreFields } from './internal/field-values.js';
const controllers = new WeakMap();
let nextId = 0;
export function enhanceFileSelection(root, { managed = false } = {}) {
  if (controllers.has(root)) return controllers.get(root);
  const input = root.querySelector('input[type="file"]');
  const list = root.querySelector('[data-file-list]');
  const template = root.querySelector('template[data-file-template]');
  if (!input || root.querySelectorAll('input[type="file"]').length !== 1 || !input.name || !list || !template || template.content.children.length !== 1)
    throw new Error('Supply a named file input, list, and single-item template.');
  const prototype = template.content.firstElementChild;
  if (
    !prototype.matches('[data-file-item]') ||
    prototype.querySelector('input[type="file"]') ||
    !prototype.querySelector('[data-file-name]') ||
    !prototype.querySelector('button[data-file-remove]')
  )
    throw new Error('The file item needs a name and native Remove button.');
  const templateIds = [prototype, ...prototype.querySelectorAll('[id]')]
    .filter(el => el.id)
    .map(el => el.id);
  if (
    templateIds.some(id => !id.includes('__KEY__')) ||
    new Set(templateIds).size !== templateIds.length
  )
    throw new Error('Template IDs must be unique and contain __KEY__.');
  let transfer;
  try {
    transfer = new DataTransfer();
    transfer.items.add(new File([], 'test'));
  } catch {
    return;
  }
  // Native FileList assignment is required to keep ordinary multipart submission accurate.
  try {
    const probe = document.createElement('input');
    probe.type = 'file';
    probe.files = transfer.files;
    if (probe.files.length !== 1) return;
  } catch {
    return;
  }
  const initialFiles = [...input.files],
    initialItems = [...list.children];
  if (
    initialItems.length &&
    (initialItems.length !== initialFiles.length ||
      initialItems.some(item => !item.matches('[data-file-item]')))
  )
    throw new Error(
      'Queued file rows need their original native files. Render a fresh upload form after navigation that loses File objects.'
    );
  const events = new AbortController(),
    prefix = `fieldwork-files-${++nextId}`;
  const status = root.querySelector('[data-file-status]') || document.createElement('p');
  const generatedStatus = !status.parentElement;
  if (generatedStatus) {
    status.className = 'hint';
    status.setAttribute('role', 'status');
    root.append(status);
  }
  const originalInputDisabled = input.disabled;
  const dropzone = root.querySelector('[data-file-dropzone]') || root;
  const listContainer = root.querySelector('[data-file-list-container]') || list;
  const originalContainerHidden = listContainer.hidden;
  const enhancedHint = root.querySelector('[data-file-enhanced-hint]'),
    originalHintHidden = enhancedHint?.hidden;
  if (enhancedHint) enhancedHint.hidden = false;
  let entries = [],
    nextKey = 0,
    active = true,
    busy = false,
    confirming = false,
    resetApproved = false;
  const empty = root.querySelector('[data-file-empty]');
  const originalEmptyHidden = empty?.hidden,
    originalListHidden = list.hidden;
  const clear = root.querySelector('button[data-file-clear]'),
    originalClearDisabled = clear?.disabled;
  const on = (el, type, fn) => el.addEventListener(type, fn, { signal: events.signal });
  const value = () =>
    entries.map(entry => ({
      key: entry.key,
      file: entry.file,
      description: entry.item.querySelector('[data-file-description]')?.value || '',
    }));
  const emit = () =>
    root.dispatchEvent(
      new CustomEvent('fieldwork:fileschange', { bubbles: true, detail: { files: value() } })
    );
  function syncFiles() {
    const transfer = new DataTransfer();
    entries.forEach(entry => transfer.items.add(entry.file));
    input.files = transfer.files;
    list.hidden = entries.length === 0;
    listContainer.hidden = entries.length === 0;
    if (empty) empty.hidden = entries.length > 0;
    if (clear) clear.disabled = busy || input.matches(':disabled') || !entries.length;
  }
  function lock() {
    input.disabled = busy || originalInputDisabled;
    const blocked = input.matches(':disabled');
    for (const entry of entries)
      for (const control of entry.item.querySelectorAll('input,textarea,select,button'))
        control.disabled = blocked || entry.originalDisabled.get(control);
    if (clear) clear.disabled = busy || input.matches(':disabled') || !entries.length;
  }
  function append(files, initializing = false) {
    if (!active) return;
    if (!initializing && (busy || confirming || input.matches(':disabled'))) {
      syncFiles();
      return;
    }
    const incoming = [...files];
    if (!incoming.length) return;
    const accept = input.accept.split(',').map(type => type.trim().toLowerCase()).filter(Boolean);
    const rejected = incoming.find(
      file => accept.length && !accept.some(type => {
        if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type);
        if (type.endsWith('/*')) return file.type.toLowerCase().startsWith(type.slice(0, -1));
        return file.type.toLowerCase() === type;
      })
    );
    if ((!input.multiple && incoming.length > 1) || rejected) {
      syncFiles();
      status.textContent = rejected
        ? `${rejected.name} is not an accepted file type. Choose ${input.accept}. Selection unchanged.`
        : 'Choose or drop one file at a time. Selection unchanged.';
      return;
    }
    // A single-file chooser replaces its previous choice, just like a native input.
    if (!input.multiple) {
      entries = [];
      list.replaceChildren();
    }
    for (const file of incoming) {
      const key = `${prefix}-${nextKey++}`,
        item = prototype.cloneNode(true);
      for (const el of [item, ...item.querySelectorAll('*')])
        for (const attr of [...el.attributes])
          if (attr.value.includes('__KEY__'))
            el.setAttribute(attr.name, attr.value.replaceAll('__KEY__', key));
      item.dataset.fileKey = key;
      item.querySelector('[data-file-name]').textContent = file.name;
      const size = item.querySelector('[data-file-size]');
      if (size) {
        const scale = Math.min(4, file.size ? Math.floor(Math.log(file.size) / Math.log(1000)) : 0);
        size.textContent = new Intl.NumberFormat(undefined, {
          style: 'unit',
          unit: ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'][scale],
          unitDisplay: scale ? 'short' : 'long',
          maximumFractionDigits: scale ? 1 : 0,
        }).format(file.size / 1000 ** scale);
      }
      const remove = item.querySelector('[data-file-remove]');
      remove.disabled = false;
      remove.setAttribute('aria-label', `Remove ${file.name}`);
      const originalDisabled = new Map(
        [...item.querySelectorAll('input,textarea,select,button')].map(control => [
          control,
          control.disabled,
        ])
      );
      entries.push({ key, file, item, originalDisabled });
      list.append(item);
    }
    syncFiles();
    status.textContent = `${incoming.length} ${incoming.length === 1 ? 'file added' : 'files added'}. ${entries.length} selected.`;
    emit();
  }
  async function approve(entry, opener) {
    if (busy || confirming || !active || input.matches(':disabled') || !entries.length) return false;
    confirming = true;
    lock();
    const confirmed = await confirmDeletion({
      name: entry
        ? entry.file.name
        : `${entries.length} selected ${entries.length === 1 ? 'file' : 'files'}`,
      description: entry
        ? 'Remove this file and its description from the upload queue. Existing attachments will not be deleted.'
        : 'Clear these file choices and their descriptions from the upload queue. Existing attachments will not be deleted.',
      action: 'remove',
      opener,
      signal: events.signal,
    });
    confirming = false;
    if (active) lock();
    return confirmed && active && !busy && (!entry || entries.includes(entry));
  }
  async function clearSelection(opener = clear || input) {
    if (!(await approve(null, opener))) return false;
    entries = [];
    list.replaceChildren();
    syncFiles();
    status.textContent = 'File selection cleared.';
    emit();
    if (input.isConnected) input.focus();
    return true;
  }
  on(input, 'change', () => {
    const files = [...input.files];
    if (!files.length) {
      syncFiles();
      return;
    }
    append(files);
  });
  on(list, 'input', event => {
    if (event.target.matches('[data-file-description]')) emit();
  });
  on(list, 'click', async event => {
    const button = event.target.closest('button[data-file-remove]');
    if (!button || button.disabled) return;
    const entry = entries.find(entry => entry.item.contains(button));
    if (!entry || !(await approve(entry, button))) return;
    const index = entries.indexOf(entry);
    entry.item.remove();
    entries.splice(index, 1);
    syncFiles();
    status.textContent = `${entry.file.name} removed from selection. ${entries.length} selected.`;
    emit();
    (
      entries[index]?.item.querySelector('[data-file-remove]') ||
      entries[index - 1]?.item.querySelector('[data-file-remove]') ||
      input
    ).focus();
  });
  if (clear) on(clear, 'click', () => clearSelection(clear));
  if (input.form && !managed)
    on(input.form, 'reset', async event => {
      if (resetApproved) {
        resetApproved = false;
        return;
      }
      if (event.defaultPrevented || !entries.length) return;
      event.preventDefault();
      if (
        busy ||
        !(await approve(
          null,
          input.form.contains(document.activeElement) ? document.activeElement : input
        ))
      )
        return;
      entries = [];
      list.replaceChildren();
      syncFiles();
      emit();
      status.textContent = 'File selection cleared.';
      resetApproved = true;
      input.form.reset();
    });
  // A drop is an alternative to the native chooser, never a requirement.
  on(dropzone, 'dragover', event => {
    if (event.dataTransfer?.types.includes('Files')) {
      event.preventDefault();
      const blocked = busy || confirming || input.matches(':disabled');
      event.dataTransfer.dropEffect = blocked ? 'none' : 'copy';
      dropzone.toggleAttribute('data-file-dragover', !blocked);
    }
  });
  on(dropzone, 'dragleave', event => {
    if (!dropzone.contains(event.relatedTarget)) dropzone.removeAttribute('data-file-dragover');
  });
  on(dropzone, 'drop', event => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    dropzone.removeAttribute('data-file-dragover');
    append(event.dataTransfer.files);
  });
  on(window, 'pagehide', () => dropzone.removeAttribute('data-file-dragover'));
  const snapshots = new WeakSet();
  function captureState(selected = entries) {
    const state = { entries: [...selected], fields: selected.flatMap(entry => captureFields(entry.item)) };
    state.signature = JSON.stringify(selected.map(entry => [entry.key, entry.file.name,
      entry.file.size, entry.file.lastModified,
      state.fields.filter(({ field }) => entry.item.contains(field)).map(({ field, value }) => [field.name, value])
    ]));
    snapshots.add(state);
    return state;
  }
  const emptyState = captureState([]);
  const controller = {
    captureState,
    get emptyState() { return emptyState; },
    restoreState(state) {
      if (!active || !snapshots.has(state)) throw new TypeError('Use a state from this file queue.');
      entries = [...state.entries];
      list.replaceChildren(...entries.map(entry => entry.item));
      restoreFields(state.fields);
      syncFiles();
      lock();
      status.textContent = '';
      emit();
    },
    get files() {
      return value();
    },
    clear: clearSelection,
    setBusy(next) {
      if (!active) return;
      busy = Boolean(next);
      if (busy) dropzone.removeAttribute('data-file-dragover');
      lock();
    },
    destroy() {
      if (!active) return;
      active = false;
      events.abort();
      dropzone.removeAttribute('data-file-dragover');
      input.disabled = originalInputDisabled;
      if (clear) clear.disabled = originalClearDisabled;
      for (const entry of entries)
        for (const [control, disabled] of entry.originalDisabled)
          control.disabled = control.hasAttribute('data-file-remove') ? true : disabled;
      if (!entries.length) {
        list.hidden = originalListHidden;
        listContainer.hidden = originalContainerHidden;
        if (empty) empty.hidden = originalEmptyHidden;
      }
      if (generatedStatus) status.remove();
      if (enhancedHint) enhancedHint.hidden = originalHintHidden;
      controllers.delete(root);
    },
  };
  controllers.set(root, controller);
  if (initialItems.length) {
    entries = initialItems.map((item, index) => {
      const key = item.dataset.fileKey || `${prefix}-${nextKey++}`;
      item.dataset.fileKey = key;
      const originalDisabled = new Map(
        [...item.querySelectorAll('input,textarea,select,button')].map(control => [
          control,
          control.hasAttribute('data-file-remove') ? false : control.disabled,
        ])
      );
      return { key, file: initialFiles[index], item, originalDisabled };
    });
  } else if (initialFiles.length) append(initialFiles, true);
  syncFiles();
  lock();
  return controller;
}
