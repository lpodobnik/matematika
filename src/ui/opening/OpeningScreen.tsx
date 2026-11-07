import '@/ui/opening/opening.css';
import { useState } from 'react';
import { hr } from '@/content/text/hr';
import { useGame } from '@/store/store';
import { openingArt } from '@/ui/opening/art';

/**
 * The opening (story 5.0): four illustrated panels before anything else, a tap on each to
 * go on, and a skip. It tells the story only; the machines still teach themselves.
 */
export function OpeningScreen() {
  const dispatch = useGame((s) => s.dispatch);
  return <OpeningPanels onDone={() => dispatch({ type: 'opening/done' })} />;
}

/** The panels from props only. */
export function OpeningPanels({ onDone }: { onDone(): void }) {
  const [index, setIndex] = useState(0);
  const panels = hr.opening.panels;
  const last = index === panels.length - 1;
  const art = openingArt[index] ?? openingArt[0];
  return (
    <main className="opening">
      <button
        type="button"
        className="opening__panel"
        key={index}
        onClick={() => (last ? onDone() : setIndex(index + 1))}
      >
        <span className="opening__frame">
          <img
            className="opening__art"
            src={art?.src}
            alt=""
            draggable={false}
            style={{
              objectPosition: art?.focus,
              filter: art?.grey ? 'grayscale(1) sepia(0.15)' : undefined,
            }}
          />
        </span>
        <span className="opening__text">{panels[index]}</span>
        <span className="opening__next">{last ? hr.opening.begin : hr.opening.next}</span>
      </button>
      <div className="opening__dots" aria-hidden="true">
        {panels.map((text, i) => (
          <span key={text} data-on={i === index} />
        ))}
      </div>
      {!last && (
        <button type="button" className="opening__skip" onClick={onDone}>
          {hr.opening.skip}
        </button>
      )}
    </main>
  );
}
