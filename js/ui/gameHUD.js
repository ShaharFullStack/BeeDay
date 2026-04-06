// Game HUD — manages all in-game UI overlays
// Renders: HP bar, Stamina bar, Hive HP, Level progress, Countdown, Minimap, Role badge

const gameHUD = {
  // Cache DOM refs
  els: {},

  init() {
    this.els = {
      hp:         document.getElementById('hud-hp-fill'),
      hpText:     document.getElementById('hud-hp-text'),
      stamina:    document.getElementById('hud-stamina-fill'),
      staminaText:document.getElementById('hud-stamina-text'),
      hiveHp:     document.getElementById('hud-hivehp-fill'),
      hiveHpText: document.getElementById('hud-hivehp-text'),
      honeyBar:   document.getElementById('hud-honey-fill'),
      honeyText:  document.getElementById('hud-honey-text'),
      honeyGoal:  document.getElementById('hud-honey-goal'),
      timer:      document.getElementById('hud-timer'),
      level:      document.getElementById('hud-level'),
      levelName:  document.getElementById('hud-level-name'),
      roleBadge:  document.getElementById('hud-role-badge'),
      minimap:    document.getElementById('hud-minimap'),
    };
    this.minimapCtx = this.els.minimap ? this.els.minimap.getContext('2d') : null;
    this.update();
  },

  update() {
    this.updateVitals();
    this.updateTimer(levelTimeRemaining);
    this.updateLevelInfo();
    this.updateMinimap();
  },

  updateVitals() {
    const maxHp  = BEE_MAX_HP;
    const maxSt  = BEE_MAX_STAMINA;
    const maxHiveHp = HIVE_MAX_HP + (upgradeState.hiveHP || 0) * 50;

    const hpPct      = Math.max(0, (beeHP / maxHp) * 100);
    const stPct      = Math.max(0, (beeStamina / maxSt) * 100);
    const hivePct    = Math.max(0, (hiveHP / maxHiveHp) * 100);
    const honeyPct   = levelHoneyGoal > 0 ? Math.min(100, (honeyInHive / levelHoneyGoal) * 100) : 0;

    if (this.els.hp) {
      this.els.hp.style.width = `${hpPct}%`;
      this.els.hp.style.background = hpPct > 50 ? '#00b894' : hpPct > 25 ? '#fdcb6e' : '#d63031';
    }
    if (this.els.hpText) this.els.hpText.textContent = `${Math.ceil(beeHP)}/${maxHp}`;

    if (this.els.stamina) {
      this.els.stamina.style.width = `${stPct}%`;
      this.els.stamina.style.background = stPct > 30 ? '#74b9ff' : '#636e72';
    }
    if (this.els.staminaText) this.els.staminaText.textContent = `${Math.ceil(beeStamina)}`;

    if (this.els.hiveHp) {
      this.els.hiveHp.style.width = `${hivePct}%`;
      this.els.hiveHp.style.background = hivePct > 50 ? '#fdcb6e' : hivePct > 25 ? '#e17055' : '#d63031';
    }
    if (this.els.hiveHpText) this.els.hiveHpText.textContent = `${Math.ceil(hiveHP)}/${maxHiveHp}`;

    if (this.els.honeyBar)  this.els.honeyBar.style.width = `${honeyPct}%`;
    if (this.els.honeyText) this.els.honeyText.textContent = `${honeyInHive}`;
    if (this.els.honeyGoal) this.els.honeyGoal.textContent = `/${levelHoneyGoal} 🍯`;

    // Update hive visual tint
    if (typeof hiveManager !== 'undefined') hiveManager.updateHiveVisual();
  },

  updateTimer(seconds) {
    if (!this.els.timer) return;
    const s = Math.ceil(seconds);
    const m = Math.floor(s / 60);
    const ss = s % 60;
    this.els.timer.textContent = `${m}:${ss.toString().padStart(2, '0')}`;
    this.els.timer.style.color = seconds < 30 ? '#ff7675' : seconds < 60 ? '#fdcb6e' : '#dfe6e9';
    if (seconds < 10) {
      this.els.timer.style.animation = 'pulse 0.5s infinite alternate';
    } else {
      this.els.timer.style.animation = '';
    }
  },

  updateLevelInfo() {
    if (this.els.level) this.els.level.textContent = `Level ${currentLevel}`;
    if (this.els.levelName) {
      const def = LEVEL_DEFINITIONS[currentLevel];
      this.els.levelName.textContent = def ? def.name : '';
    }
    const role = BEE_ROLES[beeRole] || BEE_ROLES.worker;
    if (this.els.roleBadge) this.els.roleBadge.textContent = role.icon + ' ' + role.label;
  },

  updateMinimap() {
    const ctx = this.minimapCtx;
    const canvas = this.els.minimap;
    if (!ctx || !canvas || !bee) return;

    const W = canvas.width;
    const H = canvas.height;
    const scale = W / 160; // 160 unit world radius shown

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath(); ctx.arc(W/2, H/2, W/2, 0, Math.PI*2); ctx.fill();

    // Helper: world pos → minimap px
    const toMM = (wx, wz) => ({
      x: W/2 + (wx - bee.position.x) * scale,
      y: H/2 + (wz - bee.position.z) * scale,
    });

    // Hive
    if (hive) {
      const p = toMM(hive.position.x, hive.position.z);
      ctx.fillStyle = '#fdcb6e';
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Flowers (only if scout or close enough)
    const isScout = beeRole === 'scout';
    for (const f of flowers) {
      if (!f || !f.position) continue;
      const dx = f.position.x - bee.position.x;
      const dz = f.position.z - bee.position.z;
      if (!isScout && (Math.abs(dx) > 50 || Math.abs(dz) > 50)) continue;
      const p = toMM(f.position.x, f.position.z);
      ctx.fillStyle = f.userData.hasNectar ? '#a29bfe' : '#636e72';
      ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
    }

    // Enemies
    for (const e of enemies) {
      if (!e || !e.position) continue;
      const p = toMM(e.position.x, e.position.z);
      ctx.fillStyle = e.userData.type === 'bear' ? '#6b3a1f' : '#d63031';
      ctx.beginPath(); ctx.arc(p.x, p.y, e.userData.type === 'bear' ? 5 : 3, 0, Math.PI*2); ctx.fill();
    }

    // Player (center)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(W/2, H/2, 4, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fdcb6e'; ctx.lineWidth = 1.5; ctx.stroke();

    // Border ring
    ctx.strokeStyle = 'rgba(255,215,0,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(W/2, H/2, W/2 - 1, 0, Math.PI*2); ctx.stroke();
  },
};

window.gameHUD = gameHUD;
