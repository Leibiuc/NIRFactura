export function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export const MAX_UPLOAD_BYTES =
  parseInt(process.env.MAX_UPLOAD_MB ?? "10", 10) * 1024 * 1024;
