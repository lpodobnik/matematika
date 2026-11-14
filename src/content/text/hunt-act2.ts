// The Croatian of the leads and knots of Acts 1 and 2 not in `hunt-leads.ts` (GDD, Part 2: The
// Trail): the neighbours, Knot 1, the wandering-off, the witnesses, the ledgers, the facade and
// Knot 2. All of it is a draft for Luka: his wording wins, and every line waits for his review.

/** Act 1's grumpy neighbours, beside those of Two sides: never repeated within a scene. */
const neighboursAct1 = [
  'Ja ništa ne znam. Pitaj nekog drugog.',
  'Krivi susjed. Pravi je malo dalje.',
  'Ovdje živimo samo ja i moj kašalj. Zbogom.',
] as const;

export const act2Text = {
  l02: {
    title: 'Susjedi',
    lesson: {
      found:
        'Svjedok ne otvara vrata. Mali automat ispod otirača nađe valjak Majstora Kristijana i pusti ga.',
      steps: [
        ['Broj obično ima dva susjeda: jedan je za 1 manji, a drugi za 1 veći.'],
        ['Manji susjed je neposredni prethodnik.', 'Neposredni prethodnik broja 7 je 6.'],
        ['Veći susjed je neposredni sljedbenik.', 'Neposredni sljedbenik broja 7 je 8.'],
        ['Kad broj završava na 9, sljedbenik mijenja i druge znamenke.', '699 + 1 = 700'],
        ['Slovo n stoji umjesto nekog broja.', 'Njegov je sljedbenik n + 1, a prethodnik n − 1.'],
      ],
    },
    tries: {
      mark: 'Dodirni neposrednog sljedbenika broja 99.',
      up: 'Koji je neposredni sljedbenik broja 4 999? Napiši.',
      down: 'Koji je neposredni prethodnik broja 7 000? Napiši.',
    },
    mistake: {
      say: 'Mali automat traži sljedbenike. Jedan njegov redak nije točan. Dodirni ga.',
      nudge: 'Taj je redak točan. Pogledaj što se događa kad je zadnja znamenka 9.',
      show: 'Pokaži mu: dodirni broj koji stoji odmah iza 299.',
      write: 'Sad napiši točan redak.',
      thanks: 'Mali automat kima. Više neće pisati 10 na kraj broja.',
    },
    street: {
      intro:
        'Svjedok iz kuće 999 vidio je kola, ali se boji automata i ne otvara vrata. Nađi njegova susjeda. U ovoj ulici kuće su samo s jedne strane, pa brojevi idu redom.',
      witness: 'Svjedok kroz vrata: "Ne otvaram. Pitaj susjeda koji mi je neposredni sljedbenik."',
      above:
        'Stanar kuće 1 001: "Taj susjed stanuje odmah prije mene. On je moj neposredni prethodnik."',
      postman: 'Poštar: "Od kuće 998 idi dvije kuće dalje."',
      structureWitness: 'Neposredni sljedbenik je za 1 veći. Dodaj 1.',
      structureAbove: 'Neposredni prethodnik je za 1 manji. Oduzmi 1.',
      structurePostman: 'Dodaj 1, pa još 1.',
      wrongBelow:
        'Stanar kuće 998: "Ja sam mu neposredni prethodnik. Ti tražiš sljedbenika. Zbogom."',
      wrongWitness: 'Svjedok ne otvara. Kroz vrata: "Rekao sam: pitaj susjeda."',
      grumpy: neighboursAct1,
      opened:
        'Vrata otvara susjed iz kuće 1 000: "Svjedok se boji, zato šuti. Ali meni je rekao da je kola vidio i noćni čuvar."',
      hint: {
        step: 'Neposredni sljedbenik je za 1 veći, a neposredni prethodnik za 1 manji.',
        move: 'Izračunaj 999 + 1, pa 1 001 − 1, pa 998 + 1 + 1.',
      },
      example: ['Primjer s drugim brojevima:', '699 + 1 = 700', '701 − 1 = 700'],
    },
    riddle: {
      intro: 'Noćni čuvar danju spava. Susjed zna gdje stanuje, ali voli zagonetke.',
      clue: 'Susjed: "Čuvarova kuća je neposredni prethodnik kuće 18."',
      structure: 'Neposredni prethodnik je za 1 manji. Oduzmi 1 od 18.',
      wrongEighteen: 'Stanar kuće 18: "Ja sam 18. Čuvar stanuje u kući prije moje."',
      wrongSixteen: 'Stanar kuće 16: "Čuvar? Jednu kuću dalje. Laku noć."',
      grumpy: neighboursAct1,
      opened: 'Vrata kuće 17 otvara pospani noćni čuvar. "Kola? Da, sve sam vidio."',
      hint: {
        step: 'Neposredni prethodnik je za 1 manji.',
        move: 'Izračunaj 18 − 1.',
      },
      example: ['Primjer s drugim brojem:', 'Neposredni prethodnik broja 41 je 40.', '41 − 1 = 40'],
    },
    write: {
      fade: 'Zapiši kako se to piše u školi. Broj svjedokove kuće zovemo n, pa je n = 999. Njegov susjed je n + 1. Što ide u kvadratić?',
      down: 'S druge strane svjedoka je kuća 998. To je neposredni prethodnik broja n. Napiši to kao redak iznad, ali s minusom.',
    },
    find: {
      say: 'Noćni čuvar iz kuće 17 sve je vidio: kola je vozio automat, a Majstor Kristijan sjedio je straga.',
      title: 'Neposredni prethodnik i neposredni sljedbenik.',
      card: [
        'Neposredni sljedbenik broja n je za 1 veći: n + 1. Neposredni prethodnik je za 1 manji: n − 1.',
        'Svaki prirodni broj ima sljedbenika. Svaki osim broja 1 ima i prethodnika među prirodnim brojevima, jer 0 nije prirodni broj.',
        'Kad broj završava devetkama, sljedbenik mijenja i druge znamenke. Kad završava nulama, prethodnik ih mijenja u devetke.',
      ],
    },
  },

  k1: {
    title: 'Prvi čvor',
    guard: {
      rule: 'ZNAMENKA VRIJEDI ISTO GDJE GOD STOJI.',
      intro: 'Na putu do Fausta stoji automat s trakom i nikoga ne pušta dalje.',
      thanks: {
        same: 'HVALA. ISTO MJESTO, ISTA VRIJEDNOST. PRAVILO JE POTVRĐENO.',
        ones: 'HVALA. ZNAMENKA 3 JE U OBA BROJA JEDINICA. PRAVILO JE POTVRĐENO.',
        tens: 'HVALA. ZNAMENKA 3 JE U OBA BROJA DESETICA. PRAVILO JE POTVRĐENO.',
        other: 'HVALA. TO SU RAZLIČITE ZNAMENKE. PRAVILO O NJIMA NE GOVORI.',
        long: 'HVALA. ZNAMENKA 3 VRIJEDI ISTO U OBA BROJA. PRAVILO JE POTVRĐENO.',
      },
      write: 'U broju 30 znamenka 3 vrijedi tri desetice. Napiši to.',
      jammed: 'Traka se zaglavi: 3 nije isto što i 30. Automat stane i pristojno zahvali.',
      hint: {
        step: 'Treba ti ista znamenka na dva različita mjesta.',
        move: 'Izaberi pločicu 3 i 30. Napiši 30 = 3 · 10.',
      },
      example: ['Primjer s drugom znamenkom:', 'U broju 7 znamenka vrijedi sedam.', '70 = 7 · 10'],
    },
    knock: {
      intro:
        'Faust okreće malog automata u rukama: "Ovo željezo poznam. Kristijan ga je negdje spremao." Tvoji tragovi kažu gdje.',
      side: 'Gospođa iz prizemlja: kola su krenula s neparne strane.',
      slip: 'Otpremnica iz arhiva: ispod potpisa piše 3 · 10 + 5.',
      tram: 'Belušić: "Od stanice 25 još dva koraka. Jedan korak vrijedi 5."',
      watchman: 'Noćni čuvar: "Neposredni sljedbenik broja 34. Prirodni broj, naravno."',
      structureSlip: 'Pomnoži 3 · 10, pa dodaj 5.',
      structureTram: 'Dva koraka po 5 je 2 · 5. Dodaj to broju 25.',
      structureWatchman: 'Neposredni sljedbenik je za 1 veći. Upiši ga umjesto kvadratića.',
      grumpy: neighboursAct1,
      opened:
        'Iza vrata je Kristijanovo skrovište. Na polici je kuka za penjanje, premala za ljudsku ruku.',
      hint: {
        step: 'Prijeđi na pravu stranu ulice, pa napiši svaki trag.',
        move: 'Prijeđi na neparnu stranu, zatim izračunaj 3 · 10 + 5 i 25 + 2 · 5. Neposredni sljedbenik broja 34 je 35.',
      },
      example: ['Primjer s drugim brojevima:', '4 · 10 + 3 = 43', '33 + 2 · 5 = 43', '43 ∈ N'],
    },
    find: {
      say: 'Kuka je taman za malog automata. Majstor Kristijan znao je da će netko doći.',
      title: 'Znamenka i njezino mjesto.',
      card: [
        'Znamenka vrijedi prema mjestu na kojem stoji. Jedno mjesto ulijevo i vrijedi deset puta više.',
        'Jedan primjer u kojem pravilo ne vrijedi dovoljan je da pravilo padne.',
      ],
    },
  },

  w1: {
    title: 'Gdje je mali automat?',
    knock: {
      intro: 'Ulica je pretiha. Malog automata nema, pa kucaš ti. Susjedi su nešto vidjeli.',
      side: 'Gospođa s balkona: "Nešto malo kotrljalo se parnom stranom. Za nečim je išlo."',
      baker: 'Pekar: "Stalo je kod neposrednog sljedbenika broja 63."',
      boy: 'Dječak na biciklu: "Šest desetica i četiri jedinice. Zapamtio sam broj."',
      structureBaker: 'Neposredni sljedbenik je za 1 veći. Dodaj 1.',
      structureBoy: 'Šest desetica je 6 · 10. Dodaj 4.',
      grumpy: [
        'Nema ovdje nikakvog malog automata. Ima samo mene, a ja spavam.',
        'Onaj mali bar lijepo kuca. Ti lupaš. Ovdje ga nema.',
        'Čuo sam pištanje, ali ne iza ovih vrata. Laku noć.',
      ],
      opened:
        'Vrata se otvaraju. U dvorištu igračka na navijanje hoda u zid, pa opet u zid. Mali automat ide za njom i ozbiljno kima. Kad te vidi, zapišti i dokotrlja se do tvoje noge.',
      hint: {
        step: 'Napiši što kaže svaki susjed. Kad ostanu jedna vrata, pokucaj.',
        move: 'Prijeđi na parnu stranu, zatim izračunaj 63 + 1 i 6 · 10 + 4.',
      },
      example: ['Primjer s drugim brojevima:', '41 + 1 = 42', '4 · 10 + 2 = 42'],
    },
    find: {
      say: 'Nikola pocrveni: "To je moj prvi automat. Zna samo ići ravno." Ulica više nije tiha.',
      title: 'Tragovi zajedno.',
      card: ['Svaki trag sam po sebi kaže malo. Zajedno ostave samo jedna vrata.'],
    },
  },

  l05: {
    title: 'Svjedoci',
    lesson: {
      found: 'Svjedoci se svađaju nasred ulice. Mali automat pod klupom nađe valjak i pusti ga.',
      steps: [
        ['Što je broj dalje udesno, to je veći.', '47 < 52 čitamo: 47 je manji od 52.'],
        [
          'Broj s više znamenki je veći.',
          'Kad ih je jednako, odlučuje prva različita znamenka slijeva: 527 < 531.',
        ],
        ['Raspon je dvije usporedbe odjednom.', '12 < x < 16: x je veći od 12 i manji od 16.'],
        ['Znak < ne računa krajnji broj. Znak ≤ ga računa.', '12 ≤ x < 16 računa i broj 12.'],
        ['Znak ≠ izbaci jedan broj: x ≠ 14.', 'Što ostane, možemo nabrojati: {13, 15}.'],
      ],
    },
    tries: {
      mark: 'Koji je najveći broj za koji vrijedi x < 26? Dodirni ga.',
      list: 'Koji su brojevi u rasponu 20 < x < 24? Dopiši onaj koji nedostaje.',
      range: 'Kuće iza 340, a prije 350. Napiši raspon.',
    },
    mistake: {
      say: 'Mali automat nabraja što je u rasponu. Jedan njegov redak nije točan. Dodirni ga.',
      nudge: 'Taj je redak točan. Pogledaj znak <: računa li on krajnji broj?',
      show: 'Pokaži mu: koji je najmanji broj za koji vrijedi 2 < x < 5? Dodirni ga.',
      write: 'Sad napiši točan popis.',
      thanks: 'Mali automat kima. Krajnje brojeve više ne pušta unutra.',
    },
    scene: {
      intro: 'Svjedoci se svađaju gdje su kola skrenula. Svatko je vidio samo dio.',
      side: 'Mljekarica: "Bila su na parnoj strani!"',
      range: 'Pismonoša: "Prošla su 230, a nisu stigla do 240."',
      not: 'Pekar: "Kod kuće 232 sigurno nisu skrenula. Tu sam ja stajao."',
      upTo: 'Postolar: "Dalje od kuće 234 nisu išla. Ali do nje jesu."',
      structureRange: 'Ni jedan ni drugi broj se ne računa. Napiši x između njih, sa znakom <.',
      structureNot: 'Izbaci taj broj: x ≠ i broj.',
      structureUpTo: 'Kuća 234 još se računa. Koji znak računa krajnji broj?',
      wrongBaker:
        'Pekar, sav u brašnu: "Rekao sam: ne kod mene!" Dodirni svoj redak koji ne valja, pa napiši drugi.',
      grumpy: [
        'Što kucaš? Kola ne stanuju ovdje.',
        'Krivi broj. Pitaj one što se svađaju.',
        'Nisam svjedok. Ja samo želim spavati.',
      ],
      opened:
        'Vrata kuće 234 se otvaraju. Iza kuće je sporedna ulica, a na kamenu trag kotača. Svjedoci napokon zašute.',
      hint: {
        step: '"Prošla su" i "nisu stigla" ne računaju taj broj. "Do nje jesu" ga računa.',
        move: 'Prijeđi na parnu stranu. Napiši 230 < x < 240, zatim x ≠ 232, zatim x ≤ 234.',
      },
      example: ['Primjer s drugim brojevima:', '50 < x < 60', 'x ≠ 52', 'x ≤ 54'],
    },
    write: {
      range: 'Zapiši raspon kako se piše u školi. Računa li se 230? Koji znak ide u kvadratić?',
      list: 'Sad napiši popis parnih brojeva iz tog raspona, od najmanjeg.',
    },
    find: {
      say: 'Kola su skrenula kod kuće 234, u sporednu ulicu.',
      title: 'Uspoređivanje brojeva. Produžena nejednakost.',
      card: [
        'Broj s više znamenki je veći. Kad brojevi imaju jednako znamenki, odlučuje prva različita znamenka slijeva, jer jedna jedinica višeg mjesta vrijedi više od svega desno od nje.',
        'Raspon kao 2 ≤ x < 9 zove se produžena nejednakost: to su dvije usporedbe odjednom. Znak < ne računa krajnji broj, a znak ≤ ga računa.',
        'Znak ≠ znači "je različit od". Brojeve iz raspona možemo nabrojati u vitičastim zagradama.',
      ],
    },
  },

  l07: {
    title: 'Knjige računa',
    places: ['stotice', 'desetice', 'jedinice'],
    lesson: {
      found:
        'Kotruljević svaki račun vodi dvaput. Između dviju knjiga mali automat nađe valjak i pusti ga.',
      steps: [
        [
          'Zbrajanje je skakanje po pravcu: 9, pa još 5, i stojimo na 14.',
          'Brojevi 9 i 5 su pribrojnici, a 14 je zbroj.',
        ],
        [
          'Krenemo li s 5, pa još 9, opet stojimo na 14.',
          'Redoslijed pribrojnika ne mijenja zbroj.',
        ],
        ['Zato u dugom zbroju tražimo parove s okruglim zbrojem.', '35 + 48 + 65 = 100 + 48 = 148'],
        [
          'Oduzimanje traži pribrojnik koji nedostaje: 14 − 5 = 9, jer je 5 + 9 = 14.',
          'Od umanjenika oduzimamo umanjitelj, i ostane razlika.',
        ],
        [
          'Oduzeti dva broja zaredom isto je što i oduzeti njihov zbroj.',
          '90 − 15 − 5 = 90 − 20 = 70',
        ],
      ],
    },
    tries: {
      jump: 'Skoči 7, pa još 6. Dodirni gdje staneš.',
      pair: 'Nađi par s okruglim zbrojem, pa zbroji sve.',
      out: 'Izašlo je 16, pa 24. Koliko je to ukupno? Upiši u kvadratić.',
    },
    mistake: {
      say: 'Mali automat oduzima. Jedan njegov redak nije točan. Dodirni ga.',
      nudge: 'Taj je redak točan. Provjeri zbrajanjem: umanjitelj i razlika moraju dati umanjenik.',
      show: 'Pokaži mu: koliko je 300 − 189? Dodirni razliku.',
      write: 'Sad napiši točan redak.',
      thanks: 'Mali automat kima. Sad svaki račun provjeri zbrajanjem.',
    },
    scene: {
      intro:
        'Kotruljević svaki račun vodi dvaput. Uz njegove dvije knjige leži i knjiga iz ljevaonice. Jedna ne govori istinu.',
      who: {
        prva: 'Prva knjiga',
        druga: 'Druga knjiga',
        ljevaonica: 'Knjiga iz ljevaonice',
      },
      offended: {
        prva: 'Kotruljević: "Moja knjiga? Ja svaki račun vodim dvaput!"',
        druga: 'Kotruljević: "Jedna omaška, a ti me već zoveš lažljivcem?"',
      },
      why: {
        prva: 'Prva knjiga svaki put oduzima zbroj i uvijek je točna.',
        druga: 'Druga je knjiga pogriješila samo jednom, u jednoj znamenci. Ostali su redci točni.',
      },
      cards: {
        a: 'Bilo je 423 sanduka. Izašlo je 37, pa 54.',
        b: 'Bilo je 5 200 sanduka. Izašlo je 480, pa 320.',
        c: 'Bilo je 700 000 000 vijaka. Izašlo je 30, pa 20.',
      },
      reveal:
        'Knjiga iz ljevaonice svaki put oduzme razliku tih dvaju brojeva, a ne njihov zbroj. Tako je netko sakrio što nedostaje.',
      fix: 'Napiši njezin prvi redak kako treba.',
      opened: 'Kotruljević prekriži redak i zapiše ga dvaput, za svaki slučaj.',
      hint: {
        step: 'Dva oduzimanja zaredom isto su što i oduzimanje njihova zbroja. Tko to svaki put radi krivo? Jedna omaška još nije laž.',
        move: 'Pogledaj knjigu iz ljevaonice: umjesto zbroja oduzima razliku.',
      },
      example: [
        'Primjer s drugim brojevima:',
        '90 − 15 − 5 = 90 − 20 = 70',
        'Izašlo je 15 i 5, dakle ukupno 20.',
      ],
    },
    write: {
      pair: 'Zapiši u bilježnicu kako se to piše u školi. Koliko je izašlo ukupno?',
      whole: 'Sad cijeli račun, s međukorakom.',
    },
    find: {
      say: 'U knjizi iz ljevaonice nedostaje 74 sanduka. Netko ih je odvezao i nije ih zapisao.',
      title: 'Zbrajanje i oduzimanje.',
      card: [
        'Brojevi koje zbrajamo su pribrojnici, a rezultat je zbroj. Zamjena mjesta pribrojnika zove se komutativnost, a združivanje asocijativnost: ni jedno ni drugo ne mijenja zbroj.',
        'U oduzimanju su umanjenik, umanjitelj i razlika. Oduzimanje se provjerava zbrajanjem: umanjitelj + razlika = umanjenik.',
        'Oduzeti dva broja zaredom isto je što i oduzeti njihov zbroj.',
        'Ako jedan pribrojnik naraste za 47, a drugi za 26, zbroj naraste za 73, kakvi god bili ti brojevi.',
      ],
    },
  },

  l08: {
    title: 'Pročelje',
    lesson: {
      found: 'Na pločniku ispod pročelja mali automat nađe valjak Majstora Kristijana i pusti ga.',
      steps: [
        ['Zgrada ima 4 reda prozora, a u svakom je redu 5 prozora.', '5 + 5 + 5 + 5 = 4 · 5 = 20'],
        [
          'Množenje je kraće zbrajanje jednakih pribrojnika.',
          'Brojevi 4 i 5 su faktori, a 20 je umnožak.',
        ],
        [
          'Prozori su numerirani redom, red po red.',
          'Zadnji prozor drugog reda ima broj 2 · 5 = 10.',
        ],
        [
          'Množimo li okrugle brojeve, množimo bez nula, pa nule dopišemo.',
          '3 · 10 = 30, a 30 · 100 = 3 000.',
        ],
        ['A krilo u kojem redovi nemaju prozora? Nema što brojati.', '5 · 0 = 0'],
      ],
    },
    tries: {
      build: 'Složi zgradu: 3 reda, a u svakom redu 6 prozora.',
      last: 'Zgrada ima 7 redova, a u svakom su redu 4 prozora. Koji broj ima zadnji prozor?',
      big: 'Tvornica ima 40 redova prozora, a u svakom je redu 100 prozora. Koliko je to prozora?',
    },
    mistake: {
      say: 'Mali automat broji prozore po krilima. Jedan njegov redak nije točan. Dodirni ga.',
      nudge: 'Taj je redak točan. Pogledaj redak s nulom.',
      show: 'Pokaži mu: ostavi 8 redova, ali bez ijednog prozora u redu.',
      write: 'Sad napiši točan redak.',
      thanks: 'Mali automat kima. Sad zna: u krilu bez prozora nema prozora.',
    },
    scene: {
      intro:
        'Stanari spavaju. Majstor Kristijan kredom je označio prozore. Mali automat penje se sam, kukom.',
      rounds: {
        first: 'Kreda je na prozoru 42. U svakom je redu 7 prozora.',
        second: 'Kreda je na prozoru 24. U svakom je redu 8 prozora.',
        third: 'Sad veća zgrada. Kreda je na prozoru 54. U svakom je redu 9 prozora.',
      },
      sleepy: [
        'Stanar proviri: "Krivi prozor. Spavam."',
        'Stanarka zijevne: "Opet kuka? Brojevi idu red po red. Laku noć."',
        'Stanar trlja oči: "Ovdje nema krede. Ima samo mene."',
      ],
      reached: 'Kuka zapne za okvir. Tu je Kristijanova kreda.',
      opened: 'Zadnja kreda je strelica. Mali automat vraća se ponosan, s kredom na glavi.',
      hint: {
        step: 'Prozori idu red po red. Broj zadnjeg prozora u redu je: broj redova · broj prozora u redu.',
        move: 'Koliko redova treba da dobiješ broj s krede? Dodirni zadnji prozor u tom redu.',
      },
      example: [
        'Primjer s drugim brojevima:',
        '3 · 5 = 15',
        'Ako je u svakom redu 5 prozora, prozor 15 je zadnji u trećem redu.',
      ],
    },
    write: {
      fade: 'Zapiši u bilježnicu kako se to piše u školi. Prozor 42, a u svakom je redu 7 prozora. Koliko je redova?',
      whole: 'A prozor 24, s 8 prozora u svakom redu? Napiši cijeli redak.',
    },
    find: {
      say: 'Na zadnjem je prozoru kredom nacrtana strelica. Odande se vidi kamo su kola otišla.',
      title: 'Množenje. Faktori i umnožak.',
      card: [
        'Množenje je kraće zbrajanje jednakih pribrojnika. Brojevi koje množimo su faktori, a rezultat je umnožak.',
        'Stvari složene u redove i stupce brojimo množenjem: broj redova puta broj stvari u svakom redu.',
        'Množimo li sa 10, 100 ili 1 000, dopisujemo nule. Broj pomnožen s 1 ostaje isti, a pomnožen s 0 daje 0.',
      ],
    },
  },

  k2: {
    title: 'Drugi čvor',
    guard: {
      rule: '5 UVIJEK ZAOKRUŽUJEMO NANIŽE.',
      intro: 'Još jedan automat s trakom. Ovaj ne voli peticu.',
      thanks: {
        one: 'HVALA. ZNAMENKA 1 IDE NANIŽE. TU NEMA PETICE. PRAVILO NIJE DIRNUTO.',
        four: 'HVALA. ZNAMENKA 4 IDE NANIŽE. TU NEMA PETICE. PRAVILO NIJE DIRNUTO.',
        eight: 'HVALA. ZNAMENKA 8 IDE NAVIŠE, ALI TO NIJE PETICA. PRAVILO NIJE DIRNUTO.',
        seven: 'HVALA. ZNAMENKA 7 IDE NAVIŠE, ALI TO NIJE PETICA. PRAVILO NIJE DIRNUTO.',
        tens: 'HVALA. PETICA JE NA DESETICAMA, A GLEDAMO JEDINICE. PRAVILO NIJE DIRNUTO.',
      },
      write: 'Zaokruži 25 na desetice kako treba.',
      jammed: 'Traka se zaglavi: 25 ide naviše. Automat stane i pristojno zahvali.',
      hint: {
        step: 'Pravilo govori o broju koji završava na 5. Nađi takav broj.',
        move: 'Izaberi 25. Napiši 25 ≈ 30.',
      },
      example: [
        'Primjer s drugim brojem:',
        '45 ≈ 50',
        'Prva znamenka iza desetica je 5, pa idemo naviše.',
      ],
    },
    knock: {
      intro: 'Svi tvoji nalazi vode u istu ulicu. A Vučetić donosi još jedan.',
      side: 'Svjedoci: kola su stala na parnoj strani.',
      news: 'Zagorkin naslov: "KOLA KOD KUĆE OKO 330!" To su kuće od 325 do 334, i one se računaju.',
      chalk: 'Kreda s prozora: "Nije kuća 330."',
      books: 'Kotruljević: "Broj kuće? Ono što ostane u knjizi."',
      note: 'Vučetić donosi bilješku: "Rukopis Majstora Kristijana. 423 − 37 − 54 = 334. Zapisano."',
      structureNews: 'Oba se broja računaju. Koji znak računa krajnji broj?',
      structureChalk: 'Izbaci taj broj: x ≠ i broj.',
      structureBooks: 'Od 423 oduzmi zbroj 37 + 54.',
      structureNote: 'Bilješka kaže jedno, a račun možda drugo. Izračunaj i provjeri.',
      notice: 'Iza vrata je samo traka: OVO JE ISPRAVLJENO. HVALA.',
      grumpy: ['Opet netko kuca. Ovdje nema ničega.', 'Ako je to račun, nije moj. Laku noć.'],
      opened:
        'Vrata se otvaraju. Soba je prazna, ali na stolu je Kristijanova kreda. Račun u bilješci nije točan, a Majstor Kristijan u računu ne griješi.',
      hint: {
        step: 'Provjeri svaki račun. Je li bilješka točna?',
        move: 'Izračunaj 423 − 37 − 54. Dobiješ 332, a ne 334. Prijeđi na parnu stranu, pa napiši 325 ≤ x ≤ 334, x ≠ 330 i račun iz knjige.',
      },
      example: ['Primjer s drugim brojevima:', '90 − 15 − 5 = 70', '65 ≤ x ≤ 74'],
    },
    find: {
      say: 'Netko piše Kristijanovim rukopisom. Faust gleda bilješku, pa malog automata: "Znaš, ovaj mali napravljen je od..." Zastane i ne kaže ništa više.',
      title: 'Bilješka s greškom.',
      card: [
        'Svaki trag možeš provjeriti računom. Kad se bilješka i račun ne slažu, vjeruj računu.',
        'Kad je prva znamenka iza mjesta na koje zaokružujemo 5 ili veća, idemo naviše.',
      ],
    },
  },
} as const;
