'use strict';
// ═══════════════════════════════════════════════════════
//  PAPER FLIGHT EVOLUTION — complete rewrite with levels
// ═══════════════════════════════════════════════════════

// ── BOSS LEVELS (last level of every world) ──────────────
const BOSS_LEVELS = new Set([10, 20, 30, 40, 50, 60, 70]);
const BOSS_NAMES  = ['GUARDIAN','FIRE DEMON','SHADOW LORD','STEEL TITAN','ICE GIANT','SAND BEAST','VOID EMPEROR'];
const BOSS_COLORS = [
  ['#4CAF50','#1B5E20'], // Sky
  ['#FF5722','#BF360C'], // Sunset
  ['#7C4DFF','#311B92'], // Night
  ['#607D8B','#263238'], // Storm
  ['#00BCD4','#006064'], // Arctic
  ['#FF9800','#E65100'], // Canyon
  ['#E040FB','#4A148C'], // Space
];

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
      speed:        (3 + t * 6) * 0.88,                           // 2.64 → 7.92 px/frame (-12%)
      gapFraction:  (0.42 - t * 0.15) * 1.12,                    // 0.47 → 0.30 H (+12% gap)
      spawnInterval:Math.max(0.65, (2.0 - t * 1.35) * 1.12),     // 2.24 → 0.73 s (+12% interval)
      fanChance:    i < 10 ? 0 : Math.min(0.25, (i - 10) * 0.018),
      birdChance:   i < 20 ? 0 : Math.min(0.25, (i - 20) * 0.015),
    };
  });
}
const LEVELS = generateLevels();

// ── VEHICLES ─────────────────────────────────────────────
const VEHICLES = [
  { id:0, name:'Paper Plane',     emoji:'✉️',  cost:0,     levelReq:1,  speed:1.0,  control:1.0,  color:'#ffffff', landing:'strip',    perk:'Standard all-rounder'                          },
  { id:1, name:'Upgraded Paper',  emoji:'📄',  cost:135,   levelReq:3,  speed:1.15, control:1.1,  color:'#e3f2fd', landing:'strip',    perk:'🧲 Coin magnet range +40%'                     },
  { id:2, name:'Drone',           emoji:'🚁',  cost:360,   levelReq:7,  speed:0.95, control:1.1,  color:'#90caf9', landing:'helipad',  perk:'🎯 Precise hover — gravity halved'              },
  { id:3, name:'Light Plane',     emoji:'🛩️', cost:810,   levelReq:12, speed:1.3,  control:1.2,  color:'#4fc3f7', landing:'runway',   perk:'⚡ Aerobatic — tighter turns'                   },
  { id:4, name:'Propeller Plane', emoji:'✈️',  cost:1620,  levelReq:18, speed:1.5,  control:1.15, color:'#ffd54f', landing:'runway',   perk:'💨 Fan gusts reduced by 60%'                   },
  { id:5, name:'Rocket',          emoji:'🚀',  cost:2880,  levelReq:25, speed:2.0,  control:0.85, color:'#ff7043', landing:'pad',      perk:'🔥 Fire trail — hold for speed burst'           },
  { id:6, name:'Small Airliner',  emoji:'🛫',  cost:4500,  levelReq:32, speed:1.7,  control:1.0,  color:'#ce93d8', landing:'airport',  perk:'🪙 Every coin worth +2 bonus'                  },
  { id:7, name:'Large Airliner',  emoji:'🛬',  cost:7200,  levelReq:40, speed:1.9,  control:0.9,  color:'#b39ddb', landing:'airport',  perk:'🛡 Starts each level with +1 free shield'      },
  { id:8, name:'Stealth Plane',   emoji:'🌑',  cost:10800, levelReq:50, speed:2.3,  control:1.2,  color:'#546e7a', landing:'military', perk:'👻 Enemy missiles 50% miss chance'             },
  { id:9, name:'Super Airflight',      emoji:'🛸',  cost:16200, levelReq:60, speed:2.6,  control:1.3,  color:'#37474f', landing:'military', perk:'🔫 Auto-fires cannon every 4s (no ammo needed)'},
];

// ── TRAIL SKINS ──────────────────────────────────────────
const TRAIL_SKINS = [
  { id:0, name:'Default',    emoji:'✖️',  cost:0,  currency:'coins',    colors:[] },
  { id:1, name:'Sparkle',    emoji:'✨',  cost:300,  currency:'coins',    colors:['#FFD700','#FFF9C4','#FFFFFF'] },
  { id:2, name:'Rainbow',    emoji:'🌈',  cost:500,  currency:'coins',    colors:['#FF4444','#FF8C00','#FFD700','#4CAF50','#2196F3','#9C27B0'] },
  { id:3, name:'Sunray',     emoji:'☀️',  cost:800,  currency:'coins',    colors:['#FFD700','#FF8C00','#FFEE58'] },
  { id:4, name:'Ice',        emoji:'❄️',  cost:1200, currency:'coins',    colors:['#B3E5FC','#E1F5FE','#80D8FF'] },
  { id:5, name:'Lightning',  emoji:'⚡',  cost:5,    currency:'diamonds', colors:['#FFD700','#FFFDE7','#80D8FF'] },
  { id:6, name:'Fire',       emoji:'🔥',  cost:8,    currency:'diamonds', colors:['#FF5722','#FF9800','#FFD700'] },
  { id:7, name:'Wave',       emoji:'🌊',  cost:10,   currency:'diamonds', colors:['#0288D1','#29B6F6','#B3E5FC'] },
  { id:8, name:'Neon',       emoji:'👾',  cost:15,   currency:'diamonds', colors:['#FF4081','#7C4DFF','#00E5FF'] },
];

// ── UPGRADES ─────────────────────────────────────────────
const UPGRADES = [
  { id:'control', name:'Better Control', icon:'🎯', desc:'Smoother joystick response',      maxLevel:5, costs:[60,120,220,400,750]  },
  { id:'magnet',  name:'Coin Magnet',    icon:'🧲', desc:'Attract nearby coins',            maxLevel:4, costs:[100,200,400,800]     },
  { id:'shield',  name:'Shield',         icon:'🛡', desc:'Extra hit before crashing',       maxLevel:3, costs:[400,800,1500]        },
  { id:'cannon',  name:'Cannon',         icon:'🔫', desc:'Unlocks ammo pickups & shooting', maxLevel:3, costs:[150,300,600], levelReq:3 },
];

