import type { RoomSpec } from '@/room/types';
import { r01 } from './r01-door-lift';
import { r02 } from './r02-street-lamps';
import { r03 } from './r03-sluice-gate';
import { r04 } from './r04-water-wheel';

/**
 * Every authored room, in play order: when a room's restart ends, the next one here loads.
 * Room 4 is the last for now: after its restart the placeholder "to be continued" screen
 * shows (story 1.13), until the map takes its place in epic 2.
 */
export const rooms: readonly RoomSpec[] = [r01, r02, r03, r04];
