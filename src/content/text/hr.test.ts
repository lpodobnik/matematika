import { describe, expect, it } from 'vitest';
import { hr } from '@/content/text/hr';

describe('the hint button’s and the goal card’s words (story 1.16)', () => {
  it('says the next move as the story writes it', () => {
    expect(hr.hint.slide).toEqual({
      right: 'Pomiči klizač udesno.',
      left: 'Pomiči klizač ulijevo.',
    });
    expect(hr.hint.take('5', '−5')).toBe('Skini 5 s obje strane: stavi balon −5 na vagu.');
    expect(hr.hint.add('5', '5')).toBe('Dodaj 5 na obje strane: stavi uteg 5 na vagu.');
    expect(hr.hint.split('2')).toBe('Podijeli obje strane s 2.');
    expect(hr.hint.answer('x = 9')).toBe('Upiši x = 9.');
    expect(hr.hint.check('9')).toBe('Prepiši prvu jednadžbu, a umjesto x upiši 9.');
    expect(hr.goal.label).toBe('Cilj: x sam');
  });

  // Story 1.16 review: the jam's two presses, and the check line as a template.
  it('says what a jam means and how to go on, and what goes in the check line’s blank', () => {
    expect(hr.hint.jam).toEqual({
      what: 'Stroj je zapeo: ovaj redak ne vrijedi.',
      fix: 'Obriši ga tipkom ⌫ i napiši ponovno.',
    });
    expect(hr.hint.checkBlank('9')).toBe('Upiši 9 umjesto x.');
  });

  it('says "sa" before the splitter’s parts whose word starts with s or š', () => {
    const says = (n: number) => hr.hint.split(String(n)).replace('Podijeli obje strane ', '');
    expect([2, 3, 4, 5, 6, 7, 8, 9].map(says)).toEqual([
      's 2.',
      's 3.',
      's 4.',
      's 5.',
      'sa 6.',
      'sa 7.',
      's 8.',
      's 9.',
    ]);
  });
});

describe('the fight’s words (story 3.1)', () => {
  it('counts blows as Croatian does', () => {
    const notch = [1, 2, 3, 4, 5, 6, 11, 12, 21, 22].map(hr.fight.blowsNotch);
    expect(notch).toEqual([
      '1 udarac',
      '2 udarca',
      '3 udarca',
      '4 udarca',
      '5 udaraca',
      '6 udaraca',
      '11 udaraca',
      '12 udaraca',
      '21 udarac',
      '22 udarca',
    ]);
  });
});

describe('the fight’s parts (story 3.3)', () => {
  it('counts parts as Croatian does, with the verb agreeing', () => {
    expect([1, 2, 4, 5, 11, 12, 21, 22, 25].map(hr.fight.paid)).toEqual([
      '+1 dio',
      '+2 dijela',
      '+4 dijela',
      '+5 dijelova',
      '+11 dijelova',
      '+12 dijelova',
      '+21 dio',
      '+22 dijela',
      '+25 dijelova',
    ]);
    expect([0, 1, 4, 5, 12, 21].map((n) => hr.fight.paidHow(3, n))).toEqual([
      '3 za automat + 0 preostalih para',
      '3 za automat + 1 preostala para',
      '3 za automat + 4 preostale pare',
      '3 za automat + 5 preostalih para',
      '3 za automat + 12 preostalih para',
      '3 za automat + 21 preostala para',
    ]);
    expect(hr.fight.dropped(3)).toBe('3 dijela ostaju kod automata. Pobjeda ih vraća.');
    expect(hr.fight.dropped(5)).toBe('5 dijelova ostaje kod automata. Pobjeda ih vraća.');
    expect(hr.fight.dropped(1)).toBe('1 dio ostaje kod automata. Pobjeda ga vraća.');
    expect(hr.fight.pileHere(1)).toBe('Ovdje te čeka 1 dio s prošle borbe.');
    expect(hr.fight.pileHere(3)).toBe('Ovdje te čekaju 3 dijela s prošle borbe.');
  });
});
