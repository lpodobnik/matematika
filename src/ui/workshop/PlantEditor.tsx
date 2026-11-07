import { useState } from 'react';
import { hr } from '@/content/text/hr';
import { formatTokens } from '@/math/format';
import { isDigit, type Token, tokenize } from '@/math/tokens';
import { type Planted, plantWorks, type RoomDesign, type Solution } from '@/workshop/design';

/** A line's pad characters as runs: numbers (which he can change) and the rest. */
type Run = { kind: 'number'; value: number } | { kind: 'text'; tokens: Token[] };

function runsOf(text: string): Run[] {
  const tokenized = tokenize(text);
  if (!tokenized.ok) return [];
  const runs: Run[] = [];
  for (const token of tokenized.tokens) {
    const last = runs[runs.length - 1];
    if (isDigit(token)) {
      if (last?.kind === 'number') last.value = last.value * 10 + Number(token);
      else runs.push({ kind: 'number', value: Number(token) });
    } else if (last?.kind === 'text') {
      last.tokens.push(token);
    } else {
      runs.push({ kind: 'text', tokens: [token] });
    }
  }
  return runs;
}

function textOf(runs: readonly Run[]): string {
  return runs
    .map((run) => (run.kind === 'number' ? String(run.value) : run.tokens.join('')))
    .join('');
}

function shown(text: string): string {
  const tokenized = tokenize(text);
  return tokenized.ok ? formatTokens(tokenized.tokens) : text;
}

/**
 * The planted line (GDD, Ways to make a room hard: "he writes a solution with one wrong line,
 * and the friend finds and fixes it"): he taps one of his own lines before the check line and
 * changes its numbers with − and + until the line is wrong; the friend gets his lines up to
 * it, then the wrong one (room 7's rules). Reports the line and whether it works.
 */
export function PlantEditor({
  design,
  solution,
  onChange,
}: {
  design: RoomDesign;
  solution: Solution;
  onChange(planted: { value: Planted; works: boolean } | null): void;
}) {
  const [picked, setPicked] = useState<Planted | null>(null);
  const works = picked !== null && plantWorks(design, solution, picked);
  const set = (next: Planted) => {
    setPicked(next);
    onChange({ value: next, works: plantWorks(design, solution, next) });
  };
  const runs = picked ? runsOf(picked.text) : [];
  return (
    <section className="workshop__plant">
      <h2 className="workshop__name">{hr.workshop.plant}</h2>
      <p className="workshop__hint">{hr.workshop.plantWhat}</p>
      <ol className="workshop__lines">
        {solution.flatMap((lines, stage) =>
          lines.slice(0, -1).map((line, index) => {
            const chosen = picked?.stage === stage && picked.line === index;
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: his lines are in a fixed order
              <li key={`${stage}-${index}`}>
                <button
                  type="button"
                  className="workshop__line"
                  aria-pressed={chosen}
                  onClick={() => set({ stage, line: index, text: line })}
                >
                  {solution.length > 1 && (
                    <span className="workshop__line-machine">{hr.workshop.machine(stage + 1)}</span>
                  )}
                  {shown(chosen && picked ? picked.text : line)}
                </button>
              </li>
            );
          }),
        )}
      </ol>
      {picked === null ? (
        <p className="workshop__hint">{hr.workshop.plantPick}</p>
      ) : (
        <>
          <div className="workshop__plant-edit">
            {runs.map((run, i) =>
              run.kind === 'text' ? (
                // biome-ignore lint/suspicious/noArrayIndexKey: runs are in a fixed order
                <span key={i} className="workshop__plant-text">
                  {formatTokens(run.tokens)}
                </span>
              ) : (
                // biome-ignore lint/suspicious/noArrayIndexKey: runs are in a fixed order
                <span key={i} className="workshop__plant-number">
                  <button
                    type="button"
                    className="workshop__step"
                    aria-label={`${run.value} ${hr.workshop.less}`}
                    disabled={run.value <= 0}
                    onClick={() =>
                      set({
                        ...picked,
                        text: textOf(
                          runs.map((r, j) =>
                            j === i ? { kind: 'number', value: run.value - 1 } : r,
                          ),
                        ),
                      })
                    }
                  >
                    −
                  </button>
                  <b>{run.value}</b>
                  <button
                    type="button"
                    className="workshop__step"
                    aria-label={`${run.value} ${hr.workshop.more}`}
                    disabled={run.value >= 9999}
                    onClick={() =>
                      set({
                        ...picked,
                        text: textOf(
                          runs.map((r, j) =>
                            j === i ? { kind: 'number', value: run.value + 1 } : r,
                          ),
                        ),
                      })
                    }
                  >
                    +
                  </button>
                </span>
              ),
            )}
          </div>
          <p className="workshop__status" data-ok={works}>
            {works ? hr.workshop.plantReady : hr.workshop.plantStill}
          </p>
        </>
      )}
    </section>
  );
}
