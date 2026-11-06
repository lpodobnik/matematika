// Types for refit.mjs, so scripts/art-tools.test.ts can import it.

export const WIDTH: number;
export const HEIGHT: number;

export interface Band {
  from: number;
  to: number;
  at: number;
  size: number;
}

export function bandsOf(spec: string, size: number): Band[];

export function refitted(bands: readonly Band[], value: number): number;

export function refitImage(
  input: Buffer | string,
  bands?: { y?: string; x?: string },
): Promise<Buffer>;
