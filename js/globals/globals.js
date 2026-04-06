// Global variables used across all files
let scene, camera, renderer;
let bee, beeWings;
let flowers = [];
let trees = [];
let hive, hiveTree;
let ground;
let grass;

// Game state — nectar / honey
let nectarCarried = 0;
let honeyInHive   = 0;

// Endless field generation tracking
let populatedCells = new Set();
let lastBeeCellX = null, lastBeeCellZ = null;

// Animation timing
let lastTime = 0;

// ============================================================
// ===  NEW: Gamification Globals  ============================
// ============================================================

// Bee vitals
let beeHP      = BEE_MAX_HP;
let beeStamina = BEE_MAX_STAMINA;
let isSprinting = false;

// Role
let beeRole = 'worker'; // default

// Effective stats (calculated from role + upgrades)
let effectiveSpeed    = MOVE_SPEED;
let effectiveCapacity = NECTAR_CAPACITY;

// Hive vitals
let hiveHP = HIVE_MAX_HP;

// Level / progression
let currentLevel = 1;
let levelTimeRemaining = 0; // seconds, counting down
let levelHoneyGoal = 0;
let levelActive = false;    // true while a level is running

// Enemies array — holds live enemy objects
let enemies = [];

// NPC bees (visual only for now, from hive upgrade)
let npcBees = [];

// Queen bee (visual entity, hovers near hive)
let queenBee = null;

// Upgrade state
const upgradeState = {
  capacity: 0,
  speed:    0,
  hiveHP:   0,
  defense:  0,
};

// Passive honey timer (queen role)
let queenPassiveTimer = 0;

// Last sting time (guard role)
let lastStingTime = 0;

// Game over / won flags
let gameOver = false;
let gameWon  = false;
