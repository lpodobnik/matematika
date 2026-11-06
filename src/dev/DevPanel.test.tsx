import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { rooms } from '@/content/rooms';
import { r02 } from '@/content/rooms/r02-street-lamps';
import DevPanel, { DevPanelView } from '@/dev/DevPanel';
import { devReadout, jumpTargets } from '@/dev/dev-view';
import { enterRoom } from '@/room/room';

afterEach(() => {
  vi.unstubAllGlobals();
});

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
    const html = renderToString(
      <DevPanelView
        readout={devReadout(enterRoom(r02, 1).room)}
        targets={jumpTargets(rooms)}
        balance={false}
        onJump={vi.fn()}
        onToggleBalance={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(html).toContain('r02 · stage 2 of 2 · arrive');
    expect(html).toContain('x : 3 = 5');
    expect(html).toContain('(1, 1, 0)');
    for (const label of ['r01 · 1', 'r02 · 1', 'r02 · 2', 'r04 · 1']) {
      expect(html).toContain(`>${label}<`);
    }
  });

  it('shows the pans and the tray, and switches Balance on or off', () => {
    const html = (balance: boolean) =>
      renderToString(
        <DevPanelView
          readout={devReadout(enterRoom(r02, 1).room)}
          targets={[]}
          balance={balance}
          onJump={vi.fn()}
          onToggleBalance={vi.fn()}
          onClose={vi.fn()}
        />,
      );
    expect(html(false)).toContain('x : 3 = 5');
    expect(html(false)).toContain('<dd>off</dd>');
    expect(html(false)).toContain('aria-pressed="false"');
    expect(html(false)).toMatch(/balance (<!-- -->)?off/);
    expect(html(true)).toContain('aria-pressed="true"');
    expect(html(true)).toMatch(/balance (<!-- -->)?on/);
  });
});
