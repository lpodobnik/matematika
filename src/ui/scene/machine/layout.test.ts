import { describe, expect, it } from 'vitest';
import {
  doorBattens,
  lampRayReach,
  latchBar,
  latchBox,
  pulleyRadius,
  ventOutlet,
} from '@/art/skins/machine';
import { tuning } from '@/config/tuning';
import { plumeBounds } from '@/ui/scene/effects/steam-sim';
import { sceneSize } from '@/ui/scene/fit-scene';
import {
  doorLift,
  doorTravel,
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
  machineBounds,
  machineGeometry,
  machineLatch,
  machineSteam,
  presentationMs,
  pulleyPositions,
  runningHum,
} from '@/ui/scene/machine/layout';
import { beamPose, scaleGeometry } from '@/ui/scene/scale/layout';

describe('the lamps, one per part of the machine', () => {
  const { shape } = machineGeometry;

  it('stand evenly along the top of the housing, first on the left', () => {
    for (const count of [1, 2, 3]) {
      const lamps = lampPositions(count);
      expect(lamps).toHaveLength(count);
      const xs = lamps.map((lamp) => lamp.x);
      expect([...xs].sort((a, b) => a - b)).toEqual(xs);
      const gaps = xs.slice(1).map((x, i) => x - (xs[i] ?? 0));
      for (const gap of gaps) expect(gap).toBeCloseTo(gaps[0] ?? 0);
      for (const lamp of lamps) {
        expect(lamp.x).toBeGreaterThan(-shape.post * 1.5);
        expect(lamp.x).toBeLessThan(shape.width + shape.post * 1.5);
        expect(lamp.y + shape.lamp).toBeLessThanOrEqual(-shape.housing);
      }
    }
    expect(lampPositions(1)[0]?.x).toBeCloseTo(shape.width / 2);
  });

  it("don't touch each other even with three, rays and all", () => {
    const [a, b] = lampPositions(3);
    expect((b?.x ?? 0) - (a?.x ?? 0)).toBeGreaterThan(lampRayReach(shape) * 2);
  });

  it('fit inside the scene with their rays', () => {
    expect(machineBounds().top).toBeGreaterThan(0);
    const [lamp] = lampPositions(1);
    expect(machineGeometry.y + (lamp?.y ?? 0) - lampRayReach(shape)).toBeGreaterThanOrEqual(
      machineBounds().top,
    );
  });
});

describe('the pulleys', () => {
  it('sit on the housing, inside it', () => {
    const { shape } = machineGeometry;
    for (const pulley of pulleyPositions()) {
      expect(pulley.y - pulleyRadius(shape)).toBeGreaterThan(-shape.housing);
      expect(pulley.y + pulleyRadius(shape)).toBeLessThan(0);
    }
  });
});

describe('the presentations', () => {
  it('play inside the clock fallback, so the fallback never cuts one short', () => {
    for (const ms of Object.values(presentationMs)) {
      expect(ms).toBeGreaterThan(0);
      expect(ms).toBeLessThan(tuning.presentationTimeoutMs);
    }
  });

  it('light the lamp before the lock is reported done', () => {
    expect(lampDelayMs + lampLightMs).toBeLessThan(presentationMs.locked);
  });

  it('slide the latch out before the lamp lights, and rattle it before any lock', () => {
    expect(latchSlideMs).toBeLessThan(lampDelayMs);
    expect(latchRattleDelayMs + latchRattleMs).toBeLessThan(presentationMs.locked);
    // The latch returns at the next stage within the clock fallback too.
    expect(latchReturnDelayMs + latchSlideMs).toBeLessThan(tuning.presentationTimeoutMs);
  });

  it('bring a lamp on from nothing to full size and strength', () => {
    expect(lampGlow(0).alpha).toBe(0);
    expect(lampGlow(1)).toEqual({ alpha: 1, scale: 1 });
    expect(Math.max(...[0.3, 0.5, 0.7].map((t) => lampGlow(t).scale))).toBeGreaterThan(1);
  });

  it('hum the machine while it restarts, from rest to rest', () => {
    expect(runningHum(0)).toBe(0);
    expect(runningHum(1)).toBeCloseTo(0);
    const beats = [0.1, 0.3, 0.5, 0.7].map(runningHum);
    expect(Math.max(...beats.map(Math.abs))).toBeGreaterThan(0.5);
    expect(Math.max(...beats.map(Math.abs))).toBeLessThanOrEqual(3);
  });
});

