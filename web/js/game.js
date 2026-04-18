// ── SAVE DATA ──
const Save = {
  data: null,
  defaults: {
    coins: 0, bestScore: 0, activeVehicle: 0,
    ownedVehicles: [0],
    upgrades: { speed: 0, control: 0, magnet: 0, shield: 0, cannon: 0 }
  },
  load() {
    try { this.data = JSON.parse(localStorage.getItem('pfe_save')) || { ...this.defaults, upgrades: { ...this.defaults.upgrades }, ownedVehicles: [0] }; }
    catch { this.data = { ...this.defaults, upgrades: { ...this.defaults.upgrades }, ownedVehicles: [0] }; }
    if (!this.data.upgrades) this.data.upgrades = { ...this.defaults.upgrades };
    if (this.data.upgrades.cannon === undefined) this.data.upgrades.cannon = 0;
    if (!this.data.ownedVehicles) this.data.ownedVehicles = [0];
  },
  save() { localStorage.setItem('pfe_save', JSON.stringify(this.data)); }
};

// ── VEHICLES ──
const VEHICLES = [
  { id: 0, name: 'Paper Plane',      emoji: '✉️',  cost: 0,      speed: 1.0, control: 1.0, color: '#ffffff', special: 'Floaty'    },
  { id: 1, name: 'Upgraded Paper',   emoji: '📄',  cost: 150,    speed: 1.15,control: 1.1, color: '#e3f2fd', special: 'Sharper'   },
  { id: 2, name: 'Drone',            emoji: '🚁',  cost: 400,    speed: 0.95,control: 1.7, color: '#90caf9', special: 'Precise'   },
  { id: 3, name: 'Light Plane',      emoji: '🛩️', cost: 900,    speed: 1.3, control: 1.2, color: '#4fc3f7', special: 'Balanced'  },
  { id: 4, name: 'Propeller Plane',  emoji: '✈️',  cost: 1800,   speed: 1.5, control: 1.15,color: '#ffd54f', special: 'Strong'    },
  { id: 5, name: 'Rocket',           emoji: '🚀',  cost: 3200,   speed: 2.0, control: 0.85,color: '#ff7043', special: 'Blazing'   },
  { id: 6, name: 'Small Airliner',   emoji: '🛫',  cost: 5000,   speed: 1.7, control: 1.0, color: '#ce93d8', special: 'Steady'    },
  { id: 7, name: 'Large Airliner',   emoji: '🛬',  cost: 8000,   speed: 1.9, control: 0.9, color: '#b39ddb', special: 'Powerful'  },
  { id: 8, name: 'Stealth Plane',    emoji: '🌑',  cost: 12000,  speed: 2.3, control: 1.2, color: '#546e7a', special: 'Invisible' },
  { id: 9, name: 'B-2 Spirit',       emoji: '🛸',  cost: 18000,  speed: 2.6, control: 1.3, color: '#37474f', special: 'Legendary' },
];

// ── UPGRADES ──
const UPGRADES = [
  { id: 'speed',   name: 'Engine Boost',   icon: '⚡', desc: 'Increases base speed',            maxLevel: 5, costs: [80, 150, 280, 500, 900] },
  { id: 'control', name: 'Better Control', icon: '🎯', desc: 'Smoother lift and response',       maxLevel: 5, costs: [60, 120, 220, 400, 750] },
  { id: 'magnet',  name: 'Coin Magnet',    icon: '🧲', desc: 'Attract nearby coins',             maxLevel: 4, costs: [100, 200, 400, 800] },
  { id: 'shield',  name: 'Shield',         icon: '🛡', desc: 'Extra hit before crashing',        maxLevel: 3, costs: [150, 350, 700] },
  { id: 'cannon',  name: 'Cannon',         icon: '🔫', desc: 'Shoot bullets — destroys birds!',  maxLevel: 3, costs: [300, 600, 1200] },
];

// ── GAME CONFIG ──
const CONFIG = {
  baseSpeed: 3.5,
  coinRadius: 12,
  magnetBase: 80,
};

// ── GAME STATE ──
let canvas, ctx, W, H;
let gameState = 'menu';
let player, obstacles, coins, particles, bullets;
let score, sessionCoins, distance, speed;
let isHolding;
let shootCooldown, shootAutoTimer;
let frameId, lastTime;
let shieldHits;
let spawnTimer, coinTimer;
let clouds = [];

