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
      gapFraction:  0.42 - t * 0.15,                             // 0.42 → 0.27 H (min gap softer)
      spawnInterval:Math.max(0.65, 2.0 - t * 1.35),              // 2.0 → 0.65 s
      fanChance:    i < 10 ? 0 : Math.min(0.25, (i - 10) * 0.018),
      birdChance:   i < 20 ? 0 : Math.min(0.25, (i - 20) * 0.015),
    };
  });
}
const LEVELS = generateLevels();

// ── VEHICLES ─────────────────────────────────────────────
const VEHICLES = [
  { id:0, name:'Paper Plane',     emoji:'✉️',  cost:0,     speed:1.0,  control:1.0,  color:'#ffffff', landing:'strip',    perk:'Standard all-rounder'                          },
  { id:1, name:'Upgraded Paper',  emoji:'📄',  cost:135,   speed:1.15, control:1.1,  color:'#e3f2fd', landing:'strip',    perk:'🧲 Coin magnet range +40%'                     },
  { id:2, name:'Drone',           emoji:'🚁',  cost:360,   speed:0.95, control:1.7,  color:'#90caf9', landing:'helipad',  perk:'🎯 Ultra-precise hover — gravity halved'        },
  { id:3, name:'Light Plane',     emoji:'🛩️', cost:810,   speed:1.3,  control:1.2,  color:'#4fc3f7', landing:'runway',   perk:'⚡ Aerobatic — tighter turns'                   },
  { id:4, name:'Propeller Plane', emoji:'✈️',  cost:1620,  speed:1.5,  control:1.15, color:'#ffd54f', landing:'runway',   perk:'💨 Fan gusts reduced by 60%'                   },
  { id:5, name:'Rocket',          emoji:'🚀',  cost:2880,  speed:2.0,  control:0.85, color:'#ff7043', landing:'pad',      perk:'🔥 Fire trail — hold for speed burst'           },
  { id:6, name:'Small Airliner',  emoji:'🛫',  cost:4500,  speed:1.7,  control:1.0,  color:'#ce93d8', landing:'airport',  perk:'🪙 Every coin worth +2 bonus'                  },
  { id:7, name:'Large Airliner',  emoji:'🛬',  cost:7200,  speed:1.9,  control:0.9,  color:'#b39ddb', landing:'airport',  perk:'🛡 Starts each level with +1 free shield'      },
  { id:8, name:'Stealth Plane',   emoji:'🌑',  cost:10800, speed:2.3,  control:1.2,  color:'#546e7a', landing:'military', perk:'👻 Enemy missiles 50% miss chance'             },
  { id:9, name:'B-2 Spirit',      emoji:'🛸',  cost:16200, speed:2.6,  control:1.3,  color:'#37474f', landing:'military', perk:'🔫 Auto-fires cannon every 4s (no ammo needed)'},
];

// ── UPGRADES ─────────────────────────────────────────────
const UPGRADES = [
  { id:'speed',   name:'Engine Boost',   icon:'⚡', desc:'Increases base speed',           maxLevel:5, costs:[80,150,280,500,900]  },
  { id:'control', name:'Better Control', icon:'🎯', desc:'Smoother joystick response',      maxLevel:5, costs:[60,120,220,400,750]  },
  { id:'magnet',  name:'Coin Magnet',    icon:'🧲', desc:'Attract nearby coins',            maxLevel:4, costs:[100,200,400,800]     },
  { id:'shield',  name:'Shield',         icon:'🛡', desc:'Extra hit before crashing',       maxLevel:3, costs:[150,350,700]         },
  { id:'cannon',  name:'Cannon',         icon:'🔫', desc:'Unlocks ammo pickups & shooting', maxLevel:3, costs:[150,300,600]         },
];

