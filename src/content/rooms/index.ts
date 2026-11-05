import type { RoomSpec } from '@/room/types';
import { r01 } from './r01-door-lift';

/** Every authored room, in play order. Rooms 2–4 join in stories 1.8–1.11. */
export const rooms: readonly RoomSpec[] = [r01];
