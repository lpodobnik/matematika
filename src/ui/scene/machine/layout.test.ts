import { describe, expect, it } from 'vitest';
import { lampRayReach, pulleyRadius, ventOutlet } from '@/art/skins/machine';
import { tuning } from '@/config/tuning';
import { plumeBounds } from '@/ui/scene/effects/steam-sim';
import { sceneSize } from '@/ui/scene/fit-scene';
import {
  doorLift,
  joltOffset,
  lampDelayMs,
  lampGlow,
  lampLightMs,
  lampPositions,
  machineBounds,
  machineGeometry,
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

  it('stays clear of the housing and of the lamps, with up to three lamps', () => {
    expect(plume.right).toBeLessThanOrEqual(-shape.post * 1.5);
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
