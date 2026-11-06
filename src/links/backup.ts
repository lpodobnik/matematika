// The backup link's fragment (story 2.11; architecture, Links: `#b=<data>`). Pure: the
// prefix, and base64url for the bytes. What goes in it, the save without his name, and the
// compression are the app's (app/backup.ts).

/** The fragment's prefix for a backup link. */
export const backupPrefix = '#b=';

/** Bytes as base64url, with no padding. */
export function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** base64url back to bytes, or null when it isn't base64url. */
export function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return null;
  const padded = text.replace(/-/g, '+').replace(/_/g, '/');
  try {
    const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

/** The payload after `#b=`, or null when the fragment isn't a backup link. */
export function backupPayload(hash: string): string | null {
  return hash.startsWith(backupPrefix) ? hash.slice(backupPrefix.length) : null;
}
