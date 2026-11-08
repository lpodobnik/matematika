import { useEffect } from 'react';
import type { NodeView } from '@/city/reach';
import type { NodeId } from '@/city/types';
import type { Point } from '@/city/walk';
import { hr } from '@/content/text/hr';
import { type PersonId, type TownExit, type TownPlace, town } from '@/content/town';
import { MapScreen } from '@/ui/map/MapScreen';
import { pct, rectStyle } from '@/ui/town/town-geometry';

export type Bubble = {
  who: PersonId | 'self' | 'little';
  at: Point;
  lines: readonly string[];
  line: number;
  intro?: string;
};

/**
 * The district map over the town; Escape closes it. A place with a street takes him to that
 * street, beside its machine, so he walks up to it; a place with none, straight in.
 */
export function MapOverlay({ onClose, onPick }: { onClose(): void; onPick(node: NodeId): void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="town__overlay">
      <MapScreen onTravel={onPick} />
      <button type="button" className="town__close" onClick={onClose}>
        {hr.town.close}
      </button>
    </div>
  );
}

export function PlaceButton({
  place,
  node,
  onTap,
}: {
  place: TownPlace;
  node: NodeView | undefined;
  onTap(): void;
}) {
  const state = node?.state ?? 'closed';
  const label = `${hr.map.nodes[place.node]}, ${hr.map.states[state]}`;
  return (
    <button
      type="button"
      className="town__place"
      data-node={place.node}
      data-state={state}
      style={rectStyle(place.area)}
      aria-label={label}
      onClick={onTap}
    />
  );
}

export function SpeechBubble({ bubble, onNext }: { bubble: Bubble; onNext(): void }) {
  const text = bubble.lines[bubble.line] ?? '';
  // Above the speaker when there is room; below one standing near the top of the square.
  const above = bubble.at.y > town.height * 0.48;
  return (
    <button
      type="button"
      className="town__bubble"
      data-who={bubble.who}
      data-above={above}
      aria-live="polite"
      style={{
        ...pct({ x: Math.min(town.width - 300, Math.max(300, bubble.at.x)), y: bubble.at.y }),
        zIndex: 5000,
      }}
      onClick={onNext}
    >
      {bubble.intro && <span className="town__intro">{bubble.intro}</span>}
      <span className="town__line">{text}</span>
    </button>
  );
}

/** A way out, signposted: an arrow towards the street's edge, or a lock until its room. */
export function ExitSign({ exit, open, onGo }: { exit: TownExit; open: boolean; onGo(): void }) {
  const angle =
    (Math.atan2(exit.marker.y - town.height / 2, exit.marker.x - town.width / 2) * 180) / Math.PI;
  // Near a side it hangs inwards from the marker, clear of the corner buttons, so it is
  // never cut off by the edge of the street or hidden under the map.
  const edge = exit.marker.x < 300 ? 'start' : exit.marker.x > town.width - 300 ? 'end' : 'mid';
  const left =
    edge === 'start'
      ? Math.max(exit.marker.x - 60, 180)
      : edge === 'end'
        ? Math.min(exit.marker.x + 60, town.width - 180)
        : exit.marker.x;
  // An open way takes the tap too: children go for the arrow. A closed one lets it through,
  // to the machine or the closed way under it.
  const Tag = open ? 'button' : 'span';
  return (
    <Tag
      className="town__sign"
      data-sign={exit.to}
      data-open={open}
      data-edge={edge}
      style={pct({ x: left, y: exit.marker.y })}
      aria-hidden={open ? undefined : 'true'}
      {...(open ? { type: 'button' as const, onClick: onGo } : {})}
    >
      {open ? (
        <svg
          className="town__sign-icon"
          aria-hidden="true"
          viewBox="-10 -10 20 20"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <path d="M-8 -3.5 H1 V-8 L9 0 L1 8 V3.5 H-8 Z" />
        </svg>
      ) : (
        <svg className="town__sign-icon" viewBox="-10 -10 20 20" aria-hidden="true">
          <path
            className="town__sign-shackle"
            d="M-5 -2 V-5 A5 5 0 0 1 5 -5 V-2"
            fill="none"
            strokeWidth="2.4"
          />
          <rect x="-7.5" y="-2" width="15" height="11" rx="2" />
        </svg>
      )}
      {hr.town.signs[exit.to]}
    </Tag>
  );
}
