// Control handling for both desktop and mobile

// Globals for controls
const keysPressed = {};
let isPointerLocked = false;
let hasTilted = false;
let deviceOrientationPermissionRequested = false;

// Mobile-specific joystick variables
const leftJoystick = {
  active: false,
  startX: 0,
  startY: 0,
  moveX: 0,
  moveY: 0,
};
const rightJoystick = {
  active: false,
  startX: 0,
  startY: 0,
  moveX: 0,
  moveY: 0,
};
let pinchStartDistance = 0;
let currentHeight = 5; // Starting height

// Direction and movement vectors (for smoother movement)
let moveDirection;
let moveVelocity;

// Initialize vectors when setting up event listeners (when THREE is available)
function initVectors() {
  if (typeof THREE === 'undefined') {
    console.error("THREE is not defined in initVectors!");
    if (window.threeLoader && typeof window.threeLoader.waitForThree === 'function') {
      window.threeLoader.waitForThree(() => {
        console.log("THREE is now available for vector initialization");
        moveDirection = new THREE.Vector3();
        moveVelocity = new THREE.Vector3();
      });
    }
    return;
  }
  
  console.log("Initializing vectors with THREE:", typeof THREE);
  moveDirection = new THREE.Vector3();
  moveVelocity = new THREE.Vector3();
}

// Set up all event listeners
function setupEventListeners() {
  // Initialize vectors now that THREE is available
  initVectors();
  
  // Desktop controls
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  window.addEventListener("resize", onWindowResize, false);
  document.addEventListener("mousemove", onMouseMove, false);
  document.addEventListener("mousedown", onMouseDownAction, false);
  document.addEventListener("wheel", onMouseWheel, { passive: false });

  if (!isMobile) {
    document.body.addEventListener("click", () => {
      if (!isPointerLocked) {
        document.body.requestPointerLock =
          document.body.requestPointerLock ||
          document.body.mozRequestPointerLock ||
          document.body.webkitRequestPointerLock;
        document.body.requestPointerLock();
      }
    });
    document.addEventListener(
      "pointerlockchange",
      handlePointerLockChange,
      false
    );
    document.addEventListener(
      "mozpointerlockchange",
      handlePointerLockChange,
      false
    );
    document.addEventListener(
      "webkitpointerlockchange",
      handlePointerLockChange,
      false
    );
  } else {
    // Mobile controls
    setupMobileControls();
  }
}

// Desktop control handlers
function onKeyDown(event) {
  keysPressed[event.key.toLowerCase()] = true;
  if (event.key === " " && isPointerLocked) {
    event.preventDefault();
    handleAction();
  }
}

function onKeyUp(event) {
  keysPressed[event.key.toLowerCase()] = false;
}

function onMouseMove(event) {
  if (!isPointerLocked) return;
  const movementX =
    event.movementX || event.mozMovementX || event.webkitMovementX || 0;
  const movementY =
    event.movementY || event.mozMovementY || event.webkitMovementY || 0;
  bee.rotation.y -= movementX * MOUSE_SENSITIVITY;
  camera.rotation.x -= movementY * MOUSE_SENSITIVITY;
  camera.rotation.x = Math.max(
    -Math.PI / 2,
    Math.min(Math.PI / 2, camera.rotation.x)
  );
}

function onMouseDownAction(event) {
  if (!isPointerLocked) return;
  if (event.button === 0) {
    handleAction();
  }
}

function onMouseWheel(event) {
  if (!isPointerLocked) return;
  event.preventDefault();
  const delta = event.deltaY > 0 ? -1 : 1;
  bee.position.y += delta * MOUSE_WHEEL_SENSITIVITY * 10;
  if (bee.position.y < 0.5) bee.position.y = 0.5; // Adjusted min height
  if (bee.position.y > 80) bee.position.y = 80; // Adjusted max height
}

