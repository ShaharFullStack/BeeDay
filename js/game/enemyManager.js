// Enemy Manager — spawning, AI updates, collision detection

const enemyManager = {
  // Spawn all enemies for a level definition
  spawnLevelEnemies(def) {
    // Clear existing enemies
    this.clearAll();

    const spread = 60; // area to spawn enemies in

    // Spawn hornets
    for (let i = 0; i < def.hornets; i++) {
      const angle = (i / Math.max(def.hornets, 1)) * Math.PI * 2;
      const dist  = 20 + Math.random() * spread;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const h = createHornet(x, 4 + Math.random() * 4, z);
      if (h) enemies.push(h);
    }

    // Spawn bears (always on ground, away from hive)
    for (let i = 0; i < def.bears; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 30 + Math.random() * 40;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const b = createBear(x, z);
      if (b) enemies.push(b);
    }

    // Spawn wasps near some flowers randomly
    for (let i = 0; i < def.wasps; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 15 + Math.random() * 35;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const w = createWasp(x, 3 + Math.random() * 2, z);
      if (w) enemies.push(w);
    }

    console.log(`Spawned ${enemies.length} enemies for level ${currentLevel}`);
  },

  // Update all enemies — called each frame
  update(dt) {
    if (!levelActive || gameOver || gameWon) return;
    if (!bee) return;

    const now = Date.now();
    const levelDef = LEVEL_DEFINITIONS[currentLevel] || LEVEL_DEFINITIONS[1];
    const speedScale = levelDef.speedMult || 1;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (!enemy || !enemy.userData) continue;

      // Remove dead enemies
      if (enemy.userData.hp <= 0) {
        scene.remove(enemy);
        enemies.splice(i, 1);
        this.showDeathEffect(enemy.position);
        continue;
      }

      const ud = enemy.userData;

      switch (ud.type) {
        case 'hornet': this._updateHornet(enemy, dt, speedScale, now); break;
        case 'bear':   this._updateBear(enemy, dt, speedScale, now);   break;
        case 'wasp':   this._updateWasp(enemy, dt, speedScale, now);   break;
      }
    }
  },

  _updateHornet(enemy, dt, speedScale, now) {
    const ud = enemy.userData;
    // Wing flap animation
    ud.wingTime += dt * 18;
    if (enemy.wingLeft)  enemy.wingLeft.rotation.y  =  Math.sin(ud.wingTime) * 0.6;
    if (enemy.wingRight) enemy.wingRight.rotation.y = -Math.sin(ud.wingTime) * 0.6;

    if (!bee) return;
    const dist = enemy.position.distanceTo(bee.position);

    if (dist < ud.range) {
      // Chase bee
      const dir = bee.position.clone().sub(enemy.position).normalize();
      enemy.position.addScaledVector(dir, ud.speed * speedScale);
      enemy.lookAt(bee.position);

      // Attack bee on contact
      if (dist < 1.2 && (now - ud.lastAttackTime) > ud.attackCooldown) {
        ud.lastAttackTime = now;
        beeHP = Math.max(0, beeHP - ud.damage);
        if (typeof showMessage === 'function') showMessage(`🐝 Stung by hornet! -${ud.damage} HP`, 1200);
        if (typeof soundEffects !== 'undefined') soundEffects.playSound('collect');
        if (typeof gameHUD !== 'undefined') gameHUD.updateVitals();
      }
    } else {
      // Hover in place with small drift
      enemy.position.y += Math.sin(Date.now() * 0.001 + ud.wingTime) * 0.01;
    }
  },

  _updateBear(enemy, dt, speedScale, now) {
    if (!hive) return;
    const ud = enemy.userData;

    // Walk toward hive
    const dist = enemy.position.distanceTo(hive.position);
    if (dist > ud.range) {
      const dir = hive.position.clone().sub(enemy.position);
      dir.y = 0;
      dir.normalize();
      enemy.position.addScaledVector(dir, ud.speed * speedScale);
      enemy.lookAt(new THREE.Vector3(hive.position.x, enemy.position.y, hive.position.z));

      // Walk bobbing
      ud.walkPhase += dt * 4;
      enemy.position.y = 0.6 + Math.abs(Math.sin(ud.walkPhase)) * 0.15;
    }

    // Attack hive
    if (dist < ud.range + 2 && (now - ud.lastAttackTime) > ud.attackCooldown) {
      ud.lastAttackTime = now;
      hiveHP = Math.max(0, hiveHP - ud.damage);
      if (typeof showMessage === 'function') showMessage(`🐻 Bear attacks the hive! -${ud.damage} HP`, 1800);
      if (typeof gameHUD !== 'undefined') gameHUD.updateVitals();

      // Visual shake of hive
      if (hive) {
        const origX = hive.position.x;
        hive.position.x += 0.3;
        setTimeout(() => { if (hive) hive.position.x = origX; }, 100);
      }
    }
  },

  _updateWasp(enemy, dt, speedScale, now) {
    const ud = enemy.userData;
    // Wing flap
    if (enemy.wingLeft)  enemy.wingLeft.rotation.y  =  Math.sin(Date.now() * 0.012 + ud.hoverPhase) * 0.5;
    if (enemy.wingRight) enemy.wingRight.rotation.y = -Math.sin(Date.now() * 0.012 + ud.hoverPhase) * 0.5;

    // Hover near patrol target (near a flower cluster)
    ud.hoverPhase += dt;
    const target = ud.patrolTarget;
    const dist   = enemy.position.distanceTo(target);

    // Drift slowly toward target
    if (dist > 2) {
      const dir = target.clone().sub(enemy.position).normalize();
      enemy.position.addScaledVector(dir, ud.speed * 0.3 * speedScale);
    }

    // Vertical hover
    enemy.position.y = (ud.patrolTarget.y || 3) + Math.sin(ud.hoverPhase * 0.9) * 0.5;

    // Attack bee if close
    if (!bee) return;
    const beeDist = enemy.position.distanceTo(bee.position);
    if (beeDist < ud.range * 0.4 && (now - ud.lastAttackTime) > ud.attackCooldown) {
      ud.lastAttackTime = now;
      beeHP = Math.max(0, beeHP - ud.damage);
      if (typeof showMessage === 'function') showMessage(`🐝 Wasp sting! -${ud.damage} HP`, 1000);
      if (typeof gameHUD !== 'undefined') gameHUD.updateVitals();
    }
  },

  // Guard's sting attack — called when player presses E
  playerSting() {
    if (beeRole !== 'guard') {
      if (typeof showMessage === 'function') showMessage('Only Guard Bees can sting! Switch role.', 1500);
      return;
    }
    const now = Date.now();
    if ((now - lastStingTime) < GUARD_STING_COOLDOWN) {
      const rem = ((GUARD_STING_COOLDOWN - (now - lastStingTime)) / 1000).toFixed(1);
      if (typeof showMessage === 'function') showMessage(`⚔️ Sting cooling down (${rem}s)`, 800);
      return;
    }
    lastStingTime = now;

    let hit = false;
    for (const enemy of enemies) {
      if (!enemy || !enemy.userData) continue;
      const d = bee.position.distanceTo(enemy.position);
      if (d < GUARD_STING_RANGE) {
        enemy.userData.hp -= GUARD_STING_DAMAGE;
        hit = true;
        if (typeof showMessage === 'function')
          showMessage(`⚔️ Stung ${enemy.userData.type}! -${GUARD_STING_DAMAGE} HP`, 1200);
        break;
      }
    }
    if (!hit && typeof showMessage === 'function') showMessage('⚔️ No enemy in range!', 800);
  },

  // Remove all enemies from scene
  clearAll() {
    for (const e of enemies) {
      if (e) scene.remove(e);
    }
    enemies = [];
  },

  // Simple particle-like puff effect on death
  showDeathEffect(position) {
    try {
      const geo = new THREE.OctahedronGeometry(0.25, 0);
      const mat = new THREE.MeshBasicMaterial({ color: 0xff4400, wireframe: true });
      const puff = new THREE.Mesh(geo, mat);
      puff.position.copy(position);
      scene.add(puff);
      let s = 1.0;
      const expand = setInterval(() => {
        s += 0.15;
        puff.scale.set(s, s, s);
        mat.opacity = Math.max(0, 1 - (s - 1) / 2);
        mat.transparent = true;
        if (s > 3) { clearInterval(expand); scene.remove(puff); }
      }, 30);
    } catch(e) { /* silent */ }
  },
};

window.enemyManager = enemyManager;
