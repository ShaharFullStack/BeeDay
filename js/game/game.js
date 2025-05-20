// Main game initialization and loops

// Initialize the game
function init() {
  try {
    // Check if THREE is available through our threeLoader
    if (typeof THREE === 'undefined') {
      console.error("THREE is not defined in init()! Make sure Three.js is loaded correctly.");
      return;
    }

    console.log("Initializing game with THREE:", typeof THREE);

    // Set up THREE.js scene, camera, and renderer
    scene = new THREE.Scene();
    scene.background = new THREE.Color(SKY_COLOR);
    scene.fog = new THREE.Fog(SKY_COLOR, 100, 400); // Adjusted fog for larger world

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
    bee = createBee();
    createInitialTreesAndHive();
    
    // Expose scene and bee to window for multiplayer access
    window.scene = scene;
    window.bee = bee;

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
    applyDeviceSpecificStyles();    // Show tilt notification on mobile
    if (isMobile) {
      document.getElementById("tilt-notification").style.display = "block";
      requestDeviceOrientationPermission();
    }
  } catch (error) {
    console.error("Error initializing game:", error);
  }
}

// Create initial trees and the hive
function createInitialTreesAndHive() {
    try {
      // Check if createTree function exists
      if (typeof createTree !== 'function') {
        console.error("createTree function is not defined!");
        return;
      }

      // Create several trees around the starting area
      const treeCount = 30;
      const treeRadius = 45; // Spread trees in a circle of this radius

      // Create the special hive tree first
      hiveTree = createTree(2, 1, true); // Place the hive tree at a fixed position

      if (!hiveTree) {
        console.error("Failed to create hive tree!");
        return;
      }

      // Create the hive after the hive tree is created
      if (typeof createHive === 'function') {
        createHive();
      } else {
        console.error("createHive function is not defined!");
      }

      // Create additional trees around the area
      for (let i = 0; i < treeCount; i++) {
        const angle = (i / treeCount) * Math.PI * 2;
        const x = Math.cos(angle) * treeRadius;
        const z = Math.sin(angle) * treeRadius;

        // Skip if too close to the hive tree
        if (hiveTree) {
          const distToHiveTree = Math.sqrt(
            Math.pow(x - hiveTree.position.x, 2) +
            Math.pow(z - hiveTree.position.z, 2)
          );

          if (distToHiveTree > 10) {
            createTree(x, z);
          }
        }
      }

      // Create the grass if function exists
      if (typeof createGrass === 'function') {
        grass = createGrass();
      }

      console.log("Initial trees and hive created");
    } catch (error) {
      console.error("Error creating initial trees and hive:", error);
    }
  }

  // Main animation loop
  function animate() {
    requestAnimationFrame(animate);

    // Update bee movement
    updateBeeMovement();

    // Update flowers
    updateBeeCellAndManageFlowers();
    

    // Render scene
    renderer.render(scene, camera);  }
    // Start the game
  function startGame() {
    console.log("StartGame called, initializing...");
    
    // Update UI to show player name
    if (typeof updateUI === 'function') {
      updateUI();
    }
    
    // Specifically update player names throughout the UI
    updatePlayerNames();

    // Double-check that THREE is available
    if (typeof THREE === 'undefined') {
      console.error("THREE is not defined in startGame! Waiting for it to load...");
      if (window.threeLoader && typeof window.threeLoader.waitForThree === 'function') {
        console.log("Using threeLoader to wait for THREE...");
        window.threeLoader.waitForThree(() => {
          console.log("THREE now available via threeLoader, initializing game...");
          init();
          animate(0); // Start with time = 0
        });
        return;
      } else {
        console.error("ThreeLoader is not available! Trying direct init after delay...");
        // Last resort - try after a short delay
        setTimeout(() => {
          if (typeof THREE !== 'undefined') {
            console.log("THREE available after delay, initializing...");
            init();
            animate(0); // Start with time = 0
          } else {
            console.error("THREE still not available after delay!");
            const errorMsg = document.getElementById("error-message");
            if (errorMsg) {
              errorMsg.textContent = "Failed to load 3D library. Please refresh the page or try a different browser.";
              errorMsg.style.display = "block";
            }
          }
        }, 1000);
        return;
      }
    }

    // If THREE is already available, proceed normally
    console.log("THREE is available (type:", typeof THREE, "), initializing game directly");
    init();    animate(0); // Start with time = 0
  }

  // Add a function to specifically update player names
function updatePlayerNames() {
  // Try all possible methods to update player names
  if (typeof window.updateAllPlayerNames === 'function') {
    window.updateAllPlayerNames();
  } else if (typeof window.updatePlayerName === 'function') {
    window.updatePlayerName();
  } else {
    // Manual fallback
    const playerNameElements = document.querySelectorAll("#player-name");
    const userName = window.gameState?.currentUser?.name || 
                     window.user?.name || 
                     "Player";
    
    playerNameElements.forEach(element => {
      element.textContent = userName;
      console.log("Manual player name update to:", userName);
    });
  }
}

// Expose the function globally
window.updatePlayerNames = updatePlayerNames;

// Initialize when the page loads
document.addEventListener("DOMContentLoaded", function() {
  // Update player names after a short delay to ensure all scripts are loaded
  setTimeout(updatePlayerNames, 1000);
});

// Expose the startGame function globally
window.startGame = startGame;