import '@/ui/workshop/workshop.css';
import { useState } from 'react';
import { hr } from '@/content/text/hr';
import { useGame } from '@/store/store';
import type { SentRoom, WorkshopFlow } from '@/store/types';
import { PartsCounterView } from '@/ui/common/PartsCounter';
import { ShareLink } from '@/ui/common/ShareLink';
import { roomUrl } from '@/ui/workshop/links';
import { PlantEditor } from '@/ui/workshop/PlantEditor';
import { roomTitleText } from '@/ui/workshop/room-title';
import {
  checkDesign,
  checkSolution,
  costOf,
  costs,
  equationOf,
  limits,
  newDesign,
  optionMet,
  type Planted,
  type RoomDesign,
  resolvedNumbers,
  type Solution,
  startNumbers,
  titleCount,
  titleMaxLength,
  titleOk,
} from '@/workshop/design';
import { type FormId, fedSlot, formPattern, forms, formsMet, type Slot } from '@/workshop/forms';

/**
 * The workshop's builder (epic 5; GDD, Room builder): he sets up a machine from the forms and
 * options he has met, plays it himself, then plants a line if he chose to, picks a title
 * and sends it. HTML like the counter. Where building stands is in the store
 * (`ui.workshop`); the design he is editing is this screen's own until he plays it.
 */
export function WorkshopScreen() {
  const flow = useGame((s) => s.ui.workshop);
  const roomsDone = useGame((s) => s.save.progress.roomsDone);
  const parts = useGame((s) => s.save.economy.parts);
  const rooms = useGame((s) => s.save.workshop.rooms);
  const dispatch = useGame((s) => s.dispatch);
  const back = () => dispatch({ type: 'workshop/close' });
  return (
    <main className="workshop" aria-label={hr.workshop.title}>
      <header className="workshop__head">
        <button type="button" className="workshop__back" onClick={back}>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M20 6 L10 16 L20 26" />
          </svg>
          {hr.workshop.back}
        </button>
        <h1 className="workshop__title">{hr.workshop.title}</h1>
      </header>
      <Step
        flow={flow}
        roomsDone={roomsDone}
        parts={parts}
        rooms={rooms}
        onSolve={(design) => dispatch({ type: 'workshop/solve', design })}
        onSend={(title, planted) => dispatch({ type: 'workshop/send', title, planted })}
        onRedesign={() => dispatch({ type: 'workshop/redesign' })}
        onBack={back}
      />
      <PartsCounterView shown={parts} visible flight={null} />
    </main>
  );
}

interface StepProps {
  flow: WorkshopFlow | null;
  roomsDone: readonly string[];
  parts: number;
  rooms: readonly SentRoom[];
  onSolve(design: RoomDesign): void;
  onSend(title: string, planted: Planted | null): void;
  onRedesign(): void;
  onBack(): void;
}

function Step({ flow, roomsDone, parts, rooms, ...on }: StepProps) {
  if (flow?.step === 'finish') {
    return (
      <FinishStep
        design={flow.design}
        solution={flow.solution}
        parts={parts}
        onSend={on.onSend}
        onRedesign={on.onRedesign}
      />
    );
  }
  if (flow?.step === 'sent') {
    const room = rooms.find((r) => r.id === flow.id);
    return room ? <SentStep room={room} onBack={on.onBack} /> : null;
  }
  const initial = flow?.step === 'design' ? flow.design : null;
  return <DesignStep initial={initial} roomsDone={roomsDone} onSolve={on.onSolve} />;
}

