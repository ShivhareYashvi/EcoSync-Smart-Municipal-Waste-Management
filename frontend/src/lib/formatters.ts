/**
 * Utility functions for clean municipal ward & text formatting across EcoSync
 */

/**
 * Extracts a clean ward number (e.g. "Ward Ward 25" -> "25", "Ward 48" -> "48", "12" -> "12")
 */
export function cleanWardNumber(ward?: string | null): string {
  if (!ward) return '48';
  const cleaned = ward.replace(/^(ward\s*)+/gi, '').trim();
  return cleaned || '48';
}

/**
 * Formats a ward cleanly as "Ward XX" without any duplicated "Ward Ward"
 */
export function formatWard(ward?: string | null): string {
  return `Ward ${cleanWardNumber(ward)}`;
}

/**
 * Cleans duplicated ward prefixes and brackets inside complaint descriptions or titles
 */
export function cleanComplaintText(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/\[(Ward\s*)+/gi, '[Ward ')
    .replace(/(Ward\s*){2,}/gi, 'Ward ')
    .replace(/\s+/g, ' ')
    .trim();
}
