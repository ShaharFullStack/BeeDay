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
const FLOWER_DENSITY_PER_CELL = Math.floor(Math.random() * 5) + 6 ; // Random density between 1 and 3
const MAX_FLOWERS = 500;

// Visual configs - Updated for low-poly style
const FLOWER_PETAL_COLORS = [
  0xff9ff3, // Pink
  0xffb8b8, // Light pink
  0xffeaa7, // Light yellow
  0xdff9fb, // Light blue
  0xf368e0, // Bright pink
  0xff9ff3, // Light pink
  0xffeaa7, // Light yellow
];

// Tree colors for low-poly style
const TREE_TRUNK_COLOR = 0x8B4513; // Brown
const TREE_LEAVES_COLORS = [
  0xff9ff3, // Pink (cherry blossom)
  0xffb8b8, // Light pink
  0x55efc4, // Mint green
  0x00cec9, // Teal
  0x81ecec, // Light cyan
  0x74b9ff, // Light blue
];

// Ground color
const GROUND_COLOR = 0x2e6b48; // Dark green grass

// Sky color
const SKY_COLOR = 0x74b9ff; // Light blue sky

// Device detection
let isMobile = false; // Will be set in detectMobile()

// Low-poly settings
const LOW_POLY_SEGMENTS = 4; // Lower number = more faceted/low-poly look

// Debug options
const SHOW_COLLISION_DEBUG = false; // Set to true to visualize collision areas
window.SHOW_COLLISION_DEBUG = SHOW_COLLISION_DEBUG;