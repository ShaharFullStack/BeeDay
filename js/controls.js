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
const moveDirection = new THREE.Vector3();
const moveVelocity = new THREE.Vector3();

// Set up all event listeners
function setupEventListeners() {
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
  // Setup joysticks
  const leftJoystickElement = document.getElementById("joystick-left");
  const rightJoystickElement = document.getElementById("joystick-right");
  const actionButton = document.getElementById("action-button");

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
  // Action button
  actionButton.addEventListener("touchstart", function (event) {
    event.preventDefault();
    handleAction();
  });

  // Add height control buttons instead of pinch
  const heightControlsContainer = document.getElementById("height-controls");
  const upButton = document.getElementById("up-button");
  const downButton = document.getElementById("down-button");
  
  if (heightControlsContainer && upButton && downButton) {
    // Make height controls visible
    heightControlsContainer.style.display = "flex";
    
    // Up button for increasing height
    upButton.addEventListener("touchstart", function(event) {
      event.preventDefault();
      const heightInterval = setInterval(() => {
        bee.position.y += 0.5;
        if (bee.position.y > 80) bee.position.y = 80;
      }, 100);
      
      // Clear interval when touch ends
      const clearHeightInterval = () => {
        clearInterval(heightInterval);
        upButton.removeEventListener("touchend", clearHeightInterval);
        upButton.removeEventListener("touchcancel", clearHeightInterval);
      };
      
      upButton.addEventListener("touchend", clearHeightInterval);
      upButton.addEventListener("touchcancel", clearHeightInterval);
    });
    
    // Down button for decreasing height
    downButton.addEventListener("touchstart", function(event) {
      event.preventDefault();
      const heightInterval = setInterval(() => {
        bee.position.y -= 0.5;
        if (bee.position.y < 0.5) bee.position.y = 0.5;
      }, 100);
      
      // Clear interval when touch ends
      const clearHeightInterval = () => {
        clearInterval(heightInterval);
        downButton.removeEventListener("touchend", clearHeightInterval);
        downButton.removeEventListener("touchcancel", clearHeightInterval);
      };
      
      downButton.addEventListener("touchend", clearHeightInterval);
      downButton.addEventListener("touchcancel", clearHeightInterval);
    });
  } else {
    console.warn("Height control buttons not found in the DOM");
  }
  
  // Disable the global pinch gesture that was causing issues
  // hammerBody.get("pinch").set({ enable: true });
  // 
  // hammerBody.on("pinchstart", function (ev) {
  //   pinchStartDistance = ev.scale;
  // });
  // 
  // hammerBody.on("pinchmove", function (ev) {
  //   if (pinchStartDistance) {
  //     const pinchDelta = ev.scale - pinchStartDistance;
  //     bee.position.y += pinchDelta * 2; // Adjust sensitivity as needed
  // 
  //     // Keep height within bounds
  //     if (bee.position.y < 0.5) bee.position.y = 0.5;
  //     if (bee.position.y > 80) bee.position.y = 80;
  //     pinchStartDistance = ev.scale;
  //   }
  // });
}

// Process all current movement inputs and update the bee position
function updateBeeMovement() {
  // First calculate direction vector
  moveDirection.set(0, 0, 0);
  
  if (isMobile) {
    // Handle mobile controls
    if (leftJoystick.active) {
      // Look around with left joystick
      bee.rotation.y -= leftJoystick.moveX * 0.05;
      camera.rotation.x -= leftJoystick.moveY * 0.05;
      camera.rotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, camera.rotation.x)
      );
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
    if (keysPressed["r"]) bee.position.y += MOVE_SPEED * (keysPressed["shift"] ? 1.8 : 1);
    if (keysPressed["f"]) bee.position.y -= MOVE_SPEED * (keysPressed["shift"] ? 1.8 : 1);
  }
  
  // Apply movement if there is any direction
  if (moveDirection.length() > 0) {
    // Normalize movement direction
    moveDirection.normalize();
    
    // Add a multiplier for diagonal movement
    const currentSpeed = MOVE_SPEED * (keysPressed["shift"] ? 1.8 : 1);
    
    // Set bee's local direction and apply speed
    moveVelocity.copy(moveDirection).multiplyScalar(currentSpeed);
    
    // Apply movement relative to bee's rotation
    bee.translateZ(moveVelocity.z);
    bee.translateX(moveVelocity.x * 0.8); // Slightly slower sideways movement
  }

  // Ensure bee stays within bounds (applies to both mobile and desktop)
  if (bee.position.y < 0.5) bee.position.y = 0.5;
  if (bee.position.y > 80) bee.position.y = 80;

  // Animate bee wings
  const flapSpeed = 0.03;
  if (beeWings && beeWings.children && beeWings.children.length >= 2) {
    beeWings.children[0].rotation.x = Math.sin(Date.now() * flapSpeed) * 0.6;
    beeWings.children[1].rotation.x = Math.sin(Date.now() * flapSpeed) * 0.6;
  }

  // World boundaries (relative to the large ground plane)
  if (ground && ground.geometry) {
    const worldBoundary = ground.geometry.parameters.width / 2 - 10; // Keep bee within ground
    if (bee.position.x > worldBoundary) bee.position.x = worldBoundary;
    if (bee.position.x < -worldBoundary) bee.position.x = -worldBoundary;
    if (bee.position.z > worldBoundary) bee.position.z = worldBoundary;
    if (bee.position.z < -worldBoundary) bee.position.z = -worldBoundary;
  }
}