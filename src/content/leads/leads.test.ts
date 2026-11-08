import { describe, expect, it } from 'vitest';
import { allLeadSpecs } from '@/content/leads';
import { l01 } from '@/content/leads/l01-two-sides';
import { leadIds } from '@/hunt/ids';
import { type KnockState, litDoors, newKnock } from '@/hunt/knock';
import { proveLead } from '@/hunt/solve';
import { readLine } from '@/math/statement-tokens';

describe('every lead can be played', () => {
  it.each(allLeadSpecs.map((lead) => [lead.id, lead] as const))('%s proves out', (_id, lead) => {
    expect(proveLead(lead)).toEqual([]);
    expect(leadIds).toContain(lead.id);
  });

  it.each(allLeadSpecs.map((lead) => [lead.id, lead] as const))(
    '%s has lines the notebook can write',
    (_id, lead) => {
      for (const task of lead.tries) {
        if (task.kind === 'line') expect(readLine(task.start), task.start).not.toBeNull();
      }
      for (const task of lead.writeUp) expect(readLine(task.start), task.start).not.toBeNull();
      expect(readLine(lead.mistake.write.start)).not.toBeNull();
    },
  );
});

describe('Two sides', () => {
  const street = l01.scenes[0];
  if (street?.kind !== 'knock') throw new Error('no street');

  it('has its doors from 1, as houses are', () => {
    expect(street.row.from).toBe(1);
  });

  it('has its lift from 0', () => {
    const lift = l01.scenes[1];
    expect(lift?.kind === 'knock' && lift.row.from).toBe(0);
  });

  it('starts on the wrong side, so that he has to cross', () => {
    expect(street.startSide).toBe('even');
    const fresh: KnockState = newKnock(street);
    expect(litDoors(street.row, fresh.side, fresh.lines)).not.toContain(street.door);
  });
});
