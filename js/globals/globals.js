// Global variables used across all files
let scene, camera, renderer;
let bee, beeWings;
let flowers = [];
let trees = [];
let hive, hiveTree;
let ground;
let grass;

// Game state
let nectarCarried = 0;
let honeyInHive = 0;

// Endless field generation tracking
let populatedCells = new Set();
let lastBeeCellX = null, lastBeeCellZ = null;

// Animation timing
let lastTime = 0;