// ── LANGUAGES ────────────────────────────────────────────
const LANGS = {
  en: { name:'English', flag:'🇬🇧', dir:'ltr', t:{
    play:'PLAY', levelsBtn:'🗺️ LEVELS', upgradesMenu:'⚙️ UPGRADES', upgradesBtn:'🔧 UPGRADES',
    upgradesTitle:'UPGRADES', upgradesSec:'UPGRADES', levelsTitle:'LEVELS',
    level:'LEVEL', distance:'DISTANCE', ammo:'AMMO', coins:'COINS',
    crashed:'CRASHED!', tryAgain:'NEW GAME', menu:'MENU', newGame:'NEW GAME', continueGame:'CONTINUE', watchAd:'WATCH AD',
    levelComplete:'LEVEL COMPLETE!', vehicles:'VEHICLES',
    howToPlay:'HOW TO PLAY', letsFly:"LET'S FLY!", wellDone:'⭐ WELL DONE! ⭐',
    lvl:'LVL', best:'BEST', playAgain:'PLAY AGAIN',
    tut1:'<b>Hold</b> the screen to fly up — <b>release</b> to fall down',
    tut2:"Fly through the <b>gaps</b> in the pillars — don't crash!",
    tut3:'Collect <b>ammo boxes</b> to charge your cannon (buy Cannon in Upgrades)',
    tut4:'Grab <b>coins</b> to spend on vehicles and upgrades',
    tut5:'Reach the <b>distance goal</b> — then fly onto the <b>runway</b> to land!',
    vn0:'Paper Plane', vn1:'Upgraded Paper', vn2:'Drone', vn3:'Light Plane',
    vn4:'Propeller Plane', vn5:'Rocket', vn6:'Small Airliner', vn7:'Large Airliner',
    vn8:'Stealth Plane', vn9:'Super Airflight',
    vp0:'Standard all-rounder',
    vp1:'🧲 Coin magnet range +40%',
    vp2:'🎯 Ultra-precise hover — gravity halved',
    vp3:'⚡ Aerobatic — tighter turns',
    vp4:'💨 Fan gusts reduced by 60%',
    vp5:'🔥 Fire trail — hold for speed burst',
    vp6:'🪙 Every coin worth +2 bonus',
    vp7:'🛡 Starts each level with +1 free shield',
    vp8:'👻 Enemy missiles 50% miss chance',
    vp9:'🔫 Auto-fires cannon every 4s (no ammo needed)',
    un_speed:'Engine Boost', un_control:'Better Control', un_magnet:'Coin Magnet',
    un_shield:'Shield', un_cannon:'Cannon',
    ud_speed:'Increases base speed',
    ud_control:'Smoother flight response',
    ud_magnet:'Attract nearby coins',
    ud_shield:'Extra hit before crashing',
    ud_cannon:'Unlocks ammo pickups & shooting',
    bm0:'Sky', bm1:'Sunset', bm2:'Night', bm3:'Storm', bm4:'Arctic', bm5:'Canyon', bm6:'Space',
    holdUp:'HOLD TO FLY UP',
    comboText:'COMBO',
    newBest:'🏆 NEW BEST',
    prestigeText:'⭐ PRESTIGE {0} UNLOCKED! ⭐',
    nextLevelText:'NEXT LEVEL',
    ascendText:'⭐ ASCEND (RESTART)',
    enteringZone:'ENTERING {0} ZONE',
    coinsWorthText:'→ {0} ZONE — coins worth {1}× each!',
    allCompleteText:'🌟 You completed all 70 levels! Starting prestige run...',
    landHere:'LAND HERE',
    shieldPickupText:'🛡 +SHIELD!',
    active:'ACTIVE', owned:'OWNED',
  }},
  it: { name:'Italiano', flag:'🇮🇹', dir:'ltr', t:{
    play:'GIOCA', levelsBtn:'🗺️ LIVELLI', upgradesMenu:'⚙️ MIGLIORIE', upgradesBtn:'🔧 MIGLIORIE',
    upgradesTitle:'MIGLIORIE', upgradesSec:'MIGLIORIE', levelsTitle:'LIVELLI',
    level:'LIVELLO', distance:'DISTANZA', ammo:'MUNIZIONI', coins:'MONETE',
    crashed:'SCHIANTO!', tryAgain:'NUOVA PARTITA', menu:'MENU', newGame:'NUOVA PARTITA', continueGame:'CONTINUA', watchAd:'GUARDA ANNUNCIO',
    levelComplete:'LIVELLO COMPLETATO!', vehicles:'VEICOLI',
    howToPlay:'COME GIOCARE', letsFly:'VOLIAMO!', wellDone:'⭐ OTTIMO! ⭐',
    lvl:'LIV', best:'RECORD', playAgain:'ANCORA',
    tut1:'<b>Tieni premuto</b> per salire — <b>rilascia</b> per scendere',
    tut2:'Vola attraverso i <b>varchi</b> nei pilastri — non schiantarti!',
    tut3:'Raccogli <b>munizioni</b> per il cannone (acquista in Migliorie)',
    tut4:'Prendi le <b>monete</b> per veicoli e migliorie',
    tut5:'Raggiungi la <b>meta</b> — poi atterra sulla <b>pista</b>!',
    vn0:'Aereo di carta', vn1:'Carta migliorata', vn2:'Drone', vn3:'Aereo leggero',
    vn4:'Aereo a elica', vn5:'Razzo', vn6:'Piccolo aereo', vn7:'Grande aereo',
    vn8:'Aereo stealth', vn9:'Super Airflight',
    vp0:'Tuttotondo standard',
    vp1:'🧲 Portata calamita +40%',
    vp2:'🎯 Volo ultra-preciso — gravità dimezzata',
    vp3:'⚡ Acrobatico — virate più strette',
    vp4:'💨 Raffiche ventilatore ridotte del 60%',
    vp5:'🔥 Scia di fuoco — tieni premuto per accelerare',
    vp6:'🪙 Ogni moneta vale +2 bonus',
    vp7:'🛡 Inizia ogni livello con +1 scudo gratuito',
    vp8:'👻 I missili nemici mancano il 50% delle volte',
    vp9:'🔫 Spara automaticamente ogni 4s (senza munizioni)',
    un_speed:'Potenziamento motore', un_control:'Controllo migliore', un_magnet:'Calamita monete',
    un_shield:'Scudo', un_cannon:'Cannone',
    ud_speed:'Aumenta la velocità base',
    ud_control:'Risposta di volo più fluida',
    ud_magnet:'Attira le monete vicine',
    ud_shield:'Colpo extra prima di schiantarsi',
    ud_cannon:'Sblocca munizioni e sparo',
    bm0:'Cielo', bm1:'Tramonto', bm2:'Notte', bm3:'Tempesta', bm4:'Artico', bm5:'Canyon', bm6:'Spazio',
    holdUp:'TIENI PER SALIRE',
    comboText:'COMBO',
    newBest:'🏆 NUOVO RECORD',
    prestigeText:'⭐ PRESTIGIO {0} SBLOCCATO! ⭐',
    nextLevelText:'LIVELLO SUCCESSIVO',
    ascendText:'⭐ ASCENDI (RICOMINCIA)',
    enteringZone:'ENTRANDO ZONA {0}',
    coinsWorthText:'→ Zona {0} — monete valgono {1}× ciascuna!',
    allCompleteText:'🌟 Hai completato tutti i 70 livelli! Inizia il giro prestigio...',
    landHere:'ATTERRA QUI',
    shieldPickupText:'🛡 +SCUDO!',
  }},
  fr: { name:'Français', flag:'🇫🇷', dir:'ltr', t:{
    play:'JOUER', levelsBtn:'🗺️ NIVEAUX', upgradesMenu:'⚙️ AMÉLIORATIONS', upgradesBtn:'🔧 AMÉLIORATIONS',
    upgradesTitle:'AMÉLIORATIONS', upgradesSec:'AMÉLIORATIONS', levelsTitle:'NIVEAUX',
    level:'NIVEAU', distance:'DISTANCE', ammo:'MUNITIONS', coins:'PIÈCES',
    crashed:'CRASH !', tryAgain:'NOUVELLE PARTIE', menu:'MENU', newGame:'NOUVELLE PARTIE', continueGame:'CONTINUER', watchAd:'VOIR PUB',
    levelComplete:'NIVEAU TERMINÉ!', vehicles:'VÉHICULES',
    howToPlay:'COMMENT JOUER', letsFly:'ON VOLE!', wellDone:'⭐ BRAVO! ⭐',
    lvl:'NIV', best:'RECORD', playAgain:'REJOUER',
    tut1:"<b>Maintenez</b> l'écran pour monter — <b>relâchez</b> pour descendre",
    tut2:'Volez à travers les <b>espaces</b> dans les piliers — sans crasher!',
    tut3:"Collectez des <b>munitions</b> pour le canon (acheter dans Améliorations)",
    tut4:'Prenez les <b>pièces</b> pour les véhicules et améliorations',
    tut5:'Atteignez la <b>distance</b> — puis atterrissez sur la <b>piste</b>!',
    vn0:'Avion en papier', vn1:'Papier amélioré', vn2:'Drone', vn3:'Avion léger',
    vn4:'Avion à hélice', vn5:'Fusée', vn6:'Petit avion', vn7:'Grand avion',
    vn8:'Avion furtif', vn9:'Super Airflight',
    vp0:'Polyvalent standard',
    vp1:'🧲 Portée aimant +40%',
    vp2:'🎯 Vol ultra-précis — gravité réduite de moitié',
    vp3:'⚡ Aérobatique — virages plus serrés',
    vp4:'💨 Rafales ventilateur réduites de 60%',
    vp5:'🔥 Traînée de feu — maintenir pour accélérer',
    vp6:'🪙 Chaque pièce vaut +2 bonus',
    vp7:'🛡 Commence chaque niveau avec +1 bouclier gratuit',
    vp8:'👻 Les missiles ennemis ratent 50% du temps',
    vp9:'🔫 Tire automatiquement toutes les 4s (sans munitions)',
    un_speed:'Boost moteur', un_control:'Meilleur contrôle', un_magnet:'Aimant à pièces',
    un_shield:'Bouclier', un_cannon:'Canon',
    ud_speed:'Augmente la vitesse de base',
    ud_control:'Réponse de vol plus fluide',
    ud_magnet:'Attire les pièces proches',
    ud_shield:'Un coup supplémentaire avant le crash',
    ud_cannon:'Débloque munitions et tir',
    bm0:'Ciel', bm1:'Coucher de soleil', bm2:'Nuit', bm3:'Tempête', bm4:'Arctique', bm5:'Canyon', bm6:'Espace',
    holdUp:'MAINTENIR POUR MONTER',
    comboText:'COMBO',
    newBest:'🏆 NOUVEAU RECORD',
    prestigeText:'⭐ PRESTIGE {0} DÉBLOQUÉ! ⭐',
    nextLevelText:'NIVEAU SUIVANT',
    ascendText:'⭐ ASCENSION (RECOMMENCER)',
    enteringZone:'ENTRÉE ZONE {0}',
    coinsWorthText:'→ Zone {0} — pièces valent {1}× chacune!',
    allCompleteText:'🌟 Vous avez complété les 70 niveaux! Démarrage du run prestige...',
    landHere:'ATTERRIR ICI',
    shieldPickupText:'🛡 +BOUCLIER!',
  }},
  ru: { name:'Русский', flag:'🇷🇺', dir:'ltr', t:{
    play:'ИГРАТЬ', levelsBtn:'🗺️ УРОВНИ', upgradesMenu:'⚙️ УЛУЧШЕНИЯ', upgradesBtn:'🔧 УЛУЧШЕНИЯ',
    upgradesTitle:'УЛУЧШЕНИЯ', upgradesSec:'УЛУЧШЕНИЯ', levelsTitle:'УРОВНИ',
    level:'УРОВЕНЬ', distance:'ДИСТАНЦИЯ', ammo:'ПАТРОНЫ', coins:'МОНЕТЫ',
    crashed:'КРУШЕНИЕ!', tryAgain:'НОВАЯ ИГРА', menu:'МЕНЮ', newGame:'НОВАЯ ИГРА', continueGame:'ПРОДОЛЖИТЬ', watchAd:'СМОТРЕТЬ РЕКЛАМУ',
    levelComplete:'УРОВЕНЬ ПРОЙДЕН!', vehicles:'ТРАНСПОРТ',
    howToPlay:'КАК ИГРАТЬ', letsFly:'ПОЛЕТЕЛИ!', wellDone:'⭐ ОТЛИЧНО! ⭐',
    lvl:'УР', best:'РЕКОРД', playAgain:'СНОВА',
    tut1:'<b>Удерживайте</b> экран для подъёма — <b>отпустите</b> для снижения',
    tut2:'Летите сквозь <b>промежутки</b> в столбах — не врезайтесь!',
    tut3:'Собирайте <b>патроны</b> для пушки (купите в Улучшениях)',
    tut4:'Берите <b>монеты</b> для транспорта и улучшений',
    tut5:'Достигните <b>цели</b> — затем приземлитесь на <b>полосу</b>!',
    vn0:'Бумажный самолёт', vn1:'Улучшенный', vn2:'Дрон', vn3:'Лёгкий самолёт',
    vn4:'Пропеллер', vn5:'Ракета', vn6:'Малый лайнер', vn7:'Большой лайнер',
    vn8:'Стелс', vn9:'Super Airflight',
    vp0:'Стандартный универсал',
    vp1:'🧲 Дальность магнита +40%',
    vp2:'🎯 Ультраточный полёт — гравитация вдвое слабее',
    vp3:'⚡ Пилотажный — резкие виражи',
    vp4:'💨 Порывы ветра снижены на 60%',
    vp5:'🔥 Огненный след — удержи для ускорения',
    vp6:'🪙 Каждая монета +2 бонуса',
    vp7:'🛡 Каждый уровень начинается с +1 бесплатным щитом',
    vp8:'👻 Ракеты врагов промахиваются в 50% случаев',
    vp9:'🔫 Автострельба каждые 4с (без боеприпасов)',
    un_speed:'Улучшение двигателя', un_control:'Лучшее управление', un_magnet:'Магнит монет',
    un_shield:'Щит', un_cannon:'Пушка',
    ud_speed:'Увеличивает базовую скорость',
    ud_control:'Более плавное управление полётом',
    ud_magnet:'Притягивает близкие монеты',
    ud_shield:'Дополнительный удар перед гибелью',
    ud_cannon:'Открывает подбор боеприпасов и стрельбу',
    bm0:'Небо', bm1:'Закат', bm2:'Ночь', bm3:'Буря', bm4:'Арктика', bm5:'Каньон', bm6:'Космос',
    holdUp:'УДЕРЖИ ДЛЯ ПОДЪЁМА',
    comboText:'КОМБО',
    newBest:'🏆 НОВЫЙ РЕКОРД',
    prestigeText:'⭐ ПРЕСТИЖ {0} РАЗБЛОКИРОВАН! ⭐',
    nextLevelText:'СЛЕД. УРОВЕНЬ',
    ascendText:'⭐ ВОЗНЕСТИСЬ (СНАЧАЛА)',
    enteringZone:'ВХОДИМ В ЗОНУ {0}',
    coinsWorthText:'→ Зона {0} — монеты стоят {1}× каждая!',
    allCompleteText:'🌟 Вы прошли все 70 уровней! Начинается престижный забег...',
    landHere:'ПРИЗЕМЛИСЬ ЗДЕСЬ',
    shieldPickupText:'🛡 +ЩИТ!',
  }},
  ja: { name:'日本語', flag:'🇯🇵', dir:'ltr', t:{
    play:'プレイ', levelsBtn:'🗺️ レベル', upgradesMenu:'⚙️ アップグレード', upgradesBtn:'🔧 アップグレード',
    upgradesTitle:'アップグレード', upgradesSec:'アップグレード', levelsTitle:'レベル',
    level:'レベル', distance:'距離', ammo:'弾薬', coins:'コイン',
    crashed:'墜落!', tryAgain:'ニューゲーム', menu:'メニュー', newGame:'ニューゲーム', continueGame:'コンティニュー', watchAd:'広告を見る',
    levelComplete:'レベルクリア!', vehicles:'乗り物',
    howToPlay:'遊び方', letsFly:'飛ぼう!', wellDone:'⭐ すごい! ⭐',
    lvl:'LV', best:'最高', playAgain:'もう一度',
    tut1:'<b>押し続ける</b>と上昇 — <b>離す</b>と下降',
    tut2:'柱の<b>隙間</b>を飛び抜けよう — ぶつからないように!',
    tut3:'<b>弾薬箱</b>を集めて大砲を充填（アップグレードで購入）',
    tut4:'<b>コイン</b>を集めて乗り物やアップグレードに使おう',
    tut5:'<b>距離目標</b>に到達したら<b>滑走路</b>に着陸しよう!',
    vn0:'紙飛行機', vn1:'改良紙飛行機', vn2:'ドローン', vn3:'軽飛行機',
    vn4:'プロペラ機', vn5:'ロケット', vn6:'小型旅客機', vn7:'大型旅客機',
    vn8:'ステルス機', vn9:'Super Airflight',
    vp0:'標準オールラウンダー',
    vp1:'🧲 コイン磁石範囲+40%',
    vp2:'🎯 超精密ホバー — 重力半減',
    vp3:'⚡ アクロバット — 急旋回',
    vp4:'💨 ファン突風60%減',
    vp5:'🔥 炎の軌跡 — 長押しで加速',
    vp6:'🪙 コイン1枚につき+2ボーナス',
    vp7:'🛡 各レベル開始時に無料シールド+1',
    vp8:'👻 敵ミサイル50%外れ',
    vp9:'🔫 4秒ごと自動発射（弾薬不要）',
    un_speed:'エンジン強化', un_control:'操作改善', un_magnet:'コイン磁石',
    un_shield:'シールド', un_cannon:'大砲',
    ud_speed:'基本速度を上げる',
    ud_control:'より滑らかな飛行操作',
    ud_magnet:'近くのコインを引き寄せる',
    ud_shield:'クラッシュ前に追加ヒット',
    ud_cannon:'弾薬収集と射撃を解放',
    bm0:'空', bm1:'夕暮れ', bm2:'夜', bm3:'嵐', bm4:'北極', bm5:'峡谷', bm6:'宇宙',
    holdUp:'長押しで上昇',
    comboText:'コンボ',
    newBest:'🏆 ベスト更新',
    prestigeText:'⭐ プレステージ{0}解放！⭐',
    nextLevelText:'次のレベル',
    ascendText:'⭐ 昇格（再スタート）',
    enteringZone:'{0}ゾーンに突入',
    coinsWorthText:'→ {0}ゾーン — コイン{1}×の価値!',
    allCompleteText:'🌟 全70レベルクリア！プレステージラン開始...',
    landHere:'ここに着陸',
    shieldPickupText:'🛡 +シールド!',
  }},
  zh: { name:'中文', flag:'🇨🇳', dir:'ltr', t:{
    play:'开始', levelsBtn:'🗺️ 关卡', upgradesMenu:'⚙️ 升级', upgradesBtn:'🔧 升级',
    upgradesTitle:'升级', upgradesSec:'升级', levelsTitle:'关卡',
    level:'关卡', distance:'距离', ammo:'弹药', coins:'金币',
    crashed:'坠毁!', tryAgain:'新游戏', menu:'菜单', newGame:'新游戏', continueGame:'继续', watchAd:'观看广告',
    levelComplete:'关卡完成!', vehicles:'飞行器',
    howToPlay:'游戏说明', letsFly:'出发!', wellDone:'⭐ 太棒了! ⭐',
    lvl:'关', best:'最佳', playAgain:'再玩',
    tut1:'<b>按住</b>屏幕上升 — <b>松开</b>下降',
    tut2:'飞过柱子间的<b>间隙</b> — 不要撞上!',
    tut3:'收集<b>弹药箱</b>为大炮充能（在升级中购买大炮）',
    tut4:'收集<b>金币</b>购买飞行器和升级',
    tut5:'达到<b>距离目标</b> — 然后飞到<b>跑道</b>上降落!',
    vn0:'纸飞机', vn1:'改良纸飞机', vn2:'无人机', vn3:'轻型飞机',
    vn4:'螺旋桨飞机', vn5:'火箭', vn6:'小型客机', vn7:'大型客机',
    vn8:'隐形飞机', vn9:'Super Airflight',
    vp0:'标准全能型',
    vp1:'🧲 硬币磁铁范围+40%',
    vp2:'🎯 超精确悬停 — 重力减半',
    vp3:'⚡ 特技飞行 — 更紧急转弯',
    vp4:'💨 风扇阵风减少60%',
    vp5:'🔥 火焰尾迹 — 长按加速',
    vp6:'🪙 每枚硬币额外+2奖励',
    vp7:'🛡 每关开始获得+1免费护盾',
    vp8:'👻 敌方导弹50%几率未中',
    vp9:'🔫 每4秒自动开火（无需弹药）',
    un_speed:'引擎强化', un_control:'更好控制', un_magnet:'硬币磁铁',
    un_shield:'护盾', un_cannon:'大炮',
    ud_speed:'增加基础速度',
    ud_control:'更流畅的飞行操控',
    ud_magnet:'吸引附近硬币',
    ud_shield:'坠毁前额外一次撞击',
    ud_cannon:'解锁弹药拾取和射击',
    bm0:'天空', bm1:'夕阳', bm2:'夜晚', bm3:'风暴', bm4:'北极', bm5:'峡谷', bm6:'太空',
    holdUp:'长按上飞',
    comboText:'连击',
    newBest:'🏆 新纪录',
    prestigeText:'⭐ 声望{0}解锁！⭐',
    nextLevelText:'下一关',
    ascendText:'⭐ 晋级（重新开始）',
    enteringZone:'进入{0}区域',
    coinsWorthText:'→ {0}区域 — 每枚硬币价值{1}×!',
    allCompleteText:'🌟 你完成了所有70关！开始声望挑战...',
    landHere:'在此降落',
    shieldPickupText:'🛡 +护盾!',
  }},
  he: { name:'עברית', flag:'🇮🇱', dir:'rtl', t:{
    play:'שחק', levelsBtn:'🗺️ שלבים', upgradesMenu:'⚙️ שדרוגים', upgradesBtn:'🔧 שדרוגים',
    upgradesTitle:'שדרוגים', upgradesSec:'שדרוגים', levelsTitle:'שלבים',
    level:'שלב', distance:'מרחק', ammo:'תחמושת', coins:'מטבעות',
    crashed:'התרסקת!', tryAgain:'משחק חדש', menu:'תפריט', newGame:'משחק חדש', continueGame:'המשך', watchAd:'צפה בפרסומת',
    levelComplete:'השלב הושלם!', vehicles:'כלי טיס',
    howToPlay:'איך משחקים', letsFly:'יאללה נטוס!', wellDone:'⭐ כל הכבוד! ⭐',
    lvl:'שלב', best:'שיא', playAgain:'שחק שוב',
    tut1:'<b>לחץ</b> על המסך לעלות — <b>שחרר</b> לרדת',
    tut2:'טוס דרך <b>הפרצות</b> בעמודים — אל תתרסק!',
    tut3:'אסוף <b>קופסאות תחמושת</b> לטעינת התותח (קנה תותח בשדרוגים)',
    tut4:'אסוף <b>מטבעות</b> לקניית כלי טיס ושדרוגים',
    tut5:'הגע ל<b>יעד המרחק</b> — ואז נחת על <b>המסלול</b>!',
    vn0:'מטוס נייר', vn1:'נייר משודרג', vn2:'רחפן', vn3:'מטוס קל',
    vn4:'מטוס מדחף', vn5:'טיל', vn6:'מטוס קטן', vn7:'מטוס גדול',
    vn8:'מטוס סטלת', vn9:'Super Airflight',
    vp0:'כל-יכול סטנדרטי',
    vp1:'🧲 טווח מגנט מטבעות +40%',
    vp2:'🎯 ריחוף על-מדויק — כבידה חצויה',
    vp3:'⚡ אקרובטי — פניות חדות יותר',
    vp4:'💨 רוח המאוורר מופחתת ב-60%',
    vp5:'🔥 שביל אש — לחץ ממושך להאצה',
    vp6:'🪙 כל מטבע שווה +2 בונוס',
    vp7:'🛡 מתחיל כל שלב עם +1 מגן חינם',
    vp8:'👻 טילי האויב מחטיאים 50% מהפעמים',
    vp9:'🔫 יורה אוטומטית כל 4 שניות (ללא תחמושת)',
    un_speed:'שיפור מנוע', un_control:'שליטה טובה יותר', un_magnet:'מגנט מטבעות',
    un_shield:'מגן', un_cannon:'תותח',
    ud_speed:'מגדיל מהירות בסיסית',
    ud_control:'תגובת טיסה חלקה יותר',
    ud_magnet:'מושך מטבעות קרובים',
    ud_shield:'מכה נוספת לפני התרסקות',
    ud_cannon:'פותח תחמושת וירייה',
    bm0:'שמיים', bm1:'שקיעה', bm2:'לילה', bm3:'סערה', bm4:'ארקטי', bm5:'קניון', bm6:'חלל',
    holdUp:'לחץ ממושך לעלות',
    comboText:'קומבו',
    newBest:'🏆 שיא חדש',
    prestigeText:'⭐ יוקרה {0} נפתחה! ⭐',
    nextLevelText:'שלב הבא',
    ascendText:'⭐ עלייה (התחלה מחדש)',
    enteringZone:'כניסה לאזור {0}',
    coinsWorthText:'→ אזור {0} — מטבעות שווים {1}× כל אחד!',
    allCompleteText:'🌟 סיימת את כל 70 השלבים! מתחיל ריצת יוקרה...',
    landHere:'נחת כאן',
    shieldPickupText:'🛡 +מגן!',
  }},
  ar: { name:'العربية', flag:'🇸🇦', dir:'rtl', t:{
    play:'العب', levelsBtn:'🗺️ مستويات', upgradesMenu:'⚙️ تحسينات', upgradesBtn:'🔧 تحسينات',
    upgradesTitle:'تحسينات', upgradesSec:'تحسينات', levelsTitle:'مستويات',
    level:'المستوى', distance:'المسافة', ammo:'ذخيرة', coins:'عملات',
    crashed:'تحطم!', tryAgain:'لعبة جديدة', menu:'قائمة', newGame:'لعبة جديدة', continueGame:'متابعة', watchAd:'مشاهدة إعلان',
    levelComplete:'اكتمل المستوى!', vehicles:'مركبات',
    howToPlay:'كيف تلعب', letsFly:'هيا نطير!', wellDone:'⭐ أحسنت! ⭐',
    lvl:'مستوى', best:'أفضل', playAgain:'العب مجدداً',
    tut1:'<b>اضغط مطولاً</b> للصعود — <b>أطلق</b> للنزول',
    tut2:'حلق عبر <b>الفجوات</b> في الأعمدة — لا تتحطم!',
    tut3:'اجمع <b>صناديق الذخيرة</b> لشحن المدفع (اشتره من التحسينات)',
    tut4:'اجمع <b>العملات</b> للإنفاق على المركبات والتحسينات',
    tut5:'بلغ <b>هدف المسافة</b> — ثم اهبط على <b>المدرج</b>!',
    vn0:'طائرة ورق', vn1:'ورق محسّن', vn2:'طائرة مسيّرة', vn3:'طائرة خفيفة',
    vn4:'طائرة مروحية', vn5:'صاروخ', vn6:'طائرة صغيرة', vn7:'طائرة كبيرة',
    vn8:'طائرة شبح', vn9:'Super Airflight',
    vp0:'متعدد الأغراض',
    vp1:'🧲 نطاق مغناطيس العملات +40%',
    vp2:'🎯 تحليق فائق الدقة — جاذبية منقوصة',
    vp3:'⚡ بهلوانية — منعطفات أحدة',
    vp4:'💨 رياح المروحة تقل 60%',
    vp5:'🔥 أثر ناري — اضغط مطولاً للتسريع',
    vp6:'🪙 كل عملة تساوي +2 مكافأة',
    vp7:'🛡 يبدأ كل مستوى بدرع مجاني +1',
    vp8:'👻 صواريخ الأعداء تخطئ 50% من الوقت',
    vp9:'🔫 يطلق تلقائياً كل 4 ثوانٍ (بدون ذخيرة)',
    un_speed:'تعزيز المحرك', un_control:'تحكم أفضل', un_magnet:'مغناطيس العملات',
    un_shield:'درع', un_cannon:'مدفع',
    ud_speed:'يزيد السرعة الأساسية',
    ud_control:'استجابة طيران أكثر سلاسة',
    ud_magnet:'يجذب العملات القريبة',
    ud_shield:'ضربة إضافية قبل الانهيار',
    ud_cannon:'يفتح التقاط الذخيرة والتصويب',
    bm0:'السماء', bm1:'الغروب', bm2:'الليل', bm3:'العاصفة', bm4:'القطب', bm5:'الوادي', bm6:'الفضاء',
    holdUp:'اضغط مطولاً للصعود',
    comboText:'سلسلة',
    newBest:'🏆 رقم قياسي جديد',
    prestigeText:'⭐ المكانة {0} مفتوحة! ⭐',
    nextLevelText:'المستوى التالي',
    ascendText:'⭐ الارتقاء (إعادة البدء)',
    enteringZone:'دخول منطقة {0}',
    coinsWorthText:'→ منطقة {0} — العملات تساوي {1}× لكل منها!',
    allCompleteText:'🌟 أكملت جميع المستويات الـ70! بدء جولة المكانة...',
    landHere:'الهبوط هنا',
    shieldPickupText:'🛡 +درع!',
  }},
};

let currentLang = localStorage.getItem('pfe_lang') || 'en';

function t(key) {
  return (LANGS[currentLang] && LANGS[currentLang].t[key]) || LANGS.en.t[key] || key;
}
// Template helper: tf('hello {0} and {1}', 'world', 'you') → 'hello world and you'
function tf(key, ...args) {
  let s = t(key);
  args.forEach((v, i) => { s = s.replace('{' + i + '}', v); });
  return s;
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
    upgrades: { control:0, magnet:0, shield:0, cannon:0 },
    currentLevel: 1, tutorialDone: false,
    levelBests: {}, prestige: 0,
    dataVersion: 2,
    lastSpin: 0, spinShields: 0, spinAmmo: 0,
    spinSpeed: 0, spinDoubleCoins: 0,
    lastLogin: 0, loginStreak: 0,
    gameCount: 0,
    diamonds: 0,
    freePlayBest: 0,
    activeSkin: 0,
    ownedSkins: [0],
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
    if (!this.data.upgrades) this.data.upgrades = { control:0,magnet:0,shield:0,cannon:0 };
    if (this.data.upgrades.cannon === undefined) this.data.upgrades.cannon = 0;
    if (!this.data.currentLevel || this.data.currentLevel < 1) this.data.currentLevel = 1;
    if (!this.data.ownedVehicles || !this.data.ownedVehicles.includes(0)) this.data.ownedVehicles = [0];
    // One-time migration v2: reset vehicle ownership — old code gave all vehicles for free.
    // Rebuild ownedVehicles from scratch: only keep vehicles the player can legitimately
    // own at their current level AND whose cost they could have paid with coins earned.
    if (!this.data.dataVersion || this.data.dataVersion < 2) {
      this.data.dataVersion = 2;
      // Keep only Paper Plane — player must re-earn others through gameplay
      this.data.ownedVehicles = [0];
      this.data.activeVehicle = 0;
    }
    if (!this.data.ownedVehicles.includes(this.data.activeVehicle)) this.data.activeVehicle = 0;
    if (!this.data.bestLevel) this.data.bestLevel = 1;
    if (this.data.tutorialDone === undefined) this.data.tutorialDone = false;
    if (!this.data.levelBests) this.data.levelBests = {};
    if (this.data.prestige === undefined) this.data.prestige = 0;
    if (this.data.lastSpin === undefined) this.data.lastSpin = 0;
    if (this.data.spinShields === undefined) this.data.spinShields = 0;
    if (this.data.spinAmmo === undefined) this.data.spinAmmo = 0;
    if (this.data.spinSpeed === undefined) this.data.spinSpeed = 0;
    if (this.data.spinDoubleCoins === undefined) this.data.spinDoubleCoins = 0;
    if (this.data.lastLogin === undefined) this.data.lastLogin = 0;
    if (this.data.loginStreak === undefined) this.data.loginStreak = 0;
    if (this.data.gameCount === undefined) this.data.gameCount = 0;
    if (this.data.diamonds === undefined) this.data.diamonds = 0;
    if (this.data.freePlayBest === undefined) this.data.freePlayBest = 0;
    if (this.data.activeSkin === undefined) this.data.activeSkin = 0;
    if (!this.data.ownedSkins || !Array.isArray(this.data.ownedSkins)) this.data.ownedSkins = [0];
    if (!this.data.ownedSkins.includes(0)) this.data.ownedSkins.unshift(0);
    // Re-save to populate all storage mechanisms in case one was missing
    this.save();
  },
};

