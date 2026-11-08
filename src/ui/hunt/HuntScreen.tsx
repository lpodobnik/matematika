import '@/ui/hunt/hunt.css';
import { type FormEvent, useEffect, useState } from 'react';
import { cleanName, maxNameLength } from '@/city/character';
import { hr } from '@/content/text/hr';
import { town } from '@/content/town';
import { type GateScene, gateEquation, gateScene } from '@/hunt/gate';
import { formatTokens } from '@/math/format';
import { type Token, tokenFromChar } from '@/math/tokens';
import { useGame } from '@/store/store';
import { LittleOneArt } from '@/ui/hunt/LittleOne';
import { NumberPad } from '@/ui/notebook/NumberPad';
import { foundryArt } from '@/ui/opening/art';
import { StoryPanels } from '@/ui/opening/OpeningScreen';
import { writeWhere } from '@/ui/town/town-storage';

// Five knocks, a pause, eight: what the door keeps knocking, with a knock's place in the row.
const knocksFirst = [0, 1, 2, 3, 4];
const knocksThen = [0, 1, 2, 3, 4, 5, 6, 7];

/** Part 2's screen: the scene in play. The gate is the first. */
export function HuntScreen() {
  const scene = useGame((s) => s.save.hunt.scene);
  const dispatch = useGame((s) => s.dispatch);
  if (scene?.of === 'gate') {
    const gate = gateScene(scene.state);
    if (gate) {
      return (
        <GateBoard
          gate={gate}
          onType={(token) => dispatch({ type: 'hunt/type', token })}
          onDelete={() => dispatch({ type: 'hunt/delete' })}
          onEnter={() => dispatch({ type: 'hunt/enter' })}
          onFoundryDone={() => dispatch({ type: 'hunt/foundry-done' })}
          onName={(name) => {
            // He walks out of the foundry into the new street.
            writeWhere('u1', town.areas.u1.arrive);
            dispatch({ type: 'hunt/name', name });
          }}
        />
      );
    }
  }
  return null;
}

interface GateProps {
  gate: GateScene;
  onType(token: Token): void;
  onDelete(): void;
  onEnter(): void;
  onFoundryDone(): void;
  onName(name: string): void;
}

/** The gate from props: the plate and the notebook, then the foundry, then the naming. */
export function GateBoard({ gate, onType, onDelete, onEnter, onFoundryDone, onName }: GateProps) {
  useEffect(() => {
    if (gate.phase !== 'solve') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter') onEnter();
      else if (event.key === 'Backspace') onDelete();
      else {
        const token = tokenFromChar(event.key);
        if (token) onType(token);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gate.phase, onType, onDelete, onEnter]);

  if (gate.phase === 'foundry') {
    return <StoryPanels panels={hr.hunt.foundry.panels} art={foundryArt} onDone={onFoundryDone} />;
  }
  if (gate.phase === 'name') return <NameLittleOne onDone={onName} />;
  return (
    <main className="hunt hunt--gate" aria-label={hr.hunt.label}>
      <section className="hunt__scene">
        <div className="gate__door">
          <p className="gate__plate">{gateEquation}</p>
          <p className="gate__knock" role="img" aria-label={hr.hunt.gate.knock}>
            {knocksFirst.map((i) => (
              <span key={i} className="gate__mark" style={{ animationDelay: `${i * 0.28}s` }} />
            ))}
            <span className="gate__gap" />
            {knocksThen.map((i) => (
              <span
                key={i}
                className="gate__mark"
                style={{ animationDelay: `${1.8 + i * 0.28}s` }}
              />
            ))}
          </p>
          <p className="gate__line" role="status">
            {gate.knockedBack
              ? hr.hunt.gate.knockBack
              : gate.refused
                ? hr.hunt.gate.refused
                : hr.hunt.gate.knock}
          </p>
        </div>
      </section>
      <section className="hunt__notebook" data-refused={gate.refused}>
        <p className="hunt__task">{hr.hunt.gate.task}</p>
        <ol className="hunt__lines">
          <li className="hunt__line hunt__line--given">{gateEquation}</li>
          {gate.lines.map((line) => (
            <li key={line} className="hunt__line">
              {line}
            </li>
          ))}
          <li className="hunt__line hunt__line--draft" data-empty={gate.draft.length === 0}>
            {formatTokens(gate.draft)}
          </li>
        </ol>
        <NumberPad
          writes={true}
          blank={false}
          onKey={(key) => {
            if (key === 'delete') onDelete();
            else if (key === 'enter') onEnter();
            else onType(key);
          }}
        />
      </section>
    </main>
  );
}

/** He names the little one: the same dialog as his own name, and it stays on the device. */
function NameLittleOne({ onDone }: { onDone(name: string): void }) {
  const [typed, setTyped] = useState('');
  const name = cleanName(typed);
  const confirm = (event: FormEvent) => {
    event.preventDefault();
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    if (name) onDone(name);
  };
  return (
    <main className="hunt hunt--name">
      <form className="hunt__name" onSubmit={confirm}>
        <div className="hunt__portrait">
          <LittleOneArt />
        </div>
        <p className="hunt__ask">{hr.hunt.name.ask}</p>
        <label className="hunt__label">
          {hr.hunt.name.label}
          <input
            className="hunt__input"
            type="text"
            value={typed}
            maxLength={maxNameLength}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck={false}
            enterKeyHint="done"
            onChange={(event) => setTyped(event.target.value)}
          />
        </label>
        <button type="submit" className="hunt__confirm" aria-disabled={!name}>
          {hr.hunt.name.confirm}
        </button>
      </form>
    </main>
  );
}
