// The opening's pictures (story 5.0), one per panel (art-src/CREDITS.md, t35–t38): the city
// running, the Book, the empty workshop (greyed: the machines have stopped), the notebook.

import firstAutomaton from '@/ui/opening/art/first-automaton.webp';
import foundry from '@/ui/opening/art/foundry.webp';
import logbook1 from '@/ui/opening/art/logbook-1.webp';
import logbook2 from '@/ui/opening/art/logbook-2.webp';
import outro1 from '@/ui/opening/art/outro-1.webp';
import outro2 from '@/ui/opening/art/outro-2.webp';
import outro3 from '@/ui/opening/art/outro-3.webp';
import outro4 from '@/ui/opening/art/outro-4.webp';
import panel1 from '@/ui/opening/art/panel-1.webp';
import panel2 from '@/ui/opening/art/panel-2.webp';
import panel3 from '@/ui/opening/art/panel-3.webp';
import panel4 from '@/ui/opening/art/panel-4.webp';

export interface PanelArt {
  src: string;
  /** CSS object-position: the part of the picture the panel shows. */
  focus: string;
  grey: boolean;
}

const plain = (src: string): PanelArt => ({ src, focus: '50% 50%', grey: false });

/** The panels after the logbook is put right, and at the end of the district. */
export const logbookArt: readonly PanelArt[] = [
  plain(logbook1),
  plain(logbook2),
  plain(firstAutomaton),
];
export const outroArt: readonly PanelArt[] = [
  plain(outro1),
  plain(outro2),
  plain(outro3),
  plain(outro4),
];

/** The empty foundry (story 7.3): the cold room, then the bench and cup up close. */
export const foundryArt: readonly PanelArt[] = [
  plain(foundry),
  { src: foundry, focus: '60% 90%', grey: false },
  { src: foundry, focus: '60% 90%', grey: false },
  plain(foundry),
];

export const openingArt: readonly PanelArt[] = [
  { src: panel1, focus: '50% 50%', grey: false },
  { src: panel2, focus: '50% 50%', grey: false },
  { src: panel3, focus: '50% 50%', grey: true },
  { src: panel4, focus: '50% 50%', grey: false },
];
