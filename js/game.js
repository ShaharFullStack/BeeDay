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
  try {
    // Set up THREE.js scene, camera, and renderer
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x74b9ff); // Sky blue color
    scene.fog = new THREE.Fog(0x74b9ff, 100, 400); // Adjusted fog for larger world

    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    // Create renderer with error handling
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      document.body.appendChild(renderer.domElement);
    } catch (renderError) {
      console.error("Error creating renderer:", renderError);
      showMessage("Error creating 3D renderer. Your device may not support WebGL.", 5000);
      const errorMsg = document.getElementById("error-message");
      if (errorMsg) {
        errorMsg.textContent = "Error creating 3D renderer: " + renderError.message;
        errorMsg.style.display = "block";
      }
      return; // Stop initialization if renderer fails
    }

    // Set up the world, entities, and mechanics
    try {
      setupWorld(scene);
      ground = createGround(scene, 1000); // Create the ground and store reference
      if (!ground) {
        throw new Error("Failed to create ground");
      }
      
      bee = createBee();
      if (!bee) {
        throw new Error("Failed to create bee");
      }
      
      createInitialTreesAndHive();
    } catch (error) {
      console.error("Error setting up world:", error);
      showMessage("Error setting up game world: " + error.message, 5000);
    }

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
    }
    
    console.log("Game initialization complete");
  } catch (initError) {
    console.error("Critical error during game initialization:", initError);
    const errorMsg = document.getElementById("error-message");
    if (errorMsg) {
      errorMsg.textContent = "Game initialization error: " + initError.message;
      errorMsg.style.display = "block";
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

// Create initial trees and hive in the world
function createInitialTreesAndHive() {
  try {
    // Create several trees scattered around
    const treeCount = 8 + Math.floor(Math.random() * 5); // 8-12 trees
    
    // Create trees in a circle around the origin
    const radius = 40; // Distance from center
    
    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2;
      // Add some randomness to the positions
      const treeRadius = radius + (Math.random() * 15 - 7.5);
      const x = Math.sin(angle) * treeRadius;
      const z = Math.cos(angle) * treeRadius;
      
      // Last tree is always the hive tree
      if (i === treeCount - 1) {
        // Create the hive tree
        hiveTree = createTree(x, z, true);
        if (hiveTree) {
          hiveTree.userData.isHiveTree = true;
          console.log("Created hive tree at:", x, z);
        }
      } else {
        createTree(x, z, false);
      }
    }
    
    // Create additional trees randomly throughout the world
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 400 - 200; // -200 to 200
      const z = Math.random() * 400 - 200; // -200 to 200
      
      // Check distance from center to avoid crowding the starting area
      const distFromCenter = Math.sqrt(x*x + z*z);
      if (distFromCenter > 30) {
        createTree(x, z, false);
      }
    }
    
    // Create the beehive on the hive tree
    if (hiveTree) {
      createHive();
    } else {
      console.error("Failed to create hive tree!");
    }
    
    console.log("Created", trees.length, "trees in the world");
  } catch (error) {
    console.error("Error creating trees and hive:", error);
    showMessage("Error creating world: " + error.message, 5000);
  }
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