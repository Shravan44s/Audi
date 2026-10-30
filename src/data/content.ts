export const STORY = [
  {
    id: 'design',
    kicker: '01 · Design',
    title: ['Singleframe.', 'Unmistakable.'],
    body: 'The grille, the light signature, the shoulder line. You know it is an Audi before you see the rings.',
  },
  {
    id: 'quattro',
    kicker: '02 · quattro',
    title: ['Four rings.', 'Four wheels.'],
    body: 'Permanent all-wheel drive since 1980. On ice, on gravel, at Le Mans, quattro keeps the power on the ground.',
  },
  {
    id: 'inside',
    kicker: '03 · Inside',
    title: ['Now take', 'it apart.'],
    body: 'The shell parts, the glasshouse lifts and the cabin rises off the floor. Underneath is what moves it.',
    list: [
      { name: '800 V battery', color: '#2bf5b0' },
      { name: 'Dual e-motors', color: '#ffd84d' },
      { name: 'Virtual cockpit', color: '#5ee6ff' },
      { name: 'Carbon-ceramic brakes', color: '#c9ced6' },
    ],
  },
  {
    id: 'progress',
    kicker: '04 · Progress',
    title: ['Vorsprung', 'durch Technik.'],
    body: 'Digital OLED tail lights, 320 kW charging, 10–80 % in 18 minutes. Progress you can see from behind.',
  },
] as const;

export type SportItem = {
  id: string;
  series: string;
  title: string;
  body: string;
  stat: { value: string; label: string };
  image: string;
};

export const SPORT: SportItem[] = [
  {
    id: 'f1',
    series: 'Formula 1',
    title: 'Audi F1 Team',
    body: 'Hinwil chassis, Neuburg power unit. The first season as a full works team, built around the 2026 hybrid rules.',
    stat: { value: '2026', label: 'Debut season' },
    image: '/images/f1.jpg',
  },
  {
    id: 'lemans',
    series: 'Le Mans 24 Hours',
    title: 'Thirteen wins',
    body: 'From the R8 to the R18 e-tron quattro, the first hybrid to win at La Sarthe.',
    stat: { value: '13', label: 'Overall victories' },
    image: '/images/lemans.jpg',
  },
  {
    id: 'dakar',
    series: 'Dakar Rally',
    title: 'Electric in the dunes',
    body: 'The RS Q e-tron won the Dakar in 2024 — the first electrified drivetrain to do it.',
    stat: { value: '2024', label: 'Dakar victory' },
    image: '/images/dakar.jpg',
  },
  {
    id: 'launch',
    series: 'Audi Sport',
    title: 'From track to RS',
    body: 'Every RS model is developed by the same people who build the race cars. The lap timer is not decoration.',
    stat: { value: '1980', label: 'quattro debut' },
    image: '/images/f1-launch.jpg',
  },
];

export type Brand = {
  id: string;
  name: string;
  home: string;
  since: string;
  tagline: string;
  fact: string;
  image: string;
  accent: string;
};

export const BRANDS: Brand[] = [
  {
    id: 'lamborghini',
    name: 'Lamborghini',
    home: "Sant'Agata Bolognese, IT",
    since: 'With Audi since 1998',
    tagline: 'The V12 hybrid supercar.',
    fact: 'Revuelto · 1,015 CV',
    image: '/images/lamborghini.jpg',
    accent: '#e3b505',
  },
  {
    id: 'ducati',
    name: 'Ducati',
    home: 'Bologna, IT',
    since: 'With Audi since 2012',
    tagline: 'Desmodromic superbikes.',
    fact: 'Panigale V4 · 216 hp',
    image: '/images/ducati.jpg',
    accent: '#e3262d',
  },
  {
    id: 'bentley',
    name: 'Bentley',
    home: 'Crewe, UK',
    since: 'Under Audi leadership since 2022',
    tagline: 'Grand touring, hand-built.',
    fact: 'Continental GT · W12 → hybrid V8',
    image: '/images/bentley.jpg',
    accent: '#3fa47a',
  },
  {
    id: 'italdesign',
    name: 'Italdesign',
    home: 'Moncalieri, IT',
    since: 'With Audi since 2010',
    tagline: 'Design, engineering, prototypes.',
    fact: 'Giugiaro heritage · 1968',
    image: '/images/italdesign.jpg',
    accent: '#8fb3ff',
  },
];

