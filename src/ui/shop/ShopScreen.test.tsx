import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { hr } from '@/content/text/hr';
import { offerOf, ShopBoard } from '@/ui/shop/ShopScreen';

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const board = (parts: number, upgrades: ('fourth-die' | 'steam' | 'hull')[] = []) =>
  renderToString(
    <ShopBoard economy={{ parts, upgrades }} onBuy={() => undefined} onClose={() => undefined} />,
  );
const buttonOf = (html: string, id: string) =>
  html.match(
    new RegExp(`data-upgrade="${id}"[\\s\\S]*?(<button[^>]*class="shop__buy"[^>]*>)`),
  )?.[1] ?? '';

describe('the old mechanic’s counter (story 3.5)', () => {
  it('shows the three upgrades with what they do and their cost: 30, 10 and 20 parts', () => {
    const html = text(board(0));
    for (const id of ['fourth-die', 'steam', 'hull'] as const) {
      expect(html).toContain(hr.shop.upgrades[id].name);
      expect(html).toContain(hr.shop.upgrades[id].what);
    }
    expect(html).toContain(hr.shop.cost(30));
    expect(html).toContain(hr.shop.cost(10));
    expect(html).toContain(hr.shop.cost(20));
    expect(html).toContain(hr.shop.back);
  });

  it('lets him buy what he can afford, shows how many more he needs, and what he owns', () => {
    expect(offerOf({ parts: 15, upgrades: [] }, 'steam')).toBe('buy');
    expect(offerOf({ parts: 15, upgrades: [] }, 'hull')).toBe('short');
    expect(offerOf({ parts: 99, upgrades: ['hull'] }, 'hull')).toBe('owned');
    const html = board(15, ['fourth-die']);
    expect(buttonOf(html, 'steam')).not.toContain('disabled');
    expect(buttonOf(html, 'hull')).toContain('disabled');
    expect(buttonOf(html, 'fourth-die')).toContain('disabled');
    expect(text(html)).toContain(hr.shop.short(5));
    expect(text(html)).toContain(hr.shop.owned);
    // A screen reader hears what the button says.
    expect(buttonOf(html, 'hull')).toContain(
      `aria-label="${hr.shop.upgrades.hull.name}: ${hr.shop.short(5)}"`,
    );
  });
});
