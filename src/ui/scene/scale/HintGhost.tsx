import { extend, useApplication } from '@pixi/react';
import { Container, Graphics, Text, type TextStyleOptions, type Ticker } from 'pixi.js';
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { palette } from '@/art/palette';
import { dialSkin } from '@/art/skins/dial';
import { type FrameShape, frameTag, splitterSkin } from '@/art/skins/splitter';
import { tuning } from '@/config/tuning';
import { notchCount, notchOf } from '@/room/dial';
import { hintView } from '@/room/hint';
import { divisorLabel } from '@/room/pieces';
import { currentStageSpec } from '@/room/room';
import { scaleView } from '@/room/scale';
import { trayPiece } from '@/room/tray';
import type { RoomState, TrayKind } from '@/room/types';
import { useGame } from '@/store/store';
import { dialLayout, followScroll } from '@/ui/scene/scale/dial-layout';
import {
  frameGhost,
  type GhostCopy,
  ghostLoop,
  knobGhost,
  type PiecePath,
  pieceGhost,
  slideReach,
} from '@/ui/scene/scale/hint-ghost';
import {
  beamPose,
  labelFontSize,
  type PieceBox,
  pieceSize,
  scaleGeometry,
} from '@/ui/scene/scale/layout';
import { Piece } from '@/ui/scene/scale/Piece';
import { splitterLayout } from '@/ui/scene/scale/splitter-layout';
import { trayLayout } from '@/ui/scene/scale/tray-layout';
import { usePrefersReducedMotion } from '@/ui/scene/scale/use-balloon-bob';

extend({ Container, Graphics, Text });

interface Props {
  /** CSS px per scene unit. */
  sceneScale: number;
}

/**
 * The hint's ghosts (story 1.16): on the hint button's second press, the exact next move
 * shows in the scene, faint, and again after a pause for as long as the hint shows
 * (hint-ghost.ts): the dial's knob two notches the right way and back, the tray piece from
 * the tray onto both pans, or the splitter frame from its holder over the scale. Presentation
 * only: no store change, no event, and it takes no touches. Each press starts it again.
 * Under reduced motion it stands still where the move ends.
 */
export function HintGhost({ sceneScale }: Props) {
  const room = useGame((s) => s.room);
  const tools = useGame((s) => s.save.progress.tools);
  const hint = useGame((s) => s.ui.hint);
  const view = useMemo(() => hintView(room, tools, hint), [room, tools, hint]);
  const move = view?.level === 2 ? view.move : null;
  if (!room || !view || !move || !(sceneScale > 0)) return null;
  switch (move.kind) {
    case 'slide':
      return (
        <KnobGhost
          key={view.presses}
          room={room}
          direction={move.direction}
          sceneScale={sceneScale}
        />
      );
    case 'tray':
      return (
        <PieceGhost
          key={view.presses}
          kind={move.piece}
          amount={move.amount}
          tilt={scaleView(room).tilt}
          sceneScale={sceneScale}
        />
      );
    case 'split':
      return <FrameGhost key={view.presses} parts={move.parts} sceneScale={sceneScale} />;
    default:
      return null;
  }
}

/**
 * Runs `apply` on every frame with the ghost's share of its way (null in the pause), from
 * the moment it mounts; under reduced motion once, at `still`. A layout effect, so the
 * ticker callback goes while the app still exists (as in Steam.tsx).
 */
function useGhostClock(apply: (t: number | null) => void, still: number) {
  const { app, isInitialised } = useApplication();
  const reduced = usePrefersReducedMotion();
  const applyRef = useRef(apply);
  useLayoutEffect(() => {
    applyRef.current = apply;
  });
  useLayoutEffect(() => {
    if (!isInitialised) return;
    if (reduced) {
      applyRef.current(still);
      return;
    }
    const { ticker } = app;
    const start = ticker.lastTime;
    const onFrame = (frame: Ticker) => applyRef.current(ghostLoop(frame.lastTime - start));
    applyRef.current(0);
    ticker.add(onFrame);
    return () => {
      ticker.remove(onFrame);
    };
  }, [app, isInitialised, reduced, still]);
}

function place(node: Container | null, copy: GhostCopy | null, at = { x: 0, y: 0 }): void {
  if (!node || node.destroyed) return;
  if (!copy) {
    node.alpha = 0;
    return;
  }
  node.position.set(at.x + copy.x, at.y + copy.y);
  node.alpha = copy.alpha;
}

interface KnobProps {
  room: RoomState;
  direction: 1 | -1;
  sceneScale: number;
}

