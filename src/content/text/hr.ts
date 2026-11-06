// Every Croatian string in the game. Placeholders until the final text in epic 6,
// which also avoids gendered verb forms.
export const hr = {
  app: {
    turnToLandscape: 'Okreni uređaj vodoravno.',
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
    /** Confirms the prediction pin where it is: it locks, and the dial opens. */
    confirm: 'Potvrdi',
    /** An effect pin's options (room 3): what the pan holding x does as x grows. */
    options: {
      'pan-down': 'Kad x raste, zdjela se spušta.',
      'pan-up': 'Kad x raste, zdjela se diže.',
    },
  },
  notebook: {
    label: 'Bilježnica',
    delete: 'Obriši',
    enter: 'Upiši',
    pushAside: 'Skloni bilježnicu',
    bringBack: 'Vrati bilježnicu',
  },
} as const;
