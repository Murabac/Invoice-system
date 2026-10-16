"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import {
  Download,
  FileText,
  FolderPlus,
  Grid3X3,
  List,
  Loader2,
  Presentation,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  createLibraryFolder,
  deleteLibraryFile,
  deleteLibraryFolder,
  getLibraryFileSignedUrl,
  updateLibraryFile,
  uploadLibraryFiles,
  type LibraryFileWithMeta,
} from "@/lib/actions/library";
import type { LibraryFolder } from "@/lib/types/database";
import { formatFileSize } from "@/lib/utils/library-files";
import type { LibraryFileCategory } from "@/lib/utils/library-files";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

interface LibraryBrowserProps {
  folders: LibraryFolder[];
  files: LibraryFileWithMeta[];
  stats: { fileCount: number; totalBytes: number };
}

function FileTypeIcon({
  category,
  className,
}: {
  category: LibraryFileCategory;
  className?: string;
}) {
  if (category === "presentation") {
    return <Presentation className={className} />;
  }
  return <FileText className={className} />;
}

const categoryColors: Record<LibraryFileCategory, string> = {
  pdf: "bg-red-50 text-red-700 border-red-100",
  presentation: "bg-orange-50 text-orange-700 border-orange-100",
  word: "bg-blue-50 text-blue-700 border-blue-100",
  other: "bg-gray-50 text-gray-700 border-gray-100",
};

