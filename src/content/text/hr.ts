// Every Croatian string in the game. Placeholders until the final text in epic 6,
// which also avoids gendered verb forms.

/**
 * "s" before a number, or "sa" where its word starts with s or š, as Croatian says it: the
 * splitter's parts run 2–9, so only 6 (šest) and 7 (sedam) take "sa".
 */
function withS(n: string): string {
  return n === '6' || n === '7' ? `sa ${n}` : `s ${n}`;
}

/** "udarac", "udarca" or "udaraca", as Croatian counts blows: 1, 2–4, else (with 21, 22…). */
function blowsWord(n: number): string {
  const ten = n % 10;
  const hundred = n % 100;
  if (ten === 1 && hundred !== 11) return 'udarac';
  if (ten >= 2 && ten <= 4 && (hundred < 12 || hundred > 14)) return 'udarca';
  return 'udaraca';
}

/** "dio", "dijela" or "dijelova", as Croatian counts parts: 1, 2–4, else (with 21, 22…). */
function partsWord(n: number): string {
  const ten = n % 10;
  const hundred = n % 100;
  if (ten === 1 && hundred !== 11) return 'dio';
  if (ten >= 2 && ten <= 4 && (hundred < 12 || hundred > 14)) return 'dijela';
  return 'dijelova';
}

/** "preostala para", "preostale pare" or "preostalih para", for 1, 2–4, else (0 too). */
function steamLeftWord(n: number): string {
  const ten = n % 10;
  const hundred = n % 100;
  if (ten === 1 && hundred !== 11) return 'preostala para';
  if (ten >= 2 && ten <= 4 && (hundred < 12 || hundred > 14)) return 'preostale pare';
  return 'preostalih para';
}

/** 2–4 parts (not 12–14) take a plural verb in Croatian: "4 dijela ostaju", "5 dijelova ostaje". */
function fewParts(n: number): boolean {
  return partsWord(n) === 'dijela';
}

/** `točkica` counted, as Croatian counts it: 1 točkica, 2–4 točkice, 5 točkica, 21 točkica. */
function dotsWord(n: number): string {
  const [last, lastTwo] = [n % 10, n % 100];
  if (last === 1 && lastTwo !== 11) return 'točkica';
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return 'točkice';
  return 'točkica';
}