// ── LANGUAGES ────────────────────────────────────────────
const LANGS = {
  en: { name:'English',  flag:'🇬🇧', dir:'ltr', t:{
    play:'PLAY', levelsBtn:'🗺️ LEVELS', upgradesMenu:'⚙️ UPGRADES', upgradesBtn:'🔧 UPGRADES',
    upgradesTitle:'UPGRADES', upgradesSec:'UPGRADES', levelsTitle:'LEVELS',
    level:'LEVEL', distance:'DISTANCE', ammo:'AMMO', coins:'COINS',
    crashed:'CRASHED!', tryAgain:'TRY AGAIN', menu:'MENU',
    levelComplete:'LEVEL COMPLETE!', vehicles:'VEHICLES',
    howToPlay:'HOW TO PLAY', letsFly:"LET'S FLY!", wellDone:'⭐ WELL DONE! ⭐',
    lvl:'LVL', best:'BEST', playAgain:'PLAY AGAIN',
    tut1:'<b>Hold</b> the screen to fly up — <b>release</b> to fall down',
    tut2:"Fly through the <b>gaps</b> in the pillars — don't crash!",
    tut3:'Collect <b>ammo boxes</b> to charge your cannon (buy Cannon in Upgrades)',
    tut4:'Grab <b>coins</b> to spend on vehicles and upgrades',
    tut5:'Reach the <b>distance goal</b> — then fly onto the <b>runway</b> to land!',
  }},
  it: { name:'Italiano', flag:'🇮🇹', dir:'ltr', t:{
    play:'GIOCA', levelsBtn:'🗺️ LIVELLI', upgradesMenu:'⚙️ MIGLIORIE', upgradesBtn:'🔧 MIGLIORIE',
    upgradesTitle:'MIGLIORIE', upgradesSec:'MIGLIORIE', levelsTitle:'LIVELLI',
    level:'LIVELLO', distance:'DISTANZA', ammo:'MUNIZIONI', coins:'MONETE',
    crashed:'SCHIANTO!', tryAgain:'RIPROVA', menu:'MENU',
    levelComplete:'LIVELLO COMPLETATO!', vehicles:'VEICOLI',
    howToPlay:'COME GIOCARE', letsFly:'VOLIAMO!', wellDone:'⭐ OTTIMO! ⭐',
    lvl:'LIV', best:'RECORD', playAgain:'ANCORA',
    tut1:'<b>Tieni premuto</b> per salire — <b>rilascia</b> per scendere',
    tut2:'Vola attraverso i <b>varchi</b> nei pilastri — non schiantarti!',
    tut3:'Raccogli <b>munizioni</b> per il cannone (acquista in Migliorie)',
    tut4:'Prendi le <b>monete</b> per veicoli e migliorie',
    tut5:'Raggiungi la <b>meta</b> — poi atterra sulla <b>pista</b>!',
  }},
  fr: { name:'Français', flag:'🇫🇷', dir:'ltr', t:{
    play:'JOUER', levelsBtn:'🗺️ NIVEAUX', upgradesMenu:'⚙️ AMÉLIORATIONS', upgradesBtn:'🔧 AMÉLIORATIONS',
    upgradesTitle:'AMÉLIORATIONS', upgradesSec:'AMÉLIORATIONS', levelsTitle:'NIVEAUX',
    level:'NIVEAU', distance:'DISTANCE', ammo:'MUNITIONS', coins:'PIÈCES',
    crashed:'CRASH!', tryAgain:'RÉESSAYER', menu:'MENU',
    levelComplete:'NIVEAU TERMINÉ!', vehicles:'VÉHICULES',
    howToPlay:'COMMENT JOUER', letsFly:'ON VOLE!', wellDone:'⭐ BRAVO! ⭐',
    lvl:'NIV', best:'RECORD', playAgain:'REJOUER',
    tut1:"<b>Maintenez</b> l'écran pour monter — <b>relâchez</b> pour descendre",
    tut2:'Volez à travers les <b>espaces</b> dans les piliers — sans crasher!',
    tut3:"Collectez des <b>munitions</b> pour le canon (acheter dans Améliorations)",
    tut4:'Prenez les <b>pièces</b> pour les véhicules et améliorations',
    tut5:'Atteignez la <b>distance</b> — puis atterrissez sur la <b>piste</b>!',
  }},
  ru: { name:'Русский', flag:'🇷🇺', dir:'ltr', t:{
    play:'ИГРАТЬ', levelsBtn:'🗺️ УРОВНИ', upgradesMenu:'⚙️ УЛУЧШЕНИЯ', upgradesBtn:'🔧 УЛУЧШЕНИЯ',
    upgradesTitle:'УЛУЧШЕНИЯ', upgradesSec:'УЛУЧШЕНИЯ', levelsTitle:'УРОВНИ',
    level:'УРОВЕНЬ', distance:'ДИСТАНЦИЯ', ammo:'ПАТРОНЫ', coins:'МОНЕТЫ',
    crashed:'КРУШЕНИЕ!', tryAgain:'ЕЩЁ РАЗ', menu:'МЕНЮ',
    levelComplete:'УРОВЕНЬ ПРОЙДЕН!', vehicles:'ТРАНСПОРТ',
    howToPlay:'КАК ИГРАТЬ', letsFly:'ПОЛЕТЕЛИ!', wellDone:'⭐ ОТЛИЧНО! ⭐',
    lvl:'УР', best:'РЕКОРД', playAgain:'СНОВА',
    tut1:'<b>Удерживайте</b> экран для подъёма — <b>отпустите</b> для снижения',
    tut2:'Летите сквозь <b>промежутки</b> в столбах — не врезайтесь!',
    tut3:'Собирайте <b>патроны</b> для пушки (купите в Улучшениях)',
    tut4:'Берите <b>монеты</b> для транспорта и улучшений',
    tut5:'Достигните <b>цели</b> — затем приземлитесь на <b>полосу</b>!',
  }},
  ja: { name:'日本語', flag:'🇯🇵', dir:'ltr', t:{
    play:'プレイ', levelsBtn:'🗺️ レベル', upgradesMenu:'⚙️ アップグレード', upgradesBtn:'🔧 アップグレード',
    upgradesTitle:'アップグレード', upgradesSec:'アップグレード', levelsTitle:'レベル',
    level:'レベル', distance:'距離', ammo:'弾薬', coins:'コイン',
    crashed:'クラッシュ!', tryAgain:'もう一度', menu:'メニュー',
    levelComplete:'レベルクリア!', vehicles:'乗り物',
    howToPlay:'遊び方', letsFly:'飛ぼう!', wellDone:'⭐ すごい! ⭐',
    lvl:'LV', best:'最高', playAgain:'もう一度',
    tut1:'<b>押し続ける</b>と上昇 — <b>離す</b>と下降',
    tut2:'柱の<b>隙間</b>を飛び抜けよう — ぶつからないように!',
    tut3:'<b>弾薬箱</b>を集めて大砲を充填（アップグレードで購入）',
    tut4:'<b>コイン</b>を集めて乗り物やアップグレードに使おう',
    tut5:'<b>距離目標</b>に到達したら<b>滑走路</b>に着陸しよう!',
  }},
  zh: { name:'中文', flag:'🇨🇳', dir:'ltr', t:{
    play:'开始', levelsBtn:'🗺️ 关卡', upgradesMenu:'⚙️ 升级', upgradesBtn:'🔧 升级',
    upgradesTitle:'升级', upgradesSec:'升级', levelsTitle:'关卡',
    level:'关卡', distance:'距离', ammo:'弹药', coins:'金币',
    crashed:'坠毁!', tryAgain:'再试一次', menu:'菜单',
    levelComplete:'关卡完成!', vehicles:'飞行器',
    howToPlay:'游戏说明', letsFly:'出发!', wellDone:'⭐ 太棒了! ⭐',
    lvl:'关', best:'最佳', playAgain:'再玩',
    tut1:'<b>按住</b>屏幕上升 — <b>松开</b>下降',
    tut2:'飞过柱子间的<b>间隙</b> — 不要撞上!',
    tut3:'收集<b>弹药箱</b>为大炮充能（在升级中购买大炮）',
    tut4:'收集<b>金币</b>购买飞行器和升级',
    tut5:'达到<b>距离目标</b> — 然后飞到<b>跑道</b>上降落!',
  }},
  he: { name:'עברית', flag:'🇮🇱', dir:'rtl', t:{
    play:'שחק', levelsBtn:'🗺️ שלבים', upgradesMenu:'⚙️ שדרוגים', upgradesBtn:'🔧 שדרוגים',
    upgradesTitle:'שדרוגים', upgradesSec:'שדרוגים', levelsTitle:'שלבים',
    level:'שלב', distance:'מרחק', ammo:'תחמושת', coins:'מטבעות',
    crashed:'התרסקת!', tryAgain:'נסה שוב', menu:'תפריט',
    levelComplete:'השלב הושלם!', vehicles:'כלי טיס',
    howToPlay:'איך משחקים', letsFly:'יאללה נטוס!', wellDone:'⭐ כל הכבוד! ⭐',
    lvl:'שלב', best:'שיא', playAgain:'שחק שוב',
    tut1:'<b>לחץ</b> על המסך לעלות — <b>שחרר</b> לרדת',
    tut2:'טוס דרך <b>הפרצות</b> בעמודים — אל תתרסק!',
    tut3:'אסוף <b>קופסאות תחמושת</b> לטעינת התותח (קנה תותח בשדרוגים)',
    tut4:'אסוף <b>מטבעות</b> לקניית כלי טיס ושדרוגים',
    tut5:'הגע ל<b>יעד המרחק</b> — ואז נחת על <b>המסלול</b>!',
  }},
  ar: { name:'العربية', flag:'🇸🇦', dir:'rtl', t:{
    play:'العب', levelsBtn:'🗺️ مستويات', upgradesMenu:'⚙️ تحسينات', upgradesBtn:'🔧 تحسينات',
    upgradesTitle:'تحسينات', upgradesSec:'تحسينات', levelsTitle:'مستويات',
    level:'المستوى', distance:'المسافة', ammo:'ذخيرة', coins:'عملات',
    crashed:'تحطمت!', tryAgain:'حاول مجدداً', menu:'قائمة',
    levelComplete:'اكتمل المستوى!', vehicles:'مركبات',
    howToPlay:'كيف تلعب', letsFly:'هيا نطير!', wellDone:'⭐ أحسنت! ⭐',
    lvl:'مستوى', best:'أفضل', playAgain:'العب مجدداً',
    tut1:'<b>اضغط مطولاً</b> للصعود — <b>أطلق</b> للنزول',
    tut2:'حلق عبر <b>الفجوات</b> في الأعمدة — لا تتحطم!',
    tut3:'اجمع <b>صناديق الذخيرة</b> لشحن المدفع (اشتره من التحسينات)',
    tut4:'اجمع <b>العملات</b> للإنفاق على المركبات والتحسينات',
    tut5:'بلغ <b>هدف المسافة</b> — ثم اهبط على <b>المدرج</b>!',
  }},
};

let currentLang = localStorage.getItem('pfe_lang') || 'en';

function t(key) {
  return (LANGS[currentLang] && LANGS[currentLang].t[key]) || LANGS.en.t[key] || key;
}

function applyLang() {
  const lang = LANGS[currentLang];
  document.documentElement.lang = currentLang;
  document.body.dir = lang.dir;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  const langBtn = document.getElementById('langBtn');
  if (langBtn) langBtn.textContent = lang.flag;
  // Refresh dynamic menu text if save is loaded
  if (Save.data) {
    document.getElementById('menu-level').textContent = t('lvl') + ' ' + Save.data.currentLevel;
    document.getElementById('menu-best').textContent = t('best') + ' ' + Save.data.bestLevel;
  }
}

function setLang(code) {
  if (!LANGS[code]) return;
  currentLang = code;
  localStorage.setItem('pfe_lang', code);
  applyLang();
}

function initLangSelector() {
  const dropdown = document.getElementById('langDropdown');
  Object.entries(LANGS).forEach(([code, lang]) => {
    const btn = document.createElement('button');
    btn.className = 'lang-opt' + (code === currentLang ? ' lang-active' : '');
    btn.textContent = lang.flag + ' ' + lang.name;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setLang(code);
      dropdown.classList.add('hidden');
      dropdown.querySelectorAll('.lang-opt').forEach(b => b.classList.remove('lang-active'));
      btn.classList.add('lang-active');
    });
    dropdown.appendChild(btn);
  });
  document.getElementById('langBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });
  document.addEventListener('click', () => dropdown.classList.add('hidden'));
}

