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

  // Pinch for height control
  const hammerBody = new Hammer(document.body);
  hammerBody.get("pinch").set({ enable: true });

  hammerBody.on("pinchstart", function (ev) {
    pinchStartDistance = ev.scale;
  });

  hammerBody.on("pinchmove", function (ev) {
    if (pinchStartDistance) {
      const pinchDelta = ev.scale - pinchStartDistance;
      bee.position.y += pinchDelta * 2; // Adjust sensitivity as needed

      // Keep height within bounds
      if (bee.position.y < 0.5) bee.position.y = 0.5;
      if (bee.position.y > 80) bee.position.y = 80;
      pinchStartDistance = ev.scale;
    }
  });
}

// Process all current movement inputs and update the bee position
function updateBeeMovement() {
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
      const currentMoveSpeed = MOVE_SPEED * 0.8; // Slightly slower on mobile for better control
      
      // Forward/backward
      bee.translateZ(-rightJoystick.moveY * currentMoveSpeed);
      
      // Left/right
      bee.translateX(rightJoystick.moveX * currentMoveSpeed);
    }
  } else {
    // Handle desktop controls
    if (!isPointerLocked) return;
    
    const currentMoveSpeed = keysPressed["shift"]
      ? MOVE_SPEED * 1.8
      : MOVE_SPEED;
      
    if (keysPressed["w"]) {
      bee.translateZ(-currentMoveSpeed);
    }
    if (keysPressed["s"]) {
      bee.translateZ(currentMoveSpeed);
    }
    if (keysPressed["a"]) {
      bee.translateX(-currentMoveSpeed * 0.8);
    }
    if (keysPressed["d"]) {
      bee.translateX(currentMoveSpeed * 0.8);
    }

    if (keysPressed["r"]) {
      bee.position.y += currentMoveSpeed;
    }
    if (keysPressed["f"]) {
      bee.position.y -= currentMoveSpeed;
    }
  }

  // Ensure bee stays within bounds (applies to both mobile and desktop)
  if (bee.position.y < 0.5) bee.position.y = 0.5;
  if (bee.position.y > 80) bee.position.y = 80;

  // Animate bee wings
  const flapSpeed = 0.03;
  beeWings.children[0].rotation.x = Math.sin(Date.now() * flapSpeed) * 0.6;
  beeWings.children[1].rotation.x = Math.sin(Date.now() * flapSpeed) * 0.6;

  // World boundaries (relative to the large ground plane)
  const worldBoundary = ground.geometry.parameters.width / 2 - 10; // Keep bee within ground
  if (bee.position.x > worldBoundary) bee.position.x = worldBoundary;
  if (bee.position.x < -worldBoundary) bee.position.x = -worldBoundary;
  if (bee.position.z > worldBoundary) bee.position.z = worldBoundary;
  if (bee.position.z < -worldBoundary) bee.position.z = -worldBoundary;
}