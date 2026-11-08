import { UNITS, ENEMIES, SPAWNS, ROUTES, terrain, rangeContains, type UnitKind, type EnemyKind, type Cell, type Direction } from './config';
export interface Operator extends Cell {
  id:number; kind:UnitKind; direction:Direction; hp:number; attackTimer:number; skillCharge:number;
  active:number; charge:number; burstCharge:number; empowered:boolean; hit:number;
}
export interface Enemy extends Cell {
  id:number; kind:EnemyKind; route:number; progress:number; hp:number; attackTimer:number; blockedBy:number|null; hit:number;
}
export type GameEvent = {type:'deploy'|'attack'|'heal'|'hit'|'death'|'down'|'leak'|'skill'|'dp'|'wave'|'victory'|'defeat';x:number;y:number;targetX?:number;targetY?:number;kind?:UnitKind|EnemyKind;amount?:number;value?:number};
export function damage(atk:number,def:number,res:number,magic=false) { return Math.max(1, magic?atk*(1-Math.min(95,res)/100):Math.max(atk*0.05,atk-def)); }
export class Battle {
  dp=10; lives=3; elapsed=0; killed=0; leaked=0; wave=1; spawned=0;
  paused=false; speed=1; status:'playing'|'victory'|'defeat'='playing';
  units:Operator[]=[]; enemies:Enemy[]=[]; events:GameEvent[]=[];
  cooldowns: Record<UnitKind,number> = {vanguard:0,defender:0,lord:0,liberator:0,reaper:0,sniper:0,caster:0,medic:0};
  private nextId=1; private dpFraction=0;
  private emit(event:GameEvent) { this.events.push(event); }
  drainEvents() { return this.events.splice(0); }
  availability(kind:UnitKind):string|null {
    if(this.status!=='playing') return '作战已结束';
    if(this.units.length>=8) return '已达到 8 名部署上限';
    if(this.units.filter(u=>u.kind===kind).length>=2) return '同类最多同时部署 2 名';
    if(this.cooldowns[kind]>0) return `再部署冷却 ${Math.ceil(this.cooldowns[kind])} 秒`;
    if(this.dp<UNITS[kind].cost) return `部署费用不足 · 需要 ${UNITS[kind].cost} DP`;
    return null;
  }
  canPlace(kind:UnitKind,cell:Cell) { return terrain(cell.x,cell.y)===UNITS[kind].terrain&&!this.units.some(u=>u.x===cell.x&&u.y===cell.y); }
  deploy(kind:UnitKind,cell:Cell,direction:Direction):Operator|null {
    if(this.availability(kind)||!this.canPlace(kind,cell)) return null;
    const c=UNITS[kind]; this.dp-=c.cost;
    const u:Operator={...cell,id:this.nextId++,kind,direction,hp:c.hp,attackTimer:0.25,skillCharge:0,active:0,charge:0,burstCharge:0,empowered:false,hit:0};
    this.units.push(u); this.emit({type:'deploy',...cell,kind}); return u;
  }
  retreat(id:number) { const u=this.units.find(u=>u.id===id); if(!u||this.status!=='playing') return false; this.dp=Math.min(99,this.dp+Math.floor(UNITS[u.kind].cost/2));this.removeUnit(u,false);return true; }
  private removeUnit(u:Operator,dead:boolean) {
    this.units=this.units.filter(v=>v.id!==u.id);this.cooldowns[u.kind]=UNITS[u.kind].redeploy;
    this.enemies.forEach(e=>{if(e.blockedBy===u.id)e.blockedBy=null;});
    this.emit({type:dead?'down':'death',x:u.x,y:u.y,kind:u.kind});
  }
  skill(id:number) {
    const u=this.units.find(u=>u.id===id);if(!u||this.status!=='playing'||u.kind==='vanguard')return false;
    const c=UNITS[u.kind];if(u.skillCharge<c.cooldown||u.active>0||u.empowered)return false;
    u.skillCharge=0;u.active=c.duration;u.attackTimer=0;
    if(u.kind==='caster')u.empowered=true;
    if(u.kind==='liberator'){u.burstCharge=u.charge;u.charge=0;}
    this.emit({type:'skill',x:u.x,y:u.y,kind:u.kind});return true;
  }
  inRange(u:Operator,target:Cell) { const c=UNITS[u.kind]; return rangeContains(u,target,u.direction,c.range,c.width); }
  private blockCount(u:Operator) { return u.kind==='liberator'&&u.active<=0?0:UNITS[u.kind].block; }
  private hurt(e:Enemy,atk:number,magic:boolean,u:Operator) {
    if(e.hp<=0)return;
    const c=ENEMIES[e.kind],amount=damage(atk,c.def,c.res,magic);e.hp-=amount;e.hit=.12;
    this.emit({type:'hit',x:e.x,y:e.y,kind:u.kind,amount:Math.round(amount)});
    if(e.hp<=0){this.killed++;this.emit({type:'death',x:e.x,y:e.y,kind:e.kind});}
  }
  tick(realDt:number) {
    if(this.paused||this.status!=='playing')return;
    // Fixed substeps preserve block and hit detection even at 2× or during slow frames.
    let remaining=Math.min(0.25,realDt)*this.speed;
    while(remaining>0&&this.status==='playing'){const dt=Math.min(remaining,1/30);this.step(dt);remaining-=dt;}
  }
  private step(dt:number) {
    this.elapsed+=dt;this.dpFraction+=dt;
    while(this.dpFraction>=1){this.dp=Math.min(99,this.dp+1);this.dpFraction--;}
    for(const k of Object.keys(this.cooldowns) as UnitKind[])this.cooldowns[k]=Math.max(0,this.cooldowns[k]-dt);
    while(this.spawned<SPAWNS.length&&SPAWNS[this.spawned].at<=this.elapsed){
      const s=SPAWNS[this.spawned++],p=ROUTES[s.route][0];
      this.enemies.push({...p,id:this.nextId++,kind:s.kind,route:s.route,progress:0,hp:ENEMIES[s.kind].hp,attackTimer:0.5,blockedBy:null,hit:0});
    }
    const wave=this.elapsed>=104?3:this.elapsed>=52?2:1;
    if(wave!==this.wave){this.wave=wave;this.emit({type:'wave',x:0,y:0,value:wave});}
    for(const u of this.units){
      const c=UNITS[u.kind];u.hit=Math.max(0,u.hit-dt);u.attackTimer-=dt;
      const wasActive=u.active>0;u.active=Math.max(0,u.active-dt);
      if(wasActive&&u.active===0&&u.kind==='liberator')u.burstCharge=0;
      if(u.active===0&&!u.empowered)u.skillCharge=Math.min(c.cooldown,u.skillCharge+dt);
      if(u.kind==='vanguard'&&u.skillCharge>=c.cooldown){u.skillCharge=0;this.dp=Math.min(99,this.dp+8);this.emit({type:'dp',x:u.x,y:u.y,amount:8});}
      if(u.kind==='liberator'&&!u.active){u.charge=Math.min(1,u.charge+dt/20);continue;}
      if(u.attackTimer>0)continue;
      if(u.kind==='medic'){
        const targets=this.units.filter(t=>t.kind!=='reaper'&&t.hp<UNITS[t.kind].hp&&this.inRange(u,t)).sort((a,b)=>a.hp/UNITS[a.kind].hp-b.hp/UNITS[b.kind].hp);
        if(targets.length){const t=targets[0],amount=Math.min(UNITS[t.kind].hp-t.hp,c.atk*(u.active?1.6:1));t.hp+=amount;u.attackTimer=c.interval*(u.active?.6:1);this.emit({type:'heal',x:u.x,y:u.y,targetX:t.x,targetY:t.y,amount:Math.round(amount),kind:u.kind});}
        continue;
      }
      let targets=this.enemies.filter(e=>e.hp>0&&(e.blockedBy===u.id||this.inRange(u,e)));
      targets.sort((a,b)=>Number(b.blockedBy===u.id)-Number(a.blockedBy===u.id)||b.progress-a.progress);
      if(!targets.length)continue;
      if(u.kind!=='reaper'&&u.kind!=='liberator')targets=targets.slice(0,1);
      let atk=c.atk;
      if(u.kind==='lord'){if(u.active)atk*=1.7;if(Math.hypot(targets[0].x-u.x,targets[0].y-u.y)>1.15)atk*=.8;}
      if(u.kind==='liberator')atk*=1+u.burstCharge*1.5;
      const explosion=u.kind==='caster'&&u.empowered;
      if(explosion){const t=targets[0];atk*=2.2;targets=this.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-t.x,e.y-t.y)<=1.35);u.empowered=false;}
      for(const e of targets){this.emit({type:'attack',x:u.x,y:u.y,targetX:e.x,targetY:e.y,kind:u.kind,value:explosion?1:0});this.hurt(e,atk,u.kind==='caster',u);}
      if(u.kind==='reaper'){const amount=Math.min(c.hp-u.hp,80*targets.length);u.hp+=amount;if(amount)this.emit({type:'heal',x:u.x,y:u.y,targetX:u.x,targetY:u.y,amount,kind:u.kind});}
      u.attackTimer=c.interval*(u.active?(u.kind==='sniper'?.35:u.kind==='reaper'?.45:1):1);
    }
    this.enemies=this.enemies.filter(e=>e.hp>0);
    // Keep valid reservations; fill each operator's finite blocking capacity by route progress.
    const occupied=new Map<number,number>();
    for(const e of this.enemies){const u=this.units.find(u=>u.id===e.blockedBy);if(!u||!this.blockCount(u)){e.blockedBy=null;continue;}occupied.set(u.id,(occupied.get(u.id)||0)+1);}
    for(const e of [...this.enemies].sort((a,b)=>b.progress-a.progress)){
      e.hit=Math.max(0,e.hit-dt);
      if(e.blockedBy===null){
        const blocker=this.units.find(u=>this.blockCount(u)>(occupied.get(u.id)||0)&&Math.hypot(e.x-u.x,e.y-u.y)<.62);
        if(blocker){e.blockedBy=blocker.id;occupied.set(blocker.id,(occupied.get(blocker.id)||0)+1);}
      }
      if(e.blockedBy!==null){
        const u=this.units.find(u=>u.id===e.blockedBy);if(!u){e.blockedBy=null;continue;}
        e.attackTimer-=dt;
        if(e.attackTimer<=0){const c=UNITS[u.kind],def=c.def*(u.kind==='defender'&&u.active?2.5:1),amount=damage(ENEMIES[e.kind].atk,def,c.res);u.hp-=amount;u.hit=.16;e.attackTimer=ENEMIES[e.kind].interval;this.emit({type:'attack',x:e.x,y:e.y,targetX:u.x,targetY:u.y,kind:e.kind});if(u.hp<=0)this.removeUnit(u,true);}
      }else{
        e.progress+=ENEMIES[e.kind].speed*dt;
        const route=ROUTES[e.route],i=Math.floor(e.progress),f=e.progress-i;
        if(i>=route.length-1){e.hp=0;this.leaked++;this.lives=Math.max(0,this.lives-ENEMIES[e.kind].damage);this.emit({type:'leak',x:11,y:route[route.length-1].y,kind:e.kind});if(this.lives===0){this.status='defeat';this.emit({type:'defeat',x:0,y:0});return;}}
        else{e.x=route[i].x+(route[i+1].x-route[i].x)*f;e.y=route[i].y+(route[i+1].y-route[i].y)*f;}
      }
    }
    this.enemies=this.enemies.filter(e=>e.hp>0);
    if(this.spawned===SPAWNS.length&&!this.enemies.length&&this.lives>0){this.status='victory';this.emit({type:'victory',x:0,y:0});}
  }
}
