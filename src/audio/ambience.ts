// Which machine loops play, and how loud (GDD, Audio and Music; architecture, Audio
// Architecture: "the map plays all restored loops quietly; a room brings its own loop
// forward"). Pure: no Web Audio here.

import { actLayerIds, type LoopId, loopIds } from '@/audio/loops';
import { type AreaId, areaOf } from '@/content/town';
import { type RoomId, roomIds } from '@/room/types';

/** A loop's level, 0–1, by room or part 2's act layer; one not listed is silent. */
export type LoopLevels = Partial<Record<LoopId, number>>;

/** Part 2's music, under the machines heard from afar. */
export const ACT_LEVEL = 0.8;

/** The upper district, where part 2's music plays. */
const upper: readonly AreaId[] = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'toolroom'];

/** The restored machines of the street he stands in. */
export const AREA_LEVEL = 1;
/** Every other restored machine in the district, heard from afar. */
export const DISTRICT_LEVEL = 0.22;

export interface Soundscape {
  /** Rooms restored, in any order. */
  done: readonly RoomId[];
  /** The town street on screen, or null off the town (a room, a fight, a card). */
  area: AreaId | null;
  /**
   * The room whose restart is playing, or null: its loop comes forward on its own, and room
   * 13's brings every machine in at once (the GDD's climax: every machine sounding together).
   */
  focus: RoomId | null;
  /** Part 2's acts he has reached, 0–4: that many layers play in the upper district. */
  acts?: number;
}

/** The loops to play: none in a room or a fight, the town's restored machines in the town. */
export function loopLevels({ done, area, focus, acts = 0 }: Soundscape): LoopLevels {
  if (focus === 'r13') {
    return Object.fromEntries(roomIds.map((id) => [id, AREA_LEVEL]));
  }
  if (focus) return { [focus]: AREA_LEVEL };
  if (!area) return {};
  const levels: LoopLevels = {};
  for (const id of roomIds) {
    if (!done.includes(id)) continue;
    levels[id] = areaOf(id) === area ? AREA_LEVEL : DISTRICT_LEVEL;
  }
  if (upper.includes(area)) {
    for (const id of actLayerIds.slice(0, Math.max(0, Math.min(acts, actLayerIds.length)))) {
      levels[id] = ACT_LEVEL;
    }
  }
  return levels;
}

/** Whether two sets of levels are the same, so the engine is told only of a change. */
export function sameLevels(a: LoopLevels, b: LoopLevels): boolean {
  return loopIds.every((id) => (a[id] ?? 0) === (b[id] ?? 0));
}
