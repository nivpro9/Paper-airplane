'use strict';
// ═══════════════════════════════════════════════════════
//  PAPER FLIGHT EVOLUTION — complete rewrite with levels
// ═══════════════════════════════════════════════════════

// ── BIOMES (one per 10 levels) ──────────────────────────
const BIOMES = [
  { name:'Sky',    sky:['#3a8fc2','#87CEEB','#c8e9f9'], cloud:'255,255,255', stars:false, rain:false, snow:false, nebula:false },
  { name:'Sunset', sky:['#6a1a00','#c04a20','#f09040'], cloud:'255,170,110', stars:false, rain:false, snow:false, nebula:false },
  { name:'Night',  sky:['#04041e','#0d0d38','#181852'], cloud:'180,180,255', stars:true,  rain:false, snow:false, nebula:false },
  { name:'Storm',  sky:['#0e0e1a','#1a2030','#28303e'], cloud:'110,120,145', stars:false, rain:true,  snow:false, nebula:false },
  { name:'Arctic', sky:['#9cd4ef','#cce8f8','#eef6ff'], cloud:'255,255,255', stars:false, rain:false, snow:true,  nebula:false },
  { name:'Canyon', sky:['#3d1200','#8a3e10','#cc7020'], cloud:'210,160,110', stars:false, rain:false, snow:false, nebula:false },
  { name:'Space',  sky:['#000000','#020012','#06002a'], cloud:'120,80,200',  stars:true,  rain:false, snow:false, nebula:true  },
];
const PILLAR_COLS = [
  ['#3a6e35','#4d9030'], // Sky
  ['#7a3a10','#a05530'], // Sunset
  ['#1a206a','#28308a'], // Night
  ['#283540','#364858'], // Storm
  ['#4890c8','#60a8e0'], // Arctic
  ['#602800','#8a3e14'], // Canyon
  ['#0a083a','#18147a'], // Space
];

// ── 70 LEVELS ────────────────────────────────────────────
function generateLevels() {
  return Array.from({ length: 70 }, (_, idx) => {
    const i = idx + 1, t = idx / 69;
    return {
      id:           i,
      biome:        Math.min(6, Math.floor(idx / 10)),
      goal:         Math.round(250 + Math.pow(t, 0.55) * 3750), // 250 → 4000 m
      speed:        3 + t * 6,                                   // 3 → 9 px/frame
      gapFraction:  0.42 - t * 0.20,                             // 0.42 → 0.22 H
      spawnInterval:Math.max(0.65, 2.0 - t * 1.35),              // 2.0 → 0.65 s
      fanChance:    i < 10 ? 0 : Math.min(0.25, (i - 10) * 0.018),
      birdChance:   i < 20 ? 0 : Math.min(0.25, (i - 20) * 0.015),
    };
  });
}
const LEVELS = generateLevels();

// ── VEHICLES ─────────────────────────────────────────────
const VEHICLES = [
  { id:0, name:'Paper Plane',     emoji:'✉️',  cost:0,     speed:1.0,  control:1.0,  color:'#ffffff', landing:'strip'   },
  { id:1, name:'Upgraded Paper',  emoji:'📄',  cost:150,   speed:1.15, control:1.1,  color:'#e3f2fd', landing:'strip'   },
  { id:2, name:'Drone',           emoji:'🚁',  cost:400,   speed:0.95, control:1.7,  color:'#90caf9', landing:'helipad' },
  { id:3, name:'Light Plane',     emoji:'🛩️', cost:900,   speed:1.3,  control:1.2,  color:'#4fc3f7', landing:'runway'  },
  { id:4, name:'Propeller Plane', emoji:'✈️',  cost:1800,  speed:1.5,  control:1.15, color:'#ffd54f', landing:'runway'  },
  { id:5, name:'Rocket',          emoji:'🚀',  cost:3200,  speed:2.0,  control:0.85, color:'#ff7043', landing:'pad'     },
  { id:6, name:'Small Airliner',  emoji:'🛫',  cost:5000,  speed:1.7,  control:1.0,  color:'#ce93d8', landing:'airport' },
  { id:7, name:'Large Airliner',  emoji:'🛬',  cost:8000,  speed:1.9,  control:0.9,  color:'#b39ddb', landing:'airport' },
  { id:8, name:'Stealth Plane',   emoji:'🌑',  cost:12000, speed:2.3,  control:1.2,  color:'#546e7a', landing:'military'},
  { id:9, name:'B-2 Spirit',      emoji:'🛸',  cost:18000, speed:2.6,  control:1.3,  color:'#37474f', landing:'military'},
];

// ── UPGRADES ─────────────────────────────────────────────
const UPGRADES = [
  { id:'speed',   name:'Engine Boost',   icon:'⚡', desc:'Increases base speed',           maxLevel:5, costs:[80,150,280,500,900]  },
  { id:'control', name:'Better Control', icon:'🎯', desc:'Smoother joystick response',      maxLevel:5, costs:[60,120,220,400,750]  },
  { id:'magnet',  name:'Coin Magnet',    icon:'🧲', desc:'Attract nearby coins',            maxLevel:4, costs:[100,200,400,800]     },
  { id:'shield',  name:'Shield',         icon:'🛡', desc:'Extra hit before crashing',       maxLevel:3, costs:[150,350,700]         },
  { id:'cannon',  name:'Cannon',         icon:'🔫', desc:'Unlocks ammo pickups & shooting', maxLevel:3, costs:[300,600,1200]        },
];

// ── SAVE ─────────────────────────────────────────────────
const Save = {
  KEY: 'pfe_v2',
  defaults: {
    coins: 0, bestLevel: 1, activeVehicle: 0,
    ownedVehicles: [0],
    upgrades: { speed:0, control:0, magnet:0, shield:0, cannon:0 },
    currentLevel: 1, tutorialDone: false,
  },
  data: null,
  fresh() { return JSON.parse(JSON.stringify(this.defaults)); },
  load() {
    try { this.data = JSON.parse(localStorage.getItem(this.KEY)); } catch { this.data = null; }
    if (!this.data) {
      this.data = this.fresh();
      // Migrate old save
      try {
        const old = JSON.parse(localStorage.getItem('pfe_save'));
        if (old) {
          this.data.coins = old.coins || 0;
          this.data.activeVehicle = old.activeVehicle || 0;
          this.data.ownedVehicles = old.ownedVehicles || [0];
          if (old.upgrades) ['speed','control','magnet','shield'].forEach(k => {
            if (old.upgrades[k]) this.data.upgrades[k] = old.upgrades[k];
          });
        }
      } catch {}
    }
    // Safety
    if (!this.data.upgrades) this.data.upgrades = { speed:0,control:0,magnet:0,shield:0,cannon:0 };
    if (this.data.upgrades.cannon === undefined) this.data.upgrades.cannon = 0;
    if (!this.data.ownedVehicles) this.data.ownedVehicles = [0];
    if (!this.data.currentLevel) this.data.currentLevel = 1;
    if (!this.data.bestLevel) this.data.bestLevel = 1;
    if (this.data.tutorialDone === undefined) this.data.tutorialDone = false;
  },
  save() { localStorage.setItem(this.KEY, JSON.stringify(this.data)); },
};

