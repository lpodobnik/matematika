// The first district's map, Donji Kotač (story 2.2; GDD, Level Structure): 19 nodes, the 13
// rooms, the four lairs, the workshop and the foundry gate, and the GDD's roads. Positions
// are in map units, 1600 × 1000; the placeholder skin draws them in code until the map
// illustration (story 2.12, epic 6) takes its place over the same positions.

import type { MapSpec } from '@/city/types';

export const districtMap: MapSpec = {
  nodes: [
    { id: 'r01', kind: 'room', at: { x: 150, y: 830 } },
    { id: 'r02', kind: 'room', at: { x: 380, y: 700 } },
    { id: 'r03', kind: 'room', at: { x: 620, y: 820 } },
    { id: 'r04', kind: 'room', at: { x: 850, y: 680 } },
    { id: 'r05', kind: 'room', at: { x: 380, y: 430 } },
    { id: 'r06', kind: 'room', at: { x: 900, y: 420 } },
    { id: 'r07', kind: 'room', at: { x: 640, y: 320 } },
    { id: 'r08', kind: 'room', at: { x: 840, y: 160 } },
    { id: 'r09', kind: 'room', at: { x: 1060, y: 860 } },
    { id: 'r10', kind: 'room', at: { x: 1120, y: 220 } },
    { id: 'r11', kind: 'room', at: { x: 1240, y: 600 } },
    { id: 'r12', kind: 'room', at: { x: 1400, y: 430 } },
    { id: 'r13', kind: 'room', at: { x: 1460, y: 180 } },
    { id: 'lair-20', kind: 'lair', at: { x: 190, y: 560 } },
    { id: 'lair-30', kind: 'lair', at: { x: 170, y: 290 } },
    { id: 'lair-45', kind: 'lair', at: { x: 560, y: 110 } },
    { id: 'lair-60', kind: 'lair', at: { x: 1470, y: 720 } },
    { id: 'workshop', kind: 'workshop', at: { x: 1060, y: 430 } },
    { id: 'foundry', kind: 'gate', at: { x: 990, y: 580 } },
  ],
  edges: [
    ['r01', 'r02'],
    ['r02', 'r03'],
    ['r03', 'r04'],
    ['r02', 'r05'],
    ['r04', 'r06'],
    ['r05', 'r07'],
    ['r06', 'r07'],
    ['r07', 'r08'],
    ['r03', 'r09'],
    ['r08', 'r10'],
    ['r09', 'r11'],
    ['r10', 'r11'],
    ['r11', 'r12'],
    ['r12', 'r13'],
    // Off the rooms (GDD: lairs hang off rooms 2, 5, 8 and 12; the workshop and the
    // foundry gate off room 6).
    ['r02', 'lair-20'],
    ['r05', 'lair-30'],
    ['r08', 'lair-45'],
    ['r12', 'lair-60'],
    ['r06', 'workshop'],
    ['r06', 'foundry'],
  ],
};
