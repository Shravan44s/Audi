/** [x, y] in metres. x runs tail (−) to nose (+), y up from the ground. */
export type Pt = [number, number];

/** ev = battery + motors; front = front-mounted engine; mid = mid-engine. */
export type Powertrain = 'ev' | 'front' | 'mid';

/** Paint finish: drives roughness, clearcoat and the pearl's colour shift on the real model. */
export type Finish = 'metallic' | 'pearl' | 'matt' | 'solid';

export type Paint = { name: string; hex: string; finish: Finish };

/** Fuller spec sheet and feature notes for the showroom's detail tabs. */
export type CarDetails = {
  /** One-paragraph summary under the model name. */
  intro: string;
  performance: { k: string; v: string }[];
  dimensions: { k: string; v: string }[];
  highlights: { title: string; body: string }[];
};

export type PartKey = 'body' | 'glass' | 'cabin' | 'cockpit' | 'seats' | 'wheels' | 'drive' | 'energy';

export type Car = {
  id: string;
  name: string;
  /** Model line shown as the eyebrow, e.g. "Audi Sport". */
  line: string;
  tagline: string;
  /** Accent for the backdrop glow, rim lights and part labels. */
  glow: string;
  paints: Paint[];
  /** Leather / trim colour of the cabin. */
  trim: string;
  specs: { k: string; v: string }[];
  details: CarDetails;
  powertrain: Powertrain;
  /** Cylinder count drawn for combustion engines. */
  cylinders?: number;
  /** Real 3D model (CC BY 4.0) in public/models; the hologram shows while it streams in. */
  model: string;
  /** Extra turn about y (rad) for a model whose nose doesn't land on +x after the auto-orient in cutCar. */
  yaw?: number;
  /** Sketchfab original, credited in the footer. */
  source: { uid: string; title: string; author: string };
  /**
   * How this model's materials map onto explode layers (tested against material names).
   * Cabin parts are found geometrically; see CarModel.
   */
  match: { paint: RegExp; glass: RegExp; wheel: RegExp; caliper?: RegExp; /** Tyre material: its bounds give the true hub centre. */ tire: RegExp };
  dims: {
    /** Full width, m. */
    width: number;
    /** Greenhouse width at the beltline, m. */
    cabinWidth: number;
    wheelRadius: number;
    frontAxle: number;
    rearAxle: number;
    /** Height of the beltline where the glass starts, m. */
    belt: number;
  };
  /** Side silhouette of the lower body, nose-bottom → over the top → tail-bottom. */
  body: Pt[];
  /** Side silhouette of the glasshouse, windscreen base → roof → rear glass base. */
  glass: Pt[];
  /** Copy for each exploded layer's label chip. */
  parts: Record<PartKey, { title: string; sub: string }>;
};

