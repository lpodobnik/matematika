import { hr } from '@/content/text/hr';
import { type Link, type LinkOp, linkOps, linkText } from '@/math/chain';
import { formatNumber } from '@/math/format';
import { isDigit } from '@/math/tokens';
import type { ChainView } from '@/room/chain';
import type { NotebookKey } from '@/room/notebook';
import { primaryPress } from '@/ui/notebook/pad-keys';

/** What he has picked so far for the last link: an operation, and the digits he typed. */
export interface ChainPick {
  op: LinkOp | null;
  digits: string;
  /** The link and output it was opened for (`pickFor`): it closes when they change. */
  for?: string;
}

/** What a pick is for: the chain's last link and its output, as a key. */
export function pickFor(view: ChainView | null): string | null {
  if (!view || view.tappable === null || !view.links) return null;
  const link = view.links[view.tappable];
  return link ? `${link.op} ${link.n} ${view.output}` : null;
}

/** The operation a computer's key picks while the picker is open (keyboard parity). */
const keyOps: Partial<Record<NotebookKey, LinkOp>> = {
  '+': 'add',
  '−': 'sub',
  '·': 'mul',
  ':': 'div',
};

/** The choice his pick makes, once it has an operation and a number. */
export function pickedLink(pick: ChainPick): Link | null {
  if (pick.op === null || pick.digits === '') return null;
  return { op: pick.op, n: Number(pick.digits) };
}

/** A number on a link has at most as many digits as the largest number literal. */
const pickMaxDigits = 7;

/**
 * A pad key while the picker is open: a digit types its number, delete takes the last digit
 * back (then the operation), enter runs it once it has both. Other keys do nothing.
 */
export function pickAfterKey(pick: ChainPick, key: NotebookKey): { pick: ChainPick; run: boolean } {
  if (key === 'enter') return { pick, run: pickedLink(pick) !== null };
  if (key === 'delete') {
    if (pick.digits !== '')
      return { pick: { ...pick, digits: pick.digits.slice(0, -1) }, run: false };
    return { pick: { ...pick, op: null }, run: false };
  }
  const op = keyOps[key];
  if (op) return { pick: { ...pick, op }, run: false };
  if (!isDigit(key) || pick.digits.length >= pickMaxDigits) return { pick, run: false };
  const digits = pick.digits === '0' ? key : pick.digits + key;
  return { pick: { ...pick, digits }, run: false };
}

/** The pick as it reads so far: `− 9`, `135 − ☐`, or the operation alone. */
export function pickText(pick: ChainPick): string {
  if (pick.op === null) return '';
  if (pick.digits === '') return pick.op === 'from' ? '… − ☐' : `${opFace(pick.op)} …`;
  return linkText({ op: pick.op, n: Number(pick.digits) });
}

/** How an operation's button reads: `+`, `−`, `·`, `:`, and `… − ☐` for a number minus x's side. */
function opFace(op: LinkOp): string {
  switch (op) {
    case 'add':
      return '+';
    case 'sub':
      return '−';
    case 'mul':
      return '·';
    case 'div':
      return ':';
    case 'from':
      return '… − ☐';
  }
}

interface Props {
  view: ChainView;
  /** His pick for the last link while the picker is open, else null. */
  pick: ChainPick | null;
  /** The hint points at the last link (story 4.1): it pulses. */
  pulse?: boolean;
  /** A tag about the chain (its handover, or the hint), as one line under the links. */
  note?: string | null;
  onTap(): void;
  onOp(op: LinkOp): void;
  onRun(): void;
  onCancel(): void;
}

/**
 * The gear chain at the top of the notebook (story 4.1; GDD, Gear chain): the pans as links
 * from x to the number, `x → · 4 → + 9 → 41`, the undone ones dark. He taps the last link,
 * picks an operation, types its number on the pad below, and runs it. The chain never
 * offers the answer: every operation is there, and the number is his.
 */
export function ChainStrip({
  view,
  pick,
  pulse = false,
  note = null,
  onTap,
  onOp,
  onRun,
  onCancel,
}: Props) {
  const { links, output, tappable } = view;
  const last = tappable === null ? null : links?.[tappable];
  const ready = pick ? pickedLink(pick) !== null : false;
  return (
    <section className="chain" aria-label={hr.chain.label}>
      {links === null || output === null ? (
        <p className="chain__off">{hr.chain.off}</p>
      ) : (
        <ol className="chain__links">
          <li className="chain__end">x</li>
          {links.map((link, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a link's place in the chain is its identity
            <li key={i} className="chain__step">
              <span className="chain__arrow" aria-hidden="true">
                →
              </span>
              {i === tappable ? (
                <button
                  type="button"
                  tabIndex={-1}
                  className="chain__link chain__link--last"
                  aria-pressed={pick !== null}
                  aria-label={hr.chain.tap(linkText(link))}
                  data-pulse={pulse || undefined}
                  onPointerDown={(event) => primaryPress(event, onTap)}
                >
                  {linkText(link)}
                </button>
              ) : (
                <span
                  className="chain__link"
                  data-dark={link.dark || undefined}
                  aria-label={link.dark ? hr.chain.undone(linkText(link)) : undefined}
                >
                  {linkText(link)}
                </span>
              )}
            </li>
          ))}
          <li className="chain__step">
            <span className="chain__arrow" aria-hidden="true">
              →
            </span>
            <span className="chain__end chain__out">{formatNumber(output)}</span>
          </li>
        </ol>
      )}
      {note && !pick && (
        <p className="chain__note" role="note">
          {note}
        </p>
      )}
      {pick && last && (
        <fieldset className="chain-pick" aria-label={hr.chain.undo(linkText(last))}>
          <div className="chain-pick__ops">
            {linkOps.map((op) => (
              <button
                key={op}
                type="button"
                tabIndex={-1}
                className="chain-pick__op"
                data-op={op}
                aria-pressed={pick.op === op}
                aria-label={hr.chain.ops[op]}
                onPointerDown={(event) => primaryPress(event, () => onOp(op))}
              >
                {opFace(op)}
              </button>
            ))}
          </div>
          <div className="chain-pick__row">
            <span className="chain-pick__for" aria-hidden="true">
              {linkText(last)}
            </span>
            <output className="chain-pick__show" aria-live="polite">
              {pick.op === null ? hr.chain.pickOp : pickText(pick) || '…'}
            </output>
            <button
              type="button"
              tabIndex={-1}
              className="chain-pick__run"
              disabled={!ready}
              onPointerDown={(event) => primaryPress(event, onRun)}
            >
              {hr.chain.run}
            </button>
            <button
              type="button"
              tabIndex={-1}
              className="chain-pick__cancel"
              aria-label={hr.chain.cancel}
              onPointerDown={(event) => primaryPress(event, onCancel)}
            >
              ✕
            </button>
          </div>
        </fieldset>
      )}
    </section>
  );
}
