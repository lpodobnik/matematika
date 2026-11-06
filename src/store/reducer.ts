// The pure root reducer (architecture, State Management). It never touches React, the
// DOM, storage, audio or the clock: time and randomness come in through ctx, and what
// happened goes out as domain events.

import { castDraft, produce } from 'immer';
import { cleanName, isLookId, needsName } from '@/city/character';
import { nextRoomOnMap, type Reach, roomOpen } from '@/city/reach';
import type { NodeId } from '@/city/types';
import { districtMap } from '@/content/map';
import { rooms } from '@/content/rooms';
import { payPrediction, predictionKey } from '@/economy/predictions';
import { assert } from '@/lib/assert';
import { setDial } from '@/room/dial';
import { meetControls } from '@/room/first-use';
import { actedAt, type HandoverMove, meetHandovers, stampArrival, tickIdle } from '@/room/handover';
import { type HintAction, hintAfter } from '@/room/hint';
import { deleteToken, enterLine, typeToken, withoutRefusal } from '@/room/notebook';
import {
  finishPresentation,
  resetStage,
  resetWorks,
  tickClock,
  toolEarned,
  touchMachine,
} from '@/room/phases';
import { confirmPin, setPin } from '@/room/pin';
import { isRoomId, resumeRoom, type SavedRoom, savedRoomOf } from '@/room/resume';
import { enterRoom, type RoomStep } from '@/room/room';
import { rememberSplitter, splitBothPans, stepSplitter } from '@/room/splitter';
import { dropOnScale, rememberTray, stepTray, takeOffPan } from '@/room/tray';
import type { RoomSpec, RoomState, ToolId } from '@/room/types';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { newSave } from '@/store/persist';
import { initialQuality, type QualityState, reduceQuality } from '@/store/quality';
import type { GameState, Reduce, SaveState } from '@/store/types';

/** The game at launch: loading, until the save is read and the assets are loaded (`boot/start`). */
export function initialGameState(): GameState {
  return {
    save: newSave(),
    room: null,
    ui: {
      screen: 'loading',
      loaded: 0,
      fresh: null,
      notebookAside: false,
      quality: initialQuality,
      copies: 1,
      hint: null,
    },
  };
}

function findRoom(id: RoomSpec['id'], list: readonly RoomSpec[]): RoomSpec {
  const spec = list.find((room) => room.id === id);
  assert(spec, `no room ${id} in content`);
  return spec;
}

/**
 * A saved room in progress, resumed after its last committed line (room/resume.ts); that
 * stage fresh when it no longer replays; or the room fresh when the stage no longer exists.
 */
function resumeStep(spec: RoomSpec, saved: SavedRoom, now: number): RoomStep {
  const resumed = resumeRoom(spec, saved, now);
  if (resumed) return { room: resumed, events: [] };
  return enterRoom(spec, spec.stages[saved.stage] ? saved.stage : 0);
}

/**
 * A room he goes into: resumed from where he left it halfway, if he did (FR26), else fresh.
 * A left room that throws as it resumes starts fresh, so a bad entry never blocks the room.
 */
function goInto(spec: RoomSpec, save: SaveState, now: number): RoomStep {
  const saved = save.progress.started.find((room) => room.id === spec.id);
  if (!saved) return enterRoom(spec);
  try {
    return resumeStep(spec, saved, now);
  } catch {
    return enterRoom(spec);
  }
}

/**
 * The next room he can play (Luka, story 2.2: "He should go to the next room"): the room
 * after `from` in play order when he can play it, as in epic 1; else the first open room on
 * the map he hasn't finished. Null when none is left.
 */
function nextRoom(roomList: readonly RoomSpec[], save: SaveState, from: string | null) {
  const reach = reachOf(save, roomList);
  const { done, authored } = reach;
  const after = from === null ? [] : authored.slice(authored.indexOf(from) + 1);
  const next =
    after.find((id) => !done.includes(id) && roomOpen(districtMap, id, reach)) ??
    nextRoomOnMap(districtMap, reach);
  return roomList.find((room) => room.id === next) ?? null;
}