// ── SAVE ─────────────────────────────────────────────────
const Save = {
  KEY: 'pfe_v2',
  COOKIE_DAYS: 365,
  defaults: {
    coins: 0, bestLevel: 1, activeVehicle: 0,
    ownedVehicles: [0],
    upgrades: { speed:0, control:0, magnet:0, shield:0, cannon:0 },
    currentLevel: 1, tutorialDone: false,
    levelBests: {}, prestige: 0,
  },
  data: null,
  fresh() { return JSON.parse(JSON.stringify(this.defaults)); },

  // ── Cookie helpers ──
  _setCookie(val) {
    try {
      const exp = new Date(Date.now() + this.COOKIE_DAYS * 864e5).toUTCString();
      document.cookie = `${this.KEY}=${encodeURIComponent(val)};expires=${exp};path=/;SameSite=Lax`;
    } catch(e) {}
  },
  _getCookie() {
    try {
      const match = document.cookie.split('; ').find(r => r.startsWith(this.KEY + '='));
      return match ? decodeURIComponent(match.split('=')[1]) : null;
    } catch(e) { return null; }
  },

  // ── Save to ALL storage mechanisms ──
  save() {
    const json = JSON.stringify(this.data);
    try { localStorage.setItem(this.KEY, json); } catch(e) {}
    try { sessionStorage.setItem(this.KEY, json); } catch(e) {}
    this._setCookie(json);
  },

  // ── Load from first available source ──
  load() {
    let raw = null;
    try { raw = localStorage.getItem(this.KEY); } catch(e) {}
    if (!raw) { try { raw = sessionStorage.getItem(this.KEY); } catch(e) {} }
    if (!raw) { raw = this._getCookie(); }
    try { this.data = raw ? JSON.parse(raw) : null; } catch { this.data = null; }
    if (!this.data) this.data = this.fresh();
    // Field safety
    if (!this.data.upgrades) this.data.upgrades = { speed:0,control:0,magnet:0,shield:0,cannon:0 };
    if (this.data.upgrades.cannon === undefined) this.data.upgrades.cannon = 0;
    if (!this.data.ownedVehicles || !this.data.ownedVehicles.includes(0)) this.data.ownedVehicles = [0];
    if (!this.data.currentLevel || this.data.currentLevel < 1) this.data.currentLevel = 1;
    if (!this.data.bestLevel) this.data.bestLevel = 1;
    if (this.data.tutorialDone === undefined) this.data.tutorialDone = false;
    if (!this.data.levelBests) this.data.levelBests = {};
    if (this.data.prestige === undefined) this.data.prestige = 0;
    // Re-save to populate all storage mechanisms in case one was missing
    this.save();
  },
};

// ── GAME STATE ───────────────────────────────────────────
let canvas, ctx, W, H;
let gameState = 'menu'; // menu | playing | landing | levelcomplete | dead | shop
let player, obstacles, coins, ammoPickups, particles, bullets, mysteryBoxes, enemies, enemyBullets;
let distance, speed, sessionCoins, ammo;
let frameId, lastTime;
let shieldHits, shootCooldown, shootAutoTimer;
let spawnTimer, coinTimer, ammoTimer, mysteryTimer, enemyTimer;
let popups = []; // [{text, x, y, alpha, timer, color}]
let clouds = [], stars = [], bgParticles = [];
let coinCombo = 0, comboTimer = 0;
let screenShake = 0;
let lastLightningTime = 0;
let currentLevel = 1;
let levelData = LEVELS[0];
let currentBiome = 0;
let biomeBanner = { text: '', timer: 0 };

// Landing state
let landing = null; // null | { runway:{x,y,w,type}, phase:'approach'|'touch'|'done', timer }

// Tutorial hints (drawn on canvas)
let tutHints = []; // [{text, x, y, alpha, timer}]
let tutPhase = 0;  // 0=hint, 1=gap hint, 2=ammo hint, 3=done

// Hold-to-fly control
let isHolding = false;

// ── AMMO CAPACITY ─────────────────────────────────────────
function maxAmmo() { return [0, 4, 7, 10][Math.min(3, Save.data.upgrades.cannon)]; }

// ── PLAYER ───────────────────────────────────────────────
function createPlayer() {
  const v = VEHICLES[Save.data.activeVehicle];
  return { x: W * 0.25, y: H * 0.5, vy: 0, w: 48, h: 32, vehicle: v, trail: [], invincible: 0, alive: true };
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

// ── MYSTERY BOX ──────────────────────────────────────────
const MYSTERY_PRIZES = [
  { id:'coins5',   label:'+5 🪙',    color:'#FFD700', weight:28 },
  { id:'coins15',  label:'+15 🪙',   color:'#FFC200', weight:16 },
  { id:'coins30',  label:'+30 🪙',   color:'#FF9900', weight:8  },
  { id:'coins100', label:'+100 🪙',  color:'#ff4444', weight:2  },
  { id:'ammo3',    label:'+3 💥',    color:'#ff7043', weight:18 },
  { id:'ammo5',    label:'+5 💥',    color:'#ff5722', weight:9  },
  { id:'shield',   label:'SHIELD!',  color:'#4CAF50', weight:7  },
  { id:'invincible',label:'⚡ INVINCIBLE', color:'#E040FB', weight:4 },
  { id:'speedup',  label:'⚡ SPEED!',color:'#00BCD4', weight:7  },
  { id:'vehicle',  label:'FREE PLANE!', color:'#FFD700', weight:1 },
];
function pickPrize() {
  // Vehicle prize only if player doesn't own all vehicles up to id 6
  const unowned = VEHICLES.filter(v => v.id >= 1 && v.id <= 6 && !Save.data.ownedVehicles.includes(v.id));
  const pool = MYSTERY_PRIZES.filter(p => p.id !== 'vehicle' || unowned.length > 0);
  const total = pool.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of pool) { r -= p.weight; if (r <= 0) return p; }
  return pool[0];
}
function createMysteryBox() {
  const y = H * 0.18 + Math.random() * H * 0.62;
  return { x: W + 40, y, anim: Math.random() * Math.PI * 2, bob: 0, collected: false };
}
function applyPrize(prize) {
  if (prize.id.startsWith('coins')) {
    const n = parseInt(prize.id.replace('coins',''));
    sessionCoins += n;
    spawnParticles(player.x, player.y, '#FFD700', 12);
  } else if (prize.id.startsWith('ammo')) {
    const n = parseInt(prize.id.replace('ammo',''));
    const cap = maxAmmo();
    if (cap > 0) ammo = Math.min(cap, ammo + n);
    spawnParticles(player.x, player.y, '#ff7043', 8);
    updateShootBtn();
  } else if (prize.id === 'shield') {
    shieldHits = Math.min(shieldHits + 1, 5);
    spawnParticles(player.x, player.y, '#4CAF50', 12);
  } else if (prize.id === 'invincible') {
    player.invincible = 4;
    spawnParticles(player.x, player.y, '#E040FB', 16);
  } else if (prize.id === 'speedup') {
    speed *= 1.25;
    spawnParticles(player.x, player.y, '#00BCD4', 10);
  } else if (prize.id === 'vehicle') {
    const unowned = VEHICLES.filter(v => v.id >= 1 && v.id <= 6 && !Save.data.ownedVehicles.includes(v.id));
    if (unowned.length > 0) {
      const gift = unowned[Math.floor(Math.random() * unowned.length)];
      Save.data.ownedVehicles.push(gift.id);
      Save.save();
      spawnParticles(player.x, player.y, '#FFD700', 24);
      prize = { ...prize, label: gift.emoji + ' FREE ' + gift.name + '!' };
    }
  }
  Snd.play('mystery');
  popups.push({ text: prize.label, x: player.x, y: player.y - 30, alpha: 1, timer: 2.2, color: prize.color });
}

// ── ENEMIES ──────────────────────────────────────────────
function createEnemy() {
  const y = H * 0.15 + Math.random() * H * 0.65;
  const lvl = currentLevel;
  // Higher levels = more health, faster shooting
  return { x: W + 60, y, vy: 0, shootTimer: 2 + Math.random() * 2, hp: lvl >= 45 ? 2 : 1, anim: 0 };
}
function updateEnemies(dt) {
  // Spawn
  if (currentLevel >= 25) {
    enemyTimer -= dt;
    if (enemyTimer <= 0) {
      enemies.push(createEnemy());
      const minInterval = Math.max(6, 12 - (currentLevel - 25) * 0.15);
      enemyTimer = minInterval + Math.random() * 4;
    }
  }

  // Update enemies
  enemies = enemies.filter(en => {
    en.x -= speed * 0.6;
    en.anim += dt * 4;
    // Slight homing toward player y
    const dy = player.y - en.y;
    en.vy += Math.sign(dy) * 40 * dt;
    en.vy = Math.max(-60, Math.min(60, en.vy));
    en.y += en.vy * dt;

    // Shoot at player
    en.shootTimer -= dt;
    if (en.shootTimer <= 0) {
      const angle = Math.atan2(player.y - en.y, player.x - en.x);
      const spd = 280 + currentLevel * 2;
      enemyBullets.push({ x: en.x - 10, y: en.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, r: 5 });
      en.shootTimer = 1.8 + Math.random() * 1.5;
    }

    // Player cannon bullets destroy enemy
    bullets = bullets.filter(b => {
      const dx = b.x - en.x, dy = b.y - en.y;
      if (Math.sqrt(dx*dx+dy*dy) < 20) {
        en.hp--;
        spawnParticles(b.x, b.y, '#ff5722', 6);
        return false;
      }
      return true;
    });
    if (en.hp <= 0) {
      spawnParticles(en.x, en.y, '#ff5722', 14);
      sessionCoins += 3; // bonus coins for kill
      popups.push({ text:'+3 🪙', x:en.x, y:en.y-20, alpha:1, timer:1.2, color:'#FFD700' });
      return false;
    }
    return en.x > -60;
  });

  // Enemy bullets hit player
  enemyBullets = enemyBullets.filter(b => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (player.invincible <= 0) {
      const dx = player.x - b.x, dy = player.y - b.y;
      if (Math.sqrt(dx*dx+dy*dy) < b.r + 18) {
        if (VEHICLES[Save.data.activeVehicle].id === 8 && Math.random() < 0.5) return false; // Stealth perk
        handleHit();
        return false;
      }
    }
    return b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20;
  });
}

