// The room guides around the room reducer (story 6.1; room/guide.ts). The guide never holds
// a move back: every action reaches the room as before. After it, a step that waits for a
// move moves on when he has made it, and "Dalje" (`room/guide-next`) moves on a step he
// only reads. Once a topic's last step is done, the topic is met for good (`guide-<topic>`
// in `save.progress.firstUse`, saved), so it never shows again. Going into another room
// starts the guide over; where he is in a topic is never saved.

import { produce } from 'immer';
import {
  type GuideMove,
  type GuideProgress,
  type GuideView,
  guideAdvance,
  guideMet,
  guideSpent,
  type RoomGuideState,
  roomGuideView,
} from '@/room/guide';
import type { GuideTopic } from '@/room/types';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import type { GameState, Reduce } from '@/store/types';

type Step = { state: GameState; events: DomainEvent[] };

function progressOf(state: GameState): GuideProgress {
  const { firstUse, roomsDone, tools } = state.save.progress;
  return { firstUse, roomsDone, tools };
}

/** The room guide's step that shows now, or null: only on the room screen. */
export function roomGuideOf(state: Pick<GameState, 'room' | 'save' | 'ui'>): GuideView | null {
  if (state.ui.screen !== 'room') return null;
  const { firstUse, roomsDone, tools } = state.save.progress;
  return roomGuideView(state.room, { firstUse, roomsDone, tools }, state.ui.roomGuide);
}

/** His action as a step's awaited move, or null for one no step waits for. */
function moveOf(action: Action): GuideMove | null {
  switch (action.type) {
    case 'dial/set':
    case 'dial/nudge':
      return 'dial';
    case 'pin/set':
      return 'pin-set';
    case 'pin/confirm':
      return 'pin-confirm';
    case 'tray/drop':
    case 'tray/take':
      return 'tray';
    case 'splitter/split':
      return 'split';
    case 'chain/run':
      return 'chain';
    case 'notebook/enter':
      return 'enter';
    case 'notebook/show-line':
      return 'show-line';
    default:
      return null;
  }
}

/** The guide where he is now, and the topic met by the action, if one is. */
function settled(state: GameState, guide: RoomGuideState | null, met: GuideTopic | null): Step {
  const spent = met ?? guideSpent(state.room, progressOf(state), guide);
  const roomGuide = spent ? null : guide;
  const meets = spent !== null && !state.save.progress.firstUse.includes(guideMet(spent));
  if (roomGuide === state.ui.roomGuide && !meets) return { state, events: [] };
  const next = produce(state, (draft) => {
    draft.ui.roomGuide = roomGuide;
    if (meets && spent) draft.save.progress.firstUse.push(guideMet(spent));
  });
  return { state: next, events: meets ? [{ type: 'SaveChanged' }] : [] };
}

/** "Dalje" on a step he only reads: the next step, or the topic is over and met. */
function guideNext(state: GameState): Step {
  const view = roomGuideOf(state);
  if (!view || view.waits !== null || !state.room) return { state, events: [] };
  const next = guideAdvance(view, state.room, state.save.progress.tools);
  return settled(state, next, next ? null : view.topic);
}

/** A move that makes the topic's explaining pointless: he went another way, or already did it. */
function endsTopic(topic: GuideTopic, move: GuideMove | null): boolean {
  if (topic === 'chain') return move === 'chain' || move === 'tray' || move === 'split';
  if (topic === 'gear') return move === 'chain';
  return false;
}

/**
 * After an action reached the room: in another room (or none) the guide starts over; in
 * the same room, a step waiting for the move he made, which did something, moves on.
 */
function afterAction(before: GameState, action: Action, result: Step): Step {
  const after = result.state;
  const same =
    before.room !== null && after.room !== null && before.room.spec.id === after.room.spec.id;
  let guide = same ? after.ui.roomGuide : null;
  let met: GuideTopic | null = null;
  const view = roomGuideOf(before);
  const move = moveOf(action);
  // A gear that slid back changed the room only to say why: no move made.
  const did = after.room !== before.room && after.room?.stage.refusal !== 'gear';
  const moved = view?.waits != null && view.waits === move && did;
  if (view && same && moved && after.room) {
    const next = guideAdvance(view, after.room, after.save.progress.tools);
    guide = next;
    if (!next) met = view.topic;
  } else if (view && same && did && endsTopic(view.topic, move)) {
    guide = null;
    met = view.topic;
  }
  const step = settled(after, guide, met);
  if (step.state === after) return result;
  const saved = result.events.some((event) => event.type === 'SaveChanged');
  return { state: step.state, events: saved ? result.events : [...result.events, ...step.events] };
}

/** The room reducer, with the room guides around it. */
export function withRoomGuide(inner: Reduce): Reduce {
  return (state, action, ctx) => {
    if (action.type === 'room/guide-next') return guideNext(state);
    return afterAction(state, action, inner(state, action, ctx));
  };
}
