import type { NodeState } from '@/city/reach';
import type { NodeId, NodeKind } from '@/city/types';

/**
 * The map's placeholder skin (story 2.2): each node drawn in code, in a 100 × 100 box
 * centred on 0, 0, until the map illustration takes its place. A restored room's change is
 * carried by shape as well as colour (NFR4, NFR12): the door stands raised, the lamps have
 * rays, the gate is up with water running under it, the wheel's spokes turn. Grey ink and
 * still until then. Rooms whose stories come later, the lairs, the workshop and the gate
 * get a plain sign of their kind.
 */
export function NodeGlyph({ id, kind, state }: { id: NodeId; kind: NodeKind; state: NodeState }) {
  const restored = state === 'restored';
  switch (id) {
    case 'r01':
      return <DoorLift restored={restored} />;
    case 'r02':
      return <StreetLamps restored={restored} />;
    case 'r03':
      return <SluiceGate restored={restored} />;
    case 'r04':
      return <WaterWheel restored={restored} />;
    default:
      return <KindSign kind={kind} />;
  }
}

/** Room 1: a door in its frame; restored, it stands raised with the doorway open. */
function DoorLift({ restored }: { restored: boolean }) {
  return (
    <g>
      <path d="M-30 38 V-34 H30 V38" />
      <path d="M-38 38 H38" />
      {restored ? (
        <>
          <rect x="-24" y="-30" width="48" height="22" className="glyph__lit" />
          <path d="M0 6 V30 M-9 15 L0 6 L9 15" />
        </>
      ) : (
        <>
          <rect x="-24" y="-28" width="48" height="66" />
          <path d="M-24 -6 H24 M-24 16 H24" />
        </>
      )}
    </g>
  );
}

/** Room 2: two lamp posts; restored, their heads are lit and give off rays. */
function StreetLamps({ restored }: { restored: boolean }) {
  const lamp = (x: number) => (
    <g key={x} transform={`translate(${x} 0)`}>
      <path d="M0 40 V-12" />
      <path d="M-9 -12 H9 L5 -26 H-5 Z" className={restored ? 'glyph__lit' : undefined} />
      {restored && <path d="M0 -32 V-40 M-12 -28 L-18 -34 M12 -28 L18 -34" />}
    </g>
  );
  return (
    <g>
      {lamp(-16)}
      {lamp(16)}
      <path d="M-30 40 H30" />
    </g>
  );
}

/** Room 3: a sluice gate between two posts; restored, it is up and water runs under it. */
function SluiceGate({ restored }: { restored: boolean }) {
  return (
    <g>
      <path d="M-32 38 V-34 M32 38 V-34 M-38 -34 H38" />
      <rect
        x="-26"
        y={restored ? -30 : -8}
        width="52"
        height="26"
        className={restored ? 'glyph__lit' : undefined}
      />
      <path
        d={
          restored
            ? 'M-30 14 q7 -6 15 0 t15 0 t15 0 t15 0 M-30 28 q7 -6 15 0 t15 0 t15 0 t15 0'
            : 'M-30 30 H30'
        }
        className={restored ? 'glyph__water' : undefined}
      />
    </g>
  );
}

/** Room 4: a water wheel; restored, its rim is lit and the spokes turn. */
function WaterWheel({ restored }: { restored: boolean }) {
  const spokes = [0, 45, 90, 135].map((angle) => (
    <path key={angle} d="M-30 0 H30" transform={`rotate(${angle})`} />
  ));
  return (
    <g>
      <circle r="34" className={restored ? 'glyph__lit' : undefined} />
      <circle r="24" />
      <g className={restored ? 'glyph__turning' : undefined}>{spokes}</g>
      <circle r="5" />
    </g>
  );
}

/** A plain sign of the node's kind: a gear for a room, a head for an automaton, an anvil, a gate. */
function KindSign({ kind }: { kind: NodeKind }) {
  switch (kind) {
    case 'lair':
      return (
        <g>
          <rect x="-24" y="-26" width="48" height="44" rx="8" />
          <circle cx="-10" cy="-6" r="5" />
          <circle cx="10" cy="-6" r="5" />
          <path d="M-12 8 H12 M0 -26 V-36 M-6 -36 H6 M-16 18 V30 M16 18 V30" />
        </g>
      );
    case 'workshop':
      return (
        <g>
          <path d="M-30 -4 H22 Q34 -4 34 8 H-16 V16 H8 V30 H-26 V16 H-16" />
          <path d="M6 -30 L22 -14 M14 -36 L28 -22 L22 -16 L8 -30 Z" />
        </g>
      );
    case 'gate':
      return (
        <g>
          <path d="M-32 38 V-10 A32 32 0 0 1 32 -10 V38 Z" />
          <path d="M-16 38 V2 M0 38 V-6 M16 38 V2" />
          <rect x="-20" y="10" width="40" height="14" />
        </g>
      );
    default:
      return <path d={gearSign} className="glyph__sign" />;
  }
}

/** An 8-tooth gear, for a room whose machine comes in a later story. */
const gearSign = (() => {
  const points: string[] = [];
  for (let i = 0; i < 32; i += 1) {
    const angle = (i / 32) * Math.PI * 2;
    const radius = i % 4 < 2 ? 32 : 24;
    points.push(
      `${(Math.cos(angle) * radius).toFixed(1)} ${(Math.sin(angle) * radius).toFixed(1)}`,
    );
  }
  return `M ${points.join(' L ')} Z M 9 0 A 9 9 0 1 0 -9 0 A 9 9 0 1 0 9 0`;
})();
