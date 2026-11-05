// Types for fal-generate.mjs, so scripts/art-tools.test.ts can import it.

export interface Job {
  name: string;
  seed: number;
  size: { width: number; height: number };
  slots: {
    subject: string;
    camera?: string;
    composition?: string;
    state?: string;
    background?: string;
    reference?: string;
  };
  references?: string[];
  reserve?: boolean;
  style?: string;
  notes?: string;
}

export const STYLE: Readonly<Record<string, string>>;
export const LATEST_STYLE: string;
export function styleKey(job: Pick<Job, 'style'>): string;
export function buildPrompt(job: Job): string;
