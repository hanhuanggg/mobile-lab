export type UnitKind = 'vanguard' | 'defender' | 'lord' | 'liberator' | 'reaper' | 'sniper' | 'caster' | 'medic';
export type Direction = 'right' | 'down' | 'left' | 'up';
export type EnemyKind = 'infantry' | 'runner' | 'armor' | 'elite';
export interface Cell { x: number; y: number }
export interface UnitConfig {
  id: UnitKind; name: string; role: string; code: string; color: string; cost: number;
  hp: number; atk: number; def: number; res: number; interval: number; block: number;
  terrain: 'ground' | 'high'; range: number; width: number; redeploy: number;
  skill: string; cooldown: number; duration: number; description: string; trait: string;
}
export const UNITS: Record<UnitKind, UnitConfig> = {
  vanguard: { id:'vanguard',name:'隼线',role:'先锋 · 尖兵',code:'V-01',color:'#eab85d',cost:10,hp:1650,atk:245,def:120,res:0,interval:1.05,block:2,terrain:'ground',range:1.25,width:0.6,redeploy:22,skill:'前线补给',cooldown:18,duration:0,description:'每 18 秒自动获得 8 点部署费用。',trait:'阻挡 2 · 自动生产部署费用' },
  defender: { id:'defender',name:'磐城',role:'重装 · 铁卫',code:'D-02',color:'#91afba',cost:18,hp:3800,atk:200,def:410,res:10,interval:1.6,block:3,terrain:'ground',range:1.1,width:0.6,redeploy:30,skill:'不动壁垒',cooldown:28,duration:10,description:'持续 10 秒，防御提升 150%，展开防护屏障。',trait:'阻挡 3 · 重型防御装甲' },
  lord: { id:'lord',name:'折锋',role:'近卫 · 领主',code:'G-03',color:'#7db8b7',cost:16,hp:2200,atk:390,def:210,res:5,interval:1.25,block:2,terrain:'ground',range:2.5,width:1.1,redeploy:26,skill:'延伸刃域',cooldown:25,duration:10,description:'持续 10 秒，攻击提升 70%；远程攻击造成 80% 伤害。',trait:'阻挡 2 · 近战部署 / 远程斩击' },
  liberator: { id:'liberator',name:'烬刃',role:'近卫 · 解放者',code:'G-04',color:'#e58b62',cost:12,hp:2600,atk:540,def:220,res:0,interval:1.1,block:3,terrain:'ground',range:2.1,width:1.1,redeploy:26,skill:'临界解放',cooldown:24,duration:12,description:'待机不攻击、不阻挡，20 秒蓄力至 +150% 攻击。释放后阻挡 3，群体斩击 12 秒。',trait:'待机蓄力 · 手动开启群体爆发' },
  reaper: { id:'reaper',name:'芒镰',role:'近卫 · 收割者',code:'G-05',color:'#b7c280',cost:20,hp:2900,atk:410,def:245,res:0,interval:1.35,block:2,terrain:'ground',range:1.4,width:1.1,redeploy:30,skill:'收割回路',cooldown:27,duration:10,description:'持续 10 秒，攻击间隔缩短 55%。每命中一个目标回复 80 生命。无法接受直接治疗。',trait:'全体攻击 · 命中自愈 / 不接受医疗' },
  sniper: { id:'sniper',name:'灰隼',role:'狙击 · 速射手',code:'S-06',color:'#d3c9ae',cost:12,hp:1100,atk:275,def:65,res:0,interval:0.82,block:0,terrain:'high',range:3.7,width:1.2,redeploy:22,skill:'脉冲连射',cooldown:24,duration:9,description:'持续 9 秒，攻击间隔缩短 65%，连续发射高速弹丸。',trait:'高台部署 · 优先空中目标' },
  caster: { id:'caster',name:'弧光',role:'术师 · 中坚术师',code:'C-07',color:'#85b4df',cost:18,hp:1250,atk:460,def:75,res:20,interval:1.65,block:0,terrain:'high',range:3.3,width:1.2,redeploy:26,skill:'电离坍缩',cooldown:22,duration:0,description:'强化下一次攻击：造成 220% 法术伤害，并引爆半径 1.35 格内的敌人。',trait:'高台部署 · 法术攻击穿透物理护甲' },
  medic: { id:'medic',name:'白穗',role:'医疗 · 医师',code:'M-08',color:'#9dc8b4',cost:15,hp:1350,atk:280,def:75,res:10,interval:1.7,block:0,terrain:'high',range:3.2,width:1.6,redeploy:24,skill:'紧急救护',cooldown:26,duration:10,description:'持续 10 秒，治疗量提升 60%，治疗间隔缩短 40%。优先治疗生命比例最低的友军。',trait:'高台部署 · 单体治疗 / 无攻击能力' },
};
export const UNIT_ORDER = Object.keys(UNITS) as UnitKind[];
export const ENEMIES = {
  infantry: { name:'灰域步兵',hp:650,atk:205,def:35,res:0,speed:0.48,interval:1.5,color:0xb7ada1,damage:1 },
  runner: { name:'裂隙突击兵',hp:460,atk:170,def:15,res:0,speed:0.92,interval:0.95,color:0xd29370,damage:1 },
  armor: { name:'铸铁重装兵',hp:2100,atk:420,def:430,res:5,speed:0.33,interval:2,color:0x8896a1,damage:1 },
  elite: { name:'破阵者',hp:5400,atk:820,def:320,res:20,speed:0.6,interval:1.65,color:0xd36a53,damage:3 },
} as const;
export const COLS = 12, ROWS = 7;
// Fixed routes: enemies never re-path around deployed operators.
export const ROUTES: Cell[][] = [
  [{x:0,y:2},{x:1,y:2},{x:2,y:2},{x:3,y:2},{x:4,y:2},{x:4,y:1},{x:5,y:1},{x:6,y:1},{x:7,y:1},{x:7,y:2},{x:8,y:2},{x:9,y:2},{x:10,y:2},{x:11,y:2}],
  [{x:0,y:4},{x:1,y:4},{x:2,y:4},{x:3,y:4},{x:3,y:5},{x:4,y:5},{x:5,y:5},{x:6,y:5},{x:7,y:5},{x:8,y:5},{x:8,y:4},{x:9,y:4},{x:10,y:4},{x:11,y:4}],
];
const highs = new Set(['2,0','4,0','6,0','8,0','10,0','1,3','3,3','5,3','7,3','9,3','10,3','2,6','4,6','6,6','9,6']);
const obstacles = new Set(['0,0','1,0','11,0','0,1','10,1','11,1','0,3','11,3','0,5','11,5','0,6','1,6','10,6','11,6','6,3']);
export function terrain(x:number,y:number): 'ground'|'high'|'obstacle'|'spawn'|'exit' {
  if (x<0||x>=COLS||y<0||y>=ROWS) return 'obstacle';
  if(x===0&&(y===2||y===4)) return 'spawn';
  if(x===11&&(y===2||y===4)) return 'exit';
  const key=`${x},${y}`; return highs.has(key)?'high':obstacles.has(key)?'obstacle':'ground';
}
export function isRoute(x:number,y:number) { return ROUTES.some(r=>r.some(c=>c.x===x&&c.y===y)); }
export interface Spawn { at:number; kind:EnemyKind; route:number; wave:number }
export const SPAWNS: Spawn[] = [];
function wave(w:number, start:number, rows:[number,EnemyKind,number][]) { rows.forEach(([t,kind,route])=>SPAWNS.push({at:start+t,kind,route,wave:w})); }
wave(1,0,[[6,'infantry',0],[13,'infantry',0],[20,'runner',0],[24,'infantry',1],[29,'infantry',0],[34,'infantry',1],[39,'runner',1],[44,'infantry',0],[47,'infantry',1]]);
wave(2,52,[[0,'armor',0],[5,'infantry',1],[10,'runner',0],[14,'armor',1],[19,'infantry',0],[23,'infantry',1],[27,'runner',1],[31,'armor',0],[36,'runner',0],[40,'armor',1],[45,'infantry',1]]);
wave(3,104,[[0,'infantry',0],[0,'infantry',1],[5,'runner',0],[5,'runner',1],[10,'armor',0],[12,'armor',1],[17,'infantry',0],[18,'infantry',1],[22,'runner',0],[23,'runner',1],[27,'armor',0],[30,'infantry',1],[33,'runner',0],[35,'armor',1],[32,'infantry',0],[34,'runner',1],[36,'elite',1]]);
SPAWNS.sort((a,b)=>a.at-b.at);
export const TOTAL_ENEMIES = SPAWNS.length;
export function rangeContains(origin:Cell,target:Cell,direction:Direction,range:number,width:number) {
  const dx=target.x-origin.x,dy=target.y-origin.y;
  const [forward,side]=direction==='right'?[dx,dy]:direction==='left'?[-dx,dy]:direction==='down'?[dy,dx]:[-dy,dx];
  return forward>=-0.45 && forward<=range && Math.abs(side)<=width;
}
