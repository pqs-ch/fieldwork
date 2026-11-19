const reminderStatus = document.querySelector('[data-reset-reminder]');
if (reminderStatus) {
  try {
    localStorage.removeItem('fieldwork-draft-example:reminder');
    reminderStatus.textContent = 'The personal reminder stored in this browser was also cleared.';
  } catch {
    reminderStatus.textContent = 'Server data was reset. Browser storage is unavailable; clear the personal reminder when storage is available again.';
  }
}
