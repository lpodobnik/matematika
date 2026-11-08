// Part 2's Croatian (GDD, Part 2: The Trail), reached through `hr.hunt`. All of it is a draft
// for Luka: his wording wins, and every line waits for his review.

import { huntUiText, knockGuideText, l01Text, trailText } from '@/content/text/hunt-leads';

export const huntText = {
  leads: { l01: l01Text },
  knockGuide: knockGuideText,
  ui: huntUiText,
  trail: trailText,
  gate: {
    knock: 'Iza vrata netko kuca: pet puta, pa osam.',
    task: 'Riješi jednadžbu s pločice, pa je provjeri.',
    knockBack: 'S druge strane netko kucne natrag. To nije to.',
    refused: 'Ovo se ne može pročitati. Pogledaj redak još jednom.',
    /** The foundry's doors while part 2 is on, before the end of part 1. */
    waiting: [
      'Ljevaonica. Na vratima je pločica i žig Prvog Automata.',
      'Iza vrata netko kuca. Prvo treba pokrenuti cijeli grad.',
    ],
    /** The last panel of part 1's ending, while part 2 is on. */
    outroLast: 'Iza vrata netko kuca: pet puta, pa osam. Bilježnica je još otvorena.',
    ready: 'Iza vrata netko kuca: pet puta, pa osam.',
  },
  foundry: {
    panels: [
      'Vrata se otvaraju. Ljevaonica je hladna i prazna.',
      'Stolac, šalica, alat uredno na mjestu. Majstora Kristijana nema.',
      'Na stolu je traka: MAJSTOR JE PREMJEŠTEN. OVO JE ISPRAVLJENO. HVALA. PRVI AUTOMAT',
      'A kucanje se ne prekida. Sad je tik uz tvoju nogu.',
    ],
  },
  name: {
    ask: 'Mali automat od starog željeza gleda te. Zna samo kucati. Kako će se zvati?',
    label: 'Ime malog automata',
    confirm: 'To je to',
  },
  littleOne: {
    label: 'Mali automat',
    /** Its one printed word (GDD, The little one). */
    why: 'Zašto?',
  },
  vucetic: {
    before: ['Vrata su otvorena. Zapisano.', 'Evo karte. Što god nađeš, ja to zapišem.'],
    after: ['Zapisano.', 'Sve sam zapisao.'],
  },
  sign: { u1: 'Gornja ulica' },
  label: 'Trag',
} as const;
