import type { Point } from '@/city/walk';
import { hr } from '@/content/text/hr';
import { type AreaId, type PersonId, town } from '@/content/town';
import { activePlayer, playerKeys } from '@/lib/player';

export function readMet(): PersonId[] {
  try {
    const raw = localStorage.getItem(playerKeys(activePlayer()).met);
    const met: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(met) ? met.filter((id): id is PersonId => id in hr.town.people) : [];
  } catch {
    return [];
  }
}

/** The district's end is told once. */
export function readOutroSeen(): boolean {
  try {
    return localStorage.getItem(`${playerKeys(activePlayer()).met}:outro`) !== null;
  } catch {
    return false;
  }
}

export function writeOutroSeen() {
  try {
    localStorage.setItem(`${playerKeys(activePlayer()).met}:outro`, '1');
  } catch {
    // A private window: it is told again next time.
  }
}

/** Where he left the town from: the street and the spot, for when he comes back. */
export function readWhere(): { area: AreaId; at: Point } | null {
  try {
    const raw = sessionStorage.getItem(playerKeys(activePlayer()).where);
    const where = raw ? (JSON.parse(raw) as { area?: unknown; at?: Point }) : null;
    if (!where || typeof where.area !== 'string' || !(where.area in town.areas) || !where.at) {
      return null;
    }
    return { area: where.area as AreaId, at: where.at };
  } catch {
    return null;
  }
}

export function writeWhere(area: AreaId, at: Point) {
  try {
    sessionStorage.setItem(playerKeys(activePlayer()).where, JSON.stringify({ area, at }));
  } catch {
    // A private window: he comes back to the square.
  }
}

export function writeMet(met: PersonId[]) {
  try {
    localStorage.setItem(playerKeys(activePlayer()).met, JSON.stringify(met));
  } catch {
    // A private window: he is introduced again next time.
  }
}