// ── GAME STATE ───────────────────────────────────────────
let canvas, ctx, W, H;
let gameState = 'menu'; // menu | playing | landing | levelcomplete | dead | shop
let player, obstacles, coins, ammoPickups, particles, bullets;
let distance, speed, sessionCoins, ammo;
let frameId, lastTime;
let shieldHits, shootCooldown, shootAutoTimer;
let spawnTimer, coinTimer, ammoTimer;
let clouds = [], stars = [], bgParticles = [];
let currentLevel = 1;
let levelData = LEVELS[0];
let currentBiome = 0;
let biomeBanner = { text: '', timer: 0 };

// Landing state
let landing = null; // null | { runway:{x,y,w,type}, phase:'approach'|'touch'|'done', timer }

// Tutorial hints (drawn on canvas)
let tutHints = []; // [{text, x, y, alpha, timer}]
let tutPhase = 0;  // 0=joystick hint, 1=gap hint, 2=ammo hint, 3=done

// Joystick
const JOY = { baseX:0, baseY:0, knobX:0, knobY:0, dx:0, dy:0, active:false, touchId:-1, baseR:48, knobR:24 };

// ── AMMO CAPACITY ─────────────────────────────────────────
function maxAmmo() { return [0, 4, 7, 10][Math.min(3, Save.data.upgrades.cannon)]; }

// ── PLAYER ───────────────────────────────────────────────
function createPlayer() {
  const v = VEHICLES[Save.data.activeVehicle];
  return { x: W * 0.22, y: H * 0.5, vy: 0, vx: 0, w: 48, h: 32, vehicle: v, trail: [], invincible: 0, alive: true };
}

// ── OBSTACLES ────────────────────────────────────────────
function createPillar() {
  const gap = H * levelData.gapFraction;
  const gapY = H * 0.15 + Math.random() * (H * 0.70);
  return { type:'pillar', x: W + 40, gapY, gap, w: 52, scored: false };
}
function createFan() {
  const side = Math.random() < 0.5 ? 'top' : 'bottom';
  return { type:'fan', x: W + 40, y: side === 'top' ? H * 0.06 : H * 0.86, side, angle: 0, w: 44, h: 44, windForce: (Math.random() < 0.5 ? 1 : -1) * 2.5 };
}
function createBird() {
  const y = H * 0.1 + Math.random() * H * 0.8;
  const dir = Math.random() < 0.5 ? 1 : -1;
  return { type:'bird', x: dir > 0 ? -40 : W + 40, y, vx: dir * (2 + Math.random() * 2), wing: 0, r: 18 };
}

// ── AMMO PICKUP ──────────────────────────────────────────
function createAmmoCrate() {
  return { x: W + 40, y: H * 0.15 + Math.random() * H * 0.70, collected: false, anim: 0 };
}

// ── COIN ─────────────────────────────────────────────────
function spawnCoin() {
  const n = 1 + Math.floor(Math.random() * 3);
  const y = H * 0.12 + Math.random() * H * 0.76;
  for (let i = 0; i < n; i++)
    coins.push({ x: W + 40 + i * 34, y: y + (Math.random() - 0.5) * 30, r: 12, collected: false, anim: Math.random() * Math.PI * 2 });
}

// ── PARTICLES ────────────────────────────────────────────
function spawnParticles(x, y, color, n = 8) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, spd = 2 + Math.random() * 4;
    particles.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 1, color, r: 3 + Math.random() * 4 });
  }
}

// ── SHOOT ────────────────────────────────────────────────
function shoot() {
  if (gameState !== 'playing' || !player?.alive) return;
  const lvl = Save.data.upgrades.cannon || 0;
  if (lvl === 0 || ammo <= 0 || shootCooldown > 0) return;
  ammo--;
  const cooldowns = [0, 0.9, 0.55, 0.4];
  shootCooldown = cooldowns[lvl];
  const bulletVx = speed + 350;
  if (lvl >= 3) {
    bullets.push({ x: player.x + 26, y: player.y - 5, vx: bulletVx, vy: -40, r: 6 });
    bullets.push({ x: player.x + 26, y: player.y + 5, vx: bulletVx, vy:  40, r: 6 });
  } else {
    bullets.push({ x: player.x + 26, y: player.y, vx: bulletVx, vy: 0, r: 6 });
  }
  spawnParticles(player.x + 20, player.y, '#ff9800', 3);
  updateShootBtn();
}

function updateShootBtn() {
  const btn = document.getElementById('shoot-btn');
  if (!btn) return;
  const lvl = Save.data.upgrades.cannon || 0;
  if (lvl > 0 && gameState === 'playing' && !landing) {
    btn.classList.remove('hidden');
    btn.textContent = lvl >= 3 ? '🔥' : '🔫';
    btn.style.opacity = ammo > 0 ? '1' : '0.4';
  } else {
    btn.classList.add('hidden');
  }
}

// ── JOYSTICK ─────────────────────────────────────────────
function updateJoystick(tx, ty) {
  const dx = tx - JOY.baseX, dy = ty - JOY.baseY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxR = JOY.baseR * 0.85;
  if (dist > maxR) {
    JOY.dx = dx / dist; JOY.dy = dy / dist;
    JOY.knobX = JOY.baseX + JOY.dx * maxR;
    JOY.knobY = JOY.baseY + JOY.dy * maxR;
  } else {
    JOY.dx = dx / maxR; JOY.dy = dy / maxR;
    JOY.knobX = tx; JOY.knobY = ty;
  }
}

// ── BACKGROUND STARS / BG PARTICLES ──────────────────────
function initBgEffects(biome) {
  const b = BIOMES[biome];
  stars = [];
  bgParticles = [];
  if (b.stars) {
    for (let i = 0; i < 80; i++)
      stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() < 0.2 ? 2 : 1, phase: Math.random() * Math.PI * 2 });
  }
  if (b.snow) {
    for (let i = 0; i < 60; i++)
      bgParticles.push({ x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 2, speed: 30 + Math.random() * 50, drift: (Math.random() - 0.5) * 20 });
  }
  if (b.rain) {
    for (let i = 0; i < 80; i++)
      bgParticles.push({ x: Math.random() * W, y: Math.random() * H, len: 8 + Math.random() * 12, speed: 200 + Math.random() * 100 });
  }
  clouds = Array.from({ length: 8 }, () => ({
    x: Math.random() * W, y: H * 0.05 + Math.random() * H * 0.4,
    w: 60 + Math.random() * 80, h: 28 + Math.random() * 28,
    spd: 0.3 + Math.random() * 0.5, alpha: 0.5 + Math.random() * 0.4,
  }));
}

// ── INIT GAME ────────────────────────────────────────────
function initGame(levelNum) {
  currentLevel = Math.max(1, Math.min(70, levelNum));
  levelData = LEVELS[currentLevel - 1];
  currentBiome = levelData.biome;

  distance = 0; sessionCoins = 0;
  obstacles = []; coins = []; ammoPickups = []; particles = []; bullets = [];
  spawnTimer = 1.5; coinTimer = 1.0; ammoTimer = 10 + Math.random() * 6;
  shootCooldown = 0; shootAutoTimer = 3;

  const upg = Save.data.upgrades;
  shieldHits = upg.shield;
  speed = levelData.speed * VEHICLES[Save.data.activeVehicle].speed * (1 + upg.speed * 0.12);

  const cap = maxAmmo();
  ammo = cap > 0 ? Math.floor(cap * 0.5) : 0; // start with half ammo

  player = createPlayer();
  landing = null;
  tutHints = [];
  tutPhase = 0;

  JOY.baseX = W * 0.5; JOY.baseY = H - 90;
  JOY.knobX = JOY.baseX; JOY.knobY = JOY.baseY;
  JOY.active = false; JOY.touchId = -1; JOY.dx = 0; JOY.dy = 0;

  initBgEffects(currentBiome);

  // Biome change banner
  if (currentLevel % 10 === 1 && currentLevel > 1) {
    biomeBanner.text = 'ENTERING ' + BIOMES[currentBiome].name.toUpperCase() + ' ZONE';
    biomeBanner.timer = 2.5;
  } else if (currentLevel === 1) {
    biomeBanner.text = '';
    biomeBanner.timer = 0;
  }

  // Tutorial hints (first time on level 1)
  if (!Save.data.tutorialDone && currentLevel === 1) {
    tutHints.push({ text: 'Push joystick UP to fly!', x: W * 0.5, y: H * 0.5 - 60, alpha: 1, timer: 4 });
    tutPhase = 0;
  }

  updateHUD();
  updateShootBtn();
}

