import type { RoomSpec } from '@/room/types';
import { r01 } from './r01-door-lift';
import { r02 } from './r02-street-lamps';
import { r03 } from './r03-sluice-gate';
import { r04 } from './r04-water-wheel';
import { r05 } from './r05-bridge';
import { r06 } from './r06-weighing-yard';
import { r07 } from './r07-old-logbook';

/**
 * Every authored room, in play order: when a room's restart ends, the next one here loads.
 * Room 7 is the last for now (story 2.10): after its restart the map shows "to be continued".
 */
export const rooms: readonly RoomSpec[] = [r01, r02, r03, r04, r05, r06, r07];