/**
 * The room the game starts in (story 2.1): the saved room in progress; on the map, none
 * (story 2.2); otherwise the next room, as a restart hands over (so a first launch opens
 * room 1 straight away, the narrative design: play first).
 */
function startStep(
  saved: SavedRoom | null,
  roomList: readonly RoomSpec[],
  save: SaveState,
  now: number,
): RoomStep | null {
  const spec = saved ? roomList.find((room) => room.id === saved.id) : undefined;
  if (named(save) === false) return null;
  if (saved && spec) return resumeStep(spec, saved, now);
  if (save.progress.onMap) return null;
  const next = nextRoom(roomList, save, null);
  return next ? goInto(next, save, now) : null;
}

const authoredIds = (roomList: readonly RoomSpec[]) => roomList.map((room) => room.id);

/** What opens the way forward (story 2.3): rooms finished and tools earned, never parts. */
const reachOf = (save: SaveState, roomList: readonly RoomSpec[]): Reach => ({
  done: save.progress.roomsDone,
  tools: save.progress.tools,
  authored: authoredIds(roomList),
});

/**
 * A room whose restart has ended hands over to the next room he can play (`nextRoom`),
 * resumed if he left it halfway. With none left, the room stays done and the map shows.
 */
function moveOn(
  step: RoomStep | null,
  roomList: readonly RoomSpec[],
  save: SaveState,
  now: number,
): RoomStep | null {
  if (step?.room.stage.phase !== 'done') return step;
  // After room 1, he names his apprentice first (story 2.4).
  if (named(save) === false) return step;
  const spec = nextRoom(roomList, save, step.room.spec.id);
  if (!spec) return step;
  const entered = goInto(spec, save, now);
  return { room: entered.room, events: [...step.events, ...entered.events] };
}

/**
 * A tap on a map node (`map/travel`, FR27): an open room takes him there at once (city/reach.ts),
 * resumed if he left it halfway (FR26). Null for anything else, and when he isn't on the map.
 */
function travelStep(
  state: GameState,
  node: NodeId,
  roomList: readonly RoomSpec[],
  save: SaveState,
  now: number,
): RoomStep | null {
  if (state.ui.screen !== 'map') return null;
  if (!roomOpen(districtMap, node, reachOf(save, roomList))) return null;
  const spec = roomList.find((room) => room.id === node);
  return spec ? goInto(spec, save, now) : null;
}

/**
 * What an action does to the room in play, or null when it leaves the room alone: with no
 * room, in a phase where the action does nothing, or for an action outside the room. The
 * tray and the splitter take the tools he has earned, since they need Balance. `save` is
 * the saved slice the action starts from (`saveBefore`).
 */
function roomStep(
  state: GameState,
  action: Action,
  now: number,
  roomList: readonly RoomSpec[],
  save: SaveState,
): RoomStep | null {
  const { tools } = save.progress;
  if (action.type === 'room/enter') {
    return enterRoom(findRoom(action.roomId, roomList), action.stage ?? 0);
  }
  if (action.type === 'boot/start') return startStep(action.room, roomList, save, now);
  if (action.type === 'dev/new-game') return startStep(null, roomList, save, now);
  if (action.type === 'map/travel') return travelStep(state, action.node, roomList, save, now);
  if (action.type === 'character/set') {
    // Named (`save` carries the name once it is valid): on to the room after room 1.
    if (state.ui.screen !== 'naming' || named(save) !== true) return null;
    const next = nextRoom(roomList, save, 'r01');
    return next ? goInto(next, save, now) : null;
  }
  const { room } = state;
  if (!room) return null;
  switch (action.type) {
    case 'machine/touch':
      return touchMachine(room);
    case 'stage/reset':
      return resetStage(room);
    case 'presentation/done':
      return moveOn(finishPresentation(room, action, now), roomList, save, now);
    case 'clock/tick':
      return moveOn(tickClock(room, now), roomList, save, now);
    case 'dial/set':
      return setDial(room, action.x);
    case 'pin/set':
      return setPin(room, action.value);
    case 'pin/confirm':
      return confirmPin(room);
    case 'tray/step':
      return stepTray(room, tools, action.kind, action.by);
    case 'tray/drop':
      return dropOnScale(room, tools, action.kind);
    case 'tray/take':
      return takeOffPan(room, tools, action.side, action.key);
    case 'splitter/step':
      return stepSplitter(room, tools, action.by);
    case 'splitter/split':
      return splitBothPans(room, tools);
    case 'notebook/type':
      return typeToken(room, action.token);
    case 'notebook/delete':
      return deleteToken(room);
    case 'notebook/enter':
      return enterLine(room, now);
    case 'boot/progress':
    case 'map/open':
    case 'notebook/slide':
    case 'hint/press':
    case 'quality/measured':
    case 'quality/force':
    case 'dev/set-copies':
      return null;
    case 'dev/set-tools':
      // The room is unchanged, but what it offers may not be (the tray and the splitter), so
      // first use runs.
      return { room, events: [] };
  }
}

