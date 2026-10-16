import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { LibraryBrowser } from "@/components/library/LibraryBrowser";
import {
  getLibraryStats,
  listLibraryFiles,
  listLibraryFolders,
  type LibraryFileSort,
} from "@/lib/actions/library";
import type { LibraryFileCategory } from "@/lib/utils/library-files";
import { FolderOpen } from "lucide-react";

interface LibraryPageProps {
  searchParams: {
    folder?: string;
    type?: string;
    q?: string;
    sort?: string;
    view?: string;
  };
}

async function LibraryContent({ searchParams }: LibraryPageProps) {
  const folderParam = searchParams.folder ?? "all";
  const folderId =
    folderParam === "all"
      ? undefined
      : folderParam === "uncategorized"
        ? "uncategorized"
        : folderParam;

  const category = (searchParams.type ?? "all") as LibraryFileCategory | "all";
  const sort = (searchParams.sort ?? "newest") as LibraryFileSort;

  const [folders, files, stats] = await Promise.all([
    listLibraryFolders(),
    listLibraryFiles({
      folderId: folderId ?? null,
      category,
      query: searchParams.q,
      sort,
    }),
    getLibraryStats(),
  ]);

  return (
    <LibraryBrowser folders={folders} files={files} stats={stats} />
  );
}

export default function LibraryPage({ searchParams }: LibraryPageProps) {
  return (
    <>
      <Header
        title="File library"
        description="Shared PDFs, presentations, and Word documents for M2B"
        icon={FolderOpen}
      />
      <div className="page-content">
        <Suspense
          key={JSON.stringify(searchParams)}
          fallback={
            <div className="animate-pulse h-64 rounded-xl bg-gray-100" />
          }
        >
          <LibraryContent searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
