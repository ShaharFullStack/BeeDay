// Control handling for both desktop and mobile
// Mobile: raw multi-touch floating joystick system (no Hammer.js for game controls)

// Globals for controls
const keysPressed = {};
let isPointerLocked = false;
let hasTilted = false;
let deviceOrientationPermissionRequested = false;

// ── Floating Joystick State ───────────────────────────────────────
// Left half of screen = LOOK (camera), right half = MOVE
const JOYSTICK_RADIUS  = 60;  // px — max knob travel
const JOYSTICK_DEADZONE = 8;  // px

const leftJoystick = {
  active: false, touchId: null,
  baseX: 0, baseY: 0,   // where the joystick base appeared
  moveX: 0, moveY: 0,   // normalized -1..1
  el: null, knob: null,
};
const rightJoystick = {
  active: false, touchId: null,
  baseX: 0, baseY: 0,
  moveX: 0, moveY: 0,
  el: null, knob: null,
};

// Direction and movement vectors
let moveDirection;
let moveVelocity;

function initVectors() {
  if (typeof THREE === 'undefined') {
    if (window.threeLoader && typeof window.threeLoader.waitForThree === 'function') {
      window.threeLoader.waitForThree(() => {
        moveDirection = new THREE.Vector3();
        moveVelocity  = new THREE.Vector3();
      });
    }
    return;
  }
  moveDirection = new THREE.Vector3();
  moveVelocity  = new THREE.Vector3();
}

// ── Event Setup ──────────────────────────────────────────────────
function setupEventListeners() {
  initVectors();

  // Always listen for keyboard (desktop + keyboards attached to mobile)
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup',   onKeyUp);
  window.addEventListener('resize', onWindowResize, false);
  document.addEventListener('wheel', onMouseWheel, { passive: false });

  if (!isMobile) {
    // Desktop: mouse-move + pointer-lock
    document.addEventListener('mousemove',   onMouseMove,       false);
    document.addEventListener('mousedown',   onMouseDownAction, false);
    document.body.addEventListener('click', () => {
      if (!isPointerLocked) {
        (document.body.requestPointerLock ||
         document.body.mozRequestPointerLock ||
         document.body.webkitRequestPointerLock).call(document.body);
      }
    });
    document.addEventListener('pointerlockchange',       handlePointerLockChange, false);
    document.addEventListener('mozpointerlockchange',    handlePointerLockChange, false);
    document.addEventListener('webkitpointerlockchange', handlePointerLockChange, false);
  } else {
    // Mobile: raw touch events on the full game canvas area
    setupMobileControls();
  }
}

// ── Desktop Handlers ──────────────────────────────────────────────
function onKeyDown(event) {
  keysPressed[event.key.toLowerCase()] = true;
  if (event.key === ' ' && isPointerLocked) {
    event.preventDefault();
    handleAction();
  }
  if (event.key.toLowerCase() === 'e' && isPointerLocked) {
    if (typeof enemyManager !== 'undefined') enemyManager.playerSting();
  }
}
function onKeyUp(event) { keysPressed[event.key.toLowerCase()] = false; }

function onMouseMove(event) {
  if (!isPointerLocked) return;
  const mx = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
  const my = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
  bee.rotation.y -= mx * MOUSE_SENSITIVITY;
  camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2,
    camera.rotation.x - my * MOUSE_SENSITIVITY));
}
function onMouseDownAction(event) {
  if (!isPointerLocked) return;
  if (event.button === 0) handleAction();
}
function onMouseWheel(event) {
  if (!isPointerLocked) return;
  event.preventDefault();
  const delta = event.deltaY > 0 ? -1 : 1;
  bee.position.y = Math.max(0.5, Math.min(80, bee.position.y + delta * MOUSE_WHEEL_SENSITIVITY * 10));
}

