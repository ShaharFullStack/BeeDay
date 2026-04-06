// Level Screen — manages overlay screens: level start, level complete, game over, upgrade screen

const levelScreen = {
  overlay: null,

  _getOrCreate() {
    if (!this.overlay) {
      this.overlay = document.getElementById('level-overlay');
    }
    return this.overlay;
  },

  showLevelStart(n, def) {
    const el = this._getOrCreate();
    if (!el) return;
    el.innerHTML = `
      <div class="ls-card ls-start">
        <div class="ls-level-badge">LEVEL ${n}</div>
        <h2 class="ls-title">${def.name}</h2>
        <div class="ls-divider"></div>
        <div class="ls-goals">
          <div class="ls-goal-item">🍯 Collect <strong>${def.honeyGoal}</strong> honey</div>
          <div class="ls-goal-item">⏱️ Time limit: <strong>${def.timeLimit}s</strong></div>
          ${def.hornets > 0 ? `<div class="ls-goal-item warn">🐝 ${def.hornets} Hornets incoming!</div>` : ''}
          ${def.bears   > 0 ? `<div class="ls-goal-item warn">🐻 ${def.bears} Bears will attack the hive!</div>` : ''}
          ${def.wasps   > 0 ? `<div class="ls-goal-item warn">🐝 ${def.wasps} Wasp swarms near flowers!</div>` : ''}
        </div>
        <button class="ls-btn ls-btn-primary" id="ls-go-btn">🐝 FLY!</button>
      </div>
    `;
    el.style.display = 'flex';
    document.getElementById('ls-go-btn')?.addEventListener('click', () => {
      el.style.display = 'none';
      levelActive = true;
    });
  },

  showLevelComplete(n) {
    const el = this._getOrCreate();
    if (!el) return;
    const isLast = n >= MAX_LEVEL;
    el.innerHTML = `
      <div class="ls-card ls-complete">
        <div class="ls-badge-success">✅ LEVEL ${n} COMPLETE!</div>
        <h2 class="ls-title">${isLast ? '🎉 YOU SAVED THE COLONY!' : 'Great work, bee!'}</h2>
        <div class="ls-stats">
          <div>🍯 Honey: <strong>${honeyInHive}</strong></div>
          <div>💚 HP Left: <strong>${Math.ceil(beeHP)}/${BEE_MAX_HP}</strong></div>
          <div>🏠 Hive HP: <strong>${Math.ceil(hiveHP)}</strong></div>
        </div>
        ${!isLast ? `
        <div class="ls-divider"></div>
        <h3 class="ls-subtitle">⬆️ Spend honey on upgrades:</h3>
        <div class="ls-upgrades" id="ls-upgrades"></div>
        ` : ''}
        <div class="ls-btn-row">
          ${!isLast ? `<button class="ls-btn ls-btn-primary" id="ls-next-btn">➡️ Next Level</button>` : ''}
          <button class="ls-btn ls-btn-secondary" id="ls-restart-btn">🔄 Restart</button>
        </div>
      </div>
    `;
    el.style.display = 'flex';

    if (!isLast) {
      // Build upgrade buttons
      const upgradesEl = document.getElementById('ls-upgrades');
      if (upgradesEl) {
        for (const [key, def] of Object.entries(UPGRADE_DEFINITIONS)) {
          const level  = upgradeState[key] || 0;
          const maxed  = level >= def.maxLevel;
          const cost   = maxed ? 0 : def.cost * (level + 1);
          const canBuy = !maxed && honeyInHive >= cost;
          const btn    = document.createElement('button');
          btn.className = `ls-upgrade-btn ${maxed ? 'maxed' : ''} ${canBuy ? '' : 'disabled'}`;
          btn.innerHTML = `${def.label}<br><small>${maxed ? 'MAXED' : `${cost} 🍯`}</small>`;
          if (!maxed) {
            btn.addEventListener('click', () => {
              if (typeof hiveManager !== 'undefined' && hiveManager.applyUpgrade(key)) {
                levelScreen.showLevelComplete(n); // refresh
              }
            });
          }
          upgradesEl.appendChild(btn);
        }
      }

      document.getElementById('ls-next-btn')?.addEventListener('click', () => {
        el.style.display = 'none';
        if (typeof hiveManager !== 'undefined') hiveManager.clearNPCBees();
        levelManager.startLevel(n + 1);
      });
    }

    document.getElementById('ls-restart-btn')?.addEventListener('click', () => {
      el.style.display = 'none';
      this.resetGame();
    });
  },

  showGameOver(reason) {
    const el = this._getOrCreate();
    if (!el) return;
    const messages = {
      time: '⏰ Time ran out! The flowers have wilted.',
      hive: '🐻 The hive was destroyed by a bear!',
      bee:  '💀 Your bee was defeated by enemies!',
    };
    el.innerHTML = `
      <div class="ls-card ls-gameover">
        <div class="ls-badge-fail">💀 GAME OVER</div>
        <h2 class="ls-title">${messages[reason] || 'The colony has fallen...'}</h2>
        <div class="ls-stats">
          <div>Level reached: <strong>${currentLevel}</strong></div>
          <div>🍯 Honey collected: <strong>${honeyInHive}</strong></div>
        </div>
        <div class="ls-btn-row">
          <button class="ls-btn ls-btn-primary" id="ls-retry-btn">🔄 Try Again</button>
          <button class="ls-btn ls-btn-secondary" id="ls-menu-btn">🏠 Main Menu</button>
        </div>
      </div>
    `;
    el.style.display = 'flex';

    document.getElementById('ls-retry-btn')?.addEventListener('click', () => {
      el.style.display = 'none';
      this.resetGame();
    });

    document.getElementById('ls-menu-btn')?.addEventListener('click', () => {
      el.style.display = 'none';
      if (typeof enemyManager !== 'undefined') enemyManager.clearAll();
      if (typeof hiveManager  !== 'undefined') hiveManager.clearNPCBees();
      document.getElementById('game-container').style.display = 'none';
      document.getElementById('home-page').style.display = 'flex';
    });
  },

  resetGame() {
    // Clear enemies / NPC bees
    if (typeof enemyManager !== 'undefined') enemyManager.clearAll();
    if (typeof hiveManager  !== 'undefined') hiveManager.clearNPCBees();

    // Reset upgrades
    for (const k of Object.keys(upgradeState)) upgradeState[k] = 0;

    // Start from level 1
    levelManager.startLevel(1);
  },
};

window.levelScreen = levelScreen;
