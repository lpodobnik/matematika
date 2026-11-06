import { extend } from '@pixi/react';
import { Container, type FederatedPointerEvent, Graphics, type PointData } from 'pixi.js';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { scaleSkin } from '@/art/skins/scale';
import { type PanView, type PieceView, pinRevealView, scaleView, scaleViewAt } from '@/room/scale';
import { trayWorks } from '@/room/tray';
import type { Side } from '@/room/types';
import { useGame } from '@/store/store';
import { minHitCssPx } from '@/ui/scene/scale/dial-layout';
import { beamPose, labelFontSize, scaleGeometry } from '@/ui/scene/scale/layout';
import { Pan } from '@/ui/scene/scale/Pan';
import type { HiddenPiece, PieceDrag } from '@/ui/scene/scale/piece-drag';
import { pieceIdentity } from '@/ui/scene/scale/piece-tween';
import { createTiltSpring, type TiltSpring } from '@/ui/scene/scale/tilt-spring';
import type { Point } from '@/ui/scene/scale/tray-layout';
import { useCarry } from '@/ui/scene/scale/use-carry';
import { usePinTest } from '@/ui/scene/scale/use-pin-test';

extend({ Container, Graphics });

/** Before a room is entered the stand shows with empty pans. */
const emptyPan: PanView = { pieces: [], value: { n: 0n, d: 1n } };

interface Props {
  /** CSS px per scene unit, so labels can stay at least 20 CSS px. */
  sceneScale: number;
  /** Carries weights and floats off the pans into the tray (story 1.10). */
  drag: PieceDrag;
  /** A point on the canvas in scene units. */
  toScene(point: PointData): Point;
}

/** The piece carried off a pan, hidden on that pan while it is carried; null for the other pan. */
function hiddenOn(side: Side, drag: ReturnType<typeof useCarry>): HiddenPiece | null {
  if (drag?.source.from !== 'pan' || drag.source.side !== side) return null;
  return { key: drag.source.key, identity: pieceIdentity(drag.piece) };
}

/**
 * The scale: the stage's equation as pieces on two pans that tip toward the heavier side.
 * What it shows comes from `scaleView`; the tilt springs there through refs, frame by
 * frame, without React renders. While the machine tests a pin he confirmed (story 1.14;
 * use-pin-test.ts), the pans follow the dial's x as the machine turns it notch by notch
 * (`scaleViewAt`), or weigh the x of a pin beyond the dial for a moment (`pinRevealView`).
 * While the tray works, its weights and floats can be grabbed and carried into the tray.
 */
export function Scale({ sceneScale, drag, toScene }: Props) {
  const room = useGame((s) => s.room);
  const works = useGame((s) => (s.room ? trayWorks(s.room, s.save.progress.tools) : false));
  const test = usePinTest();
  const view = useMemo(() => {
    if (!room) return null;
    if (test.weighX !== null) return pinRevealView(room) ?? scaleView(room);
    if (test.dialX !== null) return scaleViewAt(room, test.dialX);
    return scaleView(room);
  }, [room, test.weighX, test.dialX]);
  const fontSize = labelFontSize(sceneScale);
  const minHit = sceneScale > 0 ? minHitCssPx / sceneScale : 0;
  const target = view?.tilt ?? 0;
  const carry = useCarry(drag);

  const grab = useCallback(
    (side: Side) => (piece: PieceView, event: FederatedPointerEvent) => {
      if (event.button !== 0) return;
      const home = toScene((event.currentTarget as Container).getGlobalPosition());
      drag.start(
        event.pointerId,
        { from: 'pan', side, key: piece.key },
        piece,
        home,
        toScene(event.global),
      );
    },
    [drag, toScene],
  );
  const grabLeft = useMemo(() => (works ? grab('left') : null), [works, grab]);
  const grabRight = useMemo(() => (works ? grab('right') : null), [works, grab]);

  const beamRef = useRef<Container>(null);
  const leftRef = useRef<Container>(null);
  const rightRef = useRef<Container>(null);
  const springRef = useRef<TiltSpring | null>(null);

  // Created before the first paint, so the pans never show at the scene's corner.
  useLayoutEffect(() => {
    const apply = (tilt: number) => {
      const pose = beamPose(tilt);
      if (beamRef.current) beamRef.current.rotation = pose.rotation;
      leftRef.current?.position.set(pose.left.x, pose.left.y);
      rightRef.current?.position.set(pose.right.x, pose.right.y);
    };
    const spring = createTiltSpring(apply);
    springRef.current = spring;
    apply(spring.current());
    return () => {
      spring.destroy();
      springRef.current = null;
    };
  }, []);

  useEffect(() => {
    springRef.current?.setTarget(target);
  }, [target]);

  const drawStand = useCallback(
    (g: Graphics) => scaleSkin.stand(g, scaleGeometry.pivot, scaleGeometry.floorY),
    [],
  );
  const drawBeam = useCallback(
    (g: Graphics) => scaleSkin.beam(g, scaleGeometry.beamHalfLength),
    [],
  );
  return (
    <pixiContainer>
      <pixiGraphics draw={drawStand} />
      <pixiContainer ref={beamRef} x={scaleGeometry.pivot.x} y={scaleGeometry.pivot.y}>
        <pixiGraphics draw={drawBeam} />
      </pixiContainer>
      <Pan
        side="left"
        containerRef={leftRef}
        pan={view?.left ?? emptyPan}
        readout={view?.readouts?.left ?? null}
        fontSize={fontSize}
        onGrab={grabLeft}
        hidden={hiddenOn('left', carry)}
        minHit={minHit}
      />
      <Pan
        side="right"
        containerRef={rightRef}
        pan={view?.right ?? emptyPan}
        readout={view?.readouts?.right ?? null}
        fontSize={fontSize}
        onGrab={grabRight}
        hidden={hiddenOn('right', carry)}
        minHit={minHit}
      />
    </pixiContainer>
  );
}
