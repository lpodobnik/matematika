// Story 6.1 through the real store: the first time a room needs a tool, Nikola's guide
// talks him through it, a step at a time. A step he reads moves on with "Dalje"; a step that
// asks for a move moves on when he makes it, and every move reaches the room as before.
// Once a topic's last step is done it is met (`guide-<topic>`), saved, and never shows again.

import { describe, expect, it } from 'vitest';
import { tokenFromChar } from '@/math/tokens';
import { guideMet, guideSteps } from '@/room/guide';
import type { FirstUseId, GuideTopic, RoomId, RoomState, ToolId } from '@/room/types';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { initialGameState } from '@/store/reducer';
import { roomGuideOf } from '@/store/room-guide';
import { createGameStore } from '@/store/store';

function playing(
  options: { tools?: ToolId[]; firstUse?: FirstUseId[]; roomsDone?: RoomId[] } = {},
) {
  const events: DomainEvent[] = [];
  const initial = initialGameState();
  const store = createGameStore({
    makeCtx: () => ({ now: 1000, rng: { next: () => 0.5 } }),
    effects: [(event) => events.push(event)],
    initialState: {
      ...initial,
      ui: { ...initial.ui, screen: 'map' },
      save: {
        ...initial.save,
        character: { name: 'Ivo', look: 'look-1' },
        progress: {
          roomsDone: options.roomsDone ?? [],
          started: [],
          onMap: true,
          told: options.roomsDone ?? [],
          ideasSeen: [],
          tornPages: [],
          introSeen: true,
          tools: options.tools ?? [],
          firstUse: options.firstUse ?? [],
        },
      },
    },
  });
  const act = (action: Action) => store.getState().dispatch(action);
  const write = (text: string) => {
    for (const char of text) {
      const token = tokenFromChar(char);
      if (token) act({ type: 'notebook/type', token });
    }
    act({ type: 'notebook/enter' });
  };
  const room = () => store.getState().room as RoomState;
  /** The step that shows: `topic:id`, or null. */
  const shows = () => {
    const view = roomGuideOf(store.getState());
    return view ? `${view.topic}:${view.id}` : null;
  };
  const next = () => act({ type: 'room/guide-next' });
  const met = () => store.getState().save.progress.firstUse;
  return { store, events, act, write, room, shows, next, met };
}

type Game = ReturnType<typeof playing>;

/** Every topic met but the ones named. */
function allMetBut(...topics: GuideTopic[]): FirstUseId[] {
  const every: GuideTopic[] = [
    'dial',
    'notebook',
    'check',
    'pin',
    'tilt',
    'tray',
    'splitter',
    'logbook',
    'chain',
    'gear',
    'story',
    'story-choice',
    'coarse',
    'range',
    'linked',
    'linked-fed',
    'drum',
  ];
  return every.filter((topic) => !topics.includes(topic)).map(guideMet);
}

/** Reads the talking steps of the topic that shows, while they are of it. */
function readThrough(g: Game, topic: GuideTopic) {
  for (let i = 0; i < 10 && g.shows()?.startsWith(`${topic}:`); i += 1) g.next();
}

const allTools: ToolId[] = ['balance', 'workshop', 'chain', 'drum'];