// ── GAME STATE ───────────────────────────────────────────
let canvas, ctx, W, H;
let gameState = 'menu'; // menu | playing | landing | levelcomplete | dead | shop
let player, obstacles, coins, ammoPickups, mysteryBoxes, shieldPickups, particles, bullets, enemies, enemyBullets;
let mysteryBoxTimer;
let distance, speed, sessionCoins, ammo;
let frameId, lastTime;
let shieldHits, shootCooldown, shootAutoTimer;
let spawnTimer, coinTimer, ammoTimer, targetTimer, enemyTimer, shieldPickupTimer;
let popups = []; // [{text, x, y, alpha, timer, color}]
let clouds = [], stars = [], bgParticles = [];
let coinCombo = 0, comboTimer = 0;
let screenShake = 0;
let speedBoostEffect = 0; // countdown timer for speed boost visual
let lastLightningTime = 0;
let currentLevel = 1;
let levelData = LEVELS[0];
let currentBiome = 0;
let biomeBanner = { text: '', timer: 0 };

// Session ID — incremented on every new game to cancel stale delayed callbacks
let gameSession = 0;

// ── FREE PLAY MODE ───────────────────────────────────────
let isFreePlay = false;

// ── REVIVE STATE ─────────────────────────────────────────
let reviveCount = 0;              // coin revives used this run (max 3)
let coinReviveUsedThisGame = false; // true once any coin revive used → locks ads
let reviveTimer = null;           // interval handle for countdown

// ── AD MANAGER ───────────────────────────────────────────
const AdManager = {
  _adRevivesThisGame: 0,
  MAX_AD_REVIVES: 2,
  showInterstitial(onClose) {
    // TODO: Replace with AdMob SDK call when publishing
    const overlay = document.getElementById('ad-interstitial');
    const skipBtn = document.getElementById('ad-skip-btn');
    overlay.classList.add('active');
    skipBtn.textContent = 'Please wait...';
    skipBtn.disabled = true;
    let remaining = 3;
    const tick = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(tick);
        skipBtn.textContent = 'Close';
        skipBtn.disabled = false;
        skipBtn.onclick = () => {
          overlay.classList.remove('active');
          skipBtn.onclick = null;
          if (onClose) onClose();
        };
      } else {
        skipBtn.textContent = 'Please wait... (' + remaining + ')';
      }
    }, 1000);
  },
  showRewardedAd(onRewarded) {
    // TODO: Replace with AdMob SDK call when publishing
    const overlay = document.getElementById('ad-interstitial');
    const skipBtn = document.getElementById('ad-skip-btn');
    overlay.classList.add('active');
    skipBtn.textContent = 'Loading ad...';
    skipBtn.disabled = true;
    this._adRevivesThisGame++;
    setTimeout(() => {
      overlay.classList.remove('active');
      if (onRewarded) onRewarded();
    }, 2000);
  },
  canShowRewardedAd() { return this._adRevivesThisGame < this.MAX_AD_REVIVES; },
  resetGame() { this._adRevivesThisGame = 0; },
};

// Boss state (null when no boss is active)
let boss = null;

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
  return { type:'pillar', x: W + 40, gapY, gap, w: 52, scored: false, seed: Math.floor(Math.random() * 99991) };
}
function createFan() {
  const side = Math.random() < 0.5 ? 'top' : 'bottom';
  return { type:'fan', x: W + 40, y: side === 'top' ? H * 0.06 : H * 0.86, side, angle: 0, w: 44, h: 44, windForce: (Math.random() < 0.5 ? 1 : -1) * 2.5 };
}
// ── SHOOT TARGETS ─────────────────────────────────────────
const TARGET_TYPES = [
  { shape:'star',   color:'#FFD700', coins:5  },
  { shape:'star',   color:'#FF6B35', coins:8  },
  { shape:'ufo',    color:'#00E5FF', coins:10 },
  { shape:'star',   color:'#E040FB', coins:6  },
];
function createTarget() {
  const t = TARGET_TYPES[Math.floor(Math.random() * TARGET_TYPES.length)];
  const coins = t.coins + Math.floor(currentLevel / 8);
  return { type:'target', x: W + 50, y: H * 0.12 + Math.random() * H * 0.76,
    shape: t.shape, color: t.color, coins, r: 22, anim: 0, hp: 1 };
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

// ── SHIELD PICKUP (levels 30+) ────────────────────────────
function createShieldPickup() {
  return { x: W + 40, y: H * 0.15 + Math.random() * H * 0.70, collected: false, anim: Math.random() * Math.PI * 2 };
}


// ── BOSS ─────────────────────────────────────────────────
function createBoss() {
  const worldIdx = Math.floor((currentLevel - 1) / 10);
  const hp = 15 + worldIdx * 12; // 15,27,39,51,63,75,87
  return {
    x: W * 1.15, y: H * 0.5,
    vy: 0, hp, maxHp: hp,
    phase: 0,        // 0=normal 1=rage(60%) 2=frenzy(30%)
    attackTimer: 2.5,
    missileTimer: 6,
    anim: 0,
    world: worldIdx,
    entered: false,
    dead: false,
  };
}

function updateBoss(dt) {
  if (!boss || boss.dead) return;
  boss.anim += dt * 3;

  const targetX = W * 0.72;
  if (!boss.entered) {
    boss.x -= speed * 0.7 + 3;
    if (boss.x <= targetX) { boss.x = targetX; boss.entered = true; }
  } else {
    // Hover toward targetX
    boss.x += (targetX - boss.x) * 0.03;
    // Track player vertically
    const dy = player.y - boss.y;
    boss.vy += dy * 80 * dt;
    boss.vy *= 0.88;
    boss.y = Math.max(70, Math.min(H - 70, boss.y + boss.vy * dt));

    // Phase transitions
    boss.phase = boss.hp < boss.maxHp * 0.3 ? 2 : boss.hp < boss.maxHp * 0.6 ? 1 : 0;
    const rage = [1.0, 1.35, 1.8][boss.phase];

    // Spread shot attack
    boss.attackTimer -= dt;
    if (boss.attackTimer <= 0) {
      const numShots = [2, 3, 5][boss.phase];
      const baseAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
      for (let i = 0; i < numShots; i++) {
        const angle = baseAngle + (i - (numShots - 1) / 2) * 0.22;
        const spd = 200 + currentLevel * 3;
        enemyBullets.push({ x: boss.x - 48, y: boss.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, r: 6, isBoss: true });
      }
      boss.attackTimer = 2.5 / rage;
    }

    // Homing missiles (world 2+)
    if (boss.world >= 2) {
      boss.missileTimer -= dt;
      if (boss.missileTimer <= 0) {
        const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
        enemyBullets.push({ x: boss.x - 48, y: boss.y, vx: Math.cos(angle) * 80, vy: Math.sin(angle) * 80, r: 9, isBoss: true, homing: true });
        boss.missileTimer = 5.5 / rage;
      }
    }
  }

  // Player bullets hit boss
  bullets = bullets.filter(b => {
    const dx = b.x - boss.x, dy = b.y - boss.y;
    if (Math.abs(dx) < 50 && Math.abs(dy) < 36) {
      boss.hp = Math.max(0, boss.hp - 1);
      screenShake = 0.25;
      spawnParticles(b.x, b.y, '#ff5722', 6);
      if (boss.hp <= 0) killBoss();
      return false;
    }
    return true;
  });

  // Body collision with player
  if (player.alive && player.invincible <= 0) {
    const dx = player.x - boss.x, dy = player.y - boss.y;
    if (Math.abs(dx) < 52 + 22 && Math.abs(dy) < 40 + 14) handleHit();
  }
}

function killBoss() {
  if (!boss || boss.dead) return;
  boss.dead = true;
  boss.hp = 0;
  const bossRef = boss;
  // Chain explosion sequence
  for (let i = 0; i < 9; i++) {
    const _s = gameSession;
    setTimeout(() => {
      if (gameSession !== _s) return;
      const ox = (Math.random() - 0.5) * 90, oy = (Math.random() - 0.5) * 60;
      spawnParticles(bossRef.x + ox, bossRef.y + oy, ['#ff5722','#FFD700','#ff8c00','#ffffff'][i % 4], 18);
      screenShake = 0.7;
      Snd.play('crash');
    }, i * 200);
  }
  // Boss rewards scale dramatically per world — feel like a real jackpot
  const bossRewards = [150, 250, 350, 500, 650, 850, 1200];
  const reward = bossRewards[bossRef.world] || 150;
  sessionCoins += reward;
  popups.push({ text: '🏆 BOSS DEFEATED! +' + reward + ' 🪙', x: W * 0.5, y: H * 0.4, alpha: 1, timer: 3.5, color: '#FFD700' });
  const _s = gameSession;
  setTimeout(() => {
    if (gameSession !== _s) return;
    boss = null;
    player.alive = false;
    showLevelComplete();
  }, 2000);
}

function drawBoss() {
  if (!boss) return;
  const [c1, c2] = BOSS_COLORS[boss.world] || BOSS_COLORS[0];
  const anim = boss.anim;
  const pulse = 0.5 + 0.5 * Math.sin(anim * 2);
  const isDead = boss.dead;
  const alpha = isDead ? Math.max(0, 1 - (anim - (boss.anim - 0))) : 1;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(boss.x, boss.y);
  ctx.scale(-1, 1); // face left toward player

  // Outer glow
  const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 72);
  gr.addColorStop(0, c1 + '55');
  gr.addColorStop(1, c1 + '00');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 72, 0, Math.PI * 2); ctx.fill();

  // Main body
  ctx.fillStyle = c2;
  ctx.beginPath();
  ctx.moveTo(48, 0); ctx.lineTo(12, -30); ctx.lineTo(-28, -22);
  ctx.lineTo(-44, 0); ctx.lineTo(-28, 22); ctx.lineTo(12, 30);
  ctx.closePath(); ctx.fill();

  // Upper armor
  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.moveTo(42, -4); ctx.lineTo(12, -24); ctx.lineTo(-26, -18); ctx.lineTo(-20, -4);
  ctx.closePath(); ctx.fill();

  // Lower armor
  ctx.beginPath();
  ctx.moveTo(42, 4); ctx.lineTo(12, 24); ctx.lineTo(-26, 18); ctx.lineTo(-20, 4);
  ctx.closePath(); ctx.fill();

  // Wings
  ctx.fillStyle = c2;
  ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(-18, -54); ctx.lineTo(-30, -22); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(-18, 54); ctx.lineTo(-30, 22); ctx.closePath(); ctx.fill();

  // Eye / cannon
  const eyeColor = boss.phase === 2 ? '#ff1111' : boss.phase === 1 ? '#FF8C00' : '#FFD700';
  ctx.shadowColor = eyeColor; ctx.shadowBlur = 8 + pulse * 10;
  ctx.fillStyle = eyeColor;
  ctx.beginPath(); ctx.arc(30, 0, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(32, -2, 3.5, 0, Math.PI * 2); ctx.fill();

  // Engine flares
  [[-36, -16], [-36, 16]].forEach(([ex, ey]) => {
    const fl = 5 + Math.random() * 7;
    const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, fl + 8);
    eg.addColorStop(0, 'rgba(255,200,50,0.9)'); eg.addColorStop(0.5, 'rgba(255,80,0,0.6)'); eg.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = eg; ctx.beginPath(); ctx.ellipse(ex - fl / 2, ey, fl, 4, 0, 0, Math.PI * 2); ctx.fill();
  });

  ctx.restore();

  // Boss HP bar (drawn at fixed canvas position, above HUD)
  if (!boss.dead) {
    const bw = Math.min(W * 0.55, 260), bh = 14, bx = (W - bw) / 2, by = 52;
    const pct = Math.max(0, boss.hp / boss.maxHp);
    // Background pill
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath(); ctx.roundRect(bx - 3, by - 3, bw + 6, bh + 6, 10); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.fill();
    // HP fill
    const fillColor = pct > 0.6 ? '#4CAF50' : pct > 0.3 ? '#FF9800' : '#f44336';
    if (pct > 0) {
      ctx.fillStyle = fillColor;
      ctx.beginPath(); ctx.roundRect(bx, by, bw * pct, bh, 8); ctx.fill();
      if (boss.phase === 2) { // rage pulse
        ctx.fillStyle = `rgba(255,0,0,${0.2 * pulse})`;
        ctx.beginPath(); ctx.roundRect(bx, by, bw * pct, bh, 8); ctx.fill();
      }
    }
    // Label
    const bname = BOSS_NAMES[boss.world] || 'BOSS';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(`⚔️ ${bname}  ${boss.hp} / ${boss.maxHp}`, W / 2, by - 5);
  }
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
    // Homing missile tracking
    if (b.homing && player.alive) {
      const dx = player.x - b.x, dy = player.y - b.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 10) {
        b.vx += (dx / len * 130 - b.vx) * dt * 1.6;
        b.vy += (dy / len * 130 - b.vy) * dt * 1.6;
      }
    }
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
const COIN_VALUES = [1, 3, 5, 8, 12, 18, 25]; // per biome 0-6 (Sky=1, rises each world)
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
  if (isFreePlay) return; // no shooting in free play
  const lvl = Save.data.upgrades.cannon || 0;
  if (lvl === 0 || ammo <= 0 || shootCooldown > 0 || currentLevel < 3) return;
  ammo--;
  const cooldowns = [0, 0.9, 0.55, 0.4];
  shootCooldown = cooldowns[lvl];
  const bulletVx = speed + 380;
  if (lvl >= 3) {
    // Level 3: double-barrel spread
    bullets.push({ x: player.x + 26, y: player.y - 5, vx: bulletVx, vy: -30, r: 6 });
    bullets.push({ x: player.x + 26, y: player.y + 5, vx: bulletVx, vy:  30, r: 6 });
  } else {
    // Level 1-2: single straight shot
    bullets.push({ x: player.x + 26, y: player.y, vx: bulletVx, vy: 0, r: 6 });
  }
  Snd.play('shoot');
  spawnParticles(player.x + 20, player.y, '#ff9800', 14);
  for (let i = 0; i < 8; i++) {
    const a = (Math.random() - 0.5) * Math.PI * 0.5;
    particles.push({ x: player.x + 24, y: player.y, vx: Math.cos(a) * (10 + Math.random() * 8), vy: Math.sin(a) * (4 + Math.random() * 4), life: 1, color: i % 2 === 0 ? '#FFD700' : '#FF6B35', r: 3 + Math.random() * 3 });
  }
  updateShootBtn();
}

