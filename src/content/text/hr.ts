// Every Croatian string in the game. Placeholders until the final text in epic 6,
// which also avoids gendered verb forms.
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
} as const;