// ── UPDATE ───────────────────────────────────────────────
function update(dt) {
  if (!player.alive) return;

  // Landing phase — auto-pilot
  if (landing) { updateLanding(dt); return; }

  // Distance (calibrated: ~10-27 m/s depending on speed level)
  distance += speed * dt * 60 * 0.05;

  // Speed updates slightly in-level
  const upg = Save.data.upgrades;
  const veh = VEHICLES[Save.data.activeVehicle];
  speed = Math.min(levelData.speed * veh.speed * (1 + upg.speed * 0.12) + distance * 0.0002, levelData.speed * 1.4);

  // ── PHYSICS (joystick) ──
  const gravity   = 480;   // px/s² downward
  const uplift    = 720;   // px/s² when pushing up
  const sidePush  = 350;   // px/s² horizontal
  const maxVy     = 300;   // px/s clamp
  const maxVx     = 120;
  const ctrl = veh.control * (1 + upg.control * 0.15);

  if (JOY.active) {
    player.vy += (gravity + JOY.dy * uplift * ctrl) * dt;
    player.vx += JOY.dx * sidePush * ctrl * dt;
  } else {
    player.vy += gravity * dt;
    player.vx *= Math.pow(0.05, dt); // friction
  }
  player.vy = Math.max(-maxVy * ctrl, Math.min(maxVy, player.vy));
  player.vx = Math.max(-maxVx, Math.min(maxVx, player.vx));
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // Clamp to screen
  const xMin = W * 0.05, xMax = W * 0.50;
  player.x = Math.max(xMin, Math.min(xMax, player.x));
  player.y = Math.max(player.h * 0.5, Math.min(H - player.h * 0.5, player.y));
  if (player.y <= player.h * 0.5 || player.y >= H - player.h * 0.5) player.vy = 0;

  // Trail
  player.trail.unshift({ x: player.x, y: player.y });
  if (player.trail.length > 12) player.trail.pop();

  if (player.invincible > 0) player.invincible -= dt;
  if (shootCooldown > 0) shootCooldown -= dt;

  // Auto-fire level 3 cannon
  if (upg.cannon >= 3 && ammo > 0) {
    shootAutoTimer -= dt;
    if (shootAutoTimer <= 0) { shoot(); shootAutoTimer = 2.5; }
  }

  // ── BULLETS ──
  const nextBullets = [];
  for (const b of bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt;
    let hit = false;
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      if (obs.type === 'bird' || obs.type === 'fan') {
        const dx = b.x - obs.x, dy = b.y - obs.y;
        const hr = obs.type === 'bird' ? obs.r + b.r : 22 + b.r;
        if (Math.sqrt(dx * dx + dy * dy) < hr) {
          spawnParticles(obs.x, obs.y, obs.type === 'bird' ? '#8d6e63' : '#78909c', 10);
          obstacles.splice(i, 1);
          hit = true; break;
        }
      }
    }
    if (!hit && b.x < W + 80) nextBullets.push(b);
  }
  bullets = nextBullets;

  // ── SPAWN ──
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    const r = Math.random();
    const fc = levelData.fanChance, bc = levelData.birdChance;
    if (r < 1 - fc - bc) obstacles.push(createPillar());
    else if (r < 1 - bc) obstacles.push(createFan());
    else obstacles.push(createBird());
    spawnTimer = levelData.spawnInterval;
  }

  coinTimer -= dt;
  if (coinTimer <= 0) { spawnCoin(); coinTimer = 0.8 + Math.random() * 0.6; }

  // Ammo crate spawn (only if cannon unlocked)
  if (upg.cannon > 0) {
    ammoTimer -= dt;
    if (ammoTimer <= 0) {
      ammoPickups.push(createAmmoCrate());
      ammoTimer = 12 + Math.random() * 8;
    }
  }

  const magnetRange = 80 + upg.magnet * 50;

  // ── UPDATE OBSTACLES ──
  obstacles = obstacles.filter(obs => {
    if (obs.type === 'pillar') {
      obs.x -= speed;
      if (!obs.scored && obs.x < player.x) {
        obs.scored = true;
        // Tutorial: gap cleared
        if (!Save.data.tutorialDone && tutPhase === 1) {
          tutPhase = 2;
          tutHints.push({ text: 'Collect ammo boxes for your cannon!', x: W * 0.5, y: H * 0.35, alpha: 1, timer: 4 });
        }
      }
      if (player.invincible <= 0) {
        const hw = player.w * 0.38, hh = player.h * 0.38;
        if (player.x + hw > obs.x - obs.w / 2 && player.x - hw < obs.x + obs.w / 2)
          if (player.y - hh < obs.gapY - obs.gap / 2 || player.y + hh > obs.gapY + obs.gap / 2)
            handleHit();
      }
      return obs.x > -obs.w;
    } else if (obs.type === 'fan') {
      obs.x -= speed;
      if (obs.x > 0 && obs.x < W) {
        const dx = player.x - obs.x, dy = player.y - obs.y;
        if (Math.sqrt(dx * dx + dy * dy) < 110) player.vy += obs.windForce * 100 * dt;
      }
      if (player.invincible <= 0) {
        const dx = player.x - obs.x, dy = player.y - obs.y;
        if (Math.sqrt(dx * dx + dy * dy) < 28) handleHit();
      }
      return obs.x > -60;
    } else if (obs.type === 'bird') {
      obs.x += obs.vx;
      if (player.invincible <= 0) {
        const dx = player.x - obs.x, dy = player.y - obs.y;
        if (Math.sqrt(dx * dx + dy * dy) < obs.r + 20) handleHit();
      }
      return obs.x > -50 && obs.x < W + 50;
    }
    return true;
  });

  // ── UPDATE AMMO PICKUPS ──
  ammoPickups = ammoPickups.filter(ac => {
    if (ac.collected) return false;
    ac.x -= speed; ac.anim += dt * 2;
    const dx = player.x - ac.x, dy = player.y - ac.y;
    if (Math.sqrt(dx * dx + dy * dy) < 28) {
      ac.collected = true;
      const cap = maxAmmo();
      const gain = Save.data.upgrades.cannon >= 2 ? 3 : 2;
      ammo = Math.min(cap, ammo + gain);
      spawnParticles(ac.x, ac.y, '#ffcc02', 6);
      updateShootBtn();
      // Tutorial: ammo collected
      if (!Save.data.tutorialDone && tutPhase === 2) {
        tutPhase = 3;
        if (Save.data.upgrades.cannon > 0)
          tutHints.push({ text: 'Tap the 🔫 button to shoot!', x: W * 0.5, y: H * 0.35, alpha: 1, timer: 4 });
        else
          tutHints.push({ text: 'Great! Buy Cannon in Upgrades to shoot!', x: W * 0.5, y: H * 0.35, alpha: 1, timer: 4 });
      }
      return false;
    }
    return ac.x > -30;
  });

  // ── UPDATE COINS ──
  coins = coins.filter(c => {
    if (c.collected) return false;
    c.x -= speed;
    const dx = player.x - c.x, dy = player.y - c.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < magnetRange) { c.x += (dx / d) * 5; c.y += (dy / d) * 5; }
    if (d < c.r + 22) {
      c.collected = true; sessionCoins++;
      spawnParticles(c.x, c.y, '#FFD700', 5);
      return false;
    }
    return c.x > -20;
  });

  // ── PARTICLES ──
  particles = particles.filter(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 0.04;
    return p.life > 0;
  });

  // ── BG PARTICLES ──
  const biome = BIOMES[currentBiome];
  bgParticles.forEach(p => {
    if (biome.snow) {
      p.y += p.speed * dt; p.x += p.drift * dt;
      if (p.y > H) { p.y = -5; p.x = Math.random() * W; }
    } else if (biome.rain) {
      p.y += p.speed * dt; p.x -= 30 * dt;
      if (p.y > H) { p.y = -20; p.x = Math.random() * W; }
    }
  });

  // ── TUTORIAL HINTS ──
  tutHints = tutHints.filter(h => {
    h.timer -= dt;
    h.alpha = Math.min(1, h.timer);
    return h.timer > 0;
  });

  // Tutorial: first hint shown, spawn first pillar hint on first obstacle
  if (!Save.data.tutorialDone && tutPhase === 0 && obstacles.length > 0) {
    tutPhase = 1;
    tutHints.push({ text: 'Fly through the gap in the pillars!', x: W * 0.5, y: H * 0.3, alpha: 1, timer: 4 });
  }

  // ── BIOME BANNER ──
  if (biomeBanner.timer > 0) biomeBanner.timer -= dt;

  // ── HUD UPDATE ──
  updateHUD();

  // ── CHECK LEVEL COMPLETE ──
  if (distance >= levelData.goal && !landing) startLanding();
}

