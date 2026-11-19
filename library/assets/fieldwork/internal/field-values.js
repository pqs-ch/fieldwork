// Native values only. DOM/File references stay in memory; this is not persistence.
export const fieldValue = field => {
  if (['checkbox', 'radio'].includes(field.type)) return field.checked;
  if (field.type === 'file') return [...field.files];
  if (field instanceof HTMLSelectElement && field.multiple)
    return [...field.selectedOptions].map(option => option.value).sort();
  return field.value;
};
export function restoreField(field, value) {
  if (['checkbox', 'radio'].includes(field.type)) field.checked = value;
  else if (field.type === 'file') {
    if (!value.length) field.value = '';
    else {
      const transfer = new DataTransfer();
      value.forEach(file => transfer.items.add(file));
      field.files = transfer.files;
    }
  } else if (field instanceof HTMLSelectElement && field.multiple)
    [...field.options].forEach(option => { option.selected = value.includes(option.value); });
  else field.value = value;
}
export const captureFields = root =>
  [...root.querySelectorAll('input,select,textarea')].map(field => ({ field, value: fieldValue(field) }));
export const restoreFields = fields => fields.forEach(({ field, value }) => restoreField(field, value));