/** One number of a machine: − and + either side of a box he can type in. */
function NumberField({
  slot,
  value,
  onChange,
}: {
  slot: Slot;
  value: number;
  onChange(n: number): void;
}) {
  const { min, max } = limits[slot];
  const [text, setText] = useState(String(value));
  const shown = text === '' || Number(text) === value ? text : String(value);
  const set = (n: number) => {
    const clamped = Math.min(max, Math.max(min, n));
    setText(String(clamped));
    onChange(clamped);
  };
  return (
    <div className="workshop__number" data-slot={slot}>
      <span className="workshop__letter">{slot}</span>
      <button
        type="button"
        className="workshop__step"
        aria-label={`${slot} ${hr.workshop.less}`}
        onClick={() => set(value - 1)}
        disabled={value <= min}
      >
        −
      </button>
      <input
        className="workshop__input"
        inputMode="numeric"
        aria-label={slot}
        value={shown}
        maxLength={String(max).length}
        onChange={(event) => {
          const digits = event.currentTarget.value.replace(/\D/g, '');
          setText(digits);
          if (digits !== '') onChange(Math.min(max, Number(digits)));
        }}
        onBlur={() => set(value)}
      />
      <button
        type="button"
        className="workshop__step"
        aria-label={`${slot} ${hr.workshop.more}`}
        onClick={() => set(value + 1)}
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}

/** The machine set-up: forms, numbers, linked machines and the ways to make it hard. */
function DesignStep({
  initial,
  roomsDone,
  onSolve,
}: {
  initial: RoomDesign | null;
  roomsDone: readonly string[];
  onSolve(design: RoomDesign): void;
}) {
  const met = formsMet(roomsDone);
  const [design, setDesign] = useState<RoomDesign>(
    () => initial ?? newDesign(met.includes('ax+b') ? 'ax+b' : (met[0] ?? 'x+b')),
  );
  const checked = checkDesign(design, roomsDone);
  const numbers = resolvedNumbers(design);
  const setMachine = (i: number, change: Partial<RoomDesign['machines'][number]>) =>
    setDesign((d) => ({
      ...d,
      machines: d.machines.map((m, j) => (j === i ? { ...m, ...change } : m)),
    }));
  const canLink = optionMet('linked', roomsDone) && design.machines.length < limits.machines;
  return (
    <div className="workshop__body">
      <p className="workshop__speech">
        <b>{hr.workshop.speaker}:</b> {hr.workshop.speech}
      </p>
      {design.machines.map((machine, i) => {
        const fed = i > 0 ? fedSlot(machine.form) : null;
        const n = numbers[i] ?? machine.numbers;
        const problem = checked.machines[i] ?? null;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: machines are in a fixed order
          <section key={i} className="workshop__machine" data-machine={i}>
            <header className="workshop__machine-head">
              <h2 className="workshop__name">{hr.workshop.machine(i + 1)}</h2>
              {i > 0 && (
                <button
                  type="button"
                  className="workshop__small"
                  onClick={() =>
                    setDesign((d) => ({ ...d, machines: d.machines.filter((_, j) => j !== i) }))
                  }
                >
                  {hr.workshop.removeMachine}
                </button>
              )}
            </header>
            <div className="workshop__forms">
              {met.map((form: FormId) => (
                <button
                  key={form}
                  type="button"
                  aria-pressed={machine.form === form}
                  className="workshop__form"
                  data-form={form}
                  onClick={() => setMachine(i, { form })}
                >
                  {formPattern(form)}
                </button>
              ))}
            </div>
            <div className="workshop__numbers">
              {forms[machine.form].slots.map((slot) =>
                slot === fed ? (
                  <div key={slot} className="workshop__number workshop__number--fed">
                    <span className="workshop__letter">{slot}</span>
                    <span>{hr.workshop.fed(i)}</span>
                  </div>
                ) : (
                  <NumberField
                    key={`${machine.form}-${slot}`}
                    slot={slot}
                    value={machine.numbers[slot]}
                    onChange={(value) =>
                      setMachine(i, { numbers: { ...machine.numbers, [slot]: value } })
                    }
                  />
                ),
              )}
            </div>
            <p className="workshop__equation">{equationOf(machine.form, n)}</p>
            <p className="workshop__status" data-ok={problem === null}>
              {problem === null ? hr.workshop.levels : hr.workshop.problem[problem]}
            </p>
          </section>
        );
      })}
      {canLink && (
        <button
          type="button"
          className="workshop__add"
          onClick={() =>
            setDesign((d) => ({
              ...d,
              machines: [...d.machines, { form: 'ax+b', numbers: { ...startNumbers } }],
            }))
          }
        >
          {hr.workshop.addMachine}
        </button>
      )}
      <Options design={design} roomsDone={roomsDone} onChange={setDesign} />
      {checked.room !== null && (
        <p className="workshop__status" data-ok="false">
          {hr.workshop.problem[checked.room]}
        </p>
      )}
      <footer className="workshop__foot">
        <div className="workshop__go">
          <span className="workshop__hint">{hr.workshop.solveWhat}</span>
          <button
            type="button"
            className="workshop__primary"
            disabled={!checked.ok}
            onClick={() => onSolve(design)}
          >
            {hr.workshop.solve}
          </button>
        </div>
      </footer>
    </div>
  );
}

