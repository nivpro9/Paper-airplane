class PacManGame {
  constructor(canvas, ctx, keys) {
    this.canvas = canvas; this.ctx = ctx; this.keys = keys;
    this.score = 0; this.lives = 3; this.level = 1;
    this.gameOver = false; this.t = 0;

    // 21x21 maze: 0=wall 1=dot 2=empty 3=power 4=ghosthouse
    this.BASE = [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,3,1,1,1,1,1,1,1,0,2,0,1,1,1,1,1,1,1,3,0],
      [0,1,0,0,1,0,0,0,1,0,2,0,1,0,0,0,1,0,0,1,0],
      [0,1,0,0,1,0,0,0,1,0,2,0,1,0,0,0,1,0,0,1,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,1,0,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,0,1,0],
      [0,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0],
      [0,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,1,0,0,0,0],
      [0,0,0,0,1,0,2,2,2,2,4,2,2,2,2,0,1,0,0,0,0],
      [0,0,0,0,1,0,2,0,4,4,4,4,4,0,2,0,1,0,0,0,0],
      [2,2,2,2,1,2,2,0,4,4,4,4,4,0,2,2,1,2,2,2,2],
      [0,0,0,0,1,0,2,0,2,2,2,2,2,0,2,0,1,0,0,0,0],
      [0,0,0,0,1,0,2,2,2,2,2,2,2,2,2,0,1,0,0,0,0],
      [0,0,0,0,1,0,2,0,0,0,0,0,0,0,2,0,1,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0],
      [0,1,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1,0],
      [0,3,1,0,1,1,1,1,2,1,0,1,2,1,1,1,1,0,1,3,0],
      [0,0,1,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,1,0,0],
      [0,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0],
      [0,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,1,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ];
    this.ROWS = this.BASE.length; this.COLS = this.BASE[0].length;
    this.resetLevel();
  }

  resetLevel() {
    this.maze = this.BASE.map(r => [...r]);
    // Player starts at bottom area
    this.px = 16; this.py = 10; // row, col
    this.pdx = 0; this.pdy = 0;
    this.ndx = 0; this.ndy = 0;
    this.pAnim = 0; this.moveTimer = 0;
    this.powerTimer = 0;
    this.ghosts = [
      { r:9,c:9,  dr:0,dc:0, color:'#ff3030', scared:0 },
      { r:9,c:10, dr:0,dc:0, color:'#ffb8d8', scared:0 },
      { r:9,c:11, dr:0,dc:0, color:'#00d8d8', scared:0 },
      { r:10,c:10,dr:0,dc:0, color:'#ffa020', scared:0 },
    ];
    this.ghostTimer = 0;
    this.dotCount = this.countDots();
  }

  countDots() { return this.maze.flat().filter(c => c===1||c===3).length; }

  canMove(r,c,dr,dc) {
    const nr=r+dr, nc=c+dc;
    if(nr<0||nr>=this.ROWS||nc<0||nc>=this.COLS) return false;
    return this.maze[nr][nc] !== 0;
  }

  bfs(maze, sr, sc, er, ec) {
    const q = [[sr,sc,[]]], vis = new Set([`${sr},${sc}`]);
    while(q.length) {
      const [r,c,path] = q.shift();
      if(r===er && c===ec) return path;
      for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr=r+dr, nc=c+dc, k=`${nr},${nc}`;
        if(nr>=0&&nr<this.ROWS&&nc>=0&&nc<this.COLS&&!vis.has(k)&&maze[nr][nc]!==0){
          vis.add(k); q.push([nr,nc,[...path,[nr,nc]]]);
        }
      }
    }
    return [];
  }

  update(dt) {
    if(this.gameOver) return true;
    this.t += dt; this.pAnim += dt*4; this.moveTimer += dt; this.ghostTimer += dt;
    if(this.powerTimer>0) this.powerTimer-=dt;

    // Input
    const K = this.keys;
    if(K['ArrowLeft'])  { this.ndx=0; this.ndy=-1; }
    if(K['ArrowRight']) { this.ndx=0; this.ndy=1; }
    if(K['ArrowUp'])    { this.ndx=-1; this.ndy=0; }
    if(K['ArrowDown'])  { this.ndx=1; this.ndy=0; }

    const RATE = 0.18;
    if(this.moveTimer >= RATE) {
      this.moveTimer = 0;
      if(this.canMove(this.px,this.py,this.ndx,this.ndy)) {
        this.pdx=this.ndx; this.pdy=this.ndy;
      }
      if(this.canMove(this.px,this.py,this.pdx,this.pdy)) {
        this.px+=this.pdx; this.py+=this.pdy;
        this.py=((this.py%this.COLS)+this.COLS)%this.COLS; // tunnel
        const cell=this.maze[this.px][this.py];
        if(cell===1){ this.maze[this.px][this.py]=2; this.score+=10; }
        else if(cell===3){
          this.maze[this.px][this.py]=2; this.score+=50;
          this.powerTimer=8; this.ghosts.forEach(g=>g.scared=8);
        }
      }
    }

    // Ghosts
    const GR = 0.25 + this.level*0.02;
    if(this.ghostTimer >= GR) {
      this.ghostTimer=0;
      const dirs=[[-1,0],[1,0],[0,-1],[0,1]];
      this.ghosts.forEach((g,i) => {
        if(g.scared>0) g.scared-=GR;
        const valid=dirs.filter(([dr,dc])=>this.canMove(g.r,g.c,dr,dc));
        if(!valid.length) return;
        if(g.scared>0 || Math.random()<0.25) {
          [g.dr,g.dc]=valid[Math.floor(Math.random()*valid.length)];
        } else {
          const path=this.bfs(this.maze,g.r,g.c,this.px,this.py);
          if(path.length){ g.dr=path[0][0]-g.r; g.dc=path[0][1]-g.c; }
          else [g.dr,g.dc]=valid[Math.floor(Math.random()*valid.length)];
        }
        if(this.canMove(g.r,g.c,g.dr,g.dc)){ g.r+=g.dr; g.c+=g.dc; }
      });
    }

    // Collisions
    this.ghosts.forEach(g => {
      if(g.r===this.px && g.c===this.py) {
        if(g.scared>0){ g.scared=0; g.r=9; g.c=10; this.score+=200; }
        else{ this.lives--; if(this.lives<=0)this.gameOver=true; else this.resetPlayer(); }
      }
    });

    if(this.countDots()===0){ this.level++; this.resetLevel(); }
    return false;
  }

  resetPlayer() { this.px=16; this.py=10; this.pdx=0; this.pdy=0; }

  draw() {
    const {ctx,canvas,maze,ROWS,COLS} = this;
    const cw=canvas.width, ch=canvas.height;
    const cell=Math.min(Math.floor(cw/COLS), Math.floor(ch/ROWS));
    const ox=Math.floor((cw-COLS*cell)/2), oy=Math.floor((ch-ROWS*cell)/2);

    ctx.fillStyle='#000'; ctx.fillRect(0,0,cw,ch);

    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
      const x=ox+c*cell, y=oy+r*cell, v=maze[r][c];
      if(v===0){
        ctx.fillStyle='#1a30cc'; ctx.fillRect(x,y,cell,cell);
        ctx.strokeStyle='#3050ff'; ctx.lineWidth=1;
        ctx.strokeRect(x+1,y+1,cell-2,cell-2);
      } else if(v===1){
        ctx.fillStyle='#ffb870';
        ctx.beginPath(); ctx.arc(x+cell/2,y+cell/2,cell*0.12,0,Math.PI*2); ctx.fill();
      } else if(v===3){
        const pr=cell*0.22+Math.sin(this.t*5)*cell*0.05;
        ctx.fillStyle='#ffdc00';
        ctx.beginPath(); ctx.arc(x+cell/2,y+cell/2,pr,0,Math.PI*2); ctx.fill();
      }
    }

    // Ghosts
    this.ghosts.forEach(g => {
      const x=ox+g.c*cell, y=oy+g.r*cell;
      const cx=x+cell/2, cy=y+cell/2, r=cell*0.42;
      ctx.fillStyle=g.scared>0?'#2222cc':g.color;
      ctx.beginPath(); ctx.arc(cx,cy-r*0.1,r,Math.PI,0); ctx.lineTo(cx+r,cy+r); ctx.lineTo(cx-r,cy+r); ctx.closePath(); ctx.fill();
      if(g.scared<=0){
        ctx.fillStyle='#fff';
        ctx.beginPath(); ctx.arc(cx-r*0.3,cy-r*0.15,r*0.22,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx+r*0.3,cy-r*0.15,r*0.22,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#00a';
        ctx.beginPath(); ctx.arc(cx-r*0.22,cy-r*0.12,r*0.1,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx+r*0.38,cy-r*0.12,r*0.1,0,Math.PI*2); ctx.fill();
      }
    });

    // Pac-Man
    const px=ox+this.py*cell+cell/2, py=oy+this.px*cell+cell/2;
    const mouth=Math.abs(Math.sin(this.pAnim))*0.35;
    const angle=Math.atan2(this.pdx,this.pdy)*(180/Math.PI);
    ctx.save(); ctx.translate(px,py); ctx.rotate((angle-90)*Math.PI/180);
    ctx.fillStyle='#ffdc00';
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,cell*0.42,mouth*Math.PI,(2-mouth)*Math.PI);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // HUD
    ctx.fillStyle='#000'; ctx.fillRect(0,0,cw,28);
    ctx.fillStyle='#fff'; ctx.font=`bold ${Math.max(13,cell*0.55)}px Courier New`; ctx.textAlign='left';
    ctx.fillText(`LVL ${this.level}  ♥ ${this.lives}`,8,20);
    if(this.powerTimer>0){ ctx.fillStyle='#00d8d8'; ctx.textAlign='right'; ctx.fillText(`POWER ${this.powerTimer.toFixed(1)}`,cw-8,20); }
    if(this.gameOver){
      ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(0,0,cw,ch);
      ctx.fillStyle='#ff4444'; ctx.font=`bold ${Math.min(48,cw*0.1)}px Courier New`; ctx.textAlign='center';
      ctx.fillText('GAME OVER',cw/2,ch/2-20);
      ctx.fillStyle='#ffdc00'; ctx.font=`bold ${Math.min(28,cw*0.06)}px Courier New`;
      ctx.fillText(`SCORE: ${this.score}`,cw/2,ch/2+20);
    }
  }
}
