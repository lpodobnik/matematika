// Sound (story 6.2; architecture, Pattern 4 and Audio Architecture; GDD, Audio and Music):
// effects for what happens on the machine, and the restored machines' loops in the town.
// It listens to domain events only, and keeps the engine in step with the mute setting on
// every one, so a save read at launch mutes the game before anything can sound.

import { type LoopLevels, loopLevels, sameLevels } from '@/audio/ambience';
import type { AudioEngine, SoundId } from '@/audio/index';
import type { AreaId } from '@/content/town';
import { isRoomId } from '@/room/resume';
import type { RoomId } from '@/room/types';
import type { Effect } from '@/store/effects/types';
import type { DomainEvent } from '@/store/events';

/** The effect an event plays, or null for a silent one. */
export function soundOf(event: DomainEvent): SoundId | null {
  switch (event.type) {
    case 'DialNotch':
      return 'tick';
    case 'PansLevel':
      return 'thunk';
    case 'MachineJammed':
      return 'hiss';
    case 'StageLocked':
      return 'latch';
    case 'RoomRestarted':
      return 'restart';
    case 'PredictionMade':
      return event.right ? 'chime' : null;
    case 'DiceRolled':
      return 'rattle';
    case 'StrikeLanded':
      return 'clank';
    case 'FightEnded':
      return event.won ? 'chime' : 'hiss';
    case 'UpgradeBought':
      return 'chime';
    case 'GateOpened':
      return 'restart';
    case 'DoorKnocked':
      return event.right ? 'latch' : 'thunk';
    case 'LeadFinished':
      return 'chime';
    default:
      return null;
  }
}

/** The part of the engine the effect drives. */
export type SoundOut = Pick<AudioEngine, 'play' | 'setMuted' | 'setLoops'>;

/**
 * The audio effect over `engine`. It remembers the street on screen (`TownAreaShown`) and the
 * room whose restart is playing: from `RoomRestarted` its loop comes forward on its own,
 * through the story card, until the town or another room takes over.
 */
export function createAudioEffect(engine: SoundOut): Effect {
  let area: AreaId | null = null;
  let focus: RoomId | null = null;
  let levels: LoopLevels = {};
  return (event, state) => {
    engine.setMuted(state.save.settings.muted);
    if (state.ui.screen === 'loading') return;
    const sound = soundOf(event);
    if (sound) engine.play(sound);
    focus = focusAfter(event, focus);
    if (event.type === 'TownAreaShown') area = event.area;
    const next = loopLevels({ done: state.save.progress.roomsDone, area, focus });
    if (sameLevels(next, levels)) return;
    levels = next;
    engine.setLoops(next);
  };
}

/** The restarting room after an event: set by its restart, ended by the town or a room. */
function focusAfter(event: DomainEvent, focus: RoomId | null): RoomId | null {
  if (event.type === 'RoomRestarted') return isRoomId(event.roomId) ? event.roomId : null;
  if (event.type === 'TownAreaShown' && event.area !== null) return null;
  if (event.type === 'StageArrived' || event.type === 'FightStarted') return null;
  return focus;
}
