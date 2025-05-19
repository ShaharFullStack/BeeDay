// UI management functions

// Update UI elements with current game state
function updateUI() {
  document.getElementById("nectar-carried").textContent = nectarCarried;
  document.getElementById("nectar-capacity").textContent = NECTAR_CAPACITY;
  document.getElementById("honey-in-hive").textContent = honeyInHive;
}

// Handle pointer lock change
function handlePointerLockChange() {
  const pointerLockElement =
    document.pointerLockElement ||
    document.mozPointerLockElement ||
    document.webkitPointerLockElement;
  isPointerLocked = !!pointerLockElement;
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
  let harvested = false;
  if (nectarCarried < NECTAR_CAPACITY) {
    for (const flower of flowers) {
      // Iterate over currently active flowers
      if (flower.userData.hasNectar) {
        const nectarWorldPosition = new THREE.Vector3();
        flower.userData.nectarCenterMesh.getWorldPosition(nectarWorldPosition);
        const distanceToNectar = bee.position.distanceTo(nectarWorldPosition);
        if (distanceToNectar < HARVEST_RANGE) {
          nectarCarried++;
          flower.userData.hasNectar = false;
          flower.userData.petalMaterial.color.set(0x888888);
          flower.userData.nectarCenterMesh.scale.set(0.2, 0.2, 0.2);
          showMessage(
            `Nectar collected! (${nectarCarried}/${NECTAR_CAPACITY})`,
            1500
          );
          harvested = true;
          updateUI();
          break;
        }
      }
    }
  }
  if (!harvested && hive) {
    // Check if hive exists
    const distanceToHive = bee.position.distanceTo(hive.position);
    if (distanceToHive < DEPOSIT_RANGE) {
      if (nectarCarried > 0) {
        honeyInHive += nectarCarried;
        const deposited = nectarCarried;
        nectarCarried = 0;
        showMessage(
          `Deposited ${deposited} nectar! Total honey: ${honeyInHive}`,
          2000
        );
        // Regrow some flowers (chance based)
        flowers.forEach((f) => {
          if (!f.userData.hasNectar && Math.random() < 0.25) {
            // Slightly lower chance to regrow
            f.userData.hasNectar = true;
            f.userData.petalMaterial.color.set(f.userData.originalPetalColorHex);
            f.userData.nectarCenterMesh.scale.copy(
              f.userData.originalNectarScale
            );
          }
        });
        updateUI();
      } else {
        showMessage("No nectar to deposit!", 1500);
      }
    } else if (nectarCarried >= NECTAR_CAPACITY) {
      showMessage("Nectar pouch is full! Return to the hive.", 2000);
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