/**
 * Story 1.15: a stage knows he met the tray in an earlier stage, so it offers the tray at
 * once (room/tray.ts); and once it offers the splitter, it keeps offering it for the rest
 * of the stage, a reset included (room/splitter.ts). The same step when nothing changes.
 */
function withToolMemory(step: RoomStep | null, save: SaveState): RoomStep | null {
  if (!step) return step;
  const { firstUse, tools } = save.progress;
  const room = rememberSplitter(rememberTray(step.room, firstUse), tools);
  return room === step.room ? step : { ...step, room };
}

/** A room step, then what it means for his progress (held in `save`). */
interface Progressed {
  step: RoomStep | null;
  save: SaveState;
}

/**
 * What a room step means beyond the room: a room that restarts is done (story 2.1) and
 * earns its tool (room 3: Balance); and the first time the stage offers a control he
 * hasn't met, it wiggles once and counts as met (room/first-use.ts).
 */
function progress(step: RoomStep | null, save: SaveState): Progressed {
  if (!step) return { step, save };
  const { tools, firstUse, roomsDone } = save.progress;
  const tool = toolEarned(step);
  const earned = tool !== null && !tools.includes(tool);
  const toolsNow = earned ? [...tools, tool] : tools;
  const { id } = step.room.spec;
  const restarted = step.events.some((event) => event.type === 'RoomRestarted');
  const finished = restarted && isRoomId(id) && !roomsDone.includes(id);
  const met = meetControls(step.room, firstUse, toolsNow);
  if (!met && !earned && !finished) return { step, save };
  return {
    step: met ? { ...step, room: met.room } : step,
    save: {
      ...save,
      progress: {
        ...save.progress,
        roomsDone: finished && isRoomId(id) ? [...roomsDone, id] : roomsDone,
        tools: toolsNow,
        firstUse: met ? met.met : firstUse,
      },
    },
  };
}

/**
 * The actions that aren't his: the game's own, the clock's and the dev panel's. Any other
 * that does something to the room restarts the stage's idle clock.
 */
const notHis: ReadonlySet<Action['type']> = new Set<Action['type']>([
  'boot/progress',
  'boot/start',
  'dev/new-game',
  'map/open',
  'map/travel',
  'room/enter',
  'presentation/done',
  'clock/tick',
  'dev/set-tools',
  'dev/set-copies',
  'quality/measured',
  'quality/force',
]);

/**
 * Story 1.16: the tray's and the splitter's steppers set the number a move uses rather than
 * make one, so the hint stays while he sets the number it names.
 */
const toolSettings: ReadonlySet<Action['type']> = new Set<Action['type']>([
  'tray/step',
  'splitter/step',
]);

/**
 * What an action means for the hint button (room/hint.ts): its press; one that ends the
 * hint, an action of his that did something to the room (`changed`), or a room entered; or
 * any other, which leaves it.
 */
