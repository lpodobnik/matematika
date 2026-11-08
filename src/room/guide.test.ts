import { describe, expect, it } from 'vitest';
import { r01 } from '@/content/rooms/r01-door-lift';
import { r04 } from '@/content/rooms/r04-water-wheel';
import { hr } from '@/content/text/hr';
import { setDial } from '@/room/dial';
import {
  guideAdvance,
  guideApplies,
  guideKey,
  guideMet,
  guideOfKey,
  guideOrder,
  guideSteps,
  guideTargetPlace,
  guideTopicNow,
  roomGuideView,
} from '@/room/guide';
import { touchMachine } from '@/room/phases';
import { enterRoom } from '@/room/room';
import { type GuideTopic, guideTopicIds, type RoomState } from '@/room/types';

const none = { firstUse: [], roomsDone: [], tools: [] } as const;

function touched(room: RoomState): RoomState {
  const step = touchMachine(room);
  if (!step) throw new Error('not in arrive');
  return step.room;
}

describe('the room guides’ topics (story 6.1)', () => {
  it('orders every topic once', () => {
    expect([...guideOrder].sort()).toEqual([...guideTopicIds].sort());
  });

  it('has a line in hr.ts for every step, and none left over', () => {
    const ids = new Set(guideTopicIds.flatMap((topic) => guideSteps(topic).map((s) => s.id)));
    expect([...ids].sort()).toEqual(Object.keys(hr.roomGuide.steps).sort());
  });

  it('rings something on every step, and every topic has a step that is never skipped', () => {
    for (const topic of guideTopicIds) {
      const steps = guideSteps(topic);
      for (const step of steps)
        expect(step.targets.length, `${topic}:${step.id}`).toBeGreaterThan(0);
      // check's two steps are each other's alternatives: one of them always shows. gear's
      // are all about balloons: with none on the pans it has nothing to say, and is spent.
      if (topic !== 'check' && topic !== 'gear')
        expect(
          steps.some((step) => !step.skip),
          topic,
        ).toBe(true);
    }
  });

  it('marks a topic met as guide-<topic>', () => {
    expect(guideMet('dial')).toBe('guide-dial');
  });

  it('knows which targets are in the notebook', () => {
    expect(guideTargetPlace('dial')).toBe('scene');
    expect(guideTargetPlace('hint')).toBe('scene');
    expect(guideTargetPlace('pad')).toBe('notebook');
    expect(guideTargetPlace('drum')).toBe('notebook');
  });
});

describe('which guide shows', () => {
  it('room 1 opens on the slider, from arrival', () => {
    const room = enterRoom(r01).room;
    expect(guideTopicNow(room, none)).toBe('dial');
    const view = roomGuideView(room, none, null);
    expect(view).toMatchObject({ topic: 'dial', step: 0, id: 'dial', waits: 'dial', last: false });
    expect(guideKey(view)).toBe('dial:0');
    expect(guideOfKey('dial:0')?.step.id).toBe('dial');
    expect(guideOfKey('nope:3')).toBeNull();
    expect(guideOfKey(null)).toBeNull();
  });

  it('skips the readouts’ step where the readouts are hidden (as in room 6)', () => {
    const [stage] = r01.stages;
    if (!stage) throw new Error('room 1 has a stage');
    const hidden = { ...r01, stages: [{ ...stage, readouts: false }] };
    const room = touched(enterRoom(hidden).room);
    const view = roomGuideView(room, none, { topic: 'dial', step: 1 });
    expect(view?.id).toBe('dial-x');
    const next = view ? guideAdvance(view, room, []) : null;
    expect(next).toEqual({ topic: 'dial', step: 3 });
  });

  it('a met topic, or one whose room is finished, does not show', () => {
    const room = enterRoom(r01).room;
    expect(guideTopicNow(room, { ...none, firstUse: ['guide-dial'] })).toBeNull();
    expect(guideTopicNow(room, { ...none, roomsDone: ['r01'] })).toBeNull();
  });

  it('the notebook’s guide comes when the pans level, not before', () => {
    let room = touched(enterRoom(r01).room);
    const met = { ...none, firstUse: ['guide-dial' as const] };
    expect(guideTopicNow(room, met)).toBeNull();
    for (const x of [1, 2, 3, 4, 5]) room = setDial(room, x)?.room ?? room;
    expect(guideTopicNow(room, met)).toBe('notebook');
  });

  it('no guide shows while the machine is jammed, nor once the stage locks', () => {
    const room = touched(enterRoom(r01).room);
    const jammed = { ...room, stage: { ...room.stage, jam: { kind: 'line' as const } } };
    expect(guideApplies('dial', jammed, [])).toBe(false);
    const locked = { ...room, stage: { ...room.stage, phase: 'locked' as const } };
    expect(guideApplies('dial', locked, [])).toBe(false);
  });

  it('Balance’s tray shows in room 4 only once he has Balance and the stage is open', () => {
    const arrived = enterRoom(r04).room;
    const met = (tools: ('balance' | 'chain')[]) => ({
      firstUse: guideTopicIds.filter((t: GuideTopic) => t !== 'tray').map(guideMet),
      roomsDone: [],
      tools,
    });
    expect(guideTopicNow(arrived, met(['balance']))).toBeNull();
    expect(guideTopicNow(touched(arrived), met([]))).toBeNull();
    expect(guideTopicNow(touched(arrived), met(['balance']))).toBe('tray');
  });
});
