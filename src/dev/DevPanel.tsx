import '@/dev/dev-panel.css';
import { useEffect, useMemo, useState } from 'react';
import { rooms } from '@/content/rooms';
import {
  type DevReadout,
  devReadout,
  isToggleKey,
  type JumpTarget,
  jumpTargets,
  type LineReadout,
  opensOnLoad,
  toggledBalance,
} from '@/dev/dev-view';
import { useGame } from '@/store/store';

/**
 * The dev panel (architecture, Debug Tools): opened with `?dev` in the address or the
 * backtick key, which also closes it. Development builds only: App loads this module on
 * demand behind `import.meta.env.DEV`, so production builds never contain it. Later
 * stories add their controls here (story 1.12: forcing a quality setting).
 */
export default function DevPanel() {
  const [open, setOpen] = useState(() => opensOnLoad(window.location.search));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isToggleKey(event)) return;
      event.preventDefault();
      setOpen((wasOpen) => !wasOpen);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return open ? <DevPanelLive onClose={() => setOpen(false)} /> : null;
}

/** The open panel, reading the store. */
function DevPanelLive({ onClose }: { onClose(): void }) {
  const room = useGame((s) => s.room);
  const tools = useGame((s) => s.save.progress.tools);
  const dispatch = useGame((s) => s.dispatch);
  const readout = useMemo(() => (room ? devReadout(room, tools) : null), [room, tools]);
  const targets = useMemo(() => jumpTargets(rooms), []);
  return (
    <DevPanelView
      readout={readout}
      targets={targets}
      balance={tools.includes('balance')}
      onJump={(target) =>
        dispatch({ type: 'room/enter', roomId: target.roomId, stage: target.stage })
      }
      onToggleBalance={() => dispatch({ type: 'dev/set-tools', tools: toggledBalance(tools) })}
      onClose={onClose}
    />
  );
}

export interface DevPanelViewProps {
  readout: DevReadout | null;
  targets: readonly JumpTarget[];
  /** Whether Balance is earned: the tray shows in open stages. */
  balance: boolean;
  onJump(target: JumpTarget): void;
  onToggleBalance(): void;
  onClose(): void;
}

/** The panel from props only. */
export function DevPanelView({
  readout,
  targets,
  balance,
  onJump,
  onToggleBalance,
  onClose,
}: DevPanelViewProps) {
  return (
    <section className="dev-panel" aria-label="dev panel">
      <header className="dev-panel__header">
        <strong>dev</strong>
        <span className="dev-panel__place">{readout?.place ?? 'no room'}</span>
        <button type="button" className="dev-panel__button" onClick={onClose}>
          close
        </button>
      </header>
      {readout && (
        <dl className="dev-panel__readout">
          <dt>progress</dt>
          <dd>{readout.progress}</dd>
          <dt>jam</dt>
          <dd>{readout.jam}</dd>
          <dt>pin</dt>
          <dd>{readout.pin}</dd>
          <dt>pans</dt>
          <dd>
            <span className="dev-panel__line">{readout.pans}</span>
          </dd>
          <dt>tray</dt>
          <dd>{readout.tray}</dd>
          <dt>last line</dt>
          <dd>
            <Line line={readout.last} />
          </dd>
          <dt>draft</dt>
          <dd>{readout.draft ? <Line line={readout.draft} /> : '—'}</dd>
        </dl>
      )}
      <div className="dev-panel__jumps">
        <button
          type="button"
          className="dev-panel__button"
          aria-pressed={balance}
          onClick={onToggleBalance}
        >
          balance {balance ? 'on' : 'off'}
        </button>
      </div>
      <nav className="dev-panel__jumps" aria-label="jump to a room and stage">
        {targets.map((target) => (
          <button
            key={target.label}
            type="button"
            className="dev-panel__button"
            onClick={() => onJump(target)}
          >
            {target.label}
          </button>
        ))}
      </nav>
    </section>
  );
}

function Line({ line }: { line: LineReadout }) {
  return (
    <>
      <span className="dev-panel__line">{line.text || '—'}</span> · {line.verdict}
      {line.tuple && <> · {line.tuple}</>}
    </>
  );
}
