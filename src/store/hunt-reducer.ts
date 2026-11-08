// Part 2's layer of the store (architecture, Pattern 7), over the rest as the fights' layer is.
// The rules themselves are in `hunt/`, which is pure.

import { castDraft, produce } from 'immer';
import { cleanName } from '@/city/character';
import { tuning } from '@/config/tuning';
import {
  type GateScene,
  gateDelete,
  gateEnter,
  gateScene,
  gateState,
  gateType,
  newGateScene,
} from '@/hunt/gate';
import { partTwoOn } from '@/hunt/switch';
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
        }),
        events: result.events,
      };
    }
    return result;
  };
}
