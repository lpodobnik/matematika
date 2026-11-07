import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { lairs } from '@/content/lairs';
import { hr } from '@/content/text/hr';
import { reduceFight, startFight } from '@/fight/fight';
import type { GuideStep } from '@/fight/guide';
import type { FightAction, FightState } from '@/fight/types';
import { LeaveConfirm } from '@/ui/fight/FightEnd';
import { FightBoard, showsPage } from '@/ui/fight/FightScreen';

const css = readFileSync(new URL('./fight.css', import.meta.url), 'utf8');

const act = (state: FightState, ...actions: FightAction[]): FightState =>
  actions.reduce((s, action) => reduceFight(s, action).state ?? s, state);

const fresh = startFight(lairs['lair-20'], [], 3);
const rolled = act(fresh, { type: 'fight/roll' });
const set = act(
  rolled,
  { type: 'fight/place', die: 0, slot: 'blade' },
  { type: 'fight/place', die: 1, slot: 'charge' },
  { type: 'fight/place', die: 2, slot: 'reach' },
);

const board = (fight: FightState) =>
  renderToString(<FightBoard fight={fight} onAction={() => undefined} />);

const text = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'");

describe('the fight screen (story 3.1)', () => {
  it('shows the automaton’s armour, his hull and steam, and a roll button before the first roll', () => {
    const html = board(fresh);
    expect(html).toContain(`aria-label="${hr.fight.title(20)}"`);
    expect(text(html)).toContain(`${hr.fight.armour}20`);
    expect(html).toContain(`aria-label="${hr.fight.left(hr.fight.hull, 3, 3)}"`);
    expect(html).toContain(`aria-label="${hr.fight.left(hr.fight.steam, 10, 10)}"`);
    expect(html).toContain(`>${hr.fight.roll}<`);
    expect(html).not.toContain('class="fight__die"');
  });

  it('shows the three dice to place once rolled, and the three slots', () => {
    const html = board(rolled);
    expect(html).not.toContain(`>${hr.fight.roll}<`);
    expect([...html.matchAll(/class="fight__die"/g)]).toHaveLength(3);
    for (const slot of ['blade', 'charge', 'reach'] as const) {
      expect(html).toContain(`aria-label="${hr.fight.slots[slot]}: ${hr.fight.emptySlot}"`);
    }
    expect(text(html)).toContain(hr.fight.placeTag);
  });

  it('shows a · x + b with his numbers once placed, and never the total', () => {
    const [a, b] = set.dice;
    const formula = text(board(set).match(/<p class="fight__formula"[\s\S]*?<\/p>/)?.[0] ?? '');
    expect(formula).toBe(`${a} · 1 + ${b}`);
    expect(formula).not.toContain('=');
    expect(text(board(rolled).match(/<p class="fight__formula"[\s\S]*?<\/p>/)?.[0] ?? '')).toBe(
      'a · x + b',
    );
  });

  it('opens a notch for each blow up to the reach die, with the blows set pressed', () => {
    const reach = set.dice[2] ?? 0;
    const html = board(set);
    const notches = [...html.matchAll(/<button[^>]*class="fight__notch"[^>]*>/g)].map((m) => m[0]);
    expect(notches).toHaveLength(reach);
    expect(notches.filter((n) => n.includes('disabled'))).toHaveLength(0);
    expect(notches[0]).toContain('aria-pressed="true"');
    // Before the dial opens, all six notches show, off.
    const closed = [...board(rolled).matchAll(/<button[^>]*class="fight__notch"[^>]*>/g)];
    expect(closed).toHaveLength(6);
    expect(closed.every((m) => m[0].includes('disabled'))).toBe(true);
  });

  it('gives every control at least 48 CSS px, on the tablet and on a phone', () => {
    for (const rule of ['.fight__die {', '.fight__notch {', '.fight__leave {']) {
      expect(css).toContain(rule);
    }
    expect(css).toMatch(/\.fight__notch \{[^}]*width: 52px/);
    expect(css).toMatch(/\.fight__die \{[^}]*width: 76px/);
    expect(css).toMatch(/@media \(max-height: 499\.98px\)[\s\S]*\.fight__notch \{[^}]*width: 48px/);
  });
});

const struck = act(set, { type: 'fight/strike' });

