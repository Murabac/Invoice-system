import { DEFAULT_TERMS } from "@/lib/constants/company";

export function getDefaultTerms(
  profile?: { default_terms?: string[] | null } | null
): string[] {
  if (Array.isArray(profile?.default_terms)) {
    return profile.default_terms.map((term) => term.trim()).filter(Boolean);
  }
  return DEFAULT_TERMS;
}

export function termsToNotes(terms: string[]): string {
  return terms.map((term) => term.trim()).filter(Boolean).join("\n");
}

export function parseTermsLines(notes: string): string[] {
  return notes.split("\n").map((line) => line.trim()).filter(Boolean);
}

/** Resolve terms for a document: null/undefined notes fall back to profile defaults; empty string means none. */
export function resolveDocumentTerms(
  notes: string | null | undefined,
  defaultTerms: string[]
): string[] {
  if (notes === null || notes === undefined) {
    return defaultTerms;
  }
  if (notes.trim() === "") {
    return [];
  }
  return parseTermsLines(notes);
}

export function initialDocumentNotes(
  savedNotes: string | null | undefined,
  defaultTerms: string[]
): string {
  if (savedNotes !== null && savedNotes !== undefined) {
    return savedNotes;
  }
  return termsToNotes(defaultTerms);
}