describe('room 1’s guide through the store (story 6.1)', () => {
  it('talks him through the slider, the pans, the hint button, the notebook and the check', () => {
    const g = playing();
    g.act({ type: 'room/enter', roomId: 'r01' });
    // The slider first: the step waits for a move, so "Dalje" does nothing.
    expect(g.shows()).toBe('dial:dial');
    g.next();
    expect(g.shows()).toBe('dial:dial');
    g.act({ type: 'machine/touch' });
    expect(g.shows()).toBe('dial:dial');
    g.act({ type: 'dial/set', x: 1 });
    expect(g.room().stage.dialX).toBe(1);
    expect(g.shows()).toBe('dial:dial-x');
    // A move during a step he reads still reaches the room, and the step stays.
    g.act({ type: 'dial/set', x: 2 });
    expect(g.room().stage.dialX).toBe(2);
    expect(g.shows()).toBe('dial:dial-x');
    g.next();
    expect(g.shows()).toBe('dial:readouts');
    g.next();
    expect(g.shows()).toBe('dial:level');
    g.next();
    expect(g.shows()).toBe('dial:hint');
    expect(g.met()).not.toContain('guide-dial');
    const before = g.events.length;
    g.next();
    expect(g.met()).toContain('guide-dial');
    expect(g.events.slice(before).map((event) => event.type)).toContain('SaveChanged');
    // Nothing more until the pans level: then the notebook.
    expect(g.shows()).toBeNull();
    for (const x of [3, 4, 5]) g.act({ type: 'dial/set', x });
    expect(g.shows()).toBe('notebook:notebook');
    g.next();
    // Room 1's lines are blanks, so the step about blanks shows, not the one about free lines.
    expect(g.shows()).toBe('notebook:blanks');
    g.next();
    expect(g.shows()).toBe('notebook:enter');
    g.next();
    expect(g.shows()).toBe('notebook:enter');
    g.write('5');
    expect(g.met()).toContain('guide-notebook');
    expect(g.shows()).toBe('check:check-blank');
    g.next();
    expect(g.met()).toContain('guide-check');
    expect(g.shows()).toBeNull();
    g.write('5');
    expect(g.room().stage.phase).toBe('locked');
  });

  it('shows once: back in room 1, or in room 2, the slider’s guide is gone', () => {
    const g = playing();
    g.act({ type: 'room/enter', roomId: 'r01' });
    g.act({ type: 'dial/set', x: 1 });
    readThrough(g, 'dial');
    expect(g.met()).toContain('guide-dial');
    g.act({ type: 'room/enter', roomId: 'r01' });
    expect(g.shows()).toBeNull();
    g.act({ type: 'room/enter', roomId: 'r02' });
    expect(g.shows()).toBeNull();
  });

  it('starts a topic over in the next room he goes into, if he left it halfway', () => {
    const g = playing();
    g.act({ type: 'room/enter', roomId: 'r01' });
    g.act({ type: 'dial/set', x: 1 });
    g.next();
    expect(g.shows()).toBe('dial:readouts');
    g.act({ type: 'room/enter', roomId: 'r02' });
    expect(g.store.getState().ui.roomGuide).toBeNull();
    expect(g.shows()).toBe('dial:dial');
  });

  it('counts a topic as met when its room is already finished (a save from before the guides)', () => {
    const g = playing({ roomsDone: ['r01'] });
    g.act({ type: 'room/enter', roomId: 'r02' });
    expect(g.shows()).toBeNull();
  });

  it('shows nothing off the room screen', () => {
    const g = playing();
    expect(roomGuideOf(g.store.getState())).toBeNull();
  });
});

describe('the prediction flag’s guide (room 3)', () => {
  it('says what the flag is, that the slider moves only a little, then waits for the flag and Potvrdi', () => {
    const g = playing({ firstUse: allMetBut('pin', 'tilt') });
    g.act({ type: 'room/enter', roomId: 'r03' });
    expect(g.shows()).toBeNull();
    g.act({ type: 'machine/touch' });
    expect(g.shows()).toBe('pin:pin');
    g.next();
    expect(g.shows()).toBe('pin:poke');
    g.next();
    expect(g.shows()).toBe('pin:pin-drag');
    g.act({ type: 'pin/set', value: { kind: 'x', x: 12 } });
    expect(g.shows()).toBe('pin:pin-confirm');
    g.act({ type: 'pin/confirm' });
    expect(g.met()).toContain('guide-pin');
  });

  it('skips the step that asks for the flag when the flag is already placed', () => {
    const g = playing({ firstUse: allMetBut('pin') });
    g.act({ type: 'room/enter', roomId: 'r03' });
    g.act({ type: 'machine/touch' });
    g.act({ type: 'pin/set', value: { kind: 'x', x: 12 } });
    expect(g.shows()).toBe('pin:pin');
    g.next();
    g.next();
    expect(g.shows()).toBe('pin:pin-confirm');
  });

  it('asks which way the scale tilts in the second stage', () => {
    const g = playing({ firstUse: allMetBut('tilt') });
    g.act({ type: 'room/enter', roomId: 'r03', stage: 1 });
    g.act({ type: 'machine/touch' });
    expect(g.shows()).toBe('tilt:tilt');
    g.next();
    expect(g.shows()).toBe('tilt:tilt-drag');
    g.act({ type: 'pin/set', value: { kind: 'choice', index: 1 } });
    expect(g.shows()).toBe('tilt:pin-confirm');
  });
});

describe('Balance’s guide (room 4)', () => {
  it('shows the tray, waits for a drop, then the splitter, and waits for a split', () => {
    const g = playing({ tools: ['balance'], firstUse: allMetBut('tray', 'splitter') });
    g.act({ type: 'room/enter', roomId: 'r04' });
    expect(g.shows()).toBeNull();
    g.act({ type: 'machine/touch' });
    expect(g.shows()).toBe('tray:tray');
    g.next();
    expect(g.shows()).toBe('tray:tray-kinds');
    g.next();
    expect(g.shows()).toBe('tray:tray-drop');
    // The steppers set the number; only a drop moves the step on.
    for (let i = 0; i < 4; i += 1) g.act({ type: 'tray/step', kind: 'float', by: 1 });
    expect(g.shows()).toBe('tray:tray-drop');
    g.act({ type: 'tray/drop', kind: 'float' });
    expect(g.shows()).toBe('tray:auto');
    g.next();
    expect(g.shows()).toBe('tray:goal');
    g.next();
    expect(g.met()).toContain('guide-tray');
    expect(g.shows()).toBe('splitter:splitter');
    g.next();
    expect(g.shows()).toBe('splitter:split');
    g.act({ type: 'splitter/split' });
    expect(g.met()).toContain('guide-splitter');
  });
});

