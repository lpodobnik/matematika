// Rooms for friends (epic 5; GDD, Room builder; architecture, Pattern 3). A layer over the
// rest of the game, like the counter's: building a room at the workshop, playing it to prove
// it, sending it, and the friend's side of a link, with the rooms played by the room engine
// through `room/enter-spec`. What is built stays in memory until it is sent; then the room
// goes on the workshop wall in the save, and its parts are paid (FR46). A friend's play is
// never saved: a friend's page never reads the save, so it never writes one.

import { castDraft, produce } from 'immer';
import { spendParts } from '@/economy/parts';
import { decodeRoom, encodeRoom, roomIdOf } from '@/links/room-link';
import type { RoomSpec, RoomState } from '@/room/types';
import { maxSentRooms } from '@/save/schema';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { newSave } from '@/store/persist';
import type { FriendFlow, GameState, Reduce, SaveState, WorkshopFlow } from '@/store/types';
import {
  checkDesign,
  checkSolution,
  costOf,
  draftRoomId,
  introRoomId,
  introSpec,
  type Planted,
  plantWorks,
  type RoomPayload,
  roomSpecOf,
  type Solution,
  titleCount,
  withFedNumbers,
} from '@/workshop/design';

type Step = { state: GameState; events: DomainEvent[] };

const unchanged = (state: GameState): Step => ({ state, events: [] });

/** The id a friend's copy of a room plays under. */
export function friendRoomId(id: string): RoomSpec['id'] {
  return `built-${id}`;
}

/** The spec a friend plays: all three ways, a blank page, the planted line if any. */
export function friendSpec(room: RoomPayload, id: string): RoomSpec {
  return roomSpecOf(room.design, 'friend', friendRoomId(id), {
    planted: room.planted,
    solution: room.solution,
  });
}

/**
 * The friend's in-memory save: no progress, Balance and the gear chain to hand (GDD: "all
 * three ways"), and never written (main.tsx doesn't read the save on a friend's page).
 */
export function friendSave(now: number): SaveState {
  const save = newSave(new Date(now).toISOString());
  return { ...save, progress: { ...save.progress, tools: ['balance', 'chain'] } };
}

function isBuilt(room: RoomState | null): boolean {
  return room !== null && String(room.spec.id).startsWith('built-');
}

/** His lines of the stage in play, as the save and the link keep them: pad characters. */
function stageLines(room: RoomState): string[] {
  return room.stage.lines
    .filter((line) => line.source !== 'given' && line.source !== 'logbook')
    .map((line) => line.tokens.join(''));
}

function withUi(state: GameState, ui: Partial<GameState['ui']>): GameState {
  return produce(state, (draft) => {
    Object.assign(draft.ui, castDraft(ui));
  });
}

/** A design he can play: it keeps the rules for the rooms he has done. */
function solveStep(inner: Reduce, state: GameState, action: Action, ctx: Parameters<Reduce>[2]) {
  if (action.type !== 'workshop/solve' || state.ui.screen !== 'workshop') return null;
  const design = withFedNumbers(action.design);
  if (!checkDesign(design, state.save.progress.roomsDone).ok) return null;
  const spec = roomSpecOf(design, 'builder', draftRoomId);
  const entered = inner(state, { type: 'room/enter-spec', spec }, ctx);
  const flow: WorkshopFlow = { step: 'solve', design, solution: design.machines.map(() => []) };
  return { state: withUi(entered.state, { workshop: flow }), events: entered.events };
}

/** Sends the solved room: the payload, its id, the cost paid, and the room on the wall. */
function sendStep(state: GameState, title: number, planted: Planted | null): Step {
  const flow = state.ui.workshop;
  if (state.ui.screen !== 'workshop' || flow?.step !== 'finish') return unchanged(state);
  const { design, solution } = flow;
  if (!Number.isInteger(title) || title < 0 || title >= titleCount) return unchanged(state);
  if (checkSolution(design, solution) !== null) return unchanged(state);
  if (design.plant !== (planted !== null)) return unchanged(state);
  if (planted && !plantWorks(design, solution, planted)) return unchanged(state);
  const payload = encodeRoom({ title, design, planted, solution });
  const id = roomIdOf(payload);
  if (id === null) return unchanged(state);
  const rooms = state.save.workshop.rooms;
  // The same room sent again isn't paid for twice.
  const already = rooms.some((room) => room.id === id);
  const spent = already ? null : spendParts(state.save.economy, costOf(design));
  if (spent && !spent.ok) return unchanged(state);
  const next = produce(state, (draft) => {
    if (spent?.ok) draft.save.economy = castDraft(spent.economy);
    if (!already) {
      const sent = { id, payload, title, stamp: null };
      draft.save.workshop.rooms = castDraft([...rooms, sent].slice(-maxSentRooms));
    }
    draft.ui.workshop = { step: 'sent', id };
  });
  return { state: next, events: [{ type: 'SaveChanged' }] };
}

/** A reply link stamps the room it names (FR51), and the counter shows the wall. */
function replyStep(state: GameState, id: string, stamp: 'cracked' | 'uncracked'): Step {
  const rooms = state.save.workshop.rooms;
  const index = rooms.findIndex((room) => room.id === id);
  if (index < 0) return unchanged(state);
  const next = produce(state, (draft) => {
    const room = draft.save.workshop.rooms[index];
    if (room) room.stamp = stamp;
    if (state.ui.screen === 'map' || state.ui.screen === 'shop') {
      draft.ui.screen = 'shop';
      draft.ui.workshop = { step: 'reply', id };
    }
  });
  return { state: next, events: [{ type: 'SaveChanged' }] };
}