function hintAction(action: Action, changed: boolean): HintAction {
  if (action.type === 'hint/press') return 'press';
  if (action.type === 'room/enter' || action.type === 'boot/start') return 'ends';
  if (action.type === 'dev/new-game') return 'ends';
  if (action.type === 'map/open' || action.type === 'map/travel') return 'ends';
  const his =
    !notHis.has(action.type) && action.type !== 'notebook/slide' && !toolSettings.has(action.type);
  return his && changed ? 'ends' : 'other';
}

/**
 * Story 1.16 review: the refusal's tag (`Prvo pojednostavi vagu.`) stays up only until his
 * next action, so only one tag shows; the scene's tags wait while it does. Enter sets or
 * clears it itself, and an edit clears it (room/notebook.ts); any other action of his that
 * does something to the room takes it down here. A press of the hint button changes
 * nothing in the room: its tag takes the refusal's place at the notebook instead.
 */
function withRefusalDown(
  step: RoomStep | null,
  before: RoomState | null,
  action: Action,
): RoomStep | null {
  if (!step || step.room === before) return step;
  if (notHis.has(action.type) || action.type === 'notebook/enter') return step;
  const room = withoutRefusal(step.room);
  return room === step.room ? step : { ...step, room };
}

/** His action as the handovers name it (room/handover.ts). */
function handoverMove(action: Action): HandoverMove {
  switch (action.type) {
    case 'dial/set':
      return 'dial';
    case 'tray/drop':
    case 'tray/take':
      return 'tray';
    case 'splitter/split':
      return 'split';
    default:
      return 'other';
  }
}

/**
 * The handover tags' part of an action (story 1.15; room/handover.ts): a stage that has
 * just arrived starts its idle clock at `now`; an action of his that did something
 * restarts it and ends idle, and marks the handover steps it took as met; the clock makes
 * a stage idle after `tuning.hintIdleMs`. `previous` is the room before the action.
 */
function handOver(
  previous: RoomState | null,
  action: Action,
  now: number,
  { step, save }: Progressed,
): Progressed {
  let room = step?.room ?? previous;
  if (!room) return { step, save };
  if (step) room = stampArrival(room, now) ?? room;
  if (step && !notHis.has(action.type)) room = actedAt(room, now);
  if (action.type === 'clock/tick') room = tickIdle(room, now) ?? room;
  const { firstUse, tools } = save.progress;
  const met = step ? meetHandovers(previous, room, handoverMove(action), firstUse, tools) : null;
  const nextSave = met ? { ...save, progress: { ...save.progress, firstUse: met } } : save;
  if (room === (step?.room ?? previous)) return { step, save: nextSave };
  return { step: { room, events: step?.events ?? [] }, save: nextSave };
}

/**
 * A right prediction pays parts into `save.economy`, once per stage (GDD, Prediction; story
 * 1.14). It is read off the room's `PredictionMade` events, so the room reducers know
 * nothing of the economy.
 */
function payPredictions(events: readonly DomainEvent[], save: SaveState): SaveState {
  let { economy } = save;
  for (const event of events) {
    if (event.type !== 'PredictionMade') continue;
    economy = payPrediction(economy, predictionKey(event.roomId, event.stage), event.right);
  }
  return economy === save.economy ? save : { ...save, economy };
}

/** The dev panel sets the tools he has earned (architecture, Debug Tools). */
function withTools(save: SaveState, tools: readonly ToolId[]): SaveState {
  return { ...save, progress: { ...save.progress, tools: [...new Set(tools)] } };
}

function isoTime(now: number): string {
  return new Date(now).toISOString();
}

/**
 * The saved slice an action starts from: the save read at launch (`boot/start`; a new
 * game's when there is none), stamped with the first launch's time; a new game from the
 * dev panel, which keeps the settings; the dev panel's tools; or the slice as it is.
 */
