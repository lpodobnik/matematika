import type { NodeState } from '@/city/reach';
import type { LockKind, NodeId, NodeKind } from '@/city/types';

/**
 * The map's placeholder skin (story 2.2): each node drawn in code, in a 100 × 100 box
 * centred on 0, 0, until the map illustration takes its place. A restored room's change is
 * carried by shape as well as colour (NFR4, NFR12): the door stands raised, the lamps have
 * rays, the gate is up with water running under it, the wheel's spokes turn. Grey ink and
 * still until then. Rooms whose stories come later, the lairs, the workshop and the gate
 * get a plain sign of their kind. Story 2.8 adds the bridge, 2.9 the weighing yard, 2.10 the old
 * logbook, 4.3 the tram, 4.4 the steam lift, 4.5 the market scales, 4.6 the great wheel.
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
    case 'r05':
      return <Bridge restored={restored} />;
    case 'r06':
      return <WeighingYard restored={restored} />;
    case 'r07':
      return <OldLogbook restored={restored} />;
    case 'r08':
      return <Tram restored={restored} />;
    case 'r09':
      return <SteamLift restored={restored} />;
    case 'r10':
      return <MarketScales restored={restored} />;
    case 'r11':
      return <GreatWheel restored={restored} />;
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

/**
 * A locked node's badge (story 2.3), top left of its glyph: what opens it, so he knows what
 * to look for. Balance's weights, the gear chain or the drum; a padlock for anything else.
 */
export function LockBadge({ lock }: { lock: LockKind | null }) {
  return (
    <g transform="translate(-34 -34)" className="map__lock">
      <circle r="17" />
      {lock === 'weights' && (
        <g>
          <path d="M-9 9 L-6 -3 H6 L9 9 Z" />
          <circle cy="-7" r="3.5" />
        </g>
      )}
      {lock === 'chain' && (
        <g>
          <ellipse cx="-5" rx="7" ry="4.5" />
          <ellipse cx="5" rx="7" ry="4.5" />
        </g>
      )}
      {lock === 'drum' && (
        <g>
          <ellipse cy="-6" rx="9" ry="3.5" />
          <path d="M-9 -6 V6 A9 3.5 0 0 0 9 6 V-6 M-3 -2 V8 M3 -2 V8" />
        </g>
      )}
      {(lock === null || lock === 'plate') && (
        <g>
          <path d="M-5 -2 V-7 A5 5 0 0 1 5 -7 V-2" />
          <rect x="-8" y="-2" width="16" height="12" rx="2" />
        </g>
      )}
    </g>
  );
}

/**
 * Room 5: a drawbridge between two piers over the water; restored, its deck is down and
 * lit, so the road runs across. Until then the deck stands raised (story 2.8).
 */
function Bridge({ restored }: { restored: boolean }) {
  return (
    <g>
      {/* Two piers on the banks, an arch between them, and the water under it. */}
      <path d="M-40 36 V4 M40 36 V4" />
      <path d="M-28 36 Q0 0 28 36" />
      <path d="M-44 38 Q-30 32 -16 38 T12 38 T40 38" className="glyph__water" />
      {restored ? (
        <>
          <rect x="-40" y="-4" width="80" height="8" className="glyph__lit" />
          <path d="M-32 -4 V-16 M-16 -4 V-16 M0 -4 V-16 M16 -4 V-16 M32 -4 V-16 M-36 -16 H36" />
        </>
      ) : (
        <path d="M-40 4 L-14 -34 M-36 8 L-10 -30 M-40 4 L-36 8 M-14 -34 L-10 -30" />
      )}
    </g>
  );
}

/**
 * Room 6: the yard's big scale, a post with a beam and a pan on each end; restored, the beam
 * is level and a crate sits lit on one pan (story 2.9). Until then the beam hangs tipped.
 */
function WeighingYard({ restored }: { restored: boolean }) {
  const beam = restored ? 'M-34 -18 L34 -18' : 'M-34 -26 L34 -10';
  const leftY = restored ? -18 : -26;
  const rightY = restored ? -18 : -10;
  return (
    <g>
      <path d="M0 -18 V36 M-18 36 H18" />
      <path d={beam} />
      <path d={`M-34 ${leftY} V${leftY + 18} M-44 ${leftY + 18} H-24`} />
      <path d={`M34 ${rightY} V${rightY + 18} M24 ${rightY + 18} H44`} />
      {restored && <rect x="-42" y="-12" width="16" height="12" className="glyph__lit" />}
    </g>
  );
}

