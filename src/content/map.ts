// The first district's map, Donji Kotač (story 2.2; GDD, Level Structure): 19 nodes, the 13
// rooms, the four lairs, the workshop and the foundry gate, and the GDD's roads. Story 2.3
// adds the gates, from the GDD's table: Balance (room 3) opens rooms 4 and 5, the workshop
// (room 6) the workshop, the gear chain (room 7) rooms 8 and 9, the drum (room 12) room 13;
// rooms 7 and 11 wait for both rooms before them; the foundry gate stays sealed. Positions
// are in map units, 1600 × 1000; the placeholder skin draws them in code until the map
// illustration (story 2.12, epic 6) takes its place over the same positions.

import type { Gate, MapSpec } from '@/city/types';

const balance: Gate = { tools: ['balance'] };
const chain: Gate = { tools: ['chain'] };

export const districtMap: MapSpec = {
  nodes: [
    { id: 'r01', kind: 'room', at: { x: 150, y: 830 } },
    { id: 'r02', kind: 'room', at: { x: 380, y: 700 } },
    { id: 'r03', kind: 'room', at: { x: 620, y: 820 } },
    { id: 'r04', kind: 'room', at: { x: 850, y: 680 }, gate: balance, lock: 'weights' },
    { id: 'r05', kind: 'room', at: { x: 380, y: 430 }, gate: balance, lock: 'weights' },
    { id: 'r06', kind: 'room', at: { x: 900, y: 420 } },
    { id: 'r07', kind: 'room', at: { x: 640, y: 320 }, gate: { rooms: ['r05', 'r06'] } },
    { id: 'r08', kind: 'room', at: { x: 840, y: 160 }, gate: chain, lock: 'chain' },
    { id: 'r09', kind: 'room', at: { x: 1060, y: 860 }, gate: chain, lock: 'chain' },
    { id: 'r10', kind: 'room', at: { x: 1120, y: 220 } },
    { id: 'r11', kind: 'room', at: { x: 1240, y: 600 }, gate: { rooms: ['r09', 'r10'] } },
    { id: 'r12', kind: 'room', at: { x: 1400, y: 430 } },
    { id: 'r13', kind: 'room', at: { x: 1300, y: 230 }, gate: { tools: ['drum'] }, lock: 'drum' },
    { id: 'lair-20', kind: 'lair', at: { x: 190, y: 560 } },
    { id: 'lair-30', kind: 'lair', at: { x: 170, y: 290 } },
    { id: 'lair-45', kind: 'lair', at: { x: 560, y: 110 } },
    { id: 'lair-60', kind: 'lair', at: { x: 1470, y: 720 } },
    { id: 'workshop', kind: 'workshop', at: { x: 1160, y: 430 }, gate: { tools: ['workshop'] } },
    {
      id: 'foundry',
      kind: 'gate',
      at: { x: 1060, y: 680 },
      gate: { sealed: true },
      lock: 'plate',
      plate: '5 · x = 40',
    },
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