describe('the placeholder machine in the scene', () => {
  const box = machineBounds();

  it('fits inside the scene', () => {
    expect(box.left).toBeGreaterThan(0);
    expect(box.top).toBeGreaterThan(0);
    expect(box.right).toBeLessThan(sceneSize.width);
  });

  it('sits between the pans at any tilt, and above the needle and the tilt marks', () => {
    for (const tilt of [-tuning.tiltMax, 0, tuning.tiltMax]) {
      const pose = beamPose(tilt);
      expect(pose.left.x + scaleGeometry.panWidth / 2, `left pan at ${tilt}°`).toBeLessThan(
        box.left,
      );
      expect(pose.right.x - scaleGeometry.panWidth / 2, `right pan at ${tilt}°`).toBeGreaterThan(
        box.right,
      );
    }
    // The needle reaches 96 above the pivot and the stand's tilt marks 116.
    expect(box.bottom).toBeLessThan(scaleGeometry.pivot.y - 116);
  });
});

describe('the steam effect', () => {
  const { shape } = machineGeometry;
  const plume = plumeBounds(machineSteam);

  it('rises from the vent', () => {
    expect(machineSteam.origin).toEqual(ventOutlet(shape));
  });

  it('stays above the housing and clear of the lamps, with up to three lamps', () => {
    expect(plume.bottom).toBeLessThanOrEqual(-shape.housing);
    for (const count of [1, 2, 3]) {
      const [first] = lampPositions(count);
      expect(plume.right).toBeLessThan((first?.x ?? 0) - lampRayReach(shape));
    }
  });

  it('is part of the machine’s box, so it fits the scene and stays between the pans', () => {
    const box = machineBounds();
    expect(box.left).toBeLessThanOrEqual(machineGeometry.x + plume.left);
    expect(box.top).toBeLessThanOrEqual(machineGeometry.y + plume.top);
  });
});

describe('doorTravel (story 1.14)', () => {
  const share = tuning.doorLiftBeforeLock;

  it('lifts a latched door only progress × the share before the lock', () => {
    expect(share).toBe(0.3);
    expect(doorTravel(0, true)).toBe(0);
    expect(doorTravel(0.2, true)).toBeCloseTo(0.2 * share);
    expect(doorTravel(tuning.progressCap, true)).toBeCloseTo(tuning.progressCap * share);
    // The answer line's 0.9 is no longer a door nearly open.
    expect(doorTravel(tuning.progressAnswer, true)).toBeCloseTo(0.27);
  });

  it('never lifts a latched door past its share, at any progress', () => {
    for (const progress of [-0.5, 0, 0.4, 0.9, 1, 1.5]) {
      expect(doorTravel(progress, true)).toBeGreaterThanOrEqual(0);
      expect(doorTravel(progress, true)).toBeLessThanOrEqual(share);
    }
  });

  it('lets the door rise all the way once the latch is out', () => {
    expect(doorTravel(1, false)).toBe(1);
    expect(doorTravel(1.2, false)).toBe(1);
    expect(doorLift(doorTravel(1, false))).toBe(machineGeometry.shape.height);
  });

  it('takes another share when the tuning says so', () => {
    expect(doorTravel(0.5, true, 0.5)).toBeCloseTo(0.25);
  });
});