describe('each room’s own guide comes first in its room', () => {
  it.each([
    ['r07', 0, 'logbook', 'logbook:logbook'],
    ['r10', 0, 'story', 'story:story'],
    ['r10', 1, 'story-choice', 'story-choice:story-choice'],
    ['r11', 0, 'coarse', 'coarse:coarse'],
    ['r12', 0, 'linked', 'linked:linked'],
    ['r12', 1, 'linked-fed', 'linked-fed:linked-fed'],
    ['r13', 0, 'drum', 'drum:drum'],
  ] as const)('%s stage %s: %s', (roomId, stage, topic, first) => {
    const g = playing({ tools: allTools, firstUse: allMetBut(topic) });
    g.act({ type: 'room/enter', roomId, stage });
    g.act({ type: 'machine/touch' });
    expect(g.shows()).toBe(first);
    readThrough(g, topic);
  });

  it('room 11: the range pin, then, once it is confirmed, the coarse slider', () => {
    const g = playing({ tools: allTools, firstUse: allMetBut('coarse', 'range') });
    g.act({ type: 'room/enter', roomId: 'r11' });
    g.act({ type: 'machine/touch' });
    expect(g.shows()).toBe('range:range');
    g.next();
    expect(g.shows()).toBe('range:range-flag');
    g.act({ type: 'pin/set', value: { kind: 'bucket', index: 1 } });
    g.act({ type: 'pin/confirm' });
    expect(g.met()).toContain('guide-range');
    expect(g.shows()).toBe('coarse:coarse');
    readThrough(g, 'coarse');
    expect(g.met()).toContain('guide-coarse');
  });

  it('room 8: the gear chain once the pin is confirmed, waiting for a run', () => {
    const g = playing({ tools: allTools, firstUse: allMetBut('chain') });
    g.act({ type: 'room/enter', roomId: 'r08' });
    g.act({ type: 'machine/touch' });
    expect(g.shows()).toBeNull();
    g.act({ type: 'pin/set', value: { kind: 'x', x: 8 } });
    g.act({ type: 'pin/confirm' });
    expect(g.room().stage.phase).toBe('open');
    expect(g.shows()).toBe('chain:chain');
    g.next();
    g.next();
    expect(g.shows()).toBe('chain:chain-run');
    g.act({ type: 'chain/run', op: 'sub', n: 9 });
    expect(g.met()).toContain('guide-chain');
  });

  it('room 9: the x-gear on the tray, once the stage opens', () => {
    // He met the tray in room 4, so room 9 offers it at once.
    const g = playing({ tools: allTools, firstUse: ['tray', ...allMetBut('gear')] });
    g.act({ type: 'room/enter', roomId: 'r09' });
    g.act({ type: 'machine/touch' });
    g.act({ type: 'pin/set', value: { kind: 'x', x: 7 } });
    g.act({ type: 'pin/confirm' });
    expect(g.shows()).toBe('gear:gear');
    readThrough(g, 'gear');
    expect(g.met()).toContain('guide-gear');
  });

  it('room 13: the drum, then trying the slider and the next-dot pin', () => {
    const g = playing({ tools: allTools, firstUse: allMetBut('drum') });
    g.act({ type: 'room/enter', roomId: 'r13' });
    g.act({ type: 'machine/touch' });
    g.next();
    g.next();
    expect(g.shows()).toBe('drum:drum-try');
    g.act({ type: 'dial/set', x: 1 });
    expect(g.shows()).toBe('drum:drum-pin');
  });

  it('room 7: the step that asks him to tap a line waits for the tap', () => {
    const g = playing({ tools: allTools, firstUse: allMetBut('logbook') });
    g.act({ type: 'room/enter', roomId: 'r07' });
    g.act({ type: 'machine/touch' });
    g.next();
    expect(g.shows()).toBe('logbook:logbook-tap');
    g.act({ type: 'notebook/show-line', line: 1 });
    expect(g.shows()).toBe('logbook:logbook-flag');
  });
});

describe('every topic', () => {
  it('ends with a step that shows in its room, so it can be met', () => {
    for (const topic of [
      'dial',
      'notebook',
      'check',
      'pin',
      'tilt',
      'tray',
      'splitter',
      'logbook',
      'chain',
      'gear',
      'story',
      'story-choice',
      'coarse',
      'range',
      'linked',
      'linked-fed',
      'drum',
    ] as const) {
      expect(guideSteps(topic).length, topic).toBeGreaterThan(0);
    }
  });
});
