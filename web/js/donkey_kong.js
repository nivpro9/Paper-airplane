class DonkeyKongGame {
  constructor(canvas, ctx, keys) {
    this.canvas=canvas; this.ctx=ctx; this.keys=keys;
    this.score=0; this.lives=3; this.level=1;
    this.gameOver=false; this.t=0;
    this.barrels=[]; this.bCd=2.5;
    this.hammers=[]; this.hammerTimer=0;
    this.particles=[];
    this.init();
  }

  get W(){ return this.canvas.width; }
  get H(){ return this.canvas.height; }

  init() {
    const W=this.W, H=this.H;
    // Platforms scale to canvas
    this.platforms=[
      {x:W*0.04, y:H*0.9,  w:W*0.92, h:12, slope:0},
      {x:W*0.04, y:H*0.73, w:W*0.6,  h:12, slope:0},
      {x:W*0.36, y:H*0.73, w:W*0.6,  h:12, slope:0},
      {x:W*0.04, y:H*0.56, w:W*0.6,  h:12, slope:0},
      {x:W*0.36, y:H*0.56, w:W*0.6,  h:12, slope:0},
      {x:W*0.04, y:H*0.39, w:W*0.6,  h:12, slope:0},
      {x:W*0.36, y:H*0.39, w:W*0.6,  h:12, slope:0},
      {x:W*0.2,  y:H*0.22, w:W*0.6,  h:12, slope:0},
      {x:W*0.3,  y:H*0.08, w:W*0.4,  h:12, slope:0},
    ];
    this.ladders=[
      {x:W*0.15, y1:H*0.73, y2:H*0.9,  w:20},
      {x:W*0.72, y1:H*0.73, y2:H*0.9,  w:20},
      {x:W*0.28, y1:H*0.56, y2:H*0.73, w:20},
      {x:W*0.68, y1:H*0.56, y2:H*0.73, w:20},
      {x:W*0.15, y1:H*0.39, y2:H*0.56, w:20},
      {x:W*0.78, y1:H*0.39, y2:H*0.56, w:20},
      {x:W*0.38, y1:H*0.22, y2:H*0.39, w:20},
      {x:W*0.65, y1:H*0.22, y2:H*0.39, w:20},
      {x:W*0.44, y1:H*0.08, y2:H*0.22, w:20},
      {x:W*0.58, y1:H*0.08, y2:H*0.22, w:20},
    ];
    this.mario={
      x:W*0.06, y:H*0.82, w:22, h:30,
      vx:0, vy:0, onGround:false, onLadder:false,
      anim:0, facing:1, hammer:0
    };
    this.hammers=[{x:W*0.84, y:H*0.84, alive:true}];
    this.dk={x:W*0.36, y:H*0.01, anim:0};
    this.barrels=[]; this.bCd=2.5;
    this.princess={x:W*0.52, y:H*0.01};
  }

  onPlatform(r, plat) {
    return r.x<plat.x+plat.w && r.x+r.w>plat.x &&
           r.y+r.h>=plat.y && r.y+r.h<=plat.y+plat.h+8 &&
           r.vy>=0;
  }

  onLadder(r) {
    for(const l of this.ladders){
      const lx=l.x, cx=r.x+r.w/2;
      if(cx>=lx && cx<=lx+l.w && r.y+r.h>l.y1 && r.y<l.y2) return l;
    }
    return null;
  }

  update(dt) {
    if(this.gameOver) return true;
    this.t+=dt; this.bCd-=dt;
    const W=this.W, H=this.H;
    const K=this.keys;
    const m=this.mario;
    m.anim+=dt;

    // Ladder check
    const lad=this.onLadder({x:m.x,y:m.y,w:m.w,h:m.h,vy:m.vy});
    m.onLadder=!!lad;

    // Input
    m.vx=0;
    if(K['ArrowLeft']||K['a']){ m.vx=-160; m.facing=-1; }
    if(K['ArrowRight']||K['d']){ m.vx=160; m.facing=1; }
    if(lad){
      if(K['ArrowUp']||K['w']) m.vy=-120;
      else if(K['ArrowDown']||K['s']) m.vy=120;
      else m.vy=0;
    }
    if((K['ArrowUp']||K['w']||K[' ']) && m.onGround && !lad) m.vy=-420;

    // Gravity
    if(!m.onLadder) m.vy+=700*dt;
    m.vy=Math.max(-500,Math.min(m.vy,700));

    m.x+=m.vx*dt; m.y+=m.vy*dt;
    m.x=Math.max(0,Math.min(m.x,W-m.w));

    // Platform collision
    m.onGround=false;
    for(const p of this.platforms){
      const mr={x:m.x,y:m.y,w:m.w,h:m.h,vy:m.vy};
      if(this.onPlatform(mr,p)){ m.y=p.y-m.h; m.vy=0; m.onGround=true; break; }
    }
    if(m.y>H){ this.lives--; if(this.lives<=0)this.gameOver=true; else this.init(); return false; }

    // Hammer pickup
    if(m.hammer>0) m.hammer-=dt;
    this.hammers.forEach(h=>{
      if(h.alive && m.x<h.x+16&&m.x+m.w>h.x&&m.y<h.y+16&&m.y+m.h>h.y){
        h.alive=false; m.hammer=5; this.score+=300;
      }
    });

    // Spawn barrels
    if(this.bCd<=0){
      const spd=(120+this.level*20)*( Math.random()<0.5?1:-1);
      this.barrels.push({x:W*0.42,y:H*0.11,vx:spd,vy:0,w:18,h:16,onGround:false,anim:0});
      this.bCd=Math.max(0.9,2.5-this.level*0.15);
    }

    // Update barrels
    this.barrels=this.barrels.filter(b=>{
      b.anim+=dt; b.vy+=700*dt; b.vy=Math.min(b.vy,700);
      b.x+=b.vx*dt; b.y+=b.vy*dt;
      b.onGround=false;
      for(const p of this.platforms){
        const br={x:b.x,y:b.y,w:b.w,h:b.h,vy:b.vy};
        if(this.onPlatform(br,p)){
          b.y=p.y-b.h; b.vy=0; b.onGround=true;
          if(b.x<p.x+4) b.vx=Math.abs(b.vx);
          if(b.x+b.w>p.x+p.w-4) b.vx=-Math.abs(b.vx);
        }
      }
      if(b.y>H) return false;
      // Barrel vs mario
      if(b.x<m.x+m.w&&b.x+b.w>m.x&&b.y<m.y+m.h&&b.y+b.h>m.y){
        if(m.hammer>0){ this.score+=500; return false; }
        this.lives--; if(this.lives<=0)this.gameOver=true; else this.init();
        return false;
      }
      return true;
    });

    // Win: reach princess
    if(m.y<H*0.12){ this.score+=this.level*2000; this.level++; this.init(); }

    // Particles update
    this.particles=this.particles.filter(p=>{ p.life-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=400*dt; return p.life>0; });
    return false;
  }

  draw() {
    const {ctx,canvas}=this; const W=canvas.width,H=canvas.height;
    ctx.fillStyle='#05051a'; ctx.fillRect(0,0,W,H);

    // Platforms
    this.platforms.forEach(p=>{
      ctx.fillStyle='#708090';
      ctx.fillRect(p.x,p.y,p.w,p.h);
      ctx.fillStyle='rgba(255,255,255,0.2)';
      ctx.fillRect(p.x,p.y,p.w,3);
    });

    // Ladders
    this.ladders.forEach(l=>{
      ctx.fillStyle='#8B4513';
      ctx.fillRect(l.x,l.y1,l.w,l.y2-l.y1);
      ctx.fillStyle='#ffcc44';
      for(let y=l.y1;y<l.y2;y+=18) ctx.fillRect(l.x,y,l.w,4);
    });

    // Hammers
    this.hammers.forEach(h=>{
      if(!h.alive) return;
      ctx.fillStyle='#aaa'; ctx.fillRect(h.x,h.y,16,6);
      ctx.fillStyle='#888'; ctx.fillRect(h.x+6,h.y+6,4,12);
    });

    // Donkey Kong
    const dk=this.dk; dk.anim+=0.02;
    const dkW=Math.min(W*0.12,80), dkH=Math.min(H*0.14,80);
    ctx.fillStyle='#6B3A2A';
    ctx.beginPath(); ctx.ellipse(dk.x+dkW/2,dk.y+dkH*0.7,dkW/2,dkH*0.55,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(dk.x+dkW/2,dk.y+dkH*0.28,dkW*0.38,dkH*0.3,0,0,Math.PI*2); ctx.fill();
    // Arms swing
    const sw=Math.sin(dk.anim)*8;
    ctx.fillRect(dk.x-10,dk.y+dkH*0.5+sw,16,8);
    ctx.fillRect(dk.x+dkW-6,dk.y+dkH*0.5-sw,16,8);
    // Eyes
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(dk.x+dkW*0.38,dk.y+dkH*0.22,4,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(dk.x+dkW*0.62,dk.y+dkH*0.22,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#333'; ctx.beginPath(); ctx.arc(dk.x+dkW*0.4,dk.y+dkH*0.23,2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(dk.x+dkW*0.64,dk.y+dkH*0.23,2,0,Math.PI*2); ctx.fill();

    // Princess
    const pr=this.princess;
    ctx.fillStyle='#ffb8c0'; ctx.beginPath(); ctx.arc(pr.x+12,pr.y+10,10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff69b4'; ctx.fillRect(pr.x+4,pr.y+18,16,22);
    ctx.fillStyle='#ffd700'; ctx.fillRect(pr.x+6,pr.y,12,8);

    // Barrels
    this.barrels.forEach(b=>{
      ctx.save(); ctx.translate(b.x+b.w/2,b.y+b.h/2);
      ctx.rotate(b.anim*4*(b.vx>0?1:-1));
      ctx.fillStyle='#8B4513'; ctx.fillRect(-b.w/2,-b.h/2,b.w,b.h);
      ctx.strokeStyle='#5C2D0A'; ctx.lineWidth=2;
      for(let i=-1;i<=1;i++) { ctx.beginPath(); ctx.moveTo(-b.w/2,i*4); ctx.lineTo(b.w/2,i*4); ctx.stroke(); }
      ctx.restore();
    });

    // Mario
    const m=this.mario;
    ctx.save(); ctx.translate(m.x+m.w/2, m.y);
    if(m.facing<0) ctx.scale(-1,1);
    // Body
    ctx.fillStyle='#3355ff'; ctx.fillRect(-m.w/2+2,12,m.w-4,14);
    // Head
    ctx.fillStyle='#ffb8a0'; ctx.fillRect(-m.w/2+4,3,m.w-8,12);
    ctx.fillStyle='#cc2222'; ctx.fillRect(-m.w/2+2,0,m.w-4,8); // hat
    // Legs
    const lg=Math.sin(m.anim*8)*4;
    ctx.fillStyle='#8B4513'; ctx.fillRect(-m.w/2+2,26,8,m.h-26+lg);
    ctx.fillRect(m.w/2-10,26,8,m.h-26-lg);
    // Hammer
    if(m.hammer>0){
      ctx.fillStyle='#aaa'; ctx.fillRect(m.w/2,2,16,8);
      ctx.fillStyle='#888'; ctx.fillRect(m.w/2+4,8,4,10);
    }
    ctx.restore();

    // HUD
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,28);
    ctx.fillStyle='#fff'; ctx.font='bold 14px Courier New'; ctx.textAlign='left';
    ctx.fillText(`${'♥ '.repeat(this.lives)} LVL ${this.level}`,8,20);

    if(this.gameOver){
      ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#ff4444'; ctx.font=`bold ${Math.min(48,W*0.1)}px Courier New`; ctx.textAlign='center';
      ctx.fillText('GAME OVER',W/2,H/2-20);
      ctx.fillStyle='#ffdc00'; ctx.font='bold 26px Courier New';
      ctx.fillText(`SCORE: ${this.score}`,W/2,H/2+20);
    }
  }
}