export function LibraryBrowser({
  folders,
  files,
  stats,
}: LibraryBrowserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const folderParam = searchParams.get("folder") ?? "all";
  const typeFilter = (searchParams.get("type") ?? "all") as
    | LibraryFileCategory
    | "all";
  const view = searchParams.get("view") ?? "grid";
  const q = searchParams.get("q") ?? "";

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      router.push(`/library?${params.toString()}`);
    },
    [router, searchParams]
  );

  const activeFolderName =
    folderParam === "all"
      ? "All files"
      : folderParam === "uncategorized"
        ? "Uncategorized"
        : folders.find((f) => f.id === folderParam)?.name ?? "Folder";

  function handleUpload(fileList: FileList | null) {
    if (!fileList?.length) return;
    setError(null);
    const formData = new FormData();
    if (folderParam !== "all") {
      formData.set("folder_id", folderParam);
    }
    Array.from(fileList).forEach((f) => formData.append("files", f));

    startTransition(async () => {
      const result = await uploadLibraryFiles(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.errors?.length) {
        setError(`Uploaded ${result.uploadedCount}; issues: ${result.errors.join("; ")}`);
      }
      router.refresh();
    });
  }

  function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createLibraryFolder(newFolderName);
      if (result.error) {
        setError(result.error);
        return;
      }
      setNewFolderName("");
      setNewFolderOpen(false);
      router.refresh();
    });
  }

  async function openPreview(file: LibraryFileWithMeta) {
    if (file.category !== "pdf") {
      await downloadFile(file.id);
      return;
    }
    const result = await getLibraryFileSignedUrl(file.id);
    if (result.error || !result.url) {
      setError(result.error ?? "Preview failed");
      return;
    }
    setPreviewTitle(file.title);
    setPreviewUrl(result.url);
  }

  async function downloadFile(id: string) {
    const result = await getLibraryFileSignedUrl(id);
    if (result.error || !result.url) {
      setError(result.error ?? "Download failed");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  function handleDeleteFile(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteLibraryFile(id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleDeleteFolder(id: string, name: string) {
    if (!confirm(`Delete folder "${name}"? It must be empty.`)) return;
    startTransition(async () => {
      const result = await deleteLibraryFolder(id);
      if (result.error) setError(result.error);
      else {
        if (folderParam === id) setParam({ folder: null });
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-56">
        <div className="rounded-xl border border-gray-200 bg-surface p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Folders
          </p>
          <nav className="mt-3 space-y-1">
            {[
              { id: "all", label: "All files" },
              { id: "uncategorized", label: "Uncategorized" },
              ...folders.map((f) => ({ id: f.id, label: f.name })),
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setParam({ folder: id === "all" ? null : id })}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                  folderParam === id
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                {label}
              </button>
            ))}
          </nav>
          {newFolderOpen ? (
            <form onSubmit={handleCreateFolder} className="mt-3 space-y-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                required
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isPending}>
                  Add
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setNewFolderOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => setNewFolderOpen(true)}
            >
              <FolderPlus className="h-4 w-4" />
              New folder
            </Button>
          )}
        </div>
        <p className="mt-3 px-1 text-xs text-gray-500">
          {stats.fileCount} files · {formatFileSize(stats.totalBytes)} total
        </p>
      </aside>

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {activeFolderName}
            </h2>
            <p className="text-sm text-gray-500">Shared M2B company files</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              className="hidden"
              onChange={(e) => {
                handleUpload(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "rounded-xl border-2 border-dashed p-6 text-center transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-gray-200 bg-surface-muted/40"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleUpload(e.dataTransfer.files);
          }}
        >
          <p className="text-sm text-gray-600">
            Drag PDF, Word, or PowerPoint files here
          </p>
          <p className="mt-1 text-xs text-gray-400">Max 50 MB per file</p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search files…"
              defaultValue={q}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setParam({ q: (e.target as HTMLInputElement).value });
                }
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["pdf", "PDF"],
                ["presentation", "Presentations"],
                ["word", "Word"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setParam({ type: value === "all" ? null : value })}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium",
                  typeFilter === value
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                setParam({ view: view === "grid" ? "list" : "grid" })
              }
              className="rounded-lg bg-gray-100 p-2 text-gray-700 hover:bg-gray-200"
              aria-label="Toggle view"
            >
              {view === "grid" ? (
                <List className="h-4 w-4" />
              ) : (
                <Grid3X3 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {files.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-surface py-16 text-center text-gray-500">
            No files match your filters. Upload to get started.
          </div>
        ) : view === "list" ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-card">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Added</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {file.title}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">
                      {file.category}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatFileSize(Number(file.file_size_bytes))}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {file.created_at.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          className="rounded p-2 hover:bg-gray-100"
                          onClick={() => openPreview(file)}
                          aria-label="Open"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded p-2 hover:bg-red-50 text-red-600"
                          onClick={() => handleDeleteFile(file.id, file.title)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-surface p-4 shadow-card transition-shadow hover:shadow-md"
              >
                <div
                  className={cn(
                    "mb-3 flex h-24 items-center justify-center rounded-lg border",
                    categoryColors[file.category]
                  )}
                >
                  <FileTypeIcon category={file.category} className="h-10 w-10" />
                </div>
                <h3 className="line-clamp-2 font-semibold text-gray-900">
                  {file.title}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  {formatFileSize(Number(file.file_size_bytes))} ·{" "}
                  {file.created_at.slice(0, 10)}
                </p>
                {file.uploader_email && (
                  <p className="mt-0.5 truncate text-xs text-gray-400">
                    {file.uploader_email}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs"
                    value={file.folder_id ?? ""}
                    onChange={(e) => {
                      const folder_id = e.target.value || null;
                      startTransition(async () => {
                        await updateLibraryFile(file.id, { folder_id });
                        router.refresh();
                      });
                    }}
                  >
                    <option value="">Uncategorized</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-auto flex gap-2 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openPreview(file)}
                  >
                    {file.category === "pdf" ? "Preview" : "Download"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFile(file.id, file.title)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {folders.some((f) => f.id === folderParam) && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                const folder = folders.find((f) => f.id === folderParam);
                if (folder) handleDeleteFolder(folder.id, folder.name);
              }}
            >
              Delete this folder
            </Button>
          </div>
        )}
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 p-4">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between rounded-t-xl bg-surface px-4 py-3">
            <p className="truncate font-medium text-gray-900">{previewTitle}</p>
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="rounded-lg p-2 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <iframe
            title={previewTitle}
            src={previewUrl}
            className="mx-auto h-full w-full max-w-5xl flex-1 rounded-b-xl bg-white"
          />
        </div>
      )}
    </div>
  );
}
