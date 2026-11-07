import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { rooms } from '@/content/rooms';
import { r02 } from '@/content/rooms/r02-street-lamps';
import DevPanel, { DevPanelView, type DevPanelViewProps } from '@/dev/DevPanel';
import { devReadout, jumpTargets, qualityReadout } from '@/dev/dev-view';
import { enterRoom } from '@/room/room';
import { initialQuality } from '@/store/quality';

afterEach(() => {
  vi.unstubAllGlobals();
});

function view(overrides: Partial<DevPanelViewProps> = {}): string {
  return renderToString(
    <DevPanelView
      readout={devReadout(enterRoom(r02, 1).room)}
      quality={qualityReadout(initialQuality)}
      targets={jumpTargets(rooms)}
      balance={false}
      profiling={false}
      onJump={vi.fn()}
      onToggleBalance={vi.fn()}
      onForceQuality={vi.fn()}
      onProfile={vi.fn()}
      onNewGame={vi.fn()}
      onClose={vi.fn()}
      {...overrides}
    />,
  );
}

/** The quality buttons as rendered: label and whether it shows pressed. */
function qualityButtons(html: string): [string, string][] {
  const legend = html.indexOf('force quality until reload');
  const section = html.slice(legend, html.indexOf('</fieldset>', legend));
  return [...section.matchAll(/aria-pressed="(true|false)"[^>]*>([a-z]+)</g)].map((m) => [
    m[2] ?? '',
    m[1] ?? '',
  ]);
}

describe('the dev panel', () => {
  it('stays closed without ?dev or the backtick', () => {
    vi.stubGlobal('window', { location: { search: '' } });
    expect(renderToString(<DevPanel />)).toBe('');
  });

  it('opens with ?dev', () => {
    vi.stubGlobal('window', { location: { search: '?dev' } });
    expect(renderToString(<DevPanel />)).toContain('class="dev-panel"');
  });

  it('shows the place, the last line with its tuple, and a jump to every room and stage', () => {
    const html = view();
    expect(html).toContain('r02 · stage 2 of 2 · arrive');
    expect(html).toContain('x : 3 = 5');
    expect(html).toContain('(1, 1, 0)');
    for (const label of ['r01 · 1', 'r02 · 1', 'r02 · 2', 'r04 · 1']) {
      expect(html).toContain(`>${label}<`);
    }
  });

  it('shows the pans and the tray, and switches Balance on or off', () => {
    const html = (balance: boolean) => view({ targets: [], balance });
    expect(html(false)).toContain('x : 3 = 5');
    expect(html(false)).toContain('<dd>off</dd>');
    expect(html(false)).toContain('aria-pressed="false"');
    expect(html(false)).toMatch(/balance (<!-- -->)?off/);
    expect(html(true)).toContain('aria-pressed="true"');
    expect(html(true)).toMatch(/balance (<!-- -->)?on/);
  });

  it('shows the quality setting and the frame test', () => {
    const html = view({
      quality: qualityReadout({ measured: 'medium', measuredMs: 21.4, forced: null }),
    });
    expect(html).toContain('medium · from the test');
    expect(html).toContain('p95 21.4 ms → medium');
  });

  it('offers auto and each setting, with auto pressed until one is forced', () => {
    expect(qualityButtons(view())).toEqual([
      ['auto', 'true'],
      ['high', 'false'],
      ['medium', 'false'],
      ['low', 'false'],
    ]);
    const forced = view({
      quality: qualityReadout({ measured: 'high', measuredMs: 12, forced: 'low' }),
    });
    expect(qualityButtons(forced)).toEqual([
      ['auto', 'false'],
      ['high', 'false'],
      ['medium', 'false'],
      ['low', 'true'],
    ]);
    expect(forced).toContain('low · forced');
  });

  it('offers the tablet profile, three copies of room 4, pressed while they show', () => {
    /** The profile button as rendered: whether it shows pressed, and its text. */
    const button = (html: string) => {
      const found = html
        .replaceAll('<!-- -->', '')
        .match(/aria-pressed="(true|false)"[^>]*>(profile[^<]*)<\/button>/);
      return [found?.[1], found?.[2]];
    };
    expect(button(view({ profiling: false }))).toEqual(['false', 'profile: 3 × r04 off']);
    expect(button(view({ profiling: true }))).toEqual(['true', 'profile: 3 × r04 on']);
  });

  it('offers the fights’ tools: parts, a fixed seed, and waking the lairs (epic 3)', () => {
    const noop = () => undefined;
    const fights = { parts: 12, seed: null, onParts: noop, onSeed: noop, onWake: noop };
    const html = view({ fights }).replaceAll('<!-- -->', '');
    expect(html).toContain('fights: 12 parts, seed random');
    for (const label of ['+10 parts', '+50 parts', '0 parts', 'seed random', 'wake lairs']) {
      expect(html).toContain(`>${label}</button>`);
    }
    expect(view({ fights: { ...fights, seed: 1 } }).replaceAll('<!-- -->', '')).toContain(
      '>seed fixed</button>',
    );
  });
});
