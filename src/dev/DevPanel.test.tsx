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
      onJump={vi.fn()}
      onForceQuality={vi.fn()}
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
    for (const label of ['r01 · 1', 'r02 · 1', 'r02 · 2']) expect(html).toContain(`>${label}<`);
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
});