/** The knob's ghost, two notches the right way and back, over the real knob. */
function KnobGhost({ room, direction, sceneScale }: KnobProps) {
  const ref = useRef<Container>(null);
  const { dial } = currentStageSpec(room);
  const notches = dial === 'locked' ? 0 : notchCount(dial);
  const layout = useMemo(() => dialLayout(sceneScale, notches), [sceneScale, notches]);
  const at = dial === 'locked' ? 0 : notchOf(dial, room.stage.dialX);
  const offset = at * layout.spacing;
  const home = { x: layout.originX - followScroll(layout, 0, offset) + offset, y: layout.trackY };
  const reach = slideReach(direction, at, notches, tuning.hintSlideNotches) * layout.spacing;
  const draw = useCallback(
    (g: Graphics) => dialSkin.knob(g, layout.knob.width, layout.knob.height, layout.lineWidth),
    [layout],
  );
  useGhostClock((t) => place(ref.current, t === null ? null : knobGhost(t, reach), home), 0.5);
  if (dial === 'locked' || reach === 0) return null;
  return (
    <pixiContainer ref={ref} eventMode="none" interactiveChildren={false} alpha={0}>
      <pixiGraphics draw={draw} />
    </pixiContainer>
  );
}

interface PieceProps {
  kind: TrayKind;
  amount: number;
  /** The scale's tilt now, so the copies land on the pans where they hang. */
  tilt: number;
  sceneScale: number;
}

const noPlace = () => {};

/** The tray piece's ghost: from the tray over the scale, then one copy onto each pan. */
function PieceGhost({ kind, amount, tilt, sceneScale }: PieceProps) {
  const copies = useRef<(Container | null)[]>([]);
  const fontSize = labelFontSize(sceneScale);
  const piece = useMemo(() => trayPiece(kind, amount), [kind, amount]);
  const box: PieceBox = useMemo(
    () => ({ key: piece.key, x: 0, y: 0, ...pieceSize(piece, fontSize) }),
    [piece, fontSize],
  );
  const path: PiecePath | null = useMemo(() => {
    const slot = trayLayout(sceneScale, fontSize).slots.find((each) => each.kind === kind);
    if (!slot) return null;
    const pose = beamPose(tilt);
    const { pivot, postHeight } = scaleGeometry;
    return {
      from: slot.piece,
      rise: box.height * 0.6,
      over: { x: pivot.x, y: pivot.y - postHeight - box.height * 1.6 },
      pans: [pose.left, pose.right],
    };
  }, [sceneScale, fontSize, kind, tilt, box.height]);
  useGhostClock((t) => {
    const shown = t === null || !path ? [] : pieceGhost(t, path);
    copies.current.forEach((node, i) => {
      place(node, shown[i] ?? null);
    });
  }, 0.85);
  if (!path) return null;
  return (
    <pixiContainer eventMode="none" interactiveChildren={false}>
      {[0, 1].map((i) => (
        <pixiContainer
          key={`ghost-${i}`}
          ref={(node: Container | null) => {
            copies.current[i] = node;
          }}
          alpha={0}
        >
          <Piece piece={piece} box={box} fontSize={fontSize} nodeRef={noPlace} />
        </pixiContainer>
      ))}
    </pixiContainer>
  );
}

interface FrameProps {
  parts: number;
  sceneScale: number;
}

/** The splitter frame's ghost, set to the move's parts: from its holder over the scale. */
function FrameGhost({ parts, sceneScale }: FrameProps) {
  const ref = useRef<Container>(null);
  const fontSize = labelFontSize(sceneScale);
  const layout = useMemo(() => splitterLayout(sceneScale, fontSize), [sceneScale, fontSize]);
  const { width, height } = layout.frame;
  const shape: FrameShape = useMemo(
    () => ({ width, height, parts, lineWidth: layout.lineWidth }),
    [width, height, parts, layout.lineWidth],
  );
  const draw = useCallback((g: Graphics) => splitterSkin.frame(g, shape), [shape]);
  const tag = frameTag(shape);
  const style: TextStyleOptions = useMemo(
    () => ({ fontFamily: 'system-ui, sans-serif', fontSize, fontWeight: '700', fill: palette.ink }),
    [fontSize],
  );
  const from = { x: layout.frame.x, y: layout.frame.y };
  const { pivot, postHeight } = scaleGeometry;
  // Over the middle of the beam, just above the pivot, as he would drop it.
  const to = { x: pivot.x - width / 2, y: pivot.y - postHeight - height - fontSize };
  useGhostClock((t) => place(ref.current, t === null ? null : frameGhost(t, from, to)), 0.7);
  return (
    <pixiContainer ref={ref} eventMode="none" interactiveChildren={false} alpha={0}>
      <pixiGraphics draw={draw} />
      <pixiText
        text={divisorLabel(BigInt(parts))}
        anchor={0.5}
        x={tag.x + tag.width / 2}
        y={tag.y + tag.height / 2}
        style={style}
      />
    </pixiContainer>
  );
}
