// Act 3's Croatian (GDD, Part 2: The Trail): the crate yard, the sixth cart, the coat and Knot 3.
// All of it is a draft for Luka: his wording wins, and every line waits for his review.

/** The act's grumpy neighbours (narrative, Dialogue Framework): a pool of 8, none repeated. */
const neighbours = [
  'Krivo. Ovdje su samo moji krumpiri.',
  'Ovdje živi samo moja teta. Ona ne čuje.',
  'Spavam. Pokucaj kod susjeda.',
  'Ništa ne znam. Ni moj pas ništa ne zna.',
  'Krivi broj. Izračunaj ga još jednom.',
  'Opet netko kuca? Krivo. Laku noć.',
  'Ovdje nema ni kola ni sanduka. Samo juha.',
  'Nismo ništa vidjeli. Ni ja ni moji brkovi.',
] as const;

export const act3Text = {
  l09: {
    title: 'Dvorište sa sanducima',
    lesson: {
      found:
        'Mali automat nađe valjak među sanducima. Na njemu je urezano: "Kartu čita netko blizak."',
      steps: [
        ['Sanduci stoje u 3 reda po 7.', '3 i 7 su faktori, a 21 je umnožak.'],
        ['Okreni ih: sad je 7 redova po 3. Sanduka je jednako.', '3 · 7 = 7 · 3'],
        ['Neki parovi faktora daju okrugao broj.', '2 · 5 = 10, 25 · 4 = 100, 125 · 8 = 1 000'],
        ['Faktore smijemo i združiti: prvo par, pa ostatak.', '3 · 2 · 5 = 3 · 10 = 30'],
      ],
    },
    tries: {
      turn: 'Okreni sanduke: neka 4 reda po 6 postanu 6 redova po 4.',
      pair: 'Spoji 2 i 5 u par. Koliko je 6 · 2 · 5? Napiši.',
      big: 'Sad bez sanduka. Nađi par koji daje 100. Koliko je 25 · 9 · 4?',
    },
    mistake: {
      say: 'Mali automat računa umnoške. Jedan njegov redak nije točan. Dodirni ga.',
      nudge: 'Taj je redak točan. Izračunaj umnoške u drugom retku.',
      show: 'Mali automat misli da je 4 · 3 više od 3 · 4. Pokaži mu: okreni sanduke.',
      write: 'Sad napiši točan redak.',
      thanks: 'Mali automat kima. Više ne misli da je važno tko stoji prvi.',
    },
    yard: {
      intro: 'Radnici ne pišu broj tovara, nego račun. Svaki zna samo djelić.',
      side: 'Tovar stoji na parnoj strani dvorišta.',
      first: 'Prvi radnik: "Na listu piše 125 · 7 · 8. Spoji 125 i 8."',
      second: 'Drugi radnik: "Kod mene piše 8 · 7 · 125. Isti faktori, samo drugim redom."',
      structureFirst: 'Prvo izračunaj 125 · 8. Zatim pomnoži sa 7.',
      structureSecond: 'Faktori su isti, pa je i umnožak isti.',
      grumpy: neighbours,
      opened:
        'Vrata skladišta se otvaraju. Radnik kima: "Sad veliki tovar. Taj je u dnu dvorišta."',
      hint: {
        step: 'Nađi par faktora koji daje okrugao broj.',
        move: 'Prijeđi na parnu stranu. 125 · 8 = 1 000, a 1 000 · 7 = 7 000.',
      },
      example: ['Primjer s drugim brojevima:', '25 · 3 · 4 = 100 · 3 = 300'],
    },
    big: {
      intro: 'Veliki tovar. Račun je dug, ali u njemu su parovi.',
      side: 'I veliki je tovar na parnoj strani.',
      factors: 'Radnik: "Na listu piše 5 · 73 · 2 · 125 · 8. Traži parove."',
      rows: 'Skladištar: "Složio sam ih u 730 redova po 1 000. Broji kako hoćeš."',
      structureFactors: 'Dva para: 5 · 2 i 125 · 8. Zatim pomnoži sa 73.',
      structureRows: 'Redovi puta sanduci u redu. Množenje s 1 000 dodaje tri nule.',
      grumpy: neighbours,
      opened: 'Tovar je nađen, ali sanduka nema. Na zemlji su tragovi kotača.',
      hint: {
        step: 'Traži dva para: jedan daje 10, drugi 1 000.',
        move: 'Prijeđi na parnu stranu. 5 · 2 = 10, a 125 · 8 = 1 000. Ostaje još 73.',
      },
      example: ['Primjer s drugim brojevima:', '5 · 41 · 2 · 25 · 4 = 10 · 100 · 41 = 41 000'],
    },
    write: {
      pair: 'Zapiši par koji daje tisuću.',
      whole: 'A sad cijeli račun: 125 · 7 · 8. Prvo par, pa ostatak.',
    },
    find: {
      say: 'Radnik pokazuje na tragove: sanduci su otišli kolima, uzbrdo, istim putem kao i Majstor.',
      title: 'Zamjena i združivanje faktora.',
      card: [
        'Kad iste stvari brojimo po redovima ili po stupcima, dobijemo isti broj. Zato faktori smiju zamijeniti mjesta: 3 · 7 = 7 · 3. To je komutativnost, ili zamjena.',
        'Faktore smijemo združiti kako nam je lakše, a umnožak ostaje isti: 3 · 2 · 5 = 3 · 10. To je asocijativnost, ili združivanje.',
        'Zato tražimo parove koji daju okrugao broj: 2 · 5 = 10, 20 · 5 = 100, 25 · 4 = 100, 125 · 8 = 1 000.',
      ],
    },
  },
  l10: {
    title: 'Šesta kola',
    lesson: {
      found:
        'Svjedok je vidio 5 kola i zna to napamet. Mali automat nađe valjak pod njegovom klupom.',
      steps: [
        ['12 sanduka slažemo po 4. Koliko je tovara?', '12 : 4 = 3'],
        ['Ista slika: 12 sanduka na 3 kola. Koliko ide na svaka?', '12 : 3 = 4'],
        [
          'U računu 12 : 3 = 4 broj 12 je djeljenik, a 3 je djelitelj.',
          'Rezultat, 4, je količnik.',
        ],
        ['Dijeljenje traži faktor koji nedostaje.', '3 · 4 = 12, pa je 12 : 3 = 4.'],
        ['Dijeljenje se piše i kosom crtom.', '12 / 3 je isto što i 12 : 3.'],
      ],
    },
    tries: {
      per: 'Slaži 8 sanduka po 2. Koliko je tovara?',
      share: '18 sanduka na 3 kola. Koliko ide na svaka? Napiši.',
      slash: 'Na listu piše 40 / 8. U bilježnici dijelimo dvotočkom. Napiši.',
    },
    mistake: {
      say: 'Mali automat čita "3 puta manje" i "za 3 manje". Jedan njegov redak nije točan. Dodirni ga.',
      nudge: 'Taj je redak točan: "za 3 manje" znači oduzeti 3.',
      show: '"3 puta manje" znači podijeliti s 3. Pokaži mu: slaži 15 sanduka po 3.',
      write: 'Sad napiši točan redak.',
      thanks: 'Mali automat kima. Sad razlikuje "puta" i "za".',
    },
    scene: {
      intro: 'Svjedok je vidio 120 sanduka i 5 kola. Na jedna kola stane 20 sanduka. Provjeri.',
      share: {
        say: 'Na listu piše 120 / 6: 120 sanduka na 6 kola. Natovari ih jednako.',
        line: 'Koliko je sanduka na svakim kolima? Napiši dvotočkom.',
      },
      loads: {
        say: 'Sad drugo pitanje: na jedna kola ide 20. Natovari sve sanduke.',
        line: 'Koliko je kola potrebno? Svjedok kaže 5. Napiši.',
      },
      fewer: {
        say: 'Svjedok se sjeti: jedna su kola nosila 3 puta manje od 60, a druga za 3 manje. Podijeli 60 sanduka na 3 kola.',
        line: 'Koliko je "3 puta manje od 60"? Napiši.',
      },
      big: {
        say: 'U skladištu je još 1 200 sanduka i 6 kola. Sad se slažu po 200.',
        line: 'Koliko je na svakim kolima? Napiši.',
      },
      noCarts: {
        say: 'Svjedok pita: "A da kola nije ni bilo?" Podijeli 120 sanduka na 0 kola. Pritisni Kreni.',
        result:
          'Nema kola, pa sanduci ostaju na zemlji, zauvijek. Nijedan broj pomnožen s 0 ne daje 120. S nulom se ne dijeli.',
      },
      noCrates: {
        say: 'A obrnuto? 3 kola, a 0 sanduka. Pritisni Kreni.',
        line: 'Svaka kola dobiju 0, i to je u redu. Napiši.',
      },
      tipped: 'Kola nisu jednako natovarena i prevrnu se. Natovari ih jednako.',
      left: 'Neki su sanduci ostali na zemlji. Natovari i njih.',
      opened:
        'Kola je 6, a svjedok je vidio 5. Češe se po glavi: "Onda su jedna otišla drugim putem."',
      hint: {
        step: 'Dijeljenje pita dvoje: koliko na svaka kola, ili koliko kola.',
        move: 'Dodiruj kola redom dok zemlja ne ostane prazna. Zatim pritisni Kreni.',
      },
      example: ['Primjer s drugim brojevima:', '80 : 4 = 20', '80 : 20 = 4', '0 : 5 = 0'],
    },
    write: {
      fewer: 'Zapiši: 3 puta manje od 60.',
      minus: 'A sad: za 3 manje od 60.',
      whole: 'I još glavni račun: 120 sanduka, po 20 na kola. Koliko je kola?',
    },
    find: {
      say: 'Šesta kola nisu išla s ostalima. Netko ih je poslao drugim putem.',
      title: 'Dijeljenje. S nulom se ne dijeli.',
      card: [
        'Dijeljenje traži faktor koji nedostaje: količnik pomnožen s djeliteljem daje djeljenik.',
        'Dijeljenje odgovara na dva pitanja: koliko je skupina, i koliko je u svakoj skupini. Znakovi : i / znače isto.',
        'Nulu možemo podijeliti: 0 : 3 = 0. Ali s nulom se ne dijeli: svaki broj pomnožen s 0 daje 0, pa za 7 : 0 nema rezultata.',
        '"3 puta manje" znači podijeliti s 3, a "za 3 manje" znači oduzeti 3.',
      ],
    },
  },
  l11: {
    title: 'Kaput',
    lesson: {
      found: 'Vučetić je okupio ljude. Mali automat drži se podalje i pod klupom nađe valjak.',
      steps: [
        ['3 + 2 · 5 znači: 3 komada i još 2 svežnja po 5.', 'Svežanj je množenje: 2 · 5 je 5 + 5.'],
        ['Svežanj prvo izbrojimo, a tek onda dodajemo.', '3 + 2 · 5 = 3 + 10 = 13'],
        ['I dijeljenje ide prije zbrajanja i oduzimanja.', '7 + 8 : 2 = 7 + 4 = 11'],
        [
          'Prvo množenje i dijeljenje, slijeva nadesno.',
          'Zatim zbrajanje i oduzimanje, slijeva nadesno.',
        ],
        [
          'Automati znaju samo korake: uvijek slijeva nadesno.',
          'Zato griješe svaki put na isti način.',
        ],
      ],
    },
    tries: {
      bundle: 'Složi 3 svežnja po 5: 3 reda, u svakom 5.',
      add: 'Dodaj još 4 komada. Koliko je 4 + 3 · 5? Napiši.',
      numbers: 'Sad bez slike. Koliko je 20 − 12 : 4? Napiši.',
    },
    mistake: {
      say: 'Mali automat računa redom, kako piše. Jedan njegov redak nije točan. Dodirni ga.',
      nudge: 'Taj je redak točan: tu množenje ionako stoji prvo.',
      show: 'Njegov redak znači 5 svežnjeva po 4. A svežnja su samo 3. Ostavi 3 reda.',
      write: 'Uz 3 svežnja po 4 stoje još 2 komada. Napiši točan redak.',
      thanks: 'Mali automat kima. Sad prvo izbroji svežnjeve.',
    },
    unmask: {
      intro:
        'Vučetić je sam okupio sve koji su vidjeli kartu. Zagorka traži da pitaš i njega, za novine. Po strani Gospon Penkala čita Knjigu: "2 + 2 : 2 je 2." Njega nitko nije pitao.',
      who: {
        milka: 'Milka',
        nikola: 'Nikola',
        belusic: 'Belušić',
        zagorka: 'Zagorka',
        vucetic: 'Vučetić',
      },
      offended: {
        milka: '"Ja? Ja pečem kifle, a ne račune!"',
        nikola: '"Ja? Pa ja samo pitam kako to radi!"',
        belusic: '"Ja? Ja sve mjerim! I ovaj sam račun izmjerio dvaput."',
        zagorka: '"Ja? 27 je oko 30. To je naslov, a ne laž!"',
      },
      why: {
        milka: 'Milka računa točno, svaki put.',
        nikola: 'Nikola se zabunio jednom, a ostalo je točno. Automat griješi svaki put isto.',
        belusic: 'Belušić računa točno, svaki put.',
        zagorka: 'Zagorka je jedan rezultat zaokružila za naslov. Ostalo je točno.',
      },
      cards: {
        a: 'Koliko je 2 + 2 : 2?',
        b: 'Koliko je 6 + 4 · 2?',
        c: 'Koliko je 30 − 6 : 2?',
        d: 'Koliko je 200 − 50 · 2?',
      },
      reveal:
        'Šešir odskoči. Ispod njega su zupčanici. Automat u kaputu usporava i kaže još samo: "Zapisano." Mali automat, koji se od njega skriva još od ljevaonice, dokotrlja se do njega i ispiše: "Zašto?" Odgovora nema.',
      fix: 'Na traci su svi njegovi računi. Napiši prvi kako treba.',
      opened:
        'Zagorka zapisuje, i ništa ne zaokružuje. Na traci je još nešto: adresa Majstora Kristijana, zapisana kao račun. Automat ju je nosio, a nikad je nije znao pročitati.',
      hint: {
        step: 'Tko griješi svaki put na isti način? Jedna pogreška još nije automat.',
        move: 'Pogledaj Vučetićeve račune: uvijek ide slijeva nadesno.',
      },
      example: [
        'Primjer s drugim brojevima:',
        '5 + 6 : 3 = 5 + 2 = 7',
        'Automat bi računao: 11 : 3.',
      ],
    },
    knock: {
      intro: 'Na traci je adresa Majstora Kristijana: jedan dugi račun. Izračunaj ga i nađi kuću.',
      side: 'Traka kaže: neparna strana ulice.',
      tape: 'Na traci piše: 100 − 20 · 3 + 10 : 2.',
      past: 'Milka pamti samo ovo: kućni je broj veći od 40.',
      structureTape: 'Prvo množenje i dijeljenje. Zatim zbrajanje i oduzimanje, slijeva nadesno.',
      structurePast: 'Napiši x, znak > i broj iz traga.',
      wrong125:
        'Kuća 125 puna je automata. Prevrću namještaj i traže Majstora. Na traci im je isti račun, izračunat slijeva nadesno, kao i tvoj.',
      grumpy: neighbours,
      opened:
        'Kuća 45. Obična vrata, i nigdje automata. Svi su na broju 125, jer računaju slijeva nadesno.',
      hint: {
        step: 'Prvo množenje i dijeljenje, pa tek onda ostalo.',
        move: '20 · 3 = 60 i 10 : 2 = 5. Ostaje 100 − 60 + 5.',
      },
      example: ['Primjer s drugim brojevima:', '50 − 10 · 2 + 6 : 3 = 50 − 20 + 2 = 32'],
    },
    write: {
      fade: 'Zapiši adresu kao u školi. Što ide u kvadratić?',
      whole: 'A sad dovrši: 100 − 60 + 5. Napiši cijeli redak.',
    },
    find: {
      say: 'Automat više ništa ne javlja. Ostali traže na broju 125, a broj 45 znaš samo ti.',
      title: 'Redoslijed računskih radnji.',
      card: [
        'U brojevnom izrazu prvo računamo množenje i dijeljenje. To su računske radnje višeg stupnja. Računamo ih slijeva nadesno.',
        'Zatim računamo zbrajanje i oduzimanje, računske radnje nižeg stupnja, također slijeva nadesno.',
        'Zašto? Množenje je skraćeno zbrajanje. U izrazu 2 + 3 · 4 stoje 2 i još tri četvorke, a tu skupinu treba prvo prebrojiti. Tako svi dobiju isti rezultat.',
      ],
    },
  },
  k3: {
    title: 'Treći čvor',
    guard: {
      rule: 'UVIJEK RAČUNAJ SLIJEVA NADESNO. HVALA.',
      intro:
        'Milki kod mosta već tjednima nestaju kifle. Pod mostom, u staroj četvrti, nalazi se alatnica. Pred njom stoji automat.',
      thanks: {
        adds: 'Hvala. Slijeva nadesno to je 15 − 5 = 10, i to je točno. Pravilo vrijedi.',
        timesFirst: 'Hvala. Slijeva nadesno to je 12 + 2 = 14, i to je točno. Pravilo vrijedi.',
        divideFirst: 'Hvala. Slijeva nadesno to je 4 + 6 = 10, i to je točno. Pravilo vrijedi.',
        minus: 'Hvala. Slijeva nadesno to je 16 − 6 = 10, i to je točno. Pravilo vrijedi.',
        factors: 'Hvala. Slijeva nadesno to je 10 · 3 = 30, i to je točno. Pravilo vrijedi.',
      },
      write: 'Slijeva nadesno to je 8 · 3 = 24. Napiši kako je točno.',
      jammed:
        'Traka zapinje: "Hvala. Hva... Hva..." Iza vrata netko viče: "Napokon! Tu sam još od prije prve obavijesti!"',
      hint: {
        step: 'Traži račun u kojem množenje stoji iza oduzimanja ili zbrajanja.',
        move: 'Izaberi 10 − 2 · 3. Prvo množenje: 10 − 6.',
      },
      example: [
        'Primjer s drugim brojevima:',
        '7 + 2 · 5 = 7 + 10 = 17',
        'Slijeva nadesno bilo bi 9 · 5 = 45.',
      ],
    },
    knock: {
      intro:
        'U alatnici je pravi Vučetić, gladan i ljut. Zidovi su puni zapisa, po datumu: "Dan 1.: Zaključan sam. Dan 2.: Još sam zaključan. Dan 3.: Kifla na rešetki. Hvala. I dalje sam ljut."',
      side: 'Zid, dan 38.: "Čujem kola. Staju na neparnoj strani. Još sam ljut."',
      limit: 'Zid, dan 39.: "Kućni broj manji je od 70. Kifla dobra. Još sam ljut."',
      story:
        'Zid, dan 40.: "Kola kreću od kuće 45 i prođu još nekoliko kuća. Tih je kuća 3 puta manje nego sanduka, a sanduka je 60. Ljut sam, po redu."',
      structureLimit: 'Napiši x, znak < i broj iz traga.',
      structureStory: '3 puta manje od 60 je 60 : 3. Prvo dijeljenje, pa zbrajanje.',
      wrong35:
        'Kuća 35. Na vratima traka: OVO JE ISPRAVLJENO. HVALA. Automati su već bili ovdje: i oni računaju slijeva nadesno.',
      grumpy: neighbours,
      opened:
        'Vučetić zagrize kiflu i piše na zid: "Dan 41.: Netko pametan je tu. Malo sam manje ljut."',
      hint: {
        step: '3 puta manje od 60 je dijeljenje. Prvo to, pa zbrajanje.',
        move: 'Prijeđi na neparnu stranu. 60 : 3 = 20, a 45 + 20 = 65.',
      },
      example: ['Primjer s drugim brojevima:', '20 + 12 : 4 = 20 + 3 = 23'],
    },
    write: {
      fade: 'Zapiši ono sa zida: 3 puta manje od 60.',
      whole: 'Sad cijela priča u jednom redu: kuća 45, pa još 3 puta manje od 60.',
    },
    find: {
      say: 'Pravi Vučetić izlazi iz alatnice, s kiflom u ruci. "Karta je sad samo tvoja. Zapisano. I to pravo."',
      title: 'Priča kao brojevni izraz.',
      card: [
        'Priču možemo zapisati jednim brojevnim izrazom: svaki podatak je broj, a svaki korak računska radnja.',
        '"Puta" znači množenje ili dijeljenje, a "za" zbrajanje ili oduzimanje.',
        'Zatim vrijedi isti redoslijed: prvo množenje i dijeljenje, pa zbrajanje i oduzimanje.',
      ],
    },
  },
} as const;
