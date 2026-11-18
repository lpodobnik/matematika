import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { k1 } from '@/content/leads/act2';
import { huntUiText } from '@/content/text/hunt-leads';
import {
  type KnockSpec,
  type KnockState,
  knockCross,
  knockEnter,
  knockPickClue,
  knockStrike,
  knockType,
  newKnock,
} from '@/hunt/knock';
import { readTokens, type SToken } from '@/math/statement-tokens';
import { KnockBoard } from '@/ui/hunt/LeadBoard';

const knock = k1.scenes[1] as KnockSpec;
const write = (state: KnockState, clue: string, text: string) =>
  knockEnter(
    knock,
    (readTokens(text) as SToken[]).reduce(
      (s, token) => knockType(s, token, 40),
      knockPickClue(knock, state, clue),
    ),
  );
const board = (state: KnockState) =>
  renderToString(<KnockBoard spec={knock} state={state} act={() => {}} />);
const escaped = (text: string) => renderToString(<>{text}</>);

// His son, in Knot 1: a wrong line first, then 25 + 2 · 5 = 35, and his right line was struck.
describe('lines that disagree, on the Knock board', () => {
  const crossed = knockCross(knock, newKnock(knock));
  const both = write(write(crossed, 'slip', '53'), 'tram', '35');

  it('say so, and strike neither', () => {
    const html = board(both);
    expect(html).toContain(escaped(huntUiText.disagree));
    expect(html).not.toContain('data-struck="true"');
  });

  it('the moment after he strikes the wrong one, the note goes', () => {
    expect(board(knockStrike(knock, both, 0))).not.toContain(escaped(huntUiText.disagree));
  });

  it('the moment before, with one line, there is no such note', () => {
    expect(board(write(crossed, 'slip', '53'))).not.toContain(escaped(huntUiText.disagree));
  });
});