describe('the strike and the end (story 3.2)', () => {
  it('offers the strike only once the dial is open', () => {
    expect(board(set)).toMatch(/<button type="button" class="fight__strike">/);
    expect(board(rolled)).toMatch(/<button type="button" class="fight__strike" disabled="">/);
  });

  it('shows the sum with its total in the banner after a strike, and the dent', () => {
    const s = struck.lastStrike;
    if (!s) throw new Error('no strike');
    const html = text(board(struck));
    expect(html).toContain(`${s.blade} · ${s.blows} + ${s.charge} = ${s.damage}`);
    expect(html).toContain(hr.fight.armourFell(s.armourBefore, s.armourAfter));
    expect(struck.phase).toBe('strike');
    expect(html).toContain(hr.fight.dented);
    // The next round starts with a roll; the dial and the strike wait for it.
    expect(html).toContain(hr.fight.roll);
    expect(board(struck)).not.toContain('class="fight__strike"');
  });

  it('shows a clean cut', () => {
    const clean = {
      ...struck,
      phase: 'won' as const,
      armour: 0,
      lastStrike: {
        ...(struck.lastStrike as NonNullable<FightState['lastStrike']>),
        armourAfter: 0,
        clean: true,
        dented: false,
      },
      outcome: { won: true as const, clean: true, reward: 20 },
    };
    expect(text(board(clean))).toContain(hr.fight.clean);
  });

  it('ends with how it ended and the way back to the map', () => {
    const won = {
      ...struck,
      phase: 'won' as const,
      outcome: { won: true as const, clean: false, reward: 5 },
    };
    const html = board(won);
    expect(text(html)).toContain(hr.fight.won);
    expect(html).toContain(`>${hr.fight.back}<`);
    expect(html).not.toContain('class="fight__leave"');
    const left = {
      ...struck,
      phase: 'lost' as const,
      outcome: { won: false as const, reason: 'left' as const },
    };
    const lost = text(board(left));
    expect(lost).toContain(hr.fight.lost);
    expect(lost).toContain(hr.fight.reasons.left);
    // Leaving isn't a strike: no banner for it.
    expect(lost).not.toContain(' = ');
  });

  it('asks before leaving with the two answers, staying first', () => {
    const html = renderToString(
      <LeaveConfirm onLeave={() => undefined} onStay={() => undefined} />,
    );
    expect(html).toContain('role="alertdialog"');
    expect(text(html)).toContain(hr.fight.leaveLoses);
    expect(html.indexOf(hr.fight.stay)).toBeLessThan(html.indexOf(hr.fight.leaveConfirm));
  });

  it('says why he lost: hull or steam', () => {
    for (const reason of ['hull', 'steam'] as const) {
      const lost = { ...struck, phase: 'lost' as const, outcome: { won: false as const, reason } };
      const html = text(board(lost));
      expect(html).toContain(hr.fight.reasons[reason]);
      // A strike ended it, so its banner shows.
      expect(html).toContain(' = ');
    }
  });

  it('wins below 0 without a clean cut, and the win shows no dent', () => {
    const s = struck.lastStrike as NonNullable<FightState['lastStrike']>;
    const over = {
      ...struck,
      phase: 'won' as const,
      armour: 0,
      lastStrike: { ...s, armourBefore: s.damage - 1, armourAfter: 0, clean: false, dented: false },
      outcome: { won: true as const, clean: false, reward: 7 },
    };
    const html = text(board(over));
    expect(html).toContain(hr.fight.won);
    expect(html).not.toContain(hr.fight.clean);
    expect(html).not.toContain(hr.fight.dented);
  });

  it('shows the round’s dice off in their slots after a strike', () => {
    const html = board(struck);
    expect([...html.matchAll(/class="fight__slot"[^>]*data-off="true"/g)]).toHaveLength(3);
    expect(board(set)).not.toContain('data-off');
  });
});

describe('what a fight pays and costs (story 3.3)', () => {
  const won = {
    ...struck,
    phase: 'won' as const,
    outcome: { won: true as const, clean: true, reward: 26 },
  };
  const end = {
    lairId: 'lair-20' as const,
    won: true,
    clean: true,
    reason: null,
    reward: 26,
    recovered: 4,
    dropped: 0,
    page: null,
  };

  it('shows the win’s parts: reward and pile, how they were made, and the doubling', () => {
    const html = text(
      renderToString(<FightBoard fight={won} end={end} onAction={() => undefined} />),
    );
    expect(html).toContain(hr.fight.paid(30));
    expect(html).toContain(hr.fight.paidHow(3, won.steam));
    expect(html).toContain(hr.fight.doubled);
    expect(html).toContain(hr.fight.recovered(4));
  });

  it('shows what a loss left at the automaton, or that it left nothing', () => {
    const lost = {
      ...struck,
      phase: 'lost' as const,
      outcome: { won: false as const, reason: 'hull' as const },
    };
    const loss = {
      ...end,
      won: false,
      clean: false,
      reason: 'hull' as const,
      reward: 0,
      recovered: 0,
    };
    const dropped = text(
      renderToString(
        <FightBoard fight={lost} end={{ ...loss, dropped: 3 }} onAction={() => undefined} />,
      ),
    );
    expect(dropped).toContain(hr.fight.dropped(3));
    const none = text(
      renderToString(<FightBoard fight={lost} end={loss} onAction={() => undefined} />),
    );
    expect(none).toContain(hr.fight.droppedNone);
  });

  it('says a pile waits here before the first strike', () => {
    const html = text(
      renderToString(<FightBoard fight={fresh} pile={4} onAction={() => undefined} />),
    );
    expect(html).toContain(hr.fight.pileHere(4));
    expect(text(board(fresh))).not.toContain(hr.fight.pileHere(4));
  });
});

