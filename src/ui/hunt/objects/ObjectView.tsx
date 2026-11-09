import { huntUiText } from '@/content/text/hunt-leads';
import {
  type BarsState,
  type BundlesState,
  type GridState,
  type LineState,
  lineStops,
  type ObjectMove,
  type ObjectState,
  type PackingState,
  type PlacesState,
  pairsOf,
  type StacksState,
} from '@/hunt/objects';
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
  if (object.kind === 'places') return <Places places={object} onMove={onMove} />;
  if (object.kind === 'grid') return <Grid grid={object} onMove={onMove} />;
  if (object.kind === 'packing') return <Packing packing={object} onMove={onMove} />;
  if (object.kind === 'bundles') return <Bundles bundles={object} />;
  if (object.kind === 'stacks') return <Stacks stacks={object} onMove={onMove} />;
  if (object.kind === 'bars') return <Bars bars={object} />;
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

function Grid({ grid, onMove }: { grid: GridState; onMove?(move: ObjectMove): void }) {
  const cells = Array.from({ length: grid.rows * grid.columns }, (_, i) => i);
  return (
    <div className="grid-object">
      <div
        className="grid-object__cells"
        style={{ gridTemplateColumns: `repeat(${grid.columns || 1}, 22px)` }}
      >
        {cells.map((cell) => (
          <span key={cell} className="grid-object__cell" />
        ))}
      </div>
      <p className="pairs__sum">
        {grid.rows} · {grid.columns} = {grid.rows * grid.columns}
      </p>
      {onMove && (
        <div className="pairs__controls grid-object__controls">
          <button
            type="button"
            className="object__button"
            data-move="rows-down"
            aria-label={huntUiText.fewerRows}
            onClick={() => onMove({ kind: 'grid-rows', by: -1 })}
          >
            −
          </button>
          <button
            type="button"
            className="object__button"
            data-move="rows-up"
            aria-label={huntUiText.moreRows}
            onClick={() => onMove({ kind: 'grid-rows', by: 1 })}
          >
            +
          </button>
          <button
            type="button"
            className="object__button"
            data-move="turn"
            aria-label={huntUiText.turn}
            onClick={() => onMove({ kind: 'grid-turn' })}
          >
            ⟳
          </button>
          <button
            type="button"
            className="object__button"
            data-move="columns-down"
            aria-label={huntUiText.fewerColumns}
            onClick={() => onMove({ kind: 'grid-columns', by: -1 })}
          >
            −
          </button>
          <button
            type="button"
            className="object__button"
            data-move="columns-up"
            aria-label={huntUiText.moreColumns}
            onClick={() => onMove({ kind: 'grid-columns', by: 1 })}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

function Packing({ packing, onMove }: { packing: PackingState; onMove?(move: ObjectMove): void }) {
  const groups = Math.floor(packing.items / packing.per);
  const rest = packing.items % packing.per;
  return (
    <div className="pairs">
      <div className="pairs__row">
        {Array.from({ length: groups }, (_, group) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: groups only come and go at the end
          <span key={group} className="pairs__pair packing__group">
            {packing.per}
          </span>
        ))}
        {rest > 0 && <span className="pairs__pair pairs__pair--alone packing__group">{rest}</span>}
      </div>
      <p className="pairs__sum">
        {packing.items} : {packing.per} = {groups}
        {rest > 0 ? ` ${huntUiText.rest} ${rest}` : ''}
      </p>
      {onMove && (
        <div className="pairs__controls">
          <button
            type="button"
            className="object__button"
            aria-label={huntUiText.remove}
            onClick={() => onMove({ kind: 'packing-per', by: -1 })}
          >
            −
          </button>
          <button
            type="button"
            className="object__button"
            data-add="true"
            aria-label={huntUiText.add}
            onClick={() => onMove({ kind: 'packing-per', by: 1 })}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

function Bundles({ bundles }: { bundles: BundlesState }) {
  return (
    <div className="pairs">
      <div className="pairs__row">
        {bundles.loose > 0 && <span className="pairs__pair packing__group">{bundles.loose}</span>}
        {Array.from({ length: bundles.bundles }, (_, bundle) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: bundles are all alike
          <span key={bundle} className="pairs__pair pairs__pair--alone packing__group">
            {bundles.size}
          </span>
        ))}
      </div>
      <p className="pairs__sum">
        {bundles.loose > 0 ? `${bundles.loose} + ` : ''}
        {bundles.bundles} · {bundles.size} = {bundles.loose + bundles.bundles * bundles.size}
      </p>
    </div>
  );
}

function Stacks({ stacks, onMove }: { stacks: StacksState; onMove?(move: ObjectMove): void }) {
  const top = Math.max(1, ...stacks.stacks);
  return (
    <div className="stacks-object">
      {stacks.stacks.map((count, stack) => (
        <button
          // biome-ignore lint/suspicious/noArrayIndexKey: stacks stay where they are
          key={stack}
          type="button"
          className="stacks-object__stack"
          disabled={!onMove}
          data-stack={stack}
          data-held={stacks.held === stack}
          onClick={() => onMove?.({ kind: 'stacks-tap', stack })}
        >
          <span className="stacks-object__crates" style={{ height: `${(count / top) * 100}%` }} />
          <span className="stacks-object__count">{count}</span>
        </button>
      ))}
    </div>
  );
}

function Bars({ bars }: { bars: BarsState }) {
  const top = Math.max(bars.step, ...bars.bars.map((bar) => bar.value));
  const marks: number[] = [];
  for (let mark = 0; mark <= top; mark += bars.step) marks.push(mark);
  return (
    <div className="bars-object">
      <ol className="bars-object__axis">
        {marks.map((mark) => (
          <li key={mark}>{formatNumber(mark)}</li>
        ))}
      </ol>
      <div className="bars-object__bars">
        {bars.bars.map((bar) => (
          <div key={bar.label} className="bars-object__bar">
            <span className="bars-object__fill" style={{ height: `${(bar.value / top) * 100}%` }} />
            <span className="bars-object__label">{bar.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Places: how many of each, from the biggest down. */
function Places({ places, onMove }: { places: PlacesState; onMove?(move: ObjectMove): void }) {
  return (
    <ol className="places">
      {places.names.map((name, place) => (
        <li key={name} className="places__column" data-place={place}>
          <span className="places__name">{name}</span>
          <span className="places__count">{places.counts[place]}</span>
          {onMove && (
            <span className="places__controls">
              <button
                type="button"
                className="object__button places__button"
                aria-label={`${huntUiText.remove}: ${name}`}
                onClick={() => onMove({ kind: 'places-remove', place })}
              >
                −
              </button>
              <button
                type="button"
                className="object__button places__button"
                data-add="true"
                aria-label={`${huntUiText.add}: ${name}`}
                onClick={() => onMove({ kind: 'places-add', place })}
              >
                +
              </button>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function NumberLine({ line, onMove }: { line: LineState; onMove?(move: ObjectMove): void }) {
  const numbers = lineStops(line);
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
            {line.point?.at === n
              ? line.point.label
              : !line.labelled || line.labelled.includes(n)
                ? formatNumber(n)
                : ''}
          </button>
        </li>
      ))}
    </ol>
  );
}
