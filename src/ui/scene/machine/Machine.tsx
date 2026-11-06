import { extend } from '@pixi/react';
import { animate } from 'motion';
import { Container, Graphics } from 'pixi.js';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { effectsAt } from '@/art/quality';
import { machineSkin } from '@/art/skins/machine';
import { machineView } from '@/room/machine';
import { presentationView } from '@/room/phases';
import { qualityInUse } from '@/store/quality';
import { useGame } from '@/store/store';
import { Steam } from '@/ui/scene/effects/Steam';
import {
  doorLift,
  doorTravel,
  joltMs,
  joltOffset,
  lampDelayMs,
  lampGlow,
  lampLightMs,
  lampPositions,
  latchRattle,
  latchRattleDelayMs,
  latchRattleMs,
  latchRattles,
  latchReturnDelayMs,
  latchSlide,
  latchSlideMs,
  machineGeometry,
  machineLatch,
  machineSteam,
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
 * The room's machine (placeholder skin): its door rises with the machine's progress, held
 * by a latch to a share of its travel until the check line, when the latch slides out and
 * the door rises all the way (story 1.14); the latch rattles when the answer line brings the
 * door up against it. A wedge and steam show when it jams, a lamp for each stage lights when that stage locks,
 * and when the room's last stage locks the whole machine runs: its pulleys turn and it hums.
 * Steam rises from its vent while the quality setting keeps particles (story 1.12).
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
  const steams = useGame((s) => effectsAt(qualityInUse(s.ui.quality)).particles);
  const present = view !== null;
  const progress = view?.progress ?? 0;
  const jammed = view?.jammed ?? false;
  const parts = view?.parts ?? 0;
  const partsStarted = view?.partsStarted ?? 0;
  const running = view?.running ?? false;
  const locked = view?.locked ?? false;

  const bodyRef = useRef<Container>(null);
  const doorRef = useRef<Container>(null);
  const maskRef = useRef<Graphics>(null);
  const latchRef = useRef<Container>(null);
  const latchMaskRef = useRef<Graphics>(null);
  const springRef = useRef<ProgressSpring | null>(null);
  const pulleyRefs = useRef<(Container | null)[]>([]);
  // The door's aim: the latest progress, and whether the latch still holds the door. The
  // latch lets go only once it has slid out, so these live in refs, not React state.
  const progressRef = useRef(progress);
  const latchedRef = useRef(true);
  // Whether the latch is drawn out (slid into its box), or holding the door.
  const latchOutRef = useRef(false);

  const aimDoor = useCallback(() => {
    springRef.current?.setTarget(doorTravel(progressRef.current, latchedRef.current));
  }, []);

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

  // When the machine appears, the door is masked to its opening and set where it is, and
  // the latch is masked to the posts and set holding the door, or out if the stage is
  // already locked. Later locks and unlocks slide the latch (below), so `locked` is read
  // only here, as it appears.
  // biome-ignore lint/correctness/useExhaustiveDependencies: locked is read once, on appearing
  useLayoutEffect(() => {
    const door = doorRef.current;
    const latch = latchRef.current;
    if (!present || !door || !latch) return;
    door.mask = maskRef.current;
    door.y = -doorLift(springRef.current?.current() ?? 0);
    latch.mask = latchMaskRef.current;
    latchedRef.current = !locked;
    latchOutRef.current = locked;
    latch.x = locked ? latchSlide(1) : 0;
  }, [present]);

  // Each line's progress aims the door. When the answer line brings it up against the
  // latch, the latch rattles once.
  useEffect(() => {
    const before = progressRef.current;
    progressRef.current = progress;
    aimDoor();
    const latch = latchRef.current;
    if (!latch || latchOutRef.current || !latchRattles(before, progress)) return;
    const controls = animate(0, 1, {
      delay: latchRattleDelayMs / 1000,
      duration: latchRattleMs / 1000,
      ease: 'linear',
      onUpdate: (t) => {
        latch.x = latchRattle(t);
      },
      onComplete: () => {
        latch.x = 0;
      },
    });
    return () => {
      controls.stop();
      if (!latchOutRef.current) latch.x = 0;
    };
  }, [progress, aimDoor]);

  // A lock slides the latch out, and only then lets the door rise all the way. The next
  // stage brings the door down and, once it is down, slides the latch back in.
  useEffect(() => {
    const latch = latchRef.current;
    if (!present || !latch) return;
    if (locked) {
      if (latchOutRef.current) return;
      const finish = () => {
        latch.x = latchSlide(1);
        latchOutRef.current = true;
        latchedRef.current = false;
        aimDoor();
      };
      const controls = animate(0, 1, {
        duration: latchSlideMs / 1000,
        ease: 'linear',
        onUpdate: (t) => {
          latch.x = latchSlide(t);
        },
        onComplete: finish,
      });
      return () => {
        controls.stop();
        if (!latchOutRef.current) finish();
      };
    }
    latchedRef.current = true;
    aimDoor();
    if (!latchOutRef.current) return;
    const finish = () => {
      latch.x = 0;
      latchOutRef.current = false;
    };
    const controls = animate(1, 0, {
      delay: latchReturnDelayMs / 1000,
      duration: latchSlideMs / 1000,
      ease: 'linear',
      onUpdate: (t) => {
        latch.x = latchSlide(t);
      },
      onComplete: finish,
    });
    return () => {
      controls.stop();
      if (latchOutRef.current) finish();
    };
  }, [locked, present, aimDoor]);

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
  const drawLatch = useCallback((g: Graphics) => machineSkin.latch(g, machineLatch), []);
  const drawKeepers = useCallback((g: Graphics) => machineSkin.keepers(g, shape, machineLatch), []);
  const drawLatchMask = useCallback(
    (g: Graphics) => machineSkin.latchMask(g, shape, machineLatch),
    [],
  );
  const drawMask = useCallback((g: Graphics) => machineSkin.mask(g, shape), []);
  const drawJam = useCallback((g: Graphics) => machineSkin.jam(g, shape), []);
  const drawVent = useCallback((g: Graphics) => machineSkin.vent(g, shape), []);

  if (!present) return null;
  return (
    <pixiContainer x={machineGeometry.x} y={machineGeometry.y}>
      {/* Behind the body, and outside it, so puffs already out don't shake with a jam. */}
      {steams && <Steam spec={machineSteam} />}
      <pixiContainer ref={bodyRef}>
        <pixiGraphics draw={drawVent} />
        <pixiGraphics draw={drawOpening} />
        <pixiGraphics ref={maskRef} draw={drawMask} />
        <pixiContainer ref={doorRef}>
          <pixiGraphics draw={drawDoor} />
        </pixiContainer>
        <pixiGraphics draw={drawFrame} />
        <pixiGraphics ref={latchMaskRef} draw={drawLatchMask} />
        <pixiContainer ref={latchRef}>
          <pixiGraphics draw={drawLatch} />
        </pixiContainer>
        <pixiGraphics draw={drawKeepers} />
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