function saveBefore(save: SaveState, action: Action, now: number): SaveState {
  switch (action.type) {
    case 'boot/start': {
      const loaded = action.save ?? newSave();
      const stamped = loaded.createdAt === null ? { ...loaded, createdAt: isoTime(now) } : loaded;
      return owedRoomAside(stamped, action.room);
    }
    case 'dev/new-game':
      return { ...newSave(isoTime(now)), settings: save.settings };
    case 'dev/set-tools':
      return withTools(save, action.tools);
    default:
      return save;
  }
}

/**
 * The quality setting after an action: the frame-time test's report and the dev panel's
 * forced setting (store/quality.ts); and, as the game starts, a saved pick, so the test
 * doesn't run again (story 2.1).
 */
function qualityAfter(quality: QualityState, action: Action, save: SaveState): QualityState {
  if (action.type === 'quality/measured' || action.type === 'quality/force') {
    return reduceQuality(quality, action);
  }
  const pick = save.settings.quality;
  if (action.type === 'boot/start' && pick !== null && quality.measured === null) {
    return { ...quality, measured: pick };
  }
  return quality;
}

/** The test's pick is saved (story 2.1); a forced setting never is. */
function withQualityPick(save: SaveState, quality: QualityState): SaveState {
  const pick = quality.measured;
  if (pick === null || pick === save.settings.quality) return save;
  return { ...save, settings: { ...save.settings, quality: pick } };
}

/** Whether a room he leaves has anything to keep: a committed line, a pin, or the splitter offered. */
/**
 * The screen after an action: a room he goes into; the map when he leaves a room or its
 * restart ends with no room left (story 2.2); at the start, a room or the map.
 */
function screenAfter(
  state: GameState,
  action: Action,
  step: RoomStep | null,
  toMap: boolean,
  save: SaveState,
): GameState['ui']['screen'] {
  // Off to the map, or, after room 1 with no name yet, to the naming (story 2.4).
  const off = named(save) === false ? 'naming' : 'map';
  if (toMap) return off;
  if (action.type === 'boot/start' || action.type === 'dev/new-game') return step ? 'room' : off;
  if (action.type === 'room/enter' || (action.type === 'map/travel' && step)) return 'room';
  if (action.type === 'character/set' && state.ui.screen === 'naming' && named(save)) {
    return step ? 'room' : 'map';
  }
  return state.ui.screen;
}

/**
 * A save from before the naming, with a room in progress (story 2.4): the naming comes
 * first, so that room waits with the rooms he left halfway, and resumes when its turn comes.
 */
function owedRoomAside(save: SaveState, room: SavedRoom | null): SaveState {
  if (!room || named(save) !== false) return save;
  const started = [...save.progress.started.filter((left) => left.id !== room.id), room];
  return { ...save, progress: { ...save.progress, started } };
}

/**
 * Whether his apprentice is named (story 2.4): false once room 1 is finished without a
 * name, so the naming comes next; true once named; null before room 1 is finished.
 */
function named(save: SaveState): boolean | null {
  if (needsName(save.progress.roomsDone, save.character.name)) return false;
  return save.character.name === null ? null : true;
}

/** The name and look from the naming screen, tidied, when both are good; else none. */
function namedCharacter(state: GameState, action: Action): SaveState['character'] | null {
  if (action.type !== 'character/set' || state.ui.screen !== 'naming') return null;
  const name = cleanName(action.name);
  return name && isLookId(action.look) ? { name, look: action.look } : null;
}

/** The save keeps whether he is on the map, so a launch comes back there (story 2.2). */
function withOnMap(save: SaveState, screen: GameState['ui']['screen']): SaveState {
  if (screen === 'loading') return save;
  const onMap = screen === 'map';
  return save.progress.onMap === onMap ? save : { ...save, progress: { ...save.progress, onMap } };
}

function worthKeeping(saved: SavedRoom): boolean {
  // A later stage is worth keeping even before its first line: the stages before it are solved.
  return saved.stage > 0 || saved.lines.length > 0 || saved.pin !== null || saved.splitterSeen;
}

/**
 * Rooms left halfway (story 2.2, FR26): leaving for the map keeps the room's committed
 * lines, and entering a room takes it off the list, since the room in play is saved as
 * the room in progress.
 */
