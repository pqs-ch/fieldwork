import { showConfirmation } from './internal/confirmation.js';

// A decision only: applications own navigation, saving, and draft disposal.
export function confirmUnsavedChanges({ name, opener = document.activeElement, signal } = {}) {
  if (!name?.trim())
    throw new TypeError('Unsaved-changes confirmation needs a name for the editing task.');
  return showConfirmation({
    title: 'Leave without saving?',
    description: `Your changes to ${name} have not been saved. Leaving will lose these changes.`,
    cancelLabel: 'Keep editing',
    confirmLabel: 'Leave without saving',
    kind: 'unsaved',
    opener,
    signal,
  });
}
