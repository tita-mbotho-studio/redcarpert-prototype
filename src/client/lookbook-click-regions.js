/**
 * The flipbook image element occupies a full rectangle even when object-fit:
 * contain letterboxes the visible photograph. Only its painted pixels should
 * open zoom; clicks on the remaining ivory paper should turn the book.
 */
export function isInsideContainedPhoto(bounds, naturalWidth, naturalHeight, x, y) {
  if (!(naturalWidth > 0 && naturalHeight > 0) ||
      !(bounds.width > 0 && bounds.height > 0)) return true;
  const factor = Math.min(bounds.width / naturalWidth, bounds.height / naturalHeight);
  const renderedWidth = naturalWidth * factor;
  const renderedHeight = naturalHeight * factor;
  const left = bounds.left + (bounds.width - renderedWidth) / 2;
  const top = bounds.top + (bounds.height - renderedHeight) / 2;
  return x >= left && x <= left + renderedWidth &&
    y >= top && y <= top + renderedHeight;
}

/** Right-hand paper advances, left-hand paper goes back; single leaves use halves. */
export function paperTurnDirection(bookBounds, clientX) {
  return clientX >= bookBounds.left + bookBounds.width / 2 ? 1 : -1;
}
