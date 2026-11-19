// Shared lifecycle for the task-specific confirmation helpers; not an application API.
let activeConfirmation = null;
let nextId = 0;

export function showConfirmation({
  title,
  description,
  cancelLabel,
  confirmLabel,
  kind,
  opener,
  signal,
}) {
  if (signal?.aborted || activeConfirmation) return Promise.resolve(false);
  const dialog = document.createElement('dialog');
  dialog.className = 'dialog';
  dialog.setAttribute(`data-${kind}-confirmation`, '');
  dialog.innerHTML =
    '<form method="dialog" class="stack" data-gap="section"><div class="stack" data-gap="tight"><h2></h2><p class="muted"></p></div><div class="dialog-actions"><button class="button" value="cancel" autofocus></button><button class="button" data-intent="danger" value="confirm"></button></div></form>';
  let id;
  do {
    id = `fieldwork-confirmation-${++nextId}`;
  } while (document.getElementById(`${id}-title`) || document.getElementById(`${id}-description`));
  const heading = dialog.querySelector('h2'),
    detail = dialog.querySelector('p');
  heading.id = `${id}-title`;
  heading.textContent = title;
  detail.id = `${id}-description`;
  detail.textContent = description;
  dialog.querySelector('[value="cancel"]').textContent = cancelLabel;
  dialog.querySelector('[value="confirm"]').textContent = confirmLabel;
  dialog.setAttribute('aria-labelledby', heading.id);
  dialog.setAttribute('aria-describedby', detail.id);
  document.body.append(dialog);
  activeConfirmation = dialog;
  return new Promise((resolve, reject) => {
    const events = new AbortController();
    let finished = false;
    function cleanup() {
      finished = true;
      events.abort();
      signal?.removeEventListener('abort', cancel);
      if (dialog.open) dialog.close();
      dialog.remove();
      if (activeConfirmation === dialog) activeConfirmation = null;
      if (opener?.isConnected && !opener.matches(':disabled')) opener.focus();
    }
    function finish(approved) {
      if (finished) return;
      cleanup();
      resolve(approved);
    }
    function cancel() {
      finish(false);
    }
    dialog.addEventListener('close', () => finish(dialog.returnValue === 'confirm'), {
      signal: events.signal,
    });
    dialog.addEventListener(
      'cancel',
      () => {
        dialog.returnValue = 'cancel';
      },
      { signal: events.signal }
    );
    window.addEventListener('pagehide', cancel, { signal: events.signal });
    signal?.addEventListener('abort', cancel, { once: true });
    // A confirmation may cover a task dialog; another Fieldwork confirmation cannot stack.
    try {
      dialog.showModal();
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}