/** The blinds and the planted line, those he has met, each with its price. */
function Options({
  design,
  roomsDone,
  onChange,
}: {
  design: RoomDesign;
  roomsDone: readonly string[];
  onChange(change: (d: RoomDesign) => RoomDesign): void;
}) {
  const toggles = [
    {
      id: 'readouts' as const,
      on: design.blinds.readouts,
      price: costs.blind,
      flip: (d: RoomDesign) => ({ ...d, blinds: { ...d.blinds, readouts: !d.blinds.readouts } }),
    },
    {
      id: 'shortDial' as const,
      on: design.blinds.shortDial,
      price: costs.blind,
      flip: (d: RoomDesign) => ({ ...d, blinds: { ...d.blinds, shortDial: !d.blinds.shortDial } }),
    },
    {
      id: 'plant' as const,
      on: design.plant,
      price: costs.planted,
      flip: (d: RoomDesign) => ({ ...d, plant: !d.plant }),
    },
  ].filter((toggle) => optionMet(toggle.id, roomsDone));
  if (toggles.length === 0) return null;
  return (
    <section className="workshop__options">
      <h2 className="workshop__name">{hr.workshop.options}</h2>
      <div className="workshop__toggles">
        {toggles.map((toggle) => (
          <button
            key={toggle.id}
            type="button"
            className="workshop__toggle"
            data-option={toggle.id}
            aria-pressed={toggle.on}
            onClick={() => onChange(toggle.flip)}
          >
            {hr.workshop[toggle.id]}
          </button>
        ))}
      </div>
    </section>
  );
}

/** Solved: the planted line if he chose one, the title, and sending. */
function FinishStep({
  design,
  solution,
  parts,
  onSend,
  onRedesign,
}: {
  design: RoomDesign;
  solution: Solution;
  parts: number;
  onSend(title: string, planted: Planted | null): void;
  onRedesign(): void;
}) {
  const [typed, setTyped] = useState('');
  const title = typed.trim();
  const [planted, setPlanted] = useState<{ value: Planted; works: boolean } | null>(null);
  const cost = costOf(design);
  const problem = checkSolution(design, solution);
  const plantReady = !design.plant || (planted?.works ?? false);
  const ready = problem === null && titleOk(title) && plantReady && parts >= cost;
  return (
    <div className="workshop__body">
      {problem === null ? (
        <p className="workshop__speech">{hr.workshop.solved}</p>
      ) : (
        <p className="workshop__status" data-ok="false">
          {hr.workshop.tooLong}
        </p>
      )}
      {problem === null && design.plant && (
        <PlantEditor design={design} solution={solution} onChange={setPlanted} />
      )}
      {problem === null && (
        <section className="workshop__titles-box">
          <h2 className="workshop__name">{hr.workshop.pickTitle}</h2>
          <input
            type="text"
            className="workshop__title-input"
            value={typed}
            maxLength={titleMaxLength}
            placeholder={hr.workshop.titleOwn}
            aria-label={hr.workshop.pickTitle}
            autoComplete="off"
            onChange={(event) => setTyped(event.target.value)}
          />
          <div className="workshop__titles">
            {hr.workshop.titles.slice(0, titleCount).map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={title === name}
                className="workshop__title-pick"
                onClick={() => setTyped(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </section>
      )}
      <footer className="workshop__foot">
        <div className="workshop__go">
          <button type="button" className="workshop__secondary" onClick={onRedesign}>
            {hr.workshop.redesign}
          </button>
          <button
            type="button"
            className="workshop__primary"
            disabled={!ready}
            onClick={() => onSend(title, design.plant ? (planted?.value ?? null) : null)}
          >
            {hr.workshop.send}
          </button>
        </div>
      </footer>
    </div>
  );
}

/** Sent: the link to pass on. */
function SentStep({ room, onBack }: { room: SentRoom; onBack(): void }) {
  const name = roomTitleText(room.title);
  return (
    <div className="workshop__body">
      <section className="workshop__sent">
        <h2 className="workshop__name">{hr.workshop.sentTitle}</h2>
        <p className="workshop__sent-title">„{name}“</p>
        <p>{hr.workshop.sentWhat}</p>
        <ShareLink url={roomUrl(room.payload)} text={hr.workshop.shareText(name)} kind="room" />
      </section>
      <footer className="workshop__foot">
        <span />
        <button type="button" className="workshop__primary" onClick={onBack}>
          {hr.workshop.back}
        </button>
      </footer>
    </div>
  );
}
