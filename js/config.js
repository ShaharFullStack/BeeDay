// Config file containing game constants and settings

// Game settings
const NECTAR_CAPACITY = 10;
const HARVEST_RANGE = 0.2;
const DEPOSIT_RANGE = 4.5;

// Movement settings
const MOVE_SPEED = 0.1;
const MOUSE_SENSITIVITY = 0.002;
const MOUSE_WHEEL_SENSITIVITY = 0.01;

// Endless field generation
const CELL_SIZE = 20;
const VIEW_RADIUS_CELLS = 3;
const FLOWER_DENSITY_PER_CELL = 5;
const MAX_FLOWERS = 300;

// Visual configs
const FLOWER_PETAL_COLORS = [
  0xff69b4, 0xff1493, 0xda70d6, 0xba55d3, 0xff8c00, 0xffa500, 0xffff55,
];

// Device detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent
);