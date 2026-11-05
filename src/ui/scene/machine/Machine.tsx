import { extend } from '@pixi/react';
import { animate } from 'motion';
import { Container, Graphics } from 'pixi.js';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { machineSkin } from '@/art/skins/machine';
import { machineView } from '@/room/machine';
import { useGame } from '@/store/store';
import { doorLift, joltMs, joltOffset, machineGeometry } from '@/ui/scene/machine/layout';
import { createProgressSpring, type ProgressSpring } from '@/ui/scene/machine/progress-spring';

extend({ Container, Graphics });

const { shape } = machineGeometry;

/**
 * The room's machine (placeholder skin): its door rises with the machine's progress, and
 * a wedge and steam show when it jams. It is the only thing that shows success: there are
 * no stars, scores or "correct" screens (NFR13). What it shows comes from `machineView`;
 * the door moves through refs, frame by frame, without React renders.
 */
export function Machine() {
  const view = useGame(useShallow((s) => machineView(s.room)));
  const present = view !== null;
  const progress = view?.progress ?? 0;
  const jammed = view?.jammed ?? false;

  const bodyRef = useRef<Container>(null);
  const doorRef = useRef<Container>(null);
  const maskRef = useRef<Graphics>(null);
  const springRef = useRef<ProgressSpring | null>(null);

  useLayoutEffect(() => {
    const spring = createProgressSpring((value) => {
      if (doorRef.current) doorRef.current.y = -doorLift(value);
    });
    springRef.current = spring;
    return () => {
      spring.destroy();
      springRef.current = null;
    };
  }, []);

  // When the machine appears, the door is masked to its opening and set where it is.
  useLayoutEffect(() => {
    const door = doorRef.current;
    if (!present || !door) return;
    door.mask = maskRef.current;
    door.y = -doorLift(springRef.current?.current() ?? 0);
  }, [present]);

  useEffect(() => {
    springRef.current?.setTarget(progress);
  }, [progress]);

  // A jam shakes the machine once.
  useEffect(() => {
    const body = bodyRef.current;
    if (!jammed || !body) return;
    const controls = animate(0, 1, {
      duration: joltMs / 1000,
      ease: 'linear',
      onUpdate: (t) => {
        body.x = joltOffset(t);
      },
      onComplete: () => {
        body.x = 0;
      },
    });
    return () => {
      controls.stop();
      body.x = 0;
    };
  }, [jammed]);

  const drawFrame = useCallback((g: Graphics) => machineSkin.frame(g, shape), []);
  const drawOpening = useCallback((g: Graphics) => machineSkin.opening(g, shape), []);
  const drawDoor = useCallback((g: Graphics) => machineSkin.door(g, shape), []);
  const drawMask = useCallback((g: Graphics) => machineSkin.mask(g, shape), []);
  const drawJam = useCallback((g: Graphics) => machineSkin.jam(g, shape), []);

  if (!present) return null;
  return (
    <pixiContainer x={machineGeometry.x} y={machineGeometry.y}>
      <pixiContainer ref={bodyRef}>
        <pixiGraphics draw={drawOpening} />
        <pixiGraphics ref={maskRef} draw={drawMask} />
        <pixiContainer ref={doorRef}>
          <pixiGraphics draw={drawDoor} />
        </pixiContainer>
        <pixiGraphics draw={drawFrame} />
        {jammed && <pixiGraphics draw={drawJam} />}
      </pixiContainer>
    </pixiContainer>
  );
}
