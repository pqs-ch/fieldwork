// Geometry only. Components own measurement order, sizing, dismissal, and focus.
export function viewportBounds(view, fallbackWidth = view.innerWidth) {
  const viewport = view.visualViewport;
  return {
    left: viewport?.offsetLeft || 0,
    top: viewport?.offsetTop || 0,
    width: viewport?.width || fallbackWidth,
    height: viewport?.height || view.innerHeight,
  };
}

export function outsideViewport(anchor, viewport) {
  return (
    anchor.bottom <= viewport.top ||
    anchor.top >= viewport.top + viewport.height ||
    anchor.right <= viewport.left ||
    anchor.left >= viewport.left + viewport.width
  );
}

export function popupSpace(anchor, viewport, contentHeight, preferredHeight, inset = 8) {
  const below = Math.max(0, viewport.top + viewport.height - anchor.bottom - inset * 2);
  const above = Math.max(0, anchor.top - viewport.top - inset * 2);
  const minimum = Math.min(contentHeight, preferredHeight);
  const placeBelow = below >= minimum || below >= above;
  const room = placeBelow ? below : above;
  return {
    placeBelow,
    // Tall triggers and large text can leave neither side usable; use the viewport.
    maxHeight: room >= minimum ? room : Math.max(0, viewport.height - inset * 2),
  };
}

export function popupPosition(anchor, viewport, panel, placeBelow, alignRight = false, inset = 8) {
  const left = alignRight ? anchor.right - panel.width : anchor.left;
  const top = placeBelow ? anchor.bottom + inset : anchor.top - inset - panel.height;
  return {
    left: Math.max(
      viewport.left + inset,
      Math.min(left, viewport.left + viewport.width - panel.width - inset)
    ),
    top: Math.max(
      viewport.top + inset,
      Math.min(top, viewport.top + viewport.height - panel.height - inset)
    ),
  };
}
