import { describe, expect, it } from 'vitest';
import { lairs } from '@/content/lairs';
import { createEconomy } from '@/economy/parts';
import type { Economy } from '@/economy/types';
import { startFight } from './fight';
import { droppedParts, type FightLedger, lairAwake, rewindsAt, settleFight } from './settle';
import type { FightState, LairSpec } from './types';

const now = Date.parse('2026-11-05T20:00:00.000Z');
const minute = 60_000;

function ledger(
  economy: Partial<Economy> = {},
  tornPages: FightLedger['tornPages'] = [],
): FightLedger {
  return { economy: { ...createEconomy(), ...economy }, tornPages };
}

function won(lair: LairSpec, reward: number, clean = false): FightState {
  return {
    ...startFight(lair, [], 1),
    phase: 'won',
    armour: 0,
    strikes: 1,
    outcome: { won: true, clean, reward },
  };
}

function lost(lair: LairSpec, reason: 'hull' | 'steam' | 'left' = 'hull'): FightState {
  return { ...startFight(lair, [], 1), phase: 'lost', strikes: 3, outcome: { won: false, reason } };
}

describe('winning', () => {
  it('pays the reward and winds the automaton down for 15 minutes', () => {
    const lair = lairs['lair-20'];
    const result = settleFight(ledger({ parts: 5 }), won(lair, 12), lair, now);
    expect(result.ledger.economy.parts).toBe(17);
    expect(result.ledger.economy.lairs['lair-20']).toEqual({
      rewindsAt: '2026-11-05T20:15:00.000Z',
    });
    expect(result.reward).toBe(12);
    expect(result.events).toEqual([
      { type: 'FightEnded', lairId: 'lair-20', won: true, parts: 12 },
    ]);
  });

  it('recovers the whole pile at that automaton, without doubling it', () => {
    const lair = lairs['lair-45'];
    const start = ledger({ parts: 2, piles: { 'lair-45': 9, 'lair-20': 4 } }, ['page-2']);
    const result = settleFight(start, won(lair, 20, true), lair, now);
    expect(result.recovered).toBe(9);
    expect(result.ledger.economy.parts).toBe(2 + 20 + 9);
    expect(result.ledger.economy.piles).toEqual({ 'lair-20': 4 });
    expect(result.events[0]).toEqual({
      type: 'FightEnded',
      lairId: 'lair-45',
      won: true,
      parts: 29,
    });
  });

  it('returns the torn page on the first win at armour 30, 45 and 60', () => {
    for (const [id, page] of [
      ['lair-30', 'page-1'],
      ['lair-45', 'page-2'],
      ['lair-60', 'page-3'],
    ] as const) {
      const lair = lairs[id];
      const first = settleFight(ledger(), won(lair, 5), lair, now);
      expect(first.page).toBe(page);
      expect(first.ledger.tornPages).toEqual([page]);
      expect(first.events).toContainEqual({ type: 'TornPageReturned', lairId: id, page });
      const second = settleFight(first.ledger, won(lair, 5), lair, now + 20 * minute);
      expect(second.page).toBeNull();
      expect(second.ledger.tornPages).toEqual([page]);
      expect(second.events.map((e) => e.type)).toEqual(['FightEnded']);
    }
  });

  it('returns no page at armour 20', () => {
    const lair = lairs['lair-20'];
    const result = settleFight(ledger(), won(lair, 5), lair, now);
    expect(result.page).toBeNull();
    expect(result.ledger.tornPages).toEqual([]);
  });

  it('keeps pages already found', () => {
    const lair = lairs['lair-60'];
    const result = settleFight(ledger({}, ['page-1']), won(lair, 5), lair, now);
    expect(result.ledger.tornPages).toEqual(['page-1', 'page-3']);
  });
});

