import { describe, expect, it } from 'vitest';
import { loopLevels, sameLevels } from '@/audio/ambience';
import { loops, noteAt, type Voice } from '@/audio/loops';
import {
  BPM,
  barSeconds,
  frequency,
  nextBarAt,
  STEPS,
  stepSeconds,
  stepsBetween,
} from '@/audio/music';
import { roomIds } from '@/room/types';

describe('the shared clock and key (story 6.2)', () => {
  it('runs every loop at 96 BPM, 16 sixteenth steps to a 2.5 s bar', () => {
    expect(BPM).toBe(96);
    expect(STEPS).toBe(16);
    expect(stepSeconds).toBeCloseTo(0.15625, 6);
    expect(barSeconds).toBeCloseTo(2.5, 6);
  });

  it('puts every degree in D major pentatonic, octaves apart every five degrees', () => {
    expect(frequency(0)).toBeCloseTo(146.83, 2);
    expect(frequency(5)).toBeCloseTo(frequency(0) * 2, 6);
    expect(frequency(-5)).toBeCloseTo(frequency(0) / 2, 6);
    // D E F# A B, as semitones above D.
    const semitones = [0, 1, 2, 3, 4].map((d) =>
      Math.round(12 * Math.log2(frequency(d) / frequency(0))),
    );
    expect(semitones).toEqual([0, 2, 4, 7, 9]);
    expect(Math.round(12 * Math.log2(frequency(-2) / frequency(0)))).toBe(-5); // A2
  });

  it('finds the next bar line on the grid', () => {
    expect(nextBarAt(10, 5)).toBe(10);
    expect(nextBarAt(10, 10)).toBe(10);
    expect(nextBarAt(10, 10.01)).toBeCloseTo(12.5, 9);
    expect(nextBarAt(10, 12.5)).toBeCloseTo(12.5, 9);
    expect(nextBarAt(10, 17.6)).toBeCloseTo(20, 9);
  });

  it('lists the steps of a lookahead window once each, back to back', () => {
    const origin = 1;
    const first = stepsBetween(origin, 0, 1.3);
    expect(first.map((s) => s.index)).toEqual([0, 1]);
    expect(first[1]?.time).toBeCloseTo(1 + stepSeconds, 9);
    // Windows that meet neither drop nor repeat a step.
    const seen: number[] = [];
    for (let from = 0; from < 6; from += 0.1) {
      seen.push(...stepsBetween(origin, from, from + 0.1).map((s) => s.index));
    }
    expect(seen).toEqual([...Array(seen.length).keys()]);
    expect(seen.length).toBeGreaterThanOrEqual(Math.floor((6 - origin) / stepSeconds));
  });
});

describe('the machine loops (story 6.2)', () => {
  it('gives every room a loop of 16-step voices', () => {
    expect(Object.keys(loops).sort()).toEqual([...roomIds].sort());
    for (const id of roomIds) {
      const { voices } = loops[id];
      expect(voices.length, id).toBeGreaterThan(0);
      for (const v of voices) {
        expect(v.steps, id).toMatch(/^[x.]{16}$/);
        expect(v.steps, id).toContain('x');
        expect(v.notes.length, id).toBeGreaterThan(0);
        expect(v.notes.every(Number.isInteger), id).toBe(true);
        expect(v.gain, id).toBeGreaterThan(0);
        expect(v.gain, id).toBeLessThanOrEqual(1);
        if (v.kind === 'hum' || v.kind === 'whirr') expect(v.length, id).toBeGreaterThan(0);
      }
    }
  });

  it('makes each loop its own: no two rooms share a rhythm and sound', () => {
    const prints = roomIds.map((id) =>
      loops[id].voices.map((v) => `${v.kind}:${v.steps}:${v.notes.join(',')}`).join('|'),
    );
    expect(new Set(prints).size).toBe(roomIds.length);
  });

  it('keeps the full city sparse: never more than 12 struck hits on one step of the bar', () => {
    for (let step = 0; step < STEPS; step += 1) {
      const hits = roomIds
        .flatMap((id) => loops[id].voices)
        .filter((v) => v.kind !== 'hum' && v.steps[step] === 'x');
      expect(hits.length, `step ${step}`).toBeLessThanOrEqual(12);
    }
  });

  it('plays a voice’s notes in turn, carrying on across bars', () => {
    const v: Voice = { kind: 'wood', steps: 'x.......x.......', notes: [0, 2, 4], gain: 1 };
    expect(noteAt(v, 0)).toBe(0);
    expect(noteAt(v, 1)).toBeNull();
    expect(noteAt(v, 8)).toBe(2);
    expect(noteAt(v, 16)).toBe(4);
    expect(noteAt(v, 24)).toBe(0);
  });
});

describe('which loops play (story 6.2)', () => {
  it('plays nothing in a room, a fight or a card', () => {
    expect(loopLevels({ done: ['r01', 'r02'], area: null, focus: null })).toEqual({});
  });

  it('plays the street’s restored machines loud and the rest of the district quietly', () => {
    const levels = loopLevels({ done: ['r01', 'r02', 'r03'], area: 'square', focus: null });
    expect(levels.r01).toBe(1);
    expect(levels.r02).toBe(1);
    expect(levels.r03).toBeGreaterThan(0);
    expect(levels.r03).toBeLessThan(0.5);
    expect(levels.r04).toBeUndefined();
  });

  it('brings a restarting room forward alone, and room 13 brings every machine in', () => {
    expect(loopLevels({ done: ['r01'], area: null, focus: 'r04' })).toEqual({ r04: 1 });
    const climax = loopLevels({ done: [...roomIds], area: null, focus: 'r13' });
    expect(roomIds.every((id) => climax[id] === 1)).toBe(true);
  });

  it('compares levels room by room', () => {
    expect(sameLevels({}, { r01: 0 })).toBe(true);
    expect(sameLevels({ r01: 1 }, { r01: 1 })).toBe(true);
    expect(sameLevels({ r01: 1 }, { r01: 0.22 })).toBe(false);
  });
});