// ── PLAYER ──
function createPlayer() {
  const v = VEHICLES[Save.data.activeVehicle];
  return {
    x: W * 0.25, y: H * 0.5,
    vy: 0,
    w: 48, h: 32,
    vehicle: v,
    trail: [],
    invincible: 0,
    alive: true
  };
}

// ── OBSTACLES ──
function createPillar() {
  const gap = Math.max(H * 0.28, H * 0.42 - distance * 0.005);
  const gapY = H * 0.18 + Math.random() * (H * 0.64);
  return { type: 'pillar', x: W + 40, gapY, gap, w: 52, scored: false };
}

function createFan() {
  const side = Math.random() < 0.5 ? 'top' : 'bottom';
  return {
    type: 'fan', x: W + 40,
    y: side === 'top' ? H * 0.05 : H * 0.85,
    side, angle: 0, w: 44, h: 44,
    windForce: (Math.random() < 0.5 ? 1 : -1) * 2.5
  };
}

function createBird() {
  const y = H * 0.1 + Math.random() * H * 0.8;
  const dir = Math.random() < 0.5 ? 1 : -1;
  return {
    type: 'bird', x: dir > 0 ? -40 : W + 40, y,
    vx: dir * (2 + Math.random() * 2),
    wing: 0, r: 18
  };
}

// ── COIN ──
function spawnCoin() {
  const count = 1 + Math.floor(Math.random() * 3);
  const y = H * 0.12 + Math.random() * (H * 0.76);
  for (let i = 0; i < count; i++) {
    coins.push({ x: W + 40 + i * 34, y: y + (Math.random() - 0.5) * 30, r: CONFIG.coinRadius, collected: false, anim: Math.random() * Math.PI * 2 });
  }
}

// ── PARTICLES ──
function spawnParticles(x, y, color, n = 8) {
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 2 + Math.random() * 4;
    particles.push({ x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: 1, color, r: 3 + Math.random() * 4 });
  }
}

// ── SHOOT ──
function shoot() {
  if (gameState !== 'playing' || !player || !player.alive) return;
  const cannonLevel = Save.data.upgrades.cannon || 0;
  if (cannonLevel === 0 || shootCooldown > 0) return;

  const cooldowns = [0, 1.0, 0.55, 0.4];
  shootCooldown = cooldowns[cannonLevel];

  const bulletVx = speed + 360;
  const bR = 6;

  if (cannonLevel >= 3) {
    // Level 3: double spread shot
    bullets.push({ x: player.x + 26, y: player.y - 5, vx: bulletVx, vy: -40, r: bR });
    bullets.push({ x: player.x + 26, y: player.y + 5, vx: bulletVx, vy:  40, r: bR });
  } else {
    // Level 1-2: single straight shot
    bullets.push({ x: player.x + 26, y: player.y, vx: bulletVx, vy: 0, r: bR });
  }
  spawnParticles(player.x + 20, player.y, '#ff9800', 4);
}

function updateShootBtn() {
  const btn = document.getElementById('shoot-btn');
  if (!btn) return;
  const level = Save.data.upgrades.cannon || 0;
  if (level > 0 && gameState === 'playing') {
    btn.classList.remove('hidden');
    btn.textContent = level >= 3 ? '🔥' : '🔫';
  } else {
    btn.classList.add('hidden');
  }
}

