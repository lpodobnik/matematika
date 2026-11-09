// Part 2's layer of the store (architecture, Pattern 7), over the rest as the fights' layer is.
// The rules themselves are in `hunt/`, which is pure.

import { castDraft, produce } from 'immer';
import { cleanName } from '@/city/character';
import { tuning } from '@/config/tuning';
import { leadSpecs, playedSpec } from '@/content/leads';
import { earnParts } from '@/economy/parts';
import {
  type GateScene,
  gateDelete,
  gateEnter,
  gateScene,
  gateState,
  gateType,
  newGateScene,
} from '@/hunt/gate';
import { inList, knotIds, type LeadId, leadIds } from '@/hunt/ids';
import { huntAt } from '@/hunt/jump';
import { type LeadAction, type LeadPlay, leadPlayFrom, leadStep, newLeadPlay } from '@/hunt/lead';
import type { LeadSpec } from '@/hunt/spec';
import { partTwoOn } from '@/hunt/switch';
import { openTrail, type TrailId, threadAfterLead, threadTarget } from '@/hunt/trail';
import { roomIds } from '@/room/types';
import type { DomainEvent } from '@/store/events';
import type { GameState, Reduce } from '@/store/types';

type Step = { state: GameState; events: DomainEvent[] };

const same = (state: GameState): Step => ({ state, events: [] });

const gateNow = (state: GameState) =>
  gateState(
    {
      roomsDone: state.save.progress.roomsDone,
      bossBeaten: state.save.economy.lairs['lair-60'] !== undefined,
      hunt: state.save.hunt,
    },
    partTwoOn(state.ui.preview),
  );

function setGate(state: GameState, scene: GateScene): GameState {
  return produce(state, (draft) => {
    draft.save.hunt.scene = castDraft({ of: 'gate', index: 0, state: scene });
  });
}

/** The gate scene in play, or null. */
function gateInPlay(state: GameState): GateScene | null {
  const scene = state.save.hunt.scene;
  return scene?.of === 'gate' ? gateScene(scene.state) : null;
}

function changeGate(state: GameState, change: (scene: GateScene) => GateScene): Step {
  const scene = gateInPlay(state);
  if (!scene) return same(state);
  const next = change(scene);
  if (next === scene) return same(state);
  const opened = scene.phase === 'solve' && next.phase === 'foundry';
  const written = setGate(state, next);
  if (!opened) return { state: written, events: [{ type: 'SaveChanged' }] };
  return {
    state: produce(written, (draft) => {
      draft.save.hunt.gateOpened = true;
      if (!draft.save.hunt.beats.includes('foundry')) draft.save.hunt.beats.push('foundry');
    }),
    events: [{ type: 'GateOpened' }, { type: 'SaveChanged' }],
  };
}

const isLead = inList(leadIds);
const isKnot = inList(knotIds);
const isTrail = (id: string): id is TrailId => isLead(id) || isKnot(id);

/** The lead in play, with its spec, or null. */
function leadInPlay(state: GameState): { lead: TrailId; spec: LeadSpec; play: LeadPlay } | null {
  const { hunt } = state.save;
  const scene = hunt.scene;
  if (!scene || scene.of === 'gate' || !isTrail(scene.of)) return null;
  const spec = playedSpec(scene.of, hunt.sealed);
  return spec ? { lead: scene.of, spec, play: scene.state as LeadPlay } : null;
}