export const CARS: Car[] = [
  {
    id: 'rs-etron-gt',
    name: 'RS e-tron GT',
    line: 'Audi Sport · e-tron',
    tagline: 'The most powerful Audi ever built. Silent until it isn’t.',
    glow: '#3b82ff',
    paints: [
      { name: 'Glacier White', hex: '#e8e9ea', finish: 'metallic' },
      { name: 'Kemora Grey', hex: '#5d6066', finish: 'metallic' },
      { name: 'Daytona Grey', hex: '#3d4045', finish: 'matt' },
      { name: 'Tactical Green', hex: '#3e4a3c', finish: 'metallic' },
      { name: 'Ascari Blue', hex: '#1d3d8f', finish: 'metallic' },
      { name: 'Tango Red', hex: '#a3141f', finish: 'metallic' },
    ],
    trim: '#262222',
    specs: [
      { k: 'Power (boost)', v: '680 kW' },
      { k: '0–100 km/h', v: '2.5 s' },
      { k: 'Range WLTP', v: 'up to 568 km' },
      { k: 'Peak charging', v: '320 kW' },
    ],
    details: {
      intro:
        'A four-door gran turismo built on the J1 platform it shares with the Taycan. Two motors, an 800-volt battery in the floor and a low, wide stance shaped in the wind tunnel.',
      performance: [
        { k: 'Power (boost)', v: '680 kW · 925 PS' },
        { k: 'Torque', v: '1,027 Nm' },
        { k: '0–100 km/h', v: '2.5 s' },
        { k: 'Top speed', v: '250 km/h' },
        { k: 'Battery', v: '105 kWh gross · 800 V' },
        { k: 'Range WLTP', v: 'up to 568 km' },
        { k: 'DC charging', v: '320 kW · 10–80 % in 18 min' },
        { k: 'Drive', v: 'quattro · e-torque vectoring' },
      ],
      dimensions: [
        { k: 'Length', v: '4,989 mm' },
        { k: 'Width', v: '1,964 mm' },
        { k: 'Height', v: '1,396 mm' },
        { k: 'Wheelbase', v: '2,900 mm' },
        { k: 'Kerb weight', v: '≈ 2,380 kg' },
        { k: 'Drag coefficient', v: '0.24 Cd' },
      ],
      highlights: [
        { title: 'Two-speed rear gearbox', body: 'First gear for the launch, second for efficient cruising at speed.' },
        { title: 'Active air suspension', body: 'Two-valve dampers that lift on rough roads and drop at speed.' },
        { title: 'Matrix LED + laser light', body: 'High beam that reaches twice as far, shaped around oncoming traffic.' },
        { title: 'Carbon roof', body: 'Lowers the centre of gravity right where it matters most.' },
      ],
    },
    powertrain: 'ev',
    model: '/models/rs-etron-gt.glb',
    source: { uid: 'a48a8c4ac4474c47b8ddf5bba754db40', title: 'Audi e-Tron GT - made with Blender', author: 'gbarzu' },
    match: {
      paint: /^BodyMain/,
      glass: /^(Windows|TintedWindows2?)$/,
      wheel: /^(silver\.|rubber\.|Disk|Material\.001$|BrakeCaliper)/,
      caliper: /BrakeCaliper|Material\.001/,
      tire: /^rubber\./,
    },
    dims: { width: 1.96, cabinWidth: 1.5, wheelRadius: 0.36, frontAxle: 1.5, rearAxle: -1.4, belt: 0.9 },
    body: [
      [2.48, 0.2],
      [2.5, 0.38],
      [2.44, 0.6],
      [2.2, 0.72],
      [1.4, 0.83],
      [0.75, 0.9],
      [-0.6, 0.95],
      [-1.6, 0.97],
      [-2.25, 0.99],
      [-2.46, 0.92],
      [-2.5, 0.6],
      [-2.45, 0.2],
    ],
    glass: [
      [0.8, 0.88],
      [0.0, 1.32],
      [-0.6, 1.4],
      [-1.25, 1.31],
      [-2.12, 0.98],
    ],
    parts: {
      body: { title: 'Body shell', sub: 'Steel/aluminium mix · 0.24 Cd' },
      glass: { title: 'Glasshouse', sub: 'Carbon roof · acoustic glazing' },
      cabin: { title: 'Cabin', sub: 'Leather-free option · 4 seats' },
      cockpit: { title: 'Virtual cockpit', sub: '12.3″ display + 10.1″ MMI' },
      seats: { title: 'RS sport seats', sub: 'Honeycomb stitching' },
      wheels: { title: '21″ wheels', sub: 'Carbon-ceramic brakes' },
      drive: { title: 'Dual e-motors', sub: 'quattro · 2-speed rear gearbox' },
      energy: { title: '105 kWh battery', sub: '800 V · 10–80 % in 18 min' },
    },
  },
  {
    id: 'r8',
    name: 'R8 V10 performance',
    line: 'Audi Sport · R8',
    tagline: 'The last naturally aspirated V10. Sits right behind your shoulders.',
    glow: '#ff3b30',
    paints: [
      { name: 'Tango Red', hex: '#a3141f', finish: 'metallic' },
      { name: 'Kemora Grey', hex: '#5d6066', finish: 'metallic' },
      { name: 'Daytona Grey', hex: '#3d4045', finish: 'matt' },
      { name: 'Vegas Yellow', hex: '#e7b100', finish: 'solid' },
      { name: 'Ascari Blue', hex: '#1d3d8f', finish: 'metallic' },
      { name: 'Ibis White', hex: '#f1f1ee', finish: 'solid' },
    ],
    trim: '#1b1b1d',
    specs: [
      { k: 'Power', v: '456 kW' },
      { k: '0–100 km/h', v: '3.1 s' },
      { k: 'Engine', v: '5.2 FSI V10' },
      { k: 'Top speed', v: '331 km/h' },
    ],
    details: {
      intro:
        'Audi’s mid-engine supercar, built by hand at Böllinger Höfe beside Neckarsulm. It shares its aluminium-and-carbon space frame and V10 with the Lamborghini Huracán.',
      performance: [
        { k: 'Power', v: '456 kW · 620 PS' },
        { k: 'Torque', v: '580 Nm' },
        { k: '0–100 km/h', v: '3.1 s' },
        { k: '0–200 km/h', v: '10.1 s' },
        { k: 'Top speed', v: '331 km/h' },
        { k: 'Engine', v: '5.2 FSI V10 · 8,700 rpm' },
        { k: 'Gearbox', v: '7-speed S tronic' },
        { k: 'Drive', v: 'quattro · multi-plate clutch' },
      ],
      dimensions: [
        { k: 'Length', v: '4,429 mm' },
        { k: 'Width', v: '1,940 mm' },
        { k: 'Height', v: '1,240 mm' },
        { k: 'Wheelbase', v: '2,650 mm' },
        { k: 'Dry weight', v: '1,555 kg' },
        { k: 'Weight split F / R', v: '40 : 60' },
      ],
      highlights: [
        { title: 'Naturally aspirated V10', body: 'No turbos. Throttle response is instant and it revs to 8,700 rpm.' },
        { title: 'Audi Space Frame', body: 'Aluminium with carbon-fibre reinforcement, 200 kg on its own.' },
        { title: 'Race-car roots', body: 'The R8 LMS GT3 shares about half its parts with the road car.' },
        { title: 'Hand-built', body: 'Assembled at the Böllinger Höfe plant, about 15 cars a day.' },
      ],
    },
    powertrain: 'mid',
    cylinders: 10,
    model: '/models/r8.glb',
    source: { uid: '8dd1c237238244d1a2a49d764d321b87', title: '2021 Audi R8 V10 Performance Quattro', author: 'supercarmodels' },
    match: {
      paint: /^Metallic_3$/,
      glass: /^(Translucent|material_9)$/,
      // Measured: Metallic_2 is the tyre (99 % inside the wheel cylinders); _12/_11/_10 are rim and brake.
      wheel: /^(Metallic_2|material_1[0-2])$/,
      tire: /^Metallic_2$/,
    },
    dims: { width: 1.94, cabinWidth: 1.44, wheelRadius: 0.35, frontAxle: 1.23, rearAxle: -1.42, belt: 0.86 },
    body: [
      [2.21, 0.17],
      [2.24, 0.36],
      [2.16, 0.55],
      [1.8, 0.67],
      [1.1, 0.77],
      [0.55, 0.84],
      [-0.9, 0.92],
      [-1.6, 0.98],
      [-2.1, 0.99],
      [-2.22, 0.88],
      [-2.24, 0.4],
      [-2.16, 0.17],
    ],
    glass: [
      [0.6, 0.82],
      [-0.12, 1.19],
      [-0.55, 1.24],
      [-1.0, 1.18],
      [-1.72, 0.98],
    ],
    parts: {
      body: { title: 'Audi Space Frame', sub: 'Aluminium + CFRP · 200 kg' },
      glass: { title: 'Canopy', sub: 'Carbon side blades' },
      cabin: { title: 'Monoposto cabin', sub: '2 seats · driver-focused' },
      cockpit: { title: 'Virtual cockpit', sub: 'Performance mode · no MMI screen' },
      seats: { title: 'Carbon bucket seats', sub: 'Diamond stitching' },
      wheels: { title: '20″ wheels', sub: 'Carbon-ceramic brakes' },
      drive: { title: 'quattro', sub: '7-speed S tronic · multi-plate clutch' },
      energy: { title: '5.2 FSI V10', sub: 'Mid-engine · 8,700 rpm' },
    },
  },
  {
    id: 'a5-sportback',
    name: 'A5 Sportback S line',
    line: 'Audi · A5',
    tagline: 'Coupé lines, five doors, quattro underneath. The everyday Audi, sharpened.',
    glow: '#f5f5f5',
    paints: [
      { name: 'Ibis White', hex: '#f1f1ee', finish: 'solid' },
      { name: 'Navarra Blue', hex: '#1c2e5a', finish: 'metallic' },
      { name: 'Progressive Red', hex: '#8e0f1d', finish: 'metallic' },
      { name: 'Daytona Grey', hex: '#4a4d52', finish: 'pearl' },
      { name: 'Mythos Black', hex: '#141416', finish: 'metallic' },
    ],
    trim: '#141416',
    specs: [
      { k: 'Power', v: '195 kW' },
      { k: '0–100 km/h', v: '5.8 s' },
      { k: 'Torque', v: '370 Nm' },
      { k: 'Top speed', v: '250 km/h' },
    ],
    details: {
      intro:
        'A coupé roofline over five doors and a big hatch. Underneath is the same MLB evo platform, quattro and S tronic gearbox as the larger Audis.',
      performance: [
        { k: 'Power', v: '195 kW · 265 PS' },
        { k: 'Torque', v: '370 Nm' },
        { k: '0–100 km/h', v: '5.8 s' },
        { k: 'Top speed', v: '250 km/h' },
        { k: 'Engine', v: '2.0 TFSI · 12 V mild hybrid' },
        { k: 'Gearbox', v: '7-speed S tronic' },
        { k: 'Drive', v: 'quattro with ultra technology' },
      ],
      dimensions: [
        { k: 'Length', v: '4,757 mm' },
        { k: 'Width', v: '1,843 mm' },
        { k: 'Height', v: '1,386 mm' },
        { k: 'Wheelbase', v: '2,824 mm' },
        { k: 'Boot', v: '465–1,280 l' },
        { k: 'Drag coefficient', v: '0.27 Cd' },
      ],
      highlights: [
        { title: 'Frameless doors', body: 'Coupé-style glass with no window frames, on all five doors.' },
        { title: 'quattro ultra', body: 'Drives the front wheels and engages the rear in milliseconds when needed.' },
        { title: 'S line exterior', body: 'Sharper bumpers, honeycomb grille and sport suspension.' },
        { title: 'Virtual cockpit plus', body: '12.3-inch driver display with a full-screen map.' },
      ],
    },
    powertrain: 'front',
    cylinders: 4,
    model: '/models/a5-sportback.glb',
    source: { uid: 'aa9b8d495d324fa1adfe6eab519e21a9', title: 'Audi A5 Sportback S Line - 2021', author: 'Unn Interativa' },
    match: {
      paint: /Ibis_White/,
      glass: /_Windows$/,
      wheel: /(Tires|Rims1|Rims2|BrakeRotors|Calipers)/,
      caliper: /Calipers/,
      tire: /Tires/,
    },
    dims: { width: 1.84, cabinWidth: 1.42, wheelRadius: 0.34, frontAxle: 1.46, rearAxle: -1.34, belt: 0.95 },
    body: [
      [2.36, 0.2],
      [2.38, 0.42],
      [2.32, 0.66],
      [2.05, 0.78],
      [1.3, 0.87],
      [0.8, 0.93],
      [-0.6, 0.98],
      [-1.7, 1.0],
      [-2.25, 0.98],
      [-2.38, 0.85],
      [-2.38, 0.45],
      [-2.32, 0.2],
    ],
    glass: [
      [0.85, 0.91],
      [0.05, 1.35],
      [-0.6, 1.39],
      [-1.3, 1.3],
      [-2.15, 0.99],
    ],
    parts: {
      body: { title: 'Sportback body', sub: 'Frameless doors · 0.27 Cd' },
      glass: { title: 'Glasshouse', sub: 'Coupé roofline, 5 doors' },
      cabin: { title: 'Cabin', sub: '5 seats · ambient lighting' },
      cockpit: { title: 'Virtual cockpit plus', sub: '12.3″ + 10.1″ MMI touch' },
      seats: { title: 'S line sport seats', sub: 'Rock-grey stitching' },
      wheels: { title: '19″ wheels', sub: '5-arm star design' },
      drive: { title: 'quattro ultra', sub: '7-speed S tronic' },
      energy: { title: '2.0 TFSI', sub: '4 cylinders · mild hybrid' },
    },
  },
  {
    id: 's5-coupe',
    name: 'S5 Coupé',
    line: 'Audi Sport · S',
    tagline: 'Two doors, a turbo V6 and the cleanest shoulder line Audi ever drew.',
    glow: '#c86bff',
    paints: [
      { name: 'Misano Red', hex: '#9b0f1c', finish: 'pearl' },
      { name: 'Turbo Blue', hex: '#2e7fd6', finish: 'solid' },
      { name: 'Daytona Grey', hex: '#4a4d52', finish: 'pearl' },
      { name: 'Glacier White', hex: '#e8e9ea', finish: 'metallic' },
      { name: 'Matador Red', hex: '#5a0d1e', finish: 'metallic' },
    ],
    trim: '#1a1a1c',
    specs: [
      { k: 'Power', v: '260 kW' },
      { k: '0–100 km/h', v: '4.7 s' },
      { k: 'Engine', v: '3.0 TFSI V6' },
      { k: 'Torque', v: '500 Nm' },
    ],
    details: {
      intro:
        'Two doors, four seats and a 3.0-litre turbo V6 with the turbo set in the vee. The line along the shoulder is drawn in one stroke from headlight to tail.',
      performance: [
        { k: 'Power', v: '260 kW · 354 PS' },
        { k: 'Torque', v: '500 Nm' },
        { k: '0–100 km/h', v: '4.7 s' },
        { k: 'Top speed', v: '250 km/h' },
        { k: 'Engine', v: '3.0 TFSI V6 · twin-scroll turbo' },
        { k: 'Gearbox', v: '8-speed tiptronic' },
        { k: 'Drive', v: 'quattro · sport differential' },
      ],
      dimensions: [
        { k: 'Length', v: '4,692 mm' },
        { k: 'Width', v: '1,846 mm' },
        { k: 'Height', v: '1,368 mm' },
        { k: 'Wheelbase', v: '2,765 mm' },
        { k: 'Kerb weight', v: '≈ 1,615 kg' },
        { k: 'Boot', v: '455 l' },
      ],
      highlights: [
        { title: 'Turbo in the vee', body: 'Short gas paths between exhaust and turbine mean very little lag.' },
        { title: 'Sport differential', body: 'Pushes torque to the outer rear wheel and turns the car into the corner.' },
        { title: 'Pillarless glass', body: 'Lower the windows and the whole side opens with no B-pillar.' },
        { title: 'S sport seats', body: 'Diamond-quilted Nappa with S embossing and pneumatic side bolsters.' },
      ],
    },
    powertrain: 'front',
    cylinders: 6,
    model: '/models/s5-coupe.glb',
    // This model is authored nose towards −z: without the half turn it drives in tail-first.
    yaw: Math.PI,
    source: { uid: '89f94a142d434188a5af2824bb4a50f5', title: '2017 Audi S5', author: 'supercarmodels' },
    match: {
      paint: /^Meshespaint141Mtl$/,
      glass: /^11Mtl$/,
      wheel: /^(Tire1Mtl|Rotor1Mtl|Caliper1Mtl|Meshpart2Mtl)$/,
      caliper: /^Caliper1Mtl$/,
      tire: /^Tire1Mtl$/,
    },
    dims: { width: 1.85, cabinWidth: 1.42, wheelRadius: 0.35, frontAxle: 1.46, rearAxle: -1.32, belt: 0.95 },
    body: [
      [2.33, 0.2],
      [2.35, 0.42],
      [2.29, 0.66],
      [2.0, 0.78],
      [1.2, 0.87],
      [0.7, 0.93],
      [-0.7, 0.98],
      [-1.8, 1.0],
      [-2.2, 0.98],
      [-2.34, 0.85],
      [-2.34, 0.45],
      [-2.28, 0.2],
    ],
    glass: [
      [0.95, 0.97],
      [0.2, 1.34],
      [-0.5, 1.37],
      [-1.2, 1.3],
      [-1.95, 1.03],
    ],
    parts: {
      body: { title: 'Coupé body', sub: 'Aluminium bonnet & wings' },
      glass: { title: 'Pillarless glass', sub: 'Frameless side windows' },
      cabin: { title: 'Cabin', sub: '4 seats · S embossed' },
      cockpit: { title: 'Virtual cockpit', sub: 'S-specific display' },
      seats: { title: 'S sport seats', sub: 'Diamond-quilted Nappa' },
      wheels: { title: '19″ wheels', sub: 'Red S calipers' },
      drive: { title: 'quattro + sport diff', sub: '8-speed tiptronic' },
      energy: { title: '3.0 TFSI V6', sub: 'Twin-scroll turbo · 260 kW' },
    },
  },
];

/** Material targets per finish, eased into the real model's paint. */
export const FINISHES: Record<Finish, { roughness: number; metalness: number; clearcoatRoughness: number; iridescence: number }> = {
  metallic: { roughness: 0.32, metalness: 0.55, clearcoatRoughness: 0.07, iridescence: 0 },
  // A pearl shifts hue at grazing angles: thin-film iridescence under the clearcoat.
  pearl: { roughness: 0.3, metalness: 0.45, clearcoatRoughness: 0.06, iridescence: 0.75 },
  // Matt: the clearcoat is the rough layer, so reflections spread into a satin sheen.
  matt: { roughness: 0.5, metalness: 0.5, clearcoatRoughness: 0.45, iridescence: 0 },
  solid: { roughness: 0.35, metalness: 0.05, clearcoatRoughness: 0.07, iridescence: 0 },
};

/** Accent per explode layer — label dots, leader lines and the legend. */
export const PART_COLORS: Record<PartKey, string> = {
  body: '#e8e9ea',
  glass: '#7cc4ff',
  cabin: '#f5b26b',
  cockpit: '#5ee6ff',
  seats: '#ff8a65',
  wheels: '#c9ced6',
  drive: '#ffd84d',
  energy: '#2bf5b0',
};
