// The opening's pictures (story 5.0), one per panel (art-src/CREDITS.md, t35–t38): the city
// running, the Book, the empty workshop (greyed: the machines have stopped), the notebook.

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

export const openingArt: readonly PanelArt[] = [
  { src: panel1, focus: '50% 50%', grey: false },
  { src: panel2, focus: '50% 50%', grey: false },
  { src: panel3, focus: '50% 50%', grey: true },
  { src: panel4, focus: '50% 50%', grey: false },
];
