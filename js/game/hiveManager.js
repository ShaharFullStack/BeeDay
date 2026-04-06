// Hive Manager — hive health, upgrades, NPC bees

const hiveManager = {
  // Apply purchased upgrade
  applyUpgrade(key) {
    const def = UPGRADE_DEFINITIONS[key];
    if (!def) return false;
    if (upgradeState[key] >= def.maxLevel) {
      if (typeof showMessage === 'function') showMessage('Upgrade already maxed!', 1500);
      return false;
    }
    const cost = def.cost * (upgradeState[key] + 1);
    if (honeyInHive < cost) {
      if (typeof showMessage === 'function') showMessage(`Not enough honey! Need ${cost} 🍯`, 1500);
      return false;
    }
    honeyInHive -= cost;
    upgradeState[key]++;
    levelManager.recalcStats();

    switch (key) {
      case 'capacity':
        if (typeof showMessage === 'function') showMessage(`🍯 Carry capacity increased to ${effectiveCapacity}!`, 2000);
        break;
      case 'speed':
        if (typeof showMessage === 'function') showMessage(`⚡ Speed upgraded!`, 2000);
        break;
      case 'hiveHP':
        hiveHP = Math.min(hiveHP + 75, HIVE_MAX_HP + upgradeState.hiveHP * 50);
        if (typeof showMessage === 'function') showMessage(`🏠 Hive repaired and fortified!`, 2000);
        this.updateHiveVisual();
        break;
      case 'defense':
        this.spawnNPCBee();
        if (typeof showMessage === 'function') showMessage(`🛡️ Guard bee added to the hive!`, 2000);
        break;
    }

    if (typeof gameHUD !== 'undefined') gameHUD.update();
    return true;
  },

  // Update hive visual health (darken when damaged)
  updateHiveVisual() {
    if (!hive) return;
    hive.traverse(o => {
      if (o.isMesh && o.material && o.material.color) {
        const healthRatio = hiveHP / (HIVE_MAX_HP + upgradeState.hiveHP * 50);
        // Interpolate from dark (damaged) toward golden
        const r = Math.floor(healthRatio * 0xfd + (1 - healthRatio) * 0x55);
        const g = Math.floor(healthRatio * 0xcb + (1 - healthRatio) * 0x22);
        const b = Math.floor(healthRatio * 0x6e + (1 - healthRatio) * 0x00);
        o.material.color.setRGB(r / 255, g / 255, b / 255);
      }
    });
  },

  // Spawn a small NPC guard bee that patrols around the hive
  spawnNPCBee() {
    if (!scene || !hive) return;
    try {
      const npc = new THREE.Group();
      const bodyGeo = new THREE.OctahedronGeometry(0.2, 0);
      const bodyMat = new THREE.MeshPhongMaterial({ color: 0xfdcb6e, flatShading: true });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      npc.add(body);

      const stripeMat = new THREE.MeshLambertMaterial({ color: 0x2d3436 });
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 4, 12), stripeMat);
      stripe.rotation.x = Math.PI / 2;
      npc.add(stripe);

      const wingMat = new THREE.MeshBasicMaterial({ color: 0xdfe6e9, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
      const ws = new THREE.Shape();
      ws.moveTo(0,0); ws.lineTo(-0.25,0.05); ws.lineTo(-0.2,0.22); ws.lineTo(0,0.08); ws.lineTo(0,0);
      const wg = new THREE.ShapeGeometry(ws);
      const wL = new THREE.Mesh(wg, wingMat); wL.position.set(-0.12, 0.1, 0); npc.add(wL);
      const wR = new THREE.Mesh(wg, wingMat); wR.position.set(0.12, 0.1, 0); wR.rotation.y = Math.PI; npc.add(wR);

      const angle = Math.random() * Math.PI * 2;
      npc.position.set(
        hive.position.x + Math.cos(angle) * 3,
        hive.position.y + 2,
        hive.position.z + Math.sin(angle) * 3
      );
      npc.scale.set(0.6, 0.6, 0.6);
      npc.userData = {
        isNPCBee: true,
        patrolAngle: angle,
        patrolRadius: 2.5 + Math.random() * 1.5,
        patrolSpeed: 0.6 + Math.random() * 0.4,
        wingPhase: Math.random() * Math.PI * 2,
        wL, wR,
      };

      scene.add(npc);
      npcBees.push(npc);
    } catch(e) {
      console.error('spawnNPCBee error:', e);
    }
  },

  // Animate all NPC bees
  updateNPCBees(dt) {
    for (const npc of npcBees) {
      if (!npc || !npc.userData) continue;
      const ud = npc.userData;
      ud.patrolAngle += dt * ud.patrolSpeed;
      ud.wingPhase  += dt * 18;

      if (hive) {
        npc.position.set(
          hive.position.x + Math.cos(ud.patrolAngle) * ud.patrolRadius,
          hive.position.y + 2 + Math.sin(ud.patrolAngle * 1.3) * 0.4,
          hive.position.z + Math.sin(ud.patrolAngle) * ud.patrolRadius
        );
      }

      if (ud.wL) ud.wL.rotation.y =  Math.sin(ud.wingPhase) * 0.55;
      if (ud.wR) ud.wR.rotation.y = -Math.sin(ud.wingPhase) * 0.55;
    }
  },

  // Remove all NPC bees
  clearNPCBees() {
    for (const npc of npcBees) { if (npc) scene.remove(npc); }
    npcBees = [];
  },
};

window.hiveManager = hiveManager;
