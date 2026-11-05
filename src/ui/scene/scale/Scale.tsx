import { extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { scaleSkin } from '@/art/skins/scale';
import { type PanView, scaleView } from '@/room/scale';
import { useGame } from '@/store/store';
import { beamPose, labelFontSize, scaleGeometry } from '@/ui/scene/scale/layout';
import { Pan } from '@/ui/scene/scale/Pan';
import { createTiltSpring, type TiltSpring } from '@/ui/scene/scale/tilt-spring';

extend({ Container, Graphics });

/** Before a room is entered the stand shows with empty pans. */
const emptyPan: PanView = { pieces: [], value: { n: 0n, d: 1n } };

interface Props {
  /** CSS px per scene unit, so labels can stay at least 20 CSS px. */
  sceneScale: number;
}

/**
 * The scale: the stage's equation as pieces on two pans that tip toward the heavier side.
 * What it shows comes from `scaleView`; the tilt springs there through refs, frame by frame,
 * without React renders.
 */
export function Scale({ sceneScale }: Props) {
  const room = useGame((s) => s.room);
  const view = useMemo(() => (room ? scaleView(room) : null), [room]);
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
      <Pan containerRef={leftRef} pan={view?.left ?? emptyPan} fontSize={fontSize} />
      <Pan containerRef={rightRef} pan={view?.right ?? emptyPan} fontSize={fontSize} />
    </pixiContainer>
  );
}