/** A move in the lead: the rules are in `hunt/lead.ts`, and what they change outside it, here. */
function moveInLead(state: GameState, action: LeadAction, now: number): Step {
  const inPlay = leadInPlay(state);
  if (!inPlay) return same(state);
  const { lead, spec, play } = inPlay;
  const { hunt, companion } = state.save;
  const { play: next, outcome } = leadStep(spec, play, action, {
    taught: companion?.taught.map((entry) => entry.mistake) ?? [],
    told: hunt.told,
  });
  if (next === play && Object.keys(outcome).length === 0) return same(state);
  const events: DomainEvent[] = [];
  if (outcome.lessonSeen && isLead(lead)) events.push({ type: 'LessonSeen', lead });
  if (outcome.taught && isLead(lead)) events.push({ type: 'FixMade', lead });
  if (outcome.lineWritten) events.push({ type: 'LineWritten', lead, line: outcome.lineWritten });
  if (outcome.doorKnocked) events.push({ type: 'DoorKnocked', lead, ...outcome.doorKnocked });
  if (outcome.finished) {
    events.push({ type: 'LeadFinished', lead, firstTry: outcome.finished.firstTry });
  }
  events.push({ type: 'SaveChanged' });
  return {
    state: produce(state, (draft) => {
      const saved = draft.save.hunt;
      saved.scene = castDraft({ of: lead, index: next.step === 'play' ? next.at : 0, state: next });
      if (outcome.earned && !saved.paid.includes(outcome.earned.key)) {
        saved.paid.push(outcome.earned.key);
        draft.save.economy = castDraft(earnParts(draft.save.economy, outcome.earned.parts));
      }
      if (outcome.forged && saved.forged === 'open') saved.forged = outcome.forged;
      if (outcome.guardBeaten && !saved.guards.includes(outcome.guardBeaten)) {
        saved.guards.push(outcome.guardBeaten);
      }
      if (outcome.taught && draft.save.companion && isLead(lead)) {
        draft.save.companion.taught.push({
          lead,
          ...outcome.taught,
          at: new Date(now).toISOString(),
        });
      }
      if (outcome.lessonSeen && !saved.told.includes(`lesson:${lead}`)) {
        saved.told.push(`lesson:${lead}`);
      }
      if (outcome.told && !saved.told.includes(outcome.told)) saved.told.push(outcome.told);
      if (outcome.finished) {
        saved.pages[lead] = outcome.finished.lines.map((text) => ({
          text,
          kind: 'his',
          struck: false,
        }));
        saved.firstTries[lead] = outcome.finished.firstTry;
        if (isLead(lead) && !saved.leadsDone.includes(lead)) saved.leadsDone.push(lead);
        if (isKnot(lead) && !saved.knotsDone.includes(lead)) saved.knotsDone.push(lead);
        for (const beat of spec.beats ?? []) {
          if (!saved.beats.includes(beat)) saved.beats.push(beat);
        }
        const companion = draft.save.companion;
        if (spec.gives && companion && !companion.gear.includes(spec.gives)) {
          companion.gear.push(spec.gives);
        }
        const moved = threadAfterLead(saved, lead);
        saved.sealed = [...moved.sealed];
        saved.thread = { ...moved.thread, target: threadTarget(saved) };
        saved.scene = null;
        draft.ui.screen = 'map';
      }
    }),
    events,
  };
}

/** A saved scene on launch: back as it was, or from its start if it no longer fits its spec. */
function resumedScene(
  scene: NonNullable<GameState['save']['hunt']['scene']>,
  sealed: readonly LeadId[],
): typeof scene {
  if (scene.of === 'gate' || !isTrail(scene.of)) return scene;
  const spec = playedSpec(scene.of, sealed);
  if (!spec) return scene;
  return { ...scene, state: leadPlayFrom(spec, scene.state) ?? newLeadPlay() };
}