describe('losing', () => {
  it('drops a quarter of his unspent parts, rounded down, in a pile at that automaton', () => {
    const lair = lairs['lair-30'];
    const result = settleFight(ledger({ parts: 23 }), lost(lair), lair, now);
    expect(result.dropped).toBe(5);
    expect(result.ledger.economy.parts).toBe(18);
    expect(result.ledger.economy.piles).toEqual({ 'lair-30': 5 });
    expect(result.events).toEqual([
      { type: 'FightEnded', lairId: 'lair-30', won: false, parts: -5 },
    ]);
  });

  it('adds another loss to the pile', () => {
    const lair = lairs['lair-30'];
    const first = settleFight(ledger({ parts: 20 }), lost(lair), lair, now);
    const second = settleFight(first.ledger, lost(lair, 'steam'), lair, now);
    expect(second.dropped).toBe(3);
    expect(second.ledger.economy.parts).toBe(12);
    expect(second.ledger.economy.piles).toEqual({ 'lair-30': 8 });
  });

  it('drops nothing with fewer than 4 parts, and leaves the pile as it was', () => {
    const lair = lairs['lair-60'];
    const empty = settleFight(ledger({ parts: 3 }), lost(lair), lair, now);
    expect(empty.dropped).toBe(0);
    expect(empty.ledger.economy).toEqual(ledger({ parts: 3 }).economy);
    const withPile = settleFight(
      ledger({ parts: 0, piles: { 'lair-60': 6 } }),
      lost(lair),
      lair,
      now,
    );
    expect(withPile.ledger.economy.piles).toEqual({ 'lair-60': 6 });
  });

  it('counts leaving after the first strike as losing', () => {
    const lair = lairs['lair-45'];
    const result = settleFight(ledger({ parts: 40 }), lost(lair, 'left'), lair, now);
    expect(result.dropped).toBe(10);
    expect(result.ledger.economy.piles).toEqual({ 'lair-45': 10 });
  });

  it('leaves spent parts alone: only the unspent balance counts', () => {
    const lair = lairs['lair-20'];
    const start = ledger({ parts: 8, upgrades: ['fourth-die', 'hull'] });
    const result = settleFight(start, lost(lair), lair, now);
    expect(result.ledger.economy.parts).toBe(6);
    expect(result.ledger.economy.upgrades).toEqual(['fourth-die', 'hull']);
  });

  it('does not wind the automaton down or return a page', () => {
    const lair = lairs['lair-60'];
    const result = settleFight(ledger({ parts: 10 }), lost(lair), lair, now);
    expect(result.ledger.economy.lairs).toEqual({});
    expect(result.ledger.tornPages).toEqual([]);
    expect(lairAwake(result.ledger.economy, 'lair-60', now)).toBe(true);
  });

  it('rounds the quarter down', () => {
    expect([0, 3, 4, 7, 8, 99, 100].map(droppedParts)).toEqual([0, 0, 1, 1, 2, 24, 25]);
  });
});

describe('lairs rewinding (ADR-13)', () => {
  it('a beaten automaton is asleep until 15 minutes after the win, then awake', () => {
    const lair = lairs['lair-20'];
    const { economy } = settleFight(ledger(), won(lair, 5), lair, now).ledger;
    expect(lairAwake(economy, 'lair-20', now)).toBe(false);
    expect(lairAwake(economy, 'lair-20', now + 15 * minute - 1)).toBe(false);
    expect(lairAwake(economy, 'lair-20', now + 15 * minute)).toBe(true);
    expect(lairAwake(economy, 'lair-30', now)).toBe(true);
  });

  it('counts an unreadable rewind time as rewound', () => {
    const economy = { ...createEconomy(), lairs: { 'lair-45': { rewindsAt: 'soon' } } };
    expect(lairAwake(economy, 'lair-45', now)).toBe(true);
  });

  it('writes the rewind time as ISO 8601', () => {
    expect(rewindsAt(Date.parse('2026-11-05T23:50:00.000Z'))).toBe('2026-11-06T00:05:00.000Z');
  });
});

describe('settleFight guards', () => {
  it('refuses a fight that is not over, and a lair that is not the fight’s', () => {
    const lair = lairs['lair-20'];
    expect(() => settleFight(ledger(), startFight(lair, [], 1), lair, now)).toThrow(/finished/);
    expect(() => settleFight(ledger(), won(lair, 5), lairs['lair-30'], now)).toThrow(/lair-30/);
  });

  it('does not change the ledger it was given', () => {
    const lair = lairs['lair-45'];
    const start = ledger({ parts: 12, piles: { 'lair-45': 3 } });
    const copy = structuredClone(start);
    settleFight(start, won(lair, 5), lair, now);
    settleFight(start, lost(lair), lair, now);
    expect(start).toEqual(copy);
  });
});