describe('the latch (story 1.14)', () => {
  const { shape } = machineGeometry;
  const bar = machineLatch;
  const battenLow = doorBattens[1] * shape.height;

  it('crosses the whole door, inside the opening, between the posts’ outer edges', () => {
    expect(bar.left).toBeLessThan(0);
    expect(bar.right).toBeGreaterThan(shape.width);
    expect(bar.left).toBeGreaterThan(-shape.post);
    expect(bar.right).toBeLessThan(shape.width + shape.post);
    expect(bar.top).toBeGreaterThan(0);
    expect(bar.bottom).toBeLessThan(shape.height);
  });

  it('holds the door: at its share, the door’s lower batten is up against the bar', () => {
    const highest = doorLift(doorTravel(1, true));
    expect(battenLow - highest).toBeCloseTo(bar.bottom);
    // At the answer line the batten sits just under the bar, still below it.
    const answered = doorLift(doorTravel(tuning.progressAnswer, true));
    expect(battenLow - answered).toBeGreaterThan(bar.bottom);
    expect(battenLow - answered - bar.bottom).toBeLessThan(shape.height * 0.05);
  });

  it('follows the share in the tuning', () => {
    expect(latchBar(shape, 0.2).bottom).toBeCloseTo((doorBattens[1] - 0.2) * shape.height);
  });

  it('slides out of the door’s way, into its box on the left post', () => {
    expect(latchSlide(0)).toBeCloseTo(0);
    expect(latchSlide(1)).toBeCloseTo(-bar.travel);
    const steps = [0, 0.25, 0.5, 0.75, 1].map((t) => latchSlide(t));
    expect([...steps].sort((a, b) => b - a)).toEqual(steps);
    const box = latchBox(shape, bar);
    const outRight = bar.right + latchSlide(1);
    expect(outRight).toBeLessThanOrEqual(0);
    expect(outRight).toBeGreaterThanOrEqual(box.x);
    expect(box.x + box.width).toBeGreaterThan(0);
  });

  it('stays inside the machine’s box, so the scene layout is unchanged', () => {
    const box = machineBounds();
    const keeper = latchBox(shape, bar);
    expect(machineGeometry.x + keeper.x).toBeGreaterThanOrEqual(box.left);
    expect(machineGeometry.y + keeper.y).toBeGreaterThan(box.top);
    expect(machineGeometry.x + bar.right).toBeLessThan(box.right);
  });

  it('rattles when the answer line arrives, and only then', () => {
    expect(latchRattles(tuning.progressCap, tuning.progressAnswer)).toBe(true);
    expect(latchRattles(0, tuning.progressAnswer)).toBe(true);
    // Not again for a later line at the same progress, nor for other lines.
    expect(latchRattles(tuning.progressAnswer, tuning.progressAnswer)).toBe(false);
    expect(latchRattles(0.4, 0.6)).toBe(false);
    // Not for the check line: that slides the latch out instead.
    expect(latchRattles(tuning.progressAnswer, 1)).toBe(false);
    expect(latchRattles(tuning.progressCap, 1)).toBe(false);
  });

  it('rattles a little, from rest to rest, without leaving its staple', () => {
    expect(latchRattle(0)).toBe(0);
    expect(latchRattle(1)).toBeCloseTo(0);
    const knocks = [0.06, 0.19, 0.31, 0.44].map(latchRattle);
    expect(Math.max(...knocks.map(Math.abs))).toBeGreaterThan(2);
    expect(new Set(knocks.map(Math.sign)).size).toBe(2);
    expect(Math.max(...knocks.map(Math.abs))).toBeLessThan(shape.post * 0.7);
  });
});

describe('doorLift', () => {
  it('raises the door from shut at 0 to fully open at 1, in proportion', () => {
    const { height } = machineGeometry.shape;
    expect(doorLift(0)).toBe(0);
    expect(doorLift(0.2)).toBeCloseTo(height * 0.2);
    expect(doorLift(0.9)).toBeCloseTo(height * 0.9);
    expect(doorLift(1)).toBe(height);
  });

  it('never sinks below the sill or rises past the housing', () => {
    expect(doorLift(-0.1)).toBe(0);
    expect(doorLift(1.2)).toBe(machineGeometry.shape.height);
  });
});

describe('joltOffset', () => {
  it('starts and ends where the machine stands, and shakes in between', () => {
    expect(joltOffset(0)).toBe(0);
    expect(joltOffset(1)).toBeCloseTo(0);
    const swings = [0.08, 0.25, 0.42].map(joltOffset);
    expect(Math.max(...swings.map(Math.abs))).toBeGreaterThan(5);
    expect(new Set(swings.map(Math.sign)).size).toBe(2);
  });
});