export function withHunt(inner: Reduce): Reduce {
  return (state, action, ctx) => {
    switch (action.type) {
      case 'dev/preview':
        return {
          state: produce(state, (draft) => {
            draft.ui.preview = true;
          }),
          events: [],
        };
      case 'hunt/gate-open': {
        if (gateNow(state) !== 'ready') return same(state);
        const opened = produce(setGate(state, newGateScene()), (draft) => {
          draft.ui.screen = 'hunt';
        });
        return { state: opened, events: [{ type: 'SaveChanged' }] };
      }
      case 'hunt/type':
        return changeGate(state, (scene) => gateType(scene, action.token, tuning.draftMaxTokens));
      case 'hunt/delete':
        return changeGate(state, gateDelete);
      case 'hunt/enter':
        return changeGate(state, gateEnter);
      case 'hunt/foundry-done':
        return changeGate(state, (scene) =>
          scene.phase === 'foundry' ? { ...scene, phase: 'name' } : scene,
        );
      case 'dev/hunt-jump': {
        if (!state.ui.preview) return same(state);
        const { hunt, companion } = huntAt(state.save.hunt, state.save.companion, action.to, {
          beatsOf: (id) => leadSpecs[id]?.beats ?? [],
          guardOf: (id) => {
            const guard = leadSpecs[id]?.scenes.find((scene) => scene.kind === 'guard');
            return guard?.kind === 'guard' ? guard.id : null;
          },
        });
        return {
          state: produce(state, (draft) => {
            const { progress, economy } = draft.save;
            const rooms = [...roomIds];
            progress.roomsDone = rooms;
            progress.told = rooms;
            progress.tools = ['balance', 'workshop', 'chain', 'drum'];
            progress.onMap = true;
            progress.introSeen = true;
            economy.lairs['lair-60'] = economy.lairs['lair-60'] ?? {
              rewindsAt: '2000-01-01T00:00:00.000Z',
            };
            if (!draft.save.character.name) draft.save.character = { name: 'Ana', look: 'look-1' };
            draft.save.hunt = castDraft(hunt);
            draft.save.companion = castDraft(companion);
            draft.room = null;
            draft.ui.screen = 'map';
          }),
          events: [{ type: 'SaveChanged' }],
        };
      }
      case 'hunt/lead-start': {
        const { hunt, companion } = state.save;
        const spec = playedSpec(action.lead, hunt.sealed);
        const allowed =
          partTwoOn(state.ui.preview) &&
          companion !== null &&
          spec !== undefined &&
          openTrail(hunt).includes(action.lead);
        if (!allowed) return same(state);
        const waiting = hunt.scene?.of === action.lead;
        return {
          state: produce(state, (draft) => {
            draft.ui.screen = 'hunt';
            if (waiting) return;
            if (isLead(action.lead) && !draft.save.hunt.leadsStarted.includes(action.lead)) {
              draft.save.hunt.leadsStarted.push(action.lead);
            }
            draft.save.hunt.thread.target = threadTarget(draft.save.hunt);
            draft.save.hunt.scene = castDraft({
              of: action.lead,
              index: 0,
              state: newLeadPlay(spec, {
                taught: companion.taught.map((entry) => entry.mistake),
                told: hunt.told,
              }),
            });
          }),
          events: [
            ...(isLead(action.lead) ? [{ type: 'LeadPicked' as const, lead: action.lead }] : []),
            { type: 'SaveChanged' },
          ],
        };
      }
      case 'hunt/lead':
        return moveInLead(state, action.action, ctx.now);
      case 'hunt/leave':
        if (state.ui.screen !== 'hunt') return same(state);
        return {
          state: produce(state, (draft) => {
            draft.ui.screen = 'map';
          }),
          events: [],
        };
      case 'hunt/map-given':
        if (state.save.hunt.beats.includes('map-given')) return same(state);
        return {
          state: produce(state, (draft) => {
            draft.save.hunt.beats.push('map-given');
          }),
          events: [{ type: 'SaveChanged' }],
        };
      case 'hunt/name': {
        const scene = gateInPlay(state);
        const name = cleanName(action.name);
        if (scene?.phase !== 'name' || !name) return same(state);
        return {
          state: produce(state, (draft) => {
            draft.save.companion = { name, looks: [], wearing: [], gear: [], taught: [] };
            draft.save.hunt.scene = null;
            if (!draft.save.hunt.beats.includes('named')) draft.save.hunt.beats.push('named');
            draft.ui.screen = 'map';
          }),
          events: [{ type: 'LittleOneNamed' }, { type: 'SaveChanged' }],
        };
      }
    }
    const result = inner(state, action, ctx);
    // A scene in progress resumes on launch.
    if (action.type === 'boot/start' && result.state.save.hunt.scene) {
      if (!partTwoOn(result.state.ui.preview)) return result;
      return {
        state: produce(result.state, (draft) => {
          draft.ui.screen = 'hunt';
          const scene = result.state.save.hunt.scene;
          const { sealed } = result.state.save.hunt;
          if (scene) draft.save.hunt.scene = castDraft(resumedScene(scene, sealed));
        }),
        events: result.events,
      };
    }
    return result;
  };
}
