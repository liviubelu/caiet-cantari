// Client- and server-safe: the download filename for a song's chord PDF.
// Keeps spaces + diacritics (they save fine on any modern OS); strips only the
// characters that are invalid in filenames.
export function handoutFileName(title: string | null | undefined): string {
  const clean = (title || "melodie")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim() || "melodie"
  return `${clean}.pdf`
}
