// Story 10.8: the whole chapter, played through the store from the real path: from the end of part
// 1, through the gate, every lead and knot in order, to the ending. Each move is one he could make
// with a real tap, and a reload goes in the middle of every lead.

import { describe, expect, it } from 'vitest';
import { leadSpecs, playedSpec } from '@/content/leads';
import type { AloneSpec } from '@/hunt/alone';
import { lineValueOfClue } from '@/hunt/knock';
import type { LeadAction, LeadPlay } from '@/hunt/lead';
import { type ObjectGoal, type ObjectMove, type ObjectState, pairsOf } from '@/hunt/objects';
import {
  type CartsSpec,
  type LevelSpec,
  type LocksSpec,
  type LoopSpec,
  stripNumbers,
  sumResult,
  type WindowsSpec,
  withBrackets,
} from '@/hunt/one-offs';
import type { GuardSpec } from '@/hunt/rule-guard';
import type { SceneSpec } from '@/hunt/scene';
import { lineStartOf, routeTo, type SneakSpec, standing, targetStop } from '@/hunt/sneak';
import type { LineTask } from '@/hunt/spec';
import { actOf, openTrail, type TrailId, threadTarget } from '@/hunt/trail';
import type { UnmaskSpec } from '@/hunt/unmask';
import { readLine, readTokens, type SToken } from '@/math/statement-tokens';
import { newSave } from '@/store/persist';
import { createGameStore } from '@/store/store';
import type { SaveState } from '@/store/types';

type Store = ReturnType<typeof createGameStore>;

const allRooms = [
  'r01',
  'r02',
  'r03',
  'r04',
  'r05',
  'r06',
  'r07',
  'r08',
  'r09',
  'r10',
  'r11',
  'r12',
  'r13',
] as SaveState['progress']['roomsDone'];

function endOfPartOne(): Store {
  const store = createGameStore();
  const save = newSave('2026-11-08T10:00:00.000Z');
  save.character = { name: 'Ana', look: 'look-1' };
  save.progress.roomsDone = allRooms;
  save.progress.told = allRooms;
  save.progress.onMap = true;
  save.progress.introSeen = true;
  save.economy.lairs['lair-60'] = { rewindsAt: '2000-01-01T00:00:00.000Z' } as never;
  store.getState().dispatch({ type: 'dev/preview' });
  store.getState().dispatch({ type: 'boot/start', save, room: null });
  return store;
}

const act = (store: Store, action: LeadAction) =>
  store.getState().dispatch({ type: 'hunt/lead', action });

const playOf = (store: Store) => store.getState().save.hunt.scene?.state as LeadPlay;

/** What he types on a line that's already started, to get the line that's accepted. */
function fillFor(start: string, accepted: string): SToken[] {
  const begun = readLine(start) ?? [];
  const whole = readTokens(accepted);
  if (!whole) throw new Error(`can't read "${accepted}"`);
  const blank = begun.indexOf('☐');
  if (blank < 0) return whole.slice(begun.length);
  return whole.slice(blank, whole.length - (begun.length - blank - 1));
}

function writeLine(store: Store, task: Pick<LineTask, 'start' | 'accepts'>) {
  for (const token of fillFor(task.start, task.accepts[0] as string)) {
    act(store, { kind: 'type', token });
  }
  act(store, { kind: 'enter' });
}