export const hr = {
  app: {
    turnToLandscape: 'Okreni uređaj vodoravno.',
    /** On the map once every room so far is restored (story 2.2): more of the district is coming. */
    toBeContinued: 'Nastavak slijedi…',
    /** Story 2.1: the loading screen's bar, for screen readers. */
    loading: 'Učitavanje',
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
    /** Story 2.2: the map control in a room, bottom left. */
    map: 'Karta',
  },
  /**
   * The naming after room 1 (story 2.4; narrative design, Opening): the conductor, Gospon
   * Penkala, finally asks who he is. The only time the keyboard comes up.
   */
  naming: {
    speaker: 'Gospon Penkala',
    ask: 'Čekaj malo. A tko si ti uopće?',
    nameLabel: 'Tvoje ime',
    pickLook: 'Kako izgledaš?',
    /** For screen readers: each look, in the art bible's order. */
    looks: [
      'Kapa i radna pregača',
      'Kovrče, naočale i kombinezon',
      'Riđa kosa, prsluk i zeleni šal',
      'Kožna kapa i torba',
      'Smeđa kosa i plava kuta',
      'Velika radna jakna i crvena marama',
    ],
    confirm: 'To sam ja',
    /** His reply, the first line to use the name: the conductor, still doubtful. */
    reply: (name: string) => `${name}? Hm. Zapisat ću to. Olovkom, za svaki slučaj.`,
    next: 'Dalje',
  },
  /**
   * What the city says when a machine restarts (story 2.5; narrative design, Story Beats and
   * Dialogue Style): one or two lines per room, at most about 80 characters, never praising
   * him (NFR13), and never addressing him with a gendered past tense. Rooms 5–6 can come in
   * either order, so their lines don't mention each other. Kristijan's lines are notes in his
   * hand, and the First Automaton's are punched-tape notices, in capitals.
   */
  story: {
    speakers: {
      penkala: 'Gospon Penkala',
      nikola: 'Nikola',
      faust: 'Faust',
      kristijan: 'Majstor Kristijan',
      automaton: 'Prvi Automat',
    },
    /** In a line that takes his name, before he has one (a dev jump). */
    noName: 'šegrte',
    next: 'Dalje',
    rooms: {
      r01: [
        {
          who: 'penkala',
          text: 'Kaj? Prema Knjizi, vrata se dižu kurblom. Tri okreta, ni više ni manje.',
        },
        { who: 'penkala', text: 'A ova su se digla bez kurble. Toga nema u Knjizi.' },
      ],
      r02: [
        {
          who: 'penkala',
          text: (name: string) => `Svjetiljke gore. Čista sreća, ${name}. Ništa drugo.`,
        },
        { who: 'nikola', text: 'Sreća? Meni ne izgleda kao sreća.' },
      ],
      r03: [
        { who: 'nikola', text: 'Gle, automat kod stupa! Skida dijelove sa svjetiljke.' },
        { who: 'penkala', text: 'Prema Knjizi, smije. A voda teče, to je glavno.' },
      ],
      r04: [
        { who: 'nikola', text: 'Cijela ulica je vani. Svi gledaju kolo.' },
        { who: 'penkala', text: 'Gledam i ja. Samo da provjerim vrti li se po Knjizi.' },
      ],
      r05: [
        { who: 'automaton', text: 'OVAJ MOST NIJE U UPUTAMA. BIT ĆE ISPRAVLJEN. HVALA.' },
        { who: 'nikola', text: 'Netko je pribio papir na most. Tko piše samo velikim slovima?' },
      ],
      r06: [
        { who: 'faust', text: 'Ona radionica tamo bila je Kristijanova. Ključ je odsad tvoj.' },
        {
          who: 'faust',
          text: (name: string) => `Alat služi onome tko zna zašto, ${name}. Ne samo kako.`,
        },
      ],
      r07: [
        { who: 'kristijan', text: 'Pišem kako mi kažu. Tko razumije, vidjet će grešku.' },
        { who: 'faust', text: 'Kristijan ne griješi. Ova je greška namjerna. Netko ga je odveo.' },
      ],
      r08: [
        {
          who: 'nikola',
          text: (name: string) => `Ljudi u tramvaju pitaju za tebe. Kažu: „Gdje je ${name}?“`,
        },
        { who: 'penkala', text: 'Vožnja unatrag do početka? Toga sigurno nema u Knjizi.' },
      ],
      r10: [
        {
          who: 'penkala',
          text: (name: string) => `Vaga na tržnici je točna. Dobro, ${name}. Priznajem.`,
        },
        { who: 'nikola', text: 'Gospon Penkala je nešto priznao? To treba zapisati u Knjigu!' },
      ],
      r11: [
        { who: 'automaton', text: 'VELIKO KOLO NIJE ZA ŠEGRTE. BROJEVI SU PREVELIKI. ODUSTANITE.' },
        {
          who: 'nikola',
          text: (name: string) =>
            `Piše da odustaneš, ${name}. A kolo se vrti. Mislim da ga je strah.`,
        },
      ],
      r12: [
        { who: 'faust', text: 'Ovo je Kristijanov bubanj. Pamti svaki x koji isprobaš.' },
        { who: 'nikola', text: 'Na njemu su točkice. Kao da nešto crta.' },
      ],
      r13: [
        { who: 'nikola', text: 'Sve točkice leže na jednoj liniji. I cijela četvrt opet radi!' },
        {
          who: 'faust',
          text: 'Zadnji trag na bubnju vodi ravno do ljevaonice. A ona je zatvorena.',
        },
      ],
      r09: [
        { who: 'automaton', text: 'DIZALO JE ZAPEČAĆENO PO UPUTAMA. OTVARANJE NIJE PREDVIĐENO.' },
        { who: 'nikola', text: 'Pečat je pao. Ali tko lijepi te papire po cijelom gradu?' },
      ],
    },
    /** The city's log on the map: every line he has been told, to read again. */
    log: {
      open: 'Dnevnik grada',
      close: 'Zatvori',
      empty: 'Još se ništa nije pokrenulo.',
    },
  },
  /**
   * Explanation cards (story 2.6, FR34): the first time a room uses an idea, Nikola asks how,
   * and a card of one or two sentences gives the name school uses. Never praise (NFR13), and
   * no gendered past tense about him.
   */
  ideas: {
    ask: 'Kako to radi?',
    cards: {
      equal: {
        term: 'Jednadžba',
        text: 'Kad je vaga ravna, obje strane teže jednako. U jednadžbi to označava znak =.',
      },
      notch: {
        term: 'Umnožak',
        text: 'Svaki pomak klizača dodaje jednako: kad x naraste za 1, 3x naraste za 3, jer je 3x tri puta x.',
      },
      prediction: {
        term: 'Procjena i provjera',
        text: 'Zastavica je procjena: prvo pokušaš pogoditi, a stroj provjeri. U školi rješenje uvrstiš u jednadžbu.',
      },
      balance: {
        term: 'Isto na obje strane',
        text: 'Kad objema stranama dodaš ili oduzmeš isti broj, vaga ostaje ravna. Tako se rješava jednadžba.',
      },
      split: {
        term: 'Dijeljenje obiju strana',
        text: 'Kad obje strane podijeliš istim brojem, jednakost ostaje. Iz 2x = 18 dobiješ x = 9.',
      },
      compare: {
        term: 'Usporedba',
        text: 'Jednakost se ponekad vidi bez računanja: usporediš ono što se razlikuje.',
      },
      inverse: {
        term: 'Obrnute operacije',
        text: '− poništava +, a : poništava ·. Napravi to na objema stranama i vaga ostaje ravna.',
      },
      'take-away': {
        term: 'Oduzimanje nepoznanice',
        text: 'Kad se x oduzima, veći x čini stranu lakšom. Zato 135 − 5x = 100 vraćaš sa 135 − 100.',
      },
      story: {
        term: 'Jednadžba iz priče',
        text: 'Ono što ne znaš postaje x. Ono što je jednako stavi s obje strane znaka =.',
      },
      simplify: {
        term: 'Pojednostavljivanje',
        text: 'Kad su brojevi preveliki za isprobavanje, pojednostavi jednadžbu korak po korak. Klizač je provjera.',
      },
      linked: {
        term: 'Povezane jednadžbe',
        text: 'Rješenje jedne jednadžbe može biti broj u drugoj. Zato prvu riješi točno.',
      },
      linear: {
        term: 'Linearna jednadžba',
        text: 'Točkice leže na pravcu. „Linearna” dolazi od „linija”: zato se ove jednadžbe zovu linearne.',
      },
      mistake: {
        term: 'Traženje pogreške',
        text: 'Uvrsti rješenje: točan redak ostaje u ravnoteži, a krivi nagne vagu. 3x je tri puta x, a ne 3 + x.',
      },
    },
  },
  /**
   * Luka's view (story 2.11; architecture, `#dnevnik`): his son's play log and the backup
   * link, for Luka, not his son. Linked from nowhere in the game.
   */
  luka: {
    title: 'Dnevnik igre',
    back: 'Natrag u igru',
    notSaving: 'Napredak se trenutno ne sprema na ovom uređaju.',
    sessions: 'Igranje po danima',
    sessionsNone: 'Još nema zapisa.',
    day: 'Dan',
    count: 'Igranja',
    rooms: 'Sobe',
    room: 'Soba',
    entered: 'Prvi put',
    done: 'Riješena',
    resets: 'Ispočetka',
    ways: 'Načini',
    wayNames: { try: 'Probanje', balance: 'Vaga', undo: 'Unatrag' },
    predictions: 'Procjene (točno / krivo)',
    roomsNone: 'Još nijedna soba.',
    wrongLines: 'Pogrešni retci',
    latest: 'Zadnji pogrešni retci',
    latestNone: 'Nema pogrešnih redaka.',
    backup: 'Sigurnosna kopija',
    backupWhy: 'Veza vraća cijeli napredak na bilo kojem uređaju. Ne sadrži ime.',
    backupMake: 'Napravi vezu',
    backupCopy: 'Kopiraj',
    /** What the last try to make or copy the link said (story 2.11 review). */
    notes: {
      copied: 'Kopirano.',
      copyByHand: 'Kopiranje nije uspjelo. Dodirni vezu i kopiraj je ručno.',
      noSave: 'Još nema spremljene igre.',
      cantMake: 'Ovaj preglednik ne može napraviti vezu.',
    },
    exportLog: 'Preuzmi dnevnik (JSON)',
    /** Story 3.3: fights, by lair. */
    fights: 'Borbe',
    fightsNone: 'Još nijedna borba.',
    lair: 'Automat',
    fightCount: 'Borbe',
    wins: 'Pobjede',
    partsWon: 'Dijelova dobiveno',
    partsLost: 'Dijelova ostavljeno',
    afterLoss: (thenHard: number, losses: number) =>
      `Porazi nakon kojih slijedi borba s oklopom 45 ili više: ${thenHard} od ${losses}`,
    restore: {
      title: 'Vraćanje sigurnosne kopije',
      incoming: (rooms: number) => `Kopija: riješenih soba ${rooms}.`,
      current: (rooms: number) => `Na ovom uređaju: riješenih soba ${rooms}.`,
      noCurrent: 'Na ovom uređaju nema spremljene igre.',
      warning: 'Vraćanje zamjenjuje napredak na ovom uređaju. Ime ostaje.',
      accept: 'Vrati kopiju',
      decline: 'Odustani',
      broken: 'Ova veza nije ispravna sigurnosna kopija.',
      failed: 'Kopiju nije moguće spremiti na ovom uređaju.',
    },
  },
  /** Story 2.10: room 7, the old logbook's lines. */
  logbook: {
    /** The tag before he has tapped a line: tapping puts it on the scale. */
    tap: 'Dodirni redak – vaga će ga pokazati.',
    /** For screen readers: the flag beside a line, "this line is wrong". */
    flag: 'Pogrešan redak',
  },
  /** Story 2.2: the city map. Place names are placeholders until the final text (epic 6). */
  map: {
    title: 'Donji Kotač',
    nodes: {
      r01: 'Dizalo vrata',
      r02: 'Ulične svjetiljke',
      r03: 'Ustava',
      r04: 'Vodeno kolo',
      r05: 'Most',
      r06: 'Vagaonica',
      r07: 'Stari dnevnik',
      r08: 'Tramvaj',
      r09: 'Parno dizalo',
      r10: 'Tržnica',
      r11: 'Veliki kotač',
      r12: 'Raskrižje',
      r13: 'Toranj sa satom',
      // Each lair is named by its automaton's armour, so he can choose which to take on.
      'lair-20': 'Automat 20',
      'lair-30': 'Automat 30',
      'lair-45': 'Automat 45',
      'lair-60': 'Automat 60',
      workshop: 'Radionica',
      foundry: 'Ljevaonica',
    },
    /** For screen readers, after a node's name: what state it is in. */
    states: {
      restored: 'radi',
      open: 'otvoreno',
      locked: 'zaključano',
      seen: 'uskoro',
      winding: 'pobijeđen, odmara se',
      closed: 'zatvoreno',
    },
    /** For screen readers: a room he left halfway. */
    started: 'započeto',
    /** Story 3.3: on a lair, the parts he left there by losing, to win back. */
    pile: (n: number) => `ostavljeno ${n}`,
    /** Story 3.3: on a winding-down lair, when its automaton rewinds. */
    wakes: (minutes: number) => `budi se za ${minutes} min`,
  },
  /**
   * The opening (story 5.0; narrative design, Story Beats, "Opening | Start"): four panels
   * before anything else, told as a story, with no rules and no tips (GDD: the machine
   * teaches). Each line is short enough for a phone.
   */
  opening: {
    panels: [
      'Satograd je grad zupčanika i pare. Sve strojeve složio je Majstor Kristijan.',
      'Upute za svaki stroj zapisao je u Knjigu. Ljudi ih slijede i ne pitaju zašto.',
      'Jednog jutra radionica je prazna. Kristijana nema. Strojevi staju jedan po jedan.',
      'Na podu radionice leži njegova bilježnica. U njoj nisu upute, nego pitanja.',
    ],
    next: 'Dalje',
    skip: 'Preskoči',
    begin: 'Kreni',
  },
  /**
   * The town (story 5.0): the square he walks through, its people and its machines. A
   * person introduces themself the first time they speak.
   */
  town: {
    /** The district map, a tap away in the town's corner. */
    map: 'Karta četvrti',
    /** The opening again, from the town's corner. */
    intro: 'Priča od početka',
    /** Ways between areas, for the tap areas' labels. */
    exits: {
      'square-canal': 'Kroz vrata, do kanala',
      'canal-square': 'Natrag na trg',
      'canal-mill': 'Uz kanal, do mlina',
      'mill-canal': 'Natrag do kanala',
    },
    close: 'Zatvori',
    /** For screen readers: the town as a whole, and a tap on the ground. */
    label: 'Trg u Donjem Kotaču',
    walk: 'Hodaj ovamo',
    people: {
      penkala: {
        name: 'Gospon Penkala',
        who: 'kondukter, uvijek s Knjigom',
        before: [
          'Prema Knjizi: tri okreta kurble, svako jutro. Okrećem. Vrata stoje.',
          'Ne diraj stroj, molim. Toga nema u Knjizi.',
        ],
        after: ['Vrata su gore. A u Knjizi piše tri okreta.', 'Hm. Možda je Knjiga stara.'],
      },
      nikola: {
        name: 'Nikola',
        who: 'sin palitelja svjetiljki',
        before: [
          'Tata pali svjetiljke svaku večer. Sad ne gori nijedna.',
          'Kristijan bi znao. Ali Kristijana nema.',
        ],
        after: ['Gore! Sve četiri!', 'Kako to radi? Pokaži mi poslije.'],
      },
    },
    places: {
      /** A machine he can play: its name is enough; this is what a locked one says. */
      locked: 'Ovaj stroj čeka. Prvo neki drugi.',
      /** A machine he has fixed: it runs, and there is nothing left to do here. */
      running: (name: string) => `${name}: radi. Ovdje je sve gotovo.`,
      workshop: 'Kristijanova radionica. Zaključana, a ključ je kod nekog drugog.',
      automaton: 'Automat skida dijelove sa zida. Bolje ga zasad zaobići.',
      /** The automaton he beat, until it is back (ADR-13). */
      beaten: (minutes: number) => `Ovaj automat je pobijeđen. Opet je tu za ${minutes} min.`,
    },
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
      /** Story 4.4: from room 8 on, once he knows the flag (room 9's pans leave less room). */
      'level-x-short': 'Gdje će vaga biti u ravnoteži?',
      /** Story 4.5: room 10's story pin, at the notebook: which story fits the pans. */
      'story-choice': 'Koja priča odgovara vagi? Stavi zastavicu na nju.',
      /** Story 4.6: room 11's range pin, at the notebook: about how big x is. */
      range: 'Koliki je x otprilike? Stavi zastavicu.',
      /** Story 4.8: room 13's drum pin, at the notebook: where the next dot lands. */
      'next-dot': 'Gdje će pasti sljedeća točkica? Stavi zastavicu.',
      effect: 'Kad x raste, na koju će se stranu vaga nagnuti?',
      /** Story 2.8: room 5's second stage, after the load changed: the change's own tag. */
      change: 'Teret se promijenio. Gdje će vaga sada biti u ravnoteži?',
      /** Story 2.10: room 7's mistake pin, at the notebook: which written line is wrong. */
      'wrong-line': 'Koji je redak pogrešan? Stavi zastavicu na njega.',
      /** Story 2.9: room 6, the readouts hidden: compare the pieces, don't add them up. */
      hidden: 'Vaga ne pokazuje zbrojeve. Usporedi utege: gdje će vaga biti u ravnoteži?',
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
    /** Story 2.10: at the notebook, once the logbook's wrong line is found: write it again. */
    rewrite: 'Prekriženi redak nije točan. Napiši ga ispravno.',
    /** At the notebook, when his dial first levels the pans. */
    write: 'Vaga je u ravnoteži. Upiši x u bilježnicu.',
    /** Story 1.16: at the notebook, when x is alone on the pans and no answer is written. */
    answer: 'x je sam na vagi. Upiši koliko je x.',
    /** At the notebook, after the answer line. */
    check: 'Provjeri: uvrsti broj umjesto x.',
    /** At the tray, when it is first offered. */
    tray: 'Stavi broj s police na vagu – ide na obje strane.',
    /** Above the scale, after his first Balance move. */
    'balance-goal': 'Ostavi x samog na jednoj strani, kao na kartici Cilj.',
    /** At the splitter, when it is first offered. */
    splitter: 'Razdjelnik dijeli obje strane na jednake dijelove.',
    /** Story 4.1: at the gear chain, when it first works: undo its last link. */
    chain: 'Dodirni zadnju kariku lanca i poništi je.',
    /** Story 4.5: at the notebook, while a story waits to be written as its equation. */
    story: 'Pročitaj priču i zapiši je kao jednadžbu.',
  },
  /**
   * Story 4.5: the story room's stories (room 10, the market scales; `StoryKey`). Each tells
   * the equation the room's data gives it.
   */
  stories: {
    label: 'Priča',
    /** 60 + 3x = 90. */
    wrench:
      'Ključ košta 60 dijelova. Ključ i 3 jednaka zupčanika zajedno koštaju 90. Koliko košta jedan zupčanik?',
    /** 5x + 2 = 19. */
    'five-cogs': '5 jednakih zupčanika i kutija teška 2 zajedno teže 19.',
    /** 5 + 2x = 19: the one that fits room 10's second stage. */
    'box-two-cogs': 'Kutija teži 5. Kutija i 2 jednaka zupčanika zajedno teže 19.',
    /** 19 + 2x = 5. */
    'box-nineteen': 'Kutija teži 19. Kutija i 2 jednaka zupčanika zajedno teže 5.',
    /** For screen readers, on a story's flag. */
    flag: (n: number) => `Zastavica na priču ${n}`,
    confirm: 'Potvrdi',
  },
  /** Story 4.8: the recording drum (room 13), at the top of the notebook. */
  drum: {
    label: 'Bubanj',
    /** For screen readers: what the drum shows. */
    read: (n: number) => `Bubanj: ${n} ${dotsWord(n)} i crta ravnoteže`,
  },
  /** Story 4.7: linked machines (room 12), at the top of the notebook. */
  linked: {
    label: 'Povezani strojevi',
    feeds: 'Rješenje ovog stroja ide u sljedeći:',
    fed: 'Rješenje prethodnog stroja je ovdje uteg:',
    /** For screen readers: the ☐ the answer will fill. */
    slot: 'prazno mjesto',
  },
  /** Story 4.6: a range pin's places (room 11), and a coarse dial's single steps. */
  range: {
    label: 'Koliki je x?',
    under: (n: string) => `x je manji od ${n}`,
    between: (from: string, to: string) => `x je od ${from} do ${to}`,
    over: (n: string) => `x je veći od ${n}`,
  },
  fineDial: {
    label: 'Klizač, korak po korak',
    down: 'x manji za 1',
    up: 'x veći za 1',
  },
  /** Story 4.1: the gear chain at the top of the notebook (GDD, Gear chain). */
  chain: {
    label: 'Lanac',
    /** When the pans aren't a chain (x on both sides, or a sum not yet worked out). */
    off: 'Lanac čeka: x mora biti samo s jedne strane.',
    /** For screen readers: the last link, to tap. */
    tap: (link: string) => `Karika ${link}: dodirni je i poništi`,
    /** For screen readers: a link already undone, dark. */
    undone: ', poništeno',
    /** The picker's name, for screen readers. */
    undo: (link: string) => `Što poništava ${link}?`,
    /** Before he picks an operation. */
    pickOp: 'Odaberi operaciju, pa upiši broj.',
    ops: {
      add: 'plus',
      sub: 'minus',
      mul: 'puta',
      div: 'podijeljeno',
      from: 'broj minus lanac',
    },
    run: 'Pokreni',
    cancel: 'Zatvori',
  },
  /** Story 1.16: the goal card in the scene while the tray is offered: what Balance aims for. */
  goal: {
    label: 'Cilj: x sam',
    /** The large banner above the scene (story 1.16): its heading, and what it asks for. */
    heading: 'Cilj',
    target: 'x sam na jednoj strani',
  },
  /**
   * Story 1.16: the hint button's second press, the exact next move (room/hint.ts). The
   * numbers and lines come in written in school notation (math/format.ts).
   */
  hint: {
    /** Story 2.7, help level 3: over the line a move on the machine will write, with blanks. */
    structure: 'Taj se korak zapisuje ovako:',
    /** Story 2.7, help level 4: over the same kind of equation with other numbers, solved. */
    example: 'Isto, s drugim brojevima:',
    /** By the knob: which way to move the slider. */
    slide: { right: 'Pomiči klizač udesno.', left: 'Pomiči klizač ulijevo.' },
    /** At the tray: a balloon of n takes n off both sides. */
    take: (n: string, balloon: string) =>
      `Skini ${n} s obje strane: stavi balon ${balloon} na vagu.`,
    /** At the tray: a weight of n adds n to both sides. */
    add: (n: string, weight: string) => `Dodaj ${n} na obje strane: stavi uteg ${weight} na vagu.`,
    /** Story 4.5: at the notebook, the story as its equation. */
    story: (line: string) => `Zapiši priču kao jednadžbu: ${line}.`,
    /** Story 4.2 review: a weight too big for the tray, dragged off its pan. */
    takeOff: (n: string) => `Odvuci uteg ${n} s vage: skine se s obje strane.`,
    /** Story 4.2, at the tray: its x-gear adds that many x to both sides. */
    addGear: (gears: string) => `Dodaj ${gears} na obje strane: stavi zupčanik ${gears} na vagu.`,
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
    /** Story 4.1 review: at the notebook, the blank a chain run left (Undo `blanks`). */
    blankWhat: 'Lanac je napravio korak. Upiši što je ostalo na vagi.',
    blank: (n: string) => `Upiši ${n} u prazno polje.`,
    /** Story 4.1, at the gear chain: the last link, and what undoes it. */
    chain: (link: string, inverse: string) => `Dodirni kariku ${link} i odaberi ${inverse}.`,
  },
  /**
   * Epic 3: automaton fights (GDD, Automaton fights). He rolls dice, places them as blade
   * `a`, charge `b` and reach, sets his blows `x` and sees `a · x + b`, never the total.
   */
  fight: {
    /** The fight screen's name, for screen readers: the lair's automaton. */
    title: (armour: number) => `Automat s oklopom ${armour}`,
    armour: 'Oklop',
    hull: 'Trup',
    steam: 'Para',
    /**
     * One plain line under each stat and control, so the fight explains itself without the
     * guide: what the number is for.
     */
    captions: {
      armour: 'koliko još treba do 0',
      hull: 'koliko još izdržiš',
      steam: '1 po udarcu, ostatak su dijelovi',
      formula: 'zbroj vidiš tek kad udariš',
      blows: 'koliko puta udaraš',
    },
    /** For screen readers: what is left of his hull and steam. */
    left: (what: string, n: number, of: number) => `${what}: ${n} od ${of}`,
    roll: 'Baci kocke',
    /** For screen readers: a die and its number; a die already in a slot says so. */
    die: (n: number) => `Kocka ${n}`,
    dieIn: (n: number, slot: string) => `Kocka ${n}, u utoru ${slot}`,
    slots: {
      blade: 'Oštrica',
      charge: 'Naboj',
      reach: 'Doseg',
    },
    /** Under each slot's name: what it does in a · x + b. */
    slotHints: {
      blade: 'a, u svakom udarcu',
      charge: 'b, doda se jednom',
      reach: 'najviše udaraca',
    },
    /** For screen readers: an empty slot. */
    emptySlot: 'prazno',
    /** The tag before the dice are placed: tap a die, then a slot. */
    placeTag: 'Dodirni kocku, pa utor.',
    /** Story 3.5: with the 4th die, the one left out of the slots is discarded. */
    placeTagFour: 'Dodirni kocku, pa utor. Jedna kocka ostaje sa strane.',
    blows: 'Udarci',
    /** For screen readers: the blows dial's notch. */
    blowsNotch: (x: number) => `${x} ${blowsWord(x)}`,
    strike: 'Udari',
    /** Leaving: free before the first strike, a loss after it (story 3.2). */
    leave: 'Odlazak',
    leaveLoses: 'Ako sada odeš, automat pobjeđuje i dio tvojih dijelova ostaje ovdje.',
    leaveConfirm: 'Ipak idem',
    stay: 'Ostajem',
    /** The round in play. */
    round: (n: number) => `Krug ${n}`,
    /** Story 3.2: under the strike's sum, what it did to the armour. */
    armourFell: (before: number, after: number) => `Oklop ${before} → ${after}`,
    /** Armour landed on exactly 0. */
    clean: 'Čisti rez!',
    /** Armour was left, so the automaton struck back. */
    dented: 'Automat uzvraća: udubljenje u trupu.',
    /** How the fight ended. */
    won: 'Automat staje. Pobijeđen je.',
    lost: 'Automat je ovaj put jači.',
    reasons: {
      hull: 'Trup ne može podnijeti još jedno udubljenje.',
      steam: 'Nestalo je pare za udarce.',
      left: 'Borba je napuštena prije kraja.',
    },
    back: 'Natrag na kartu',
    /** Story 3.3: what the fight paid or cost, on its end. */
    paid: (n: number) => `+${n} ${partsWord(n)}`,
    /** Parts the win paid: base parts and the steam left. */
    paidHow: (base: number, steam: number) =>
      `${base} za automat + ${steam} ${steamLeftWord(steam)}`,
    doubled: 'Čisti rez udvostručuje nagradu.',
    recovered: (n: number) => `+${n} vraćeno s hrpe`,
    dropped: (n: number) =>
      `${n} ${partsWord(n)} ${fewParts(n) ? 'ostaju' : 'ostaje'} kod automata. Pobjeda ${partsWord(n) === 'dio' ? 'ga' : 'ih'} vraća.`,
    droppedNone: 'Nijedan dio nije ostao kod automata.',
    /** On the fight's start: a pile he left here before. */
    pileHere: (n: number) =>
      `Ovdje te ${fewParts(n) ? 'čekaju' : 'čeka'} ${n} ${partsWord(n)} s prošle borbe.`,
  },
  /**
   * The guided first fight (fight/guide.ts): Nikola, the lamplighter's kid, talks him
   * through his first round, one step at a time. A line or two per step, each under 80
   * characters, in the present tense, so no line needs his gender.
   */
  fightGuide: {
    /** For screen readers: the guide's card. */
    label: 'Nikola objašnjava borbu',
    /** Closes a step he only reads; the last one says so. */
    next: 'Dalje',
    last: 'Idemo!',
    steps: {
      armour: ['Ovo je automat. Broj ispod njega je oklop: koliko još treba skinuti.'],
      goal: ['Cilj: spusti oklop na 0. Tada automat staje i dobivaš dijelove.'],
      roll: ['Baci kocke! Svaki krug počinje bacanjem.'],
      blade: ['Odaberi kocku i stavi je na Oštricu. Oštrica se broji u svakom udarcu.'],
      charge: ['Sad jednu kocku stavi na Naboj. Naboj se doda samo jednom.'],
      reach: ['Zadnju kocku stavi na Doseg. Doseg je najviše udaraca u krugu.'],
      blows: ['Koliko puta udaraš? Odaberi broj. To je x u računu iznad.'],
      strike: ['Sad udari! Zbroj vidiš tek nakon udarca.'],
      banner: ['Evo zbroja. Točno toliko pada s oklopa.'],
      dent: ['Oklop nije na 0, pa automat uzvraća. Kad se trup isprazni, gubiš.'],
      steam: [
        'Svaki udarac troši 1 paru. Para koja ostane postaje dijelovi.',
        'Zato je bolje manje udaraca, a jačih.',
      ],
      clean: ['Ako oklop padne točno na 0, to je čisti rez: dvostruka nagrada!'],
    },
  },
  /**
   * Story 3.5: the old mechanic's counter at the workshop (narrative design: unhurried, with
   * machine sayings, knows more than he says). Upgrades for parts (GDD, Automaton fights).
   */
  shop: {
    title: 'Radionica',
    speaker: 'Faust',
    line: 'Stroj je dobar koliko i njegov najslabiji zupčanik. Dijelove imaš? Onda biraj.',
    back: 'Natrag na kartu',
    upgrades: {
      'fourth-die': {
        name: 'Četvrta kocka',
        what: 'Baciš četiri kocke, a jednu ostaviš sa strane.',
      },
      steam: { name: 'Para +3', what: 'Tri udarca više u svakoj borbi.' },
      hull: { name: 'Trup +1', what: 'Jedno udubljenje više prije poraza.' },
    },
    cost: (n: number) => `${n} ${partsWord(n)}`,
    buy: 'Kupi',
    owned: 'Kupljeno',
    /** Not enough parts yet: how many more. */
    short: (n: number) => `Još ${n}`,
  },
  /**
   * Story 3.4: the three torn logbook pages the armour 30, 45 and 60 automatons carry
   * (narrative design, Found Documents): lore only, in Majstor Kristijan's hand, hinting at
   * why the First Automaton wants to know why. Placeholders until epic 6.
   */
  pages: {
    title: 'Otrgnute stranice',
    /** Over the fight's end, when a win returns a page. */
    found: 'Automat je nosio otrgnutu stranicu iz dnevnika.',
    /** For screen readers: the map's button for the pages. */
    open: 'Otrgnute stranice iz dnevnika',
    close: 'Zatvori',
    sign: '— K.',
    count: (n: number, of: number) => `Pronađeno: ${n} od ${of}`,
    text: {
      'page-1': {
        title: 'Iz dnevnika, list prvi',
        lines: [
          'Prvi Automat me je danas pitao zašto treća uputa dolazi prije četvrte.',
          'Odgovorio sam: tako piše u Knjizi. Nije mu bilo dosta.',
        ],
      },
      'page-2': {
        title: 'Iz dnevnika, list drugi',
        lines: [
          'Kotač se istrošio pa upute više ne vrijede. Grad se svejedno drži Knjige.',
          'Prvi Automat zna sve upute napamet, a nijedan razlog. To ga muči.',
        ],
      },
      'page-3': {
        title: 'Iz dnevnika, list treći',
        lines: [
          'Tko god ovo čita: nauči zašto, ne samo kako.',
          'Tko zna zašto, popravit će i ono čega u Knjizi nema.',
        ],
      },
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
    /** Story 4.5: while the story waits, a line that isn't the story as it is told. */
    story: 'Prvo zapiši priču onako kako je ispričana.',
  },
} as const;
