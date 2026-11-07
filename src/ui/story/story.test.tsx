import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { mapView } from '@/city/reach';
import { districtMap } from '@/content/map';
import { rooms } from '@/content/rooms';
import { hr } from '@/content/text/hr';
import { ideaIds, type RoomId, roomIds } from '@/room/types';
import { MapBoard } from '@/ui/map/MapScreen';
import { lineText, storyLines } from '@/ui/story/StoryLines';
import { StoryCard } from '@/ui/story/StoryScreen';

// The widest letters, at the name's longest.
const longestName = 'W'.repeat(16);

describe('the story lines (hr.story, story 2.5)', () => {
  it('has one or two lines for each room in content, and none for rooms still to come', () => {
    const playable = new Set<string>(rooms.map((room) => room.id));
    for (const id of roomIds) {
      if (!playable.has(id)) {
        expect(storyLines(id), id).toEqual([]);
        continue;
      }
      expect(storyLines(id).length, id).toBeGreaterThanOrEqual(1);
      expect(storyLines(id).length, id).toBeLessThanOrEqual(2);
    }
    // Every room he can play has lines.
    for (const room of rooms) {
      expect(storyLines(room.id as RoomId).length, room.id).toBeGreaterThan(0);
    }
  });

  it('keeps every line to a tablet bubble, about 80 characters, even with the longest name', () => {
    for (const id of roomIds) {
      for (const line of storyLines(id)) {
        expect(
          lineText(line, longestName).length,
          `${id}: ${lineText(line, longestName)}`,
        ).toBeLessThanOrEqual(80);
      }
    }
  });

  it('gives the First Automaton capitals only, and Penkala alone his dialect', () => {
    for (const id of roomIds) {
      for (const line of storyLines(id)) {
        const text = lineText(line, 'Ivo');
        if (line.who === 'automaton') expect(text, id).toBe(text.toUpperCase());
        if (line.who !== 'penkala') expect(text, id).not.toMatch(/\bKaj\b/);
      }
    }
  });

  it('never praises him (NFR13)', () => {
    // Praise words, with the letter c-caron built from its code (Croatian text stays in hr.ts).
    const c = String.fromCharCode(0x10d);
    const praise = new RegExp(
      `bravo|svaka ${c}ast|odli${c}no|super|genij|pametn|majstorski|tako je|to${c}no`,
      'i',
    );
    for (const id of roomIds) {
      for (const line of storyLines(id)) expect(lineText(line, 'Ivo'), id).not.toMatch(praise);
    }
  });

  it('puts his name in the lines that take it', () => {
    expect(storyLines('r02').some((line) => lineText(line, 'Lana').includes('Lana'))).toBe(true);
  });
});

describe('the story card and the city’s log (story 2.5)', () => {
  it('shows the room, who speaks, the lines with his name, and Dalje', () => {
    const html = renderToString(<StoryCard room="r02" name="Lana" onNext={() => undefined} />);
    expect(html).toContain(hr.map.nodes.r02);
    expect(html).toContain(hr.story.speakers.penkala);
    expect(html).toContain(hr.story.speakers.nikola);
    expect(html).toContain('Lana');
    expect(html).toContain(hr.story.next);
  });

  it('marks Kristijan’s note and the First Automaton’s notice for their own look', () => {
    expect(renderToString(<StoryCard room="r07" name="Ivo" onNext={() => undefined} />)).toContain(
      'data-who="kristijan"',
    );
    expect(renderToString(<StoryCard room="r05" name="Ivo" onNext={() => undefined} />)).toContain(
      'data-who="automaton"',
    );
  });

  it('lists every room he has been told, in order, on the map’s log', () => {
    const view = mapView(
      districtMap,
      { roomsDone: ['r01', 'r02'], tools: [], started: [], fresh: null },
      rooms.map((room) => room.id),
    );
    const html = renderToString(
      <MapBoard view={view} told={['r01', 'r02']} name="Ivo" onTravel={() => undefined} logOpen />,
    );
    expect(html).toContain(hr.story.log.open);
    expect(html.indexOf(hr.map.nodes.r01, html.indexOf('map__log'))).toBeLessThan(
      html.indexOf(hr.map.nodes.r02, html.indexOf('map__log')),
    );
    expect(html).toContain(lineText(storyLines('r02')[0] as never, 'Ivo'));
    const empty = renderToString(<MapBoard view={view} onTravel={() => undefined} logOpen />);
    expect(empty).toContain(hr.story.log.empty);
  });
});

describe('explanation cards (hr.ideas, story 2.6)', () => {
  it('has a school term and one or two sentences for every idea, none praising him', () => {
    const c = String.fromCharCode(0x10d);
    const praise = new RegExp(`bravo|svaka ${c}ast|odli${c}no|super|genij|pametn|tako je`, 'i');
    for (const idea of ideaIds) {
      const card = hr.ideas.cards[idea];
      expect(card.term.length, idea).toBeGreaterThan(0);
      const sentences = card.text.split(/[.!?](?:\s|$)/).filter((part) => part.trim() !== '');
      expect(sentences.length, `${idea}: ${card.text}`).toBeLessThanOrEqual(2);
      expect(card.text.length, idea).toBeLessThanOrEqual(110);
      expect(card.text, idea).not.toMatch(praise);
    }
  });

  it('shows Nikola’s question and the card after the room’s lines, and in the log', () => {
    const html = renderToString(
      <StoryCard room="r04" name="Ivo" ideas={['balance', 'split']} onNext={() => undefined} />,
    );
    expect(html).toContain(hr.ideas.ask);
    expect(html).toContain(hr.ideas.cards.balance.term);
    expect(html).toContain(hr.ideas.cards.split.text);
    expect(html.indexOf(hr.ideas.ask)).toBeGreaterThan(html.indexOf(hr.story.speakers.penkala));
    const none = renderToString(<StoryCard room="r04" name="Ivo" onNext={() => undefined} />);
    expect(none).not.toContain(hr.ideas.ask);
    const view = mapView(
      districtMap,
      { roomsDone: ['r01'], tools: [], started: [], fresh: null },
      rooms.map((room) => room.id),
    );
    const log = renderToString(
      <MapBoard view={view} told={['r01']} seen={['equal']} onTravel={() => undefined} logOpen />,
    );
    expect(log).toContain(hr.ideas.cards.equal.term);
  });
});
