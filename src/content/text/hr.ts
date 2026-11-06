// Every Croatian string in the game. Placeholders until the final text in epic 6,
// which also avoids gendered verb forms.

/**
 * "s" before a number, or "sa" where its word starts with s or š, as Croatian says it: the
 * splitter's parts run 2–9, so only 6 (šest) and 7 (sedam) take "sa".
 */
function withS(n: string): string {
  return n === '6' || n === '7' ? `sa ${n}` : `s ${n}`;
}

export const hr = {
  app: {
    turnToLandscape: 'Okreni uređaj vodoravno.',
    /** After room 4: the placeholder end screen, until the map takes its place in epic 2. */
    toBeContinued: 'Nastavak slijedi…',
    crash: {
      title: 'Stroj se zaglavio.',
      tapToRestart: 'Dodirni za ponovno pokretanje.',
    },
  },
  ui: {
    /** The reset control: the stage in play starts again from its first line. */
    reset: 'Ispočetka',
    /** Story 1.16: the hint button, `?` under the reset control. */
    hint: 'Pomoć',
  },
  pin: {
    /** Confirms the prediction pin where it is: it locks, and the machine tests it. */
    confirm: 'Potvrdi',
    /**
     * The question on the tag that hangs on the pin's holder while the pin is offered (story
     * 1.14), by pin kind: where to put the flag so the scale levels, or which way the whole
     * scale tilts as x grows (story 1.15).
     */
    questions: {
      'level-x': 'Postavi zastavicu na mjesto gdje će vaga biti u ravnoteži.',
      effect: 'Kad x raste, na koju će se stranu vaga nagnuti?',
    },
    /** An effect pin's options (room 3), under their pictures: the scale tilted left or right. */
    options: {
      'tilt-left': 'lijevo',
      'tilt-right': 'desno',
    },
  },
  /**
   * Story 1.15: the handover tags, by step (room/handover.ts). Each tells him the next step
   * once, the first time it comes up, and again after a minute without his acting.
   */
  handover: {
    /** By the knob, until he first turns a dial. */
    dial: 'Pomiči klizač – tako mijenjaš x.',
    /** At the notebook, when his dial first levels the pans. */
    write: 'Vaga je u ravnoteži. Upiši x u bilježnicu.',
    /** Story 1.16: at the notebook, when x is alone on the pans and no answer is written. */
    answer: 'x je sam na vagi. Upiši koliko je x.',
    /** At the notebook, after the answer line. */
    check: 'Provjeri: uvrsti broj umjesto x.',
    /** At the tray, when it is first offered. */
    tray: 'Klizač ne doseže. Stavi broj s police na vagu – ide na obje strane.',
    /** Above the scale, after his first Balance move. */
    'balance-goal': 'Ostavi x samog na jednoj strani, kao na kartici Cilj.',
    /** At the splitter, when it is first offered. */
    splitter: 'Razdjelnik dijeli obje strane na jednake dijelove.',
  },
  /** Story 1.16: the goal card in the scene while the tray is offered: what Balance aims for. */
  goal: {
    label: 'Cilj: x sam',
  },
  /**
   * Story 1.16: the hint button's second press, the exact next move (room/hint.ts). The
   * numbers and lines come in written in school notation (math/format.ts).
   */
  hint: {
    /** By the knob: which way to move the slider. */
    slide: { right: 'Pomiči klizač udesno.', left: 'Pomiči klizač ulijevo.' },
    /** At the tray: a balloon of n takes n off both sides. */
    take: (n: string, balloon: string) =>
      `Skini ${n} s obje strane: stavi balon ${balloon} na vagu.`,
    /** At the tray: a weight of n adds n to both sides. */
    add: (n: string, weight: string) => `Dodaj ${n} na obje strane: stavi uteg ${weight} na vagu.`,
    /** At the splitter. */
    split: (n: string) => `Podijeli obje strane ${withS(n)}.`,
    /** At the notebook: the answer line, `x = 9`. */
    answer: (line: string) => `Upiši ${line}.`,
    /** At the notebook: the check line, on a blank page. */
    check: (n: string) => `Prepiši prvu jednadžbu, a umjesto x upiši ${n}.`,
    /** At the notebook: the check line as a template with x blanked (rooms 1–4). */
    checkBlank: (n: string) => `Upiši ${n} umjesto x.`,
    /**
     * At the notebook while the machine is jammed on a wrong line (story 1.16 review): the
     * first press says what happened, the second how to go on; the delete key pulses.
     */
    jam: {
      what: 'Stroj je zapeo: ovaj redak ne vrijedi.',
      fix: 'Obriši ga tipkom ⌫ i napiši ponovno.',
    },
  },
  parts: {
    /** The parts counter in the scene's corner, read out with its number. */
    label: 'Dijelovi',
  },
  notebook: {
    label: 'Bilježnica',
    delete: 'Obriši',
    enter: 'Upiši',
    pushAside: 'Skloni bilježnicu',
    bringBack: 'Vrati bilježnicu',
  },
  /**
   * Story 1.16: the tag at the notebook when enter refuses a line for a reason beyond the
   * wiggle (`Refusal`, room/notebook.ts).
   */
  refusal: {
    /** An answer line before the pans are simplified, where Try values can't finish. */
    simplify: 'Prvo pojednostavi vagu.',
  },
} as const;