// ── DRAW VEHICLE ──
function drawVehicle(ctx, x, y, v, tilt = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(scale, scale);
  const id = v.id;
  const rot = Date.now() * 0.015;

  if (id === 0) { // Paper Plane
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(28,0); ctx.lineTo(-20,-14); ctx.lineTo(-10,0); ctx.lineTo(-20,14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e0e0e0'; ctx.beginPath(); ctx.moveTo(-10,0); ctx.lineTo(-20,-14); ctx.lineTo(-10,-6); ctx.closePath(); ctx.fill();

  } else if (id === 1) { // Upgraded Paper Plane
    ctx.fillStyle = '#f5f5f5'; ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(32,0); ctx.lineTo(-22,-13); ctx.lineTo(-8,0); ctx.lineTo(-22,13); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath(); ctx.moveTo(32,0); ctx.lineTo(10,-5); ctx.lineTo(10,5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffd54f'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(32,0); ctx.stroke();

  } else if (id === 2) { // Drone
    ctx.fillStyle = '#546e7a'; ctx.beginPath(); ctx.ellipse(0,0,14,7,0,0,Math.PI*2); ctx.fill();
    const arms = [[-14,-14],[14,-14],[14,14],[-14,14]];
    arms.forEach(([ax,ay])=>{
      ctx.save(); ctx.translate(ax,ay);
      ctx.fillStyle='#607d8b'; ctx.fillRect(-4,-4,8,8);
      for(let i=0;i<2;i++){
        ctx.save(); ctx.rotate(rot+i*Math.PI);
        ctx.fillStyle='rgba(200,220,255,0.7)'; ctx.fillRect(-10,-2,20,4);
        ctx.restore();
      }
      ctx.restore();
    });
    ctx.fillStyle='rgba(100,200,255,0.8)'; ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill();

  } else if (id === 3) { // Light Plane
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath(); ctx.ellipse(0,0,26,9,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#0288d1'; ctx.beginPath(); ctx.moveTo(26,0); ctx.lineTo(-16,-13); ctx.lineTo(-20,0); ctx.lineTo(-16,13); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(7,0,8,6,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(-3,-9,13,4,0.3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-3,9,13,4,-0.3,0,Math.PI*2); ctx.fill();

  } else if (id === 4) { // Propeller Plane
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath(); ctx.ellipse(0,0,28,10,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#f9a825'; ctx.beginPath(); ctx.moveTo(28,0); ctx.lineTo(-16,-12); ctx.lineTo(-20,0); ctx.lineTo(-16,12); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(-4,-10,15,5,0.3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-4,10,15,5,-0.3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(8,0,9,7,0,0,Math.PI*2); ctx.fill();
    ctx.save(); ctx.translate(30,0); ctx.rotate(rot*2);
    ctx.fillStyle='#5d4037'; ctx.fillRect(-2,-16,4,32); ctx.fillRect(-16,-2,32,4);
    ctx.restore();

  } else if (id === 5) { // Rocket
    ctx.fillStyle = '#ff7043';
    ctx.beginPath(); ctx.moveTo(34,0); ctx.lineTo(-16,-8); ctx.lineTo(-22,-5); ctx.lineTo(-22,5); ctx.lineTo(-16,8); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#bf360c'; ctx.beginPath(); ctx.moveTo(-22,-5); ctx.lineTo(-34,-14); ctx.lineTo(-22,0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-22,5); ctx.lineTo(-34,14); ctx.lineTo(-22,0); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(100,220,255,0.7)'; ctx.beginPath(); ctx.ellipse(14,0,9,6,0,0,Math.PI*2); ctx.fill();
    const fl = 6 + Math.random()*8;
    const grd = ctx.createRadialGradient(-22,0,0,-22,0,fl+8);
    grd.addColorStop(0,'rgba(255,255,200,0.9)'); grd.addColorStop(0.4,'rgba(255,120,0,0.7)'); grd.addColorStop(1,'rgba(255,0,0,0)');
    ctx.fillStyle=grd; ctx.beginPath(); ctx.ellipse(-22-fl/2,0,fl,5,0,0,Math.PI*2); ctx.fill();

  } else if (id === 6) { // Small Airliner
    ctx.fillStyle='#ce93d8';
    ctx.beginPath(); ctx.ellipse(0,0,30,11,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#7b1fa2'; ctx.beginPath(); ctx.moveTo(30,0); ctx.lineTo(-18,-13); ctx.lineTo(-24,0); ctx.lineTo(-18,13); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(-2,-10,18,4,0.2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-2,10,18,4,-0.2,0,Math.PI*2); ctx.fill();
    for(let i=-10;i<=10;i+=7){ ctx.fillStyle='rgba(100,200,255,0.7)'; ctx.beginPath(); ctx.arc(i,0,3,0,Math.PI*2); ctx.fill(); }

  } else if (id === 7) { // Large Airliner
    ctx.fillStyle='#b39ddb';
    ctx.beginPath(); ctx.ellipse(0,0,38,13,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#4527a0'; ctx.beginPath(); ctx.moveTo(38,0); ctx.lineTo(-22,-14); ctx.lineTo(-28,0); ctx.lineTo(-22,14); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(-4,-13,22,5,0.25,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-4,13,22,5,-0.25,0,Math.PI*2); ctx.fill();
    [-18,2].forEach(ex=>[-13,13].forEach(ey=>{
      ctx.fillStyle='#7e57c2'; ctx.beginPath(); ctx.ellipse(ex,ey,7,4,0,0,Math.PI*2); ctx.fill();
    }));
    for(let i=-16;i<=16;i+=8){ ctx.fillStyle='rgba(150,220,255,0.6)'; ctx.beginPath(); ctx.arc(i,0,3,0,Math.PI*2); ctx.fill(); }

  } else if (id === 8) { // Stealth Plane
    ctx.fillStyle='#546e7a';
    ctx.beginPath(); ctx.moveTo(36,0); ctx.lineTo(-10,-6); ctx.lineTo(-32,-22); ctx.lineTo(-24,0); ctx.lineTo(-32,22); ctx.lineTo(-10,6); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#37474f'; ctx.beginPath(); ctx.moveTo(-24,0); ctx.lineTo(-32,-22); ctx.lineTo(-28,-10); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-24,0); ctx.lineTo(-32,22); ctx.lineTo(-28,10); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(0,200,255,0.3)'; ctx.beginPath(); ctx.ellipse(10,0,10,5,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(0,255,200,0.3)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(36,0); ctx.lineTo(-10,-6); ctx.lineTo(-32,-22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(36,0); ctx.lineTo(-10,6); ctx.lineTo(-32,22); ctx.stroke();

  } else if (id === 9) { // B-2 Spirit
    ctx.fillStyle='#263238';
    ctx.beginPath(); ctx.moveTo(38,0); ctx.lineTo(10,-6); ctx.lineTo(-16,-38); ctx.lineTo(-28,-12); ctx.lineTo(-32,0); ctx.lineTo(-28,12); ctx.lineTo(-16,38); ctx.lineTo(10,6); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#37474f'; ctx.beginPath(); ctx.moveTo(38,0); ctx.lineTo(10,-6); ctx.lineTo(20,0); ctx.lineTo(10,6); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(0,255,180,0.2)';
    ctx.beginPath(); ctx.moveTo(10,-6); ctx.lineTo(-16,-38); ctx.lineTo(-10,-20); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10,6); ctx.lineTo(-16,38); ctx.lineTo(-10,20); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(0,220,255,0.45)'; ctx.beginPath(); ctx.ellipse(14,0,11,5,0,0,Math.PI*2); ctx.fill();
    [-6,6].forEach(ey=>[-12,0].forEach(ex=>{
      ctx.fillStyle='rgba(0,255,150,0.5)'; ctx.beginPath(); ctx.ellipse(ex,ey,5,3,0,0,Math.PI*2); ctx.fill();
    }));
    ctx.strokeStyle='rgba(0,255,180,0.4)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(38,0); ctx.lineTo(-32,0); ctx.stroke();
  }

  ctx.restore();
}

// ── DRAW OBSTACLE ──
function drawObstacle(obs) {
  if (obs.type === 'pillar') {
    ctx.fillStyle = '#4a7c3f';
    ctx.fillRect(obs.x - obs.w / 2, 0, obs.w, obs.gapY - obs.gap / 2);
    ctx.fillStyle = '#5d9e3b';
    ctx.fillRect(obs.x - obs.w / 2 - 6, obs.gapY - obs.gap / 2 - 20, obs.w + 12, 20);
    ctx.fillStyle = '#4a7c3f';
    ctx.fillRect(obs.x - obs.w / 2, obs.gapY + obs.gap / 2, obs.w, H);
    ctx.fillStyle = '#5d9e3b';
    ctx.fillRect(obs.x - obs.w / 2 - 6, obs.gapY + obs.gap / 2, obs.w + 12, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (let y = 0; y < obs.gapY - obs.gap / 2; y += 24) ctx.fillRect(obs.x - obs.w / 2 + 10, y, 8, 12);
    for (let y = obs.gapY + obs.gap / 2 + 4; y < H; y += 24) ctx.fillRect(obs.x - obs.w / 2 + 10, y, 8, 12);

  } else if (obs.type === 'fan') {
    obs.angle += 0.08;
    ctx.save(); ctx.translate(obs.x, obs.y);
    ctx.fillStyle = '#607d8b';
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.rotate(obs.angle);
    for (let i = 0; i < 4; i++) {
      ctx.save(); ctx.rotate(i * Math.PI / 2);
      ctx.fillStyle = '#90a4ae';
      ctx.beginPath(); ctx.ellipse(14, 0, 16, 6, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    ctx.fillStyle = '#37474f'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
    const dir = obs.windForce > 0 ? 1 : -1;
    ctx.strokeStyle = 'rgba(100,200,255,0.4)'; ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(dir * (28 + i * 14), -8);
      ctx.lineTo(dir * (36 + i * 14), 0);
      ctx.lineTo(dir * (28 + i * 14), 8);
      ctx.stroke();
    }
    ctx.restore();

  } else if (obs.type === 'bird') {
    obs.wing += 0.15;
    ctx.save(); ctx.translate(obs.x, obs.y);
    if (obs.vx < 0) ctx.scale(-1, 1);
    ctx.fillStyle = '#795548';
    ctx.beginPath(); ctx.ellipse(0, 0, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
    const wingY = Math.sin(obs.wing) * 8;
    ctx.fillStyle = '#5d4037';
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-18, -wingY - 4); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(18, wingY - 4); ctx.lineTo(8, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff5722'; ctx.fillRect(12, -2, 8, 3);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(10, -3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(11, -3, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ── DRAW COIN ──
function drawCoin(coin, t) {
  if (coin.collected) return;
  ctx.save();
  ctx.translate(coin.x, coin.y);
  const scale = 0.9 + 0.1 * Math.sin(t * 3 + coin.anim);
  ctx.scale(scale, scale);
  const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, coin.r * 1.8);
  grd.addColorStop(0, 'rgba(255,220,0,0.4)');
  grd.addColorStop(1, 'rgba(255,220,0,0)');
  ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(0, 0, coin.r * 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(0, 0, coin.r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFA000'; ctx.beginPath(); ctx.arc(0, 0, coin.r * 0.75, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.font = `bold ${coin.r * 0.9}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('$', 0, 1);
  ctx.restore();
}

// ── DRAW BULLET ──
function drawBullet(b) {
  ctx.save();
  // Trail glow
  const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 3.5);
  grd.addColorStop(0, 'rgba(255,230,60,1)');
  grd.addColorStop(0.4, 'rgba(255,100,0,0.7)');
  grd.addColorStop(1, 'rgba(255,50,0,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 3.5, 0, Math.PI * 2); ctx.fill();
  // Core
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ── DRAW BACKGROUND ──
function drawBackground() {
  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#5ba8d4');
  grd.addColorStop(0.7, '#87CEEB');
  grd.addColorStop(1, '#b8e4f9');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

  clouds.forEach(c => {
    c.x -= c.speed;
    if (c.x + c.w < -20) { c.x = W + 20; c.y = H * 0.05 + Math.random() * H * 0.4; }
    ctx.fillStyle = `rgba(255,255,255,${c.alpha})`;
    ctx.beginPath(); ctx.ellipse(c.x, c.y, c.w * 0.5, c.h * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(c.x - c.w * 0.25, c.y + c.h * 0.1, c.w * 0.35, c.h * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(c.x + c.w * 0.25, c.y + c.h * 0.1, c.w * 0.35, c.h * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  });
}

// ── INIT GAME ──
function initGame() {
  score = 0; sessionCoins = 0; distance = 0;
  obstacles = []; coins = []; particles = []; bullets = [];
  spawnTimer = 0; coinTimer = 0;
  isHolding = false;
  shootCooldown = 0;
  shootAutoTimer = 3;
  const upg = Save.data.upgrades;
  shieldHits = upg.shield;
  const v = VEHICLES[Save.data.activeVehicle];
  speed = CONFIG.baseSpeed * v.speed * (1 + upg.speed * 0.12);
  player = createPlayer();
  clouds = Array.from({ length: 8 }, () => ({
    x: Math.random() * W, y: H * 0.05 + Math.random() * H * 0.4,
    w: 60 + Math.random() * 80, h: 30 + Math.random() * 30,
    speed: 0.3 + Math.random() * 0.5, alpha: 0.6 + Math.random() * 0.35
  }));
  updateShootBtn();
}

// ── UPDATE ──
function update(dt) {
  if (!player.alive) return;

  distance += speed * dt * 60;
  score = Math.floor(distance / 10);
  speed = Math.min(
    CONFIG.baseSpeed * VEHICLES[Save.data.activeVehicle].speed * (1 + Save.data.upgrades.speed * 0.12) + distance * 0.0003,
    12
  );

  // ── PHYSICS: hold screen = fly up, release = fall ──
  const upg = Save.data.upgrades;
  const controlFactor = VEHICLES[Save.data.activeVehicle].control * (1 + upg.control * 0.15);
  const gravity   = 520;                        // px/s² downward
  const uplift    = 740;                        // px/s² upward while holding
  const maxFall   = 340;                        // px/s max downward velocity
  const maxRise   = -270 * Math.min(controlFactor, 1.9); // px/s max upward velocity

  if (isHolding) {
    player.vy = Math.max(player.vy - uplift * controlFactor * dt, maxRise);
  } else {
    player.vy = Math.min(player.vy + gravity * dt, maxFall);
  }
  player.y += player.vy * dt;

  // Clamp to screen
  player.y = Math.max(player.h * 0.5, Math.min(H - player.h * 0.5, player.y));
  // Clamp velocity if hitting boundary
  if (player.y === player.h * 0.5 || player.y === H - player.h * 0.5) player.vy = 0;

  // Trail
  player.trail.unshift({ x: player.x, y: player.y });
  if (player.trail.length > 12) player.trail.pop();

  // Timers
  if (player.invincible > 0) player.invincible -= dt;
  if (shootCooldown > 0) shootCooldown -= dt;

  // Auto-fire at cannon level 3
  const cannonLevel = upg.cannon || 0;
  if (cannonLevel >= 3) {
    shootAutoTimer -= dt;
    if (shootAutoTimer <= 0) { shoot(); shootAutoTimer = 2.5; }
  }

  // ── BULLETS ──
  const nextBullets = [];
  for (const b of bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    let destroyed = false;
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      if (obs.type === 'bird' || obs.type === 'fan') {
        const dx = b.x - obs.x, dy = b.y - obs.y;
        const hitR = obs.type === 'bird' ? obs.r + b.r : 22 + b.r;
        if (Math.sqrt(dx * dx + dy * dy) < hitR) {
          spawnParticles(obs.x, obs.y, obs.type === 'bird' ? '#8d6e63' : '#78909c', 10);
          score += obs.type === 'bird' ? 15 : 8;
          obstacles.splice(i, 1);
          destroyed = true;
          break;
        }
      }
    }
    if (!destroyed && b.x < W + 80 && b.x > -20) nextBullets.push(b);
  }
  bullets = nextBullets;

  // ── SPAWN OBSTACLES ──
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    const r = Math.random();
    if (distance < 500 || r < 0.7) obstacles.push(createPillar());
    else if (r < 0.85) obstacles.push(createFan());
    else obstacles.push(createBird());
    spawnTimer = Math.max(0.9, 2.2 - distance * 0.0004);
  }

  // ── SPAWN COINS ──
  coinTimer -= dt;
  if (coinTimer <= 0) { spawnCoin(); coinTimer = 0.8 + Math.random() * 0.6; }

  // Magnet range
  const magnetRange = CONFIG.magnetBase + upg.magnet * 50;

  // ── UPDATE OBSTACLES ──
  obstacles = obstacles.filter(obs => {
    if (obs.type === 'pillar') {
      obs.x -= speed;
      if (!obs.scored && obs.x < player.x) { obs.scored = true; score += 5; }
      if (player.invincible <= 0) {
        const hw = player.w * 0.38, hh = player.h * 0.38;
        if (player.x + hw > obs.x - obs.w / 2 && player.x - hw < obs.x + obs.w / 2) {
          if (player.y - hh < obs.gapY - obs.gap / 2 || player.y + hh > obs.gapY + obs.gap / 2) {
            handleHit();
          }
        }
      }
      return obs.x > -obs.w;

    } else if (obs.type === 'fan') {
      obs.x -= speed;
      if (obs.x > 0 && obs.x < W) {
        const dx = player.x - obs.x, dy = player.y - obs.y;
        if (Math.sqrt(dx * dx + dy * dy) < 100) {
          // Wind pushes player vertically
          player.vy += obs.windForce * 100 * dt;
        }
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

  // ── UPDATE COINS ──
  coins = coins.filter(c => {
    if (c.collected) return false;
    c.x -= speed;
    const dx = player.x - c.x, dy = player.y - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < magnetRange) { c.x += (dx / dist) * 5; c.y += (dy / dist) * 5; }
    if (dist < c.r + 22) {
      c.collected = true; sessionCoins++;
      spawnParticles(c.x, c.y, '#FFD700', 5);
      document.getElementById('hud-coins').textContent = sessionCoins;
      return false;
    }
    return c.x > -20;
  });

  // ── PARTICLES ──
  particles = particles.filter(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.04;
    return p.life > 0;
  });

  // ── HUD ──
  document.getElementById('hud-score').textContent = score;
  const distM = Math.floor(distance);
  document.getElementById('hud-distance').textContent = distM + 'm';
  const pb = document.getElementById('hud-pb-badge');
  if (distM > Save.data.bestScore && Save.data.bestScore > 0) {
    pb.classList.remove('hidden');
  } else {
    pb.classList.add('hidden');
  }
}

// ── HANDLE HIT ──
function handleHit() {
  if (shieldHits > 0) {
    shieldHits--;
    player.invincible = 1.5;
    spawnParticles(player.x, player.y, '#4CAF50', 10);
    return;
  }
  player.alive = false;
  spawnParticles(player.x, player.y, VEHICLES[Save.data.activeVehicle].color, 16);
  setTimeout(showGameOver, 800);
}

// ── DRAW ──
function draw(t) {
  ctx.clearRect(0, 0, W, H);
  drawBackground();

  // Trail
  player.trail.forEach((pt, i) => {
    const alpha = (1 - i / player.trail.length) * 0.35;
    const r = (1 - i / player.trail.length) * 8;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2); ctx.fill();
  });

  // Coins
  coins.forEach(c => drawCoin(c, t));

  // Bullets (behind obstacles)
  bullets.forEach(b => drawBullet(b));

  // Obstacles
  obstacles.forEach(o => drawObstacle(o));

  // Shield flash
  if (player.invincible > 0 && Math.floor(t * 8) % 2 === 0) {
    ctx.save(); ctx.translate(player.x, player.y);
    ctx.strokeStyle = 'rgba(100,255,100,0.8)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Player — tilt based on vertical velocity
  const tilt = Math.max(-0.45, Math.min(0.45, player.vy / 300));
  drawVehicle(ctx, player.x, player.y, player.vehicle, tilt);

  // Particles
  particles.forEach(p => {
    ctx.fillStyle = `rgba(${hexToRgb(p.color)},${p.life})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2); ctx.fill();
  });

  // Distance watermark
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '12px Arial'; ctx.textAlign = 'left';
  ctx.fillText(`${Math.floor(distance)}m`, 8, H - 12);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ── GAME LOOP ──
function loop(ts) {
  const dt = Math.min((ts - (lastTime || ts)) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw(ts / 1000);
  if (player.alive) frameId = requestAnimationFrame(loop);
}

// ── SCREENS ──
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showMenu() {
  gameState = 'menu';
  if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
  document.getElementById('shoot-btn').classList.add('hidden');
  updateMenuUI();
  showScreen('screen-menu');
  drawMenuVehicle();
}

function startGame() {
  gameState = 'playing';
  showScreen('screen-game');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  W = canvas.width; H = canvas.height;
  initGame();
  lastTime = null;
  frameId = requestAnimationFrame(loop);
}

function showGameOver() {
  gameState = 'dead';
  if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
  document.getElementById('shoot-btn').classList.add('hidden');
  Save.data.coins += sessionCoins;
  const finalDist = Math.floor(distance);
  const isNew = finalDist > Save.data.bestScore;
  if (isNew) Save.data.bestScore = finalDist;
  Save.save();
  document.getElementById('go-score').textContent = finalDist + 'm';
  document.getElementById('go-best').textContent = Save.data.bestScore + 'm';
  document.getElementById('go-coins').textContent = `+${sessionCoins}`;
  document.getElementById('go-newbest').classList.toggle('hidden', !isNew);
  showScreen('screen-gameover');
}

function showShop() {
  renderShop();
  showScreen('screen-shop');
}

// ── MENU VEHICLE PREVIEW ──
function drawMenuVehicle() {
  const vc = document.getElementById('vehicleCanvas');
  const vCtx = vc.getContext('2d');
  vCtx.clearRect(0, 0, 120, 80);
  const v = VEHICLES[Save.data.activeVehicle];
  document.getElementById('vehicle-name').textContent = v.name;
  drawVehicle(vCtx, 60, 40, v, 0, 1.4);
  requestAnimationFrame(drawMenuVehicle);
}

function updateMenuUI() {
  document.getElementById('menu-coins').textContent = Save.data.coins;
  document.getElementById('menu-best').textContent = Save.data.bestScore;
}

// ── SHOP ──
function renderShop() {
  document.getElementById('shop-coins').textContent = Save.data.coins;
  const grid = document.getElementById('vehicles-grid');
  grid.innerHTML = VEHICLES.map(v => {
    const owned = Save.data.ownedVehicles.includes(v.id);
    const active = Save.data.activeVehicle === v.id;
    const cls = active ? 'active' : owned ? 'owned' : 'locked';
    const bottom = active ? '<div class="vc-badge" style="color:#FF6B35">ACTIVE</div>'
      : owned ? '<div class="vc-badge" style="color:#4CAF50">OWNED</div>'
      : `<div class="vc-cost">🪙 ${v.cost}</div>`;
    return `<div class="vehicle-card ${cls}" onclick="selectVehicle(${v.id})">
      <div class="vc-icon">${v.emoji}</div>
      <div class="vc-name">${v.name}</div>
      ${bottom}
    </div>`;
  }).join('');

  const list = document.getElementById('upgrades-list');
  list.innerHTML = UPGRADES.map(upg => {
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
  const owned = Save.data.ownedVehicles.includes(id);
  if (owned) {
    Save.data.activeVehicle = id; Save.save(); renderShop();
  } else {
    const v = VEHICLES[id];
    if (Save.data.coins >= v.cost) {
      Save.data.coins -= v.cost;
      Save.data.ownedVehicles.push(id);
      Save.data.activeVehicle = id;
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
    Save.data.coins -= cost;
    Save.data.upgrades[id]++;
    Save.save(); renderShop();
  }
}

// ── TOUCH / INPUT ──
function setupTouch() {
  const gc = document.getElementById('screen-game');

  // Main screen: hold = fly up
  gc.addEventListener('touchstart', e => {
    e.preventDefault();
    isHolding = true;
  }, { passive: false });
  gc.addEventListener('touchend', () => { isHolding = false; });
  gc.addEventListener('touchcancel', () => { isHolding = false; });

  // Mouse fallback for desktop
  gc.addEventListener('mousedown', () => { isHolding = true; });
  gc.addEventListener('mouseup', () => { isHolding = false; });
  gc.addEventListener('mouseleave', () => { isHolding = false; });

  // Shoot button — separate from main hold area
  const shootBtn = document.getElementById('shoot-btn');
  shootBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    e.stopPropagation(); // don't trigger hold
    shoot();
  }, { passive: false });
  shootBtn.addEventListener('mousedown', e => {
    e.stopPropagation();
    shoot();
  });
}

// ── INIT ──
window.addEventListener('load', () => {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  W = canvas.offsetWidth; H = canvas.offsetHeight;
  canvas.width = W; canvas.height = H;

  Save.load();
  setupTouch();

  document.getElementById('playBtn').addEventListener('click', startGame);
  document.getElementById('shopBtn').addEventListener('click', showShop);
  document.getElementById('retryBtn').addEventListener('click', startGame);
  document.getElementById('goShopBtn').addEventListener('click', showShop);
  document.getElementById('goMenuBtn').addEventListener('click', showMenu);
  document.getElementById('shopBackBtn').addEventListener('click', showMenu);

  window.addEventListener('resize', () => {
    if (gameState === 'playing') {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      W = canvas.width; H = canvas.height;
    }
  });

  showMenu();
});
