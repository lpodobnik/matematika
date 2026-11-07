import { describe, expect, it } from 'vitest';
import { r08 } from '@/content/rooms/r08-tram';
import { r12 } from '@/content/rooms/r12-junction';
import { linkedView } from '@/room/linked';
import { enterRoom } from '@/room/room';

describe('linked machines (story 4.7)', () => {
  it('shows the next machine waiting for this answer, then the answer in it', () => {
    expect(linkedView(enterRoom(r12, 0).room)).toEqual({
      role: 'feeds',
      template: '3x + ☐ = 19',
      value: null,
    });
    expect(linkedView(enterRoom(r12, 1).room)).toEqual({
      role: 'fed',
      template: '3x + ☐ = 19',
      value: 4,
    });
  });

  it('shows nothing in a room without linked machines', () => {
    expect(linkedView(enterRoom(r08).room)).toBeNull();
    expect(linkedView(null)).toBeNull();
  });
});
