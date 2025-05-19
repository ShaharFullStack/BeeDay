// Main game initialization and loops

// Game state variables
let scene, camera, renderer;
let bee, beeWings;
let flowers = [];
let trees = [];
let hive, hiveTree; // The tree carrying the hive
let ground;

// Game state
let nectarCarried = 0;
let honeyInHive = 0;

// Endless field generation tracking
let populatedCells = new Set();
let lastBeeCellX = null, lastBeeCellZ = null;

// Initialize the game
function init() {
  // Set up THREE.js scene, camera, and renderer
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 100, 400); // Adjusted fog for larger world

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  // Set up the world, entities, and mechanics
  setupWorld();
  createBee();
  createInitialTreesAndHive();

  // Initial flower population
  updateBeeCellAndManageFlowers(true); // Force initial population

  // Set up event handlers
  setupEventListeners();
  updateUI();

  // Make sure controls are visible at start
  const controlsInfo = document.getElementById("controls-info");
  controlsInfo.style.opacity = "1";
  controlsInfo.style.display = "block";

  // Apply device-specific styles
  applyDeviceSpecificStyles();

  // Show tilt notification on mobile
  if (isMobile) {
    document.getElementById("tilt-notification").style.display = "block";
    requestDeviceOrientationPermission();
    
    // Additional mobile setup - make sure Hammer.js doesn't interfere with our controls
    if (typeof Hammer !== 'undefined') {
      // Prevent default Hammer behaviors on document body
      const hammerOptions = {
        touchAction: 'none',
        recognizers: {
          pinch: {
            enable: false // Explicitly disable pinch recognition globally
          }
        }
      };
      
      // Apply these options to any Hammer instance attached to the document body
      Hammer.defaults.cssProps.userSelect = 'auto'; // Allow selection where needed
    }
  }
}

// Main animation loop
function animate() {
  requestAnimationFrame(animate);
  updateBeeMovement();
  updateBeeCellAndManageFlowers(); // Manage dynamic content
  renderer.render(scene, camera);
}

// Start the game
function startGame() {
  init();
  animate();

  // For iOS, we need to request device orientation when the user interacts
  if (isMobile) {
    document.addEventListener(
      "touchstart",
      function () {
        if (!deviceOrientationPermissionRequested) {
          requestDeviceOrientationPermission();
        }
      },
      { once: true }
    );
  }
}