// Mobile controls setup
function setupMobileControls() {
  try {
    // Setup joysticks
    const leftJoystickElement = document.getElementById("joystick-left");
    const rightJoystickElement = document.getElementById("joystick-right");
    const actionButton = document.getElementById("action-button");
    const heightUpButton = document.getElementById("height-up");
    const heightDownButton = document.getElementById("height-down");

    // Left joystick (look)
    const leftJoystickKnob = leftJoystickElement.querySelector(".joystick-knob");
    const hammerLeft = new Hammer(leftJoystickElement);
    hammerLeft.get("pan").set({ direction: Hammer.DIRECTION_ALL });

    hammerLeft.on("panstart", function (ev) {
      leftJoystick.active = true;
      leftJoystick.startX = ev.center.x;
      leftJoystick.startY = ev.center.y;
    });

    hammerLeft.on("panmove", function (ev) {
      if (leftJoystick.active) {
        // Calculate joystick movement (limited to joystick radius)
        const deltaX = ev.center.x - leftJoystick.startX;
        const deltaY = ev.center.y - leftJoystick.startY;
        const distance = Math.min(
          50,
          Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        );
        const angle = Math.atan2(deltaY, deltaX);

        // Update joystick position
        const knobX = Math.cos(angle) * distance;
        const knobY = Math.sin(angle) * distance;
        leftJoystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

        // Update joystick values (normalized -1 to 1)
        leftJoystick.moveX = knobX / 50;
        leftJoystick.moveY = knobY / 50;
      }
    });

    hammerLeft.on("panend pancancel", function () {
      leftJoystick.active = false;
      leftJoystick.moveX = 0;
      leftJoystick.moveY = 0;
      leftJoystickKnob.style.transform = "translate(0px, 0px)";
    });

    // Right joystick (movement)
    const rightJoystickKnob = rightJoystickElement.querySelector(".joystick-knob");
    const hammerRight = new Hammer(rightJoystickElement);
    hammerRight.get("pan").set({ direction: Hammer.DIRECTION_ALL });

    hammerRight.on("panstart", function (ev) {
      rightJoystick.active = true;
      rightJoystick.startX = ev.center.x;
      rightJoystick.startY = ev.center.y;
    });

    hammerRight.on("panmove", function (ev) {
      if (rightJoystick.active) {
        const deltaX = ev.center.x - rightJoystick.startX;
        const deltaY = ev.center.y - rightJoystick.startY;
        const distance = Math.min(
          50,
          Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        );
        const angle = Math.atan2(deltaY, deltaX);

        const knobX = Math.cos(angle) * distance;
        const knobY = Math.sin(angle) * distance;
        rightJoystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

        rightJoystick.moveX = knobX / 50;
        rightJoystick.moveY = knobY / 50;
      }
    });

    hammerRight.on("panend pancancel", function () {
      rightJoystick.active = false;
      rightJoystick.moveX = 0;
      rightJoystick.moveY = 0;
      rightJoystickKnob.style.transform = "translate(0px, 0px)";
    });

    // Action button - Collect/Deposit
    actionButton.addEventListener("touchstart", function (event) {
      event.preventDefault();
      handleAction();
    });    // Height control buttons
    let heightInterval = null;
    const heightStep = 0.5; // Smaller steps for smoother movement
    
    // Helper function to show height change feedback
    function showHeightFeedback(direction) {
      const message = direction === 'up' ? "Flying higher" : "Flying lower";
      showMessage(message, 500);
    }
    
    heightUpButton.addEventListener("touchstart", function(event) {
      event.preventDefault();
      if (bee && bee.position) {
        bee.position.y += heightStep;
        if (bee.position.y > 80) bee.position.y = 80;
        
        // Visual feedback
        heightUpButton.style.backgroundColor = "rgba(116, 185, 255, 0.9)";
        showHeightFeedback('up');
        
        // Set up interval for continuous movement while pressed
        clearInterval(heightInterval);
        heightInterval = setInterval(() => {
          if (bee && bee.position) {
            bee.position.y += heightStep;
            if (bee.position.y > 80) bee.position.y = 80;
          }
        }, 100);
      }
    });
    
    heightUpButton.addEventListener("touchend", function() {
      clearInterval(heightInterval);
      heightUpButton.style.backgroundColor = "rgba(116, 185, 255, 0.8)";
    });
    
    heightDownButton.addEventListener("touchstart", function(event) {
      event.preventDefault();
      if (bee && bee.position) {
        bee.position.y -= heightStep;
        if (bee.position.y < 0.5) bee.position.y = 0.5;
        
        // Visual feedback
        heightDownButton.style.backgroundColor = "rgba(116, 185, 255, 0.9)";
        showHeightFeedback('down');
        
        // Set up interval for continuous movement while pressed
        clearInterval(heightInterval);
        heightInterval = setInterval(() => {
          if (bee && bee.position) {
            bee.position.y -= heightStep;
            if (bee.position.y < 0.5) bee.position.y = 0.5;
          }
        }, 100);
      }
    });
    
    heightDownButton.addEventListener("touchend", function() {
      clearInterval(heightInterval);
      heightDownButton.style.backgroundColor = "rgba(116, 185, 255, 0.8)";
    });
    
    // Also handle touchcancel event to clear interval
    heightUpButton.addEventListener("touchcancel", function() {
      clearInterval(heightInterval);
    });
    
    heightDownButton.addEventListener("touchcancel", function() {
      clearInterval(heightInterval);
    });

  } catch (error) {
    console.error("Error setting up mobile controls:", error);
    const errorMsg = document.getElementById("error-message");
    if (errorMsg) {
      errorMsg.textContent = "Mobile controls error: " + error.message;
      errorMsg.style.display = "block";
    }
  }
}