/** Moves that take an object to its goal. */
function movesTo(object: ObjectState, goal: ObjectGoal): ObjectMove[] {
  const moves: ObjectMove[] = [];
  if (goal.kind === 'pairs-count' && object.kind === 'pairs') {
    const by = goal.count - object.count;
    for (let i = 0; i < Math.abs(by); i++) {
      moves.push({ kind: by > 0 ? 'pairs-add' : 'pairs-remove' });
    }
  } else if (goal.kind === 'line-mark') {
    moves.push({ kind: 'line-mark', at: goal.at });
  } else if (goal.kind === 'places-counts' && object.kind === 'places') {
    for (const [place, count] of goal.counts.entries()) {
      const by = count - (object.counts[place] ?? 0);
      for (let i = 0; i < Math.abs(by); i++) {
        moves.push({ kind: by > 0 ? 'places-add' : 'places-remove', place });
      }
    }
  } else if (goal.kind === 'grid-size' && object.kind === 'grid') {
    for (let i = object.rows; i !== goal.rows; i += i < goal.rows ? 1 : -1) {
      moves.push({ kind: 'grid-rows', by: i < goal.rows ? 1 : -1 });
    }
    for (let i = object.columns; i !== goal.columns; i += i < goal.columns ? 1 : -1) {
      moves.push({ kind: 'grid-columns', by: i < goal.columns ? 1 : -1 });
    }
  } else if (goal.kind === 'packing-per' && object.kind === 'packing') {
    for (let i = object.per; i !== goal.per; i += i < goal.per ? 1 : -1) {
      moves.push({ kind: 'packing-per', by: i < goal.per ? 1 : -1 });
    }
  } else if (goal.kind === 'stacks-level' && object.kind === 'stacks') {
    const stacks = [...object.stacks];
    const level = stacks.reduce((a, b) => a + b, 0) / stacks.length;
    for (let from = 0; from < stacks.length; from++) {
      while ((stacks[from] as number) > level) {
        const to = stacks.findIndex((count) => count < level);
        moves.push({ kind: 'stacks-tap', stack: from }, { kind: 'stacks-tap', stack: to });
        stacks[from] = (stacks[from] as number) - 1;
        stacks[to] = (stacks[to] as number) + 1;
      }
    }
  }
  return moves;
}

function playKnock(store: Store, spec: Extract<SceneSpec, { kind: 'knock' }>) {
  const side = spec.clues.find((clue) => clue.kind === 'side');
  if (side?.kind === 'side' && playOf(store).knock?.side !== side.side)
    act(store, { kind: 'cross' });
  for (const clue of spec.clues) {
    if (clue.kind === 'side' || clue.id === spec.forged) continue;
    act(store, { kind: 'pick-clue', clue: clue.id });
    for (const token of lineValueOfClue(clue)) act(store, { kind: 'type', token });
    act(store, { kind: 'enter' });
  }
  act(store, { kind: 'door', door: spec.door });
}

function playSneak(store: Store, spec: SneakSpec) {
  for (const board of spec.boards) {
    const here = () => playOf(store).sneak as NonNullable<LeadPlay['sneak']>;
    if (board.line) {
      const ask = board.line.asks[0];
      if (!ask) throw new Error('no ask');
      expect(lineStartOf(board, here()).length).toBeGreaterThan(0);
      const value = board.line.first + ask.at * board.line.step;
      for (const digit of String(value)) act(store, { kind: 'type', token: digit as SToken });
      act(store, { kind: 'enter' });
    }
    const target = targetStop(board, here()) as number;
    const route = routeTo(board, { at: standing(board, here()), tick: here().tick }, target);
    expect(route, 'a board with no way').not.toBeNull();
    for (const by of route ?? []) act(store, { kind: 'step', by });
    expect(here().boardDone).toBe(true);
    act(store, { kind: 'dismiss' });
  }
}

function playUnmask(store: Store, spec: UnmaskSpec) {
  for (const card of spec.cards.slice(0, spec.required)) act(store, { kind: 'ask', card: card.id });
  act(store, { kind: 'accuse', suspect: spec.guilty });
  writeLine(store, spec.fix);
}

