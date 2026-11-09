// Act 4 and the last lead's Croatian (GDD, Part 2: The Trail), with the ending's panels. All of it
// is a draft for Luka: his wording wins, and every line waits for his review.

export const act4Text = {
  l12: {
    title: 'Brave',
    lesson: {
      found: 'Gospon Penkala stoji pred bravom i čita Knjigu. Pod otiračem je valjak.',
      steps: [
        ['Bez zagrade prvo se množi.', 'Tu su 2 komada i još 3 svežnja po 4.'],
        ['Zagrada kaže: ovo izračunaj prvo, kao da je jedan broj.', '(2 + 3) · 4 = 5 · 4 = 20'],
        [
          'Zagrada može biti i u zagradi. Kreni iznutra: ( ), pa [ ], pa { }.',
          '2 · [3 + (4 − 1)] = 2 · 6 = 12',
        ],
      ],
    },
    tries: {
      rows: 'Složi (2 + 3) · 5. Dva reda po 5 već stoje. Dodaj još tri reda.',
      sum: 'Koliko je (1 + 4) · 3? Prvo izračunaj zagradu.',
      place: 'Stavi zagradu tako da bude točno: 6 + 2 · 3 = 24. Napiši cijeli redak.',
    },
    mistake: {
      say: 'Mali automat računa sa zagradama. Jedan njegov redak nije točan. Dodirni ga.',
      nudge: 'Taj je redak točan. Izračunaj prvo ono što je u zagradi.',
      show: 'Pokaži mu: 3 + 2 su 5 redova. Složi 5 redova po 5.',
      write: 'Sad napiši točan redak.',
      thanks: 'Mali automat kima. Zagrade više nisu ukras.',
    },
    scene: {
      intro:
        'Vrata Majstora Kristijana nemaju ključ, nego račun. Otvaraju se samo onome tko zna što rade zagrade.',
      shut: (result: string) => `Brava se ne miče. Tako ispada ${result}.`,
      opened: 'Zadnja brava škljocne. Gospon Penkala ne diže pogled: "U Knjizi ovo ne piše."',
      hint: {
        step: 'Bez zagrade prvo se množi i dijeli. Što treba izračunati prvo da se dobije broj na bravi?',
        move: 'Što se mora izračunati prvo? Dodirni prvi broj tog računa, pa zadnji.',
      },
      example: ['Primjer s drugim brojevima:', '1 + 2 · 6 = 13', '(1 + 2) · 6 = 18'],
    },
    write: {
      sum: 'Zapiši kako se otvara brava gospona Penkale. Koliki je rezultat?',
      nested: 'Zagrada u zagradi: prvo okrugla, pa uglata, pa vitičasta. Koliki je rezultat?',
      whole:
        'I brava s oduzimanjem: 258 − (34 + 41). Napiši cijeli redak. Minus ispred zagrade oduzima cijelu zagradu.',
    },
    find: {
      say: 'Iza zadnjih vrata na zidu je kredom nacrtana strelica uzbrdo. A crna nit luta prema krivim vratima.',
      title: 'Zagrade: okrugle, uglate, vitičaste.',
      card: [
        'Zagrada kaže: ono što je unutra izračunaj prvo, kao da je to jedan broj.',
        'Kad je zagrada u zagradi, kreni iznutra: prvo okrugle ( ), zatim uglate [ ], na kraju vitičaste { }.',
        'Isti brojevi sa zagradom na drugom mjestu mogu dati drugi rezultat.',
      ],
    },
  },
  l13: {
    title: 'Dva svjedoka',
    lesson: {
      found:
        'Pravi Vučetić ima prvi slučaj nakon povratka. Ispod hrpe njegovih bilješki je valjak.',
      steps: [
        ['Evo dva reda po 4.'],
        ['I još tri reda po 4.'],
        [
          'Zajedno je to pet redova po 4. Možeš brojati sve odjednom ili dio po dio.',
          '(2 + 3) · 4 = 2 · 4 + 3 · 4',
        ],
        [
          'Čitaj i obrnuto: isti se faktor ponavlja, pa ga možeš izlučiti. To je zajednički faktor.',
          '6 · 5 + 4 · 5 = (6 + 4) · 5',
        ],
      ],
    },
    tries: {
      rows: 'Složi (1 + 3) · 6. Jedan red po 6 već stoji. Dodaj još tri reda.',
      parts: 'Napiši to dio po dio: svaki pribrojnik pomnožen sa 6.',
      factor: 'Koji je ovdje zajednički faktor? Izluči ga.',
    },
    mistake: {
      say: 'Mali automat množi zbroj. Jedan njegov redak nije točan. Dodirni ga.',
      nudge: 'Taj je redak točan. Pogledaj je li pomnožen svaki pribrojnik.',
      show: 'Pokaži mu: tri reda, a u svakom 2 + 5. Složi 3 reda po 7.',
      write: 'Sad napiši točan redak: pomnoži oba pribrojnika.',
      thanks: 'Mali automat kima. Sad množi oba pribrojnika, a ne samo prvi.',
    },
    scene: {
      intro:
        'Pravi Vučetić maše kiflom: "Tri svjedoka, isti sanduci. Sve sam zapisao, po datumu. Jedan laže. Ne računaj, nego gledaj."',
      who: {
        zvonar: 'Zvonar',
        mlinar: 'Mlinar',
        dimnjacar: 'Dimnjačar',
      },
      offended: {
        zvonar: '"Ja? Zvonim točno i brojim točno!"',
        mlinar: '"Jedanput sam se zabunio! Zbog toga sam lažac?"',
      },
      why: {
        zvonar: 'Zvonar svaki put pomnoži oba broja iz zagrade. Piše dugo, ali točno.',
        mlinar:
          'Mlinar prvo izračuna što je u zagradi. Jednom je krivo zbrojio, a ostalo mu je točno.',
      },
      cards: {
        a: 'Pet redova, u svakom 3 + 4 sanduka. Kako se to još može napisati?',
        b: 'Dvanaest redova, u svakom 20 + 7 sanduka. Kako se to još može napisati?',
        c: 'Bilo je 409 redova po 86 sanduka, a 309 redova je otišlo. Kako se to još može napisati?',
      },
      reveal:
        'Dimnjačar svaki put pomnoži samo prvi broj iz zagrade. Drugi zaboravi. Pravi Vučetić odloži kiflu: "Zapisano."',
      fix: 'Napiši njegov prvi redak kako treba: pomnoži oba pribrojnika.',
      opened:
        'Dimnjačar pocrveni ispod čađe. Pravi Vučetić pojede kiflu: "Slučaj zatvoren. Zapisano."',
      hint: {
        step: 'Ne računaj. Gledaj je li svaki broj iz zagrade pomnožen. Jedna pogreška još nije laž.',
        move: 'Pogledaj Dimnjačara: drugi broj iz zagrade nikad ne pomnoži.',
      },
      example: [
        'Primjer s drugim brojevima:',
        '3 · (10 + 2) = 3 · 10 + 3 · 2',
        'Oba su pribrojnika pomnožena.',
      ],
    },
    write: {
      fade: 'Zapiši što je točno. Što ide u kvadratić?',
      whole: 'A sad veliki račun. Izluči zajednički faktor, pa će biti lako.',
    },
    find: {
      say: 'Dimnjačar priznaje: kola nisu prošla ovuda. Pravi Vučetić crta novu strelicu na karti. Karta je sad samo tvoja.',
      title: 'Distributivnost. Zajednički faktor.',
      card: [
        'Kad broj množi zbroj u zagradi, množi svaki pribrojnik. Tako je i s razlikom. To se zove distributivnost.',
        'Može i obrnuto: kad se isti faktor javlja u oba umnoška, možeš ga izlučiti. To je zajednički faktor.',
        'Tako se i veliki računi mogu usporediti, a da ih ne računaš.',
      ],
    },
  },
  l14: {
    title: 'Krug svjetiljki',
    lesson: {
      found: 'Automat s ključem hoda u krug. Iza stupa svjetiljke je valjak.',
      steps: [
        ['17 sanduka slažemo po 5. Tri su skupine pune, a 2 sanduka ostanu.'],
        ['Ta 2 ne čine novu skupinu. To je ostatak.', 'Ostatak je uvijek manji od djelitelja.'],
        [
          'Krug od 4 svjetiljke je skupina od 4 koraka.',
          '13 koraka su 3 cijela kruga i još 1 korak.',
        ],
        [
          'Nakon cijelog kruga automat je opet kod svjetiljke 0.',
          'Zato ostatak kaže kod koje će svjetiljke stati.',
        ],
      ],
    },
    tries: {
      pack: 'Slaži 14 sanduka po 4. Koliko je cijelih skupina? Koliko ostane?',
      line: 'Napiši to kao dijeljenje s ostatkom.',
      check: 'Provjeri: pomnoži, pa dodaj ostatak. Dobiješ djeljenik.',
    },
    mistake: {
      say: 'Mali automat dijeli sam. Jedan njegov redak nije točan. Dodirni ga.',
      nudge: 'Taj je redak točan. Pogledaj ostatak i djelitelj.',
      show: 'Pokaži mu: složi 55 sanduka po 9. Od onih 10 nastane još jedna skupina.',
      write: 'Sad napiši točan redak.',
      thanks: 'Mali automat kima. Ostatak mu je sad uvijek manji od djelitelja.',
    },
    scene: {
      intro:
        'Prvi broj u retku je broj koraka do zvona, a drugi broj svjetiljki. Čekaj automat kod prave svjetiljke.',
      taken: 'Automat zaspi točno kraj tebe. Ključ je tvoj.',
      missed: (lamp: number) =>
        `Automat zaspi kod svjetiljke ${lamp}, a ne kod tvoje. Sad zvono zvoni nakon drugog broja koraka.`,
      opened: 'Zadnji ključ okreće se u bravi. Automat i dalje spava kraj svoje svjetiljke.',
      hint: {
        step: 'Svaki cijeli krug vrati automat na svjetiljku 0. Koliko koraka ostane nakon cijelih krugova?',
        move: 'Podijeli broj koraka brojem svjetiljki. Ostatak je broj svjetiljke.',
      },
      example: [
        'Primjer: 4 svjetiljke i 10 koraka.',
        '10 : 4 = 2 ost. 2',
        'Dva cijela kruga i još 2 koraka: svjetiljka 2.',
      ],
    },
    write: {
      fade: 'Zapiši dijeljenje s velikog kruga: 100 koraka i 7 svjetiljki. Koliki je ostatak?',
      check: 'I provjera, cijeli redak: djelitelj puta količnik, pa još ostatak.',
    },
    find: {
      say: 'Ključ otvara stari prolaz. Na zidu je Majstorova kreda: "Gore."',
      title: 'Dijeljenje s ostatkom.',
      card: [
        'Kad dijeliš, slažeš u jednake skupine. Ono što ne čini cijelu skupinu je ostatak.',
        'Ostatak je uvijek manji od djelitelja. Da nije, od njega bi nastala još jedna skupina.',
        'Broj cijelih skupina je nepotpuni količnik. Provjera: djelitelj puta nepotpuni količnik, pa još ostatak, daje djeljenik.',
      ],
    },
  },
  l15: {
    title: 'Dizalica',
    lesson: {
      found: 'Stara vaga sad je greda dizalice. Ispod tereta je valjak.',
      steps: [
        ['Stupci nisu jednaki, pa je greda nagnuta.', 'S višega stupca nosimo sanduke na niži.'],
        [
          'Ukupno je i dalje 12 sanduka, a svaki stupac ima 6. To je aritmetička sredina.',
          'x̄ = (3 + 9) : 2 = 6',
        ],
        [
          'Isti se broj računa svaki put kad se pojavi. Ovdje su četiri stupca.',
          'x̄ = (4 + 4 + 4 + 8) : 4 = 5',
        ],
        ['Znaš li sredinu i broj stupaca, znaš i koliko je ukupno.', '5 · 4 = 20'],
      ],
    },
    tries: {
      level: 'Izravnaj stupce: dodirni visoki, pa niski.',
      line: 'Koliko je sad u svakom stupcu? Napiši.',
      total: 'Dizalica u prosjeku digne 15 sanduka na dan. Koliko je to u 4 dana?',
    },
    mistake: {
      say: 'Mali automat računa sredinu. Prvo su stupci 4 i 8, a onda 5, 5, 5 i 9. Jedan njegov redak nije točan. Dodirni ga.',
      nudge: 'Taj je redak točan. Prebroji stupce u drugom računu.',
      show: 'Pokaži mu: izravnaj 5, 5, 5 i 9. Koliko je sad u svakom stupcu?',
      write: 'Sad napiši točan redak. Koliko je stupaca?',
      thanks: 'Mali automat kima. Sad broji svaki stupac, pa i one jednake.',
    },
    scene: {
      intro: 'Dizalica kreće tek kad je greda ravna. Prebacuj sanduke s višega stupca na niži.',
      level: 'Greda je ravna. U svakom je stupcu jednako.',
      rounds: {
        two: 'Koliko je sad u svakom stupcu? Napiši.',
        three: 'Sad su tri stupca. Koliko je u svakom?',
        four: 'Četiri stupca, a tri su ista. Računa se svaki. Koliko je u svakom?',
      },
      opened: 'Greda je ravna, lanac se napne i dizalica kreće uzbrdo.',
      hint: {
        step: 'Uzmi sanduk s najvišeg stupca i stavi ga na najniži. Zbroj se ne mijenja.',
        move: 'Zbroji sve stupce i podijeli brojem stupaca. Toliko mora biti u svakom.',
      },
      example: [
        'Primjer s drugim brojevima:',
        'x̄ = (4 + 6 + 8) : 3 = 6',
        'Tri stupca, pa dijelimo s 3.',
      ],
    },
    write: {
      fade: 'Zapiši prvi teret. Što ide u kvadratić?',
      whole: 'Sad teret s tri stupca: 3, 5 i 10. Napiši cijeli redak.',
      month:
        'U rujnu dizalica digne u prosjeku 38 sanduka na dan. Rujan ima 30 dana. Koliko je to ukupno?',
    },
    find: {
      say: 'Na vrhu je ulica u kojoj nitko ne stanuje. Ovdje trag završava.',
      title: 'Aritmetička sredina.',
      card: [
        'Aritmetička sredina je zbroj svih podataka podijeljen brojem podataka. Piše se x̄.',
        'Zamisli da izravnavaš stupce: zbroj se ne mijenja, a svi postanu jednaki.',
        'Podatak koji se ponavlja računa se svaki put. Sredina ne mora biti broj koji netko stvarno ima.',
        'Sredina puta broj podataka daje zbroj.',
      ],
    },
  },
  l16: {
    title: 'Ulje za svjetiljke',
    lesson: {
      found: 'Hanaman prodaje ulje za svjetiljke i sve crta u dijagrame. Između limenki je valjak.',
      steps: [
        [
          'Dijagram je tablica koju vidiš odjednom. Svaki stupac je jedan podatak.',
          'Prvo pogledaj os: koliko vrijedi jedan korak? Ovdje 2.',
        ],
        [
          'Stupac može završiti između dva broja na osi.',
          'A završava na pola puta između 20 i 30, pa je A = 25.',
        ],
        ['Što pročitaš, možeš oduzimati i zbrajati.', '40 − 25 = 15'],
        ['Dijagram kaže koliko. Ne kaže zašto. O tome treba razmisliti.'],
      ],
    },
    tries: {
      step: 'Na ovoj osi jedan korak vrijedi 5. Dodirni treći korak od nule.',
      rowA: 'Prepiši dijagram u tablicu. Prvi redak: koliko je A?',
      rowB: 'Drugi redak: koliko je B?',
    },
    mistake: {
      say: 'Mali automat čita dva stupca, oba do trećeg koraka na osi. Kod A korak vrijedi 1, a kod B vrijedi 10. Jedan njegov redak nije točan. Dodirni ga.',
      nudge: 'Taj je redak točan. Pogledaj koliko vrijedi jedan korak kod B.',
      show: 'Pokaži mu: kod B jedan korak vrijedi 10. Dodirni treći korak.',
      write: 'Sad napiši točan redak.',
      thanks: 'Mali automat kima. Sad prvo pogleda koliko vrijedi jedan korak.',
    },
    guard: {
      rule: 'SVE SE MOŽE PODIJELITI SA SVIME.',
      intro:
        'Pred Hanamanovim skladištem stoji stražar s trakom. Pokaži mu račun koji se ne može izračunati.',
      thanks: {
        eight: 'HVALA. 8 : 2 = 4. PRAVILO VRIJEDI.',
        zero: 'HVALA. 0 : 7 = 0. I TO SE MOŽE. PRAVILO VRIJEDI.',
        one: 'HVALA. 7 : 1 = 7. PRAVILO VRIJEDI.',
        same: 'HVALA. 7 : 7 = 1. PRAVILO VRIJEDI.',
        thirty: 'HVALA. 30 : 5 = 6. PRAVILO VRIJEDI.',
      },
      write:
        'Dijeljenje traži broj koji puta 0 daje 7. Ali 0 puta bilo koji broj daje 0. Napiši to.',
      jammed:
        'Stražar počne dijeliti 7 s 0. Zavrti se i više ne staje. Vrtjet će se tu i kad se vratiš.',
      hint: {
        step: 'S kojim se brojem ne dijeli? Nađi ga među pločicama.',
        move: 'Izaberi 7 : 0.',
      },
      example: [
        'Primjer s drugim brojevima:',
        'Za 12 : 4 traži se broj koji puta 4 daje 12. To je 3.',
        'Za 5 : 0 takvog broja nema, jer 0 puta bilo koji broj daje 0.',
      ],
    },
    charts: {
      trg: 'Trg',
      most: 'Most',
      mlin: 'Mlin',
      pusta: 'Pusta',
      trg1: 'Trg 1',
      trg2: 'Trg 2',
      most1: 'Most 1',
      most2: 'Most 2',
      pusta1: 'Pusta 1',
      pusta2: 'Pusta 2',
      days: { mon: 'pon', tue: 'uto', wed: 'sri', thu: 'čet', fri: 'pet' },
    },
    streets: {
      intro: 'Hanaman skriva račune iza vrata skladišta. Ovo je ulje po ulicama, u litrama.',
      less: 'Broj vrata, x, manji je od broja litara koje troši Trg.',
      difference: 'Broj vrata je razlika: koliko Pusta ulica troši više od Mosta?',
      structureLess:
        'Stupac Trga završava između dva broja na osi. Koliko je to litara? Napiši x < i taj broj.',
      structureDifference: 'Od većeg broja oduzmi manji.',
      opened: 'Iza vrata je sljedeći dijagram. Hanaman kima: "Uredno čitaš."',
      grumpy: [
        'Ovdje su samo prazne limenke.',
        'Krivi broj. Ulje je na drugim vratima.',
        'Ovdje spava skladištar. Ne budi ga.',
      ],
      hint: {
        step: 'Prvo pogledaj koliko vrijedi jedan korak na osi, pa pročitaj stupac Trga.',
        move: 'Napiši x < 45, pa izračunaj 60 − 35.',
      },
      example: ['Primjer s drugim brojevima:', 'x < 40', '50 − 15 = 35'],
    },
    weeks: {
      intro: 'Dva tjedna, pa dva stupca uz svaku ulicu: 1 je prvi tjedan, a 2 drugi.',
      more: 'Broj vrata, x, veći je od broja litara koje je Trg potrošio u drugom tjednu.',
      difference:
        'Broj vrata je razlika: koliko je Most u drugom tjednu potrošio više nego u prvom?',
      structureMore: 'Nađi stupac Trg 2. Napiši x > i taj broj litara.',
      structureDifference: 'Od stupca Most 2 oduzmi stupac Most 1.',
      opened: 'Iza vrata je popis dostava. Hanaman zapisuje svaku.',
      grumpy: [
        'Ovo su računi od prošle godine. Zatvori.',
        'Krivi broj. Hanaman to neće zapisati.',
        'Tu je samo mačka, a ona ne čita dijagrame.',
      ],
      hint: {
        step: 'Uz svaku ulicu stoje dva stupca. Broj uz ime kaže koji je tjedan.',
        move: 'Napiši x > 10, pa izračunaj 35 − 15.',
      },
      example: ['Primjer s drugim brojevima:', 'x > 5', '25 − 15 = 10'],
    },
    deliveries: {
      intro:
        'Dostave ulja po danima, od ponedjeljka do petka. Jedan korak na osi je jedna dostava.',
      most: 'Broj vrata, x, veći je od najvećeg broja dostava u jednom danu.',
      total: 'Broj vrata je zbroj svih dostava u tjednu.',
      structureMost: 'Nađi najviši stupac. Napiši x > i taj broj dostava.',
      structureTotal: 'Zbroji sve stupce.',
      opened: 'Iza vrata je zadnji Hanamanov dijagram. Na njemu je jedan stupac viši od svih.',
      grumpy: ['Ovdje su samo fitilji. Nema računa.', 'Krivi broj. Dostave su negdje drugdje.'],
      hint: {
        step: 'Koji je stupac najviši? Koliko dostava pokazuje?',
        move: 'Napiši x > 8, pa zbroji sve stupce.',
      },
      example: ['Primjer s drugim brojevima:', 'x > 4', '2 + 4 + 1 = 7'],
    },
    night: {
      intro:
        'Hanamanov zadnji dijagram: što gori noću. Jedan korak na osi znači 10 litara. U Pustoj ulici nitko ne stanuje, a ulje svejedno gori.',
      more: 'Broj vrata, x, veći je od broja litara koje noću troši Trg.',
      difference:
        'Broj vrata u Pustoj ulici je razlika: koliko litara Pusta ulica troši više od Mosta?',
      structureMore:
        'Jedan korak je 10 litara. Koliko je onda litara kod Trga? Napiši x > i taj broj.',
      structureDifference: 'Od većeg broja oduzmi manji.',
      opened: 'Na rubu dijagrama Hanaman je zapisao: "Ovo kaže koliko gori. Ne kaže tko pali."',
      grumpy: [
        'Nitko se ne javlja. Ovdje nitko ne stanuje.',
        'Samo prašina.',
        'Tišina. Javlja se samo vjetar.',
      ],
      hint: {
        step: 'Jedan korak na osi je 10 litara. Koliko je koraka do vrha stupca Trga?',
        move: 'Napiši x > 30, pa izračunaj 60 − 20.',
      },
      example: [
        'Primjer s drugim brojevima:',
        '4 koraka po 10 litara je 40 litara.',
        'x > 20',
        '70 − 40 = 30',
      ],
    },
    write: {
      fade: 'Zapiši račun s dijagrama za dva tjedna. Koliki je rezultat?',
      whole:
        'Na prvom dijagramu Pusta troši 60 litara, a Most 35. Koliko više? Napiši cijeli redak.',
    },
    find: {
      say: 'Iza vrata 40 su stube. Odozgo miriše na toplo ulje.',
      title: 'Čitanje podataka. Tablica i stupčasti dijagram.',
      card: [
        'Tablica slaže podatke u retke i stupce. Stupčasti dijagram pokazuje iste podatke tako da ih vidiš odjednom.',
        'Prvo pogledaj koliko vrijedi jedan korak na osi. Ne mora biti 1, a stupac može završiti i između dva broja.',
        'Pročitane podatke možeš zbrajati i oduzimati. Dijagram kaže koliko, ali ne kaže zašto. O tome treba razmisliti.',
      ],
    },
  },
  ending: {
    panels: [
      'Soba iznad Puste ulice. Svjetiljka je još topla.',
      'Majstor Kristijan otišao je malo prije tebe. Nema kola, nema koraka na stubama.',
      'Poruka, prvi put za tebe: "{ime}, blizu si. Još ne smijem čekati. Valjak je za malog automata. Ostalo mu pokaži ti."',
      'Mali automat kucne po valjku, pa ga uzme.',
      'Na vratima je nova traka Prvog Automata. Nema "HVALA". Prvi put nešto pita: KAKO TO ČITAŠ.',
      'Zagorkine novine dosad su pisale "netko pametan". Jutros na naslovnici piše: {ime}.',
      'Zadnji trag: dva zupčanika. Okreću se zajedno samo ako se jedan broj zubaca može podijeliti drugim bez ostatka. Mali automat ispisuje: Zašto?',
    ],
  },
} as const;