// Process all current movement inputs and update the bee position
function updateBeeMovement() {
  try {
    // Ensure moveDirection and moveVelocity are initialized
    if (!moveDirection || !moveVelocity) {
      console.log("Movement vectors not initialized yet, initializing now...");
      initVectors();
      return; // Skip this frame
    }
    
    // First calculate direction vector
    moveDirection.set(0, 0, 0);
    
    if (isMobile) {
      // Handle mobile controls
      if (leftJoystick.active) {
        // Look around with left joystick
        if (bee && bee.rotation) {
          bee.rotation.y -= leftJoystick.moveX * 0.05;
        }
        if (camera && camera.rotation) {
          camera.rotation.x -= leftJoystick.moveY * 0.05;
          camera.rotation.x = Math.max(
            -Math.PI / 2,
            Math.min(Math.PI / 2, camera.rotation.x)
          );
        }
      }

      if (rightJoystick.active) {
        // Move with right joystick
        // Use direction vector for movement
        moveDirection.z = -rightJoystick.moveY;
        moveDirection.x = rightJoystick.moveX;
      }
    } else {
      // Handle desktop controls
      if (!isPointerLocked) return;
      
      if (keysPressed["w"]) moveDirection.z = -1;
      if (keysPressed["s"]) moveDirection.z = 1;
      if (keysPressed["a"]) moveDirection.x = -1;
      if (keysPressed["d"]) moveDirection.x = 1;
      if (keysPressed["r"] && bee && bee.position) bee.position.y += MOVE_SPEED * (keysPressed["shift"] ? 1.8 : 1);
      if (keysPressed["f"] && bee && bee.position) bee.position.y -= MOVE_SPEED * (keysPressed["shift"] ? 1.8 : 1);
    }
    
    // Apply movement if there is any direction
    if (moveDirection.length() > 0 && bee) {
      // Normalize movement direction
      moveDirection.normalize();
      
      // Add a multiplier for diagonal movement
      const currentSpeed = MOVE_SPEED * (keysPressed["shift"] ? 1.8 : 1);
      
      // Set bee's local direction and apply speed
      moveVelocity.copy(moveDirection).multiplyScalar(currentSpeed);
      
      // Save current position before movement
      const prevPosition = bee.position.clone();
      
      // Apply movement relative to bee's rotation
      bee.translateZ(moveVelocity.z);
      bee.translateX(moveVelocity.x * 0.8); // Slightly slower sideways movement
      
      // Check collision with trees after movement
      if (trees && trees.length > 0) {
        let collision = false;
        let collisionTree = null;
        
        for (const tree of trees) {
          if (tree && tree.userData && tree.userData.isTree) {
            const treePos = tree.position;
            const treeRadius = tree.userData.radius || 2.0;
            
            // Calculate horizontal distance between bee and tree
            const dx = bee.position.x - treePos.x;
            const dz = bee.position.z - treePos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Check if bee is colliding with this tree
            if (distance < treeRadius) {
              collision = true;
              collisionTree = tree;
              break;
            }
          }
        }
        
        // If collision detected
        if (collision && collisionTree) {
          // Restore previous position with a small bounce back
          bee.position.copy(prevPosition);
          
          // Apply a small bounce back effect
          const pushDirection = new THREE.Vector3(
            bee.position.x - collisionTree.position.x,
            0,
            bee.position.z - collisionTree.position.z
          ).normalize();
          
          bee.position.x += pushDirection.x * 0.2;
          bee.position.z += pushDirection.z * 0.2;
          
          // Play collision sound (throttled to avoid too many sounds)
          if (!window.lastTreeCollisionTime || Date.now() - window.lastTreeCollisionTime > 1000) {
            window.lastTreeCollisionTime = Date.now();
            
            if (typeof window.playSound === 'function') {
              window.playSound('treeCollision');
            }
          }
          
          // Show feedback message occasionally (not on every frame)
          if (Math.random() < 0.05) {
            if (typeof showMessage === 'function') {
              // Different message based on tree type
              if (collisionTree.userData.type === 'hiveTree') {
                showMessage("That's your hive tree! Be careful around it.", 1500);
              } else {
                showMessage("Ouch! Careful around the trees!", 1500);
              }
            }
          }
        }
      }
    }

    // Ensure bee stays within bounds (applies to both mobile and desktop)
    if (bee && bee.position) {
      if (bee.position.y < 0.5) bee.position.y = 0.5;
      if (bee.position.y > 80) bee.position.y = 80;
    }

    // Animate bee wings
    const flapSpeed = 0.03;
    if (beeWings && beeWings.children && beeWings.children.length >= 2) {
      beeWings.children[0].rotation.x = Math.sin(Date.now() * flapSpeed) * 5;
      beeWings.children[1].rotation.x = Math.sin(Date.now() * flapSpeed) * 5;
    }

    // World boundaries (relative to the large ground plane)
    if (ground && ground.geometry && bee && bee.position) {
      const worldBoundary = ground.geometry.parameters.width / 2 - 10; // Keep bee within ground
      if (bee.position.x > worldBoundary) bee.position.x = worldBoundary;
      if (bee.position.x < -worldBoundary) bee.position.x = -worldBoundary;
      if (bee.position.z > worldBoundary) bee.position.z = worldBoundary;
      if (bee.position.z < -worldBoundary) bee.position.z = -worldBoundary;
    }
  } catch (error) {
    console.error("Error in updateBeeMovement:", error);
    const errorMsg = document.getElementById("error-message");
    if (errorMsg) {
      errorMsg.textContent = "Movement error: " + error.message;
      errorMsg.style.display = "block";
    }
  }
}