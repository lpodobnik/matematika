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
     * 1.14), by pin kind: where the pans level, or what the pan holding x does as x grows.
     */
    questions: {
      'level-x': 'Gdje će se vaga uravnotežiti?',
      effect: 'Kad x raste, ide li zdjelica s x gore ili dolje?',
    },
    /** An effect pin's options (room 3): what the pan holding x does as x grows. */
    options: {
      'pan-down': 'Kad x raste, zdjela se spušta.',
      'pan-up': 'Kad x raste, zdjela se diže.',
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