/**
 * Room 7: the old logbook; restored, it lies open with a lit page and its lines written
 * (story 2.10). Until then it stays shut, a clasp across its cover.
 */
function OldLogbook({ restored }: { restored: boolean }) {
  return restored ? (
    <g>
      <path d="M0 -24 Q-18 -32 -38 -26 V28 Q-18 22 0 30 Q18 22 38 28 V-26 Q18 -32 0 -24 Z M0 -24 V30" />
      <path d="M6 -20 Q20 -26 34 -21 V24 Q20 18 6 25 Z" className="glyph__lit" />
      <path d="M-32 -14 H-8 M-32 -4 H-8 M-32 6 H-14 M12 -12 H28 M12 -2 H28 M12 8 H22" />
    </g>
  ) : (
    <g>
      <rect x="-28" y="-32" width="56" height="62" rx="4" />
      <path d="M-22 -32 V30 M20 -6 H34 V8 H20" />
    </g>
  );
}

/** Room 8: a tram car on its rail; restored, its windows are lit and it moves off. */
function Tram({ restored }: { restored: boolean }) {
  const lit = restored ? 'glyph__lit' : undefined;
  return (
    <g>
      <path d="M-40 30 H40" />
      <path d="M0 -38 V-26 M-10 -38 H10" />
      <rect x="-34" y="-26" width="68" height="42" rx="6" />
      <rect x="-26" y="-18" width="16" height="14" className={lit} />
      <rect x="-6" y="-18" width="12" height="14" className={lit} />
      <rect x="10" y="-18" width="16" height="14" className={lit} />
      <circle cx="-18" cy="22" r="7" />
      <circle cx="18" cy="22" r="7" />
      {restored && <path d="M-48 -8 H-38 M-50 4 H-38" />}
    </g>
  );
}

/** Room 9: a lift cage between two rails; restored, it stands at the top, lit, with steam. */
function SteamLift({ restored }: { restored: boolean }) {
  const y = restored ? -30 : 8;
  return (
    <g>
      <path d="M-26 40 V-40 M26 40 V-40 M-34 40 H34" />
      <rect x="-18" y={y} width="36" height="28" className={restored ? 'glyph__lit' : undefined} />
      <path d={`M-18 ${y + 14} H18`} />
      {restored && <path d="M30 -38 q8 -6 0 -12 q-8 -6 0 -12" />}
    </g>
  );
}

/** Room 10: a market stall's hanging scales; restored, they hang level, with a lit awning. */
function MarketScales({ restored }: { restored: boolean }) {
  const tilt = restored ? 0 : 10;
  return (
    <g>
      <path d="M-38 -26 L0 -40 L38 -26 Z" className={restored ? 'glyph__lit' : undefined} />
      <path d="M0 -26 V-12" />
      <g transform={`rotate(${tilt} 0 -12)`}>
        <path d="M-30 -12 H30 M-24 -12 L-30 10 H-18 Z M24 -12 L18 10 H30 Z" />
      </g>
      <path d="M0 -12 V36 M-16 36 H16" />
    </g>
  );
}

/** Room 11: a great spoked wheel on its stand; restored, its hub is lit and it turns. */
function GreatWheel({ restored }: { restored: boolean }) {
  const spokes = [0, 30, 60, 90, 120, 150].map((angle) => {
    const r = (angle * Math.PI) / 180;
    const [dx, dy] = [Math.cos(r) * 32, Math.sin(r) * 32];
    return `M${-dx} ${-dy - 4} L${dx} ${dy - 4}`;
  });
  return (
    <g>
      <path d="M-20 40 L0 -4 L20 40 M-28 40 H28" />
      <g className={restored ? 'glyph__turning' : undefined}>
        <circle cx="0" cy="-4" r="32" />
        <path d={spokes.join(' ')} />
      </g>
      <circle cx="0" cy="-4" r="6" className={restored ? 'glyph__lit' : undefined} />
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
