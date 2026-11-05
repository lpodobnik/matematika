// Every action the store accepts, named `domain/verb` (architecture, Naming Conventions).

import type { RoomId } from '@/room/types';

export type Action = { type: 'room/enter'; roomId: RoomId };
