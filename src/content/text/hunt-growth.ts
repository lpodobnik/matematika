// Part 2's growth (epic 11): what Faust sells for the little one, Kristijan's caches and the
// papers in them. A draft for Luka, like all of part 2's text. Present tense and imperatives
// only, so nothing needs the player's gender.

export const growthText = {
  shop: {
    head: 'Za malog automata',
    line: 'Kristijan je po gradu ostavljao znakove kredom. S pravim alatom mali dohvati ono što je iza njih.',
    gearHead: 'Alat',
    looksHead: 'Izgled',
    gear: {
      lamp: { name: 'Jaka svjetiljka', what: 'Osvijetli tamni kut sa znakom kredom.' },
      magnet: { name: 'Magnet', what: 'Izvuče željezo iz pukotine sa znakom kredom.' },
      'long-hook': { name: 'Duža kuka', what: 'Dohvati visoku kuku sa znakom kredom.' },
    },
    looks: {
      'paint-brass': 'Sjajna mjed',
      'paint-red': 'Crvena boja',
      'paint-blue': 'Plava boja',
      'hat-cap': 'Kapa',
      'hat-top': 'Cilindar',
      'hat-chef': 'Kuharska kapa',
    },
    /** A look he owns: put it on, or take it off. */
    wear: 'Stavi',
    takeOff: 'Skini',
  },
  secrets: {
    /** For screen readers: a chalk mark in the street. */
    label: 'Znak kredom',
    /** Tapped without the gear it needs: what it needs, and where to get it. */
    needs: {
      lamp: [
        'Znak kredom pokazuje u mrak. Ništa se ne vidi.',
        'Treba jača svjetiljka. Faust je prodaje u Radionici na Trgu.',
      ],
      magnet: [
        'Znak kredom pokazuje u usku pukotinu. Unutra nešto zvecka, ali prsti ne dosegnu.',
        'Treba magnet. Faust ga prodaje u Radionici na Trgu.',
      ],
      'long-hook': [
        'Znak kredom pokazuje gore, na kuku visoko na zidu.',
        'Treba duža kuka. Faust je prodaje u Radionici na Trgu.',
      ],
    },
    /** What the little one does with the gear. */
    fetch: {
      lamp: 'Mali upali jaku svjetiljku i otkotrlja se u mrak.',
      magnet: 'Mali spusti magnet u pukotinu. Klik!',
      'long-hook': 'Mali zabaci dužu kuku i povuče.',
    },
    found: (parts: number) => `Mali donosi Kristijanov papir i ${parts} dijelova.`,
    keep: 'Spremi u Radionicu',
    /** Already found: the mark is crossed out. */
    done: 'Ovdje je mali već bio. Papir je u Radionici.',
    wall: 'Kristijanovi papiri',
    wallEmpty: 'Još nijedan. Traži znakove kredom po gradu.',
    /** How many he has found, of all. */
    count: (found: number, all: number) => `${found} od ${all}`,
    papers: {
      'secret-1': {
        title: 'Nacrt malog automata',
        line: 'Tijelo od starog kotla, kotač od kolica za mlijeko. Ono najvažnije nisam ugradio: to mora naučiti.',
      },
      'secret-2': {
        title: 'Bilješka o koracima',
        line: 'Prvi Automat zna sve korake napamet. Ali ne zna zašto vrijede, pa ne vidi kad ne vrijede.',
      },
      'secret-3': {
        title: 'Nacrt valjka',
        line: 'Svaki valjak čuva jedno „zašto”. Sakrio sam ih po gradu, daleko od Prvog Automata.',
      },
      'secret-4': {
        title: 'Bilješka o kiflama',
        line: 'Milka mi svaki dan donosi kifle. Mali ih ne može jesti, ali ih voli nositi.',
      },
      'secret-5': {
        title: 'Nacrt ključa za navijanje',
        line: 'Rezervni ključ. Ako mali ikad stane, navij ga triput, polako.',
      },
      'secret-6': {
        title: 'Bilješka bez datuma',
        line: 'Ako ovo netko čita, mali je našao pravu osobu. Dobro je. Nastavi ga učiti.',
      },
      'secret-7': {
        title: 'Stara bilješka s kanala',
        line: 'Ovdje sam kao šegrt ispustio prvi zupčanik. Tražio sam ga tjedan dana.',
      },
      'secret-8': {
        title: 'Nacrt kliješta',
        line: 'Kliješta i uže, za vruće zupčanike. Ono što peče ne dira se rukom.',
      },
    },
  },
} as const;
