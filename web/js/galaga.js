class GalagaGame {
  constructor(canvas, ctx, keys) {
    this.canvas=canvas; this.ctx=ctx; this.keys=keys;
    this.score=0; this.lives=3; this.wave=1;
    this.t=0; this.gameOver=false;
    this.bullets=[]; this.eBullets=[]; this.enemies=[];
    this.bCd=0; this.stars=[];
    for(let i=0;i<140;i++) this.stars.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,s:Math.random()*1.5+0.5,sp:Math.random()*30+20});
    this.ship={x:canvas.width/2,y:canvas.height-70,w:36,h:36};
    this.spawnWave();
    this.bossActive=false; this.bossHP=0;
  }

  spawnWave() {
    this.enemies=[];
    const W=this.canvas.width, rows=Math.min(3+Math.floor(this.wave/2),6), cols=Math.min(7+this.wave,14);
    const pad=(W-cols*60)/2;
    const COLORS=['#ff3030','#ff8800','#ffdc00','#00ff88','#00c8ff','#ff00ff'];
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      this.enemies.push({
        x:pad+c*60+20, y:50+r*52, bx:pad+c*60+20, by:50+r*52,
        w:28,h:24, color:COLORS[r%COLORS.length],
        pts:(rows-r)*80*(this.wave>4?2:1),
        dive:false, dvx:0, dvy:0, dAngle:0, alive:true,
        bossType: r===0&&c===Math.floor(cols/2)&&this.wave%5===0
      });
    }
  }

  update(dt) {
    if(this.gameOver) return true;
    this.t+=dt; this.bCd=Math.max(0,this.bCd-dt);
    const W=this.canvas.width, H=this.canvas.height;
    const spd=220+this.wave*10;

    // Stars scroll
    this.stars.forEach(s=>{ s.y+=s.sp*dt; if(s.y>H){s.y=0;s.x=Math.random()*W;} });

    // Move ship
    const K=this.keys;
    if((K['ArrowLeft']||K['a']) && this.ship.x>20) this.ship.x-=spd*dt;
    if((K['ArrowRight']||K['d']) && this.ship.x<W-this.ship.w-20) this.ship.x+=spd*dt;
    if((K[' ']||K['ArrowUp']) && this.bCd===0){
      this.bullets.push({x:this.ship.x+this.ship.w/2-3,y:this.ship.y,w:6,h:18});
      this.bCd=0.18;
    }

    // Move bullets
    this.bullets=this.bullets.filter(b=>{b.y-=500*dt;return b.y>-20;});
    this.eBullets=this.eBullets.filter(b=>{
      b.x+=b.vx*dt; b.y+=b.vy*dt; return b.y<H+20;
    });

    // Enemies
    const alive=this.enemies.filter(e=>e.alive);
    alive.forEach(e=>{
      if(!e.dive){
        e.x=e.bx+Math.sin(this.t*1.2+e.bx*0.02)*40;
        if(Math.random()<0.0006+this.wave*0.00008){ e.dive=true; e.dvx=(Math.random()-0.5)*180; e.dvy=120+this.wave*12; }
        if(Math.random()<0.008 && alive.length>0){
          const ang=Math.atan2(this.ship.y-e.y,this.ship.x-e.x);
          const spB=180+this.wave*15;
          this.eBullets.push({x:e.x+e.w/2,y:e.y+e.h,vx:Math.cos(ang)*spB,vy:Math.sin(ang)*spB,w:5,h:12});
        }
      } else {
        e.x+=e.dvx*dt; e.y+=e.dvy*dt;
        if(e.y>H+40){ e.x=e.bx; e.y=e.by; e.dive=false; }
      }
    });

    // Player bullets hit enemies
    this.bullets.forEach(b=>{
      this.enemies.forEach(e=>{
        if(!e.alive) return;
        if(b.x<e.x+e.w&&b.x+b.w>e.x&&b.y<e.y+e.h&&b.y+b.h>e.y){
          e.alive=false; this.score+=e.pts;
          b.y=-999; // remove
          // Explosion effect
          this.spawnExplosion(e.x+e.w/2,e.y+e.h/2,e.color);
        }
      });
    });

    // Enemy bullets hit ship
    const s=this.ship;
    this.eBullets.forEach(b=>{
      if(b.x<s.x+s.w&&b.x+b.w>s.x&&b.y<s.y+s.h&&b.y+b.h>s.y){
        b.y=9999; this.lives--; if(this.lives<=0) this.gameOver=true;
      }
    });

    // Diving enemies hit ship
    alive.forEach(e=>{
      if(e.dive&&e.x<s.x+s.w&&e.x+e.w>s.x&&e.y<s.y+s.h&&e.y+e.h>s.y){
        e.alive=false; this.lives--; if(this.lives<=0) this.gameOver=true;
      }
    });

    // Next wave
    if(!this.enemies.some(e=>e.alive)){ this.wave++; this.spawnWave(); }

    // Update explosions
    if(this.explosions) this.explosions=this.explosions.filter(p=>{ p.life-=dt*1.5; p.x+=p.vx*dt; p.y+=p.vy*dt; return p.life>0; });
    return false;
  }

  spawnExplosion(x,y,color){
    if(!this.explosions) this.explosions=[];
    for(let i=0;i<8;i++) this.explosions.push({x,y,vx:(Math.random()-0.5)*200,vy:(Math.random()-0.5)*200,life:1,color});
  }

  drawShip(x,y,w,h,col){
    const cx=x+w/2;
    this.ctx.fillStyle=col;
    this.ctx.beginPath();
    this.ctx.moveTo(cx,y); this.ctx.lineTo(x,y+h); this.ctx.lineTo(cx,y+h-10); this.ctx.lineTo(x+w,y+h);
    this.ctx.closePath(); this.ctx.fill();
    // Engine glow
    this.ctx.fillStyle='#ff8800';
    this.ctx.fillRect(cx-4,y+h-6,8,6+Math.random()*6);
  }

  draw() {
    const {ctx,canvas}=this; const W=canvas.width,H=canvas.height;
    ctx.fillStyle='#05051a'; ctx.fillRect(0,0,W,H);

    // Stars
    this.stars.forEach(s=>{
      ctx.fillStyle=`rgba(255,255,255,${0.4+s.s*0.3})`;
      ctx.fillRect(s.x,s.y,s.s,s.s*2);
    });

    // Enemies
    this.enemies.forEach(e=>{
      if(!e.alive) return;
      ctx.fillStyle=e.color;
      ctx.fillRect(e.x,e.y,e.w,e.h);
      ctx.fillStyle='rgba(255,255,255,0.6)';
      ctx.fillRect(e.x+e.w/2-4,e.y+4,8,8);
      // Wings
      ctx.fillStyle=e.color;
      ctx.fillRect(e.x-6,e.y+8,6,10); ctx.fillRect(e.x+e.w,e.y+8,6,10);
    });

    // Explosions
    if(this.explosions) this.explosions.forEach(p=>{
      ctx.fillStyle=`rgba(${p.color.slice(1).match(/../g).map(x=>parseInt(x,16)).join(',')},${p.life})`;
      ctx.fillRect(p.x-3,p.y-3,6,6);
    });

    // Bullets
    ctx.fillStyle='#00ffff';
    this.bullets.forEach(b=>{ ctx.fillRect(b.x,b.y,b.w,b.h); });
    ctx.fillStyle='#ff4444';
    this.eBullets.forEach(b=>{ ctx.fillRect(b.x,b.y,b.w,b.h); });

    // Ship
    this.drawShip(this.ship.x,this.ship.y,this.ship.w,this.ship.h,'#00ff88');

    // HUD
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,28);
    ctx.fillStyle='#fff'; ctx.font=`bold 15px Courier New`; ctx.textAlign='left';
    ctx.fillText(`${'♥ '.repeat(this.lives)} WAVE ${this.wave}`,8,20);

    if(this.gameOver){
      ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#ff4444'; ctx.font=`bold ${Math.min(48,W*0.1)}px Courier New`; ctx.textAlign='center';
      ctx.fillText('GAME OVER',W/2,H/2-20);
      ctx.fillStyle='#ffdc00'; ctx.font=`bold 26px Courier New`;
      ctx.fillText(`SCORE: ${this.score}`,W/2,H/2+20);
    }
  }
}
