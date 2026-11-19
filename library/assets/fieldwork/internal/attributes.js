// Capture only attributes an enhancement owns; restore their first authored values.
export function createAttributeSnapshot() {
  const originals = new Map();

  function remember(element, ...names) {
    if (!originals.has(element)) originals.set(element, new Map());
    const attributes = originals.get(element);
    for (const name of names) {
      if (!attributes.has(name)) attributes.set(name, element.getAttribute(name));
    }
  }

  return {
    remember,
    set(element, name, value) {
      remember(element, name);
      if (value === null) element.removeAttribute(name);
      else element.setAttribute(name, value);
    },
    restore() {
      for (const [element, attributes] of originals) {
        for (const [name, value] of attributes) {
          if (value === null) element.removeAttribute(name);
          else element.setAttribute(name, value);
        }
      }
      originals.clear();
    },
  };
}