function withStarted(
  save: SaveState,
  leaving: RoomState | null,
  entered: RoomStep | null,
): SaveState {
  const { started } = save.progress;
  let next = started;
  const left = savedRoomOf(leaving);
  if (left) {
    next = next.filter((room) => room.id !== left.id);
    if (worthKeeping(left)) next = [...next, left];
  }
  const id = entered?.room.spec.id;
  if (id && next.some((room) => room.id === id)) next = next.filter((room) => room.id !== id);
  return next === started ? save : { ...save, progress: { ...save.progress, started: next } };
}

/** He can leave for the map from any phase before the stage locks (story 2.2). */
function leavingRoom(state: GameState, action: Action): RoomState | null {
  if (action.type !== 'map/open' || state.ui.screen !== 'room' || !state.room) return null;
  return resetWorks(state.room.stage.phase) ? state.room : null;
}

/** The root reducer, over a given list of rooms so tests can bring their own. */
export function createReducer(roomList: readonly RoomSpec[] = rooms): Reduce {
  return (state, action, ctx) => {
    const character = namedCharacter(state, action);
    const saved = saveBefore(state.save, action, ctx.now);
    const before = character ? { ...saved, character } : saved;
    const change = withRefusalDown(
      withToolMemory(roomStep(state, action, ctx.now, roomList, before), before),
      state.room,
      action,
    );
    const progressed = handOver(state.room, action, ctx.now, progress(change, before));
    const { step } = progressed;
    const events: DomainEvent[] = step ? [...step.events] : [];
    const leaving = leavingRoom(state, action);
    if (leaving) events.push({ type: 'RoomLeft', roomId: leaving.spec.id });
    const entered = step && step.room.spec.id !== state.room?.spec.id ? step : null;
    // A room whose restart has ended hands over to the map (story 2.2).
    const finished = step?.room.stage.phase === 'done' ? step.room : null;
    const quality = qualityAfter(state.ui.quality, action, before);
    const screen = screenAfter(state, action, step, leaving !== null || finished !== null, before);
    const save = withOnMap(
      withQualityPick(
        withStarted(payPredictions(events, progressed.save), leaving, entered),
        quality,
      ),
      screen,
    );
    // Every change to the saved slice is written (store/effects/save.ts).
    if (save !== state.save) events.push({ type: 'SaveChanged' });
    const roomNow = step?.room ?? state.room;
    const hint = hintAfter(
      state.ui.hint,
      hintAction(action, roomNow !== state.room),
      state.room,
      roomNow,
      save.progress.tools,
    );
    const next = produce(state, (draft) => {
      if (step && step.room !== state.room) draft.room = castDraft(step.room);
      if (save !== state.save) draft.save = castDraft(save);
      draft.ui.screen = screen;
      if (
        action.type === 'room/enter' ||
        (action.type === 'character/set' && screen !== 'naming') ||
        (action.type === 'map/travel' && step)
      ) {
        draft.ui.fresh = null;
      }
      // The game starts (story 2.1): in a room, or on the map (story 2.2).
      if (action.type === 'boot/start' || action.type === 'dev/new-game') {
        draft.ui.fresh = null;
        if (!step) draft.room = null;
      }
      if (action.type === 'boot/progress') {
        draft.ui.loaded = Math.min(1, Math.max(0, action.loaded));
      }
      // Leaving a room, or its restart ending, shows the map (story 2.2).
      if (leaving || finished) {
        draft.room = null;
        draft.ui.notebookAside = false;
      }
      if (finished && isRoomId(finished.spec.id)) draft.ui.fresh = finished.spec.id;
      if (action.type === 'dev/set-copies') draft.ui.copies = action.copies;
      if (action.type === 'notebook/slide') draft.ui.notebookAside = action.aside;
      if (hint !== state.ui.hint) draft.ui.hint = hint;
      if (quality !== state.ui.quality) draft.ui.quality = castDraft(quality);
    });
    return { state: next, events };
  };
}

export const reduce: Reduce = createReducer();
