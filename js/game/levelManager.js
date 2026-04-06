// Level Manager — controls progression, timer, win/loss condition

const levelManager = {
  // Start a given level (1-indexed)
  startLevel(n) {
    try {
      if (n < 1 || n > MAX_LEVEL) {
        console.warn('levelManager.startLevel: invalid level', n);
        return;
      }

      currentLevel = n;
      const def = LEVEL_DEFINITIONS[n];
      levelHoneyGoal     = def.honeyGoal;
      levelTimeRemaining = def.timeLimit;
      levelActive = true;
      gameOver = false;
      gameWon  = false;

      // Reset bee vitals
      beeHP      = BEE_MAX_HP;
      beeStamina = BEE_MAX_STAMINA;

      // Set hive HP (restore on new level)
      hiveHP = HIVE_MAX_HP + (upgradeState.hiveHP * 50);

      // Reset honey for this level session (keep total for upgrades but track level progress separately)
      honeyInHive  = 0;
      nectarCarried = 0;

      // Recalculate effective stats
      this.recalcStats();

      // Spawn enemies
      if (typeof enemyManager !== 'undefined') {
        enemyManager.spawnLevelEnemies(def);
      }

      // Show level screen
      if (typeof levelScreen !== 'undefined') {
        levelScreen.showLevelStart(n, def);
      }

      // Update HUD
      if (typeof gameHUD !== 'undefined') {
        gameHUD.update();
      }

      console.log(`Level ${n} started: Goal=${def.honeyGoal}, Time=${def.timeLimit}s`);
    } catch(e) {
      console.error('levelManager.startLevel error:', e);
    }
  },

  // Called every frame with delta time in seconds
  tick(dt) {
    if (!levelActive || gameOver || gameWon) return;

    // Countdown timer
    levelTimeRemaining -= dt;
    if (levelTimeRemaining <= 0) {
      levelTimeRemaining = 0;
      this.triggerLoss('time');
      return;
    }

    // Win condition
    if (honeyInHive >= levelHoneyGoal) {
      this.triggerWin();
      return;
    }

    // Hive destroyed
    if (hiveHP <= 0) {
      hiveHP = 0;
      this.triggerLoss('hive');
      return;
    }

    // Bee dead
    if (beeHP <= 0) {
      beeHP = 0;
      this.triggerLoss('bee');
      return;
    }

    // Queen passive honey
    if (beeRole === 'queen') {
      const role = BEE_ROLES.queen;
      queenPassiveTimer += dt * 1000;
      if (queenPassiveTimer >= role.passiveInterval) {
        queenPassiveTimer = 0;
        honeyInHive += role.passiveHoney;
        if (typeof showMessage === 'function') showMessage('👑 Queen generated +1 honey!', 1200);
        if (typeof gameHUD !== 'undefined') gameHUD.update();
      }
    }

    // Stamina regen when not sprinting
    if (!isSprinting) {
      beeStamina = Math.min(BEE_MAX_STAMINA, beeStamina + STAMINA_REGEN_RATE * dt);
    }

    // Update HUD every frame
    if (typeof gameHUD !== 'undefined') {
      gameHUD.updateTimer(levelTimeRemaining);
      gameHUD.updateVitals();
    }
  },

  triggerWin() {
    levelActive = false;
    gameWon = true;
    if (typeof levelScreen !== 'undefined') levelScreen.showLevelComplete(currentLevel);
    if (typeof soundEffects !== 'undefined') soundEffects.playSound('deposit');
  },

  triggerLoss(reason) {
    levelActive = false;
    gameOver = true;
    if (typeof levelScreen !== 'undefined') levelScreen.showGameOver(reason);
  },

  // Calculate effective speed / capacity from role + upgrades
  recalcStats() {
    const role = BEE_ROLES[beeRole] || BEE_ROLES.worker;
    effectiveSpeed    = MOVE_SPEED * role.speedMult * (1 + upgradeState.speed * 0.1);
    effectiveCapacity = NECTAR_CAPACITY + role.capacityBonus + (upgradeState.capacity * 5);
    if (effectiveCapacity < 1) effectiveCapacity = 1;
  },

  setRole(roleKey) {
    if (!BEE_ROLES[roleKey]) return;
    beeRole = roleKey;
    this.recalcStats();
    // Tint the bee body to match role color
    if (bee) {
      bee.traverse(o => {
        if (o.isMesh && o.material && o.material.color) {
          o.material.color.setHex(BEE_ROLES[roleKey].color);
        }
      });
    }
    if (typeof gameHUD !== 'undefined') gameHUD.update();
  },
};

window.levelManager = levelManager;
