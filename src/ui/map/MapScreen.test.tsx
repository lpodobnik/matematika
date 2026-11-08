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
    // The 19 nodes, less the four automatons, who stand in their streets.
    expect(all).toHaveLength(15);
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
    // The automatons stand in their streets, not on the map.
    expect(html).not.toContain(hr.map.nodes['lair-20']);
    expect(html).not.toContain('data-kind="lair"');
  });

  it('pulses the next room and blooms the one just restored', () => {
    const html = board(['r01'], [], 'r01');
    expect(html).toContain('map__pulse');
    expect(html).toMatch(/data-state="restored" data-next="false" data-fresh="true"/);
  });

  it('shows the "to be continued" note once every room so far is restored', () => {
    expect(board(['r01', 'r02', 'r03', 'r04', 'r05', 'r06'])).not.toContain(hr.app.toBeContinued);
    expect(board(authored.slice(0, -1))).not.toContain(hr.app.toBeContinued);
    expect(board(authored)).toContain(hr.app.toBeContinued);
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
    // The workshop opens into the old mechanic’s counter (story 3.5).
    expect(html).toContain(`aria-label="${hr.map.nodes.workshop}, ${hr.map.states.open}"`);
    expect(html).toContain(`aria-label="${hr.map.nodes.foundry}, ${hr.map.states.locked}"`);
    expect(html).toContain('5 · x = 40');
  });
});

describe('torn pages on the map (story 3.4)', () => {
  it('shows the pages button only once a fight has returned a page', () => {
    const view = mapView(
      districtMap,
      { roomsDone: ['r01', 'r02'], tools: [], started: [], fresh: null },
      authored,
    );
    const none = renderToString(<MapBoard view={view} onTravel={() => undefined} />);
    expect(none).not.toContain(`aria-label="${hr.pages.open}"`);
    const some = renderToString(
      <MapBoard view={view} pages={['page-1']} onTravel={() => undefined} />,
    );
    expect(some).toContain(`aria-label="${hr.pages.open}"`);
  });
});

describe('parts on the map (story 3.6)', () => {
  it('shows his parts once he has any', () => {
    const view = mapView(
      districtMap,
      { roomsDone: ['r01', 'r02'], tools: [], started: [], fresh: null },
      authored,
    );
    const none = renderToString(<MapBoard view={view} onTravel={() => undefined} />);
    expect(none).not.toContain('class="parts-counter"');
    const some = renderToString(<MapBoard view={view} parts={14} onTravel={() => undefined} />);
    expect(some).toContain(`aria-label="${hr.parts.label}: 14"`);
  });
});
