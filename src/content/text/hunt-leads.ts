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

export const l04Text = {
  title: 'Tramvajska linija',
  lesson: {
    found:
      'Belušić, vozač tramvaja, sve mjeri, a pamti samo neke stanice. Mali automat našao je valjak ispod sjedala.',
    steps: [
      ['Na brojevnom pravcu svaki je korak jednako dug.', 'Taj se korak zove jedinična dužina.'],
      ['Jedinična dužina ne mora biti 1.', 'Od 0 do 10 su dva koraka, pa jedan korak vrijedi 5.'],
      ['Pravac ne mora početi od nule.', 'Prvo izračunaj koliko vrijedi jedan korak.'],
    ],
  },
  tries: {
    mark: 'Dodirni stanicu 25. Koliko vrijedi jedan korak?',
    point: 'Stanica B je između 10 i 20. Koliko je B? Napiši.',
  },
  mistake: {
    say: 'Mali automat broji crtice. Jedan njegov redak nije točan. Dodirni ga.',
    nudge: 'Taj je redak točan. Pogledaj koliko vrijedi jedan korak.',
    show: 'Pokaži mu: dodirni stanicu koja je tri koraka od nule.',
    write: 'Sad napiši točan redak.',
    thanks: 'Mali automat kima. Više neće brojati crtice.',
  },
  scene: {
    intro:
      'Belušić pamti samo neke stanice. Automati patroliraju. Nađi stanicu gdje su kola ušla na liniju.',
    caught: [
      'OPAŽENO. VRAĆENO NA POČETAK. HVALA.',
      'NEOVLAŠTENO KRETANJE. ISPRAVLJENO. HVALA.',
      'OVO JE ZABILJEŽENO. POČNI ISPOČETKA. HVALA.',
    ],
    empty: 'Ovdje nema ničega. Belušić odmahuje: "Nije ta. Evo, pokušaj s drugom stanicom."',
    found: 'Tu su! Na stanici je trag kotača.',
    opened: 'Belušić zapisuje: "Točno. Tu su ušla kola."',
    hint: {
      step: 'Pogledaj dvije stanice s brojem. Koliko je koraka između njih? Koliko onda vrijedi jedan korak?',
      move: 'Podijeli razliku dvaju brojeva brojem koraka, pa broji od poznate stanice.',
    },
    example: ['Primjer: od 40 do 60 su 4 koraka.', '20 : 4 = 5', 'Jedan korak vrijedi 5.'],
  },
  write: {
    point: 'Zapiši u bilježnicu gdje su kola ušla na liniju: stanica A na prvom pravcu.',
  },
  find: {
    say: 'Kola su ušla na liniju kod stanice 25.',
    title: 'Brojevni pravac. Jedinična dužina.',
    card: [
      'Na brojevnom pravcu svaki je korak jednako dug. Taj se korak zove jedinična dužina.',
      'Jedinična dužina ne mora biti 1, a pravac ne mora početi od nule.',
      'Da pročitaš broj na pravcu, prvo izračunaj koliko vrijedi jedan korak: razliku dvaju brojeva podijeli brojem koraka između njih.',
    ],
  },
} as const;

export const l06Text = {
  title: 'Novine',
  lesson: {
    found: 'Zagorka zaokružuje sve, pa i naslove. U uredništvu je pod stolom valjak.',
    steps: [
      ['"Oko 330" znači bilo koji broj od 325 do 334.', 'Pišemo 334 ≈ 330.'],
      [
        'Gledamo samo prvu znamenku iza mjesta na koje zaokružujemo.',
        'Ako je 5 ili više, idemo naviše. Ako je manja, ostajemo.',
      ],
      ['Pogreška je razlika između broja i njegove zaokružene vrijednosti.', '334 − 330 = 4'],
    ],
  },
  tries: {
    mark: 'Na koju se deseticu zaokružuje 334? Dodirni je.',
    line: 'Zaokruži 487 na desetice. Napiši.',
  },
  mistake: {
    say: 'Mali automat zaokružuje korak po korak. Jedan njegov redak nije točan. Dodirni ga.',
    nudge: 'Taj je redak točan. Pogledaj samo prvu znamenku iza mjesta na koje zaokružuješ.',
    show: 'Pokaži mu: na koju se tisućicu zaokružuje 2 449? Dodirni je.',
    write: 'Sad napiši točan redak.',
    thanks: 'Mali automat kima. Sad gleda samo jednu znamenku.',
  },
  scene: {
    intro: 'Tri bilješke za isti članak, a brojevi se ne slažu. Jedna ne može biti točna.',
    who: {
      zagorka: 'Zagorka',
      slagar: 'Slagar',
      raznosac: 'Raznosač',
    },
    offended: {
      zagorka: '"Ja? Moji su naslovi zaokruženi, a ne lažni!"',
      raznosac: '"Jednom sam se zabunio, i to je sve!"',
    },
    why: {
      zagorka: 'Zagorka je svaki put pogledala pravu znamenku.',
      raznosac: 'Raznosač je pogriješio samo jednom, a ostale je zaokružio točno.',
    },
    cards: {
      a: 'Zaokruži 334 na desetice.',
      b: 'Zaokruži 5 632 na stotice.',
      c: 'Zaokruži 71 240 na tisućice.',
    },
    reveal: 'Slagar svaki put ide naviše, kakva god da je znamenka.',
    fix: 'Napiši njegov prvi redak kako treba.',
    opened: 'Zagorka podigne obrve: "E, to ću objaviti."',
    hint: {
      step: 'Tko griješi svaki put na isti način? Jedna pogreška još nije laž.',
      move: 'Pogledaj Slagara: svaki put ide naviše.',
    },
    example: [
      'Primjer s drugim brojem:',
      '1 240 ≈ 1 000',
      'Znamenka iza tisućica je 2, pa ostajemo.',
    ],
  },
  write: {
    approx: 'Zapiši zaokruživanje.',
    error: 'Kolika je pogreška? Napiši razliku.',
  },
  find: {
    say: 'U novinama je zapisano kamo su kola krenula, zaokruženo, ali dovoljno točno.',
    title: 'Zaokruživanje. Procjena.',
    card: [
      'Kad zaokružujemo, gledamo samo prvu znamenku iza mjesta na koje zaokružujemo. Ako je 5 ili više, idemo naviše. Ako je manja, ostajemo.',
      'Znak ≈ znači "približno jednako". Pogreška je razlika između broja i zaokružene vrijednosti.',
    ],
  },
} as const;

