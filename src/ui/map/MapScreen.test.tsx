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

function board(done: string[], started: string[] = [], fresh: string | null = null) {
  const view = mapView(districtMap, { roomsDone: done, started, fresh }, authored);
  return renderToString(<MapBoard view={view} onTravel={() => undefined} />);
}

const buttons = (html: string) => [...html.matchAll(/<button[^>]*>/g)].map((match) => match[0]);

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

  it('pulses the next room and blooms the one just restored', () => {
    const html = board(['r01'], [], 'r01');
    expect(html).toContain('map__pulse');
    expect(html).toMatch(/data-state="restored" data-next="false" data-fresh="true"/);
  });

  it('shows the "to be continued" note once every room so far is restored', () => {
    expect(board(['r01', 'r02', 'r03'])).not.toContain(hr.app.toBeContinued);
    expect(board(['r01', 'r02', 'r03', 'r04'])).toContain(hr.app.toBeContinued);
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