export const CREDITS: { file: string; author: string; license: string; url: string }[] = [
  { file: 'f1', author: 'Der Alf', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:F1_2026,_Audi_F1_Team,_Audi_R26,_Nico_H%C3%BClkenberg,_Spa_Francorchamps_(55425960870).jpg' },
  { file: 'f1-launch', author: 'Mustang Joe', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Audi_Revolut_F1.jpg' },
  { file: 'lemans', author: 'David Merrett', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Audi_R18_TDI_-_Winning_Car_-_Le_Mans_24_Hours_2011_(6192211130).jpg' },
  { file: 'dakar', author: 'Andrew Basterfield', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Audi_RS_Q_e-tron_Dakar_(53048651978).jpg' },
  { file: 'etrongt', author: 'Alexander-93', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Audi_RS_e-tron_GT_1X7A1875.jpg' },
  { file: 'r8', author: 'Nicolas Völcker', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Audi_R8_V10_RWS_(2)_%E2%80%93_IAA_2017_%E2%80%93_by_Nicolas_V%C3%B6lcker.jpg' },
  { file: 'rs6', author: 'Charles from Port Chester, NY', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Audi_RS_6_Avant_(2022)_(52566506314).jpg' },
  { file: 'q8', author: 'Alexander-93', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Audi_Q8_e-tron_Sportback_1X7A7094.jpg' },
  { file: 'lamborghini', author: 'Alexander-93', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Lamborghini_Revuelto_Auto_Zuerich_2023_1X7A1101.jpg' },
  { file: 'ducati', author: 'Cjp24', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Ducati_Panigale_V4_R_(3).jpg' },
  { file: 'bentley', author: 'Alexander-93', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Bentley_Continental_GT_(4th_gen.)_IMG_0553.jpg' },
  { file: 'italdesign', author: 'Alexander Migl', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Italdesign_Aztec_Retro_Classics_2025_DSC_7546.jpg' },
  { file: 'charging', author: 'C.Suthorn', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Audi_Charging_Hub_Nuernberg_Messe_01.jpg' },
  { file: 'interior', author: 'deathpallie325', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:2023_Audi_e-tron_GT_interior.jpg' },
  { file: 'cockpit', author: 'Damian B Oh', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Audi_A8_L_D5_Black_Valcona_Interior_with_Piano_Black_Inlay_(23).jpg' },
];

/** The four companies of Auto Union, left to right as the rings sit in the badge. */
export const FOUNDERS = [
  { name: 'Audi', city: 'Zwickau', since: '1909', made: 'Premium mid-size cars' },
  { name: 'DKW', city: 'Zschopau', since: '1916', made: 'Motorcycles & small cars' },
  { name: 'Horch', city: 'Zwickau', since: '1899', made: 'Luxury cars' },
  { name: 'Wanderer', city: 'Chemnitz', since: '1885', made: 'Mid-size cars' },
];

export type Era = {
  year: string;
  title: string;
  body: string;
  /** Short tag above the title. */
  tag: string;
  image?: string;
};

export const HISTORY: Era[] = [
  {
    year: '1899',
    tag: 'Cologne',
    title: 'August Horch starts out',
    body: 'Engineer August Horch, once Carl Benz’s production manager, founds A. Horch & Cie. His first car runs in 1901.',
  },
  {
    year: '1909',
    tag: 'Zwickau',
    title: '“Horch!” becomes “Audi!”',
    body: 'Horch leaves his own firm and may no longer use his name. A schoolboy suggests the Latin for it: horch means listen, and so does audi.',
  },
  {
    year: '1914',
    tag: 'Alpine trial',
    title: 'The first winning streak',
    body: 'The Audi Type C, nicknamed “Alpensieger”, wins the gruelling International Austrian Alpine Run three years running.',
  },
  {
    year: '1921',
    tag: 'Type K',
    title: 'Left-hand drive',
    body: 'The Audi Type K is the first German production car with the steering wheel on the left.',
  },
  {
    year: '1932',
    tag: 'Chemnitz',
    title: 'Auto Union and the four rings',
    body: 'Audi, DKW, Horch and Wanderer merge into Auto Union AG, then Germany’s second-largest carmaker. Each ring is one company.',
  },
  {
    year: '1937',
    tag: 'Silver Arrows',
    title: 'Over 400 km/h on a public road',
    body: 'Bernd Rosemeyer’s streamlined Auto Union Type C is the first car to pass 400 km/h on a public road, on the Frankfurt–Darmstadt autobahn.',
  },
  {
    year: '1949',
    tag: 'Ingolstadt',
    title: 'A new start in Bavaria',
    body: 'With the Saxon plants lost after the war, Auto Union GmbH is re-founded in Ingolstadt, still Audi’s home today.',
  },
  {
    year: '1965',
    tag: 'Volkswagen',
    title: 'The name comes back',
    body: 'Now owned by Volkswagen, Auto Union launches the first post-war Audi. In 1969 it merges with NSU and the rings stay.',
  },
  {
    year: '1980',
    tag: 'Geneva',
    title: 'quattro',
    body: 'Permanent all-wheel drive in a fast coupé. In rallying, Michèle Mouton and Walter Röhrl turn it into a legend.',
  },
  {
    year: '1994',
    tag: 'Audi Space Frame',
    title: 'An aluminium A8',
    body: 'The A8 is the first volume luxury car with an all-aluminium body, a structure Audi calls the Space Frame.',
  },
  {
    year: '2006',
    tag: 'Le Mans',
    title: 'Diesel, then hybrid, wins',
    body: 'The R10 TDI is the first diesel to win the 24 Hours. In 2012 the R18 e-tron quattro is the first hybrid. Thirteen wins in all.',
    image: '/images/lemans.jpg',
  },
  {
    year: '2006',
    tag: 'Paris',
    title: 'The R8 supercar',
    body: 'The Le Mans name moves to a mid-engine road car, later with the V10 that would become its signature.',
    image: '/images/r8.jpg',
  },
  {
    year: '2018',
    tag: 'Electric',
    title: 'The first e-tron',
    body: 'Audi’s first all-electric production car. The e-tron GT follows in 2021, built in Böllinger Höfe beside the R8.',
    image: '/images/etrongt.jpg',
  },
  {
    year: '2024',
    tag: 'Dakar',
    title: 'Electric in the desert',
    body: 'The RS Q e-tron wins the Dakar Rally with Carlos Sainz: the first win there for an electrified drivetrain.',
    image: '/images/dakar.jpg',
  },
  {
    year: '2026',
    tag: 'Formula 1',
    title: 'The works team',
    body: 'Audi enters Formula 1 as a full works team, with a chassis from Hinwil and a power unit from Neuburg.',
    image: '/images/f1.jpg',
  },
];