/** The friend's link opened: the welcome card, or the broken machine. */
function friendStart(state: GameState, data: string, newToGame: boolean, now: number): Step {
  const room = decodeRoom(data);
  const id = room ? (roomIdOf(data) ?? '') : '';
  const friend: FriendFlow = { step: room ? 'welcome' : 'broken', room, id, newToGame };
  const next = produce(state, (draft) => {
    draft.save = castDraft(friendSave(now));
    draft.room = null;
    draft.fight = null;
    draft.ui.screen = 'friend';
    draft.ui.loaded = 1;
    draft.ui.friend = friend;
  });
  return { state: next, events: [] };
}

/** The friend's "Dalje": from the welcome, the intro machine if new; else the room itself. */
function friendNext(inner: Reduce, state: GameState, ctx: Parameters<Reduce>[2]): Step {
  const friend = state.ui.friend;
  if (!friend?.room || state.ui.screen !== 'friend') return unchanged(state);
  const intro = friend.step === 'welcome' && friend.newToGame;
  if (friend.step !== 'welcome' && friend.step !== 'ready') return unchanged(state);
  const spec = intro ? introSpec : friendSpec(friend.room, friend.id);
  const entered = inner(state, { type: 'room/enter-spec', spec }, ctx);
  return {
    state: withUi(entered.state, { friend: { ...friend, step: intro ? 'intro' : 'play' } }),
    events: entered.events,
  };
}

/**
 * After the rest of the game has handled an action: in his built room, each machine's lines
 * are kept as it locks; a built room that ends (its restart over) or that he leaves goes back
 * to the workshop, or for a friend on to the next card.
 */
function afterRoom(before: GameState, step: Step): Step {
  const { state, events } = step;
  const room = before.room;
  if (!isBuilt(room) || !room) return step;
  const flow = state.ui.workshop;
  let next = state;
  if (flow?.step === 'solve' && state.room && String(state.room.spec.id) === draftRoomId) {
    const locked = events.find((event) => event.type === 'StageLocked');
    if (locked && 'stage' in locked) {
      const solution: Solution = flow.solution.map((lines, i) =>
        i === locked.stage ? stageLines(state.room as RoomState) : lines,
      );
      next = withUi(next, { workshop: { ...flow, solution } });
    }
  }
  if (state.room !== null) return { state: next, events };
  // The room is gone: it ended (its restart over), or he left it.
  const ended = room.stage.phase === 'restart' || room.stage.phase === 'done';
  const id = String(room.spec.id);
  if (id === draftRoomId && flow?.step === 'solve') {
    const workshop: WorkshopFlow = ended
      ? { step: 'finish', design: flow.design, solution: flow.solution }
      : { step: 'design', design: flow.design };
    return { state: withUi(next, { screen: 'workshop', workshop }), events };
  }
  const friend = state.ui.friend;
  if (friend) {
    const after = id === introRoomId ? 'ready' : 'cracked';
    return {
      state: withUi(next, { screen: 'friend', friend: { ...friend, step: after } }),
      events,
    };
  }
  return { state: next, events };
}

/** The game's reducer with the workshop and the friend's side over it. */
export function withWorkshop(inner: Reduce): Reduce {
  return (state, action, ctx) => {
    switch (action.type) {
      case 'workshop/open':
        if (state.ui.screen !== 'shop') return unchanged(state);
        return {
          state: withUi(state, {
            screen: 'workshop',
            workshop: openFlow(state.ui.workshop),
          }),
          events: [],
        };
      case 'workshop/close':
        if (state.ui.screen !== 'workshop') return unchanged(state);
        return {
          state: withUi(state, { screen: 'shop', workshop: closeFlow(state.ui.workshop) }),
          events: [],
        };
      case 'workshop/solve':
        return solveStep(inner, state, action, ctx) ?? unchanged(state);
      case 'workshop/redesign': {
        const flow = state.ui.workshop;
        if (state.ui.screen !== 'workshop' || flow?.step !== 'finish') return unchanged(state);
        return {
          state: withUi(state, { workshop: { step: 'design', design: flow.design } }),
          events: [],
        };
      }
      case 'workshop/send':
        return sendStep(state, action.title, action.planted);
      case 'workshop/reply':
        return replyStep(state, action.id, action.stamp);
      case 'friend/start':
        return friendStart(state, action.data, action.newToGame, ctx.now);
      case 'friend/next':
        return friendNext(inner, state, ctx);
      case 'friend/give-up': {
        const friend = state.ui.friend;
        if (friend?.step !== 'play' || state.ui.screen !== 'room') return unchanged(state);
        const next = produce(state, (draft) => {
          draft.room = null;
          draft.ui.screen = 'friend';
          draft.ui.hint = null;
          draft.ui.notebookAside = false;
          draft.ui.friend = castDraft({ ...friend, step: 'gave-up' as const });
        });
        return { state: next, events: [] };
      }
      case 'map/open':
        // A friend's room has no town to go to: giving up is the way out.
        if (state.ui.friend) return unchanged(state);
        break;
    }
    return afterRoom(state, inner(state, action, ctx));
  };
}

/** The workshop as he opens it: where building stands, or a new design. */
function openFlow(flow: WorkshopFlow | null): WorkshopFlow {
  if (flow?.step === 'design' || flow?.step === 'finish') return flow;
  return { step: 'design', design: null };
}

/** Leaving the workshop keeps a design or a solved room for when he comes back. */
function closeFlow(flow: WorkshopFlow | null): WorkshopFlow | null {
  return flow?.step === 'design' || flow?.step === 'finish' ? flow : null;
}
