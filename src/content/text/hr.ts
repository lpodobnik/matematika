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
      'Ravne šiške i plava kuta',
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
        { who: 'automaton', text: 'OVAJ MOST NIJE U KORACIMA. BIT ĆE ISPRAVLJEN. HVALA.' },
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
      closed: 'zatvoreno',
    },
    /** For screen readers: a room he left halfway. */
    started: 'započeto',
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
      blade: 'a',
      charge: 'b',
      reach: 'najviše udaraca',
    },
    /** For screen readers: an empty slot. */
    emptySlot: 'prazno',
    /** The tag before the dice are placed: tap a die, then a slot. */
    placeTag: 'Dodirni kocku, pa utor.',
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
    won: 'Automat staje i odmotava se.',
    lost: 'Automat je ovaj put jači.',
    reasons: {
      hull: 'Trup ne može podnijeti još jedno udubljenje.',
      steam: 'Nestalo je pare za udarce.',
      left: 'Borba je napuštena prije kraja.',
    },
    back: 'Natrag na kartu',
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