function playScene(store: Store, spec: SceneSpec) {
  switch (spec.kind) {
    case 'knock':
      return playKnock(store, spec);
    case 'sneak':
      return playSneak(store, spec);
    case 'unmask':
      return playUnmask(store, spec);
    case 'alone':
      for (const junction of (spec as AloneSpec).junctions) {
        act(store, { kind: 'pipe', pipe: junction.right });
      }
      return;
    case 'guard': {
      const tile = (spec as GuardSpec).tiles.find((candidate) => candidate.breaks);
      act(store, { kind: 'tile', tile: tile?.id ?? '' });
      writeLine(store, spec.write);
      return;
    }
    case 'carts':
      for (const round of (spec as CartsSpec).rounds) {
        if (round.kind === 'share') {
          const bundles = round.crates / (round.carts * round.bundle);
          for (let cart = 0; cart < round.carts; cart++) {
            for (let i = 0; i < bundles; i++) act(store, { kind: 'cart', cart });
          }
        } else if (round.kind === 'loads') {
          const each = round.per / round.bundle;
          const carts = round.crates / round.per;
          for (let cart = 0; cart < carts; cart++) {
            for (let i = 0; i < each; i++) act(store, { kind: 'cart', cart });
          }
        }
        act(store, { kind: 'go' });
        if (round.kind === 'no-carts') act(store, { kind: 'dismiss' });
        else writeLine(store, round.line);
      }
      return;
    case 'level':
      for (const round of (spec as LevelSpec).rounds) {
        const stacks = [...round.stacks];
        const level = stacks.reduce((a, b) => a + b, 0) / stacks.length;
        for (let from = 0; from < stacks.length; from++) {
          while ((stacks[from] as number) > level) {
            const to = stacks.findIndex((count) => count < level);
            act(store, { kind: 'stack', stack: from });
            act(store, { kind: 'stack', stack: to });
            stacks[from] = (stacks[from] as number) - 1;
            stacks[to] = (stacks[to] as number) + 1;
          }
        }
        act(store, { kind: 'dismiss' });
        writeLine(store, round.line);
      }
      return;
    case 'locks':
      for (const lock of (spec as LocksSpec).locks) {
        const count = stripNumbers(lock.strip).length;
        let done = false;
        for (let from = 0; from < count && !done; from++) {
          for (let to = from + 1; to < count && !done; to++) {
            if (sumResult(withBrackets(lock.strip, from, to)) === String(lock.target)) {
              act(store, { kind: 'number', number: from });
              act(store, { kind: 'number', number: to });
              done = true;
            }
          }
        }
        expect(done).toBe(true);
      }
      return;
    case 'windows':
      for (const round of (spec as WindowsSpec).rounds) {
        act(store, { kind: 'window', number: round.target });
        act(store, { kind: 'dismiss' });
      }
      return;
    case 'loop':
      for (const board of (spec as LoopSpec).boards) {
        const steps = board.bells[0] as number;
        const quotient = Math.floor(steps / board.lamps);
        const rest = steps % board.lamps;
        for (const digit of String(quotient)) act(store, { kind: 'type', token: digit as SToken });
        act(store, { kind: 'type', token: 'ost.' });
        for (const digit of String(rest)) act(store, { kind: 'type', token: digit as SToken });
        act(store, { kind: 'enter' });
        act(store, { kind: 'dismiss' });
      }
      return;
  }
}

/** A reload: what's saved comes back through the save, as it does on his tablet. */
function reload(store: Store): Store {
  const { save } = store.getState();
  const again = createGameStore();
  again.getState().dispatch({ type: 'dev/preview' });
  again
    .getState()
    .dispatch({ type: 'boot/start', save: JSON.parse(JSON.stringify(save)), room: null });
  return again;
}

/** Plays a lead from wherever it's picked to its end, with a reload in its scenes. */
function playLead(first: Store, id: TrailId): Store {
  let store = first;
  const sealed = store.getState().save.hunt.sealed;
  const spec = playedSpec(id, sealed);
  if (!spec) throw new Error(`no ${id}`);
  store.getState().dispatch({ type: 'hunt/lead-start', lead: id });
  expect(store.getState().ui.screen, `${id} didn't start`).toBe('hunt');
  for (let i = 0; i < spec.lesson.steps.length; i++) act(store, { kind: 'next' });
  for (const task of spec.tries) {
    expect(playOf(store).step, `${id}: not trying`).toBe('try');
    if (task.kind === 'object') {
      for (const move of movesTo(task.object, task.goal)) act(store, { kind: 'move', move });
    } else {
      writeLine(store, task);
    }
    expect(playOf(store).solved, `${id}: try "${task.say}" isn't solved`).toBe(true);
    act(store, { kind: 'next' });
  }
  const { mistake } = spec;
  if (mistake) {
    expect(playOf(store).step, `${id}: not fixing`).toBe('fix');
    act(store, { kind: 'fix-tap', line: mistake.wrong });
    for (const move of movesTo(mistake.show.object, mistake.show.goal)) {
      act(store, { kind: 'move', move });
    }
    expect(playOf(store).fix, `${id}: the object didn't reach its goal`).toBe('write');
    writeLine(store, mistake.write);
    expect(playOf(store).fix, `${id}: the fix line wasn't taken`).toBe('thanks');
    act(store, { kind: 'next' });
  }
  for (const [i, scene] of spec.scenes.entries()) {
    expect(playOf(store).step, `${id}: scene ${i} isn't in play`).toBe('play');
    store = reload(store);
    // The first time's guide: he reads its opening words.
    const state = playOf(store)[scene.kind];
    if (state?.guide === 'intro') act(store, { kind: 'next' });
    playScene(store, scene);
    expect(playOf(store)[scene.kind]?.opened, `${id}: scene ${i} (${scene.kind}) didn't open`).toBe(
      true,
    );
    act(store, { kind: 'next' });
  }
  for (const task of spec.writeUp) {
    expect(playOf(store).step, `${id}: not writing`).toBe('write');
    writeLine(store, task);
  }
  expect(playOf(store).step, `${id}: no thread`).toBe('thread');
  act(store, { kind: 'next' });
  act(store, { kind: 'next' });
  expect(store.getState().save.hunt.scene, `${id} didn't end`).toBeNull();
  expect(store.getState().ui.screen).toBe('map');
  return store;
}

