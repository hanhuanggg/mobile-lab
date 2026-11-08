import Phaser from 'phaser';
import { Battle, type GameEvent, type Operator } from './model';
import { UNITS, UNIT_ORDER, ENEMIES, COLS, ROWS, ROUTES, terrain, isRoute, type Cell, type Direction, type UnitKind, type EnemyKind } from './config';
import { operatorSVG, enemySVG, dataSVG } from './art';
export const VIEW_W=1280, VIEW_H=590;
const TW=82,TH=55,SKEW=12,OX=100,OY=84;
export function project(x:number,y:number,high=false) { return {x:OX+x*TW+y*SKEW+(TW+SKEW)/2,y:OY+y*TH+TH/2-(high?17:0)}; }
function polygon(x:number,y:number,raise=0) { const sx=OX+x*TW+y*SKEW,sy=OY+y*TH-raise;return [{x:sx,y:sy},{x:sx+TW,y:sy},{x:sx+TW+SKEW,y:sy+TH},{x:sx+SKEW,y:sy+TH}]; }
export class Battlefield extends Phaser.Scene {
  battle:Battle; selectedKind:UnitKind|null=null; selectedId:number|null=null; pending:Cell|null=null; direction:Direction='right';
  private highlight!:Phaser.GameObjects.Graphics;private bars!:Phaser.GameObjects.Graphics;
  private figures=new Map<number,Phaser.GameObjects.Image>();private shadows=new Map<number,Phaser.GameObjects.Ellipse>();private clock=0;private ghost:Phaser.GameObjects.Image|null=null;private attacks=new Map<number,number>();private lastFrame=0;
  constructor(battle:Battle,private onCell:(cell:Cell)=>void,private onFrame:()=>void,private onEvent:(event:GameEvent)=>void){super('battle');this.battle=battle;}
  preload(){
    for(const k of UNIT_ORDER)this.load.svg(k,dataSVG(operatorSVG(k)),{width:120,height:152});
    for(const k of Object.keys(ENEMIES) as EnemyKind[]){this.load.svg(k,dataSVG(enemySVG(k)),{width:120,height:152});this.load.svg(`${k}-walk`,dataSVG(enemySVG(k,true)),{width:120,height:152});}
  }
  create(){
    this.drawMap();this.highlight=this.add.graphics().setDepth(4);this.bars=this.add.graphics().setDepth(1000);
    const resize=()=>{const {width,height}=this.scale;this.cameras.main.setOrigin(0,0).setViewport(0,0,width,height).setZoom(width/VIEW_W,height/VIEW_H);};resize();this.scale.on('resize',resize);this.events.once('shutdown',()=>this.scale.off('resize',resize));
    this.input.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{
      const world=this.cameras.main.getWorldPoint(pointer.x,pointer.y);
      for(let y=ROWS-1;y>=0;y--)for(let x=COLS-1;x>=0;x--){if(Phaser.Geom.Polygon.Contains(new Phaser.Geom.Polygon(polygon(x,y)),world.x,world.y)){this.onCell({x,y});return;}}
    });
    this.cameras.main.fadeIn(450,15,21,25);
  }
  private label(x:number,y:number,text:string,size=11,color='#87969e'){return this.add.text(x,y,text,{fontFamily:'"Courier New", monospace',fontSize:size,color,letterSpacing:1}).setDepth(1);}
  private drawMap(){
    const g=this.add.graphics();g.fillStyle(0x161e24);g.fillRect(0,0,VIEW_W,VIEW_H);
    g.lineStyle(1,0x697b84,.075);for(let x=-300;x<1400;x+=42){g.lineBetween(x,0,x+180,590);}for(let y=0;y<600;y+=38)g.lineBetween(0,y,1280,y);
    this.label(57,23,'07 / NORTHERN RELAY',12,'#b9c7cb');this.label(1070,23,'LIVE TACTICAL FEED',10,'#82979f');
    this.label(58,553,'36° 41′ N    118° 27′ E',10);this.label(838,553,'GROUND  ▱    HIGH PLATFORM  ▰    LIMIT 08',10);
    // An elevated concrete foundation unifies the entire playable board.
    g.fillStyle(0x0a1116,.6);g.fillPoints([{x:83,y:98},{x:1100,y:98},{x:1196,y:491},{x:170,y:491}],true);
    g.fillStyle(0x303b43);g.fillPoints([{x:94,y:84},{x:1087,y:84},{x:1172,y:485},{x:178,y:485}],true);
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      const t=terrain(x,y),high=t==='high',p=polygon(x,y,high?17:0),base=polygon(x,y),route=isRoute(x,y);
      const shade=(x*7+y*13)%3;
      g.fillStyle(high?0x364550:0x222e36);g.fillPoints([p[3],p[2],{x:base[2].x,y:base[2].y+10},{x:base[3].x,y:base[3].y+10}],true);
      g.fillStyle(high?0x72818a:route?[0x56626a,0x525f67,0x59646a][shade]:[0x424d55,0x465159,0x3f4a52][shade]);g.fillPoints(p,true);
      g.lineStyle(1,high?0x96a8b0:0x65727a,.75);g.strokePoints(p,true);g.lineStyle(1,0x18252e,.8);g.lineBetween(p[3].x+1,p[3].y-1,p[2].x-1,p[2].y-1);
      const c=project(x,y,high);
      g.lineStyle(1,0xb7c1c2,.10);g.lineBetween(c.x-27,c.y-14,c.x+24,c.y-14);g.lineBetween(c.x-23,c.y+12,c.x+28,c.y+12);
      g.fillStyle(0x151f26,.5);for(const px of [-29,29])for(const py of [-19,19])g.fillCircle(c.x+px,c.y+py,1.2);
      // Scratches and stamped panel seams are deterministic, never random combat attributes.
      if((x+y)%3===0){g.lineStyle(1,0xc3c6bd,.16);g.lineBetween(c.x-20,c.y+6,c.x-5,c.y+1);g.lineBetween(c.x+16,c.y-11,c.x+26,c.y-14);}
      if(high){g.lineStyle(3,0xe7be68,.8);g.lineBetween(p[3].x+10,p[3].y-3,p[3].x+32,p[3].y-3);g.fillStyle(0x31434e);g.fillRect(c.x-17,c.y-9,31,15);g.lineStyle(1,0xabc2ce,.5);g.strokeRect(c.x-17,c.y-9,31,15);g.lineBetween(c.x-10,c.y-6,c.x-7,c.y+3);g.lineBetween(c.x-1,c.y-6,c.x+2,c.y+3);}
      if(t==='obstacle')this.drawObstacle(g,c.x,c.y,(x+y)%3);
      if(t==='spawn'||t==='exit'){
        const color=t==='spawn'?0xe38b6d:0x83bfce;g.lineStyle(2,color,.9);g.strokePoints(p,true);g.fillStyle(color,.14);g.fillPoints(p,true);
        g.lineStyle(3,color,.7);const flip=t==='spawn'?1:-1;for(let i=-1;i<=1;i++)g.strokePoints([{x:c.x-8*flip+i*13,y:c.y-8},{x:c.x+i*13+3*flip,y:c.y},{x:c.x-8*flip+i*13,y:c.y+8}],false);
        this.label(c.x-28,c.y+29,t==='spawn'?'ENTRY':'DEFEND',8,t==='spawn'?'#dd9c83':'#9ac9d4');
      }
    }
    // Route chevrons stay subtle enough to leave enemies and placement highlights readable.
    for(const route of ROUTES)for(let i=1;i<route.length-1;i++){
      const p=project(route[i].x,route[i].y),n=route[i+1];const a=Math.atan2(n.y-route[i].y,n.x-route[i].x);
      const v=new Phaser.Math.Vector2(7,0).rotate(a),w=new Phaser.Math.Vector2(-4,-5).rotate(a),z=new Phaser.Math.Vector2(-4,5).rotate(a);
      g.lineStyle(1,0xd4c7aa,.3);g.strokePoints([{x:p.x+w.x,y:p.y+w.y},{x:p.x+v.x,y:p.y+v.y},{x:p.x+z.x,y:p.y+z.y}],false);
    }
    for(let x=0;x<COLS;x++)this.label(OX+x*TW+43,58,String(x+1).padStart(2,'0'),9);
    for(let y=0;y<ROWS;y++)this.label(OX+y*SKEW-25,OY+y*TH+21,String.fromCharCode(65+y),10);
    this.label(65,507,'A  ─  NORTH ACCESS',9,'#b8a48a');this.label(901,507,'B  ─  SOUTH ACCESS',9,'#b8a48a');
    // Bake hundreds of static panel/bolt commands once; combat frames draw one map texture.
    g.generateTexture('terrain-map',VIEW_W,VIEW_H);g.destroy();this.add.image(0,0,'terrain-map').setOrigin(0).setDepth(0);
  }
  private drawObstacle(g:Phaser.GameObjects.Graphics,x:number,y:number,variant:number){
    if(variant===0){g.fillStyle(0x25313b);g.fillPoints([{x:x-26,y:y-26},{x:x+24,y:y-26},{x:x+29,y:y+17},{x:x-22,y:y+17}],true);g.fillStyle(0x5e6c73);g.fillPoints([{x:x-26,y:y-26},{x:x+24,y:y-26},{x:x+32,y:y-12},{x:x-18,y:y-12}],true);g.lineStyle(2,0x83939b,.6);g.lineBetween(x-15,y-20,x+15,y-20);g.lineStyle(2,0x73838d,.35);for(let i=0;i<4;i++)g.lineBetween(x-17,y+i*5,x+20,y+i*5);}
    else if(variant===1){g.fillStyle(0x313f48);g.fillRect(x-25,y-27,49,38);g.fillStyle(0x66747c);g.fillPoints([{x:x-25,y:y-27},{x:x+24,y:y-27},{x:x+30,y:y-17},{x:x-19,y:y-17}],true);g.lineStyle(3,0xb39c64,.7);for(let i=0;i<4;i++)g.lineBetween(x-17+i*10,y-12,x-22+i*10,y+1);g.lineStyle(1,0x94a3a9,.4);g.strokeRect(x-25,y-27,49,38);}
    else {g.fillStyle(0x273842);g.fillRect(x-24,y-22,46,30);g.fillStyle(0x506b78);g.fillPoints([{x:x-24,y:y-22},{x:x+22,y:y-22},{x:x+28,y:y-11},{x:x-18,y:y-11}],true);g.fillStyle(0x91c1c2,.7);g.fillRect(x-15,y-7,18,3);g.fillStyle(0xc4a66c,.7);g.fillCircle(x+13,y-5,2);}
  }
  update(_time:number,delta:number){
    const now=performance.now(),elapsed=this.lastFrame?Math.min(250,now-this.lastFrame):Math.min(250,delta);this.lastFrame=now;
    this.battle.tick(elapsed/1000);if(!this.highlight)return;
    if(!this.battle.paused&&this.battle.status==='playing')this.clock+=elapsed*this.battle.speed;
    const events=this.battle.drainEvents();for(const event of events){this.effect(event);this.onEvent(event);}
    this.drawHighlights();this.drawEntities();this.onFrame();
  }
  private drawHighlights(){
    const g=this.highlight;g.clear();
    if(this.selectedKind&&!this.pending)for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(this.battle.canPlace(this.selectedKind,{x,y})){g.fillStyle(0xe6b657,.20);g.fillPoints(polygon(x,y,terrain(x,y)==='high'?17:0),true);g.lineStyle(1,0xe9c57f,.7);g.strokePoints(polygon(x,y,terrain(x,y)==='high'?17:0),true);}
    let u:Operator|undefined=this.battle.units.find(u=>u.id===this.selectedId);
    if(this.pending&&this.selectedKind)u={...this.pending,kind:this.selectedKind,direction:this.direction} as Operator;
    if(u){
      for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(this.battle.inRange(u,{x,y})){g.fillStyle(u.kind==='medic'?0x9bcab3:0xeab75f,.18);g.fillPoints(polygon(x,y,terrain(x,y)==='high'?17:0),true);g.lineStyle(1,0xf2c977,.35);g.strokePoints(polygon(x,y,terrain(x,y)==='high'?17:0),true);}
      const p=polygon(u.x,u.y,terrain(u.x,u.y)==='high'?17:0);g.fillStyle(0xf2c269,.22);g.fillPoints(p,true);g.lineStyle(3,0xf2c269,.95);g.strokePoints(p,true);
      const c=project(u.x,u.y,terrain(u.x,u.y)==='high'),angle={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2}[u.direction];
      const v=new Phaser.Math.Vector2(26,0).rotate(angle),w=new Phaser.Math.Vector2(12,-6).rotate(angle),z=new Phaser.Math.Vector2(12,6).rotate(angle);g.fillStyle(0xffd588);g.fillTriangle(c.x+v.x,c.y+v.y,c.x+w.x,c.y+w.y,c.x+z.x,c.y+z.y);
    }
  }
  private drawEntities(){
    this.bars.clear();const present=new Set<number>();
    const figureHeight=Math.min(1.65,Math.max(1,this.cameras.main.zoomX/this.cameras.main.zoomY));
    if(this.pending&&this.selectedKind){const p=project(this.pending.x,this.pending.y,UNITS[this.selectedKind].terrain==='high');if(!this.ghost)this.ghost=this.add.image(p.x,p.y,this.selectedKind).setOrigin(.5,.9);this.ghost.setTexture(this.selectedKind).setPosition(p.x,p.y).setDisplaySize(57,72*figureHeight).setAlpha(.65).setDepth(9+p.y).setFlipX(this.direction==='left');}else if(this.ghost){this.ghost.destroy();this.ghost=null;}
    const all=[...this.battle.enemies,...this.battle.units];
    for(const entity of all){
      present.add(entity.id);const friendly='direction'in entity,high=friendly&&UNITS[entity.kind as UnitKind].terrain==='high',p=project(entity.x,entity.y,high);
      let sprite=this.figures.get(entity.id);
      if(!sprite){sprite=this.add.image(p.x,p.y,entity.kind).setOrigin(.5,.9);this.figures.set(entity.id,sprite);this.shadows.set(entity.id,this.add.ellipse(p.x,p.y,35,11,0x07121b,.42));}
      const moving=!friendly&&(entity as import('./model').Enemy).blockedBy===null;
      const rhythm=entity.kind==='runner'?85:entity.kind==='armor'?210:entity.kind==='elite'?240:140;
      const bob=Math.sin(this.clock/(moving?rhythm:350)+entity.id)*(moving?(entity.kind==='runner'?2.4:1.3):.65);
      if(!friendly)sprite.setTexture(moving&&Math.floor(this.clock/rhythm+entity.id)%2?`${entity.kind}-walk`:entity.kind);
      const sinceAttack=this.clock-(this.attacks.get(entity.id)??-1000),lean=sinceAttack<180?Math.sin(sinceAttack/180*Math.PI):0;
      const dx=friendly?(entity as Operator).direction==='left'?-4:4:0;
      sprite.setPosition(p.x+lean*dx,p.y+bob).setAngle(moving&&entity.kind==='runner'?4:lean*5).setDisplaySize(entity.kind==='elite'?73:57,(entity.kind==='elite'?92:72)*figureHeight).setDepth(10+p.y);
      sprite.setFlipX(friendly&&(entity as Operator).direction==='left');
      sprite.setTint(entity.hit>0?0xffd1af:0xffffff);
      this.shadows.get(entity.id)?.setPosition(p.x,p.y+2).setDepth(9+p.y);
      const hpMax=friendly?UNITS[entity.kind as UnitKind].hp:ENEMIES[entity.kind as EnemyKind].hp;
      const bw=32,by=p.y+6;this.bars.fillStyle(0x0a1219,.9);this.bars.fillRect(p.x-bw/2-1,by-1,bw+2,5);this.bars.fillStyle(friendly?0xa6c4b3:0xd59479);this.bars.fillRect(p.x-bw/2,by,bw*Math.max(0,entity.hp/hpMax),3);
      if(friendly){const u=entity as Operator,c=UNITS[u.kind];this.bars.fillStyle(0xf0bd68,.7);this.bars.fillRect(p.x-16,by+5,32*(u.active>0?u.active/c.duration:u.skillCharge/c.cooldown),2);if(u.skillCharge>=c.cooldown&&u.kind!=='vanguard'){this.bars.fillStyle(0xffd28a);this.bars.fillTriangle(p.x+21,p.y-57,p.x+16,p.y-49,p.x+26,p.y-49);}if(u.active>0){
        const color=Number(c.color.replace('#','0x'));this.bars.lineStyle(1,color,.55);this.bars.strokeEllipse(p.x,p.y,48,18);
        if(u.kind==='defender'){this.bars.lineStyle(2,0xa9d2e2,.75);this.bars.strokePoints([{x:p.x-27,y:p.y-40},{x:p.x,y:p.y-48},{x:p.x+27,y:p.y-40},{x:p.x+24,y:p.y-13},{x:p.x,y:p.y-3},{x:p.x-24,y:p.y-13}],true);}
        if(u.kind==='reaper'||u.kind==='liberator'){const a=this.clock/400;this.bars.lineStyle(2,color,.8);this.bars.beginPath();this.bars.arc(p.x,p.y-10,u.kind==='liberator'?36:28,a,a+2);this.bars.strokePath();}
        if(u.kind==='medic'){const lift=this.clock/25%35;this.bars.lineStyle(2,0xb6e6c6,.7);this.bars.lineBetween(p.x+23,p.y-lift-5,p.x+23,p.y-lift-13);this.bars.lineBetween(p.x+19,p.y-lift-9,p.x+27,p.y-lift-9);}
        if(u.kind==='lord'){this.bars.lineStyle(2,0xa2e4dc,.9);this.bars.lineBetween(p.x-10,p.y-20,p.x+35,p.y-53);}
      }}
    }
    for(const [id,sprite]of this.figures)if(!present.has(id)){sprite.destroy();this.figures.delete(id);this.shadows.get(id)?.destroy();this.shadows.delete(id);this.attacks.delete(id);}
  }
  private ring(x:number,y:number,color:number,size=50,duration=400){const g=this.add.graphics().setDepth(800);g.lineStyle(2,color,.9);g.strokeEllipse(0,0,size,size*.5);g.setPosition(x,y);this.tweens.add({targets:g,scale:1.8,alpha:0,duration,onComplete:()=>g.destroy()});}
  private floating(x:number,y:number,text:string,color:string){const label=this.add.text(x,y,text,{fontFamily:'monospace',fontSize:14,color,fontStyle:'bold',stroke:'#122029',strokeThickness:3}).setOrigin(.5).setDepth(1001);this.tweens.add({targets:label,y:y-28,alpha:0,duration:700,onComplete:()=>label.destroy()});}
  private effect(e:GameEvent){
    const p=project(e.x,e.y,terrain(Math.round(e.x),Math.round(e.y))==='high');
    const target=project(e.targetX??e.x,e.targetY??e.y,terrain(Math.round(e.targetX??e.x),Math.round(e.targetY??e.y))==='high');
    if(e.type==='deploy'){this.ring(p.x,p.y,0xf7c574,65);const g=this.add.graphics().setDepth(799).setPosition(p.x,p.y);g.fillStyle(0xf5d898,.35);g.fillTriangle(-24,0,0,-110,24,0);this.tweens.add({targets:g,alpha:0,scaleX:1.8,duration:430,onComplete:()=>g.destroy()});}
    if(e.type==='attack'){
      if(e.kind&&e.kind in UNITS){const attacker=this.battle.units.find(u=>u.x===e.x&&u.y===e.y);if(attacker)this.attacks.set(attacker.id,this.clock);}
      const ranged=e.kind==='sniper'||e.kind==='caster'||e.kind==='lord';
      if(ranged){const color=e.kind==='caster'?0x9acbf7:e.kind==='lord'?0x9cd7d1:0xfbe0a2;const b=this.add.circle(p.x,p.y-30,e.kind==='caster'?5:2,color).setDepth(802);const trail=this.add.line(0,0,p.x,p.y-30,target.x,target.y-26,color,.35).setOrigin(0).setDepth(801);this.tweens.add({targets:b,x:target.x,y:target.y-26,duration:e.kind==='caster'?220:90,onComplete:()=>{b.destroy();trail.destroy();if(e.value)this.ring(target.x,target.y-13,color,100,450);}});}
      else{const g=this.add.graphics().setDepth(802);g.lineStyle(e.kind==='liberator'?5:3,e.kind==='liberator'?0xffb16e:0xd5dcce,.8);g.beginPath();g.arc(target.x,target.y-24,e.kind==='liberator'?29:19,-1.8,.7);g.strokePath();this.tweens.add({targets:g,alpha:0,duration:170,onComplete:()=>g.destroy()});}
    }
    if(e.type==='heal'){const g=this.add.graphics().setDepth(802);g.lineStyle(2,0xa1d6b4,.65);g.lineBetween(p.x,p.y-25,target.x,target.y-24);this.tweens.add({targets:g,alpha:0,duration:350,onComplete:()=>g.destroy()});this.floating(target.x,target.y-50,`+${e.amount}`,'#b8e3c4');this.ring(target.x,target.y,0x9ac8ab,34,400);}
    if(e.type==='death'||e.type==='down'){for(let i=0;i<6;i++){const particle=this.add.rectangle(p.x,p.y-22,3+i%2*2,3, e.type==='down'?0xe4ba79:0x9ba8ae,.85).setDepth(803);this.tweens.add({targets:particle,x:p.x+Math.cos(i*1.05)*25,y:p.y-22+Math.sin(i*1.05)*19,alpha:0,angle:90,duration:350+i*30,onComplete:()=>particle.destroy()});}if(e.type==='down'){this.ring(p.x,p.y,0xe6a368,60);this.floating(p.x,p.y-55,'干员退场','#f0b58e');}}
    if(e.type==='dp'){this.floating(p.x,p.y-55,'DP +8','#f4cc83');this.ring(p.x,p.y,0xe4b45b,40);}
    if(e.type==='skill'){this.ring(p.x,p.y,0xffc276,e.kind==='liberator'?170:80,550);this.floating(p.x,p.y-65,UNITS[e.kind as UnitKind].skill,'#ffdaa1');}
    if(e.type==='leak'){this.cameras.main.flash(220,170,53,33,false);this.ring(p.x,p.y,0xf68c71,100);}
    if(e.type==='victory'||e.type==='defeat')this.cameras.main.fadeOut(1300,e.type==='victory'?25:60,26,29);
  }
}
