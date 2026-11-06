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
