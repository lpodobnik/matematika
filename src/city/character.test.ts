import { describe, expect, it } from 'vitest';
import { cleanName, isLookId, lookIds, maxNameLength, needsName } from '@/city/character';

describe('his apprentice (city/character.ts, story 2.4)', () => {
  it('has the art bible’s six looks', () => {
    expect(lookIds).toHaveLength(6);
    expect(isLookId('look-6')).toBe(true);
    expect(isLookId('look-7')).toBe(false);
    expect(isLookId(3)).toBe(false);
  });

  it('tidies a name: spaces collapsed and trimmed, control characters dropped', () => {
    expect(cleanName('  Ivo   Horvat  ')).toBe('Ivo Horvat');
    expect(cleanName('Iv\u0000o\n')).toBe('Ivo');
    expect(cleanName('Đurđica Šimić')).toBe('Đurđica Šimić');
    expect(cleanName('   ')).toBeNull();
    expect(cleanName('')).toBeNull();
  });

  it('cuts a long name to whole letters, never half of one', () => {
    expect(cleanName('a'.repeat(30))).toBe('a'.repeat(maxNameLength));
    const name = cleanName('🦊'.repeat(20)) ?? '';
    expect(Array.from(name)).toHaveLength(maxNameLength);
    expect(name).toBe('🦊'.repeat(maxNameLength));
    // A family emoji is one character as it shows: kept whole or not at all.
    expect(cleanName(`${'x'.repeat(15)}👨‍👩‍👧`)).toBe(`${'x'.repeat(15)}👨‍👩‍👧`);
    expect(cleanName(`${'x'.repeat(16)}👨‍👩‍👧`)).toBe('x'.repeat(16));
  });

  it('asks for a name once room 1 is finished, until he has one', () => {
    expect(needsName([], null)).toBe(false);
    expect(needsName(['r01'], null)).toBe(true);
    expect(needsName(['r01'], 'Ivo')).toBe(false);
  });
});
