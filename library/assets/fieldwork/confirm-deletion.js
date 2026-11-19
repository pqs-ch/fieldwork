import { showConfirmation } from './internal/confirmation.js';

// Confirmation only: callers retain ownership of submission and deletion.
export function confirmDeletion({
  name,
  description,
  opener = document.activeElement,
  signal,
  action = 'delete',
} = {}) {
  if (!name?.trim() || !description?.trim())
    throw new TypeError('Deletion confirmation needs an item name and consequence.');
  if (!['delete', 'remove'].includes(action))
    throw new TypeError('Use delete or remove confirmation wording.');
  const verb = action === 'remove' ? 'Remove' : 'Delete';
  return showConfirmation({
    title: `${verb} ${name}?`,
    description,
    cancelLabel: 'Cancel',
    confirmLabel: verb,
    kind: 'delete',
    opener,
    signal,
  });
}
