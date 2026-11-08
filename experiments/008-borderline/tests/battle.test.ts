import { describe,it,expect } from 'vitest';
import { Battle, damage, type Enemy } from '../source/src/game/model';
import { UNITS, ENEMIES, ROUTES, SPAWNS, rangeContains, type UnitKind, type Direction } from '../source/src/game/config';
function advance(b:Battle,seconds:number){for(let i=0;i<seconds*30;i++)b.tick(1/30);}
function enemy(b:Battle,kind:'infantry'|'armor'|'elite'='infantry',x=8,y=2):Enemy{const e={id:999+b.enemies.length,kind,x,y,route:0,progress:10,hp:ENEMIES[kind].hp,attackTimer:0,blockedBy:null,hit:0};b.enemies.push(e);return e;}
function rich(){const b=new Battle();b.dp=99;return b;}
describe('deployment and economy',()=>{
  it('starts with 3 lives and 10 DP, recovers exactly once each second',()=>{const b=new Battle();advance(b,3.1);expect(b.dp).toBe(13);expect(b.lives).toBe(3);});
  it('never charges an illegal or unaffordable deployment',()=>{const b=new Battle();expect(b.deploy('vanguard',{x:6,y:0},'left')).toBeNull();expect(b.deploy('caster',{x:6,y:0},'down')).toBeNull();expect(b.dp).toBe(10);});
  it('enforces terrain, occupancy, two copies and the eight-unit cap',()=>{const b=rich();expect(b.deploy('vanguard',{x:8,y:2},'left')).not.toBeNull();expect(b.deploy('vanguard',{x:8,y:2},'left')).toBeNull();b.deploy('vanguard',{x:9,y:2},'left');expect(b.deploy('vanguard',{x:10,y:2},'left')).toBeNull();for(const [k,x,y]of [['sniper',2,0],['sniper',4,0],['caster',6,0],['caster',8,0],['medic',10,0],['defender',7,2]] as [UnitKind,number,number][]){b.dp=99;b.deploy(k,{x,y},'left');}expect(b.units.length).toBe(8);b.dp=99;expect(b.deploy('lord',{x:6,y:2},'left')).toBeNull();});
  it('retreat returns floored half-cost and puts the type on cooldown',()=>{const b=rich();const u=b.deploy('medic',{x:7,y:3},'right')!;expect(b.dp).toBe(84);b.retreat(u.id);expect(b.dp).toBe(91);expect(b.cooldowns.medic).toBe(24);expect(b.deploy('medic',{x:7,y:3},'right')).toBeNull();advance(b,24.1);expect(b.deploy('medic',{x:7,y:3},'right')).not.toBeNull();});
  it('vanguard automatically adds 8 DP every 18 seconds',()=>{const b=new Battle();b.deploy('vanguard',{x:1,y:1},'left');advance(b,18.1);expect(b.dp).toBe(26);});
  it('pausing freezes the entire simulation and speed doubles elapsed time',()=>{const b=new Battle();b.paused=true;advance(b,10);expect(b.elapsed).toBe(0);b.paused=false;b.speed=2;advance(b,3);expect(b.elapsed).toBeCloseTo(6);});
});
describe('combat resolution',()=>{
  it('uses physical defense, minimum physical damage, and independent magic resistance',()=>{expect(damage(300,200,50)).toBe(100);expect(damage(300,500,0)).toBe(15);expect(damage(300,500,20,true)).toBe(240);});
  it('rotates attack areas to all four directions',()=>{for(const [d,p]of [['right',{x:7,y:3}],['left',{x:3,y:3}],['up',{x:5,y:1}],['down',{x:5,y:5}]] as [Direction,{x:number;y:number}][]){expect(rangeContains({x:5,y:3},p,d,2.5,1)).toBe(true);}expect(rangeContains({x:5,y:3},{x:3,y:3},'right',3,1)).toBe(false);});
  it('blocking stops enemies, respects capacity, and retreat releases every reservation',()=>{const b=rich();const u=b.deploy('vanguard',{x:8,y:2},'left')!;const es=[enemy(b),enemy(b),enemy(b)];b.tick(1/30);expect(es.filter(e=>e.blockedBy===u.id)).toHaveLength(2);const blocked=es[0],progress=blocked.progress;advance(b,.2);expect(blocked.progress).toBe(progress);b.retreat(u.id);expect(es.every(e=>e.blockedBy===null)).toBe(true);});
  it('an operator death immediately releases blocked enemies and starts redeployment',()=>{const b=rich(),u=b.deploy('vanguard',{x:8,y:2},'left')!;u.hp=1;const e=enemy(b,'elite');b.tick(1/30);expect(b.units).toHaveLength(0);expect(e.blockedBy).toBeNull();expect(b.cooldowns.vanguard).toBeGreaterThan(21);});
  it('a medic heals the lowest health ratio and never directly heals a reaper',()=>{const b=rich(),m=b.deploy('medic',{x:7,y:3},'right')!,v=b.deploy('vanguard',{x:8,y:2},'left')!,r=b.deploy('reaper',{x:8,y:4},'down')!;v.hp=500;r.hp=1;advance(b,.5);expect(v.hp).toBeGreaterThan(500);expect(r.hp).toBe(1);expect(m.hp).toBe(UNITS.medic.hp);});
  it('liberator neither blocks nor attacks until skill activation, then hits multiple targets',()=>{const b=rich(),u=b.deploy('liberator',{x:8,y:2},'left')!;u.skillCharge=24;u.charge=1;const a=enemy(b,'armor'),c=enemy(b,'armor',7.8,2);advance(b,.2);expect(a.hp).toBe(ENEMIES.armor.hp);expect(a.blockedBy).toBeNull();expect(b.skill(u.id)).toBe(true);advance(b,.1);expect(a.hp).toBeLessThan(ENEMIES.armor.hp);expect(c.hp).toBeLessThan(ENEMIES.armor.hp);expect(u.burstCharge).toBe(1);});
  it('reaper attacks every enemy in range and heals itself from actual hits',()=>{const b=rich(),u=b.deploy('reaper',{x:8,y:2},'left')!;u.hp=1000;const a=enemy(b),c=enemy(b,'infantry',7.8,2);advance(b,.3);expect(a.hp).toBeLessThan(650);expect(c.hp).toBeLessThan(650);expect(u.hp).toBeGreaterThan(1000);});
  it('caster skill arms a real area explosion and consumes its charge',()=>{const b=rich(),u=b.deploy('caster',{x:7,y:3},'up')!;u.skillCharge=22;const a=enemy(b,'armor',7,2),c=enemy(b,'armor',7.2,2);expect(b.skill(u.id)).toBe(true);advance(b,.1);expect(a.hp).toBeLessThan(1300);expect(c.hp).toBeLessThan(1300);expect(u.empowered).toBe(false);expect(b.skill(u.id)).toBe(false);});
  it('defender protection changes actual incoming damage',()=>{const b=rich(),u=b.deploy('defender',{x:8,y:2},'left')!;u.skillCharge=28;b.skill(u.id);enemy(b,'elite');b.tick(1/30);expect(UNITS.defender.hp-u.hp).toBeCloseTo(ENEMIES.elite.atk*.05);});
  it('lord uses lower ranged damage and its active skill increases actual damage',()=>{const hit=(distance:number,active:boolean)=>{const b=rich(),u=b.deploy('lord',{x:8,y:2},'left')!;u.attackTimer=0;if(active){u.skillCharge=25;b.skill(u.id);}const e=enemy(b,'armor',8-distance,2);b.tick(1/30);return ENEMIES.armor.hp-e.hp;};expect(hit(2,false)).toBeLessThan(hit(.3,false));expect(hit(2,true)).toBeGreaterThan(hit(2,false));});
  it('sniper burst fires materially more attacks within the same interval',()=>{const hits=(active:boolean)=>{const b=rich(),u=b.deploy('sniper',{x:8,y:0},'down')!;if(active){u.skillCharge=24;b.skill(u.id);}enemy(b,'elite');advance(b,1.8);return b.drainEvents().filter(e=>e.type==='attack'&&e.kind==='sniper').length;};expect(hits(true)).toBeGreaterThan(hits(false)*2);});
  it('medical skill improves both healing amount and attack interval',()=>{const heal=(active:boolean)=>{const b=rich(),u=b.deploy('medic',{x:7,y:3},'right')!,v=b.deploy('defender',{x:8,y:2},'left')!;v.hp=100;if(active){u.skillCharge=26;b.skill(u.id);}advance(b,2.3);return v.hp;};expect(heal(true)).toBeGreaterThan(heal(false)*1.8);});
});
describe('level and endings',()=>{
  it('contains three timed waves, two valid contiguous routes, and a final elite',()=>{expect(new Set(SPAWNS.map(s=>s.wave)).size).toBe(3);expect(SPAWNS.some(s=>s.kind==='elite'&&s.wave===3)).toBe(true);for(const r of ROUTES)for(let i=1;i<r.length;i++)expect(Math.abs(r[i].x-r[i-1].x)+Math.abs(r[i].y-r[i-1].y)).toBe(1);});
  it('doing nothing really loses, and final-state time cannot advance',()=>{const b=new Battle();advance(b,90);expect(b.status).toBe('defeat');expect(b.lives).toBe(0);const t=b.elapsed;advance(b,3);expect(b.elapsed).toBe(t);});
  it('a deterministic, affordable two-lane strategy can clear the complete level',()=>{
    const b=new Battle();
    const plan:[UnitKind,number,number,Direction][]=[['vanguard',8,2,'left'],['vanguard',8,4,'down'],['sniper',6,0,'down'],['caster',9,3,'down'],['medic',7,3,'right'],['caster',8,0,'down'],['defender',9,4,'left'],['lord',9,2,'left']];
    let index=0;for(let frame=0;frame<240*30&&b.status==='playing';frame++){
      if(index<plan.length){const[k,x,y,d]=plan[index];if(!b.availability(k)){if(b.deploy(k,{x,y},d))index++;}}
      for(const u of b.units)if(u.kind!=='vanguard'&&u.skillCharge>=UNITS[u.kind].cooldown)b.skill(u.id);
      b.tick(1/30);b.drainEvents();
    }
    expect(index).toBe(8);expect(b.status,`kills=${b.killed}, leaks=${b.leaked}, time=${b.elapsed}, units=${b.units.map(u=>u.kind)}`).toBe('victory');expect(b.lives).toBeGreaterThan(0);expect(b.elapsed).toBeLessThan(185);
  });
});
