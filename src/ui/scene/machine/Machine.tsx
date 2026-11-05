import { extend } from '@pixi/react';
import { animate } from 'motion';
import { Container, Graphics } from 'pixi.js';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { machineSkin } from '@/art/skins/machine';
import { machineView } from '@/room/machine';
import { presentationView } from '@/room/phases';
import { useGame } from '@/store/store';
import {
  doorLift,
  joltMs,
  joltOffset,
  lampDelayMs,
  lampGlow,
  lampLightMs,
  lampPositions,
  machineGeometry,
  presentationMs,
  pulleyPositions,
  pulleyTurnMs,
  runningHum,
} from '@/ui/scene/machine/layout';
import { createProgressSpring, type ProgressSpring } from '@/ui/scene/machine/progress-spring';

extend({ Container, Graphics });

const { shape } = machineGeometry;
const pulleys = pulleyPositions();

/**
 * The room's machine (placeholder skin): its door rises with the machine's progress, a
 * wedge and steam show when it jams, a lamp for each stage lights when that stage locks,
 * and when the room's last stage locks the whole machine runs: its pulleys turn and it hums.
 * It is the only thing that shows success: there are no stars, scores or "correct" screens
 * (NFR13). What it shows comes from `machineView` and `presentationView`; everything moves
 * through refs, frame by frame, without React renders.
 *
 * It also times the presentations (Pattern 2, Restart): when a lock or the restart has
 * played, it reports `presentation/done`. If that report is ever lost, the clock ends the
 * presentation anyway (room/phases.ts).
 */
export function Machine() {
  const view = useGame(useShallow((s) => machineView(s.room)));
  const playing = useGame(useShallow((s) => presentationView(s.room)));
  const dispatch = useGame((s) => s.dispatch);
  const present = view !== null;
  const progress = view?.progress ?? 0;
  const jammed = view?.jammed ?? false;
  const parts = view?.parts ?? 0;
  const partsStarted = view?.partsStarted ?? 0;
  const running = view?.running ?? false;

  const bodyRef = useRef<Container>(null);
  const doorRef = useRef<Container>(null);
  const maskRef = useRef<Graphics>(null);
  const springRef = useRef<ProgressSpring | null>(null);
  const pulleyRefs = useRef<(Container | null)[]>([]);

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

  // A lock or the restart plays for its time, then is reported done. During the restart
  // the whole machine hums.
  useEffect(() => {
    if (!playing) return;
    const body = bodyRef.current;
    const hums = playing.phase === 'restart';
    const controls = animate(0, 1, {
      duration: presentationMs[playing.phase] / 1000,
      ease: 'linear',
      onUpdate: (t) => {
        if (hums && body) body.y = runningHum(t);
      },
      onComplete: () => dispatch({ type: 'presentation/done', ...playing }),
    });
    return () => {
      controls.stop();
      if (body) body.y = 0;
    };
  }, [playing, dispatch]);

  // While the whole machine runs, its pulleys turn.
  useEffect(() => {
    if (!running) return;
    const turning = pulleyRefs.current;
    const controls = animate(0, Math.PI * 2, {
      duration: pulleyTurnMs / 1000,
      ease: 'linear',
      repeat: Number.POSITIVE_INFINITY,
      onUpdate: (angle) => {
        for (const pulley of turning) if (pulley) pulley.rotation = angle;
      },
    });
    return () => {
      controls.stop();
      for (const pulley of turning) if (pulley) pulley.rotation = 0;
    };
  }, [running]);

  const lamps = useMemo(() => lampPositions(parts), [parts]);
  const drawFrame = useCallback((g: Graphics) => machineSkin.frame(g, shape), []);
  const drawPulley = useCallback((g: Graphics) => machineSkin.pulley(g, shape), []);
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
        {pulleys.map((point, i) => (
          <pixiContainer
            // biome-ignore lint/suspicious/noArrayIndexKey: the two pulleys never change
            key={`pulley-${i}`}
            ref={(pulley: Container | null) => {
              pulleyRefs.current[i] = pulley;
            }}
            x={point.x}
            y={point.y}
          >
            <pixiGraphics draw={drawPulley} />
          </pixiContainer>
        ))}
        {lamps.map((point, i) => (
          <Lamp
            // biome-ignore lint/suspicious/noArrayIndexKey: a lamp is its part, by position
            key={`lamp-${i}`}
            x={point.x}
            y={point.y}
            lit={i < partsStarted}
          />
        ))}
        {jammed && <pixiGraphics draw={drawJam} />}
      </pixiContainer>
    </pixiContainer>
  );
}

interface LampProps {
  x: number;
  y: number;
  /** Its part of the machine has started: its stage is solved. */
  lit: boolean;
}

/** One lamp: it comes on, with its light swelling in, when its stage locks. */
function Lamp({ x, y, lit }: LampProps) {
  const lightRef = useRef<Container>(null);
  const wasLit = useRef(lit);
  const drawLamp = useCallback((g: Graphics) => machineSkin.lamp(g, shape), []);
  const drawLight = useCallback((g: Graphics) => machineSkin.lampLight(g, shape), []);

  useLayoutEffect(() => {
    const light = lightRef.current;
    const comingOn = lit && !wasLit.current;
    wasLit.current = lit;
    if (!light) return;
    light.visible = lit;
    light.alpha = comingOn ? 0 : 1;
    light.scale.set(1);
    if (!comingOn) return;
    const controls = animate(0, 1, {
      delay: lampDelayMs / 1000,
      duration: lampLightMs / 1000,
      ease: 'easeOut',
      onUpdate: (t) => {
        const glow = lampGlow(t);
        light.alpha = glow.alpha;
        light.scale.set(glow.scale);
      },
    });
    return () => {
      controls.stop();
      light.alpha = 1;
      light.scale.set(1);
    };
  }, [lit]);

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={drawLamp} />
      <pixiContainer ref={lightRef} visible={lit}>
        <pixiGraphics draw={drawLight} />
      </pixiContainer>
    </pixiContainer>
  );
}