describe('the whole chapter', () => {
  it('can be played from the end of part 1 to the warm lamp, and pays out once', () => {
    let store = endOfPartOne();
    const { dispatch } = store.getState();

    // The gate, the foundry, the name, the map.
    dispatch({ type: 'hunt/gate-open' });
    for (const token of ['x', '=', '8'] as const) dispatch({ type: 'hunt/type', token });
    dispatch({ type: 'hunt/enter' });
    for (const token of ['5', '·', '8', '=', '4', '0'] as const) {
      dispatch({ type: 'hunt/type', token });
    }
    dispatch({ type: 'hunt/enter' });
    dispatch({ type: 'hunt/foundry-done' });
    dispatch({ type: 'hunt/name', name: 'Bip' });
    expect(openTrail(store.getState().save.hunt)).toEqual([]);
    dispatch({ type: 'hunt/map-given' });

    const order: TrailId[] = [];
    for (let guard = 0; guard < 40; guard++) {
      const open = openTrail(store.getState().save.hunt);
      const next = open[0];
      if (!next) break;
      // Everything open has been written.
      for (const id of open) expect(leadSpecs[id], `${id} isn't written`).toBeDefined();
      order.push(next);
      store = playLead(store, next);
    }

    const { hunt, companion, economy } = store.getState().save;
    expect(order).toHaveLength(20);
    expect(order.indexOf('k1')).toBeLessThan(order.indexOf('w1'));
    expect(order.indexOf('w1')).toBeLessThan(order.indexOf('l05'));
    expect(order.indexOf('l11')).toBeLessThan(order.indexOf('k3'));
    expect(order.indexOf('k3')).toBeLessThan(order.indexOf('l12'));
    expect(order.indexOf('l12')).toBeLessThan(order.indexOf('l13'));
    expect(order[order.length - 1]).toBe('l16');

    expect(hunt.leadsDone).toHaveLength(16);
    expect(hunt.knotsDone).toEqual(['k1', 'w1', 'k2', 'k3']);
    expect(hunt.guards).toEqual(['rule-1', 'rule-2', 'rule-3', 'rule-4']);
    expect(companion?.gear).toEqual(['hook']);
    for (const beat of [
      'hook-given',
      'wandered',
      'found',
      'warned',
      'coat',
      'real-vucetic',
      'near-miss',
    ]) {
      expect(hunt.beats, beat).toContain(beat);
    }
    // Every mistake learnt once.
    const taught = companion?.taught.map((entry) => entry.mistake) ?? [];
    expect(new Set(taught).size).toBe(taught.length);
    expect(taught).toHaveLength(16);

    // Reached by the black thread twice, and it stopped after the coat.
    expect(hunt.sealed).toHaveLength(2);
    expect(threadTarget(hunt)).toBeNull();

    // Paid: each door once, each guard once.
    expect(economy.parts).toBeGreaterThan(40);
    expect(new Set(hunt.paid).size).toBe(hunt.paid.length);
  });

  it('each act holds what the order needs', () => {
    for (const id of ['l01', 'l05', 'l09', 'l13'] as const)
      expect(actOf(id)).toBeGreaterThanOrEqual(0);
  });

  it('nothing moves on from a pairs object that’s wrong', () => {
    expect(pairsOf(7)).toEqual({ pairs: 3, left: 1 });
  });
});
