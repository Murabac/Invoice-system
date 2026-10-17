export type LibraryFileCategory = "pdf" | "presentation" | "word" | "other";

const PDF = new Set(["application/pdf"]);

const PRESENTATION = new Set([
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const WORD = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const EXT_PRESENTATION = [".ppt", ".pptx"];
const EXT_WORD = [".doc", ".docx"];
const EXT_PDF = [".pdf"];

export function inferLibraryCategory(
  mimeType: string,
  filename: string
): LibraryFileCategory {
  const mime = mimeType.toLowerCase();
  if (PDF.has(mime)) return "pdf";
  if (PRESENTATION.has(mime)) return "presentation";
  if (WORD.has(mime)) return "word";

  const lower = filename.toLowerCase();
  if (EXT_PDF.some((ext) => lower.endsWith(ext))) return "pdf";
  if (EXT_PRESENTATION.some((ext) => lower.endsWith(ext))) return "presentation";
  if (EXT_WORD.some((ext) => lower.endsWith(ext))) return "word";
  return "other";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function sanitizeStorageFilename(name: string): string {
  const base = name.replace(/[\\/:*?"<>|]/g, "-").trim();
  return base.slice(0, 180) || "file";
}

export function firstLineOfText(text: string): string {
  const line = text.trim().split(/\r?\n/)[0]?.trim();
  return line ?? "";
}