// ── Mobile Controls ───────────────────────────────────────────────
function setupMobileControls() {
  try {
    // Cache elements
    leftJoystick.el   = document.getElementById('joystick-left');
    leftJoystick.knob = leftJoystick.el?.querySelector('.joystick-knob');
    rightJoystick.el  = document.getElementById('joystick-right');
    rightJoystick.knob = rightJoystick.el?.querySelector('.joystick-knob');

    const gameEl = document.getElementById('game-container');
    if (!gameEl) return;

    // Prevent default browser gestures on the game area
    gameEl.addEventListener('touchstart',  _onTouchStart,  { passive: false });
    gameEl.addEventListener('touchmove',   _onTouchMove,   { passive: false });
    gameEl.addEventListener('touchend',    _onTouchEnd,    { passive: false });
    gameEl.addEventListener('touchcancel', _onTouchCancel, { passive: false });

    // Action button (collect / deposit)
    const actionBtn = document.getElementById('action-button');
    if (actionBtn) {
      actionBtn.addEventListener('touchstart', e => { e.stopPropagation(); e.preventDefault(); handleAction(); }, { passive: false });
    }

    // Sting button (guard only)
    const stingBtn = document.getElementById('sting-button');
    if (stingBtn) {
      stingBtn.addEventListener('touchstart', e => {
        e.stopPropagation(); e.preventDefault();
        if (typeof enemyManager !== 'undefined') enemyManager.playerSting();
      }, { passive: false });
    }

    // Height buttons — continuous press
    _setupHoldButton('height-up',   () => { if (bee) bee.position.y = Math.min(80,  bee.position.y + 0.8); });
    _setupHoldButton('height-down', () => { if (bee) bee.position.y = Math.max(0.5, bee.position.y - 0.8); });

    // Hide pointer lock notice on mobile
    const pli = document.getElementById('pointer-lock-info');
    if (pli) pli.style.display = 'none';

    console.log('Mobile touch controls ready');
  } catch(e) {
    console.error('setupMobileControls error:', e);
  }
}

// Hold-button helper (fires every ~100ms while held)
function _setupHoldButton(id, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  let iv = null;
  const start = e => { e.preventDefault(); e.stopPropagation(); fn(); iv = setInterval(fn, 100); };
  const stop  = ()  => clearInterval(iv);
  el.addEventListener('touchstart',  start, { passive: false });
  el.addEventListener('touchend',    stop,  { passive: false });
  el.addEventListener('touchcancel', stop,  { passive: false });
}

// ── Raw Multi-Touch ────────────────────────────────────────────────
function _isActionOrHeightEl(el) {
  // Buttons that have their own touch handlers — don't intercept them
  const ids = ['action-button','sting-button','height-up','height-down'];
  if (!el) return false;
  return ids.some(id => el.id === id || el.closest?.('#' + id));
}

function _onTouchStart(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (_isActionOrHeightEl(t.target)) continue;
    const W = window.innerWidth;
    const isLeft = t.clientX < W * 0.5;

    if (isLeft && !leftJoystick.active) {
      // Activate left joystick (look/camera)
      leftJoystick.active  = true;
      leftJoystick.touchId = t.identifier;
      leftJoystick.baseX   = t.clientX;
      leftJoystick.baseY   = t.clientY;
      leftJoystick.moveX   = 0;
      leftJoystick.moveY   = 0;
      _showJoystick(leftJoystick);
    } else if (!isLeft && !rightJoystick.active) {
      // Activate right joystick (movement)
      rightJoystick.active  = true;
      rightJoystick.touchId = t.identifier;
      rightJoystick.baseX   = t.clientX;
      rightJoystick.baseY   = t.clientY;
      rightJoystick.moveX   = 0;
      rightJoystick.moveY   = 0;
      _showJoystick(rightJoystick);
    }
  }
}

function _onTouchMove(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (leftJoystick.active && t.identifier === leftJoystick.touchId) {
      _updateJoystick(leftJoystick, t);
    } else if (rightJoystick.active && t.identifier === rightJoystick.touchId) {
      _updateJoystick(rightJoystick, t);
    }
  }
}

function _onTouchEnd(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (leftJoystick.active  && t.identifier === leftJoystick.touchId)  _releaseJoystick(leftJoystick);
    if (rightJoystick.active && t.identifier === rightJoystick.touchId) _releaseJoystick(rightJoystick);
  }
}
function _onTouchCancel(e) { _onTouchEnd(e); }

// Update joystick deltas and move the DOM knob
function _updateJoystick(js, touch) {
  const dx  = touch.clientX - js.baseX;
  const dy  = touch.clientY - js.baseY;
  const len = Math.sqrt(dx*dx + dy*dy);

  if (len < JOYSTICK_DEADZONE) {
    js.moveX = 0; js.moveY = 0;
    if (js.knob) js.knob.style.transform = 'translate(-50%, -50%)';
    return;
  }

  const clamped = Math.min(len, JOYSTICK_RADIUS);
  const nx = (dx / len) * clamped;
  const ny = (dy / len) * clamped;

  js.moveX = dx / len; // normalized -1..1 (full deflection direction)
  js.moveY = dy / len;

  // Scale so full radius = 1.0
  js.moveX *= clamped / JOYSTICK_RADIUS;
  js.moveY *= clamped / JOYSTICK_RADIUS;

  // Move knob visually
  if (js.knob) {
    js.knob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
  }
}

function _showJoystick(js) {
  if (!js.el) return;
  js.el.style.left   = (js.baseX - 65) + 'px';
  js.el.style.top    = (js.baseY - 65) + 'px';
  js.el.style.display = 'block';
  js.el.style.opacity = '1';
  if (js.knob) js.knob.style.transform = 'translate(-50%, -50%)';
}

