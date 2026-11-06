import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { hr } from '@/content/text/hr';
import { summarize } from '@/playlog/log';
import { LukaView, RestoreView } from '@/ui/luka/LukaView';

const at = (minute: number) => new Date(Date.UTC(2026, 10, 6, 10, minute)).toISOString();
const noop = () => undefined;

describe('Luka’s view (story 2.11)', () => {
  it('shows sessions, each room’s dates, ways and predictions, and the latest wrong lines', () => {
    const summary = summarize([
      { type: 'session', at: at(0) },
      { type: 'room', roomId: 'r04', action: 'enter', at: at(1) },
      { type: 'way', roomId: 'r04', way: 'balance', at: at(2) },
      { type: 'line', roomId: 'r04', ok: false, text: 'x = 18', at: at(3) },
      { type: 'room', roomId: 'r04', action: 'done', at: at(4) },
    ]);
    const html = renderToString(
      <LukaView
        summary={summary}
        notSaving={false}
        makeBackupLink={async () => ''}
        exportLog={noop}
        onBack={noop}
      />,
    );
    expect(html).toContain(hr.luka.title);
    expect(html).toContain(hr.map.nodes.r04);
    expect(html).toContain(`${hr.luka.wayNames.balance} 1`);
    expect(html).toContain('x = 18');
    expect(html).toContain(hr.luka.backupMake);
    expect(html).toContain(hr.luka.exportLog);
    expect(html).not.toContain(hr.luka.notSaving);
  });

  it('says when the device isn’t saving, and has nothing to show before any play', () => {
    const html = renderToString(
      <LukaView
        summary={summarize([])}
        notSaving
        makeBackupLink={async () => ''}
        exportLog={noop}
        onBack={noop}
      />,
    );
    expect(html).toContain(hr.luka.notSaving);
    expect(html).toContain(hr.luka.sessionsNone);
    expect(html).toContain(hr.luka.latestNone);
  });
});

describe('restoring a backup link (story 2.11)', () => {
  it('shows both saves and asks before replacing the one on this device', () => {
    const html = renderToString(
      <RestoreView incoming={4} current={2} failed={false} onAccept={noop} onDecline={noop} />,
    );
    expect(html).toContain(hr.luka.restore.incoming(4));
    expect(html).toContain(hr.luka.restore.current(2));
    expect(html).toContain(hr.luka.restore.accept);
    expect(html).toContain(hr.luka.restore.decline);
  });

  it('says when there’s no save here, and refuses a broken link', () => {
    expect(
      renderToString(
        <RestoreView incoming={3} current={null} failed={false} onAccept={noop} onDecline={noop} />,
      ),
    ).toContain(hr.luka.restore.noCurrent);
    const broken = renderToString(
      <RestoreView incoming={null} current={2} failed={false} onAccept={noop} onDecline={noop} />,
    );
    expect(broken).toContain(hr.luka.restore.broken);
    expect(broken).not.toContain(hr.luka.restore.accept);
  });
});
