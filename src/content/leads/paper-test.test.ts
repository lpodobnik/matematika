import { describe, expect, it } from 'vitest';
import { allLeadSpecs } from '@/content/leads';
import { paperTestPart2 } from '@/content/paper-test';
import { huntText } from '@/content/text/hunt';

// GDD, Paper test for this part: "new numbers that don't appear in a lead". Everything a lead
// shows him is in its spec or its text, so neither may hold an item of either version.
const everything = [JSON.stringify(allLeadSpecs), JSON.stringify(huntText)].join('\n');
// Spacing aside: a lead might write 4·(6+3) without spaces.
const squeeze = (text: string) => text.replace(/\s+/g, '');
const shown = squeeze(everything);

describe("part 2's paper test", () => {
  it.each([...paperTestPart2.before, ...paperTestPart2.after])(
    '%s appears in no lead, knot or line of part 2',
    (item) => {
      expect(shown.includes(squeeze(item))).toBe(false);
    },
  );

  it('has its after version on new numbers, item for item', () => {
    expect(paperTestPart2.after).toHaveLength(paperTestPart2.before.length);
    paperTestPart2.before.forEach((item, index) => {
      expect(paperTestPart2.after[index]).not.toBe(item);
    });
  });
});
