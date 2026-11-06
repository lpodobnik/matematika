import type { RoomSpec } from '@/room/types';
import { r01 } from './r01-door-lift';
import { r02 } from './r02-street-lamps';
import { r03 } from './r03-sluice-gate';

/**
 * Every authored room, in play order: when a room's restart ends, the next one here loads.
 * Room 4 joins in stories 1.10–1.11.
 */
export const rooms: readonly RoomSpec[] = [r01, r02, r03];
