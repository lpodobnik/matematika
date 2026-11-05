// The last caught errors, kept on the device for Luka (architecture, Data Persistence).
// Never sent anywhere. Writing must never throw: it runs while something is already broken.

export const errorLogKey = 'matematika:errors';
export const errorLogLimit = 50;
const maxTextLength = 4000;

export type ErrorSource = 'render' | 'error' | 'unhandledrejection';

export interface ErrorEntry {
  at: string;
  source: ErrorSource;
  message: string;
  stack?: string;
  componentStack?: string;
}

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

export interface RecordOptions {
  storage?: KeyValueStorage | null;
  now?: Date;
  componentStack?: string;
}

function defaultStorage(): KeyValueStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function clip(text: string): string {
  return text.length > maxTextLength ? `${text.slice(0, maxTextLength)}…` : text;
}

export function describeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return error.stack
      ? { message: clip(`${error.name}: ${error.message}`), stack: clip(error.stack) }
      : { message: clip(`${error.name}: ${error.message}`) };
  }
  if (typeof error === 'string') return { message: clip(error) };
  try {
    return { message: clip(JSON.stringify(error) ?? String(error)) };
  } catch {
    return { message: clip(String(error)) };
  }
}

export function readErrors(storage: KeyValueStorage | null = defaultStorage()): ErrorEntry[] {
  if (!storage) return [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(errorLogKey) ?? '[]');
    return Array.isArray(parsed) ? (parsed as ErrorEntry[]) : [];
  } catch {
    return [];
  }
}

export function recordError(
  source: ErrorSource,
  error: unknown,
  options: RecordOptions = {},
): void {
  const storage = options.storage === undefined ? defaultStorage() : options.storage;
  if (!storage) return;
  const entry: ErrorEntry = {
    at: (options.now ?? new Date()).toISOString(),
    source,
    ...describeError(error),
    ...(options.componentStack ? { componentStack: clip(options.componentStack) } : {}),
  };
  try {
    const entries = [...readErrors(storage), entry].slice(-errorLogLimit);
    storage.setItem(errorLogKey, JSON.stringify(entries));
  } catch {
    // Quota or private mode: the game keeps running without the log.
  }
}
