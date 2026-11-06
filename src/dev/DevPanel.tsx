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
  profileRoomId,
  profileToggle,
  type QualityReadout,
  qualityReadout,
  toggledBalance,
} from '@/dev/dev-view';
import { type Quality, qualities } from '@/store/quality';
import { useGame } from '@/store/store';

/**
 * The dev panel (architecture, Debug Tools): opened with `?dev` in the address or the
 * backtick key, which also closes it. Development builds only: App loads this module on
 * demand behind `import.meta.env.DEV`, so production builds never contain it. Later
 * stories add their controls here. Story 1.12 added forcing a quality setting, which holds
 * until reload; story 1.13 the tablet profile, three copies of room 4's machine side by side.
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
  const qualityState = useGame((s) => s.ui.quality);
  const copies = useGame((s) => s.ui.copies);
  const dispatch = useGame((s) => s.dispatch);
  const readout = useMemo(() => (room ? devReadout(room, tools) : null), [room, tools]);
  const quality = useMemo(() => qualityReadout(qualityState), [qualityState]);
  const targets = useMemo(() => jumpTargets(rooms), []);
  return (
    <DevPanelView
      readout={readout}
      quality={quality}
      targets={targets}
      balance={tools.includes('balance')}
      profiling={copies === 3}
      onJump={(target) =>
        dispatch({ type: 'room/enter', roomId: target.roomId, stage: target.stage })
      }
      onToggleBalance={() => dispatch({ type: 'dev/set-tools', tools: toggledBalance(tools) })}
      onForceQuality={(forced) => dispatch({ type: 'quality/force', quality: forced })}
      onProfile={() => {
        for (const action of profileToggle(copies, rooms, tools)) dispatch(action);
      }}
      onClose={onClose}
    />
  );
}

export interface DevPanelViewProps {
  readout: DevReadout | null;
  quality: QualityReadout;
  targets: readonly JumpTarget[];
  /** Whether Balance is earned: the tray shows in open stages. */
  balance: boolean;
  /** Whether the tablet profile's three copies of the scene are showing. */
  profiling: boolean;
  onJump(target: JumpTarget): void;
  onToggleBalance(): void;
  /** Forces a quality setting, or with null hands back to the test's pick. */
  onForceQuality(quality: Quality | null): void;
  /** Sets the tablet profile up, or leaves it. */
  onProfile(): void;
  onClose(): void;
}

/** The quality choices: `auto` (the test's pick) and each setting, best first. */
const qualityChoices: readonly { label: string; quality: Quality | null }[] = [
  { label: 'auto', quality: null },
  ...qualities.map((quality) => ({ label: quality, quality })),
];

/** The panel from props only. */
export function DevPanelView({
  readout,
  quality,
  targets,
  balance,
  profiling,
  onJump,
  onToggleBalance,
  onForceQuality,
  onProfile,
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
          <dt>splitter</dt>
          <dd>{readout.splitter}</dd>
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
        <button
          type="button"
          className="dev-panel__button"
          aria-pressed={profiling}
          onClick={onProfile}
        >
          profile: 3 × {profileRoomId} {profiling ? 'on' : 'off'}
        </button>
      </div>
      <dl className="dev-panel__readout">
        <dt>quality</dt>
        <dd>{quality.inUse}</dd>
        <dt>frame test</dt>
        <dd>{quality.test}</dd>
      </dl>
      <fieldset className="dev-panel__choices">
        <legend>force quality until reload</legend>
        {qualityChoices.map((choice) => (
          <button
            key={choice.label}
            type="button"
            className="dev-panel__button"
            aria-pressed={quality.forced === choice.quality}
            onClick={() => onForceQuality(choice.quality)}
          >
            {choice.label}
          </button>
        ))}
      </fieldset>
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
