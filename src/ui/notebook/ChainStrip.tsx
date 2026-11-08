import { hr } from '@/content/text/hr';
import { inverseOf, type Link, linkText } from '@/math/chain';
import { formatNumber } from '@/math/format';
import type { ChainView } from '@/room/chain';
import { primaryPress } from '@/ui/notebook/pad-keys';

/** One of the two answers to "what undoes the last step?": what it says, and what it runs. */
export interface ChainChoice {
  text: string;
  link: Link;
  /** Scene and tests only ever need to know this for the hint's pulse. */
  right: boolean;
}

/**
 * The two answers for the last step, always in the same order, so the right one isn't always
 * first: `+ 9` and `− 9`; `· 4` and `: 4`. A step taking x away from a number, `135 − ☐`,
 * asks what ☐ is: `☐ = 135 − 100` or `☐ = 135 + 100`. Every number is already in place: the
 * one thing left to decide is which way undoes the step.
 */
export function chainChoices(last: Link, output: number): ChainChoice[] {
  const right = inverseOf(last);
  if (last.op === 'from') {
    const n = formatNumber(last.n);
    const out = formatNumber(output);
    return [
      { text: `☐ = ${n} − ${out}`, link: right, right: true },
      { text: `☐ = ${n} + ${out}`, link: { op: 'add', n: last.n }, right: false },
    ];
  }
  const pair: Link[] =
    last.op === 'add' || last.op === 'sub'
      ? [
          { op: 'add', n: last.n },
          { op: 'sub', n: last.n },
        ]
      : [
          { op: 'mul', n: last.n },
          { op: 'div', n: last.n },
        ];
  return pair.map((link) => ({
    text: linkText(link),
    link,
    right: link.op === right.op,
  }));
}

interface Props {
  view: ChainView;
  /** The hint points at the choice: it pulses. */
  pulse?: boolean;
  /** A tag about it (its handover, or the hint), as one line under the steps. */
  note?: string | null;
  onRun(link: Link): void;
}

/**
 * The way back at the top of the notebook (story 4.1; GDD, Gear chain): the machine's recipe
 * as steps from x to the number, `x → · 4 → + 9 → 41`, the undone ones dark. To find x he
 * walks it backwards: the last step, and two buttons for what undoes it. One tap: the scale
 * and the notebook follow, and a wrong one tips the scale.
 */
export function ChainStrip({ view, pulse = false, note = null, onRun }: Props) {
  const { links, output, tappable } = view;
  const last = tappable === null ? null : (links?.[tappable] ?? null);
  return (
    <section className="chain" aria-label={hr.chain.label}>
      <p className="chain__title" aria-hidden="true">
        {hr.chain.label}
      </p>
      {links === null || output === null ? (
        <p className="chain__off">{hr.chain.off}</p>
      ) : (
        <ol className="chain__links">
          <li className="chain__end">x</li>
          {links.map((link, i) =>
            // An undone step is gone: what is left still reads true, `x → · 4 = 32`.
            link.dark ? null : (
              // biome-ignore lint/suspicious/noArrayIndexKey: a link's place in the chain is its identity
              <li key={i} className="chain__step">
                <ChainJoin />
                <span className={i === tappable ? 'chain__link chain__link--last' : 'chain__link'}>
                  {linkText(link)}
                </span>
              </li>
            ),
          )}
          <li className="chain__step">
            <span className="chain__equals">=</span>
            <span className="chain__end chain__out">{formatNumber(output)}</span>
          </li>
        </ol>
      )}
      {last && output !== null && (
        <fieldset className="chain-pick" data-pulse={pulse || undefined}>
          <legend className="chain-pick__ask">
            {last.op === 'from'
              ? hr.chain.whatIsBox(formatNumber(last.n), formatNumber(output))
              : hr.chain.undo(linkText(last))}
          </legend>
          <div className="chain-pick__ops">
            {chainChoices(last, output).map((choice) => (
              <button
                key={choice.text}
                type="button"
                tabIndex={-1}
                className="chain-pick__op"
                onPointerDown={(event) => primaryPress(event, () => onRun(choice.link))}
              >
                {choice.text}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {note && (
        <p className="chain__note" role="note">
          {note}
        </p>
      )}
    </section>
  );
}

/** The ring joining two steps, with the way the recipe runs. */
function ChainJoin() {
  return (
    <svg className="chain__join" viewBox="0 0 30 16" aria-hidden="true">
      <rect x="1.5" y="3.5" width="17" height="9" rx="4.5" />
      <path d="M21 8 H28 M24.5 4.5 L28 8 L24.5 11.5" />
    </svg>
  );
}
