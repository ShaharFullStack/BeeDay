// UI management functions

// Helper function to debug player name information
function logPlayerNameInfo(prefix = "DEBUG") {
  // Get all possible player name sources
  const authUserName = window.user?.name || "undefined";
  const gameStateName = window.gameState?.currentUser?.name || "undefined";
  const isGuest = window.user?.isGuest ? "Yes" : "No";
  
  // Log comprehensive debug info
  console.log(
    `[${prefix}] Player Name Info:\n` +
    `  • Auth: ${authUserName}\n` +
    `  • GameState: ${gameStateName}\n` +
    `  • Guest User: ${isGuest}\n` +
    `  • Current Display: ${document.getElementById("player-name")?.textContent || "unknown"}`
  );
}

// Update UI elements with current game state
function updateUI() {
  const nectarEl   = document.getElementById("nectar-carried");
  const capacityEl = document.getElementById("nectar-capacity");
  const honeyEl    = document.getElementById("honey-in-hive");
  if (nectarEl)   nectarEl.textContent   = nectarCarried;
  if (capacityEl) capacityEl.textContent = effectiveCapacity || NECTAR_CAPACITY;
  if (honeyEl)    honeyEl.textContent    = honeyInHive;

  // Update player status if gameState is available
  updateAllPlayerNames();

  // Refresh gamification HUD
  if (typeof gameHUD !== 'undefined') gameHUD.update();
}

// Function to update all player name displays throughout the UI
function updateAllPlayerNames() {
  const playerNameElements = document.querySelectorAll("#player-name, #home-player-name");
  
  // Log state before updates for debugging
  logPlayerNameInfo("BEFORE UPDATE");
  
  playerNameElements.forEach(playerNameElement => {
    if (window.gameState && window.gameState.currentUser) {
      playerNameElement.textContent = window.gameState.currentUser.name;
      console.log("Updated player name from gameState:", window.gameState.currentUser.name);
    } else if (window.user && window.user.name) {
      // Fallback to use auth user directly if gameState isn't available
      playerNameElement.textContent = window.user.name || "Player";
      console.log("Updated player name from auth user:", window.user.name);
    }
  });
  
  // Log state after updates too
  logPlayerNameInfo("AFTER UPDATE");
  // Also update multiplayer name label if it exists
  if (window.multiplayer && window.multiplayer.isConnected && window.scene) {
    // Find current player in multiplayer list
    const currentPlayer = window.multiplayer.players.find(p => 
      window.gameState && p.id === window.gameState.currentUser.id
    );
    
    if (currentPlayer) {
      // Update player data in the multiplayer system
      currentPlayer.name = window.gameState?.currentUser?.name || window.user?.name || "Player";
      
      // Update leaderboard
      if (typeof window.multiplayer.updateLeaderboard === 'function') {
        window.multiplayer.updateLeaderboard();
      }
    }
  }
}

// Expose the function globally
window.updateAllPlayerNames = updateAllPlayerNames;

// Handle pointer lock change
function handlePointerLockChange() {
  const pointerLockElement =
    document.pointerLockElement ||
    document.mozPointerLockElement ||
    document.webkitPointerLockElement;
  isPointerLocked = !!pointerLockElement;
  const mobileButtons = document.getElementById("mobile-controls");
  if (mobileButtons) mobileButtons.style.display = isPointerLocked ? "none" : "flex";
  document.getElementById("pointer-lock-info").style.display = isPointerLocked
    ? "none"
    : "block";
  if (isPointerLocked) {
    showMessage("Mouse control enabled! You're ready to fly.", 2000);
  } else {
    showMessage(
      "Mouse control disabled. Click on the screen to re-enable.",
      2000
    );
  }
}

// Handle action (collect nectar or deposit honey)
function handleAction() {
  if (beeHP <= 0) return; // can't act when dead
  const cap = (typeof effectiveCapacity !== 'undefined') ? effectiveCapacity : NECTAR_CAPACITY;
  let harvested = false;
  if (nectarCarried < cap) {
    for (const flower of flowers) {
      if (flower.userData.hasNectar) {
        const nectarWorldPosition = new THREE.Vector3();
        flower.userData.nectarCenterMesh.getWorldPosition(nectarWorldPosition);
        const distanceToNectar = bee.position.distanceTo(nectarWorldPosition);
        if (distanceToNectar < HARVEST_RANGE) {
          nectarCarried++;
          flower.userData.hasNectar = false;
          flower.userData.petalMaterial.color.set(0x888888);
          flower.userData.nectarCenterMesh.scale.set(0.2, 0.2, 0.2);
          soundEffects.playSound("collect");
          showMessage(`Nectar collected! (${nectarCarried}/${cap})`, 1500);
          harvested = true;
          updateUI();
          break;
        }
      }
    }
  }
  if (!harvested && hive) {
    // Check if hive exists
    const distanceToHive = bee.position.distanceTo(hive.position);    if (distanceToHive < DEPOSIT_RANGE) {
      if (nectarCarried > 0) {
        honeyInHive += nectarCarried;
        const deposited = nectarCarried;
        nectarCarried = 0;

        // Repair hive slightly on deposit
        const maxHiveHp = HIVE_MAX_HP + (upgradeState.hiveHP || 0) * 50;
        hiveHP = Math.min(hiveHP + HIVE_REGEN_PER_HONEY * deposited, maxHiveHp);

        // Update game state for multiplayer tracking
        if (window.gameState && typeof window.gameState.updateHoney === 'function') {
          window.gameState.updateHoney(deposited);
        }
        soundEffects.playSound("deposit");
        showMessage(`🍯 Deposited ${deposited} nectar! Total: ${honeyInHive}`, 2000);
        // Regrow some flowers
        flowers.forEach((f) => {
          if (!f.userData.hasNectar && Math.random() < 0.25) {
            f.userData.hasNectar = true;
            f.userData.petalMaterial.color.set(f.userData.originalPetalColorHex);
            f.userData.nectarCenterMesh.scale.copy(f.userData.originalNectarScale);
          }
        });
        updateUI();
      } else {
        showMessage("No nectar to deposit!", 1500);
      }
    } else if (nectarCarried >= cap) {
      showMessage(`Nectar pouch full (${cap})! Return to hive.`, 2000);
    } else {
      // Check if any harvestable flowers are nearby if no action was taken
      let foundFlower = false;
      for (const flower of flowers) {
        if (flower.userData.hasNectar) {
          const nectarWorldPosition = new THREE.Vector3();
          flower.userData.nectarCenterMesh.getWorldPosition(
            nectarWorldPosition
          );
          if (
            bee.position.distanceTo(nectarWorldPosition) <
            HARVEST_RANGE + 3
          ) {
            foundFlower = true;
            break;
          }
        }
      }
      if (
        !foundFlower &&
        !harvested &&
        !(distanceToHive < DEPOSIT_RANGE && nectarCarried > 0)
      ) {
        showMessage("Fly closer to a flower with a bright yellow center!", 2000);
      }
    }
  }
}