// ── COIN ─────────────────────────────────────────────────
// Coin value increases each biome (world)
const COIN_VALUES = [1, 2, 3, 5, 8, 12, 20]; // per biome 0-6
function coinValue() { return COIN_VALUES[Math.min(6, currentBiome)]; }

function spawnCoin() {
  const nextPillar = obstacles.find(o => o.type === 'pillar' && o.x > W * 0.5);
  let centerY = H * 0.5;
  let gapH = H * levelData.gapFraction;
  if (nextPillar) { centerY = nextPillar.gapY; gapH = nextPillar.gap; }
  centerY = Math.max(H * 0.22, Math.min(H * 0.75, centerY));
  const n = Math.random() < 0.4 ? 2 : 1;
  const spread = Math.min(gapH * 0.25, 22);
  const val = coinValue();
  for (let i = 0; i < n; i++) {
    const offsetY = (Math.random() - 0.5) * spread;
    coins.push({ x: W + 50 + i * 30, y: centerY + offsetY, r: 12, val, collected: false, anim: Math.random() * Math.PI * 2 });
  }
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
  if (lvl === 0 || ammo <= 0 || shootCooldown > 0 || currentLevel < 5) return;
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
  spawnParticles(player.x + 20, player.y, '#ff9800', 14);
  for (let i = 0; i < 8; i++) {
    const a = (Math.random() - 0.5) * Math.PI * 0.5;
    particles.push({ x: player.x + 24, y: player.y, vx: Math.cos(a) * (10 + Math.random() * 8), vy: Math.sin(a) * (4 + Math.random() * 4), life: 1, color: i % 2 === 0 ? '#FFD700' : '#FF6B35', r: 3 + Math.random() * 3 });
  }
  updateShootBtn();
}

function updateShootBtn() {
  // Shoot button is hidden — shooting is done via double-tap
  const btn = document.getElementById('shoot-btn');
  if (btn) btn.classList.add('hidden');
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
  obstacles = []; coins = []; ammoPickups = []; particles = []; bullets = []; mysteryBoxes = [];
  enemies = []; enemyBullets = []; popups = [];
  coinCombo = 0; comboTimer = 0; screenShake = 0; lastLightningTime = 0;
  spawnTimer = 1.5; coinTimer = 1.0; ammoTimer = 10 + Math.random() * 6;
  mysteryTimer = 15 + Math.random() * 10;
  enemyTimer = currentLevel >= 25 ? 8 + Math.random() * 6 : 99999;
  shootCooldown = 0; shootAutoTimer = 3;
  isHolding = false;

  const upg = Save.data.upgrades;
  shieldHits = upg.shield + (Save.data.activeVehicle === 7 ? 1 : 0); // Large Airliner perk
  speed = levelData.speed * VEHICLES[Save.data.activeVehicle].speed * (1 + upg.speed * 0.12);

  const cap = maxAmmo();
  ammo = cap > 0 ? Math.floor(cap * 0.5) : 0;

  player = createPlayer();
  landing = null;
  tutHints = [];
  tutPhase = 0;

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
    tutHints.push({ text: 'HOLD screen to fly UP!', x: W * 0.5, y: H * 0.5 - 60, alpha: 1, timer: 4 });
    tutPhase = 0;
  }

  updateHUD();
  updateShootBtn();
}

