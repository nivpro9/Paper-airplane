class StreetFighterGame {
  constructor(canvas, ctx, keys) {
    this.canvas=canvas; this.ctx=ctx; this.keys=keys;
    this.score=0; this.t=0; this.gameOver=false;
    this.winsP1=0; this.winsCPU=0; this.round=1;
    this.roundMsg='ROUND 1'; this.roundTimer=2;
    this.ko=false; this.koTimer=0;
    this.effects=[];
    this.initRound();
  }

  get W(){ return this.canvas.width; }
  get H(){ return this.canvas.height; }

  get FLOOR(){ return this.H*0.82; }

  initRound(){
    const W=this.W, FL=this.FLOOR;
    this.p1={
      x:W*0.15, y:FL-70, w:44, h:70,
      vx:0, vy:0, onGround:true, facing:1,
      hp:200, maxHP:200, state:'idle', stateT:0,
      anim:0, block:false, hitbox:null, isCPU:false,
      cpuCd:0, color:'#2244ff', name:'YOU', combo:0
    };
    this.p2={
      x:W*0.75, y:FL-70, w:44, h:70,
      vx:0, vy:0, onGround:true, facing:-1,
      hp:200, maxHP:200, state:'idle', stateT:0,
      anim:0, block:false, hitbox:null, isCPU:true,
      cpuCd:0, color:'#cc2222', name:'CPU', combo:0
    };
    this.ko=false;
    this.roundMsg=`ROUND ${this.round}`;
    this.roundTimer=2;
  }

  doAction(f, act, enemy){
    if(['punch','kick','hurt'].includes(f.state)) return false;
    f.state=act; f.stateT=act==='punch'?0.25:0.32;
    const reach=act==='kick'?70:60;
    const hx=f.facing>0? f.x+f.w : f.x-reach;
    const hy=act==='kick'? f.y+f.h*0.55 : f.y+f.h*0.15;
    f.hitbox={x:hx,y:hy,w:reach,h:act==='kick'?30:26};
    // Check hit immediately
    if(this.hitTest(f.hitbox,enemy)){
      const dmg=act==='punch'? 10+Math.random()*6 : 16+Math.random()*8;
      this.takeHit(enemy, dmg, f.color);
      this.score+=Math.floor(dmg)*5;
    }
    return true;
  }

  hitTest(box, target){
    return box && box.x<target.x+target.w && box.x+box.w>target.x &&
           box.y<target.y+target.h && box.y+box.h>target.y;
  }

  takeHit(f, dmg, col){
    if(f.block) dmg=Math.floor(dmg*0.15);
    f.hp=Math.max(0,f.hp-dmg);
    f.state='hurt'; f.stateT=0.16; f.hitbox=null;
    this.effects.push({x:f.x+f.w/2,y:f.y+20,text:`-${Math.floor(dmg)}`,life:1,color:col,vy:-60});
  }

  cpuAI(cpu, player, dt){
    cpu.cpuCd=Math.max(0,cpu.cpuCd-dt);
    if(cpu.cpuCd>0||['punch','kick','hurt'].includes(cpu.state)) return;
    const dx=player.x-cpu.x, dist=Math.abs(dx);
    cpu.facing=dx<0?-1:1;
    cpu.vx=0;
    const diff=0.3+this.round*0.05; // harder each round
    if(dist>120){ cpu.vx=dx>0?150:-150; }
    else if(dist<50){ cpu.vx=dx>0?-80:80; }
    else {
      const r=Math.random();
      if(r<0.35+diff) this.doAction(cpu,'punch',player);
      else if(r<0.6+diff) this.doAction(cpu,'kick',player);
      else if(r<0.75) { cpu.vy=-380; cpu.onGround=false; }
      cpu.block = r>0.85;
    }
    cpu.cpuCd=0.08+Math.random()*0.18;
  }

  updateFighter(f, enemy, dt){
    const W=this.W, FL=this.FLOOR;
    f.anim+=dt; f.stateT=Math.max(0,f.stateT-dt);
    if(f.stateT===0 && ['punch','kick','hurt'].includes(f.state)){ f.state='idle'; f.hitbox=null; }

    if(!f.isCPU && !this.ko && this.roundTimer<=0){
      const K=this.keys;
      f.vx=0;
      if(K['a']&&f.x>20){ f.vx=-170; f.facing=-1; if(f.state==='idle')f.state='walk'; }
      else if(K['d']&&f.x<W-f.w-20){ f.vx=170; f.facing=1; if(f.state==='idle')f.state='walk'; }
      else if(f.state==='walk') f.state='idle';
      if((K['w']||K['ArrowUp'])&&f.onGround){ f.vy=-420; f.onGround=false; }
      if(K['j']) this.doAction(f,'punch',enemy);
      if(K['k']) this.doAction(f,'kick',enemy);
      f.block=!!K['l'];
    }

    // Physics
    if(!f.onGround) f.vy+=800*dt;
    f.x+=f.vx*dt; f.y+=f.vy*dt;
    if(f.y>=FL-f.h){ f.y=FL-f.h; f.vy=0; f.onGround=true; }
    f.x=Math.max(10,Math.min(f.x,W-f.w-10));

    // Face enemy
    if(f.state!=='walk'){ f.facing=enemy.x>f.x?1:-1; }
  }

  update(dt){
    if(this.gameOver) return true;
    this.t+=dt;

    // Effects
    this.effects=this.effects.filter(e=>{ e.life-=dt*1.2; e.y+=e.vy*dt; return e.life>0; });

    if(this.roundTimer>0){ this.roundTimer-=dt; return false; }
    if(this.ko){ this.koTimer-=dt; if(this.koTimer<=0){ this.nextRound(); } return false; }

    this.updateFighter(this.p1,this.p2,dt);
    if(this.p2.isCPU) this.cpuAI(this.p2,this.p1,dt);
    this.updateFighter(this.p2,this.p1,dt);

    if(!this.ko&&(this.p1.hp===0||this.p2.hp===0)){
      this.ko=true; this.koTimer=2.5;
      if(this.p2.hp===0){ this.winsP1++; this.score+=1000*this.round; }
      else this.winsCPU++;
    }
    return false;
  }

  nextRound(){
    if(this.winsP1>=2||this.winsCPU>=2){ this.gameOver=true; return; }
    this.round++; this.initRound();
  }

  drawFighter(f, enemy){
    const ctx=this.ctx; const cx=f.x+f.w/2;
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cx,this.FLOOR-2,f.w*0.55,6,0,0,Math.PI*2); ctx.fill();
    // Legs
    const lg=f.state==='walk'?Math.sin(f.anim*10)*6:0;
    ctx.fillStyle=f.color;
    ctx.fillRect(cx-f.w/2+4,f.y+f.h*0.6,f.w/2-4,f.h*0.4+lg);
    ctx.fillRect(cx,f.y+f.h*0.6,f.w/2-4,f.h*0.4-lg);
    // Body
    const bc=f.state==='hurt'?'#fff':f.block?'rgba(100,200,255,0.8)':f.color;
    ctx.fillStyle=bc; ctx.fillRect(f.x+4,f.y+f.h*0.32,f.w-8,f.h*0.32);
    // Arms
    const ar=f.state==='punch'?-16:f.state==='kick'?8:0;
    ctx.fillRect(f.x-2,f.y+f.h*0.34+ar,8,f.h*0.22);
    ctx.fillRect(f.x+f.w-6,f.y+f.h*0.34-ar,8,f.h*0.22);
    // Head
    ctx.fillStyle='#ffb090';
    ctx.beginPath(); ctx.arc(cx,f.y+f.h*0.18,f.w*0.28,0,Math.PI*2); ctx.fill();
    // Hair / hat
    ctx.fillStyle=f.color;
    ctx.fillRect(f.x+6,f.y,f.w-12,f.h*0.14);
    // Eyes
    const ex=f.facing>0?4:-4;
    ctx.fillStyle='#333';
    ctx.beginPath(); ctx.arc(cx+ex-5,f.y+f.h*0.17,3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+ex+5,f.y+f.h*0.17,3,0,Math.PI*2); ctx.fill();
    // Punch fist / kick foot
    if(f.state==='punch'){
      const fx=f.facing>0?f.x+f.w:f.x-18;
      ctx.fillStyle='#ffb090'; ctx.fillRect(fx,f.y+f.h*0.28,18,16);
    }
    if(f.state==='kick'){
      const kx=f.facing>0?f.x+f.w:f.x-22;
      ctx.fillStyle=f.color; ctx.fillRect(kx,f.y+f.h*0.62,22,14);
    }
  }

  drawHPBar(f, x, y, w){
    const ctx=this.ctx; const pct=f.hp/f.maxHP;
    ctx.fillStyle='#333'; ctx.fillRect(x,y,w,18);
    ctx.fillStyle=pct>0.5?'#22cc44':pct>0.25?'#ffcc00':'#ff3333';
    ctx.fillRect(x,y,w*pct,18);
    ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,18);
    ctx.fillStyle='#fff'; ctx.font='bold 11px Courier New'; ctx.textAlign='left';
    ctx.fillText(f.name,x,y-4);
  }

  draw(){
    const {ctx,canvas}=this; const W=canvas.width,H=canvas.height;
    // Background
    for(let i=0;i<H;i++){
      const t=i/H; const r=Math.floor(20+30*t),g=Math.floor(5+10*t),b=Math.floor(40+20*t);
      ctx.fillStyle=`rgb(${r},${g},${b})`; ctx.fillRect(0,i,W,1);
    }
    // Crowd silhouettes
    for(let i=0;i<24;i++){
      const cx=20+i*W/24, cy=H*0.6+Math.sin(this.t*1.5+i)*4;
      ctx.fillStyle='rgba(40,15,60,0.9)';
      ctx.beginPath(); ctx.ellipse(cx,cy-20,12,18,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx,cy-42,10,0,Math.PI*2); ctx.fill();
    }
    // Floor
    ctx.fillStyle='#4a3018'; ctx.fillRect(0,this.FLOOR,W,H-this.FLOOR);
    ctx.fillStyle='#6a4828'; ctx.fillRect(0,this.FLOOR,W,6);

    this.drawFighter(this.p1,this.p2);
    this.drawFighter(this.p2,this.p1);

    // HP bars
    const bw=Math.min(W*0.38,280);
    this.drawHPBar(this.p1,20,10,bw);
    this.drawHPBar(this.p2,W-20-bw,10,bw);

    // Win dots
    for(let i=0;i<this.winsP1;i++) { ctx.fillStyle='#ffdc00'; ctx.beginPath(); ctx.arc(30+i*20,38,7,0,Math.PI*2); ctx.fill(); }
    for(let i=0;i<this.winsCPU;i++) { ctx.fillStyle='#ff4444'; ctx.beginPath(); ctx.arc(W-30-i*20,38,7,0,Math.PI*2); ctx.fill(); }

    // Effects (damage numbers)
    this.effects.forEach(e=>{
      ctx.fillStyle=`rgba(255,255,255,${e.life})`;
      ctx.font=`bold 18px Courier New`; ctx.textAlign='center';
      ctx.fillText(e.text,e.x,e.y);
    });

    // Round message
    if(this.roundTimer>0){
      ctx.fillStyle=`rgba(255,220,0,${Math.min(1,this.roundTimer)})`;
      ctx.font=`bold ${Math.min(54,W*0.1)}px Courier New`; ctx.textAlign='center';
      ctx.fillText(this.roundMsg,W/2,H/2);
    }
    if(this.ko){
      ctx.fillStyle='#ffdc00'; ctx.font=`bold ${Math.min(60,W*0.1)}px Courier New`; ctx.textAlign='center';
      ctx.fillText('K.O.!',W/2,H/2-20);
      ctx.fillStyle='#fff'; ctx.font='bold 22px Courier New';
      ctx.fillText(this.p2.hp===0?'YOU WIN!':'CPU WINS',W/2,H/2+28);
    }
    if(this.gameOver){
      ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(0,0,W,H);
      const won=this.winsP1>=2;
      ctx.fillStyle=won?'#ffdc00':'#ff4444'; ctx.font=`bold ${Math.min(52,W*0.1)}px Courier New`; ctx.textAlign='center';
      ctx.fillText(won?'YOU WIN!':'YOU LOSE!',W/2,H/2-30);
      ctx.fillStyle='#fff'; ctx.font='bold 24px Courier New';
      ctx.fillText(`SCORE: ${this.score}`,W/2,H/2+20);
    }
  }
}
