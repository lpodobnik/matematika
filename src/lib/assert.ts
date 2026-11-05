// Programmer errors only (architecture, Error Handling): an impossible state throws, and
// the error boundary catches it. Expected outcomes, such as a line that doesn't parse,
// are typed results and never go through here.

export class AssertionError extends Error {
  override name = 'AssertionError';
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new AssertionError(message);
}
