import { extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { scaleSkin } from '@/art/skins/scale';
import { type PanView, pinRevealView, type ScaleView, scaleView } from '@/room/scale';
import type { RoomState } from '@/room/types';
import { useGame } from '@/store/store';
import { beamPose, labelFontSize, scaleGeometry } from '@/ui/scene/scale/layout';
import { Pan } from '@/ui/scene/scale/Pan';
import { pinRevealMs } from '@/ui/scene/scale/pin-layout';
import { createTiltSpring, type TiltSpring } from '@/ui/scene/scale/tilt-spring';

extend({ Container, Graphics });

/** Before a room is entered the stand shows with empty pans. */
const emptyPan: PanView = { pieces: [], value: { n: 0n, d: 1n } };

interface Props {
  /** CSS px per scene unit, so labels can stay at least 20 CSS px. */
  sceneScale: number;
}

/**
 * A wrong x pin's own tilt, shown briefly when it resolves (Pattern 2, Resolution): the
 * reveal plays for `pinRevealMs` from the moment the pin resolves, and the next notch of
 * the dial (exploring) ends it early. A pin that had already resolved when the scale
 * mounted doesn't play again.
 */
function usePinReveal(room: RoomState | null): ScaleView | null {
  const reveal = useMemo(() => (room ? pinRevealView(room) : null), [room]);
  const key = reveal && room ? `${room.spec.id}.${room.stageIndex}.${reveal.x}` : null;
  const dialX = room?.stage.dialX ?? null;
  const dialXRef = useRef(dialX);
  dialXRef.current = dialX;
  const seen = useRef(key);
  const [playing, setPlaying] = useState<{ key: string; dialX: number | null } | null>(null);
  useEffect(() => {
    if (key === seen.current) return;
    seen.current = key;
    if (key === null) return;
    setPlaying({ key, dialX: dialXRef.current });
    const timer = setTimeout(() => setPlaying(null), pinRevealMs);
    return () => clearTimeout(timer);
  }, [key]);
  return playing && playing.key === key && playing.dialX === dialX ? reveal : null;
}

/**
 * The scale: the stage's equation as pieces on two pans that tip toward the heavier side.
 * What it shows comes from `scaleView` (or briefly `pinRevealView`, when a wrong x pin
 * resolves); the tilt springs there through refs, frame by frame, without React renders.
 */
export function Scale({ sceneScale }: Props) {
  const room = useGame((s) => s.room);
  const live = useMemo(() => (room ? scaleView(room) : null), [room]);
  const view = usePinReveal(room) ?? live;
  const fontSize = labelFontSize(sceneScale);
  const target = view?.tilt ?? 0;

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
      />
      <Pan
        side="right"
        containerRef={rightRef}
        pan={view?.right ?? emptyPan}
        readout={view?.readouts?.right ?? null}
        fontSize={fontSize}
      />
    </pixiContainer>
  );
}
