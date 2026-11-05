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
  notebook: {
    label: 'Bilježnica',
    delete: 'Obriši',
    enter: 'Upiši',
    pushAside: 'Skloni bilježnicu',
    bringBack: 'Vrati bilježnicu',
  },
} as const;