describe('a torn page returned by a win (story 3.4)', () => {
  it('shows the page over the end after the parts land, until read, only when one came back', () => {
    const won = {
      ...struck,
      phase: 'won' as const,
      outcome: { won: true as const, clean: false, reward: 9 },
    };
    const end = {
      lairId: 'lair-30' as const,
      won: true,
      clean: false,
      reason: null,
      reward: 9,
      recovered: 0,
      dropped: 0,
      page: 'page-1' as const,
    };
    // The page waits for the win's parts to land, then shows until he closes it.
    expect(showsPage(end, null, null)).toBe(false);
    expect(showsPage(end, end, null)).toBe(true);
    expect(showsPage(end, end, end)).toBe(false);
    expect(showsPage({ ...end, page: null }, end, null)).toBe(false);
    // A new fight's end is a new end: its page is due on its own.
    expect(showsPage({ ...end }, end, null)).toBe(false);
    // Before it is due, the end and its parts show, not the page.
    const html = renderToString(<FightBoard fight={won} end={end} onAction={() => undefined} />);
    expect(html).not.toContain('data-page=');
    expect(text(html)).toContain(hr.fight.paid(9));
  });
});

describe('labels that explain the fight (every fight)', () => {
  it('captions the armour, hull, steam, slots, formula and blows in plain words', () => {
    const page = text(board(rolled));
    for (const caption of Object.values(hr.fight.captions)) expect(page).toContain(caption);
    for (const hint of Object.values(hr.fight.slotHints)) expect(page).toContain(hint);
  });

  it('keeps every caption and slot hint visible on a phone', () => {
    const phone = css.slice(css.indexOf('@media (max-height: 499.98px)'));
    const hidden = phone.match(/([^{}]+)\{\s*display:\s*none;?\s*\}/g) ?? [];
    for (const rule of hidden) expect(rule).not.toMatch(/fight__(caption|slot-hint|named)/);
  });
});

describe('the guided first fight on screen', () => {
  const guided = (fight: FightState, step: GuideStep) =>
    renderToString(<FightBoard fight={fight} guide={step} onAction={() => undefined} />);

  it('shows nothing of the guide without one', () => {
    expect(board(fresh)).not.toContain('fight__guide');
    expect(board(fresh)).not.toContain('data-focus');
  });

  it('shows Nikola’s line, and "Dalje" only on a step he reads', () => {
    const armour = guided(fresh, 'armour');
    expect(text(armour)).toContain(hr.story.speakers.nikola);
    expect(text(armour)).toContain(hr.fightGuide.steps.armour[0]);
    expect(armour).toContain(`>${hr.fightGuide.next}<`);
    // The roll waits for the guide.
    expect(armour).toMatch(/<button type="button" class="fight__roll" disabled=""/);
    const roll = guided(fresh, 'roll');
    expect(roll).not.toContain('fight__guide-next');
    expect(roll).not.toMatch(/class="fight__roll" disabled/);
    expect(roll).toMatch(/class="fight__roll"[^>]*data-focus/);
  });

  it('lights only the die and slot the step asks for, and dims the rest', () => {
    const html = guided(rolled, 'blade');
    const top = Math.max(...rolled.dice);
    const dice = [...html.matchAll(/<button[^>]*class="fight__die"[^>]*>/g)].map((m) => m[0]);
    expect(dice).toHaveLength(3);
    for (const [i, die] of dice.entries()) {
      const allowed = rolled.dice[i] === top;
      expect(die.includes('disabled'), die).toBe(!allowed);
      expect(die.includes('data-focus'), die).toBe(allowed);
    }
    expect(html).toMatch(/data-slot="blade"[^>]*data-focus/);
    expect(html).toMatch(/data-slot="reach"[^>]*data-dim/);
    expect(html).toMatch(/class="fight__formula-box" data-dim/);
  });

  it('keeps the way back shut over a won fight while the guide still talks', () => {
    const won = {
      ...struck,
      phase: 'won' as const,
      outcome: { won: true as const, clean: false, reward: 9 },
    };
    const html = renderToString(
      <FightBoard fight={won} guide="steam" onAction={() => undefined} />,
    );
    expect(html).toMatch(/class="fight__close" disabled/);
    expect(text(html)).toContain(hr.fightGuide.steps.steam[1]);
  });
});
