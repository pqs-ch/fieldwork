// Forms own validation while enhanced; field components reuse their message.
export const formFieldErrors = new WeakMap();

export function findFieldError(field, container) {
  const described = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
  return [...container.querySelectorAll('.field-error')].find(node =>
    (field.id && node.dataset.fieldErrorFor === field.id) || (node.id && described.includes(node.id))
  );
}
