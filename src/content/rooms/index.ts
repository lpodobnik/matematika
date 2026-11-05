import type { RoomSpec } from '@/room/types';
import { r01 } from './r01-door-lift';
import { r02 } from './r02-street-lamps';

/**
 * Every authored room, in play order: when a room's restart ends, the next one here loads.
 * Rooms 3 and 4 join in stories 1.9–1.11.
 */
export const rooms: readonly RoomSpec[] = [r01, r02];
