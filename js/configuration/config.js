// Config file containing game constants and settings

// Game settings
const NECTAR_CAPACITY = 10;
const HARVEST_RANGE = 0.5;
const DEPOSIT_RANGE = 4.5;

// Movement settings
const MOVE_SPEED = 0.1;
const MOUSE_SENSITIVITY = 0.002;
const MOUSE_WHEEL_SENSITIVITY = 0.01;

// Endless field generation
const CELL_SIZE = 10;
const VIEW_RADIUS_CELLS = 2;
const FLOWER_DENSITY_PER_CELL = Math.floor(Math.random() * 5) + 6;
const MAX_FLOWERS = 500;

// Visual configs - Updated for low-poly style
const FLOWER_PETAL_COLORS = [
  0xff9ff3, 0xffb8b8, 0xffeaa7, 0xdff9fb, 0xf368e0, 0xff9ff3, 0xffeaa7,
];

// Tree colors for low-poly style
const TREE_TRUNK_COLOR = 0x8B4513;
const TREE_LEAVES_COLORS = [
  0xff9ff3, 0xffb8b8, 0x55efc4, 0x00cec9, 0x81ecec, 0x74b9ff,
];

// Ground / Sky
const GROUND_COLOR = 0x2e6b48;
const SKY_COLOR = 0x74b9ff;

// Device detection
let isMobile = false;

// Low-poly settings
const LOW_POLY_SEGMENTS = 4;

// Debug options
const SHOW_COLLISION_DEBUG = false;
window.SHOW_COLLISION_DEBUG = SHOW_COLLISION_DEBUG;

// ============================================================
// ===  NEW: Gamification Constants  ==========================
// ============================================================

// --- Bee Health & Stamina ---
const BEE_MAX_HP      = 100;
const BEE_MAX_STAMINA = 100;
const STAMINA_DRAIN_RATE   = 25;   // per second while sprinting
const STAMINA_REGEN_RATE   = 15;   // per second while not sprinting
const STAMINA_SPRINT_THRESHOLD = 10; // min stamina to start sprinting

// --- Hive ---
const HIVE_MAX_HP = 200;
const HIVE_REGEN_PER_HONEY = 5; // HP restored per honey deposited

// --- Enemies ---
const HORNET_HP     = 40;
const HORNET_SPEED  = 0.12;
const HORNET_DAMAGE = 15;   // damage to bee on contact
const HORNET_RANGE  = 20;   // detection radius
const HORNET_ATTACK_COOLDOWN = 1200; // ms

const BEAR_HP     = 120;
const BEAR_SPEED  = 0.04;
const BEAR_DAMAGE = 20;     // damage to hive per attack
const BEAR_ATTACK_RANGE  = 6;
const BEAR_ATTACK_COOLDOWN = 3000; // ms

const WASP_HP     = 25;
const WASP_SPEED  = 0.08;
const WASP_DAMAGE = 8;
const WASP_RANGE  = 12;
const WASP_ATTACK_COOLDOWN = 1500;

// Guard bee sting
const GUARD_STING_DAMAGE = 30;
const GUARD_STING_RANGE  = 3;
const GUARD_STING_COOLDOWN = 1000; // ms

// --- Bee Roles ---
const BEE_ROLES = {
  worker: {
    label:          'Worker Bee 🐝',
    description:    'Balanced. Normal speed, standard carry capacity.',
    speedMult:      1.0,
    capacityBonus:  0,
    attackEnabled:  false,
    passiveHoney:   0,
    color:          0xfdcb6e,
    icon:           '🐝',
  },
  scout: {
    label:          'Scout Bee 🔍',
    description:    'Fast flyer. +50% speed, reveals flowers on minimap.',
    speedMult:      1.5,
    capacityBonus:  -3,
    attackEnabled:  false,
    passiveHoney:   0,
    color:          0x00cec9,
    icon:           '🔍',
  },
  guard: {
    label:          'Guard Bee ⚔️',
    description:    'Fighter. Can sting enemies (E key), reduced carry.',
    speedMult:      0.9,
    capacityBonus:  -4,
    attackEnabled:  true,
    passiveHoney:   0,
    color:          0xff6b6b,
    icon:           '⚔️',
  },
  queen: {
    label:          'Queen Bee 👑',
    description:    'Leader. Slower, generates +1 honey every 8 seconds passively.',
    speedMult:      0.75,
    capacityBonus:  2,
    attackEnabled:  false,
    passiveHoney:   1,   // honey per tick
    passiveInterval: 8000, // ms between ticks
    color:          0xffd700,
    icon:           '👑',
  },
};

// --- Level Definitions ---
// Each level: { honeyGoal, timeLimit (s), hornets, bears, wasps, speedMult }
const LEVEL_DEFINITIONS = [
  null, // index 0 unused — levels are 1-based
  { honeyGoal: 20,  timeLimit: 120, hornets: 0, bears: 0, wasps: 0, speedMult: 1.0, name: 'Springtime Meadow'   },
  { honeyGoal: 40,  timeLimit: 150, hornets: 2, bears: 0, wasps: 1, speedMult: 1.0, name: 'Summer Garden'       },
  { honeyGoal: 70,  timeLimit: 180, hornets: 3, bears: 1, wasps: 2, speedMult: 1.1, name: 'Autumn Harvest'      },
  { honeyGoal: 110, timeLimit: 200, hornets: 4, bears: 2, wasps: 3, speedMult: 1.2, name: 'Stormy Season'       },
  { honeyGoal: 160, timeLimit: 240, hornets: 6, bears: 3, wasps: 4, speedMult: 1.4, name: 'The Final Swarm'     },
];

const MAX_LEVEL = LEVEL_DEFINITIONS.length - 1; // 5

// --- Upgrades (costs in honey) ---
const UPGRADE_DEFINITIONS = {
  capacity:  { label: '🍯 +5 Carry Capacity',   cost: 15, maxLevel: 3 },
  speed:     { label: '⚡ +10% Speed',           cost: 20, maxLevel: 3 },
  hiveHP:    { label: '🏠 Repair & Fortify Hive', cost: 25, maxLevel: 3 },
  defense:   { label: '🛡️ Guard NPC Bee',         cost: 30, maxLevel: 2 },
};