function updateShootBtn() {
  const btn = document.getElementById('shoot-btn');
  if (!btn) return;
  const hasCannon = Save.data.upgrades.cannon > 0 && currentLevel >= 3 && !isFreePlay;
  if (!hasCannon || gameState !== 'playing') {
    btn.classList.add('hidden');
    return;
  }
  // Always visible when cannon is unlocked — dimmed when empty or cooling down
  btn.classList.remove('hidden');
  btn.textContent = '🔫 ' + ammo;
  btn.style.opacity  = (ammo > 0 && shootCooldown <= 0) ? '1' : '0.35';
  btn.style.transform = (ammo > 0 && shootCooldown <= 0) ? 'scale(1)' : 'scale(0.92)';
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

  boss = null;
  reviveCount = 0;
  coinReviveUsedThisGame = false;
  AdManager.resetGame();
  _resetFinalizeGuard();
  distance = 0; sessionCoins = 0;
  obstacles = []; coins = []; ammoPickups = []; mysteryBoxes = []; shieldPickups = []; particles = []; bullets = [];
  enemies = []; enemyBullets = []; popups = [];
  mysteryBoxTimer = 30 + Math.random() * 20;
  coinCombo = 0; comboTimer = 0; screenShake = 0; lastLightningTime = 0; speedBoostEffect = 0;
  spawnTimer = 1.5; coinTimer = 1.0; ammoTimer = 10 + Math.random() * 6;
  targetTimer = 8 + Math.random() * 6;
  enemyTimer = currentLevel >= 25 ? 8 + Math.random() * 6 : 99999;
  shieldPickupTimer = currentLevel >= 30 ? 18 + Math.random() * 12 : 99999;
  shootCooldown = 0; shootAutoTimer = 3;
  isHolding = false;

  const upg = Save.data.upgrades;
  // Guard: clamp activeVehicle to valid range
  if (!VEHICLES[Save.data.activeVehicle]) Save.data.activeVehicle = 0;
  shieldHits = upg.shield + (Save.data.activeVehicle === 7 ? 1 : 0); // Large Airliner perk
  // Apply spin shield bonus
  if (Save.data.spinShields > 0) { shieldHits += Save.data.spinShields; Save.data.spinShields = 0; Save.save(); }

  // Base speed
  speed = levelData.speed * VEHICLES[Save.data.activeVehicle].speed;

  // ── SPIN BONUSES ──
  // TURBO: +65% speed for the whole level
  let turboActive = false;
  if (Save.data.spinSpeed > 0) {
    speed *= 1.65;
    Save.data.spinSpeed = 0;
    turboActive = true;
    Save.save();
  }
  // DOUBLE COINS flag (read in coin collection)
  let doubleCoinActive = false;
  if (Save.data.spinDoubleCoins > 0) {
    Save.data.spinDoubleCoins = 0;
    doubleCoinActive = true;
    Save.save();
  }
  // Store on window so update() can read it this session
  window._turboActive = turboActive;
  window._doubleCoinActive = doubleCoinActive;

  const cap = maxAmmo();
  ammo = cap > 0 ? Math.floor(cap * 0.5) : 0;
  // FULL AMMO from spin — give maximum regardless of cannon level
  if (Save.data.spinAmmo > 0) {
    ammo = cap > 0 ? cap : 20; // if no cannon, still store so hint shows
    Save.data.spinAmmo = 0;
    Save.save();
  }

  player = createPlayer();
  landing = null;
  tutHints = [];
  tutPhase = 0;

  initBgEffects(currentBiome);

  // ── SPIN BONUS BANNERS (shown at level start) ──
  if (turboActive) {
    biomeBanner.text = '⚡ TURBO ACTIVE — +65% SPEED!';
    biomeBanner.timer = 3.2;
    biomeBanner.color = '#FF5722';
  } else if (doubleCoinActive) {
    biomeBanner.text = '💰 2× COINS THIS LEVEL!';
    biomeBanner.timer = 3.2;
    biomeBanner.color = '#9C27B0';
  } else if (currentLevel % 10 === 1 && currentLevel > 1) {
    // Biome change banner
    biomeBanner.text = tf('enteringZone', t('bm' + currentBiome).toUpperCase());
    biomeBanner.timer = 2.5;
    biomeBanner.color = null;
  } else if (currentLevel === 1) {
    biomeBanner.text = '';
    biomeBanner.timer = 0;
    biomeBanner.color = null;
  }

  // ── AMMO TIP: show double-tap hint only when cannon is unlocked and ammo available ──
  if (cap > 0 && ammo > 0) {
    tutHints.push({ text: '💥 Double-tap to FIRE!', x: W * 0.5, y: H * 0.72, alpha: 1, timer: 3.5, color: '#FF5722' });
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

  // Speed updates slightly in-level (TURBO raises the cap too)
  const upg = Save.data.upgrades;
  const veh = VEHICLES[Save.data.activeVehicle];
  const turboCap = window._turboActive ? 1.65 : 1.0;
  speed = Math.min(
    levelData.speed * veh.speed * turboCap + distance * 0.0002,
    levelData.speed * 1.4 * turboCap
  );

  // ── PHYSICS: hold screen = fly up, release = fall ──
  const ctrl      = veh.control * (1 + upg.control * 0.15);
  const gravity   = veh.id === 2 ? 260 : 520; // Drone perk: gravity halved
  const uplift    = 700;
  const maxFall   = 320;
  const maxRise   = -260 * Math.min(ctrl, 1.8);

  if (isHolding) {
    player.vy = Math.max(player.vy - uplift * ctrl * dt, maxRise);
  } else {
    // Smooth momentum: slightly softer gravity while still rising (no sharp threshold)
    const gravityFactor = player.vy < 0 ? 0.72 : 1.0;
    player.vy = Math.min(player.vy + gravity * gravityFactor * dt, maxFall);
  }
  player.y += player.vy * dt;

  // Clamp to screen
  player.y = Math.max(player.h * 0.5, Math.min(H - player.h * 0.5, player.y));
  if (player.y <= player.h * 0.5 || player.y >= H - player.h * 0.5) player.vy *= 0.2; // dampen instead of zero

  // Trail
  player.trail.unshift({ x: player.x, y: player.y });
  if (player.trail.length > 12) player.trail.pop();

  if (player.invincible > 0) player.invincible -= dt;
  if (shootCooldown > 0) shootCooldown -= dt;
  if (screenShake > 0) screenShake = Math.max(0, screenShake - dt * 6);
  if (speedBoostEffect > 0) speedBoostEffect = Math.max(0, speedBoostEffect - dt);
  if (comboTimer > 0) { comboTimer -= dt; if (comboTimer <= 0) coinCombo = 0; }

  // Auto-fire level 3 cannon
  if (upg.cannon >= 3 && ammo > 0) {
    shootAutoTimer -= dt;
    if (shootAutoTimer <= 0) { shoot(); shootAutoTimer = 2.5; }
  } else if (veh.id === 9) {
    // Super Airflight perk: auto-fires every 4s without consuming ammo
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
    b.vy += 90 * dt;            // slight gravity — makes bullets arc realistically
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

  // ── SHOOT TARGETS spawn (level 3+ with cannon, not in free play) ──
  if (Save.data.upgrades.cannon > 0 && currentLevel >= 3 && !isFreePlay) {
    targetTimer -= dt;
    if (targetTimer <= 0) {
      obstacles.push(createTarget());
      if (Math.random() < 0.25) obstacles.push(createTarget()); // occasional pair
      targetTimer = 8 + Math.random() * 7;
    }
  }

  // Shield pickup spawn (levels 30+, every 18–30s)
  if (currentLevel >= 30) {
    shieldPickupTimer -= dt;
    if (shieldPickupTimer <= 0) {
      shieldPickups.push(createShieldPickup());
      shieldPickupTimer = 18 + Math.random() * 12;
    }
  }

  // Ammo crate spawn (when cannon unlocked, not in free play)
  if (Save.data.upgrades.cannon > 0 && !isFreePlay) {
    ammoTimer -= dt;
    if (ammoTimer <= 0) {
      ammoPickups.push({ x: W + 30, y: H * 0.15 + Math.random() * H * 0.7, anim: 0 });
      ammoTimer = 12 + Math.random() * 8;
    }
  }

  // Mystery box spawn (every 30–50s, any mode, level 3+)
  if (currentLevel >= 3 || isFreePlay) {
    mysteryBoxTimer -= dt;
    if (mysteryBoxTimer <= 0) {
      mysteryBoxes.push({ x: W + 30, y: H * 0.15 + Math.random() * H * 0.7, anim: 0 });
      mysteryBoxTimer = 30 + Math.random() * 20;
    }
  }

  const magnetRange = (60 + upg.magnet * 38) * (veh.id === 1 ? 1.3 : 1.0); // Upgraded Paper perk

  // ── UPDATE OBSTACLES ──
  obstacles = obstacles.filter(obs => {
    if (obs.type === 'pillar') {
      obs.x -= speed;
      if (!obs.scored && obs.x < player.x) {
        obs.scored = true;
        // Tutorial: gap cleared
        if (!Save.data.tutorialDone && tutPhase === 1 && !isFreePlay) {
          tutPhase = 2;
          tutHints.push({ text: 'Collect ammo boxes for your cannon!', x: W * 0.5, y: H * 0.35, alpha: 1, timer: 4 });
        }
      }
      // Bullets can destroy pillars — check if any bullet hits the pillar body
      let pillarDestroyed = false;
      bullets = bullets.filter(b => {
        if (b.x > obs.x - obs.w / 2 - 6 && b.x < obs.x + obs.w / 2 + 6) {
          // Hit top wall?
          if (b.y < obs.gapY - obs.gap / 2) { pillarDestroyed = true; return false; }
          // Hit bottom wall?
          if (b.y > obs.gapY + obs.gap / 2) { pillarDestroyed = true; return false; }
        }
        return true;
      });
      if (pillarDestroyed) {
        spawnParticles(obs.x, obs.gapY - obs.gap / 2, '#8D6E63', 10);
        spawnParticles(obs.x, obs.gapY + obs.gap / 2, '#8D6E63', 10);
        screenShake = 0.25;
        Snd.play('crash');
        popups.push({ text: '💥 BLASTED!', x: obs.x, y: obs.gapY, alpha: 1, timer: 1.0, color: '#FF9800' });
        return false; // remove pillar
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
      let birdShot = false;
      bullets = bullets.filter(b => {
        const dx = b.x - obs.x, dy = b.y - obs.y;
        if (Math.sqrt(dx*dx+dy*dy) < obs.r + 10) { birdShot = true; return false; }
        return true;
      });
      if (birdShot) {
        spawnParticles(obs.x, obs.y, '#FFD700', 10);
        sessionCoins += 2;
        popups.push({ text: '+2 🪙', x: obs.x, y: obs.y - 20, alpha: 1, timer: 1.0, color: '#FFD700' });
        return false;
      }
      if (player.invincible <= 0) {
        const dx = player.x - obs.x, dy = player.y - obs.y;
        if (Math.sqrt(dx * dx + dy * dy) < obs.r + 20) handleHit();
      }
      return obs.x > -50 && obs.x < W + 50;
    } else if (obs.type === 'target') {
      obs.x -= speed * 0.55;
      obs.anim += dt * 3;
      // Check bullet hits
      let hit = false;
      bullets = bullets.filter(b => {
        if (Math.sqrt((b.x - obs.x) ** 2 + (b.y - obs.y) ** 2) < obs.r + 8) {
          hit = true; return false;
        }
        return true;
      });
      if (hit) {
        obs.hp--;
        if (obs.hp <= 0) {
          sessionCoins += obs.coins;
          spawnParticles(obs.x, obs.y, obs.color, 20);
          Snd.play('coin');
          popups.push({ text: '+' + obs.coins + ' 🪙', x: obs.x, y: obs.y - 30, alpha: 1, timer: 1.2, color: obs.color });
          return false;
        }
        spawnParticles(obs.x, obs.y, obs.color, 6);
      }
      return obs.x > -60;
    }
    return true;
  });

  // ── UPDATE SHIELD PICKUPS ──
  shieldPickups = shieldPickups.filter(sp => {
    if (sp.collected) return false;
    sp.x -= speed * 0.6;
    sp.anim += dt * 2;
    const dx = player.x - sp.x, dy = player.y - sp.y;
    if (Math.sqrt(dx * dx + dy * dy) < 36) {
      sp.collected = true;
      shieldHits = Math.min(shieldHits + 1, 5);
      spawnParticles(sp.x, sp.y, '#4CAF50', 14);
      Snd.play('shield');
      popups.push({ text: t('shieldPickupText'), x: sp.x, y: sp.y - 24, alpha: 1, timer: 1.8, color: '#4CAF50' });
      return false;
    }
    return sp.x > -40;
  });

  // ── UPDATE AMMO PICKUPS ──
  ammoPickups = ammoPickups.filter(ac => {
    if (ac.collected) return false;
    ac.x -= speed * 0.6;
    ac.anim += dt * 2.2;
    const dx = player.x - ac.x, dy = player.y - ac.y;
    if (Math.sqrt(dx * dx + dy * dy) < 32) {
      ac.collected = true;
      const cap = maxAmmo();
      const gained = Math.min(3, cap - ammo);
      if (gained > 0) {
        ammo = Math.min(ammo + gained, cap);
        spawnParticles(ac.x, ac.y, '#ffcc02', 12);
        Snd.play('coin');
        popups.push({ text: '+' + gained + ' ammo', x: ac.x, y: ac.y - 24, alpha: 1, timer: 1.4, color: '#ffcc02' });
        updateShootBtn();
      }
      return false;
    }
    return ac.x > -40;
  });

  // ── UPDATE MYSTERY BOXES ──
  mysteryBoxes = mysteryBoxes.filter(mb => {
    if (mb.collected) return false;
    mb.x -= speed * 0.6;
    mb.anim += dt * 1.8;
    const dx = player.x - mb.x, dy = player.y - mb.y;
    if (Math.sqrt(dx * dx + dy * dy) < 34) {
      mb.collected = true;
      _openMysteryBox(mb.x, mb.y);
      return false;
    }
    return mb.x > -40;
  });

  // ── UPDATE COINS ──
  coins = coins.filter(c => {
    if (c.collected) return false;
    c.x -= speed;
    const dx = player.x - c.x, dy = player.y - c.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < magnetRange) { const pull = 2.5 + (magnetRange - d) / magnetRange * 2; c.x += (dx / d) * pull; c.y += (dy / d) * pull; }
    if (d < c.r + 22) {
      c.collected = true;
      const v = c.val || 1;
      const vehicleBonus = veh.id === 6 ? 2 : 0; // Small Airliner perk
      const doubleBonus = window._doubleCoinActive ? 1 : 0; // 2× COINS spin prize
      const earned = (v + vehicleBonus) * (1 + doubleBonus);
      sessionCoins += earned;
      spawnParticles(c.x, c.y, window._doubleCoinActive ? '#E040FB' : '#FFD700', 5);
      Snd.play('coin');
      const popText = '+' + earned + (window._doubleCoinActive ? ' 💰' : '');
      const popColor = window._doubleCoinActive ? '#E040FB' : '#FFD700';
      popups.push({ text: popText, x: c.x, y: c.y - 18, alpha: 1, timer: 0.9, color: popColor });
      return false;
    }
    return c.x > -20;
  });

  // ── ENEMIES ──
  updateEnemies(dt);

  // ── BOSS ──
  if (boss) updateBoss(dt);

  // Global vy clamp — prevents fan/enemy wind from pushing beyond safe speeds
  player.vy = Math.max(-380, Math.min(380, player.vy));

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

  // ── FREE PLAY: scale difficulty continuously with distance (no cap) ──
  if (isFreePlay) {
    // Phase 0-5000m: gentle ramp. Beyond 5000m: keeps getting harder with slower curve
    const fp_t  = Math.min(1, distance / 5000);          // 0→1 over first 5km
    const fp_t2 = Math.min(1, Math.max(0, (distance - 5000) / 10000)); // 0→1 from 5k→15km
    const baseSpeed       = (3 + fp_t * 6) * 0.88;
    const bonusSpeed      = fp_t2 * 2.5;                 // up to +2.5 speed beyond 5k
    levelData.speed        = baseSpeed + bonusSpeed;
    levelData.gapFraction  = Math.max(0.22, (0.42 - fp_t * 0.15) - fp_t2 * 0.05);
    levelData.spawnInterval= Math.max(0.45, (2.0 - fp_t * 1.35) * 1.12 - fp_t2 * 0.2);
    levelData.fanChance    = Math.min(0.35, fp_t * 0.20 + fp_t2 * 0.15);
    levelData.birdChance   = Math.min(0.20, fp_t * 0.08 + fp_t2 * 0.12);
    const newBiome = Math.min(6, Math.floor(distance / 700));
    if (newBiome !== currentBiome) {
      currentBiome = newBiome;
      initBgEffects(currentBiome);
      biomeBanner.text  = tf('enteringZone', t('bm' + currentBiome).toUpperCase());
      biomeBanner.timer = 2.5;
      biomeBanner.color = null;
    }
    // Update enemies/shield pickups after distance threshold
    enemyTimer      = distance >= 500 && enemies.length === 0 ? Math.min(enemyTimer, 8) : enemyTimer;
    shieldPickupTimer = distance >= 300 ? Math.min(shieldPickupTimer, 18) : shieldPickupTimer;
  }

  // ── GOAL REACHED: boss level → spawn boss, normal → spawn runway (levels mode only) ──
  if (!isFreePlay && !landing && !boss && distance >= levelData.goal) {
    spawnTimer = 999; // stop obstacles
    if (BOSS_LEVELS.has(currentLevel)) {
      // Spawn the boss — refill ammo to max so player can fight
      const bCap = maxAmmo();
      if (bCap > 0) { ammo = bCap; updateShootBtn(); }
      boss = createBoss();
      popups.push({ text: '⚔️ BOSS INCOMING!', x: W * 0.5, y: H * 0.38, alpha: 1, timer: 2.5, color: '#FF4444' });
      screenShake = 0.8;
      Snd.play('landing_start');
    } else {
      const veh = VEHICLES[Save.data.activeVehicle];
      landing = {
        runway: { x: W + 200, y: H * 0.76, type: veh.landing },
        goalReached: true,
      };
      document.getElementById('shoot-btn').classList.add('hidden');
      Snd.play('landing_start');
    }
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
  const _crashSession = gameSession;
  setTimeout(() => { if (gameSession === _crashSession) showReviveScreen(); }, 800);
}

function updateHUD() {
  const distM = Math.floor(distance);
  document.getElementById('hud-distance').textContent = distM + 'm';
  const hudLeft = document.querySelector('.hud-left');
  if (isFreePlay) {
    const best = Save.data.freePlayBest || 0;
    document.getElementById('hud-goal').textContent = best > 0 ? '🏆 ' + best + 'm' : '';
    // In free play: hide the level panel entirely
    if (hudLeft) hudLeft.style.display = 'none';
  } else {
    document.getElementById('hud-goal').textContent = '/ ' + levelData.goal + 'm';
    document.getElementById('hud-level').textContent = currentLevel;
    if (hudLeft) hudLeft.style.display = '';
  }
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
    const _slideSession = gameSession;
    setTimeout(() => { if (gameSession === _slideSession) showLevelComplete(); }, 300);
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
    // Super Airflight — flying wing with iconic W trailing edge
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
  if (obs.type === 'pillar') {
    const topH = obs.gapY - obs.gap / 2;
    const botY = obs.gapY + obs.gap / 2;
    _drawWallForBiome(obs.x, obs.w, topH, botY, obs.seed || 0);
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
  } else if (obs.type === 'target') {
    drawTarget(obs);
  }
}

// ── BIOME WALL DRAWING ────────────────────────────────────
function _drawWallForBiome(cx, w, topH, botY, seed) {
  switch (currentBiome) {
    case 0: _wallCloud(cx, w, topH, botY, seed);      break;
    case 1: _wallBuilding(cx, w, topH, botY);         break;
    case 2: _wallNeon(cx, w, topH, botY);             break;
    case 3: _wallStormCloud(cx, w, topH, botY, seed); break;
    case 4: _wallIce(cx, w, topH, botY);              break;
    case 5: _wallRock(cx, w, topH, botY);             break;
    case 6: _wallAsteroid(cx, w, topH, botY);         break;
    default: _wallCloud(cx, w, topH, botY, seed);
  }
}

// Biome 0 — Sky: fluffy white cloud banks
function _wallCloud(cx, w, topH, botY, seed) {
  const x0 = cx - w / 2;
  const step = 18;
  // Top wall — light blue cloud body
  ctx.fillStyle = '#d6eeff';
  ctx.fillRect(x0, 0, w, topH);
  // Fluffy bottom edge (semi-circles)
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i * step < w + step; i++) {
    const bx = x0 + (((seed + i * 31) % 8) - 4) + i * step;
    const r = 12 + ((seed + i * 17) % 6);
    ctx.beginPath(); ctx.arc(bx, topH - 4, r, Math.PI, Math.PI * 2); ctx.fill();
  }
  // Soft shadow under top cloud
  const gradT = ctx.createLinearGradient(0, topH - 18, 0, topH);
  gradT.addColorStop(0, 'rgba(150,190,230,0)');
  gradT.addColorStop(1, 'rgba(120,170,220,0.35)');
  ctx.fillStyle = gradT; ctx.fillRect(x0, topH - 18, w, 18);

  // Bottom wall — light blue cloud body
  ctx.fillStyle = '#d6eeff';
  ctx.fillRect(x0, botY, w, H - botY);
  // Fluffy top edge
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i * step < w + step; i++) {
    const bx = x0 + (((seed + i * 23) % 8) - 4) + i * step;
    const r = 12 + ((seed + i * 13) % 6);
    ctx.beginPath(); ctx.arc(bx, botY + 4, r, 0, Math.PI); ctx.fill();
  }
  // Shadow at top of bottom cloud
  const gradB = ctx.createLinearGradient(0, botY, 0, botY + 18);
  gradB.addColorStop(0, 'rgba(120,170,220,0.35)');
  gradB.addColorStop(1, 'rgba(150,190,230,0)');
  ctx.fillStyle = gradB; ctx.fillRect(x0, botY, w, 18);
}

// Biome 1 — Sunset: building silhouettes with lit windows
function _wallBuilding(cx, w, topH, botY) {
  const x0 = cx - w / 2;
  const seed = (cx * 11) | 0;
  const bldW = Math.max(16, (w / 3) | 0);

  // Top wall — dark sky
  ctx.fillStyle = '#12060a';
  ctx.fillRect(x0, 0, w, topH);
  // Building silhouettes hanging from top
  for (let i = 0; x0 + i * bldW < cx + w / 2; i++) {
    const bx = x0 + i * bldW;
    const bh = 20 + ((seed + i * 37) % Math.max(20, (topH * 0.65) | 0));
    const bTop = topH - Math.min(bh, topH - 2);
    ctx.fillStyle = '#1e0e08';
    ctx.fillRect(bx, bTop, bldW - 2, topH - bTop);
    const rows = Math.max(1, ((topH - bTop - 8) / 14) | 0);
    for (let wr = 0; wr < rows; wr++) {
      const wy = bTop + 5 + wr * 14;
      ctx.fillStyle = ((seed + i * 7 + wr * 3) % 3) !== 0
        ? 'rgba(255,200,80,0.9)' : 'rgba(0,0,0,0.5)';
      ctx.fillRect(bx + 3, wy, bldW - 8, 8);
    }
    if (topH > 10) {
      ctx.fillStyle = 'rgba(255,60,20,0.9)';
      ctx.beginPath(); ctx.arc(bx + bldW / 2, bTop, 3, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Warm glow at gap
  const glowT = ctx.createLinearGradient(0, topH - 20, 0, topH);
  glowT.addColorStop(0, 'rgba(255,100,20,0)');
  glowT.addColorStop(1, 'rgba(255,100,20,0.6)');
  ctx.fillStyle = glowT; ctx.fillRect(x0, topH - 20, w, 20);

  // Bottom wall — dark sky
  ctx.fillStyle = '#12060a';
  ctx.fillRect(x0, botY, w, H - botY);
  // Building silhouettes rising from bottom
  for (let i = 0; x0 + i * bldW < cx + w / 2; i++) {
    const bx = x0 + i * bldW;
    const bh = 20 + (((seed * 2) + i * 29) % Math.max(20, ((H - botY) * 0.55) | 0));
    const bEnd = Math.min(botY + bh, H);
    ctx.fillStyle = '#1e0e08';
    ctx.fillRect(bx, botY, bldW - 2, bEnd - botY);
    const rows = Math.max(1, ((bEnd - botY - 8) / 14) | 0);
    for (let wr = 0; wr < rows; wr++) {
      const wy = botY + 5 + wr * 14;
      ctx.fillStyle = (((seed * 2) + i * 11 + wr * 5) % 3) !== 0
        ? 'rgba(255,200,80,0.9)' : 'rgba(0,0,0,0.5)';
      ctx.fillRect(bx + 3, wy, bldW - 8, 8);
    }
  }
  // Warm glow at gap
  const glowB = ctx.createLinearGradient(0, botY, 0, botY + 20);
  glowB.addColorStop(0, 'rgba(255,100,20,0.6)');
  glowB.addColorStop(1, 'rgba(255,100,20,0)');
  ctx.fillStyle = glowB; ctx.fillRect(x0, botY, w, 20);
}

// Biome 2 — Night: dark walls with cyan neon edges
function _wallNeon(cx, w, topH, botY) {
  const x0 = cx - w / 2;
  const seed = (cx * 13) | 0;
  // Dark wall bodies
  ctx.fillStyle = '#080818';
  ctx.fillRect(x0, 0, w, topH);
  ctx.fillRect(x0, botY, w, H - botY);
  // Vertical neon streaks inside walls
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const lx = x0 + 8 + ((seed + i * 19) % Math.max(1, w - 16));
    ctx.strokeStyle = 'rgba(0,229,255,0.15)';
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, topH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx, botY); ctx.lineTo(lx, H); ctx.stroke();
  }
  // Neon bar + glow — top gap edge
  const glowT = ctx.createLinearGradient(0, topH - 26, 0, topH - 4);
  glowT.addColorStop(0, 'rgba(0,229,255,0)');
  glowT.addColorStop(1, 'rgba(0,229,255,0.4)');
  ctx.fillStyle = glowT; ctx.fillRect(x0 - 4, topH - 26, w + 8, 22);
  ctx.fillStyle = '#00e5ff'; ctx.fillRect(x0 - 4, topH - 4, w + 8, 4);
  // Neon bar + glow — bottom gap edge
  ctx.fillStyle = '#00e5ff'; ctx.fillRect(x0 - 4, botY, w + 8, 4);
  const glowB = ctx.createLinearGradient(0, botY + 4, 0, botY + 26);
  glowB.addColorStop(0, 'rgba(0,229,255,0.4)');
  glowB.addColorStop(1, 'rgba(0,229,255,0)');
  ctx.fillStyle = glowB; ctx.fillRect(x0 - 4, botY + 4, w + 8, 22);
}

// Biome 3 — Storm: dark churning cloud masses with lightning
function _wallStormCloud(cx, w, topH, botY, seed) {
  const x0 = cx - w / 2;
  const step = 14;
  // Dark base
  ctx.fillStyle = '#18182a';
  ctx.fillRect(x0, 0, w, topH);
  ctx.fillRect(x0, botY, w, H - botY);
  // Turbulent bottom edge of top wall
  ctx.fillStyle = '#26263c';
  for (let i = 0; i * step < w + step; i++) {
    const bx = x0 + i * step;
    const r = 10 + ((seed + i * 23) % 9);
    ctx.beginPath(); ctx.arc(bx, topH - 2, r, Math.PI, Math.PI * 2); ctx.fill();
  }
  // Turbulent top edge of bottom wall
  for (let i = 0; i * step < w + step; i++) {
    const bx = x0 + i * step;
    const r = 10 + ((seed + i * 17) % 9);
    ctx.beginPath(); ctx.arc(bx, botY + 2, r, 0, Math.PI); ctx.fill();
  }
  // Purple-white glow at gap edges
  const glowT = ctx.createLinearGradient(0, topH - 22, 0, topH);
  glowT.addColorStop(0, 'rgba(190,180,255,0)');
  glowT.addColorStop(1, 'rgba(190,180,255,0.28)');
  ctx.fillStyle = glowT; ctx.fillRect(x0, topH - 22, w, 22);
  const glowB = ctx.createLinearGradient(0, botY, 0, botY + 22);
  glowB.addColorStop(0, 'rgba(190,180,255,0.28)');
  glowB.addColorStop(1, 'rgba(190,180,255,0)');
  ctx.fillStyle = glowB; ctx.fillRect(x0, botY, w, 22);
  // Static lightning bolt in top wall
  if ((seed % 3) === 0 && topH > 45) {
    ctx.strokeStyle = 'rgba(255,255,200,0.75)';
    ctx.lineWidth = 1.5;
    const lx = cx + ((seed % 22) - 11);
    ctx.beginPath();
    ctx.moveTo(lx,      topH - 32);
    ctx.lineTo(lx - 6,  topH - 16);
    ctx.lineTo(lx + 4,  topH - 16);
    ctx.lineTo(lx - 5,  topH - 2);
    ctx.stroke();
  }
}

// Biome 4 — Arctic: ice walls with icicles
function _wallIce(cx, w, topH, botY) {
  const x0 = cx - w / 2;
  const seed = (cx * 17) | 0;
  const iStep = 14;
  // Ice gradient — top
  const iceT = ctx.createLinearGradient(x0, 0, x0 + w, 0);
  iceT.addColorStop(0, '#a8d8ea'); iceT.addColorStop(0.5, '#dff4ff'); iceT.addColorStop(1, '#a8d8ea');
  ctx.fillStyle = iceT; ctx.fillRect(x0, 0, w, topH);
  // Horizontal strata
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
  for (let y = 18; y < topH; y += 20) {
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke();
  }
  // Icicles hanging from bottom of top wall
  for (let i = 0; i * iStep < w; i++) {
    const ix = x0 + i * iStep + 7;
    const ih = 12 + ((seed + i * 19) % 14);
    ctx.fillStyle = 'rgba(220,245,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(ix - 5, topH); ctx.lineTo(ix + 5, topH); ctx.lineTo(ix, topH + ih);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(180,230,255,0.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ix - 2, topH + 2); ctx.lineTo(ix - 2, topH + ih * 0.6); ctx.stroke();
  }

  // Ice gradient — bottom
  const iceB = ctx.createLinearGradient(x0, 0, x0 + w, 0);
  iceB.addColorStop(0, '#a8d8ea'); iceB.addColorStop(0.5, '#dff4ff'); iceB.addColorStop(1, '#a8d8ea');
  ctx.fillStyle = iceB; ctx.fillRect(x0, botY, w, H - botY);
  // Horizontal strata
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
  for (let y = botY + 18; y < H; y += 20) {
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke();
  }
  // Icicles pointing up from top of bottom wall
  for (let i = 0; i * iStep < w; i++) {
    const ix = x0 + i * iStep + 7;
    const ih = 12 + ((seed + i * 13) % 14);
    ctx.fillStyle = 'rgba(220,245,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(ix - 5, botY); ctx.lineTo(ix + 5, botY); ctx.lineTo(ix, botY - ih);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(180,230,255,0.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ix - 2, botY - 2); ctx.lineTo(ix - 2, botY - ih * 0.6); ctx.stroke();
  }
}

// Biome 5 — Canyon: layered rock walls with jagged edges
function _wallRock(cx, w, topH, botY) {
  const x0 = cx - w / 2;
  const seed = (cx * 13) | 0;
  const jStep = 12;
  const strataC = ['rgba(190,110,40,0.28)', 'rgba(90,40,10,0.28)', 'rgba(210,140,70,0.2)'];

  // Rock gradient — top
  const rT = ctx.createLinearGradient(x0, 0, x0 + w, topH);
  rT.addColorStop(0, '#7a3410'); rT.addColorStop(0.5, '#bf7030'); rT.addColorStop(1, '#6a2c08');
  ctx.fillStyle = rT; ctx.fillRect(x0, 0, w, topH);
  // Strata
  [0.3, 0.58, 0.82].forEach((f, i) => {
    ctx.fillStyle = strataC[i];
    ctx.fillRect(x0, topH * f, w, 8);
  });
  // Jagged bottom edge
  ctx.fillStyle = '#4a1e06';
  for (let i = 0; i * jStep < w; i++) {
    const jx = x0 + i * jStep;
    const jh = 8 + ((seed + i * 29) % 14);
    ctx.fillRect(jx, topH - jh, jStep - 1, jh);
  }

  // Rock gradient — bottom
  const rB = ctx.createLinearGradient(x0, botY, x0 + w, H);
  rB.addColorStop(0, '#6a2c08'); rB.addColorStop(0.5, '#bf7030'); rB.addColorStop(1, '#7a3410');
  ctx.fillStyle = rB; ctx.fillRect(x0, botY, w, H - botY);
  const remH = H - botY;
  [0.2, 0.5, 0.75].forEach((f, i) => {
    ctx.fillStyle = strataC[i];
    ctx.fillRect(x0, botY + remH * f, w, 8);
  });
  // Jagged top edge
  ctx.fillStyle = '#4a1e06';
  for (let i = 0; i * jStep < w; i++) {
    const jx = x0 + i * jStep;
    const jh = 8 + ((seed + i * 23) % 14);
    ctx.fillRect(jx, botY, jStep - 1, jh);
  }
}

// Biome 6 — Space: asteroid mass with purple glow + craters
function _wallAsteroid(cx, w, topH, botY) {
  const x0 = cx - w / 2;
  const seed = (cx * 19) | 0;

  // Dark asteroid body — top
  ctx.fillStyle = '#09090f';
  ctx.fillRect(x0, 0, w, topH);
  // Craters
  for (let i = 0; i < 4; i++) {
    const cxr = x0 + ((seed + i * 37) % Math.max(1, w - 10)) + 5;
    const cyr = ((seed + i * 53) % Math.max(1, topH - 10)) + 5;
    const cr  = 4 + ((seed + i * 11) % 6);
    ctx.strokeStyle = 'rgba(130,80,200,0.4)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cxr, cyr, cr, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.arc(cxr, cyr, cr * 0.65, 0, Math.PI * 2); ctx.fill();
  }
  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 5; i++) {
    const sx = x0 + ((seed + i * 31) % w);
    const sy = ((seed + i * 43) % Math.max(1, topH));
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }
  // Purple glow + bar — top gap edge
  const glowT = ctx.createLinearGradient(0, topH - 30, 0, topH - 3);
  glowT.addColorStop(0, 'rgba(160,55,230,0)');
  glowT.addColorStop(1, 'rgba(160,55,230,0.55)');
  ctx.fillStyle = glowT; ctx.fillRect(x0 - 4, topH - 30, w + 8, 27);
  ctx.fillStyle = '#b050ee'; ctx.fillRect(x0 - 4, topH - 3, w + 8, 3);

  // Dark asteroid body — bottom
  ctx.fillStyle = '#09090f';
  ctx.fillRect(x0, botY, w, H - botY);
  // Craters
  for (let i = 0; i < 4; i++) {
    const cxr = x0 + ((seed + i * 41) % Math.max(1, w - 10)) + 5;
    const cyr = botY + ((seed + i * 59) % Math.max(1, H - botY - 10)) + 5;
    const cr  = 4 + ((seed + i * 13) % 6);
    ctx.strokeStyle = 'rgba(130,80,200,0.4)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cxr, cyr, cr, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.arc(cxr, cyr, cr * 0.65, 0, Math.PI * 2); ctx.fill();
  }
  // Stars on bottom wall
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 5; i++) {
    const sx = x0 + ((seed + i * 47) % w);
    const sy = botY + ((seed + i * 61) % Math.max(1, H - botY));
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }
  // Purple glow + bar — bottom gap edge
  ctx.fillStyle = '#b050ee'; ctx.fillRect(x0 - 4, botY, w + 8, 3);
  const glowB = ctx.createLinearGradient(0, botY + 3, 0, botY + 30);
  glowB.addColorStop(0, 'rgba(160,55,230,0.55)');
  glowB.addColorStop(1, 'rgba(160,55,230,0)');
  ctx.fillStyle = glowB; ctx.fillRect(x0 - 4, botY + 3, w + 8, 27);
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
// ── TRAIL SKIN RENDERER ──────────────────────────────────
function drawTrail() {
  if (!player || !player.trail || player.trail.length < 2) return;
  const skinId = Save.data.activeSkin || 0;
  const skin   = TRAIL_SKINS[skinId] || TRAIL_SKINS[0];
  const trail  = player.trail;
  const len    = trail.length;
  const now    = performance.now() * 0.001;

  if (skinId === 0) {
    // Default: plain white fade
    trail.forEach((pt, i) => {
      const alpha = (1 - i / len) * 0.35;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, (1 - i / len) * 8, 0, Math.PI * 2); ctx.fill();
    });
    return;
  }

  const colors = skin.colors;
  if (skinId === 1) {
    // Sparkle: tiny golden stars scattered along trail
    trail.forEach((pt, i) => {
      const frac  = 1 - i / len;
      const alpha = frac * 0.9;
      const col   = colors[i % colors.length];
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(pt.x + (Math.sin(i * 2.7 + now) * 5), pt.y + (Math.cos(i * 3.1 + now) * 5));
      ctx.fillStyle = col;
      const r = frac * 5;
      for (let s = 0; s < 4; s++) {
        const a = (s / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  } else if (skinId === 2) {
    // Rainbow: hue-cycling dots
    trail.forEach((pt, i) => {
      const frac = 1 - i / len;
      const col  = colors[i % colors.length];
      ctx.save(); ctx.globalAlpha = frac * 0.8;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, frac * 9, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  } else if (skinId === 3) {
    // Sunray: warm glow with radial gradient
    trail.forEach((pt, i) => {
      const frac = 1 - i / len;
      if (frac < 0.05) return;
      const r  = frac * 12;
      const grd = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r);
      grd.addColorStop(0, `rgba(255,220,50,${frac * 0.7})`);
      grd.addColorStop(1, 'rgba(255,100,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2); ctx.fill();
    });
  } else if (skinId === 4) {
    // Ice: pale blue crystalline dots
    trail.forEach((pt, i) => {
      const frac = 1 - i / len;
      ctx.save(); ctx.globalAlpha = frac * 0.75;
      const grd = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, frac * 10);
      grd.addColorStop(0, '#FFFFFF'); grd.addColorStop(0.4, '#B3E5FC'); grd.addColorStop(1, 'rgba(0,200,255,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, frac * 10, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  } else if (skinId === 5) {
    // Lightning: jagged electric line + sparks
    ctx.save();
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.85;
    ctx.shadowColor = '#80D8FF'; ctx.shadowBlur = 8;
    ctx.beginPath();
    trail.forEach((pt, i) => {
      const jitter = i > 0 ? (Math.sin(i * 17.3 + now * 8) * 5) : 0;
      i === 0 ? ctx.moveTo(pt.x, pt.y + jitter) : ctx.lineTo(pt.x, pt.y + jitter);
    });
    ctx.stroke();
    // Sparks
    trail.forEach((pt, i) => {
      if (i % 3 !== 0) return;
      const frac = 1 - i / len;
      ctx.fillStyle = i % 2 === 0 ? '#FFFDE7' : '#80D8FF';
      ctx.globalAlpha = frac * 0.9;
      ctx.beginPath(); ctx.arc(pt.x, pt.y + (Math.sin(i * 5.1 + now * 6) * 8), frac * 3, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  } else if (skinId === 6) {
    // Fire: gradient from yellow (near) to red (far), bigger near player
    trail.forEach((pt, i) => {
      const frac = 1 - i / len;
      const r    = frac * 14;
      if (r < 1) return;
      const grd = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r);
      grd.addColorStop(0, `rgba(255,230,50,${frac * 0.9})`);
      grd.addColorStop(0.5, `rgba(255,120,0,${frac * 0.6})`);
      grd.addColorStop(1, 'rgba(200,30,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(pt.x, pt.y + Math.sin(i * 2.1 + now * 3) * 3, r, 0, Math.PI * 2); ctx.fill();
    });
  } else if (skinId === 7) {
    // Wave: sinusoidal colored dots
    trail.forEach((pt, i) => {
      const frac = 1 - i / len;
      const col  = colors[i % colors.length];
      const yOff = Math.sin(i * 0.8 + now * 4) * 6;
      ctx.save(); ctx.globalAlpha = frac * 0.8;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(pt.x, pt.y + yOff, frac * 8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  } else if (skinId === 8) {
    // Neon: glowing multicolor
    trail.forEach((pt, i) => {
      const frac = 1 - i / len;
      const col  = colors[i % colors.length];
      ctx.save();
      ctx.shadowColor = col; ctx.shadowBlur = 12;
      ctx.globalAlpha = frac * 0.9;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, frac * 7, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  }
}

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

// ── MYSTERY BOX REWARD ───────────────────────────────────
function _openMysteryBox(x, y) {
  const roll = Math.random();
  let rewardText, rewardColor;
  if (roll < 0.40) {
    // Coins (most common) — 20–80
    const c = 20 + Math.floor(Math.random() * 61);
    sessionCoins += c;
    rewardText = '+' + c + ' 🪙'; rewardColor = '#FFD700';
    spawnParticles(x, y, '#FFD700', 18);
  } else if (roll < 0.65) {
    // Big coins — 100–200
    const c = 100 + Math.floor(Math.random() * 101);
    sessionCoins += c;
    rewardText = '+' + c + ' 🪙!'; rewardColor = '#FF6B35';
    spawnParticles(x, y, '#FF6B35', 22);
  } else if (roll < 0.78) {
    // Ammo refill
    const cap = maxAmmo();
    if (cap > 0) {
      const gained = Math.min(4, cap - ammo);
      ammo = Math.min(ammo + gained, cap);
      updateShootBtn();
      rewardText = gained > 0 ? '+' + gained + ' AMMO!' : 'AMMO FULL'; rewardColor = '#ffcc02';
    } else {
      const c = 50; sessionCoins += c;
      rewardText = '+' + c + ' 🪙'; rewardColor = '#FFD700';
    }
    spawnParticles(x, y, '#ffcc02', 16);
  } else if (roll < 0.90) {
    // Shield
    shieldHits = Math.min(shieldHits + 1, 5);
    rewardText = '🛡 SHIELD!'; rewardColor = '#4CAF50';
    spawnParticles(x, y, '#4CAF50', 16);
  } else {
    // Diamond (rare)
    Save.data.diamonds = (Save.data.diamonds || 0) + 1;
    Save.save();
    rewardText = '💎 DIAMOND!'; rewardColor = '#00E5FF';
    spawnParticles(x, y, '#00E5FF', 28);
  }
  Snd.play('coin');
  popups.push({ text: rewardText, x, y: y - 30, alpha: 1, timer: 2.2, color: rewardColor });
}

// ── DRAW MYSTERY BOX ─────────────────────────────────────
function drawMysteryBox(mb) {
  ctx.save(); ctx.translate(mb.x, mb.y);
  const bob = Math.sin(mb.anim) * 4;
  ctx.translate(0, bob);
  const pulse = 0.5 + 0.5 * Math.sin(mb.anim * 2.5);
  // Outer glow
  const grd = ctx.createRadialGradient(0,0,0,0,0,28);
  grd.addColorStop(0, `rgba(160,80,255,${0.35 + pulse * 0.2})`);
  grd.addColorStop(1, 'rgba(160,80,255,0)');
  ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(0,0,28,0,Math.PI*2); ctx.fill();
  // Box body
  const sz = 20;
  ctx.fillStyle = '#6A1B9A';
  ctx.beginPath(); ctx.roundRect(-sz, -sz, sz*2, sz*2, 5); ctx.fill();
  ctx.strokeStyle = `rgba(220,140,255,${0.7 + pulse * 0.3})`; ctx.lineWidth = 2;
  ctx.stroke();
  // Lid line
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-sz, -3); ctx.lineTo(sz, -3); ctx.stroke();
  // Bow ribbon
  ctx.strokeStyle = '#E040FB'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-sz, -sz); ctx.lineTo(sz, sz); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sz, -sz); ctx.lineTo(-sz, sz); ctx.stroke();
  // Question mark
  ctx.fillStyle = 'white'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('?', 0, 1);
  ctx.restore();
}

// ── DRAW SHIELD PICKUP ───────────────────────────────────
function drawShieldPickup(sp) {
  ctx.save();
  ctx.translate(sp.x, sp.y + Math.sin(sp.anim) * 4);
  // Pulsing green glow
  const pulse = 0.5 + 0.5 * Math.sin(sp.anim * 2);
  const grd = ctx.createRadialGradient(0,0,0,0,0,30);
  grd.addColorStop(0, `rgba(76,175,80,${0.3 + pulse * 0.2})`);
  grd.addColorStop(1, 'rgba(76,175,80,0)');
  ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2); ctx.fill();
  // Shield body
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.bezierCurveTo(16, -18, 18, -8, 18, 2);
  ctx.bezierCurveTo(18, 12, 10, 20, 0, 24);
  ctx.bezierCurveTo(-10, 20, -18, 12, -18, 2);
  ctx.bezierCurveTo(-18, -8, -16, -18, 0, -18);
  ctx.closePath();
  ctx.fill();
  // Shield highlight
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.bezierCurveTo(10, -14, 12, -6, 12, 1);
  ctx.bezierCurveTo(12, 8, 6, 14, 0, 18);
  ctx.bezierCurveTo(-6, 14, -12, 8, -12, 1);
  ctx.bezierCurveTo(-12, -6, -10, -14, 0, -14);
  ctx.closePath();
  ctx.fill();
  // Shield icon (cross/plus)
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(-2, -8, 4, 16);
  ctx.fillRect(-8, -2, 16, 4);
  ctx.restore();
}


// ── DRAW TARGET ──────────────────────────────────────────
function drawTarget(obs) {
  ctx.save();
  ctx.translate(obs.x, obs.y);
  ctx.rotate(obs.anim * 0.8);
  const r = obs.r;

  // Outer glow
  const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, r + 12);
  grd.addColorStop(0, obs.color + '55');
  grd.addColorStop(1, obs.color + '00');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(0, 0, r + 12, 0, Math.PI * 2); ctx.fill();

  if (obs.shape === 'ufo') {
    // UFO body
    ctx.fillStyle = obs.color;
    ctx.beginPath(); ctx.ellipse(0, 4, r, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    // UFO dome
    ctx.fillStyle = obs.color + 'cc';
    ctx.beginPath(); ctx.ellipse(0, -2, r * 0.55, r * 0.45, 0, Math.PI, Math.PI * 2); ctx.fill();
    // Windows
    [-8, 0, 8].forEach(wx => {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(wx, 4, 3.5, 0, Math.PI * 2); ctx.fill();
    });
  } else {
    // Star shape (5 points)
    ctx.fillStyle = obs.color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.45;
      i === 0 ? ctx.moveTo(Math.cos(angle) * rad, Math.sin(angle) * rad)
              : ctx.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
    }
    ctx.closePath(); ctx.fill();
    // Inner highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.arc(0, -r * 0.25, r * 0.22, 0, Math.PI * 2); ctx.fill();
  }

  // Coin reward label
  ctx.rotate(-obs.anim * 0.8); // keep text upright
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('+' + obs.coins + '🪙', 1, r + 16);
  ctx.fillStyle = 'white';
  ctx.fillText('+' + obs.coins + '🪙', 0, r + 15);
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
    ctx.fillText(t('landHere'), rw.x - 60, rw.y - 30);
    ctx.restore();
  }

  ctx.restore();
}


// ── DRAW BACKGROUND ──────────────────────────────────────
function drawBackground(t) {
  if (W < 1 || H < 1) return; // guard: skip draw if canvas has zero size
  const b = BIOMES[currentBiome];
  const grd = ctx.createLinearGradient(0, 0, 0, Math.max(1, H));
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

  // ── SPEED BOOST VISUAL ──
  if (speedBoostEffect > 0) {
    const prog = speedBoostEffect / 1.2; // 1 → 0
    ctx.save();
    // Cyan flash overlay (strong at start, fades out)
    ctx.fillStyle = `rgba(0,229,255,${prog * 0.18})`;
    ctx.fillRect(0, 0, W, H);
    // Speed lines from player outward
    const numLines = 18;
    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2;
      const len = (60 + Math.random() * 80) * prog;
      const sx = player.x + Math.cos(angle) * 30;
      const sy = player.y + Math.sin(angle) * 20;
      ctx.strokeStyle = `rgba(0,229,255,${prog * 0.7})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
      ctx.stroke();
    }
    ctx.restore();
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
function draw(elapsed) {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (screenShake > 0.02) {
    ctx.translate((Math.random() - 0.5) * screenShake * 10, (Math.random() - 0.5) * screenShake * 10);
  }
  drawBackground(elapsed);

  // Landing runway (behind everything else, above bg)
  if (landing && landing.runway) drawRunway(landing.runway);

  // Trail
  drawTrail();

  // Coins, ammo, mystery boxes, shields, bullets, enemies, obstacles
  coins.forEach(c => drawCoin(c, elapsed));
  ammoPickups.forEach(ac => drawAmmoCrate(ac));
  mysteryBoxes.forEach(mb => drawMysteryBox(mb));
  shieldPickups.forEach(sp => drawShieldPickup(sp));
  bullets.forEach(b => drawBullet(b));
  enemies.forEach(en => drawEnemy(en));
  if (boss) drawBoss();
  drawEnemyBullets();
  obstacles.forEach(o => drawObstacle(o));
  drawPopups();

  // Shield flash
  if (player.invincible > 0 && Math.floor(elapsed*8)%2===0) {
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
    const bannerCol = biomeBanner.color || '#FFD700';
    ctx.save();
    // Background stripe
    ctx.fillStyle = `rgba(0,0,0,${a * 0.65})`;
    ctx.fillRect(0, H * 0.5 - 36, W, 72);
    // Colored accent line top + bottom
    ctx.fillStyle = bannerCol;
    ctx.globalAlpha = a * 0.9;
    ctx.fillRect(0, H * 0.5 - 36, W, 3);
    ctx.fillRect(0, H * 0.5 + 33, W, 3);
    ctx.globalAlpha = 1;
    // Text
    ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = `rgba(0,0,0,${a * 0.8})`; ctx.lineWidth = 5;
    ctx.strokeText(biomeBanner.text, W / 2, H * 0.5);
    ctx.fillStyle = `${bannerCol}${Math.round(a * 255).toString(16).padStart(2,'0')}`;
    ctx.fillText(biomeBanner.text, W / 2, H * 0.5);
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
    ctx.fillText(t('holdUp'), W * 0.5, H - 18);
    ctx.restore();
  }

  // Progress bar at very top
  if (levelData && !isFreePlay) {
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
  let loopOk = true;
  try {
    update(dt);
    draw(ts / 1000);
  } catch (e) {
    console.error('[loop error]', e);
    loopOk = false; // stop loop on unhandled error — prevents runaway broken state
  }
  if (loopOk && player && (player.alive || landing || boss || particles.length > 0)) {
    frameId = requestAnimationFrame(loop);
  }
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
  document.getElementById('menu-diamonds').textContent = Save.data.diamonds || 0;
  document.getElementById('menu-level').textContent = t('lvl') + ' ' + Save.data.currentLevel;
  const fpBest = Save.data.freePlayBest || 0;
  document.getElementById('fp-best-badge').textContent = fpBest > 0 ? '🏆 ' + fpBest + 'm' : '';
  showScreen('screen-menu');
  drawMenuVehicle();
  updateSpinButton();
  _startSpinCountdown();
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
  isFreePlay = false;
  gameSession++; // invalidate any pending showGameOver / showLevelComplete callbacks
  if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
  gameState = 'playing';
  showScreen('screen-game');
  // offsetWidth forces a synchronous layout flush so we always get the real size
  const w = canvas.offsetWidth  || window.innerWidth;
  const h = canvas.offsetHeight || window.innerHeight;
  canvas.width  = w > 10 ? w : window.innerWidth;
  canvas.height = h > 10 ? h : window.innerHeight;
  W = canvas.width; H = canvas.height;
  initGame(lvlNum);
  updateShootBtn(); // show/hide cannon button immediately based on level + upgrade
  Snd.startMusic();
  lastTime = null;
  frameId = requestAnimationFrame(loop);
}

function beginFreePlay() {
  isFreePlay = true;
  gameSession++;
  if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
  gameState = 'playing';
  showScreen('screen-game');
  const w = canvas.offsetWidth  || window.innerWidth;
  const h = canvas.offsetHeight || window.innerHeight;
  canvas.width  = w > 10 ? w : window.innerWidth;
  canvas.height = h > 10 ? h : window.innerHeight;
  W = canvas.width; H = canvas.height;
  // Init with level 1 params — difficulty scales dynamically with distance
  initGame(1);
  // Override: no goal, no boss in free play
  levelData = Object.assign({}, LEVELS[0], { goal: Infinity });
  updateHUD();
  updateShootBtn();
  Snd.startMusic();
  lastTime = null;
  frameId = requestAnimationFrame(loop);
}

// ── REVIVE SCREEN ────────────────────────────────────────
// ── UNIFIED DEATH SCREEN ─────────────────────────────────
// Called immediately after player dies (with 800ms delay from handleHit)
function showReviveScreen() {
  if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
  document.getElementById('shoot-btn').classList.add('hidden');
  gameState = 'dead';

  // Populate stats (coins not saved yet — only saved on final game-over)
  const distM = Math.floor(distance);
  document.getElementById('go-level').textContent = isFreePlay ? '∞' : currentLevel;
  if (isFreePlay) {
    const best = Save.data.freePlayBest || 0;
    document.getElementById('go-distance').textContent = distM + 'm' + (best > 0 ? ' / 🏆 ' + best + 'm' : '');
  } else {
    document.getElementById('go-distance').textContent = distM + 'm / ' + levelData.goal + 'm';
  }
  document.getElementById('go-coins').textContent = '+' + sessionCoins;

  showScreen('screen-revive');
  applyLang();

  // Ammo shop row — show only when cannon unlocked, not free play
  const deathAmmoShop = document.getElementById('death-ammo-shop');
  if (deathAmmoShop) {
    if (!isFreePlay && maxAmmo() > 0) {
      deathAmmoShop.classList.remove('hidden');
      document.getElementById('death-ammo-count').textContent = ammo;
    } else {
      deathAmmoShop.classList.add('hidden');
    }
  }

  // Determine available revives
  const cost      = (reviveCount + 1) * 100;
  const canCoin   = reviveCount < 3 && (Save.data.coins >= cost);
  const canAd     = !coinReviveUsedThisGame && AdManager.canShowRewardedAd();

  const continueEl = document.getElementById('death-continue');
  const endedEl    = document.getElementById('death-ended');

  if (!canCoin && !canAd) {
    // No revives left — jump straight to ended state
    continueEl.classList.add('hidden');
    endedEl.classList.remove('hidden');
    _finalizeGameOver(); // save coins etc.
    return;
  }

  // Show continue section
  continueEl.classList.remove('hidden');
  endedEl.classList.add('hidden');

  // Coin button
  const coinBtn = document.getElementById('revive-coin-btn');
  document.getElementById('revive-coin-cost').textContent = cost + ' 🪙';
  coinBtn.disabled = !canCoin;
  coinBtn.style.opacity = canCoin ? '1' : '0.45';

  // Ad section (hidden if player already used a coin revive)
  const adSection = document.getElementById('revive-ad-section');
  if (coinReviveUsedThisGame) {
    adSection.classList.add('hidden');
  } else {
    adSection.classList.remove('hidden');
    const adLeft = AdManager.MAX_AD_REVIVES - AdManager._adRevivesThisGame;
    const adCountEl = document.getElementById('revive-ad-count');
    if (adCountEl) adCountEl.textContent = adLeft;
    const adBtn  = document.getElementById('revive-ad-btn');
    adBtn.disabled = !canAd;
    adBtn.style.opacity = canAd ? '1' : '0.45';
  }

  // Countdown ring (5 seconds) — expires → auto new game
  const TOTAL = 5;
  let remaining = TOTAL;
  const circumference = 301.6;
  const ring  = document.getElementById('revive-ring-fill');
  const numEl = document.getElementById('revive-countdown-num');
  ring.style.strokeDashoffset = '0';
  numEl.textContent = TOTAL;

  if (reviveTimer) { clearInterval(reviveTimer); reviveTimer = null; }
  reviveTimer = setInterval(() => {
    remaining--;
    numEl.textContent = remaining;
    ring.style.strokeDashoffset = String(circumference * (1 - remaining / TOTAL));
    if (remaining <= 0) {
      clearInterval(reviveTimer); reviveTimer = null;
      startNewGameFromDeath();
    }
  }, 1000);
}

function doRevive(usedAd) {
  if (reviveTimer) { clearInterval(reviveTimer); reviveTimer = null; }

  if (!usedAd) {
    // Coin revive — deduct cost from saved coins
    coinReviveUsedThisGame = true;
    const cost = (reviveCount + 1) * 100;
    Save.data.coins = Math.max(0, Save.data.coins - cost);
    Save.save();
  }

  reviveCount++;

  // Resume game
  gameState = 'playing';
  player.alive = true;
  player.vy = 0;
  player.invincible = 3;
  obstacles = obstacles.filter(obs => obs.x >= player.x + 80);
  showScreen('screen-game');
  updateShootBtn();
  lastTime = null;
  frameId = requestAnimationFrame(loop);
}

function doActualGameOver() {
  if (reviveTimer) { clearInterval(reviveTimer); reviveTimer = null; }
  _finalizeGameOver();
  // Switch to ended section on same screen
  const continueEl = document.getElementById('death-continue');
  const endedEl    = document.getElementById('death-ended');
  continueEl.classList.add('hidden');

  // Interstitial every 7 game overs
  Save.data.gameCount = (Save.data.gameCount || 0) + 1;
  Save.save();
  if (Save.data.gameCount % 7 === 0) {
    AdManager.showInterstitial(() => { endedEl.classList.remove('hidden'); });
  } else {
    endedEl.classList.remove('hidden');
  }
}

// Called by countdown expiry or NEW GAME button — finalize then restart
function startNewGameFromDeath() {
  if (reviveTimer) { clearInterval(reviveTimer); reviveTimer = null; }
  _finalizeGameOver();
  Save.data.gameCount = (Save.data.gameCount || 0) + 1;
  Save.save();
  if (Save.data.gameCount % 7 === 0) {
    AdManager.showInterstitial(() => { isFreePlay ? beginFreePlay() : beginLevel(currentLevel); });
  } else {
    isFreePlay ? beginFreePlay() : beginLevel(currentLevel);
  }
}

function _finalizeGameOver() {
  // Save coins + free play best (idempotent — only applies once)
  if (_finalizeGameOver._done) return;
  _finalizeGameOver._done = true;

  Save.data.coins += sessionCoins;
  const distM = Math.floor(distance);
  if (isFreePlay && distM > (Save.data.freePlayBest || 0)) {
    Save.data.freePlayBest = distM;
    // Update the distance display to show new best
    document.getElementById('go-distance').textContent = distM + 'm 🏆 NEW BEST!';
  }
  Save.save();
}

// Reset the finalize guard at the start of every new game
function _resetFinalizeGuard() { _finalizeGameOver._done = false; }

function showLevelComplete() {
  gameState = 'levelcomplete';
  if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
  document.getElementById('shoot-btn').classList.add('hidden');
  Snd.play('levelcomplete');

  // Level completion bonus — scales with level (feels rewarding to advance)
  const levelBonus = currentLevel * 5;
  sessionCoins += levelBonus;

  // Advance level
  Save.data.coins += sessionCoins;
  // Earn 1 diamond every 5 levels
  const earnedDiamond = currentLevel % 5 === 0;
  if (earnedDiamond) {
    Save.data.diamonds = (Save.data.diamonds || 0) + 1;
  }
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

  const distM = Math.floor(distance);
  Save.save();

  document.getElementById('lc-level').textContent = currentLevel;
  document.getElementById('lc-distance').textContent = distM + 'm';
  document.getElementById('lc-coins').textContent = '+' + sessionCoins + ' (incl. +' + levelBonus + ' bonus)';
  // Diamond row
  const diamondRow = document.getElementById('lc-diamond-row');
  if (earnedDiamond) { diamondRow.classList.remove('hidden'); }
  else { diamondRow.classList.add('hidden'); }

  // Bravo line
  const bravoEl = document.getElementById('lc-bravo');
  if (isLast) {
    bravoEl.textContent = tf('prestigeText', Save.data.prestige);
  } else {
    bravoEl.textContent = t('wellDone');
  }

  document.getElementById('nextLevelBtn').textContent = isLast
    ? t('ascendText') + ' ›'
    : t('nextLevelText') + ' ' + (currentLevel + 1) + ' ›';

  // If entering new biome, show banner text on complete screen
  const nextLevel = isLast ? 1 : currentLevel + 1;
  const newBiome = LEVELS[nextLevel - 1]?.biome;
  const bioLabel = document.getElementById('lc-biome');
  if (!isLast && nextLevel % 10 === 1 && newBiome !== currentBiome) {
    bioLabel.textContent = tf('coinsWorthText', t('bm' + newBiome).toUpperCase(), COIN_VALUES[newBiome]);
    bioLabel.classList.remove('hidden');
  } else if (isLast) {
    bioLabel.textContent = t('allCompleteText');
    bioLabel.classList.remove('hidden');
  } else {
    bioLabel.classList.add('hidden');
  }

  // Ammo shop row — show only when cannon is unlocked
  const ammoShopRow = document.getElementById('lc-ammo-shop');
  if (maxAmmo() > 0) {
    ammoShopRow.classList.remove('hidden');
    document.getElementById('lc-ammo-count').textContent = ammo;
  } else {
    ammoShopRow.classList.add('hidden');
  }

  showScreen('screen-levelcomplete');
}

function lcBuyAmmo() {
  const AMMO_COST = 50;
  const cap = maxAmmo();
  if (cap <= 0) return; // no cannon
  if (ammo >= cap) {
    popups.push({ text: 'AMMO FULL!', x: W * 0.5, y: H * 0.5, alpha: 1, timer: 1.2, color: '#FF6B35' });
    return;
  }
  const totalCoins = Save.data.coins; // sessionCoins already saved at level complete
  if (totalCoins < AMMO_COST) {
    // Flash the cost button red briefly
    const btn = document.querySelector('.lc-ammo-btn');
    if (btn) { btn.style.background = '#c62828'; setTimeout(() => { btn.style.background = ''; }, 400); }
    return;
  }
  Save.data.coins -= AMMO_COST;
  ammo = Math.min(ammo + 1, cap);
  Save.save();
  document.getElementById('lc-ammo-count').textContent = ammo;
  // Refresh coin display
  document.getElementById('lc-coins').textContent = '+' + sessionCoins + ' (incl. +' + (currentLevel * 5) + ' bonus)';
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
      const locked  = lv.id > current;
      const isBoss  = BOSS_LEVELS.has(lv.id);
      const bossClass = isBoss ? ' boss-level' : '';
      const bossCrown = isBoss ? '<span class="lv-boss-crown">⚔️</span>' : '';
      const titleStr = ` title="Level ${lv.id}"`;

      if (locked) {
        return `<div class="lv-bubble locked${bossClass}"${titleStr}>${bossCrown}<span class="lv-lock-icon">🔒</span><span class="lv-lock-num">${lv.id}</span></div>`;
      } else if (done) {
        return `<div class="lv-bubble done${bossClass}"${titleStr} onclick="startLevelFromSelect(${lv.id})">${bossCrown}✓</div>`;
      } else {
        // active (current level)
        return `<div class="lv-bubble current${bossClass}"${titleStr} onclick="startLevelFromSelect(${lv.id})">${bossCrown}${lv.id}</div>`;
      }
    }).join('');

    return `
      <div class="world-section">
        <div class="world-header" style="background:${color}">
          <span class="world-emoji">${WORLD_EMOJIS[wi]}</span>
          <span class="world-name">${t('bm' + wi).toUpperCase()}</span>
          <span class="world-range">${wi*10+1}–${wi*10+10}</span>
        </div>
        <div class="world-bubbles">${bubbles}</div>
      </div>`;
  }).join('');
}

function startLevelFromSelect(lvlId) {
  if (lvlId > Save.data.currentLevel) return; // locked
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
  document.getElementById('vehicle-name').textContent = t('vn' + v.id);
  drawVehicle(vCtx, 60, 40, v, 0, 1.4);
  if (gameState === 'menu') requestAnimationFrame(drawMenuVehicle);
}

// ── SHOP ─────────────────────────────────────────────────
function renderShop() {
  document.getElementById('shop-coins').textContent = Save.data.coins;
  document.getElementById('shop-diamonds').textContent = Save.data.diamonds || 0;
  const curLvl = Save.data.currentLevel;
  document.getElementById('vehicles-grid').innerHTML = VEHICLES.map(v => {
    const owned    = Save.data.ownedVehicles.includes(v.id);
    const active   = Save.data.activeVehicle === v.id;
    const lvlLocked = !owned && curLvl < v.levelReq; // not yet reached required level
    const cls = active ? 'active' : owned ? 'owned' : lvlLocked ? 'level-locked' : 'locked';
    const bottom = active
      ? `<div class="vc-badge" style="color:#FF6B35">${t('active')||'ACTIVE'}</div>`
      : owned
        ? `<div class="vc-badge" style="color:#4CAF50">${t('owned')||'OWNED'}</div>`
        : lvlLocked
          ? `<div class="vc-lvl-req">🔒 LVL ${v.levelReq}</div>`
          : `<div class="vc-cost">🪙 ${v.cost}</div>`;
    return `<div class="vehicle-card ${cls}" onclick="selectVehicle(${v.id})">
      <div class="vc-icon">${lvlLocked ? '🔒' : v.emoji}</div>
      <div class="vc-name">${t('vn'+v.id)}</div>
      <div class="vc-perk">${lvlLocked ? `Reach level ${v.levelReq} to unlock` : t('vp'+v.id)}</div>
      ${bottom}
    </div>`;
  }).join('');

  document.getElementById('upgrades-list').innerHTML = UPGRADES.map(upg => {
    const level = Save.data.upgrades[upg.id];
    const maxed = level >= upg.maxLevel;
    const cost  = maxed ? 0 : upg.costs[level];
    const pct   = (level / upg.maxLevel) * 100;
    const lvlLocked = upg.levelReq && Save.data.currentLevel < upg.levelReq;
    const descExtra = upg.id === 'control' && level > 0 ? ` — +${level*15}%` : '';
    if (lvlLocked) {
      return `<div class="upgrade-row" style="opacity:0.45;pointer-events:none">
        <div class="up-icon">🔒</div>
        <div class="up-info">
          <div class="up-name">${upg.icon} ${upg.name} <span style="color:rgba(255,255,255,0.4);font-size:12px">Lv 0/${upg.maxLevel}</span></div>
          <div class="up-desc">Reach Level ${upg.levelReq} to unlock</div>
          <div class="up-bar"><div class="up-bar-fill" style="width:0%"></div></div>
        </div>
        <div class="up-cost" style="color:#888">LVL ${upg.levelReq}</div>
      </div>`;
    }
    return `<div class="upgrade-row" onclick="buyUpgrade('${upg.id}')">
      <div class="up-icon">${upg.icon}</div>
      <div class="up-info">
        <div class="up-name">${t('un_'+upg.id)} <span style="color:rgba(255,255,255,0.4);font-size:12px">Lv ${level}/${upg.maxLevel}</span></div>
        <div class="up-desc">${t('ud_'+upg.id)}${descExtra}</div>
        <div class="up-bar"><div class="up-bar-fill" style="width:${pct}%"></div></div>
      </div>
      ${maxed ? '<div class="up-maxed">MAX</div>' : `<div class="up-cost">🪙 ${cost}</div>`}
    </div>`;
  }).join('');

  // Skins
  document.getElementById('skins-grid').innerHTML = TRAIL_SKINS.map(sk => {
    const owned  = Save.data.ownedSkins.includes(sk.id);
    const active = Save.data.activeSkin === sk.id;
    const isDiamond = sk.currency === 'diamonds';
    const costStr = sk.cost === 0 ? 'FREE' : (isDiamond ? `💎 ${sk.cost}` : `🪙 ${sk.cost}`);
    const canAfford = sk.cost === 0 || (isDiamond ? (Save.data.diamonds || 0) >= sk.cost : Save.data.coins >= sk.cost);
    const btnLabel = active ? 'ACTIVE' : owned ? 'EQUIP' : costStr;
    const btnStyle = active
      ? 'background:#FF6B35;color:#fff'
      : owned
        ? 'background:#4CAF50;color:#fff'
        : canAfford
          ? (isDiamond ? 'background:#0288D1;color:#fff' : 'background:#7B1FA2;color:#fff')
          : 'background:#555;color:#aaa;pointer-events:none';
    // Preview bar: colored squares from skin colors
    const preview = sk.colors.length
      ? sk.colors.map(c => `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${c};margin:1px"></span>`).join('')
      : '<span style="color:#888;font-size:11px">—</span>';
    return `<div class="skin-card${active ? ' skin-active' : ''}" onclick="selectSkin(${sk.id})">
      <div class="skin-emoji">${sk.emoji}</div>
      <div class="skin-name">${sk.name}</div>
      <div class="skin-preview">${preview}</div>
      <button class="skin-btn" style="${btnStyle}">${btnLabel}</button>
    </div>`;
  }).join('');
}

function selectSkin(id) {
  const sk = TRAIL_SKINS[id];
  if (!sk) return;
  if (Save.data.ownedSkins.includes(id)) {
    // Equip
    Save.data.activeSkin = id;
    Save.save(); renderShop(); Snd.play('coin');
  } else {
    // Buy
    const isDiamond = sk.currency === 'diamonds';
    const balance = isDiamond ? (Save.data.diamonds || 0) : Save.data.coins;
    if (balance < sk.cost) return;
    if (isDiamond) { Save.data.diamonds = (Save.data.diamonds || 0) - sk.cost; }
    else { Save.data.coins -= sk.cost; }
    Save.data.ownedSkins.push(id);
    Save.data.activeSkin = id;
    Save.save(); renderShop(); Snd.play('buy');
  }
}

function selectVehicle(id) {
  const v = VEHICLES[id];
  if (Save.data.ownedVehicles.includes(id)) {
    // Already owned — just equip
    Save.data.activeVehicle = id; Save.save(); renderShop();
  } else if (Save.data.currentLevel < v.levelReq) {
    // Level-locked — show a quick shake/flash on the card (no purchase)
    return;
  } else if (Save.data.coins >= v.cost) {
    // Can afford — buy and equip
    Save.data.coins -= v.cost;
    Save.data.ownedVehicles.push(id);
    Save.data.activeVehicle = id;
    Save.save(); renderShop(); Snd.play('buy');
  }
}
function buyUpgrade(id) {
  const upg = UPGRADES.find(u => u.id === id);
  if (!upg) return;
  if (upg.levelReq && Save.data.currentLevel < upg.levelReq) return; // level-locked
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

  // Block scroll/bounce on iOS Safari during gameplay only — allow scroll in shop/levels
  document.addEventListener('touchmove', e => {
    if (gameState === 'playing' || gameState === 'landing' || gameState === 'countdown') e.preventDefault();
  }, { passive: false });

  // Hold anywhere on screen = fly up; double-tap anywhere also shoots
  let lastTapTime = 0;
  gc.addEventListener('touchstart', e => {
    e.preventDefault();
    isHolding = true;
    // Double-tap on the game area as secondary fire trigger
    const now = Date.now();
    if (now - lastTapTime < 280) { shoot(); lastTapTime = 0; }
    else lastTapTime = now;
  }, { passive: false });
  gc.addEventListener('touchend',    () => { isHolding = false; });
  gc.addEventListener('touchcancel', () => { isHolding = false; });

  // Mouse (desktop): hold = fly up, double-click = shoot
  gc.addEventListener('mousedown',  () => { isHolding = true; });
  gc.addEventListener('mouseup',    () => { isHolding = false; });
  gc.addEventListener('mouseleave', () => { isHolding = false; });
  gc.addEventListener('dblclick',   () => { shoot(); });

  // ── SHOOT BUTTON — dedicated tap target on mobile ────────
  const shootBtn = document.getElementById('shoot-btn');
  // Touch: fire on touchstart so there's no delay, block propagation so the
  // underlying canvas touchstart doesn't toggle isHolding or count as a double-tap
  shootBtn.addEventListener('touchstart', e => {
    e.stopPropagation();
    e.preventDefault();
    shoot();
  }, { passive: false });
  shootBtn.addEventListener('touchend', e => {
    e.stopPropagation();
    e.preventDefault();
  }, { passive: false });
  // Click covers desktop testing
  shootBtn.addEventListener('click', e => { e.stopPropagation(); shoot(); });
}

// ── AUDIO ─────────────────────────────────────────────────
const Snd = (() => {
  let ctx = null;
  let musicGain = null;
  let musicPlaying = false;
  let musicSession = 0; // incremented on every startMusic — stale loops self-abort

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  // Auto-disconnect nodes after they finish — prevents iOS Safari WebAudio node leak crash
  function free(node, ...extras) {
    try {
      node.addEventListener('ended', () => {
        try { node.disconnect(); } catch(_) {}
        extras.forEach(n => { try { n.disconnect(); } catch(_) {} });
      });
    } catch(_) {}
  }

  function play(type) {
    try {
      const ac = getCtx();
      if (ac.state === 'suspended') ac.resume();
      if (type === 'shoot') {
        // Cannon "pew" — sharp descending sawtooth + noise kick
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(520, ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(90, ac.currentTime + 0.09);
        o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.28, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
        free(o, g); o.start(); o.stop(ac.currentTime + 0.13);
        // Short noise burst for impact body
        const nLen = (ac.sampleRate * 0.06) | 0;
        const nBuf = ac.createBuffer(1, nLen, ac.sampleRate);
        const nd = nBuf.getChannelData(0);
        for (let i = 0; i < nLen; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nLen) * 0.6;
        const ns = ac.createBufferSource(), ng = ac.createGain();
        ns.buffer = nBuf; ns.connect(ng); ng.connect(ac.destination);
        ng.gain.setValueAtTime(0.22, ac.currentTime);
        ng.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.07);
        free(ns, ng); ns.start(); ns.stop(ac.currentTime + 0.08);
      } else if (type === 'coin') {
        // quick ascending ding — only play 1 oscillator (not 3) to reduce node count
        const o = ac.createOscillator(), g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.frequency.value = 880; o.type = 'sine';
        g.gain.setValueAtTime(0.18, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
        free(o, g); o.start(); o.stop(ac.currentTime + 0.13);
      } else if (type === 'land') {
        // thud
        const o = ac.createOscillator(), g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.type = 'sine'; o.frequency.setValueAtTime(220, ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.3);
        g.gain.setValueAtTime(0.5, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
        free(o, g); o.start(); o.stop(ac.currentTime + 0.36);
        // chime
        [523, 659, 784, 1047].forEach((freq, i) => {
          const o2 = ac.createOscillator(), g2 = ac.createGain();
          o2.connect(g2); g2.connect(ac.destination);
          o2.frequency.value = freq; o2.type = 'sine';
          const t = ac.currentTime + 0.2 + i * 0.1;
          g2.gain.setValueAtTime(0.15, t);
          g2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          free(o2, g2); o2.start(t); o2.stop(t + 0.26);
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
        free(src, filt, g); src.start(); src.stop(ac.currentTime + 0.41);
      } else if (type === 'crash') {
        // explosion thud
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(180, ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(40, ac.currentTime + 0.5);
        o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.6, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
        free(o, g); o.start(); o.stop(ac.currentTime + 0.51);
        // noise burst
        const nLen = ac.sampleRate * 0.35;
        const nBuf = ac.createBuffer(1, nLen, ac.sampleRate);
        const nd = nBuf.getChannelData(0);
        for (let i = 0; i < nLen; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nLen) * 0.8;
        const ns = ac.createBufferSource(), ng = ac.createGain();
        ns.buffer = nBuf; ns.connect(ng); ng.connect(ac.destination);
        ng.gain.setValueAtTime(0.5, ac.currentTime);
        ng.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
        free(ns, ng); ns.start(); ns.stop(ac.currentTime + 0.36);
      } else if (type === 'shield') {
        // metallic clang
        [320, 640, 1280].forEach((freq, i) => {
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = 'sine'; o.frequency.value = freq;
          o.connect(g); g.connect(ac.destination);
          const t = ac.currentTime + i * 0.02;
          g.gain.setValueAtTime(0.2, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          free(o, g); o.start(t); o.stop(t + 0.31);
        });
      } else if (type === 'speedup') {
        // Fast ascending whoosh — short and soft so it doesn't drown music
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(200, ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(1400, ac.currentTime + 0.25);
        o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.12, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.28);
        free(o, g); o.start(); o.stop(ac.currentTime + 0.29);
        // High sparkle on top
        const o2 = ac.createOscillator(), g2 = ac.createGain();
        o2.type = 'sine'; o2.frequency.value = 1760;
        o2.connect(g2); g2.connect(ac.destination);
        g2.gain.setValueAtTime(0.1, ac.currentTime + 0.2);
        g2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.45);
        free(o2, g2); o2.start(ac.currentTime + 0.2); o2.stop(ac.currentTime + 0.46);
      } else if (type === 'levelcomplete') {
        // Happy fanfare
        const fanfare = [
          [523, 0.00, 0.10], [659, 0.10, 0.10], [784, 0.20, 0.10],
          [1047,0.30, 0.18], [784, 0.52, 0.12], [1047,0.64, 0.12], [1319,0.76, 0.30],
        ];
        fanfare.forEach(([freq, start, dur]) => {
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = 'triangle'; o.frequency.value = freq;
          o.connect(g); g.connect(ac.destination);
          const t = ac.currentTime + start;
          g.gain.setValueAtTime(0.28, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + dur);
          free(o, g); o.start(t); o.stop(t + dur + 0.01);
        });
        // Harmony layer
        [[392,0.30],[523,0.52],[659,0.76]].forEach(([freq, start]) => {
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = 'sine'; o.frequency.value = freq;
          o.connect(g); g.connect(ac.destination);
          const t = ac.currentTime + start;
          g.gain.setValueAtTime(0.12, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          free(o, g); o.start(t); o.stop(t + 0.36);
        });
      } else if (type === 'buy') {
        // Happy ascending chime
        [523, 784, 1047].forEach((freq, i) => {
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = 'sine'; o.frequency.value = freq;
          o.connect(g); g.connect(ac.destination);
          const t = ac.currentTime + i * 0.09;
          g.gain.setValueAtTime(0.25, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          free(o, g); o.start(t); o.stop(t + 0.23);
        });
      }
    } catch(e) {}
  }

  // Upbeat chiptune — reduced to ~18 notes/loop (was 34) to limit node creation rate
  const MELODY = [
    [659,0.15],[784,0.15],[880,0.2],[784,0.15],[659,0.25],[0,0.1],
    [587,0.15],[659,0.15],[784,0.3],[0,0.1],
    [523,0.12],[659,0.12],[784,0.25],[0,0.1],
    [880,0.12],[784,0.12],[659,0.3],[0,0.1],
    [784,0.2],[659,0.15],[523,0.2],[0,0.1],
    [659,0.15],[784,0.2],[988,0.3],[0,0.2],
    [880,0.12],[784,0.12],[659,0.12],[523,0.25],[0,0.3],
  ];

  function startMusic() {
    if (musicPlaying) return;
    try {
      const ac = getCtx();
      // Resume suspended context (e.g. after page coming back from background)
      if (ac.state === 'suspended') ac.resume();
      // Discard previous gain node — prevents accumulation across sessions
      if (musicGain) { try { musicGain.disconnect(); } catch(_) {} musicGain = null; }
      musicGain = ac.createGain();
      musicGain.gain.value = 0.06;
      musicGain.connect(ac.destination);
      musicPlaying = true;
      // Stamp this session — any stale scheduleLoop from a previous session will abort
      const mySession = ++musicSession;
      let t = ac.currentTime + 0.1;
      function scheduleLoop() {
        // Abort if music was stopped OR a newer startMusic() replaced us
        if (!musicPlaying || musicSession !== mySession) return;
        if (t < ac.currentTime) t = ac.currentTime + 0.05;
        MELODY.forEach(([freq, dur]) => {
          if (freq > 0) {
            const o = ac.createOscillator(), g = ac.createGain();
            o.type = 'triangle'; o.frequency.value = freq;
            o.connect(g); g.connect(musicGain);
            g.gain.setValueAtTime(0.4, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + dur - 0.01);
            free(o, g); o.start(t); o.stop(t + dur);
          }
          t += dur;
        });
        setTimeout(scheduleLoop, Math.max(100, (t - 0.5 - ac.currentTime) * 1000));
      }
      scheduleLoop();
    } catch(e) {}
  }

  function stopMusic() {
    musicPlaying = false;
    if (musicGain) {
      try { musicGain.disconnect(); } catch(_) {}
      musicGain = null;
    }
    // Suspend the AudioContext entirely — stops ALL scheduled audio on iOS
    // (disconnecting musicGain is not enough; scheduled oscillator nodes keep ticking)
    if (ctx) { try { ctx.suspend(); } catch(_) {} }
  }

  return { play, startMusic, stopMusic };
})();

// ── AUDIO LIFECYCLE — stop when app goes to background ────
// iOS Safari keeps WebAudio running even after the user switches away,
// which causes music to bleed into other apps and the notification bar.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    Snd.stopMusic();
  } else {
    // Page is visible again — if a game is in progress, restart background music
    if (gameState === 'playing' || gameState === 'landing' || gameState === 'countdown') {
      Snd.startMusic();
    }
  }
});
// pagehide fires on iOS when the user leaves the tab (visibilitychange may not)
window.addEventListener('pagehide', () => Snd.stopMusic());

// ── INDEXEDDB PERSISTENCE (survives browser clear) ───────
const IDB = (() => {
  const DB = 'PaperAirplaneDB', VER = 1, STORE = 'save';
  let db = null;
  function open() {
    return new Promise((res, rej) => {
      if (db) return res(db);
      const req = indexedDB.open(DB, VER);
      req.onupgradeneeded = e => e.target.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = e => { db = e.target.result; res(db); };
      req.onerror = rej;
    });
  }
  async function set(val) {
    try {
      await open();
      return new Promise((res, rej) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put({ id: 'data', payload: JSON.stringify(val) });
        tx.oncomplete = res; tx.onerror = rej;
      });
    } catch(e) {}
  }
  async function get() {
    try {
      await open();
      return new Promise((res, rej) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get('data');
        req.onsuccess = e => res(e.target.result ? JSON.parse(e.target.result.payload) : null);
        req.onerror = rej;
      });
    } catch(e) { return null; }
  }
  return { set, get };
})();

// Patch Save to also use IndexedDB
const _origSave = Save.save.bind(Save);
Save.save = function() { _origSave(); IDB.set(this.data); };

// Try to recover from IndexedDB if localStorage is empty
Save._loadIDB = async function() {
  const stored = await IDB.get();
  if (!stored) return;
  // Only apply if current data looks like defaults (no progress)
  if (!this.data || (this.data.coins === 0 && this.data.currentLevel === 1 && this.data.bestLevel === 1)) {
    this.data = { ...this.fresh(), ...stored };
    this.save();
  }
};

// ── DAILY LOGIN GIFT ─────────────────────────────────────
const DAY_REWARDS = [20, 30, 40, 60, 80, 100, 150]; // streak day 1-7, then repeats

function checkDailyGift() {
  const now = Date.now();
  const lastLogin = Save.data.lastLogin || 0;
  const streak    = Save.data.loginStreak || 0;
  const msInDay   = 24 * 3600 * 1000;
  const daysSince = Math.floor((now - lastLogin) / msInDay);
  if (daysSince < 1) return; // already logged in today

  const newStreak  = daysSince === 1 ? streak + 1 : 1; // reset if missed a day
  const rewardAmt  = DAY_REWARDS[(newStreak - 1) % DAY_REWARDS.length];

  Save.data.lastLogin   = now;
  Save.data.loginStreak = newStreak;
  Save.data.coins      += rewardAmt;
  Save.save();

  // Show gift popup after a short delay so the menu is visible
  setTimeout(() => showDailyGiftPopup(newStreak, rewardAmt), 600);
}

function showDailyGiftPopup(streak, coins) {
  // Reuse spin modal styling with different content
  const overlay = document.createElement('div');
  overlay.className = 'spin-modal';
  overlay.id = 'gift-overlay';
  overlay.innerHTML = `
    <div class="spin-box" style="gap:14px;max-width:300px">
      <div style="font-size:56px;line-height:1">🎁</div>
      <div class="spin-title" style="font-size:18px">DAILY GIFT!</div>
      <div style="color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:1px">DAY ${streak} STREAK</div>
      <div style="font-size:36px;font-weight:bold;color:#FFD700;text-shadow:0 0 16px rgba(255,215,0,0.8)">+${coins} 🪙</div>
      <div style="color:rgba(255,255,255,0.5);font-size:11px">Come back tomorrow for more!</div>
      <button class="btn-play" style="font-size:18px;padding:12px 40px;max-width:200px" onclick="document.getElementById('gift-overlay').remove();document.getElementById('menu-coins').textContent=Save.data.coins;">COLLECT!</button>
    </div>`;
  document.body.appendChild(overlay);
}

// ── DAILY SPIN ───────────────────────────────────────────
const SPIN_PRIZES = [
  { id:'coins75',     label:'+75 🪙',         color:'#FFD700', weight:26 },
  { id:'coins200',    label:'+200 🪙',        color:'#FFC200', weight:16 },
  { id:'speed',       label:'⚡ TURBO!',       color:'#FF5722', weight:15 },
  { id:'shield',      label:'🛡 SHIELD ×3',   color:'#4CAF50', weight:13 },
  { id:'ammo',        label:'💥 FULL AMMO!',  color:'#E91E63', weight:12 },
  { id:'doublecoins', label:'💰 2× COINS',    color:'#9C27B0', weight:10 },
  { id:'coins500',    label:'+500 🪙',        color:'#FF6B35', weight:6  },
  { id:'vehicle',     label:'✈️ FREE PLANE!', color:'#00BCD4', weight:2  },
];

const MAX_AD_SPINS_PER_DAY = 3;
const DAY_MS = 24 * 3600 * 1000;

function _todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function freeSpinAvailable() {
  return Date.now() - (Save.data.lastFreeSpin || Save.data.lastSpin || 0) >= DAY_MS;
}

function adSpinsRemainingToday() {
  if (Save.data.adSpinDate !== _todayKey()) return MAX_AD_SPINS_PER_DAY;
  return MAX_AD_SPINS_PER_DAY - (Save.data.adSpinsToday || 0);
}

// legacy alias (some old calls may still use this)
function spinAvailable() { return freeSpinAvailable(); }

let _spinCountdownInterval = null;

function _formatSpinCountdown() {
  const rem = DAY_MS - (Date.now() - (Save.data.lastFreeSpin || Save.data.lastSpin || 0));
  if (rem <= 0) return '';
  const h = Math.floor(rem / 3600000);
  const m = Math.floor((rem % 3600000) / 60000);
  const s = Math.floor((rem % 60000) / 1000);
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
}

function updateSpinButton() {
  const btn = document.getElementById('spinBtn');
  const badge = document.getElementById('spin-badge');
  const countdown = document.getElementById('spin-countdown');
  if (!btn) return;
  const free = freeSpinAvailable();
  const adRem = adSpinsRemainingToday();
  if (free || adRem > 0) {
    btn.classList.remove('spin-unavailable');
    badge.classList.remove('hidden');
    countdown.textContent = free ? '' : _formatSpinCountdown();
  } else {
    btn.classList.add('spin-unavailable');
    badge.classList.add('hidden');
    countdown.textContent = _formatSpinCountdown();
  }
}

function _startSpinCountdown() {
  if (_spinCountdownInterval) clearInterval(_spinCountdownInterval);
  _spinCountdownInterval = setInterval(() => {
    if (gameState !== 'menu') { clearInterval(_spinCountdownInterval); _spinCountdownInterval = null; return; }
    updateSpinButton();
  }, 1000);
}

function drawSpinWheel() {
  const canvas = document.getElementById('spin-wheel');
  if (!canvas) return;
  const c = canvas.getContext('2d');
  const r = canvas.width / 2;
  const n = SPIN_PRIZES.length;
  const seg = (Math.PI * 2) / n;
  c.clearRect(0, 0, canvas.width, canvas.height);

  SPIN_PRIZES.forEach((prize, i) => {
    const start = i * seg - Math.PI / 2;
    const end   = start + seg;
    // Segment fill
    c.beginPath(); c.moveTo(r, r); c.arc(r, r, r - 2, start, end); c.closePath();
    c.fillStyle = prize.color; c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 2; c.stroke();
    // Label
    c.save(); c.translate(r, r); c.rotate(start + seg / 2);
    c.textAlign = 'right'; c.font = 'bold 10px Arial';
    c.strokeStyle = 'rgba(0,0,0,0.7)'; c.lineWidth = 3;
    c.strokeText(prize.label, r - 10, 4);
    c.fillStyle = 'white'; c.fillText(prize.label, r - 10, 4);
    c.restore();
  });

  // Center hub
  c.beginPath(); c.arc(r, r, 22, 0, Math.PI * 2);
  c.fillStyle = '#1a1a2e'; c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 2; c.stroke();
  c.fillStyle = 'white'; c.font = 'bold 16px Arial';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('✈️', r, r);
}

let _spinInProgress = false;

function _resetSpinWheel() {
  const wheel = document.getElementById('spin-wheel');
  wheel.style.transition = 'none';
  wheel.style.transform = 'rotate(0deg)';
  document.getElementById('spin-result').textContent = '';
  _spinInProgress = false;
  drawSpinWheel();
}

function _updateAdSpinSlots() {
  const rem = adSpinsRemainingToday();
  for (let i = 1; i <= MAX_AD_SPINS_PER_DAY; i++) {
    const btn = document.getElementById('spin-ad-' + i);
    if (!btn) continue;
    if (i <= MAX_AD_SPINS_PER_DAY - rem) {
      // used
      btn.textContent = '✓';
      btn.disabled = true;
      btn.style.opacity = '0.3';
    } else {
      btn.textContent = '▶ Ad spin';
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  }
}

function showSpin() {
  if (!freeSpinAvailable() && adSpinsRemainingToday() <= 0) return;
  const modal = document.getElementById('spin-modal');
  modal.classList.remove('hidden');
  _resetSpinWheel();
  const goBtn = document.getElementById('spin-btn-go');
  if (freeSpinAvailable()) {
    goBtn.disabled = false;
    goBtn.textContent = '🎰 SPIN!';
    goBtn.style.opacity = '1';
  } else {
    goBtn.disabled = true;
    goBtn.textContent = '✓ Used';
    goBtn.style.opacity = '0.4';
  }
  goBtn.onclick = () => doSpin(false);
  _updateAdSpinSlots();
}

function closeSpin() {
  document.getElementById('spin-modal').classList.add('hidden');
  updateSpinButton();
}

function doAdSpin() {
  if (_spinInProgress) return;
  if (adSpinsRemainingToday() <= 0) return;
  // Stop free-spin countdown during ad watch
  AdManager.showRewardedAd(() => {
    // Record ad spin
    const today = _todayKey();
    if (Save.data.adSpinDate !== today) {
      Save.data.adSpinDate = today;
      Save.data.adSpinsToday = 0;
    }
    Save.data.adSpinsToday = (Save.data.adSpinsToday || 0) + 1;
    Save.save();
    _updateAdSpinSlots();
    // Now run the spin animation
    _runSpinAnimation(true);
  });
}

function doSpin(isAd) {
  if (_spinInProgress) return;
  if (!isAd && !freeSpinAvailable()) return;
  _runSpinAnimation(isAd);
}

function _runSpinAnimation(isAd) {
  if (_spinInProgress) return;
  _spinInProgress = true;
  // Pick prize
  const total = SPIN_PRIZES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total, chosen = SPIN_PRIZES[0], prizeIdx = 0;
  for (let i = 0; i < SPIN_PRIZES.length; i++) {
    r -= SPIN_PRIZES[i].weight;
    if (r <= 0) { chosen = SPIN_PRIZES[i]; prizeIdx = i; break; }
  }
  // Calculate target rotation so chosen segment faces pointer (top)
  const segDeg = 360 / SPIN_PRIZES.length;
  const spins = 5 + Math.floor(Math.random() * 3);
  const targetDeg = spins * 360 + (360 - prizeIdx * segDeg - segDeg / 2);
  const wheel = document.getElementById('spin-wheel');
  wheel.style.transition = 'transform 4.2s cubic-bezier(0.17,0.67,0.12,0.99)';
  wheel.style.transform = `rotate(${targetDeg}deg)`;
  // Disable main button during spin
  const goBtn = document.getElementById('spin-btn-go');
  goBtn.disabled = true;
  goBtn.textContent = '⏳';
  goBtn.style.opacity = '0.5';
  setTimeout(() => {
    applySpinPrize(chosen);
    if (!isAd) {
      Save.data.lastFreeSpin = Date.now();
      Save.data.lastSpin = Save.data.lastFreeSpin; // keep compat
    }
    Save.save();
    const resultEl = document.getElementById('spin-result');
    const prizeDesc = {
      speed:       '⚡ TURBO active next level!\n+65% speed for the whole run!',
      shield:      '🛡 3 shields activated!\nYou can take 3 hits!',
      ammo:        '💥 Full ammo loaded!\nDouble-tap to fire in-game!',
      doublecoins: '💰 2× COINS next level!\nEvery coin is worth double!',
      vehicle:     '✈️ JACKPOT! A new plane!',
    };
    const desc = prizeDesc[chosen.id] || chosen.label;
    resultEl.innerHTML = `<span style="font-size:28px">${chosen.label}</span><br><small style="font-size:13px;opacity:0.85">${desc.replace('\n','<br>')}</small>`;
    resultEl.style.color = chosen.color;
    goBtn.textContent = '✓ CLOSE';
    goBtn.disabled = false;
    goBtn.style.opacity = '1';
    goBtn.onclick = closeSpin;
    updateSpinButton();
    _updateAdSpinSlots();
    document.getElementById('menu-coins').textContent = Save.data.coins;
    _spinInProgress = false;
  }, 4400);
}

function applySpinPrize(prize) {
  if (prize.id.startsWith('coins')) {
    const n = parseInt(prize.id.replace('coins', ''));
    Save.data.coins += n;
  } else if (prize.id === 'shield') {
    // 3 shield hits for next level
    Save.data.spinShields = Math.min(6, (Save.data.spinShields || 0) + 3);
  } else if (prize.id === 'ammo') {
    if (Save.data.upgrades.cannon > 0) {
      // Full ammo magazine for next level
      Save.data.spinAmmo = 20;
    } else {
      // No cannon yet — give coins instead
      Save.data.coins += 100;
      prize.label = '+100 🪙 (buy Cannon first!)';
    }
  } else if (prize.id === 'speed') {
    // TURBO: +65% speed for the entire next level
    Save.data.spinSpeed = 1;
  } else if (prize.id === 'doublecoins') {
    // All coins collected next level are worth 2×
    Save.data.spinDoubleCoins = 1;
  } else if (prize.id === 'vehicle') {
    // Random unowned plane — ultra rare
    const unowned = VEHICLES.filter(v => v.id >= 1 && !Save.data.ownedVehicles.includes(v.id));
    if (unowned.length > 0) {
      const gift = unowned[Math.floor(Math.random() * unowned.length)];
      Save.data.ownedVehicles.push(gift.id);
      prize.label = gift.emoji + ' ' + gift.name + ' UNLOCKED!';
    } else {
      Save.data.coins += 500;
      prize.label = '+500 🪙 (all planes owned!)';
    }
  }
  Save.save();
}

// ── INIT ─────────────────────────────────────────────────
window.addEventListener('load', () => {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  W = canvas.offsetWidth; H = canvas.offsetHeight;
  canvas.width = W; canvas.height = H;

  Save.load();
  Save._loadIDB(); // async recovery from IndexedDB if localStorage was cleared
  setupTouch();

  document.getElementById('playBtn').addEventListener('click', startGame);
  document.getElementById('freePlayBtn').addEventListener('click', beginFreePlay);
  document.getElementById('levelsBtn').addEventListener('click', showLevelSelect);
  document.getElementById('levelsBackBtn').addEventListener('click', showMenu);
  document.getElementById('shopBtn').addEventListener('click', showShop);
  document.getElementById('goShopBtn').addEventListener('click', showShop);
  document.getElementById('shopBackBtn').addEventListener('click', showMenu);
  document.getElementById('nextLevelBtn').addEventListener('click', () => beginLevel(Save.data.currentLevel));
  document.getElementById('lcShopBtn').addEventListener('click', showShop);
  document.getElementById('lcMenuBtn').addEventListener('click', showMenu);
  document.getElementById('tut-start-btn').addEventListener('click', closeTutorialModal);

  // Death screen buttons
  document.getElementById('revive-coin-btn').addEventListener('click', () => {
    if (document.getElementById('revive-coin-btn').disabled) return;
    doRevive(false);
  });
  document.getElementById('revive-ad-btn').addEventListener('click', () => {
    if (document.getElementById('revive-ad-btn').disabled) return;
    if (reviveTimer) { clearInterval(reviveTimer); reviveTimer = null; }
    AdManager.showRewardedAd(() => doRevive(true));
  });
  // NEW GAME buttons (in death-continue and death-ended)
  document.getElementById('retryBtn').addEventListener('click', startNewGameFromDeath);
  document.getElementById('retryBtn2').addEventListener('click', startNewGameFromDeath);
  document.getElementById('goMenuBtn').addEventListener('click', () => {
    if (reviveTimer) { clearInterval(reviveTimer); reviveTimer = null; }
    _finalizeGameOver();
    showMenu();
  });
  document.getElementById('goMenuBtn2').addEventListener('click', () => {
    _finalizeGameOver();
    showMenu();
  });
  // Legacy giveup removed — kept as no-op guard
  const giveupBtn = document.getElementById('revive-giveup-btn');
  if (giveupBtn) giveupBtn.addEventListener('click', () => {
    if (reviveTimer) { clearInterval(reviveTimer); reviveTimer = null; }
    startNewGameFromDeath();
  });

  // Ammo buy on death screen (50 coins per bullet)
  const deathBuyAmmoBtn = document.getElementById('death-buy-ammo');
  if (deathBuyAmmoBtn) deathBuyAmmoBtn.addEventListener('click', () => {
    const COST = 50, cap = maxAmmo();
    if (cap <= 0 || Save.data.coins < COST) return;
    if (ammo >= cap) { document.getElementById('death-ammo-count').textContent = 'FULL'; return; }
    Save.data.coins -= COST;
    ammo = Math.min(ammo + 1, cap);
    Save.save();
    document.getElementById('death-ammo-count').textContent = ammo;
  });

  window.addEventListener('resize', () => {
    if (gameState === 'playing' || gameState === 'landing') {
      const newW = canvas.offsetWidth  || W;
      const newH = canvas.offsetHeight || H;
      // Guard: never let canvas collapse to 0 — would crash gradient calls on iOS
      if (newW > 10 && newH > 10) {
        canvas.width = newW; canvas.height = newH;
        W = canvas.width; H = canvas.height;
      }
    }
  });

  // Save on tab close / background (pagehide is most reliable on mobile/iOS)
  window.addEventListener('beforeunload', () => Save.save());
  window.addEventListener('pagehide', () => Save.save());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') Save.save();
  });

  // Auto-save every 5 seconds + refresh spin countdown every minute
  setInterval(() => { if (Save.data) Save.save(); }, 5000);
  setInterval(() => { if (gameState === 'menu') updateSpinButton(); }, 60000);

  initLangSelector();
  applyLang();
  showMenu();
  checkDailyGift();
});
