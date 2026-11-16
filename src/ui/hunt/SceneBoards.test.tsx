import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { allLeadSpecs } from '@/content/leads';
import { newUnmask, type UnmaskSpec } from '@/hunt/unmask';
import { UnmaskBoardView } from '@/ui/hunt/SceneBoards';

function unmaskOf(lead: string): UnmaskSpec {
  const spec = allLeadSpecs.find((candidate) => candidate.id === lead);
  const scene = spec?.scenes.find((candidate) => candidate.kind === 'unmask');
  if (!scene || scene.kind !== 'unmask') throw new Error(`${lead} has no Unmask scene`);
  return scene;
}

const figures = (html: string) => html.match(/class="suspect__figure"/g)?.length ?? 0;

describe('the people in an Unmask scene', () => {
  it('stand in the coat, where the town has all five', () => {
    const spec = unmaskOf('l11');
    const html = renderToString(
      <UnmaskBoardView spec={spec} state={newUnmask()} guide={null} act={() => {}} />,
    );
    expect(figures(html)).toBe(5);
    expect(html).not.toContain('vucetic-gears');
    expect(html).not.toContain('data-unmasked');
  });

  it('stand in the newspaper and with the two witnesses too, now that they are painted', () => {
    for (const lead of ['l06', 'l13']) {
      const html = renderToString(
        <UnmaskBoardView spec={unmaskOf(lead)} state={newUnmask()} guide={null} act={() => {}} />,
      );
      expect(figures(html)).toBe(3);
    }
  });

  it('stay names where they are not people, such as the ledgers', () => {
    const html = renderToString(
      <UnmaskBoardView spec={unmaskOf('l07')} state={newUnmask()} guide={null} act={() => {}} />,
    );
    expect(figures(html)).toBe(0);
  });

  it('show the automaton without its cap once he has found it, and only then', () => {
    const spec = unmaskOf('l11');
    const before = { ...newUnmask(), asked: ['a', 'b'], accused: ['nikola'] };
    const after = { ...before, phase: 'write' as const };
    const render = (state: typeof before) =>
      renderToString(<UnmaskBoardView spec={spec} state={state} guide={null} act={() => {}} />);
    expect(render(before)).not.toContain('vucetic-gears');
    const html = render(after);
    expect(html).toContain('vucetic-gears');
    expect(html.match(/data-unmasked="true"/g)).toHaveLength(1);
    expect(html).toMatch(/data-suspect="vucetic"><button[^>]*data-unmasked="true"/);
  });
});
