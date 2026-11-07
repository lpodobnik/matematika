import type { RoomSpec } from '@/room/types';
import { r01 } from './r01-door-lift';
import { r02 } from './r02-street-lamps';
import { r03 } from './r03-sluice-gate';
import { r04 } from './r04-water-wheel';
import { r05 } from './r05-bridge';
import { r06 } from './r06-weighing-yard';
import { r07 } from './r07-old-logbook';
import { r08 } from './r08-tram';

/**
 * Every authored room, in play order: when a room's restart ends, the next one here loads.
 * The last room so far is followed by the map's "to be continued" note.
 */
export const rooms: readonly RoomSpec[] = [r01, r02, r03, r04, r05, r06, r07, r08];
