/**
 * Formats a raw enum/status string into a human-readable label.
 * Examples: 'IN_TRANSIT' -> 'In Transit', 'DISPATCH_READY' -> 'Dispatch Ready'
 */
export function formatStatus(status: string | undefined | null): string {
  if (!status) return 'Unknown';
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}