// ── UPDATE ───────────────────────────────────────────────
function update(dt) {
  // Slide animation runs even after player.alive = false
  if (landing && landing.sliding) { updateSlide(dt); return; }

  if (!player.alive) return;

  // Slide runway in — stops just past the player so they can fly onto it
  if (landing) {
    const targetRwX = player.x + 60;
    if (landing.runway.x > targetRwX) landing.runway.x -= Math.max(speed * 3, 12);
  }

  // Distance (calibrated: ~10-27 m/s depending on speed level)
  distance += speed * dt * 60 * 0.058;

  // Speed updates slightly in-level
  const upg = Save.data.upgrades;
  const veh = VEHICLES[Save.data.activeVehicle];
  speed = Math.min(levelData.speed * veh.speed * (1 + upg.speed * 0.12) + distance * 0.0002, levelData.speed * 1.4);

  // ── PHYSICS: hold screen = fly up, release = fall ──
  const ctrl      = veh.control * (1 + upg.control * 0.15);
  const gravity   = veh.id === 2 ? 260 : 520; // Drone perk: gravity halved
  const uplift    = 740;
  const maxFall   = 340;
  const maxRise   = -270 * Math.min(ctrl, 1.9);

  if (isHolding) {
    player.vy = Math.max(player.vy - uplift * ctrl * dt, maxRise);
  } else {
    // Momentum: at apex of sharp rise, apply reduced gravity for floaty feel
    const effectiveGravity = player.vy < -80 ? gravity * 0.4 : gravity;
    player.vy = Math.min(player.vy + effectiveGravity * dt, maxFall);
  }
  player.y += player.vy * dt;

  // Clamp to screen
  player.y = Math.max(player.h * 0.5, Math.min(H - player.h * 0.5, player.y));
  if (player.y <= player.h * 0.5 || player.y >= H - player.h * 0.5) player.vy = 0;

  // Trail
  player.trail.unshift({ x: player.x, y: player.y });
  if (player.trail.length > 12) player.trail.pop();

  if (player.invincible > 0) player.invincible -= dt;
  if (shootCooldown > 0) shootCooldown -= dt;
  if (screenShake > 0) screenShake = Math.max(0, screenShake - dt * 6);
  if (comboTimer > 0) { comboTimer -= dt; if (comboTimer <= 0) coinCombo = 0; }

  // Auto-fire level 3 cannon
  if (upg.cannon >= 3 && ammo > 0) {
    shootAutoTimer -= dt;
    if (shootAutoTimer <= 0) { shoot(); shootAutoTimer = 2.5; }
  } else if (veh.id === 9) {
    // B-2 Spirit perk: auto-fires every 4s without consuming ammo
    shootAutoTimer -= dt;
    if (shootAutoTimer <= 0) {
      const bulletVx = speed + 350;
      bullets.push({ x: player.x + 26, y: player.y - 5, vx: bulletVx, vy: -40, r: 6 });
      bullets.push({ x: player.x + 26, y: player.y + 5, vx: bulletVx, vy:  40, r: 6 });
      spawnParticles(player.x + 20, player.y, '#ff9800', 10);
      shootAutoTimer = 4;
    }
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
  if (coinTimer <= 0) { spawnCoin(); coinTimer = 2.0 + Math.random() * 2.0; }

  // Ammo crate spawn (only if cannon unlocked AND level 5+)
  if (upg.cannon > 0 && currentLevel >= 5) {
    ammoTimer -= dt;
    if (ammoTimer <= 0) {
      ammoPickups.push(createAmmoCrate());
      ammoTimer = 12 + Math.random() * 8;
    }
  }

  // Mystery box spawn (every 15–25s)
  mysteryTimer -= dt;
  if (mysteryTimer <= 0) {
    mysteryBoxes.push(createMysteryBox());
    mysteryTimer = 15 + Math.random() * 10;
  }

  const magnetRange = (80 + upg.magnet * 50) * (veh.id === 1 ? 1.4 : 1.0); // Upgraded Paper perk

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
        if (Math.sqrt(dx * dx + dy * dy) < 110) player.vy += obs.windForce * 100 * (veh.id === 4 ? 0.4 : 1.0) * dt; // Propeller perk
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
      const gain = Save.data.upgrades.cannon >= 2 ? 5 : 4;
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
      c.collected = true;
      const v = c.val || 1;
      coinCombo++;
      comboTimer = 3.0;
      const bonus = Math.floor(coinCombo / 3);
      const vehicleBonus = veh.id === 6 ? 2 : 0; // Small Airliner perk
      const earned = v + bonus + vehicleBonus;
      sessionCoins += earned;
      spawnParticles(c.x, c.y, '#FFD700', 5);
      Snd.play('coin');
      const popText = coinCombo >= 3 ? '+' + earned + ' ×' + coinCombo + '!' : '+' + earned;
      const popColor = coinCombo >= 5 ? '#FF6B35' : coinCombo >= 3 ? '#FFC200' : '#FFD700';
      popups.push({ text: popText, x: c.x, y: c.y - 18, alpha: 1, timer: 0.9, color: popColor });
      return false;
    }
    return c.x > -20;
  });

  // ── ENEMIES ──
  updateEnemies(dt);

  // ── MYSTERY BOXES ──
  mysteryBoxes = mysteryBoxes.filter(mb => {
    if (mb.collected) return false;
    mb.x -= speed * 0.5;
    mb.anim += dt * 3;
    mb.bob = Math.sin(mb.anim) * 6; // floating bob
    const dx = player.x - mb.x, dy = player.y - mb.y;
    if (Math.sqrt(dx*dx + dy*dy) < 38) {
      mb.collected = true;
      applyPrize(pickPrize());
      return false;
    }
    return mb.x > -50;
  });

  // ── POPUPS ──
  popups = popups.filter(p => {
    p.y -= 40 * dt;
    p.timer -= dt;
    p.alpha = Math.min(1, p.timer);
    return p.timer > 0;
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

  // ── SPAWN RUNWAY when goal is reached ──
  if (!landing && distance >= levelData.goal) {
    spawnTimer = 999; // stop obstacles
    const veh = VEHICLES[Save.data.activeVehicle];
    landing = {
      runway: { x: W + 200, y: H * 0.76, type: veh.landing },
      goalReached: true,
    };
    document.getElementById('shoot-btn').classList.add('hidden');
    Snd.play('landing_start');
  }

  // ── CHECK IF PLAYER LANDED ON RUNWAY ──
  checkLandingTouch();
}

function handleHit() {
  coinCombo = 0; comboTimer = 0;
  if (shieldHits > 0) {
    shieldHits--; player.invincible = 1.5;
    spawnParticles(player.x, player.y, '#4CAF50', 10);
    Snd.play('shield');
    return;
  }
  player.alive = false;
  spawnParticles(player.x, player.y, VEHICLES[Save.data.activeVehicle].color, 16);
  Snd.play('crash');
  setTimeout(showGameOver, 800);
}

function updateHUD() {
  const distM = Math.floor(distance);
  document.getElementById('hud-distance').textContent = distM + 'm';
  document.getElementById('hud-goal').textContent = '/ ' + levelData.goal + 'm';
  document.getElementById('hud-level').textContent = currentLevel;
  document.getElementById('hud-coins').textContent = Save.data.coins + sessionCoins;

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
function checkLandingTouch() {
  if (!landing || landing.sliding) return;
  const rw = landing.runway;
  if (rw.x > player.x + 120) return; // runway not close yet
  const landY = rw.y - 16;
  const dy = player.y - landY;
  if (Math.abs(dy) < 36) {
    // Start slide animation
    landing.sliding = true;
    landing.slideSpeed = speed + 2;
    player.vy = 0;
    screenShake = 0.5;
    Snd.play('land');
    spawnParticles(player.x, player.y, '#FFD700', 20);
  }
}

function updateSlide(dt) {
  if (!landing || !landing.sliding) return;
  const rw = landing.runway;
  const landY = rw.y - 16;
  // Snap plane to runway surface
  player.y += (landY - player.y) * 0.25;
  player.vy = 0;
  // Slide forward (plane moves right, decelerating)
  player.x += landing.slideSpeed * dt * 30;
  landing.slideSpeed *= 0.92; // decelerate (smoother, longer slide)
  // Emit dust particles while sliding
  if (Math.random() < 0.5) spawnParticles(player.x - 10, player.y + 12, '#ccccaa', 3);
  if (screenShake > 0.05) screenShake *= 0.95;
  // Done when nearly stopped
  if (landing.slideSpeed < 0.5) {
    landing.sliding = false;
    player.alive = false;
    setTimeout(showLevelComplete, 300);
  }
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
    // B-2 Spirit — flying wing with iconic W trailing edge
    // Main wing body (very dark gray)
    ctx.fillStyle = '#1c2526';
    ctx.beginPath();
    ctx.moveTo(30, 0);          // nose tip
    ctx.lineTo(10, -7);         // fuselage top
    ctx.lineTo(-2, -44);        // left wing tip (top in game = one wing)
    // W trailing edge (top half)
    ctx.lineTo(-16, -42);       // outer trailing
    ctx.lineTo(-24, -22);       // notch inward
    ctx.lineTo(-18, -14);       // notch peak
    ctx.lineTo(-28, -4);        // inner trailing
    ctx.lineTo(-30, 0);         // center trailing
    // Mirror bottom half
    ctx.lineTo(-28, 4);
    ctx.lineTo(-18, 14);
    ctx.lineTo(-24, 22);
    ctx.lineTo(-16, 42);
    ctx.lineTo(-2, 44);         // right wing tip
    ctx.lineTo(10, 7);
    ctx.closePath();
    ctx.fill();

    // Surface shading — lighter upper panel
    ctx.fillStyle = 'rgba(80,100,110,0.5)';
    ctx.beginPath();
    ctx.moveTo(30, 0); ctx.lineTo(10, -7); ctx.lineTo(-2, -44);
    ctx.lineTo(-16, -42); ctx.lineTo(-24, -22); ctx.lineTo(-18, -14);
    ctx.lineTo(-28, -4); ctx.lineTo(-30, 0); ctx.lineTo(10, -2);
    ctx.closePath(); ctx.fill();

    // Center fuselage hump
    ctx.fillStyle = '#2e3c43';
    ctx.beginPath(); ctx.ellipse(6, 0, 16, 5, 0, 0, Math.PI * 2); ctx.fill();

    // Cockpit window
    ctx.fillStyle = 'rgba(140,220,255,0.7)';
    ctx.beginPath(); ctx.ellipse(18, 0, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();

    // Leading edge highlight
    ctx.strokeStyle = 'rgba(150,200,220,0.25)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(30, 0); ctx.lineTo(10, -7); ctx.lineTo(-2, -44);
    ctx.moveTo(30, 0); ctx.lineTo(10, 7); ctx.lineTo(-2, 44);
    ctx.stroke();

    // Engine exhausts (2 on each side)
    [[-8,-10],[-8,10],[-14,-20],[-14,20]].forEach(([ex,ey]) => {
      ctx.fillStyle = 'rgba(255,120,30,0.6)';
      ctx.beginPath(); ctx.ellipse(ex, ey, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
    });
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
// Coin colors per biome
const COIN_COLORS = [
  ['#FFD700','#FFA000'], // Sky — gold
  ['#FF8C00','#E65100'], // Sunset — orange
  ['#B39DDB','#7E57C2'], // Night — purple
  ['#78909C','#455A64'], // Storm — steel
  ['#80DEEA','#00ACC1'], // Arctic — ice blue
  ['#FF7043','#BF360C'], // Canyon — copper
  ['#E040FB','#7B1FA2'], // Space — violet
];
function drawCoin(coin, t) {
  if (coin.collected) return;
  const val = coin.val || 1;
  const biome = Math.min(6, currentBiome);
  const [c1, c2] = COIN_COLORS[biome];
  ctx.save(); ctx.translate(coin.x, coin.y);
  const s = 0.9 + 0.1 * Math.sin(t * 3 + coin.anim); ctx.scale(s, s);
  // Glow
  const grd = ctx.createRadialGradient(0,0,0,0,0,coin.r*2);
  grd.addColorStop(0, c1 + '66'); grd.addColorStop(1, c1 + '00');
  ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(0,0,coin.r*2,0,Math.PI*2); ctx.fill();
  // Coin body
  ctx.fillStyle=c1; ctx.beginPath(); ctx.arc(0,0,coin.r,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=c2; ctx.beginPath(); ctx.arc(0,0,coin.r*0.72,0,Math.PI*2); ctx.fill();
  // Value text inside coin
  ctx.fillStyle=c1;
  const fs = val >= 10 ? coin.r*0.75 : coin.r*0.9;
  ctx.font=`bold ${fs}px Arial`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(val >= 10 ? val : '$', 0, 1);
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

// ── DRAW MYSTERY BOX ─────────────────────────────────────
function drawMysteryBox(mb) {
  ctx.save();
  ctx.translate(mb.x, mb.y + mb.bob);
  const t = mb.anim;
  // Pulsing glow (rainbow)
  const hue = (t * 60) % 360;
  const grd = ctx.createRadialGradient(0,0,0,0,0,30);
  grd.addColorStop(0, `hsla(${hue},100%,60%,0.35)`);
  grd.addColorStop(1, `hsla(${hue},100%,60%,0)`);
  ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2); ctx.fill();

  // Box body
  ctx.fillStyle = `hsl(${hue},80%,35%)`; ctx.beginPath(); ctx.roundRect(-16,-16,32,32,4); ctx.fill();
  // Ribbon horizontal
  ctx.fillStyle = `hsl(${(hue+40)%360},100%,60%)`; ctx.fillRect(-16,-5,32,10);
  // Ribbon vertical
  ctx.fillRect(-5,-16,10,32);
  // Lid
  ctx.fillStyle = `hsl(${hue},80%,45%)`; ctx.beginPath(); ctx.roundRect(-18,-20,36,8,3); ctx.fill();
  ctx.fillStyle = `hsl(${(hue+40)%360},100%,60%)`; ctx.fillRect(-5,-20,10,8);
  // Bow
  ctx.fillStyle = `hsl(${(hue+40)%360},100%,70%)`;
  ctx.beginPath(); ctx.ellipse(-8,-20,7,5,Math.PI/4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(8,-20,7,5,-Math.PI/4,0,Math.PI*2); ctx.fill();
  // Sparkle
  const sparkA = t * 2;
  [0,1,2,3].forEach(i => {
    const a = sparkA + i * Math.PI/2, r = 22 + Math.sin(t*3+i) * 4;
    ctx.fillStyle = `hsla(${(hue+i*60)%360},100%,80%,${0.5+0.5*Math.sin(t*4+i)})`;
    ctx.beginPath(); ctx.arc(Math.cos(a)*r, Math.sin(a)*r, 2.5, 0, Math.PI*2); ctx.fill();
  });
  // Question mark
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('?', 0, 1);
  ctx.restore();
}

// ── DRAW POPUP TEXT ───────────────────────────────────────
function drawPopups() {
  popups.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 4;
    ctx.strokeText(p.text, p.x, p.y);
    ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  });
}

// ── DRAW ENEMY ───────────────────────────────────────────
function drawEnemy(en) {
  ctx.save();
  ctx.translate(en.x, en.y);
  ctx.scale(-1, 1); // faces left
  // Glow
  const g = ctx.createRadialGradient(0,0,0,0,0,28);
  g.addColorStop(0,'rgba(255,50,50,0.3)'); g.addColorStop(1,'rgba(255,50,50,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,28,0,Math.PI*2); ctx.fill();
  // Body (red enemy plane)
  ctx.fillStyle='#b71c1c';
  ctx.beginPath(); ctx.moveTo(28,0); ctx.lineTo(-18,-10); ctx.lineTo(-8,0); ctx.lineTo(-18,10); ctx.closePath(); ctx.fill();
  // Wing
  ctx.fillStyle='#c62828';
  ctx.beginPath(); ctx.moveTo(4,0); ctx.lineTo(-16,-22); ctx.lineTo(-14,-8); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(4,0); ctx.lineTo(-16,22); ctx.lineTo(-14,8); ctx.closePath(); ctx.fill();
  // Cockpit
  ctx.fillStyle='rgba(255,200,0,0.8)'; ctx.beginPath(); ctx.ellipse(10,0,6,3,0,0,Math.PI*2); ctx.fill();
  // HP indicator
  if (en.hp >= 2) {
    ctx.fillStyle='#4CAF50'; ctx.fillRect(-8,-18,en.hp*7,4);
  }
  ctx.restore();
}
function drawEnemyBullets() {
  enemyBullets.forEach(b => {
    ctx.save();
    const g = ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*2.5);
    g.addColorStop(0,'rgba(255,80,0,1)'); g.addColorStop(1,'rgba(255,0,0,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*2.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff6600'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
    ctx.restore();
  });
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
  // ── ARROWS on runway in level 1 to guide player ──
  if (currentLevel === 1 && landing && landing.goalReached) {
    const arrowX = rw.x - 160;
    const arrowY = rw.y - 50;
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.005);
    ctx.save();
    ctx.globalAlpha = 0.6 + pulse * 0.4;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Three animated arrows pointing right toward the runway
    for (let i = 0; i < 3; i++) {
      const offset = ((Date.now() * 0.003 + i * 0.5) % 1) * 30;
      ctx.globalAlpha = (0.3 + (i / 3) * 0.7) * (0.6 + pulse * 0.4);
      ctx.fillText('▶', arrowX + i * 22 + offset, arrowY);
    }
    ctx.globalAlpha = 1;
    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('LAND HERE', rw.x - 60, rw.y - 30);
    ctx.restore();
  }

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

  // Lightning flash (Storm) — time-gated, max once per 2.5s
  const nowMs = Date.now();
  if (b.rain && Math.random() < 0.003 && nowMs - lastLightningTime > 2500) {
    lastLightningTime = nowMs;
    ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.fillRect(0,0,W,H);
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
  ctx.save();
  if (screenShake > 0.02) {
    ctx.translate((Math.random() - 0.5) * screenShake * 10, (Math.random() - 0.5) * screenShake * 10);
  }
  drawBackground(t);

  // Landing runway (behind everything else, above bg)
  if (landing && landing.runway) drawRunway(landing.runway);

  // Trail
  player.trail.forEach((pt, i) => {
    const alpha = (1 - i / player.trail.length) * 0.35;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, (1 - i/player.trail.length)*8, 0, Math.PI*2); ctx.fill();
  });

  // Coins, ammo, mystery boxes, bullets, enemies, obstacles
  coins.forEach(c => drawCoin(c, t));
  ammoPickups.forEach(ac => drawAmmoCrate(ac));
  mysteryBoxes.forEach(mb => drawMysteryBox(mb));
  bullets.forEach(b => drawBullet(b));
  enemies.forEach(en => drawEnemy(en));
  drawEnemyBullets();
  obstacles.forEach(o => drawObstacle(o));
  drawPopups();

  // Shield flash
  if (player.invincible > 0 && Math.floor(t*8)%2===0) {
    ctx.save(); ctx.translate(player.x, player.y);
    ctx.strokeStyle='rgba(100,255,100,0.8)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(0,0,36,0,Math.PI*2); ctx.stroke(); ctx.restore();
  }

  // Player — tilt from vertical velocity
  const tilt = Math.max(-0.70, Math.min(0.70, player.vy / 280));
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
    // No joystick arrow needed (hold-to-fly controls)
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

  // Tap-to-fly hint (subtle pulsing arc at bottom when not holding)
  if (gameState === 'playing' && !landing && !isHolding) {
    const pulse = 0.12 + 0.06 * Math.sin(Date.now() * 0.003);
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${pulse})`;
    ctx.lineWidth = 2;
    ctx.font = '11px Arial'; ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,255,255,${pulse * 1.5})`;
    ctx.fillText('HOLD TO FLY UP', W * 0.5, H - 18);
    ctx.restore();
  }

  // Combo indicator
  if (coinCombo >= 2 && comboTimer > 0) {
    const ca = Math.min(1, comboTimer * 1.5);
    const scale = 1 + Math.min(0.5, coinCombo * 0.05);
    const comboColor = coinCombo >= 10 ? '#FF4444' : coinCombo >= 5 ? '#FF6B35' : '#FFD700';
    ctx.save();
    ctx.globalAlpha = ca;
    ctx.translate(player.x, player.y - 55);
    ctx.scale(scale, scale);
    const fs = Math.min(26, 14 + coinCombo * 1.2);
    ctx.font = `bold ${fs}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 5;
    ctx.strokeText('COMBO ×' + coinCombo, 0, 0);
    ctx.fillStyle = comboColor;
    ctx.fillText('COMBO ×' + coinCombo, 0, 0);
    ctx.restore();
  }

  // Progress bar at very top
  if (levelData) {
    const pct = Math.min(1, distance / levelData.goal);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 0, W, 4);
    const barGrd = ctx.createLinearGradient(0,0,W,0);
    barGrd.addColorStop(0,'#4CAF50'); barGrd.addColorStop(1,'#8BC34A');
    ctx.fillStyle = barGrd; ctx.fillRect(0, 0, W * pct, 4);
  }

  ctx.restore(); // end screen shake
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
  Snd.stopMusic();
  document.getElementById('shoot-btn').classList.add('hidden');
  document.getElementById('menu-coins').textContent = Save.data.coins;
  document.getElementById('menu-level').textContent = t('lvl') + ' ' + Save.data.currentLevel;
  const prestige = Save.data.prestige || 0;
  const stars = prestige > 0 ? '⭐'.repeat(Math.min(prestige, 5)) + ' ' : '';
  document.getElementById('menu-best').textContent = stars + t('best') + ' ' + Save.data.bestLevel;
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
  Snd.startMusic();
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
  Snd.play('levelcomplete');

  // Advance level
  Save.data.coins += sessionCoins;
  if (!Save.data.tutorialDone) { Save.data.tutorialDone = true; }
  const isLast = currentLevel >= 70;
  if (isLast) {
    // PRESTIGE — reset to level 1, keep everything, earn a star
    Save.data.prestige = (Save.data.prestige || 0) + 1;
    Save.data.currentLevel = 1;
  } else {
    Save.data.currentLevel = currentLevel + 1;
  }
  if (currentLevel > Save.data.bestLevel) Save.data.bestLevel = currentLevel;

  // Personal best per level
  const distM = Math.floor(distance);
  if (!Save.data.levelBests) Save.data.levelBests = {};
  const prevBest = Save.data.levelBests[currentLevel] || 0;
  const isNewPB = distM > prevBest;
  if (isNewPB) Save.data.levelBests[currentLevel] = distM;

  Save.save();

  document.getElementById('lc-level').textContent = currentLevel;
  document.getElementById('lc-distance').textContent = distM + 'm';
  document.getElementById('lc-coins').textContent = '+' + sessionCoins;

  // Bravo line — show PB or prestige or well done
  const bravoEl = document.getElementById('lc-bravo');
  if (isLast) {
    bravoEl.textContent = '⭐ PRESTIGE ' + Save.data.prestige + ' UNLOCKED! ⭐';
  } else if (isNewPB) {
    bravoEl.textContent = '🏆 NEW BEST: ' + distM + 'm!';
  } else {
    bravoEl.textContent = t('wellDone');
  }

  document.getElementById('nextLevelBtn').textContent = isLast
    ? '⭐ ASCEND (RESTART) ›'
    : t('levelsTitle') + ' ' + (currentLevel + 1) + ' ›';

  // If entering new biome, show banner text on complete screen
  const nextLevel = isLast ? 1 : currentLevel + 1;
  const newBiome = LEVELS[nextLevel - 1]?.biome;
  const bioLabel = document.getElementById('lc-biome');
  if (!isLast && nextLevel % 10 === 1 && newBiome !== currentBiome) {
    bioLabel.textContent = '→ ' + BIOMES[newBiome].name.toUpperCase() + ' ZONE — coins worth ' + COIN_VALUES[newBiome] + '× each!';
    bioLabel.classList.remove('hidden');
  } else if (isLast) {
    bioLabel.textContent = '🌟 You completed all 70 levels! Starting prestige run...';
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

// ── LEVEL SELECT ──────────────────────────────────────────
const WORLD_EMOJIS  = ['☀️','🌅','🌙','⛈️','🏔️','🏜️','🚀'];
const WORLD_COLORS  = [
  'rgba(58,143,194,0.55)',  // Sky
  'rgba(192,74,32,0.55)',   // Sunset
  'rgba(13,13,56,0.75)',    // Night
  'rgba(26,32,48,0.75)',    // Storm
  'rgba(156,212,239,0.4)',  // Arctic
  'rgba(138,62,16,0.6)',    // Canyon
  'rgba(6,0,42,0.85)',      // Space
];

function showLevelSelect() {
  document.getElementById('levels-current').textContent = Save.data.currentLevel;
  renderLevelSelect();
  showScreen('screen-levels');
}

function renderLevelSelect() {
  const current = Save.data.currentLevel;
  const container = document.getElementById('worlds-container');

  container.innerHTML = BIOMES.map((biome, wi) => {
    const worldLevels = LEVELS.slice(wi * 10, wi * 10 + 10);
    const color = WORLD_COLORS[wi];

    const bubbles = worldLevels.map(lv => {
      const done    = lv.id < current;
      const active  = lv.id === current;

      const pb = Save.data.levelBests && Save.data.levelBests[lv.id];
      const pbStr = pb ? ` title="Level ${lv.id} — Best: ${pb}m"` : ` title="Level ${lv.id}"`;
      if (done) {
        return `<div class="lv-bubble done"${pbStr} onclick="startLevelFromSelect(${lv.id})">✓${pb ? '<span class="lv-pb">'+pb+'m</span>' : ''}</div>`;
      } else if (active) {
        return `<div class="lv-bubble current"${pbStr} onclick="startLevelFromSelect(${lv.id})">${lv.id}</div>`;
      } else {
        // All future levels unlocked for inspection
        return `<div class="lv-bubble" style="opacity:0.7" title="Level ${lv.id}" onclick="startLevelFromSelect(${lv.id})">${lv.id}</div>`;
      }
    }).join('');

    return `
      <div class="world-section">
        <div class="world-header" style="background:${color}">
          <span class="world-emoji">${WORLD_EMOJIS[wi]}</span>
          <span class="world-name">${biome.name.toUpperCase()}</span>
          <span class="world-range">${wi*10+1}–${wi*10+10}</span>
        </div>
        <div class="world-bubbles">${bubbles}</div>
      </div>`;
  }).join('');
}

function startLevelFromSelect(lvlId) {
  Save.data.currentLevel = lvlId;
  Save.save();
  beginLevel(lvlId);
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
    return `<div class="vehicle-card ${cls}" onclick="selectVehicle(${v.id})"><div class="vc-icon">${v.emoji}</div><div class="vc-name">${v.name}</div><div class="vc-perk">${v.perk}</div>${bottom}</div>`;
  }).join('');

  document.getElementById('upgrades-list').innerHTML = UPGRADES.map(upg => {
    const level = Save.data.upgrades[upg.id];
    const maxed = level >= upg.maxLevel;
    const cost = maxed ? 0 : upg.costs[level];
    const pct = (level / upg.maxLevel) * 100;
    const descExtra = upg.id === 'speed' && level > 0 ? ` — +${level*12}% speed now` :
                      upg.id === 'control' && level > 0 ? ` — +${level*15}% control now` : '';
    return `<div class="upgrade-row" onclick="buyUpgrade('${upg.id}')">
      <div class="up-icon">${upg.icon}</div>
      <div class="up-info">
        <div class="up-name">${upg.name} <span style="color:rgba(255,255,255,0.4);font-size:12px">Lv ${level}/${upg.maxLevel}</span></div>
        <div class="up-desc">${upg.desc}${descExtra}</div>
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
      Save.save(); renderShop(); Snd.play('buy');
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
    Save.save(); renderShop(); Snd.play('buy');
  }
}

// ── INPUT ─────────────────────────────────────────────────
function setupTouch() {
  const gc = document.getElementById('screen-game');

  // Hold anywhere on screen = fly up; double-tap = shoot (level 5+)
  let lastTapTime = 0;
  gc.addEventListener('touchstart', e => {
    e.preventDefault();
    isHolding = true;
    const now = Date.now();
    if (now - lastTapTime < 280) {
      shoot();
      lastTapTime = 0;
    } else {
      lastTapTime = now;
    }
  }, { passive: false });
  gc.addEventListener('touchend',    () => { isHolding = false; });
  gc.addEventListener('touchcancel', () => { isHolding = false; });

  // Mouse (desktop): hold = fly up, double-click = shoot
  gc.addEventListener('mousedown',  () => { isHolding = true; });
  gc.addEventListener('mouseup',    () => { isHolding = false; });
  gc.addEventListener('mouseleave', () => { isHolding = false; });
  gc.addEventListener('dblclick',   () => { shoot(); });

  // Shoot button hidden (double-tap used instead)
  document.getElementById('shoot-btn').classList.add('hidden');
}

// ── AUDIO ─────────────────────────────────────────────────
const Snd = (() => {
  let ctx = null;
  let musicNode = null;
  let musicGain = null;
  let musicPlaying = false;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function play(type) {
    try {
      const ac = getCtx();
      if (ac.state === 'suspended') ac.resume();
      if (type === 'coin') {
        // quick ascending ding
        [660, 880, 1100].forEach((freq, i) => {
          const o = ac.createOscillator(), g = ac.createGain();
          o.connect(g); g.connect(ac.destination);
          o.frequency.value = freq;
          o.type = 'sine';
          const t = ac.currentTime + i * 0.06;
          g.gain.setValueAtTime(0.18, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          o.start(t); o.stop(t + 0.13);
        });
      } else if (type === 'land') {
        // thud + success chime
        const o = ac.createOscillator(), g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.type = 'sine'; o.frequency.setValueAtTime(220, ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.3);
        g.gain.setValueAtTime(0.5, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
        o.start(); o.stop(ac.currentTime + 0.36);
        // chime
        [523, 659, 784, 1047].forEach((freq, i) => {
          const o2 = ac.createOscillator(), g2 = ac.createGain();
          o2.connect(g2); g2.connect(ac.destination);
          o2.frequency.value = freq; o2.type = 'sine';
          const t = ac.currentTime + 0.2 + i * 0.1;
          g2.gain.setValueAtTime(0.15, t);
          g2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          o2.start(t); o2.stop(t + 0.26);
        });
      } else if (type === 'landing_start') {
        // whoosh
        const bufLen = ac.sampleRate * 0.4;
        const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
        const src = ac.createBufferSource();
        const filt = ac.createBiquadFilter();
        const g = ac.createGain();
        src.buffer = buf; filt.type = 'bandpass'; filt.frequency.value = 1200;
        src.connect(filt); filt.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.3, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
        src.start(); src.stop(ac.currentTime + 0.41);
      } else if (type === 'crash') {
        // explosion thud + noise burst
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(180, ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(40, ac.currentTime + 0.5);
        o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.6, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
        o.start(); o.stop(ac.currentTime + 0.51);
        // noise burst
        const nLen = ac.sampleRate * 0.35;
        const nBuf = ac.createBuffer(1, nLen, ac.sampleRate);
        const nd = nBuf.getChannelData(0);
        for (let i = 0; i < nLen; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nLen) * 0.8;
        const ns = ac.createBufferSource(), ng = ac.createGain();
        ns.buffer = nBuf; ns.connect(ng); ng.connect(ac.destination);
        ng.gain.setValueAtTime(0.5, ac.currentTime);
        ng.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
        ns.start(); ns.stop(ac.currentTime + 0.36);
      } else if (type === 'shield') {
        // metallic clang
        [320, 640, 1280].forEach((freq, i) => {
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = 'sine'; o.frequency.value = freq;
          o.connect(g); g.connect(ac.destination);
          const t = ac.currentTime + i * 0.02;
          g.gain.setValueAtTime(0.2, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          o.start(t); o.stop(t + 0.31);
        });
      } else if (type === 'mystery') {
        // magical sparkle arpeggio
        [523,659,784,1047,1319].forEach((freq, i) => {
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = 'sine'; o.frequency.value = freq;
          o.connect(g); g.connect(ac.destination);
          const t = ac.currentTime + i * 0.07;
          g.gain.setValueAtTime(0.18, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          o.start(t); o.stop(t + 0.26);
        });
      } else if (type === 'levelcomplete') {
        // Happy fanfare: quick ascending run then triumphant chord
        const fanfare = [
          [523, 0.00, 0.10], [659, 0.10, 0.10], [784, 0.20, 0.10],
          [1047,0.30, 0.18], [0,   0.48, 0.04],
          [784, 0.52, 0.12], [1047,0.64, 0.12], [1319,0.76, 0.30],
        ];
        fanfare.forEach(([freq, start, dur]) => {
          if (!freq) return;
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = 'triangle'; o.frequency.value = freq;
          o.connect(g); g.connect(ac.destination);
          const t = ac.currentTime + start;
          g.gain.setValueAtTime(0.28, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + dur);
          o.start(t); o.stop(t + dur + 0.01);
        });
        // Harmony layer (lower octave, softer)
        [[392,0.30],[523,0.52],[659,0.76]].forEach(([freq, start]) => {
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = 'sine'; o.frequency.value = freq;
          o.connect(g); g.connect(ac.destination);
          const t = ac.currentTime + start;
          g.gain.setValueAtTime(0.12, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          o.start(t); o.stop(t + 0.36);
        });
      } else if (type === 'buy') {
        // Happy ascending chime for purchase
        [523, 784, 1047].forEach((freq, i) => {
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = 'sine'; o.frequency.value = freq;
          o.connect(g); g.connect(ac.destination);
          const t = ac.currentTime + i * 0.09;
          g.gain.setValueAtTime(0.25, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          o.start(t); o.stop(t + 0.23);
        });
      }
    } catch(e) {}
  }

  // Simple looping background music using oscillators
  // Upbeat chiptune — two-voice melody + bass arpeggio
  const MELODY = [
    // Phrase A — bright & bouncy
    [659,0.15],[0,0.05],[784,0.15],[0,0.05],[880,0.2],[0,0.05],
    [784,0.15],[0,0.05],[740,0.15],[0,0.05],[659,0.25],[0,0.1],
    [587,0.15],[0,0.05],[659,0.15],[0,0.05],[784,0.3],[0,0.1],
    // Phrase B — energetic climb
    [523,0.12],[587,0.12],[659,0.12],[698,0.12],[784,0.25],[0,0.1],
    [880,0.12],[0,0.05],[784,0.12],[0,0.05],[698,0.12],[0,0.05],[659,0.3],[0,0.1],
    // Phrase C — fun descend
    [784,0.2],[659,0.15],[587,0.15],[523,0.2],[0,0.08],
    [587,0.15],[659,0.15],[784,0.2],[880,0.15],[0,0.05],[988,0.3],[0,0.15],
    // Turnaround
    [880,0.12],[784,0.12],[698,0.12],[659,0.12],[587,0.12],[523,0.12],[494,0.25],[0,0.2],
  ];

  function startMusic() {
    if (musicPlaying) return;
    try {
      const ac = getCtx();
      if (ac.state === 'suspended') ac.resume();
      musicGain = ac.createGain();
      musicGain.gain.value = 0.06;
      musicGain.connect(ac.destination);
      musicPlaying = true;
      let t = ac.currentTime + 0.1;
      const loopLen = MELODY.reduce((s,[,d])=>s+d, 0);
      function scheduleLoop() {
        if (!musicPlaying) return;
        // Guard: if tab was throttled/hidden, t may have fallen behind current time
        if (t < ac.currentTime) t = ac.currentTime + 0.05;
        MELODY.forEach(([freq, dur]) => {
          if (freq > 0) {
            const o = ac.createOscillator(), g = ac.createGain();
            o.type = 'triangle'; o.frequency.value = freq;
            o.connect(g); g.connect(musicGain);
            g.gain.setValueAtTime(0.4, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + dur - 0.01);
            o.start(t); o.stop(t + dur);
          }
          t += dur;
        });
        // Schedule next call based on audio clock (not wall clock) to prevent drift
        setTimeout(scheduleLoop, Math.max(100, (t - 0.5 - ac.currentTime) * 1000));
      }
      scheduleLoop();
    } catch(e) {}
  }

  function stopMusic() {
    musicPlaying = false;
    if (musicGain) { musicGain.gain.setValueAtTime(musicGain.gain.value, 0); musicGain = null; }
  }

  return { play, startMusic, stopMusic };
})();

// ── INIT ─────────────────────────────────────────────────
window.addEventListener('load', () => {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  W = canvas.offsetWidth; H = canvas.offsetHeight;
  canvas.width = W; canvas.height = H;

  Save.load();
  setupTouch();

  document.getElementById('playBtn').addEventListener('click', startGame);
  document.getElementById('levelsBtn').addEventListener('click', showLevelSelect);
  document.getElementById('levelsBackBtn').addEventListener('click', showMenu);
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
    }
  });

  // Save on tab close / background (pagehide is most reliable on mobile/iOS)
  window.addEventListener('beforeunload', () => Save.save());
  window.addEventListener('pagehide', () => Save.save());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') Save.save();
  });

  // Auto-save every 5 seconds
  setInterval(() => { if (Save.data) Save.save(); }, 5000);

  initLangSelector();
  applyLang();
  showMenu();
});
