/** Characters unsafe in Windows/macOS save-as filenames */
function sanitizePrintFilename(title: string): string {
  return title.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
}

export function printDatePrefix(isoDate?: string): string {
  const d = isoDate ? new Date(isoDate + "T00:00:00") : new Date();
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

/**
 * Sets document.title before print so "Save as PDF" defaults to a useful filename.
 */
export function printWithDocumentTitle(title: string): void {
  const previous = document.title;
  document.title = sanitizePrintFilename(title);

  const restore = () => {
    document.title = previous;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}