export const l03Text = {
  title: 'Arhiv',
  places: ['dvorana', 'red', 'polica', 'kutija', 'fascikl'],
  hundreds: ['stotice', 'desetice', 'jedinice'],
  thousands: ['tisućice', 'stotice', 'desetice', 'jedinice'],
  lesson: {
    found:
      'Arhivar pokaže na mala vrata: "Ovuda ja ne prolazim." Mali automat nađe valjak i pusti ga.',
    steps: [
      [
        'Deset fascikala stane u kutiju. Deset kutija na policu. I tako dalje.',
        'Svako mjesto vrijedi deset puta više od onoga desno.',
      ],
      [
        '10 · 10 · 10 kratko pišemo 10³: deset na treću.',
        'Mali broj kaže i koliko nula ima: 1 000.',
      ],
      ['Znamenka vrijedi prema mjestu na kojem stoji.', '354 = 3 · 10² + 5 · 10 + 4'],
    ],
  },
  tries: {
    places: 'Složi 354: 3 stotice, 5 desetica, 4 jedinice.',
    power: 'Koliko je 10³? Napiši.',
    words: 'Trideset tisuća petnaest. Napiši taj broj znamenkama.',
  },
  mistake: {
    say: 'Mali automat rastavlja brojeve. Jedan njegov redak nije točan. Dodirni ga.',
    nudge: 'Taj je redak točan. Izračunaj oba dijela pa zbroji.',
    show: 'Pokaži mu: složi 507. Koliko je desetica?',
    write: 'Sad napiši točan redak. Tipka ⁿ piše mali broj: 10, pa ⁿ, pa 2 daje 10².',
    thanks: 'Mali automat kima. Više neće ispuštati nule.',
  },
  scene: {
    intro: 'Ovuda može samo mali automat.',
    route: '3 · 10⁴ + 4 · 10³ + 7 · 10 + 2',
    deadEnd: 'Slijepa cijev. Na pločici piše što tvoj put dosad znači:',
    opened: 'Mali automat vraća se ponosan i nosi list papira: otpremnicu iz ljevaonice.',
    hint: {
      step: 'Znak kaže koje se mjesto bira. Što u tragu stoji uz to mjesto?',
      move: 'Nađi u tragu broj uz to mjesto. Ako uz njega nema ničega, biraš 0.',
    },
    example: ['Primjer: 2 · 10³ + 5 znači 2 005.', 'Stotica i desetica nema, pa je tamo 0.'],
  },
  write: {
    fade: 'Zapiši rastav. Što ide u kvadratić?',
    whole: 'A sad cijeli rastav broja 34 072. Tipka ⁿ piše mali broj.',
  },
  find: {
    say: 'Otpremnica iz ljevaonice: Majstor Kristijan otpremljen je kolima, i to je netko potpisao.',
    title: 'Veliki brojevi. Potencije broja 10.',
    card: [
      'Pomakneš li znamenku jedno mjesto ulijevo, vrijedi deset puta više.',
      '10⁶ je kraći zapis za šest desetica pomnoženih međusobno. Čitamo: deset na šestu. Mali broj kaže i koliko nula ima iza jedinice.',
      'Kad mjesto ostane prazno, pišemo 0: 507 je 5 stotica, 0 desetica i 7 jedinica.',
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

/** The plain board a sealed lead gains. */
export const sealedText = {
  intro: 'Crna nit stigla je prije tebe. Automati čuvaju ulaz.',
  caught: ['OPAŽENO. VRAĆENO NA POČETAK. HVALA.', 'OVO JE ZABILJEŽENO. POČNI ISPOČETKA. HVALA.'],
  found: 'Put je slobodan.',
  opened: 'Automati nisu ništa primijetili. Trag je još tu.',
  hint: {
    step: 'Čekaj da automat skrene iza ugla, pa kreni.',
    move: 'Idi naprijed kad je mjesto ispred tebe prazno, a inače čekaj.',
  },
} as const;

/** What each scene type's first-time guide says (story 9.7). */
export const sceneGuideText = {
  knock: knockGuideText,
  sneak: {
    intro: 'Ovdje se ništa ne miče dok se ti ne pomakneš. Svaki tvoj korak, automat napravi svoj.',
    line: 'Stanica sa slovom nema broj. Izračunaj koliko vrijedi jedan korak, pa napiši koji je to broj.',
    step: 'Sad je stanica upaljena. Idi do nje, a pazi na automat. Možeš i čekati.',
  },
  unmask: {
    intro: 'Jedan od njih laže. Svako pitanje pokaže kako je tko računao.',
    ask: 'Dodirni pitanje u bilježnici. Treba ih barem dva.',
    accuse: 'Tko griješi svaki put na isti način? Dodirni njegovo ime.',
    write: 'Sad napiši njegov redak kako treba.',
  },
  alone: {
    intro: 'Ovuda može samo mali automat. Trag kaže kuda dalje.',
    pipe: 'Znak kaže što se ovdje bira. Izaberi broj iz traga.',
  },
  guard: {
    intro: 'Automat izvršava pravilo s trake. Pravilo nije točno, a ti to možeš pokazati.',
    pick: 'Izaberi pločicu za koju pravilo ne vrijedi.',
    write: 'Sad napiši točan redak koji to pokazuje.',
  },
  carts: {
    intro: 'Sanduci su na zemlji, a svaki se tovar slaže po deset.',
    load: 'Dodirni kola da ih natovariš. Kad je sve na kolima, pritisni Kreni.',
    write: 'Sad to napiši u bilježnicu.',
  },
  level: {
    intro: 'Greda je nagnuta. Ravna je tek kad su svi stupci jednaki.',
    move: 'Dodirni visoki stupac, pa niski: sanduk prelazi s jednog na drugi.',
    write: 'Sad napiši račun.',
  },
  locks: {
    intro: 'Brava se otvara samo ako zagrade stoje na pravom mjestu.',
    tap: 'Dodirni broj gdje zagrada počinje, pa broj gdje završava.',
  },
  windows: {
    intro: 'Prozori su numerirani redom, po katovima. Mali automat baca kuku.',
    throw: 'Izračunaj koji je to prozor, pa ga dodirni.',
  },
  loop: {
    intro: 'Automat s ključem hoda u krug. Kad zazvoni zvono, zaspi gdje se zatekne.',
    write: 'Nakon cijelih krugova ostane još nekoliko koraka. Napiši dijeljenje s ostatkom.',
  },
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
  shake:
    'Mali automat vrti glavom i pokazuje na trag. Ako neki tvoj redak ne valja, dodirni ga i on će se prekrižiti.',
  offTask: 'To je točno, ali nije ono što se traži. Pročitaj zadatak još jednom.',
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
  wait: 'Čekaj',
  moreRows: 'Još jedan red',
  fewerRows: 'Jedan red manje',
  moreColumns: 'Još jedan stupac',
  fewerColumns: 'Jedan stupac manje',
  rest: 'ost.',
  ground: (crates: number) => `Na zemlji: ${crates}`,
  noCarts: 'Nema kola',
  go: 'Kreni',
  lockTarget: 'Brava se otvara na:',
  turn: 'Okreni se',
  loopSay: 'Napiši dijeljenje. Ostatak kaže kod koje svjetiljke automat zaspi.',
  me: 'Ti',
  patrol: 'Automat',
  askMore: (n: number) => `Prvo postavi barem ${n} pitanja.`,
  aloneHelp: (sign: string) => `Pogledaj što u tragu stoji uz: ${sign}.`,
} as const;

/** The trail map's labels. */
export const trailText = {
  title: 'Trag',
  heading: 'Crna nit ide prema tragu s tamnim prstenom. Ako ga ti prvi počneš, skrenut će.',
  reached: 'Crna nit stigla je do tamne točke. Trag nije izgubljen, samo ga čuvaju automati.',
  oldMap: 'Stari grad',
  leads: {
    l01: 'Dvije strane',
    l02: 'Susjedi',
    l03: 'Arhiv',
    l04: 'Tramvajska linija',
    k1: 'Prvi čvor',
    w1: 'Gdje je mali automat?',
    l05: 'Svjedoci',
    l06: 'Novine',
    l07: 'Knjige računa',
    l08: 'Pročelje',
    k2: 'Drugi čvor',
    l09: 'Dvorište sanduka',
    l10: 'Šesta kola',
    l11: 'Pet osoba',
    k3: 'Treći čvor',
    l12: 'Brave',
    l13: 'Dva svjedoka',
    l14: 'Krug',
    l15: 'Dizalica',
    l16: 'Ulje za svjetiljke',
  },
  open: 'Otvoreni trag',
  done: 'Riješeno',
} as const;
