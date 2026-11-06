import { describe, expect, it } from 'vitest';
import { rooms } from '@/content/rooms';
import { ideasByRoom, newIdeas } from '@/room/ideas';
import { ideaIds, type RoomSpec } from '@/room/types';

describe('explanation cards’ ideas (room/ideas.ts, story 2.6)', () => {
  it('gives rooms 1–4 their ideas: equal, the notch, a prediction, Balance and a split', () => {
    const of = (id: string) => rooms.find((room) => room.id === id)?.ideas;
    expect(of('r01')).toEqual(['equal']);
    expect(of('r02')).toEqual(['notch']);
    expect(of('r03')).toEqual(['prediction']);
    expect(of('r04')).toEqual(['balance', 'split']);
    for (const room of rooms) {
      for (const idea of room.ideas ?? []) expect(ideaIds, room.id).toContain(idea);
    }
  });

  it('explains only what he hasn’t seen, each once', () => {
    expect(newIdeas(['balance', 'split'], [])).toEqual(['balance', 'split']);
    expect(newIdeas(['prediction', 'balance'], ['prediction'])).toEqual(['balance']);
    expect(newIdeas(['split', 'split'], [])).toEqual(['split']);
  });

  it('puts each seen idea under the first told room that uses it, for the log', () => {
    const list: Pick<RoomSpec, 'id' | 'ideas'>[] = [
      { id: 'r04', ideas: ['balance', 'split'] },
      { id: 'r05', ideas: ['prediction', 'balance'] },
      { id: 'r03', ideas: ['prediction'] },
    ];
    // Room 5 before room 4 and room 3: it explains both of its ideas.
    const byRoom = ideasByRoom(['r05', 'r04', 'r03'], ['prediction', 'balance', 'split'], list);
    expect(byRoom.get('r05')).toEqual(['prediction', 'balance']);
    expect(byRoom.get('r04')).toEqual(['split']);
    expect(byRoom.get('r03')).toEqual([]);
  });
});
