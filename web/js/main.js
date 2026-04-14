const App = {
  playerName: '',
  keys: {},
  gameLoop: null,
  currentGame: null,

  init() {
    // Name entry
    document.getElementById('startBtn').addEventListener('click', () => {
      const n = document.getElementById('playerName').value.trim();
      if (!n) return;
      this.playerName = n;
      document.getElementById('menu-player').textContent = `PLAYER: ${n.toUpperCase()}`;
      this.show('menu');
    });
    document.getElementById('playerName').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('startBtn').click();
    });

    // Game cards
    document.querySelectorAll('.card').forEach(c =>
      c.addEventListener('click', () => this.launch(c.dataset.game))
    );

    // Exit
    document.getElementById('exitGame').addEventListener('click', () => {
      this.stop(); this.show('menu');
    });

    // Scores
    document.getElementById('scoresBtn').addEventListener('click', () => {
      this.renderScores(); this.show('scores');
    });
    document.getElementById('backScores').addEventListener('click', () => this.show('menu'));

    // Keyboard
    document.addEventListener('keydown', e => {
      this.keys[e.key] = true;
      if (e.key === 'Escape') { this.stop(); this.show('menu'); }
    });
    document.addEventListener('keyup', e => { this.keys[e.key] = false; });

    // Mobile controls
    this.setupMobile();
    this.show('name');
  },

  show(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${name}`).classList.add('active');
  },

  setupMobile() {
    // Generic d-pad buttons
    document.querySelectorAll('.db').forEach(btn => {
      const k = btn.dataset.k;
      if (!k) return;
      const press = e => { e.preventDefault(); this.keys[k] = true; btn.classList.add('on'); };
      const rel   = e => { e.preventDefault(); this.keys[k] = false; btn.classList.remove('on'); };
      btn.addEventListener('touchstart', press, { passive: false });
      btn.addEventListener('touchend',   rel,   { passive: false });
      btn.addEventListener('touchcancel',rel,   { passive: false });
      btn.addEventListener('mousedown', press);
      btn.addEventListener('mouseup',   rel);
    });

    // SF action buttons
    document.querySelectorAll('.sf-btns .ab').forEach(btn => {
      const k = btn.dataset.k;
      if (!k) return;
      const press = e => { e.preventDefault(); this.keys[k] = true; };
      const rel   = e => { e.preventDefault(); this.keys[k] = false; };
      btn.addEventListener('touchstart', press, { passive: false });
      btn.addEventListener('touchend',   rel,   { passive: false });
      btn.addEventListener('mousedown', press);
      btn.addEventListener('mouseup',   rel);
    });

    // Galaga buttons
    const bind = (id, keyOn, keyOff) => {
      const el = document.getElementById(id); if (!el) return;
      const on  = e => { e.preventDefault(); this.keys[keyOn] = true; if (keyOff) this.keys[keyOff] = false; };
      const off = e => { e.preventDefault(); this.keys[keyOn] = false; };
      el.addEventListener('touchstart', on,  { passive: false });
      el.addEventListener('touchend',   off, { passive: false });
      el.addEventListener('mousedown', on);
      el.addEventListener('mouseup',   off);
    };
    bind('g-left',  'ArrowLeft');
    bind('g-right', 'ArrowRight');
    bind('g-fire',  ' ');

    // DK jump
    bind('dk-jump', 'ArrowUp');
  },

  launch(game) {
    this.stop();
    this.show('game');

    const canvas = document.getElementById('gameCanvas');
    const ctx    = canvas.getContext('2d');
    const hud    = document.querySelector('.game-hud');
    const ctrlH  = 130;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight - hud.offsetHeight - ctrlH;

    // Hide all controls, show correct one
    document.querySelectorAll('.ctrl').forEach(c => c.classList.add('hidden'));

    const GAMES = {
      pacman:       { ctrl: 'ctrl-pacman',  title: 'PAC-MAN',        color: '#ffdc00', Cls: PacManGame },
      galaga:       { ctrl: 'ctrl-galaga',  title: 'GALAGA',         color: '#00c8ff', Cls: GalagaGame },
      donkeykong:   { ctrl: 'ctrl-dk',      title: 'DONKEY KONG',    color: '#00c8ff', Cls: DonkeyKongGame },
      streetfighter:{ ctrl: 'ctrl-sf',      title: 'STREET FIGHTER', color: '#ff8c00', Cls: StreetFighterGame },
    };

    const cfg = GAMES[game];
    document.getElementById(cfg.ctrl).classList.remove('hidden');
    const t = document.getElementById('game-title');
    t.textContent = cfg.title; t.style.color = cfg.color;

    // Re-measure canvas height now that ctrl is visible
    canvas.height = window.innerHeight - hud.offsetHeight - document.getElementById(cfg.ctrl).offsetHeight;

    // Swipe detection for Pac-Man
    let swipeX = 0, swipeY = 0;
    if (game === 'pacman') {
      canvas.addEventListener('touchstart', e => {
        swipeX = e.touches[0].clientX; swipeY = e.touches[0].clientY;
      }, { passive: true });
      canvas.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - swipeX;
        const dy = e.changedTouches[0].clientY - swipeY;
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].forEach(k => this.keys[k] = false);
        if (Math.abs(dx) > Math.abs(dy)) this.keys[dx > 0 ? 'ArrowRight' : 'ArrowLeft'] = true;
        else                              this.keys[dy > 0 ? 'ArrowDown'  : 'ArrowUp']   = true;
        setTimeout(() => ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].forEach(k => this.keys[k] = false), 150);
      }, { passive: true });
    }

    this.currentGame = new cfg.Cls(canvas, ctx, this.keys);

    let last = 0;
    const loop = ts => {
      const dt = Math.min((ts - last) / 1000, 0.05); last = ts;
      const over = this.currentGame.update(dt);
      this.currentGame.draw();
      document.getElementById('game-score').textContent = this.currentGame.score.toLocaleString();
      if (over) { this.saveScore(game, this.playerName, this.currentGame.score); return; }
      this.gameLoop = requestAnimationFrame(loop);
    };
    this.gameLoop = requestAnimationFrame(loop);
  },

  stop() {
    if (this.gameLoop) { cancelAnimationFrame(this.gameLoop); this.gameLoop = null; }
    this.currentGame = null;
  },

  saveScore(game, name, score) {
    if (!score) return;
    const key = `arc_${game}`;
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr.push({ name: name || 'AAA', score });
    arr.sort((a, b) => b.score - a.score);
    localStorage.setItem(key, JSON.stringify(arr.slice(0, 10)));
  },

  renderScores() {
    const list = [
      { id: 'pacman',        label: 'PAC-MAN',        col: '#ffdc00' },
      { id: 'galaga',        label: 'GALAGA',          col: '#00c8ff' },
      { id: 'donkeykong',    label: 'DONKEY KONG',     col: '#00c8ff' },
      { id: 'streetfighter', label: 'STREET FIGHTER',  col: '#ff8c00' },
    ];
    document.getElementById('scores-grid').innerHTML = list.map(({ id, label, col }) => {
      const rows = JSON.parse(localStorage.getItem(`arc_${id}`) || '[]');
      return `<div class="s-col" style="color:${col};border-color:${col}">
        <div class="s-head">${label}</div>
        ${rows.length ? rows.slice(0,8).map((r,i)=>`
          <div class="s-row" style="color:${i<3?col:'#777'}">
            <span>${i+1}. ${r.name.substring(0,10)}</span>
            <span>${r.score.toLocaleString()}</span>
          </div>`).join('') : '<div style="color:#444;font-size:13px">No scores yet</div>'}
      </div>`;
    }).join('');
  }
};

window.addEventListener('load', () => App.init());