function _releaseJoystick(js) {
  js.active  = false;
  js.touchId = null;
  js.moveX   = 0;
  js.moveY   = 0;
  if (js.el)   { js.el.style.display = 'none'; }
  if (js.knob) js.knob.style.transform = 'translate(-50%, -50%)';
}

// ── Movement Update (called every frame) ─────────────────────────
function updateBeeMovement() {
  try {
    if (!moveDirection || !moveVelocity) { initVectors(); return; }

    moveDirection.set(0, 0, 0);

    if (beeHP <= 0) return;

    if (isMobile) {
      // ── Camera look: LEFT joystick ──────────────────────────────
      if (leftJoystick.active && bee && camera) {
        const lookSens = 0.045;
        bee.rotation.y       -= leftJoystick.moveX * lookSens;
        camera.rotation.x     = Math.max(-Math.PI/2, Math.min(Math.PI/2,
          camera.rotation.x - leftJoystick.moveY * lookSens));
      }

      // ── Movement: RIGHT joystick ────────────────────────────────
      if (rightJoystick.active) {
        moveDirection.z = -rightJoystick.moveY;
        moveDirection.x =  rightJoystick.moveX;
      }
    } else {
      // Desktop
      if (!isPointerLocked) return;
      if (keysPressed['w']) moveDirection.z = -1;
      if (keysPressed['s']) moveDirection.z =  1;
      if (keysPressed['a']) moveDirection.x = -1;
      if (keysPressed['d']) moveDirection.x =  1;
      if (keysPressed['r'] && bee) bee.position.y = Math.min(80,  bee.position.y + MOVE_SPEED * (keysPressed['shift'] ? 1.8 : 1));
      if (keysPressed['f'] && bee) bee.position.y = Math.max(0.5, bee.position.y - MOVE_SPEED * (keysPressed['shift'] ? 1.8 : 1));
    }

    // ── Apply movement ──────────────────────────────────────────
    if (moveDirection.length() > 0 && bee) {
      moveDirection.normalize();

      // Sprinting (desktop: Shift; mobile: full joystick deflection)
      let wantSprint;
      if (isMobile) {
        const mag = Math.sqrt(rightJoystick.moveX**2 + rightJoystick.moveY**2);
        wantSprint = mag > 0.85;
      } else {
        wantSprint = !!keysPressed['shift'];
      }
      isSprinting = wantSprint && beeStamina > STAMINA_SPRINT_THRESHOLD;
      if (isSprinting) {
        beeStamina = Math.max(0, beeStamina - STAMINA_DRAIN_RATE / 60);
        if (beeStamina <= 0) isSprinting = false;
      }

      const currentSpeed = (effectiveSpeed || MOVE_SPEED) * (isSprinting ? 1.8 : 1);
      moveVelocity.copy(moveDirection).multiplyScalar(currentSpeed);

      const prevPosition = bee.position.clone();
      bee.translateZ(moveVelocity.z);
      bee.translateX(moveVelocity.x * 0.8);

      // Tree collision
      if (trees && trees.length > 0) {
        let collision = false, collisionTree = null;
        for (const tree of trees) {
          if (tree && tree.userData && tree.userData.isTree) {
            const dx = bee.position.x - tree.position.x;
            const dz = bee.position.z - tree.position.z;
            if (Math.sqrt(dx*dx + dz*dz) < (tree.userData.radius || 2.0)) {
              collision = true; collisionTree = tree; break;
            }
          }
        }
        if (collision && collisionTree) {
          bee.position.copy(prevPosition);
          const push = new THREE.Vector3(
            bee.position.x - collisionTree.position.x, 0,
            bee.position.z - collisionTree.position.z).normalize();
          bee.position.x += push.x * 0.2;
          bee.position.z += push.z * 0.2;
        }
      }
    }

    // Height clamp
    if (bee && bee.position) {
      bee.position.y = Math.max(0.5, Math.min(80, bee.position.y));
    }

    // World boundary
    if (ground && ground.geometry && bee && bee.position) {
      const b = ground.geometry.parameters.width / 2 - 10;
      bee.position.x = Math.max(-b, Math.min(b, bee.position.x));
      bee.position.z = Math.max(-b, Math.min(b, bee.position.z));
    }

    // Wing flap
    const flapSpeed = 0.03;
    if (beeWings && beeWings.children && beeWings.children.length >= 2) {
      beeWings.children[0].rotation.x = Math.sin(Date.now() * flapSpeed) * 5;
      beeWings.children[1].rotation.x = Math.sin(Date.now() * flapSpeed) * 5;
    }
  } catch(e) {
    console.error('Error in updateBeeMovement:', e);
  }
}