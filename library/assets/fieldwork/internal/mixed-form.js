import { enhanceRepeatableGroup } from '../repeatable-group.js';
import { enhanceFileSelection } from '../file-selection.js';

// The form owns these child controllers. Snapshots contain live DOM/File references.
export function composeMixedForm(form) {
  const roots = [...form.querySelectorAll('[data-repeatable-group], [data-file-selection]')];
  for (const root of roots) {
    if (root.parentElement.closest('[data-repeatable-group], [data-file-selection]'))
      throw new Error('Mixed forms support separate, non-nested repeatable groups and file queues.');
    if (root.matches('[data-repeatable-group]') && (root.querySelector('input[type="file"]') || root.querySelector('template[data-repeat-template]')?.content.querySelector('input[type="file"]')))
      throw new Error('Keep mixed-form files in a separate file-selection queue.');
    if (form.dataset.editingResult === 'invalid' && root.matches('[data-repeatable-group]') &&
        !root.querySelector('template[data-repeat-baseline]'))
      throw new Error('Rejected mixed forms need each repeatable group’s saved data-repeat-baseline template.');
  }
  if ([...form.querySelectorAll('input[type="file"]')].some(input => !input.closest('[data-file-selection]')))
    throw new Error('Mixed-form file inputs need a file-selection root.');
  const parts = [];
  try {
    for (const root of roots) {
      const files = root.matches('[data-file-selection]');
      let controller = files ? enhanceFileSelection(root, { managed: true }) : enhanceRepeatableGroup(root);
      if (!controller) {
        // No DataTransfer assignment: keep the native chooser and native submission.
        const input = root.querySelector('input[type="file"]');
        const ids = new WeakMap(); let nextId = 0;
        const empty = { files: [], signature: '[]' };
        controller = {
          emptyState: empty,
          captureState() {
            const files = [...input.files];
            return { files, signature: JSON.stringify(files.map(file => {
              if (!ids.has(file)) ids.set(file, ++nextId);
              return ids.get(file);
            })) };
          },
          restoreState(state) {
            if (state.files.length) {
              if ([...input.files].length === state.files.length && state.files.every((file, index) => input.files[index] === file)) return;
              throw new Error('Reselect files in this browser.');
            }
            input.value = '';
          },
          setBusy() {}, destroy() {},
        };
      }
      parts.push({ root, files, controller });
    }
  } catch (error) {
    parts.forEach(part => part.controller.destroy());
    throw error;
  }
  return {
    baseline: parts.map(({ files, controller }) => files ? controller.emptyState : controller.baselineState),
    owns(field) {
      return parts.some(({ root, files }) =>
        root.querySelector(files ? '[data-file-list]' : '[data-repeat-list]').contains(field) ||
        (files && field === root.querySelector('input[type="file"]')));
    },
    capture() { return parts.map(part => part.controller.captureState()); },
    changed(state, baseline) { return state.some((part, index) => part.signature !== baseline[index].signature); },
    restore(state) { parts.forEach((part, index) => part.controller.restoreState(state[index])); },
    accepted(state) {
      return parts.map((part, index) => {
        if (!part.files) return state[index];
        part.controller.restoreState(part.controller.emptyState);
        return part.controller.emptyState;
      });
    },
    setBusy(value) { parts.forEach(part => part.controller.setBusy(value)); },
    destroy() { parts.forEach(part => part.controller.destroy()); },
  };
}
