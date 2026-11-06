import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { mapView } from '@/city/reach';
import { districtMap } from '@/content/map';
import { rooms } from '@/content/rooms';
import { hr } from '@/content/text/hr';
import { MapBoard } from '@/ui/map/MapScreen';

const authored = rooms.map((room) => room.id);
const css = readFileSync(new URL('./map.css', import.meta.url), 'utf8');

const toolsAfter = (done: string[]) => (done.includes('r03') ? ['balance'] : []);

function board(done: string[], started: string[] = [], fresh: string | null = null) {
  const view = mapView(
    districtMap,
    { roomsDone: done, tools: toolsAfter(done), started, fresh },
    authored,
  );
  return renderToString(<MapBoard view={view} onTravel={() => undefined} />);
}

const buttons = (html: string) =>
  [...html.matchAll(/<button[^>]*class="map__node"[^>]*>/g)].map((match) => match[0]);

describe('the map screen (story 2.2)', () => {
  it('draws every node as a button, with only the rooms he can reach enabled', () => {
    const html = board(['r01']);
    const all = buttons(html);
    expect(all).toHaveLength(19);
    expect(all.filter((button) => !button.includes('disabled'))).toHaveLength(2);
    expect(html).toContain(hr.map.title);
  });

  it('names the rooms he can reach, and leaves the closed ones unnamed', () => {
    const html = board(['r01']);
    expect(html).toContain(`>${hr.map.nodes.r01}<`);
    expect(html).toContain(`>${hr.map.nodes.r02}<`);
    expect(html).not.toContain(`>${hr.map.nodes.r05}<`);
    // Not to a screen reader either.
    expect(html).not.toContain(hr.map.nodes.r05);
    expect(html).toContain(`aria-label="${hr.map.states.closed}"`);
  });

  it('says a node’s state to a screen reader, and when a room was left halfway', () => {
    const html = board(['r01'], ['r02']);
    expect(html).toContain(`aria-label="${hr.map.nodes.r01}, ${hr.map.states.restored}"`);
    expect(html).toContain(
      `aria-label="${hr.map.nodes.r02}, ${hr.map.states.open}, ${hr.map.started}"`,
    );
  });

  it('names a place he can see but not open, shows its lock, and takes no tap (story 2.3)', () => {
    const html = board(['r01', 'r02']);
    const bridge = buttons(html).find((button) => button.includes(`${hr.map.nodes.r05},`));
    expect(bridge).toContain(`aria-label="${hr.map.nodes.r05}, ${hr.map.states.locked}"`);
    expect(bridge).toContain('disabled');
    expect(bridge).toContain('data-state="locked"');
    expect(html).toContain(`>${hr.map.nodes.r05}<`);
    expect(html).toContain('map__lock');
    // The lair beside room 2 shows, named, and opens into a fight (story 3.1).
    expect(html).toContain(`aria-label="${hr.map.nodes['lair-20']}, ${hr.map.states.open}"`);
  });

  it('pulses the next room and blooms the one just restored', () => {
    const html = board(['r01'], [], 'r01');
    expect(html).toContain('map__pulse');
    expect(html).toMatch(/data-state="restored" data-next="false" data-fresh="true"/);
  });

  it('shows the "to be continued" note once every room so far is restored', () => {
    expect(board(['r01', 'r02', 'r03', 'r04', 'r05', 'r06'])).not.toContain(hr.app.toBeContinued);
    expect(board(['r01', 'r02', 'r03', 'r04', 'r05', 'r06', 'r07'])).toContain(
      hr.app.toBeContinued,
    );
  });

  it('keeps every node at least 48 CSS px, and still under reduced motion', () => {
    expect(css).toMatch(/\.map__glyph \{[^}]*width: max\(56px/);
    expect(css).toMatch(/max-height: 499\.98px\)[^@]*width: max\(48px/);
    const reduced = css.slice(css.indexOf('prefers-reduced-motion'));
    for (const name of ['glyph__water', 'glyph__turning', 'map__pulse', 'data-fresh']) {
      expect(reduced).toContain(name);
    }
  });
});

describe('room 5 on the map (story 2.8)', () => {
  it('draws the bridge with its deck raised, then lowered and lit once restored', () => {
    const open = board(['r01', 'r02', 'r03', 'r04']);
    const done = board(['r01', 'r02', 'r03', 'r04', 'r05']);
    expect(open).toContain(`aria-label="${hr.map.nodes.r05}, ${hr.map.states.open}"`);
    expect(done).toContain(`aria-label="${hr.map.nodes.r05}, ${hr.map.states.restored}"`);
    expect(done.match(/glyph__lit/g)?.length ?? 0).toBeGreaterThan(
      open.match(/glyph__lit/g)?.length ?? 0,
    );
  });
});

describe('room 6 on the map (story 2.9)', () => {
  it('opens the workshop’s gate and shows the foundry’s plate once the weighing yard is restored', () => {
    const view = mapView(
      districtMap,
      {
        roomsDone: ['r01', 'r02', 'r03', 'r04', 'r05', 'r06'],
        tools: ['balance', 'workshop'],
        started: [],
        fresh: null,
      },
      authored,
    );
    const html = renderToString(<MapBoard view={view} onTravel={() => undefined} />);
    expect(html).toContain(`aria-label="${hr.map.nodes.r06}, ${hr.map.states.restored}"`);
    expect(html).toContain(`aria-label="${hr.map.nodes.workshop}, ${hr.map.states.seen}"`);
    expect(html).toContain(`aria-label="${hr.map.nodes.foundry}, ${hr.map.states.locked}"`);
    expect(html).toContain('5 · x = 40');
  });
});

describe('lairs on the map screen (story 3.3)', () => {
  it('shows a winding-down lair off, with when it wakes, and the pile left at a lair', () => {
    const view = mapView(
      districtMap,
      {
        roomsDone: ['r01', 'r02'],
        tools: [],
        started: [],
        fresh: null,
        asleep: ['lair-20'],
        piles: { 'lair-20': 3 },
      },
      authored,
    );
    const html = renderToString(
      <MapBoard view={view} wakes={{ 'lair-20': 12 }} onTravel={() => undefined} />,
    );
    const lair = buttons(html).find((b) => b.includes('data-node="lair-20"')) ?? '';
    expect(lair).toContain('disabled');
    expect(lair).toContain('data-state="winding"');
    expect(lair).toContain(
      `aria-label="${hr.map.nodes['lair-20']}, ${hr.map.states.winding}, ${hr.map.wakes(12)}, ${hr.map.pile(3)}"`,
    );
    expect(html).toContain(`>${hr.map.wakes(12)}<`);
    expect(html).toContain('class="map__pile"');
  });
});
