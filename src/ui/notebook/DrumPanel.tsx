import { hr } from '@/content/text/hr';
import { formatNumber } from '@/math/format';
import type { DrumView } from '@/room/drum';
import { primaryPress } from '@/ui/notebook/pad-keys';

/** The plot's size in its own units; CSS scales it to the notebook's width. */
const width = 300;
const height = 72;
const pad = 10;

interface Props {
  view: DrumView;
  onFlag(index: number): void;
  onConfirm(): void;
}

/**
 * The recording plate at the top of the notebook (story 4.8; GDD, Line reveal). A fifth
 * grader doesn't read a graph yet, so while he plays it is a table: each x he has tried, what
 * the left side weighs there, and the right side; where they are equal the scale is level.
 * While the next-number pin is offered, its options are buttons under the table and the next
 * x shows the flagged one, or a question mark. Once the stage locks, the numbers become dots
 * and the line through the whole dial is drawn: they were on one line all along.
 */
export function DrumPanel({ view, onFlag, onConfirm }: Props) {
  const span = view.high - view.low || 1;
  const toX = (x: number) =>
    pad + ((x - view.min) / (view.max - view.min || 1)) * (width - 2 * pad);
  const toY = (y: number) => height - pad - ((y - view.low) / span) * (height - 2 * pad);
  const flagged = view.pin && view.pin.at !== null ? view.pin.options[view.pin.at] : undefined;
  // The pin's x, until the machine has tried it, waits as a question.
  const waiting = view.pin?.asks && !view.dots.some((dot) => dot.x === view.pin?.x);
  return (
    <section className="drum" aria-label={hr.drum.label}>
      {!view.line && (
        <table className="drum__table">
          <tbody>
            <tr>
              <th scope="row">{hr.drum.x}</th>
              {view.dots.map((dot) => (
                <td key={dot.x} className="drum__x">
                  {formatNumber(dot.x)}
                </td>
              ))}
              {waiting && <td className="drum__x">{formatNumber(view.pin?.x ?? 0)}</td>}
            </tr>
            <tr>
              <th scope="row">{hr.drum.left}</th>
              {view.dots.map((dot) => (
                <td
                  key={dot.x}
                  className="drum__left"
                  data-level={dot.y === view.level || undefined}
                >
                  {formatNumber(dot.y)}
                </td>
              ))}
              {waiting && (
                <td className="drum__guess-cell">
                  {flagged === undefined ? '?' : formatNumber(flagged)}
                </td>
              )}
            </tr>
            <tr>
              <th scope="row">{hr.drum.right}</th>
              {view.dots.map((dot) => (
                <td key={dot.x} data-level={dot.y === view.level || undefined}>
                  {formatNumber(view.level)}
                </td>
              ))}
              {waiting && <td>{formatNumber(view.level)}</td>}
            </tr>
          </tbody>
        </table>
      )}
      {view.line && (
        <svg
          className="drum__plot"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={hr.drum.read(view.dots.length)}
        >
          <path className="drum__axis" d={`M${pad} ${height - pad} H${width - pad}`} />
          <path className="drum__level" d={`M${pad} ${toY(view.level)} H${width - pad}`} />
          {view.line && (
            <path
              className="drum__line"
              d={`M${toX(view.min)} ${toY(view.line.from)} L${toX(view.max)} ${toY(view.line.to)}`}
            />
          )}
          {view.dots.map((dot) => (
            <circle key={dot.x} className="drum__dot" cx={toX(dot.x)} cy={toY(dot.y)} r={5} />
          ))}
        </svg>
      )}
      {view.pin && (
        <div className="drum__pin" data-asks={view.pin.asks || undefined}>
          <ol className="story-panel__options drum__options">
            {view.pin.options.map((option, i) => (
              <li key={option} className="story-panel__option">
                <button
                  type="button"
                  tabIndex={-1}
                  className="story-panel__choice"
                  aria-pressed={view.pin?.at === i}
                  disabled={!view.pin?.asks}
                  data-right={view.pin?.right === i || undefined}
                  onPointerDown={(event) => primaryPress(event, () => onFlag(i))}
                >
                  <span className="story-panel__flag" aria-hidden="true">
                    {view.pin?.at === i ? '⚑' : ''}
                  </span>
                  <span className="story-panel__text">{formatNumber(option)}</span>
                </button>
              </li>
            ))}
          </ol>
          {view.pin.confirmable && (
            <button
              type="button"
              tabIndex={-1}
              className="story-panel__confirm"
              onPointerDown={(event) => primaryPress(event, onConfirm)}
            >
              {hr.stories.confirm}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
