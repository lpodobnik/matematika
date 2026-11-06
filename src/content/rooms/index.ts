import type { RoomSpec } from '@/room/types';
import { r01 } from './r01-door-lift';
import { r02 } from './r02-street-lamps';
import { r03 } from './r03-sluice-gate';
import { r04 } from './r04-water-wheel';
import { r05 } from './r05-bridge';

/**
 * Every authored room, in play order: when a room's restart ends, the next one here loads.
 * Room 5 is the last for now (story 2.8): after its restart the map shows "to be continued".
 */
export const rooms: readonly RoomSpec[] = [r01, r02, r03, r04, r05];
