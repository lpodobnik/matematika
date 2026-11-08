import { huntUiText } from '@/content/text/hunt-leads';
import { type LineState, type ObjectMove, type ObjectState, pairsOf } from '@/hunt/objects';
import { formatNumber } from '@/math/format';

/** The thing he moves: a showing draws it, and try and fix let him move it. */
export function ObjectView({
  object,
  onMove,
}: {
  object: ObjectState;
  onMove?(move: ObjectMove): void;
}) {
  if (object.kind === 'pairs') return <Pairs count={object.count} onMove={onMove} />;
  return <NumberLine line={object} onMove={onMove} />;
}

/** Lamps, standing in twos: the one left over stands alone. */
function Pairs({ count, onMove }: { count: number; onMove?(move: ObjectMove): void }) {
  const { pairs, left } = pairsOf(count);
  const standing = Array.from({ length: pairs }, (_, i) => i + 1);
  return (
    <div className="pairs" data-count={count}>
      <div className="pairs__row">
        {standing.map((n) => (
          <span key={n} className="pairs__pair">
            <Lamp />
            <Lamp />
          </span>
        ))}
        {left > 0 && (
          <span className="pairs__pair pairs__pair--alone">
            <Lamp />
          </span>
        )}
      </div>
      <p className="pairs__sum">{huntUiText.pairs(pairs, left)}</p>
      {onMove && (
        <div className="pairs__controls">
          <button
            type="button"
            className="object__button"
            aria-label={huntUiText.remove}
            onClick={() => onMove({ kind: 'pairs-remove' })}
          >
            −
          </button>
          <button
            type="button"
            className="object__button"
            data-add="true"
            aria-label={huntUiText.add}
            onClick={() => onMove({ kind: 'pairs-add' })}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

function Lamp() {
  return (
    <svg className="pairs__lamp" viewBox="0 0 20 40" aria-hidden="true">
      <path d="M10 16v22" />
      <path d="M5 38h10" />
      <path className="pairs__glass" d="M5 16 7 5h6l2 11z" />
      <path d="M10 5V2" />
    </svg>
  );
}

function NumberLine({ line, onMove }: { line: LineState; onMove?(move: ObjectMove): void }) {
  const numbers = Array.from({ length: line.to - line.from + 1 }, (_, i) => line.from + i);
  return (
    <ol className="number-line">
      {numbers.map((n) => (
        <li key={n} className="number-line__item">
          <button
            type="button"
            className="number-line__stop"
            disabled={!onMove}
            data-lit={line.lit.includes(n)}
            data-marked={line.marked === n}
            onClick={() => onMove?.({ kind: 'line-mark', at: n })}
          >
            {formatNumber(n)}
          </button>
        </li>
      ))}
    </ol>
  );
}
