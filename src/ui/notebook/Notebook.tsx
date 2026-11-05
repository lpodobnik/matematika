import '@/ui/notebook/notebook.css';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { hr } from '@/content/text/hr';
import { formatTokens } from '@/math/format';
import type { Token } from '@/math/tokens';
import { type LineDisplay, lineDisplays, type NotebookKey, notebookWrites } from '@/room/notebook';
import type { NotebookLine } from '@/room/types';
import { useGame } from '@/store/store';
import { watchKeyboard } from '@/ui/notebook/keyboard';
import { LineView } from '@/ui/notebook/LineView';
import { NumberPad } from '@/ui/notebook/NumberPad';
import { keyAction, primaryPress } from '@/ui/notebook/pad-keys';

const noLines: readonly NotebookLine[] = [];
const noTokens: readonly Token[] = [];

/**
 * The notebook beside the scale (FR15): the stage equation as line 0, the committed lines,
 * the draft and the number pad. It reads the stage through selectors and acts only through
 * dispatch; what a key does is decided in `room/notebook.ts`. A computer's keys work too.
 */
export function Notebook() {
  const lines = useGame((s) => s.room?.stage.lines ?? noLines);
  const draft = useGame((s) => s.room?.stage.draft ?? noTokens);
  const wrong = useGame((s) => s.room?.stage.jam?.kind === 'line');
  const refused = useGame((s) => s.room?.stage.refused ?? 0);
  const writes = useGame((s) => (s.room ? notebookWrites(s.room.stage) : false));
  const aside = useGame((s) => s.ui.notebookAside);
  const dispatch = useGame((s) => s.dispatch);

  const shown = useMemo(() => lineDisplays(lines), [lines]);
  const draftText = useMemo(() => formatTokens(draft), [draft]);
  const send = useCallback((key: NotebookKey) => dispatch(keyAction(key)), [dispatch]);
  const slide = useCallback(
    (next: boolean) => dispatch({ type: 'notebook/slide', aside: next }),
    [dispatch],
  );

  useEffect(() => watchKeyboard(window, send), [send]);

  return (
    <NotebookPage
      lines={shown}
      draft={draftText}
      wrong={wrong}
      refused={refused}
      writes={writes}
      aside={aside}
      onKey={send}
      onSlide={slide}
    />
  );
}

export interface NotebookPageProps {
  lines: readonly LineDisplay[];
  /** The draft in school notation. */
  draft: string;
  wrong: boolean;
  /** Counts refusals; each new one remounts the draft line, so it wiggles once. */
  refused: number;
  writes: boolean;
  /** On a phone, pushed aside off the scale; the tablet layout ignores it. */
  aside: boolean;
  onKey(key: NotebookKey): void;
  onSlide(aside: boolean): void;
}

/**
 * The notebook's page, from props only. On the tablet it sits beside the scale; on a phone
 * in landscape (under 500 CSS px tall) notebook.css slides it over the scale, and the
 * handle pushes it aside or brings it back.
 */
export function NotebookPage({
  lines,
  draft,
  wrong,
  refused,
  writes,
  aside,
  onKey,
  onSlide,
}: NotebookPageProps) {
  const listRef = useRef<HTMLOListElement>(null);

  // The draft stays in view as lines are added and it grows.
  // biome-ignore lint/correctness/useExhaustiveDependencies: it scrolls when either changes
  useLayoutEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lines, draft]);

  return (
    <aside className="notebook-area" data-aside={aside} aria-label={hr.notebook.label}>
      <button
        type="button"
        tabIndex={-1}
        className="notebook__handle"
        aria-label={aside ? hr.notebook.bringBack : hr.notebook.pushAside}
        aria-expanded={!aside}
        onPointerDown={(event) => primaryPress(event, () => onSlide(!aside))}
      >
        <svg className="notebook__chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path d={aside ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
        </svg>
      </button>
      <div className="notebook">
        <ol className="notebook__lines" ref={listRef}>
          {lines.map((line) => (
            <LineView
              key={line.number}
              text={line.text}
              kind={line.source === 'given' ? 'given' : 'written'}
            />
          ))}
          <LineView
            key={`draft-${refused}`}
            text={draft}
            kind="draft"
            wrong={wrong}
            wiggle={refused > 0}
            caret={writes}
          />
        </ol>
        <NumberPad writes={writes} onKey={onKey} />
      </div>
    </aside>
  );
}
