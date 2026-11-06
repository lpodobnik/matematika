import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { lairs } from '@/content/lairs';
import { hr } from '@/content/text/hr';
import { reduceFight, startFight } from '@/fight/fight';
import type { FightAction, FightState } from '@/fight/types';
import { FightBoard } from '@/ui/fight/FightScreen';

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
