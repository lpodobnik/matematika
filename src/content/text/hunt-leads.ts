// The leads' Croatian (GDD, Part 2: The Trail), reached through `hr.hunt.leads`. All of it is a
// draft for Luka: his wording wins, and every line waits for his review.

export const l01Text = {
  title: 'Dvije strane',
  spot: 'Trag: dvije strane ulice',
  lesson: {
    found: 'Mali automat nešto je našao pod klupom: valjak Majstora Kristijana. Pušta ga.',
    steps: [
      [
        'Kuće se broje od 1: 1, 2, 3 i tako dalje, bez kraja.',
        'To su prirodni brojevi. Njihov se skup zove N.',
      ],
      ['Lift ima prizemlje, a to je kat 0.', 'Nula nije prirodni broj: 0 ∉ N. Ali je u skupu N₀.'],
      ['Svjetiljke stoje u parovima. Kad nijedna ne ostane sama, broj je paran.', '14 = 7 · 2'],
      ['Još jedna, i ona ostane sama. Takav je broj neparan.', '15 = 7 · 2 + 1'],
      ['Zato su kuće s parnim brojevima na jednoj strani ulice, a s neparnima na drugoj.'],
    ],
  },
  tries: {
    lamps: 'Dodaj svjetiljke dok ih ne bude 7. Koliko je parova? Koliko ih ostane?',
    sum: 'Tri para i jedna viška. Koliko je to svjetiljki? Napiši.',
    member: 'Je li 0 prirodni broj? Napiši znak koji to kaže.',
  },
  mistake: {
    say: 'Mali automat sad broji sam. Jedan njegov redak nije točan. Dodirni ga.',
    nudge: 'Taj je redak točan. Izračunaj umnožak pa usporedi s brojem.',
    show: 'Pokaži mu: stavi 9 svjetiljki. Što ostane?',
    write: 'Sad napiši točan redak.',
    thanks: 'Mali automat kima. Više neće tako brojati.',
  },
  street: {
    intro: 'Susjedi su vidjeli kola koja su odvezla Majstora. Svaki zna samo djelić.',
    side: 'Kola su krenula s neparne strane ulice.',
    pairs: 'Ispred te kuće je sedam parova svjetiljki i još jedna viška.',
    almost: 'Da je tamo još jedna svjetiljka, bilo bi točno osam parova.',
    structurePairs: 'Pomnoži broj parova s 2, pa dodaj onu viška.',
    structureAlmost: 'Pomnoži broj parova s 2, pa oduzmi onu koja nedostaje.',
    opened: 'Vrata se otvaraju. Susjed pokaže na lift: "Pitaj portira. Ja ništa nisam vidio."',
    grumpy: [
      'Nikakvih kola ovdje nije bilo. Laku noć.',
      'Krivi broj. I ne kucajte više.',
      'Ovdje živi moja mačka. Ona ništa ne zna.',
    ],
    hint: {
      step: 'Prođi kroz tragove redom. Svaki trag koji upotrijebiš smanji broj upaljenih vrata.',
      move: 'Prijeđi na neparnu stranu, zatim izračunaj 7 · 2 + 1 i 8 · 2 − 1.',
    },
    example: ['Primjer s drugim brojevima:', '4 · 2 + 1 = 9', '5 · 2 − 1 = 9'],
  },
  lift: {
    intro: 'Lift ima katove od 0. Portir zna tko je sve vidio.',
    floor: 'Portir: "Vidjela je gospođa s kata čiji broj nije prirodni broj."',
    structure: 'Koji se broj ne nalazi u skupu N? Upiši ga umjesto kvadratića.',
    opened: 'Gospođa iz prizemlja sve je vidjela s prozora.',
    grumpy: [
      'Ovdje stanuju samo Horvati. Oni spavaju.',
      'Krivi kat. Ovdje nitko ništa nije vidio.',
    ],
    hint: {
      step: 'Prirodni brojevi počinju od 1. Koji kat nije među njima?',
      move: 'Upiši 0: to je prizemlje.',
    },
    example: ['Primjer:', '5 ∈ N', '1 ∈ N'],
  },
  write: {
    notN: 'Zapiši u bilježnicu kako se to piše u školi. Nula nije prirodni broj.',
    inN0: 'U skupu N₀ nula jest.',
    sum: 'I još ono o svjetiljkama: sedam parova i jedna viška.',
  },
  find: {
    say: 'Gospođa je vidjela: kola su krenula s neparne strane i otišla uzbrdo.',
    title: 'Prirodni brojevi. Parni i neparni.',
    card: [
      'Prirodni brojevi su brojevi kojima brojimo: 1, 2, 3 i tako dalje, bez kraja. Njihov se skup zove N. Kad mu dodamo nulu, dobijemo skup N₀.',
      'Broj je paran ako se sve može složiti u parove. Ako jedan ostane sam, broj je neparan.',
      'Znak ∈ znači "pripada", a znak ∉ znači "ne pripada": 10 ∈ N, 0 ∉ N.',
    ],
  },
} as const;

/** What the first Knock's guide says (story 8.8): Nikola, with only the asked move passing. */
export const knockGuideText = {
  intro:
    'Tragovi su u bilježnici, pa ih ne moraš pamtiti. Svaki redak koji napišeš pali ili gasi vrata.',
  cross: 'Jedan trag kaže na kojoj je strani ulice. Prijeđi cestu.',
  line: 'Ovaj je redak već započet. Izračunaj, dopiši rezultat i pritisni tipku za potvrdu.',
  next: 'Još jedan trag. Napiši i njega.',
  door: 'Sad svijetle samo jedna vrata. Dodirni ih i mali će automat pokucati.',
} as const;

/** The notebook's and the scenes' labels. */
export const huntUiText = {
  cross: 'Prijeđi cestu',
  side: { odd: 'Neparna strana', even: 'Parna strana' },
  floor: 'kat',
  next: 'Dalje',
  skip: 'Preskoči',
  clues: 'Tragovi',
  yourLines: 'Tvoji redci',
  ok: 'U redu',
  shake: 'Mali automat vrti glavom i pokazuje na trag.',
  bounce: 'To nije točno. Pogledaj redak još jednom.',
  refuse: 'To se ne može pročitati. Pogledaj redak još jednom.',
  working: 'Sad računaj redak po redak. Svaki mora biti točan.',
  marked: 'Mali automat pokazuje: ovdje je pošlo krivo.',
  example: 'Pogledaj primjer s drugim brojevima.',
  keys: { more: 'Još znakova', delete: 'Obriši', enter: 'Potvrdi' },
  add: 'Još jedna',
  remove: 'Jedna manje',
  pairs: (pairs: number, left: number) =>
    left > 0 ? `${pairs} · 2 + ${left} = ${pairs * 2 + left}` : `${pairs} · 2 = ${pairs * 2}`,
  parts: (n: number) => `+${n}`,
  how: 'Kako to radi?',
  thread: 'Crvena nit stiže do mjesta.',
} as const;

/** The trail map's labels. */
export const trailText = {
  title: 'Trag',
  leads: { l01: 'Dvije strane' },
  open: 'Otvoreni trag',
  done: 'Riješeno',
} as const;
