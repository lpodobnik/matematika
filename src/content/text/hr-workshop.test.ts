import { describe, expect, it } from 'vitest';
import { hr } from '@/content/text/hr';
import { titleCount } from '@/workshop/design';

describe('the workshop’s words (epic 5)', () => {
  it('has a title for every index a link can carry, each once', () => {
    expect(hr.workshop.titles).toHaveLength(titleCount);
    expect(new Set(hr.workshop.titles).size).toBe(titleCount);
  });

  it('says what each stamp and problem is', () => {
    expect(hr.workshop.stamps).toEqual({
      cracked: 'RIJEŠEN',
      uncracked: 'NERIJEŠEN',
      none: 'Čeka odgovor',
    });
    expect(hr.workshop.cost(9)).toBe('Cijena: 9 dijelova');
    expect(hr.workshop.reply('Tajna vaga', 'RIJEŠEN')).toBe(
      'Stigao je odgovor za „Tajna vaga“: RIJEŠEN',
    );
  });
});