function handleHit() {
  if (shieldHits > 0) {
    shieldHits--; player.invincible = 1.5;
    spawnParticles(player.x, player.y, '#4CAF50', 10);
    return;
  }
  player.alive = false;
  spawnParticles(player.x, player.y, VEHICLES[Save.data.activeVehicle].color, 16);
  setTimeout(showGameOver, 800);
}

function updateHUD() {
  const distM = Math.floor(distance);
  document.getElementById('hud-distance').textContent = distM + 'm';
  document.getElementById('hud-goal').textContent = '/ ' + levelData.goal + 'm';
  document.getElementById('hud-level').textContent = currentLevel;

  // Ammo display
  const cap = maxAmmo();
  let ammoStr = '';
  if (cap > 0) {
    for (let i = 0; i < cap; i++) ammoStr += i < ammo ? '●' : '○';
  } else {
    ammoStr = '—';
  }
  document.getElementById('hud-ammo').textContent = ammoStr;
}

// ── LANDING SEQUENCE ─────────────────────────────────────
function startLanding() {
  spawnTimer = 999; // stop spawning
  const veh = VEHICLES[Save.data.activeVehicle];
  landing = {
    phase: 'approach',
    timer: 0,
    runway: { x: W + 200, y: H * 0.76, type: veh.landing },
  };
  document.getElementById('shoot-btn').classList.add('hidden');
}

function updateLanding(dt) {
  const rw = landing.runway;
  const targetRwX = W * 0.60;

  // Runway slides in
  if (rw.x > targetRwX) rw.x -= speed * 0.8;

  // Target for plane: on the runway
  const targetX = rw.x - 80;
  const targetY = rw.y - 18;

  if (landing.phase === 'approach') {
    player.x += (targetX - player.x) * 0.04;
    player.y += (targetY - player.y) * 0.05;
    player.vy *= 0.9;

    if (Math.abs(player.x - targetX) < 15 && Math.abs(player.y - targetY) < 10 && rw.x <= targetRwX + 20) {
      landing.phase = 'touch';
      landing.timer = 0;
      spawnParticles(player.x, player.y, '#FFD700', 20);
    }
  } else if (landing.phase === 'touch') {
    player.x += (targetX - player.x) * 0.15;
    player.y += (targetY - player.y) * 0.15;
    landing.timer += dt;
    if (landing.timer > 1.8) {
      landing.phase = 'done';
      showLevelComplete();
    }
  }

  // Move clouds
  clouds.forEach(c => { c.x -= speed * 0.3; if (c.x + c.w < 0) { c.x = W + 20; } });
}

