/**
 * @fileoverview Handcrafted Level Data for ShiftCore3D (5 Orbital Sectors)
 */

export const LEVELS = [
  {
    id: 1,
    nameEn: "Sector 1: Orbital Initiation",
    namePt: "Setor 1: Iniciação Orbital",
    width: 24,
    height: 14,
    playerStart: { x: 3, y: 11 },
    portal: { x: 21, y: 2 },
    cores: [
      { id: 'c1', x: 8, y: 11 },
      { id: 'c2', x: 14, y: 7 },
      { id: 'c3', x: 19, y: 2 }
    ],
    blocks: [
      // Outer Room Boundaries
      { x: 0, y: 13, w: 24, h: 1, type: 'solid' }, // Floor
      { x: 0, y: 0, w: 24, h: 1, type: 'solid' },  // Ceiling
      { x: 0, y: 0, w: 1, h: 14, type: 'solid' },  // Left Wall
      { x: 23, y: 0, w: 1, h: 14, type: 'solid' }, // Right Wall

      // Stepping Platforms
      { x: 5, y: 10, w: 4, h: 1, type: 'solid' },
      { x: 11, y: 8, w: 5, h: 1, type: 'solid' },
      { x: 18, y: 4, w: 5, h: 1, type: 'solid' }
    ],
    lasers: []
  },
  {
    id: 2,
    nameEn: "Sector 2: Pulsing Laser Vault",
    namePt: "Setor 2: Câmara de Lasers Pulsantes",
    width: 26,
    height: 15,
    playerStart: { x: 2, y: 12 },
    portal: { x: 23, y: 12 },
    cores: [
      { id: 'c1', x: 7, y: 3 },
      { id: 'c2', x: 13, y: 12 },
      { id: 'c3', x: 19, y: 3 },
      { id: 'c4', x: 13, y: 2 }
    ],
    blocks: [
      // Boundaries
      { x: 0, y: 14, w: 26, h: 1, type: 'solid' },
      { x: 0, y: 0, w: 26, h: 1, type: 'solid' },
      { x: 0, y: 0, w: 1, h: 15, type: 'solid' },
      { x: 25, y: 0, w: 1, h: 15, type: 'solid' },

      // Obstacles
      { x: 6, y: 5, w: 4, h: 1, type: 'solid' },
      { x: 11, y: 9, w: 4, h: 1, type: 'solid' },
      { x: 16, y: 5, w: 4, h: 1, type: 'solid' },

      // Central divider wall requiring ceiling flip
      { x: 12, y: 1, w: 2, h: 5, type: 'solid' }
    ],
    lasers: [
      { x: 9, y1: 1, y2: 13, period: 2.4, offset: 0 },
      { x: 17, y1: 1, y2: 13, period: 2.4, offset: 1.2 }
    ]
  },
  {
    id: 3,
    nameEn: "Sector 3: Tetragonal Maze",
    namePt: "Setor 3: Labirinto Tetragonal",
    width: 28,
    height: 16,
    playerStart: { x: 3, y: 13 },
    portal: { x: 14, y: 8 },
    cores: [
      { id: 'c1', x: 3, y: 3 },
      { id: 'c2', x: 24, y: 3 },
      { id: 'c3', x: 24, y: 13 },
      { id: 'c4', x: 8, y: 8 },
      { id: 'c5', x: 20, y: 8 }
    ],
    blocks: [
      { x: 0, y: 15, w: 28, h: 1, type: 'solid' },
      { x: 0, y: 0, w: 28, h: 1, type: 'solid' },
      { x: 0, y: 0, w: 1, h: 16, type: 'solid' },
      { x: 27, y: 0, w: 1, h: 16, type: 'solid' },

      // Perimeter runner ledges for 4-way gravity
      { x: 1, y: 5, w: 5, h: 1, type: 'solid' },
      { x: 22, y: 5, w: 5, h: 1, type: 'solid' },
      { x: 1, y: 11, w: 5, h: 1, type: 'solid' },
      { x: 22, y: 11, w: 5, h: 1, type: 'solid' },

      // Central Hub
      { x: 11, y: 10, w: 6, h: 1, type: 'solid' },
      { x: 11, y: 6, w: 6, h: 1, type: 'solid' }
    ],
    lasers: [
      { x: 7, y1: 6, y2: 14, period: 3.0, offset: 0.5 },
      { x: 21, y1: 1, y2: 10, period: 3.0, offset: 1.8 }
    ]
  },
  {
    id: 4,
    nameEn: "Sector 4: Gravitational Plasma Core",
    namePt: "Setor 4: Reator de Plasma Gravitacional",
    width: 30,
    height: 16,
    playerStart: { x: 2, y: 13 },
    portal: { x: 27, y: 2 },
    cores: [
      { id: 'c1', x: 8, y: 13 },
      { id: 'c2', x: 15, y: 3 },
      { id: 'c3', x: 22, y: 13 },
      { id: 'c4', x: 25, y: 6 },
      { id: 'c5', x: 14, y: 10 }
    ],
    blocks: [
      { x: 0, y: 15, w: 30, h: 1, type: 'solid' },
      { x: 0, y: 0, w: 30, h: 1, type: 'solid' },
      { x: 0, y: 0, w: 1, h: 16, type: 'solid' },
      { x: 29, y: 0, w: 1, h: 16, type: 'solid' },

      // Plasma Hazard Floors (cause damage on contact)
      { x: 10, y: 14, w: 4, h: 1, type: 'plasma' },
      { x: 18, y: 14, w: 4, h: 1, type: 'plasma' },

      // Floating Islands
      { x: 5, y: 10, w: 4, h: 1, type: 'solid' },
      { x: 13, y: 12, w: 4, h: 1, type: 'solid' },
      { x: 12, y: 5, w: 6, h: 1, type: 'solid' },
      { x: 20, y: 9, w: 4, h: 1, type: 'solid' },
      { x: 24, y: 4, w: 5, h: 1, type: 'solid' }
    ],
    lasers: [
      { x: 11, y1: 1, y2: 11, period: 2.2, offset: 0.2 },
      { x: 19, y1: 5, y2: 14, period: 2.2, offset: 1.1 }
    ]
  },
  {
    id: 5,
    nameEn: "Sector 5: Shift Core Prime",
    namePt: "Setor 5: O Núcleo Central de Shift",
    width: 32,
    height: 18,
    playerStart: { x: 3, y: 15 },
    portal: { x: 28, y: 15 },
    cores: [
      { id: 'c1', x: 6, y: 4 },
      { id: 'c2', x: 16, y: 2 },
      { id: 'c3', x: 26, y: 4 },
      { id: 'c4', x: 11, y: 11 },
      { id: 'c5', x: 21, y: 11 },
      { id: 'c6', x: 16, y: 8 }
    ],
    blocks: [
      { x: 0, y: 17, w: 32, h: 1, type: 'solid' },
      { x: 0, y: 0, w: 32, h: 1, type: 'solid' },
      { x: 0, y: 0, w: 1, h: 18, type: 'solid' },
      { x: 31, y: 0, w: 1, h: 18, type: 'solid' },

      // Plasma spikes on floor and ceiling
      { x: 8, y: 16, w: 6, h: 1, type: 'plasma' },
      { x: 18, y: 16, w: 6, h: 1, type: 'plasma' },
      { x: 12, y: 1, w: 8, h: 1, type: 'plasma' },

      // Geometric stepping blocks
      { x: 4, y: 12, w: 3, h: 1, type: 'solid' },
      { x: 5, y: 6, w: 4, h: 1, type: 'solid' },
      { x: 14, y: 4, w: 5, h: 1, type: 'solid' },
      { x: 24, y: 6, w: 4, h: 1, type: 'solid' },
      { x: 26, y: 12, w: 3, h: 1, type: 'solid' },
      { x: 14, y: 10, w: 5, h: 1, type: 'solid' }
    ],
    lasers: [
      { x: 10, y1: 2, y2: 15, period: 2.8, offset: 0 },
      { x: 16, y1: 4, y2: 16, period: 2.8, offset: 1.4 },
      { x: 22, y1: 2, y2: 15, period: 2.8, offset: 0.7 }
    ]
  }
];

export default LEVELS;
