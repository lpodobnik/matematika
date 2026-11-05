import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { sceneSize } from '@/ui/scene/fit-scene';
import { doorLift, joltOffset, machineBounds, machineGeometry } from '@/ui/scene/machine/layout';
import { beamPose, scaleGeometry } from '@/ui/scene/scale/layout';

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