// ── DRAW VEHICLE ─────────────────────────────────────────
function drawVehicle(ctx, x, y, v, tilt = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(scale, scale);
  const id = v.id, rot = Date.now() * 0.015;

  if (id === 0) {
    ctx.fillStyle='#fff'; ctx.strokeStyle='#ccc'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(28,0); ctx.lineTo(-20,-14); ctx.lineTo(-10,0); ctx.lineTo(-20,14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#e0e0e0'; ctx.beginPath(); ctx.moveTo(-10,0); ctx.lineTo(-20,-14); ctx.lineTo(-10,-6); ctx.closePath(); ctx.fill();
  } else if (id === 1) {
    ctx.fillStyle='#f5f5f5'; ctx.strokeStyle='#aaa'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(32,0); ctx.lineTo(-22,-13); ctx.lineTo(-8,0); ctx.lineTo(-22,13); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#ffd54f'; ctx.beginPath(); ctx.moveTo(32,0); ctx.lineTo(10,-5); ctx.lineTo(10,5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#ffd54f'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(32,0); ctx.stroke();
  } else if (id === 2) {
    ctx.fillStyle='#546e7a'; ctx.beginPath(); ctx.ellipse(0,0,14,7,0,0,Math.PI*2); ctx.fill();
    [[-14,-14],[14,-14],[14,14],[-14,14]].forEach(([ax,ay])=>{
      ctx.save(); ctx.translate(ax,ay);
      ctx.fillStyle='#607d8b'; ctx.fillRect(-4,-4,8,8);
      for(let i=0;i<2;i++){ ctx.save(); ctx.rotate(rot+i*Math.PI); ctx.fillStyle='rgba(200,220,255,0.7)'; ctx.fillRect(-10,-2,20,4); ctx.restore(); }
      ctx.restore();
    });
    ctx.fillStyle='rgba(100,200,255,0.8)'; ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill();
  } else if (id === 3) {
    ctx.fillStyle='#4fc3f7'; ctx.beginPath(); ctx.ellipse(0,0,26,9,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#0288d1'; ctx.beginPath(); ctx.moveTo(26,0); ctx.lineTo(-16,-13); ctx.lineTo(-20,0); ctx.lineTo(-16,13); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(7,0,8,6,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(-3,-9,13,4,0.3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(-3,9,13,4,-0.3,0,Math.PI*2); ctx.fill();
  } else if (id === 4) {
    ctx.fillStyle='#ffd54f'; ctx.beginPath(); ctx.ellipse(0,0,28,10,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#f9a825'; ctx.beginPath(); ctx.moveTo(28,0); ctx.lineTo(-16,-12); ctx.lineTo(-20,0); ctx.lineTo(-16,12); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(-4,-10,15,5,0.3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(-4,10,15,5,-0.3,0,Math.PI*2); ctx.fill();
    ctx.save(); ctx.translate(30,0); ctx.rotate(rot*2); ctx.fillStyle='#5d4037'; ctx.fillRect(-2,-16,4,32); ctx.fillRect(-16,-2,32,4); ctx.restore();
  } else if (id === 5) {
    ctx.fillStyle='#ff7043'; ctx.beginPath(); ctx.moveTo(34,0); ctx.lineTo(-16,-8); ctx.lineTo(-22,-5); ctx.lineTo(-22,5); ctx.lineTo(-16,8); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#bf360c'; ctx.beginPath(); ctx.moveTo(-22,-5); ctx.lineTo(-34,-14); ctx.lineTo(-22,0); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(-22,5); ctx.lineTo(-34,14); ctx.lineTo(-22,0); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(100,220,255,0.7)'; ctx.beginPath(); ctx.ellipse(14,0,9,6,0,0,Math.PI*2); ctx.fill();
    const fl=6+Math.random()*8, grd=ctx.createRadialGradient(-22,0,0,-22,0,fl+8);
    grd.addColorStop(0,'rgba(255,255,200,0.9)'); grd.addColorStop(0.4,'rgba(255,120,0,0.7)'); grd.addColorStop(1,'rgba(255,0,0,0)');
    ctx.fillStyle=grd; ctx.beginPath(); ctx.ellipse(-22-fl/2,0,fl,5,0,0,Math.PI*2); ctx.fill();
  } else if (id === 6) {
    ctx.fillStyle='#ce93d8'; ctx.beginPath(); ctx.ellipse(0,0,30,11,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#7b1fa2'; ctx.beginPath(); ctx.moveTo(30,0); ctx.lineTo(-18,-13); ctx.lineTo(-24,0); ctx.lineTo(-18,13); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(-2,-10,18,4,0.2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(-2,10,18,4,-0.2,0,Math.PI*2); ctx.fill();
    for(let i=-10;i<=10;i+=7){ ctx.fillStyle='rgba(100,200,255,0.7)'; ctx.beginPath(); ctx.arc(i,0,3,0,Math.PI*2); ctx.fill(); }
  } else if (id === 7) {
    ctx.fillStyle='#b39ddb'; ctx.beginPath(); ctx.ellipse(0,0,38,13,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#4527a0'; ctx.beginPath(); ctx.moveTo(38,0); ctx.lineTo(-22,-14); ctx.lineTo(-28,0); ctx.lineTo(-22,14); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(-4,-13,22,5,0.25,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(-4,13,22,5,-0.25,0,Math.PI*2); ctx.fill();
    [-18,2].forEach(ex=>[-13,13].forEach(ey=>{ ctx.fillStyle='#7e57c2'; ctx.beginPath(); ctx.ellipse(ex,ey,7,4,0,0,Math.PI*2); ctx.fill(); }));
    for(let i=-16;i<=16;i+=8){ ctx.fillStyle='rgba(150,220,255,0.6)'; ctx.beginPath(); ctx.arc(i,0,3,0,Math.PI*2); ctx.fill(); }
  } else if (id === 8) {
    ctx.fillStyle='#546e7a'; ctx.beginPath(); ctx.moveTo(36,0); ctx.lineTo(-10,-6); ctx.lineTo(-32,-22); ctx.lineTo(-24,0); ctx.lineTo(-32,22); ctx.lineTo(-10,6); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#37474f'; ctx.beginPath(); ctx.moveTo(-24,0); ctx.lineTo(-32,-22); ctx.lineTo(-28,-10); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(-24,0); ctx.lineTo(-32,22); ctx.lineTo(-28,10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(0,255,200,0.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(36,0); ctx.lineTo(-10,-6); ctx.lineTo(-32,-22); ctx.stroke(); ctx.beginPath(); ctx.moveTo(36,0); ctx.lineTo(-10,6); ctx.lineTo(-32,22); ctx.stroke();
  } else if (id === 9) {
    ctx.fillStyle='#263238'; ctx.beginPath(); ctx.moveTo(38,0); ctx.lineTo(10,-6); ctx.lineTo(-16,-38); ctx.lineTo(-28,-12); ctx.lineTo(-32,0); ctx.lineTo(-28,12); ctx.lineTo(-16,38); ctx.lineTo(10,6); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(0,220,255,0.45)'; ctx.beginPath(); ctx.ellipse(14,0,11,5,0,0,Math.PI*2); ctx.fill();
    [-6,6].forEach(ey=>[-12,0].forEach(ex=>{ ctx.fillStyle='rgba(0,255,150,0.5)'; ctx.beginPath(); ctx.ellipse(ex,ey,5,3,0,0,Math.PI*2); ctx.fill(); }));
    ctx.strokeStyle='rgba(0,255,180,0.4)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(38,0); ctx.lineTo(-32,0); ctx.stroke();
  }
  ctx.restore();
}

// ── DRAW OBSTACLE ─────────────────────────────────────────
function drawObstacle(obs) {
  const [pc, pt] = PILLAR_COLS[currentBiome] || PILLAR_COLS[0];
  if (obs.type === 'pillar') {
    ctx.fillStyle = pc; ctx.fillRect(obs.x - obs.w/2, 0, obs.w, obs.gapY - obs.gap/2);
    ctx.fillStyle = pt; ctx.fillRect(obs.x - obs.w/2 - 6, obs.gapY - obs.gap/2 - 20, obs.w+12, 20);
    ctx.fillStyle = pc; ctx.fillRect(obs.x - obs.w/2, obs.gapY + obs.gap/2, obs.w, H);
    ctx.fillStyle = pt; ctx.fillRect(obs.x - obs.w/2 - 6, obs.gapY + obs.gap/2, obs.w+12, 20);
    ctx.fillStyle='rgba(255,255,255,0.08)';
    for(let y=0;y<obs.gapY-obs.gap/2;y+=24) ctx.fillRect(obs.x-obs.w/2+10,y,8,12);
    for(let y=obs.gapY+obs.gap/2+4;y<H;y+=24) ctx.fillRect(obs.x-obs.w/2+10,y,8,12);
  } else if (obs.type === 'fan') {
    obs.angle += 0.08;
    ctx.save(); ctx.translate(obs.x, obs.y);
    ctx.fillStyle='#607d8b'; ctx.beginPath(); ctx.arc(0,0,22,0,Math.PI*2); ctx.fill();
    ctx.save(); ctx.rotate(obs.angle);
    for(let i=0;i<4;i++){ ctx.save(); ctx.rotate(i*Math.PI/2); ctx.fillStyle='#90a4ae'; ctx.beginPath(); ctx.ellipse(14,0,16,6,0.4,0,Math.PI*2); ctx.fill(); ctx.restore(); }
    ctx.restore();
    ctx.fillStyle='#37474f'; ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.fill();
    const dir=obs.windForce>0?1:-1; ctx.strokeStyle='rgba(100,200,255,0.4)'; ctx.lineWidth=2;
    for(let i=1;i<=3;i++){ ctx.beginPath(); ctx.moveTo(dir*(28+i*14),-8); ctx.lineTo(dir*(36+i*14),0); ctx.lineTo(dir*(28+i*14),8); ctx.stroke(); }
    ctx.restore();
  } else if (obs.type === 'bird') {
    obs.wing += 0.15;
    ctx.save(); ctx.translate(obs.x, obs.y); if(obs.vx<0) ctx.scale(-1,1);
    ctx.fillStyle='#795548'; ctx.beginPath(); ctx.ellipse(0,0,14,7,0,0,Math.PI*2); ctx.fill();
    const wingY=Math.sin(obs.wing)*8;
    ctx.fillStyle='#5d4037';
    ctx.beginPath(); ctx.moveTo(-4,0); ctx.lineTo(-18,-wingY-4); ctx.lineTo(-8,0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4,0); ctx.lineTo(18,wingY-4); ctx.lineTo(8,0); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ff5722'; ctx.fillRect(12,-2,8,3);
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(10,-3,3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#333'; ctx.beginPath(); ctx.arc(11,-3,1.5,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

// ── DRAW COIN ─────────────────────────────────────────────
function drawCoin(coin, t) {
  if (coin.collected) return;
  ctx.save(); ctx.translate(coin.x, coin.y);
  const s = 0.9 + 0.1 * Math.sin(t * 3 + coin.anim); ctx.scale(s, s);
  const grd = ctx.createRadialGradient(0,0,0,0,0,coin.r*1.8);
  grd.addColorStop(0,'rgba(255,220,0,0.4)'); grd.addColorStop(1,'rgba(255,220,0,0)');
  ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(0,0,coin.r*1.8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#FFD700'; ctx.beginPath(); ctx.arc(0,0,coin.r,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#FFA000'; ctx.beginPath(); ctx.arc(0,0,coin.r*0.75,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#FFD700'; ctx.font=`bold ${coin.r*0.9}px Arial`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('$',0,1);
  ctx.restore();
}

// ── DRAW AMMO CRATE ──────────────────────────────────────
function drawAmmoCrate(ac) {
  ctx.save(); ctx.translate(ac.x, ac.y);
  const bob = Math.sin(ac.anim) * 3;
  ctx.translate(0, bob);
  // Glow
  const grd = ctx.createRadialGradient(0,0,0,0,0,22);
  grd.addColorStop(0,'rgba(255,200,0,0.25)'); grd.addColorStop(1,'rgba(255,200,0,0)');
  ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(0,0,22,0,Math.PI*2); ctx.fill();
  // Box
  ctx.fillStyle='#78909c'; ctx.beginPath(); ctx.roundRect(-11,-9,22,18,3); ctx.fill();
  ctx.strokeStyle='#ffcc02'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.roundRect(-11,-9,22,18,3); ctx.stroke();
  // Cross stripe
  ctx.strokeStyle='#546e7a'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-11,0); ctx.lineTo(11,0); ctx.stroke();
  // Bullet icon
  ctx.fillStyle='#ffcc02';
  ctx.beginPath(); ctx.ellipse(0,-1,3.5,5,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-3.5,-1); ctx.lineTo(3.5,-1); ctx.lineTo(0,-7); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ── DRAW BULLET ──────────────────────────────────────────
function drawBullet(b) {
  ctx.save();
  const grd = ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*3.5);
  grd.addColorStop(0,'rgba(255,230,60,1)'); grd.addColorStop(0.4,'rgba(255,100,0,0.7)'); grd.addColorStop(1,'rgba(255,50,0,0)');
  ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*3.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*0.5,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

// ── DRAW RUNWAY ──────────────────────────────────────────
function drawRunway(rw) {
  const { x, y, type } = rw;
  ctx.save();
  if (type === 'helipad') {
    ctx.fillStyle='#546e7a'; ctx.beginPath(); ctx.arc(x,y,50,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#ffeb3b'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(x,y,40,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x-25,y); ctx.lineTo(x+25,y); ctx.moveTo(x,y-25); ctx.lineTo(x,y+25); ctx.stroke();
    ctx.font='bold 18px Arial'; ctx.fillStyle='#ffeb3b'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('H', x, y);
  } else if (type === 'strip') {
    ctx.fillStyle='#4a7040'; ctx.fillRect(x-130, y-8, 260, 16);
    ctx.fillStyle='#fff'; for(let i=x-120;i<x+120;i+=30){ ctx.fillRect(i,y-2,15,4); }
  } else if (type === 'pad') {
    // Rocket launch pad
    ctx.fillStyle='#37474f'; ctx.fillRect(x-40, y-10, 80, 20);
    ctx.fillStyle='#ff7043'; ctx.fillRect(x-3, y-28, 6, 20);
    ctx.fillStyle='#fff';
    for(let i=x-35;i<=x+20;i+=18){ ctx.beginPath(); ctx.arc(i, y, 5, 0, Math.PI*2); ctx.fill(); }
  } else if (type === 'airport') {
    ctx.fillStyle='#37474f'; ctx.fillRect(x-200, y-13, 400, 26);
    ctx.fillStyle='#fff';
    for(let i=x-180;i<x+180;i+=40){ ctx.fillRect(i,y-2,20,4); }
    ctx.fillStyle='rgba(255,235,59,0.8)';
    ctx.fillRect(x-200, y+13, 400, 4); ctx.fillRect(x-200, y-17, 400, 4);
  } else if (type === 'military') {
    ctx.fillStyle='#1a1a2e'; ctx.fillRect(x-220, y-15, 440, 30);
    ctx.strokeStyle='rgba(0,255,80,0.6)'; ctx.lineWidth=2;
    ctx.strokeRect(x-220, y-15, 440, 30);
    ctx.fillStyle='rgba(0,255,80,0.5)';
    for(let i=x-210;i<x+210;i+=50){ ctx.beginPath(); ctx.arc(i, y, 4, 0, Math.PI*2); ctx.fill(); }
  } else { // runway (default)
    ctx.fillStyle='#455a64'; ctx.fillRect(x-160, y-11, 320, 22);
    ctx.fillStyle='#fff'; ctx.fillRect(x-150, y-2, 300, 4);
    ctx.fillStyle='#ffeb3b';
    for(let i=x-140;i<x+140;i+=35){ ctx.fillRect(i, y-10, 18, 20); }
  }
  ctx.restore();
}

// ── DRAW JOYSTICK ────────────────────────────────────────
function drawJoystick() {
  const bx = JOY.baseX, by = JOY.baseY;
  const br = JOY.baseR, kr = JOY.knobR;
  const kx = JOY.active ? JOY.knobX : bx;
  const ky = JOY.active ? JOY.knobY : by;

  // Base
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.strokeStyle = 'rgba(255,255,255,0.32)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI*2); ctx.fill(); ctx.stroke();

  // Guide lines
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx - br + 8, by); ctx.lineTo(bx + br - 8, by);
  ctx.moveTo(bx, by - br + 8); ctx.lineTo(bx, by + br - 8);
  ctx.stroke();

  // Knob
  const kg = ctx.createRadialGradient(kx - kr*0.3, ky - kr*0.3, 0, kx, ky, kr);
  kg.addColorStop(0, 'rgba(255,255,255,0.95)');
  kg.addColorStop(1, 'rgba(180,210,255,0.65)');
  ctx.fillStyle = kg;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(kx, ky, kr, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ── DRAW BACKGROUND ──────────────────────────────────────
function drawBackground(t) {
  const b = BIOMES[currentBiome];
  const grd = ctx.createLinearGradient(0,0,0,H);
  grd.addColorStop(0, b.sky[0]); grd.addColorStop(0.65, b.sky[1]); grd.addColorStop(1, b.sky[2]);
  ctx.fillStyle=grd; ctx.fillRect(0,0,W,H);

  // Stars
  if (b.stars) {
    stars.forEach(s => {
      const a = 0.4 + 0.5 * Math.sin(t * 1.2 + s.phase);
      ctx.fillStyle = b.nebula ? `rgba(180,140,255,${a*0.7})` : `rgba(255,255,255,${a*0.8})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    });
    if (b.nebula) {
      const ng = ctx.createRadialGradient(W*0.6, H*0.3, 0, W*0.6, H*0.3, H*0.5);
      ng.addColorStop(0,'rgba(80,20,120,0.18)'); ng.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=ng; ctx.fillRect(0,0,W,H);
    }
  }

  // Lightning flash (Storm)
  if (b.rain && Math.random() < 0.003) {
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(0,0,W,H);
  }

  // Clouds
  clouds.forEach(c => {
    ctx.fillStyle = `rgba(${b.cloud},${c.alpha})`;
    ctx.beginPath(); ctx.ellipse(c.x, c.y, c.w*0.5, c.h*0.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(c.x-c.w*0.25, c.y+c.h*0.12, c.w*0.35, c.h*0.42, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(c.x+c.w*0.25, c.y+c.h*0.12, c.w*0.35, c.h*0.42, 0, 0, Math.PI*2); ctx.fill();
    c.x -= c.spd;
    if (c.x + c.w < -20) { c.x = W + 20; c.y = H*0.05 + Math.random()*H*0.4; }
  });

  // Snow / Rain particles
  bgParticles.forEach(p => {
    if (b.snow) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    } else if (b.rain) {
      ctx.strokeStyle = 'rgba(150,180,220,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 3, p.y + p.len); ctx.stroke();
    }
  });
}

// ── MAIN DRAW ────────────────────────────────────────────
function draw(t) {
  ctx.clearRect(0, 0, W, H);
  drawBackground(t);

  // Landing runway (behind everything else, above bg)
  if (landing && landing.runway) drawRunway(landing.runway);

  // Trail
  player.trail.forEach((pt, i) => {
    const alpha = (1 - i / player.trail.length) * 0.35;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, (1 - i/player.trail.length)*8, 0, Math.PI*2); ctx.fill();
  });

  // Coins, ammo, bullets, obstacles
  coins.forEach(c => drawCoin(c, t));
  ammoPickups.forEach(ac => drawAmmoCrate(ac));
  bullets.forEach(b => drawBullet(b));
  obstacles.forEach(o => drawObstacle(o));

  // Shield flash
  if (player.invincible > 0 && Math.floor(t*8)%2===0) {
    ctx.save(); ctx.translate(player.x, player.y);
    ctx.strokeStyle='rgba(100,255,100,0.8)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(0,0,36,0,Math.PI*2); ctx.stroke(); ctx.restore();
  }

  // Player — tilt from vertical velocity
  const tilt = Math.max(-0.45, Math.min(0.45, player.vy / 300));
  drawVehicle(ctx, player.x, player.y, player.vehicle, tilt);

  // Particles
  particles.forEach(p => {
    ctx.fillStyle = `rgba(${hexToRgb(p.color)},${p.life})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r*p.life, 0, Math.PI*2); ctx.fill();
  });

  // Tutorial hints
  tutHints.forEach(h => {
    ctx.save();
    ctx.fillStyle = `rgba(255,255,255,${h.alpha * 0.95})`;
    ctx.strokeStyle = `rgba(0,0,0,${h.alpha * 0.6})`;
    ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 4; ctx.strokeText(h.text, h.x, h.y); ctx.fillText(h.text, h.x, h.y);
    // Arrow toward joystick if hint is about controls
    if (h.text.includes('joystick')) {
      ctx.strokeStyle = `rgba(255,220,0,${h.alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(h.x, h.y + 20); ctx.lineTo(JOY.baseX, JOY.baseY - JOY.baseR - 10); ctx.stroke();
    }
    ctx.restore();
  });

  // Biome banner
  if (biomeBanner.timer > 0) {
    const a = Math.min(1, biomeBanner.timer) * Math.min(1, biomeBanner.timer / 0.3);
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${a * 0.55})`;
    ctx.fillRect(0, H*0.5 - 32, W, 64);
    ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(255,220,80,${a})`; ctx.fillText(biomeBanner.text, W/2, H*0.5);
    ctx.restore();
  }

  // Landing "LEVEL COMPLETE" flash
  if (landing && landing.phase === 'touch') {
    const a = Math.min(1, landing.timer / 0.4) * 0.9;
    ctx.fillStyle = `rgba(255,220,50,${a * 0.15})`;
    ctx.fillRect(0,0,W,H);
  }

  // Joystick (only when playing and not landing)
  if (gameState === 'playing' && !landing) drawJoystick();

  // Progress bar at very top
  if (levelData) {
    const pct = Math.min(1, distance / levelData.goal);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 0, W, 4);
    const barGrd = ctx.createLinearGradient(0,0,W,0);
    barGrd.addColorStop(0,'#4CAF50'); barGrd.addColorStop(1,'#8BC34A');
    ctx.fillStyle = barGrd; ctx.fillRect(0, 0, W * pct, 4);
  }
}

function hexToRgb(hex) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}

// ── GAME LOOP ─────────────────────────────────────────────
function loop(ts) {
  const dt = Math.min((ts - (lastTime || ts)) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw(ts / 1000);
  if (player.alive || landing) frameId = requestAnimationFrame(loop);
}

// ── SCREENS ──────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showMenu() {
  gameState = 'menu';
  if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
  document.getElementById('shoot-btn').classList.add('hidden');
  document.getElementById('menu-coins').textContent = Save.data.coins;
  document.getElementById('menu-level').textContent = 'LVL ' + Save.data.currentLevel;
  document.getElementById('menu-best').textContent = 'BEST ' + Save.data.bestLevel;
  showScreen('screen-menu');
  drawMenuVehicle();
}

function startGame() {
  // Check if first time
  if (!Save.data.tutorialDone) {
    showTutorialModal();
    return;
  }
  beginLevel(Save.data.currentLevel);
}

function beginLevel(lvlNum) {
  gameState = 'playing';
  showScreen('screen-game');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  W = canvas.width; H = canvas.height;
  initGame(lvlNum);
  lastTime = null;
  frameId = requestAnimationFrame(loop);
}

function showGameOver() {
  gameState = 'dead';
  if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
  document.getElementById('shoot-btn').classList.add('hidden');
  Save.data.coins += sessionCoins;
  Save.save();
  document.getElementById('go-level').textContent = currentLevel;
  document.getElementById('go-distance').textContent = Math.floor(distance) + 'm / ' + levelData.goal + 'm';
  document.getElementById('go-coins').textContent = '+' + sessionCoins;
  showScreen('screen-gameover');
}

function showLevelComplete() {
  gameState = 'levelcomplete';
  if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
  document.getElementById('shoot-btn').classList.add('hidden');

  // Advance level
  Save.data.coins += sessionCoins;
  if (!Save.data.tutorialDone) { Save.data.tutorialDone = true; }
  const nextLevel = Math.min(70, currentLevel + 1);
  Save.data.currentLevel = nextLevel;
  if (currentLevel > Save.data.bestLevel) Save.data.bestLevel = currentLevel;
  Save.save();

  document.getElementById('lc-level').textContent = currentLevel;
  document.getElementById('lc-distance').textContent = Math.floor(distance) + 'm';
  document.getElementById('lc-coins').textContent = '+' + sessionCoins;
  document.getElementById('lc-next').textContent = currentLevel >= 70 ? 'PLAY AGAIN' : 'LEVEL ' + nextLevel + ' ›';

  // If entering new biome, show banner text on complete screen
  const newBiome = LEVELS[nextLevel - 1]?.biome;
  const bioLabel = document.getElementById('lc-biome');
  if (nextLevel % 10 === 1 && nextLevel <= 70 && newBiome !== currentBiome) {
    bioLabel.textContent = '→ Entering ' + BIOMES[newBiome].name + ' Zone';
    bioLabel.classList.remove('hidden');
  } else {
    bioLabel.classList.add('hidden');
  }

  showScreen('screen-levelcomplete');
}

function showShop() {
  renderShop();
  showScreen('screen-shop');
}

// ── TUTORIAL MODAL ────────────────────────────────────────
function showTutorialModal() {
  document.getElementById('tutorial-modal').classList.remove('hidden');
}
function closeTutorialModal() {
  document.getElementById('tutorial-modal').classList.add('hidden');
  beginLevel(1);
}

// ── MENU VEHICLE PREVIEW ──────────────────────────────────
function drawMenuVehicle() {
  const vc = document.getElementById('vehicleCanvas');
  const vCtx = vc.getContext('2d');
  vCtx.clearRect(0, 0, 120, 80);
  const v = VEHICLES[Save.data.activeVehicle];
  document.getElementById('vehicle-name').textContent = v.name;
  drawVehicle(vCtx, 60, 40, v, 0, 1.4);
  if (gameState === 'menu') requestAnimationFrame(drawMenuVehicle);
}

// ── SHOP ─────────────────────────────────────────────────
function renderShop() {
  document.getElementById('shop-coins').textContent = Save.data.coins;
  document.getElementById('vehicles-grid').innerHTML = VEHICLES.map(v => {
    const owned = Save.data.ownedVehicles.includes(v.id);
    const active = Save.data.activeVehicle === v.id;
    const cls = active ? 'active' : owned ? 'owned' : 'locked';
    const bottom = active ? '<div class="vc-badge" style="color:#FF6B35">ACTIVE</div>'
      : owned ? '<div class="vc-badge" style="color:#4CAF50">OWNED</div>'
      : `<div class="vc-cost">🪙 ${v.cost}</div>`;
    return `<div class="vehicle-card ${cls}" onclick="selectVehicle(${v.id})"><div class="vc-icon">${v.emoji}</div><div class="vc-name">${v.name}</div>${bottom}</div>`;
  }).join('');

  document.getElementById('upgrades-list').innerHTML = UPGRADES.map(upg => {
    const level = Save.data.upgrades[upg.id];
    const maxed = level >= upg.maxLevel;
    const cost = maxed ? 0 : upg.costs[level];
    const pct = (level / upg.maxLevel) * 100;
    return `<div class="upgrade-row" onclick="buyUpgrade('${upg.id}')">
      <div class="up-icon">${upg.icon}</div>
      <div class="up-info">
        <div class="up-name">${upg.name} <span style="color:rgba(255,255,255,0.4);font-size:12px">Lv ${level}/${upg.maxLevel}</span></div>
        <div class="up-desc">${upg.desc}</div>
        <div class="up-bar"><div class="up-bar-fill" style="width:${pct}%"></div></div>
      </div>
      ${maxed ? '<div class="up-maxed">MAX</div>' : `<div class="up-cost">🪙 ${cost}</div>`}
    </div>`;
  }).join('');
}

function selectVehicle(id) {
  if (Save.data.ownedVehicles.includes(id)) {
    Save.data.activeVehicle = id; Save.save(); renderShop();
  } else {
    const v = VEHICLES[id];
    if (Save.data.coins >= v.cost) {
      Save.data.coins -= v.cost; Save.data.ownedVehicles.push(id); Save.data.activeVehicle = id;
      Save.save(); renderShop();
    }
  }
}
function buyUpgrade(id) {
  const upg = UPGRADES.find(u => u.id === id);
  const level = Save.data.upgrades[id];
  if (level >= upg.maxLevel) return;
  const cost = upg.costs[level];
  if (Save.data.coins >= cost) {
    Save.data.coins -= cost; Save.data.upgrades[id]++;
    Save.save(); renderShop();
  }
}

// ── INPUT ─────────────────────────────────────────────────
function setupTouch() {
  const gc = document.getElementById('screen-game');

  gc.addEventListener('touchstart', e => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (JOY.touchId !== -1) continue;
      const r = canvas.getBoundingClientRect();
      const tx = touch.clientX - r.left, ty = touch.clientY - r.top;
      const dx = tx - JOY.baseX, dy = ty - JOY.baseY;
      if (Math.sqrt(dx*dx + dy*dy) < JOY.baseR * 1.8) {
        JOY.active = true; JOY.touchId = touch.identifier;
        updateJoystick(tx, ty);
      }
    }
  }, { passive: false });

  gc.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier === JOY.touchId) {
        const r = canvas.getBoundingClientRect();
        updateJoystick(touch.clientX - r.left, touch.clientY - r.top);
      }
    }
  }, { passive: false });

  gc.addEventListener('touchend', e => {
    for (const touch of e.changedTouches) {
      if (touch.identifier === JOY.touchId) {
        JOY.active = false; JOY.touchId = -1; JOY.dx = 0; JOY.dy = 0;
      }
    }
  });
  gc.addEventListener('touchcancel', () => { JOY.active = false; JOY.touchId = -1; JOY.dx = 0; JOY.dy = 0; });

  // Mouse (desktop)
  let mouseDown = false;
  gc.addEventListener('mousedown', e => {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const dx = mx - JOY.baseX, dy = my - JOY.baseY;
    if (Math.sqrt(dx*dx + dy*dy) < JOY.baseR * 1.8) {
      mouseDown = true; JOY.active = true; updateJoystick(mx, my);
    }
  });
  gc.addEventListener('mousemove', e => {
    if (!mouseDown) return;
    const r = canvas.getBoundingClientRect();
    updateJoystick(e.clientX - r.left, e.clientY - r.top);
  });
  gc.addEventListener('mouseup', () => { mouseDown = false; JOY.active = false; JOY.dx = 0; JOY.dy = 0; });
  gc.addEventListener('mouseleave', () => { mouseDown = false; JOY.active = false; JOY.dx = 0; JOY.dy = 0; });

  // Shoot button
  const shootBtn = document.getElementById('shoot-btn');
  shootBtn.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); shoot(); }, { passive: false });
  shootBtn.addEventListener('mousedown', e => { e.stopPropagation(); shoot(); });
}

// ── INIT ─────────────────────────────────────────────────
window.addEventListener('load', () => {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  W = canvas.offsetWidth; H = canvas.offsetHeight;
  canvas.width = W; canvas.height = H;

  Save.load();
  setupTouch();

  document.getElementById('playBtn').addEventListener('click', startGame);
  document.getElementById('shopBtn').addEventListener('click', showShop);
  document.getElementById('retryBtn').addEventListener('click', () => beginLevel(currentLevel));
  document.getElementById('goShopBtn').addEventListener('click', showShop);
  document.getElementById('goMenuBtn').addEventListener('click', showMenu);
  document.getElementById('shopBackBtn').addEventListener('click', showMenu);
  document.getElementById('nextLevelBtn').addEventListener('click', () => beginLevel(Save.data.currentLevel));
  document.getElementById('lcShopBtn').addEventListener('click', showShop);
  document.getElementById('lcMenuBtn').addEventListener('click', showMenu);
  document.getElementById('tut-start-btn').addEventListener('click', closeTutorialModal);

  window.addEventListener('resize', () => {
    if (gameState === 'playing' || gameState === 'landing') {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      W = canvas.width; H = canvas.height;
      JOY.baseX = W * 0.5; JOY.baseY = H - 90;
    }
  });

  showMenu();
});
