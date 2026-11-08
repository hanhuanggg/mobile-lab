import Phaser from 'phaser';
import './style.css';
import { Battle, type GameEvent } from './game/model';
import { UNITS, UNIT_ORDER, ENEMIES, TOTAL_ENEMIES, terrain, type UnitKind, type Direction, type Cell } from './game/config';
import { Battlefield, project, VIEW_W, VIEW_H } from './game/scene';
import { operatorSVG, dataSVG } from './game/art';
import { Sound } from './game/audio';
import { icon } from './ui/icons';
interface Saved {sound:boolean;attempts:number;clears:number;bestLives:number;bestTime:number}
let saved:Saved={sound:true,attempts:0,clears:0,bestLives:0,bestTime:0};
try{saved={...saved,...JSON.parse(localStorage.getItem('borderline-v1')||'{}')};}catch{/* Private browsing can deny storage. */}
const persist=()=>{try{localStorage.setItem('borderline-v1',JSON.stringify(saved));}catch{/* The entire game works without storage. */}};
const app=document.querySelector<HTMLDivElement>('#app')!;
const sound=new Sound();sound.enabled=saved.sound;
let battle:Battle|null=null,game:Phaser.Game|null=null,scene:Battlefield|null=null;
let selectedKind:UnitKind|null=null,selectedId:number|null=null,pending:Cell|null=null,direction:Direction='right';
let previousUpdate=0,run=0,resultScheduled=false,toastTimer=0;
const $=<T extends HTMLElement=HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
const time=(seconds:number)=>`${Math.floor(seconds/60).toString().padStart(2,'0')}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;
const logo=`<span class="brand-mark">${icon('shield')}</span><span class="brand-word">BORDER<span>LINE</span><small>边 境 防 线</small></span>`;
function audioButton(){return `<button class="icon-button sound-toggle" aria-label="${saved.sound?'关闭':'开启'}音效" title="音效">${icon(saved.sound?'sound':'mute')}</button>`;}
function bindAudio(){document.querySelectorAll('.sound-toggle').forEach(btn=>btn.addEventListener('click',()=>{saved.sound=!saved.sound;sound.enabled=saved.sound;sound.unlock();sound.play('click');persist();document.querySelectorAll('.sound-toggle').forEach(el=>{el.innerHTML=icon(saved.sound?'sound':'mute');el.setAttribute('aria-label',`${saved.sound?'关闭':'开启'}音效`);});}));}
function home(){
  run++;game?.destroy(true);game=null;scene=null;battle=null;
  app.innerHTML=`<main class="home"><div class="home-art"></div><div class="home-grain"></div>
    <header class="home-header"><a href="../../" class="brand" aria-label="返回作品陈列馆">${logo}</a><nav><span class="nav-active">作战终端<i></i></span><button id="manual">作战手册</button><button id="records">行动记录</button></nav><div class="header-end"><span class="connection"><i></i> 终端已连接</span>${audioButton()}</div></header>
    <section class="hero-copy"><div class="eyebrow"><span class="tiny-square"></span> FRONTIER DEFENSE INITIATIVE <span class="copy-code">/ 008</span></div>
      <div class="hero-kicker">每一道防线，都是最后一道。</div><h1>边境<span>防线<span class="title-dot">.</span></span></h1>
      <div class="english-title">B O R D E R L I N E</div><div class="hero-description"><span></span><p>灰域正在逼近。<br>部署你的战术小队，守住最后的中继站。</p></div>
      <button id="start" class="start-button"><span class="start-label"><small>OPERATION / 01</small>开始作战</span><span class="start-arrow">${icon('arrow')}</span></button>
      <div class="start-note">实时战术塔防 <b>／</b> 单人行动 <b>／</b> 约 3 分钟</div>
    </section>
    <div class="character-caption"><span>V–01 / 隼线</span><small>FRONTLINE VANGUARD</small><i></i></div>
    <aside class="mission-preview"><div class="preview-top"><span>当前行动</span><span class="preview-index">01 — 01</span></div><div class="preview-main"><div class="mini-map"><svg viewBox="0 0 180 110" fill="none"><path d="M5 30h49V15h58v15h57M5 75h43v20h70V75h51" stroke="#b5b9ad" stroke-width="5"/><path d="M65 42h18v16H65zm36 0h18v16h-18zm36 0h18v16h-18z" fill="#66737a"/><path d="M1 20h16v20H1zm0 45h16v20H1z" stroke="#dda17a"/><path d="M158 19h20v22h-20zm0 45h20v22h-20z" stroke="#a2c6c5"/></svg><span>SECTOR 07</span></div><div><h2>边境防线</h2><p>北境 · 第七中继站</p><span class="difficulty"><i></i><i></i><i class="dim"></i><small>标准行动</small></span></div></div><div class="preview-bottom"><span>双线防守</span><span>8 种干员</span><span>3 轮攻势</span></div></aside>
    <footer class="home-footer"><span>TACTICAL COMMAND SYSTEM <b>v1.0</b></span><span>原创世界 · 独立战术演算</span><a href="../../">返回实验室 ${icon('arrow')}</a></footer>
  </main><div id="modal-root"></div><div id="toast" role="status" aria-live="polite"></div>`;
  $('#start').onclick=()=>{sound.unlock();sound.play('deploy');start();};$('#manual').onclick=()=>manual();$('#records').onclick=()=>records();bindAudio();
}
function start(){
  run++;resultScheduled=false;manualPause=false;orientationPause=false;game?.destroy(true);battle=new Battle();selectedKind=null;selectedId=null;pending=null;previousUpdate=0;
  saved.attempts++;persist();
  app.innerHTML=`<main class="battle-shell">
    <header class="battle-header"><button id="exit" class="mission-brand" aria-label="返回指挥终端"><span class="brand-mark">${icon('shield')}</span><span><small>OPERATION 01</small>边境防线</span></button>
      <div class="battle-stats"><div class="stat lives">${icon('shield')}<div><small>防线完整度</small><strong id="lives">03</strong><em>/ 03</em></div></div><div class="stat kills">${icon('crosshair')}<div><small>已歼灭目标</small><strong id="kills">00</strong><em>/ ${TOTAL_ENEMIES}</em></div></div><div class="stat wave-stat">${icon('flag')}<div><small>当前攻势</small><strong id="wave">01</strong><em>/ 03</em></div></div></div>
      <div class="battle-controls">${audioButton()}<button id="help" class="icon-button" aria-label="作战手册">${icon('help')}</button><button id="speed" class="speed-button" aria-label="切换战斗速度">1<span>×</span></button><button id="pause" class="pause-button" aria-label="暂停作战">${icon('pause')}</button></div>
    </header>
    <section class="field-wrap" aria-label="战术战场"><div class="field-heading"><div><span class="live-dot"></span><span id="phase-label">第一波 / 基础防守</span></div><div class="field-clock">作战时间 <b id="timer">00:00</b><span>／</span><span id="field-status">作战进行中</span></div></div>
      <div class="canvas-wrap"><div id="battlefield" role="application" aria-label="12×7 战场，点击干员卡片后选择格子和方向部署" tabindex="0"></div><div class="field-vignette"></div><div id="unit-panel" class="unit-panel" hidden></div><div id="direction-picker" class="direction-picker" hidden></div><div id="wave-banner" class="wave-banner" hidden></div><div id="pause-overlay" class="pause-overlay" hidden></div></div>
      <div class="field-bottom"><span id="hint">选择下方干员，再点击战场部署。上、下两条路线均需防守。</span><button id="restart" title="重新开始">${icon('restart')}重新开始</button></div>
    </section>
    <section class="deployment"><div class="deployment-intro"><span>TACTICAL<br>OPERATORS</span><strong><b id="unit-count">0</b><i>/ 8</i></strong><small>可部署干员</small></div><div class="operator-deck">${UNIT_ORDER.map((kind,i)=>{const c=UNITS[kind];return `<button class="operator-card" data-kind="${kind}" style="--unit-color:${c.color}" aria-label="${c.name}，${c.role}，${c.cost}部署费用"><span class="card-index">0${i+1}</span><span class="card-cost">${c.cost}<small>DP</small></span><img src="${dataSVG(operatorSVG(kind,true))}" alt="${c.name}原创角色" draggable="false"/><span class="card-status"></span><span class="card-role">${c.role}</span><span class="card-name">${c.name}<span>${c.code}</span></span><span class="card-bottom"></span></button>`;}).join('')}</div>
      <div class="dp-reserve"><span>部署费用 ${icon('bolt')}</span><strong id="dp">10</strong><div class="dp-track"><i id="dp-tick"></i></div><small>自动回复 +1 / s</small></div>
    </section><footer class="battle-footer"><a href="../../">POCKET CREATIVE LAB</a><span>点击部署 · 选择朝向 · 守住防线</span><span><kbd>SPACE</kbd> 暂停 <b>／</b> <kbd>1–8</kbd> 选择干员</span></footer>
    </main><div class="orientation-hint"><span>↻</span><h2>旋转，进入战场。</h2><p>横屏可以看清每一条防线。<br>旋转设备后，作战将自动恢复。</p><button id="portrait-home">返回指挥终端</button><small>BORDERLINE / TACTICAL VIEW</small></div><div id="modal-root"></div><div id="toast" role="status" aria-live="polite"></div>`;
  scene=new Battlefield(battle,onCell,updateUI,onEvent);
  game=new Phaser.Game({type:Phaser.AUTO,parent:'battlefield',width:VIEW_W,height:VIEW_H,backgroundColor:'#161e24',scene:[scene],render:{antialias:true,roundPixels:false},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.NO_CENTER},input:{activePointers:2},audio:{noAudio:true}});
  document.querySelectorAll<HTMLButtonElement>('.operator-card').forEach(btn=>btn.onclick=()=>choose(btn.dataset.kind as UnitKind));
  $('#pause').onclick=()=>togglePause();$('#speed').onclick=()=>{if(!battle)return;battle.speed=battle.speed===1?2:1;$('#speed').innerHTML=`${battle.speed}<span>×</span>`;sound.play('click');};
  $('#restart').onclick=()=>confirmRestart();$('#exit').onclick=()=>confirmExit();$('#portrait-home').onclick=()=>home();$('#help').onclick=()=>manual();bindAudio();orientation();
  toast('行动开始 · 先部署先锋建立防线与费用收入',4200);
}
function sync(){if(scene){scene.selectedKind=selectedKind;scene.selectedId=selectedId;scene.pending=pending;scene.direction=direction;}}
function choose(kind:UnitKind){
  if(!battle||battle.status!=='playing')return;
  selectedKind=selectedKind===kind&&!pending?null:kind;selectedId=null;pending=null;$('#direction-picker').hidden=true;sync();renderPanel();sound.play('click');
  if(selectedKind){const reason=battle.availability(kind);if(reason)toast(reason);$('#hint').textContent=`${UNITS[kind].name} · ${UNITS[kind].terrain==='high'?'点击高亮高台':'点击高亮地面'}，然后选择攻击方向`;}else $('#hint').textContent='选择干员或点击已部署单位。';
  updateUI(true);
}
function onCell(cell:Cell){
  if(!battle||battle.status!=='playing')return;
  if(selectedKind){
    if(!battle.canPlace(selectedKind,cell)){toast(terrain(cell.x,cell.y)==='high'?'该格为高台：需要远程干员':'无法部署：请点击高亮的合法格子');sound.play('click');return;}
    pending=cell;direction='right';sync();renderDirection();renderPanel();return;
  }
  const unit=battle.units.find(u=>u.x===cell.x&&u.y===cell.y);selectedId=unit?.id??null;sync();renderPanel();sound.play('click');
}
function renderDirection(){
  if(!pending||!selectedKind)return;
  const p=project(pending.x,pending.y,terrain(pending.x,pending.y)==='high'),picker=$('#direction-picker');
  const canvas=document.querySelector('canvas')!.getBoundingClientRect(),wrap=$('.canvas-wrap').getBoundingClientRect();
  picker.hidden=false;picker.style.left=`${Math.min(wrap.width-90,Math.max(90,canvas.left-wrap.left+p.x/VIEW_W*canvas.width))}px`;picker.style.top=`${Math.min(wrap.height-85,Math.max(70,canvas.top-wrap.top+p.y/VIEW_H*canvas.height))}px`;
  picker.innerHTML=`<div class="direction-label">选择攻击方向</div><div class="compass">${(['up','left','right','down']as Direction[]).map(d=>`<button class="direction ${d} ${d===direction?'active':''}" data-dir="${d}" aria-label="朝${{up:'上',down:'下',left:'左',right:'右'}[d]}">${icon('chevron')}</button>`).join('')}<span class="compass-center">${icon('crosshair')}</span></div><div class="direction-actions"><button id="cancel-deploy" aria-label="取消部署">${icon('close')}</button><button id="confirm-deploy">确认部署 <b>−${UNITS[selectedKind].cost}</b></button></div>`;
  picker.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach(btn=>btn.onclick=()=>{direction=btn.dataset.dir as Direction;sync();renderDirection();sound.play('click');});
  $('#cancel-deploy').onclick=()=>{pending=null;sync();picker.hidden=true;};$('#confirm-deploy').onclick=commitDeploy;
}
function commitDeploy(){
  if(!battle||!pending||!selectedKind)return;
  const reason=battle.availability(selectedKind);if(reason){toast(reason);return;}
  const u=battle.deploy(selectedKind,pending,direction);if(!u){toast('部署位置不可用，请重新选择');return;}
  selectedKind=null;pending=null;selectedId=u.id;$('#direction-picker').hidden=true;$('#hint').textContent='点击已部署干员查看范围、释放技能或撤退。';sync();renderPanel();updateUI(true);
}
function renderPanel(){
  const panel=$('#unit-panel');if(!battle){panel.hidden=true;return;}
  const u=battle.units.find(u=>u.id===selectedId),kind=u?.kind??selectedKind;
  if(!kind){panel.hidden=true;return;}
  const c=UNITS[kind];panel.hidden=!!pending;
  panel.innerHTML=`<div class="panel-heading"><span>${c.role}</span><button id="close-panel" aria-label="关闭干员信息">${icon('close')}</button></div><div class="panel-title"><h2>${c.name}</h2><span>${c.code}</span></div><div class="panel-hp"><span>HP <b id="unit-hp">${Math.ceil(u?.hp??c.hp)}</b> / ${c.hp}</span><span>${c.terrain==='high'?'高台':'地面'} · 阻挡 ${kind==='liberator'&&!u?.active?'0 / 3':c.block}</span></div><div class="panel-hp-track"><i id="unit-hp-fill"></i></div><p class="panel-trait">${c.trait}</p><div class="panel-skill"><span>${icon(kind==='medic'?'medical':'bolt')}<b>${c.skill}</b></span><small id="skill-state">${u?'充能中':'部署后充能'}</small></div><p class="skill-description">${c.description}</p><div class="skill-track"><i id="skill-progress"></i></div><div class="panel-actions">${u?`<button id="skill-button" class="skill-button">${icon('bolt')}<span>技能充能中</span><kbd>F</kbd></button><button id="retreat" class="retreat-button" title="撤退返还 ${Math.floor(c.cost/2)} DP">撤退<small>+${Math.floor(c.cost/2)} DP</small></button>`:`<span class="panel-deploy-note">${c.cost} DP <span>点击高亮格子部署 ${icon('arrow')}</span></span>`}</div>`;
  $('#close-panel').onclick=cancelSelection;
  if(u){$('#skill-button').onclick=activateSkill;$('#retreat').onclick=()=>{battle?.retreat(u.id);cancelSelection();toast(`干员撤退 · 返还 ${Math.floor(c.cost/2)} DP`);};}
  updateUI(true);
}
function cancelSelection(){selectedKind=null;selectedId=null;pending=null;sync();$('#unit-panel').hidden=true;$('#direction-picker').hidden=true;updateUI(true);}
function activateSkill(){if(battle&&selectedId!==null){if(!battle.skill(selectedId))toast('技能尚未就绪');updateUI(true);}}
function updateUI(force:boolean|number=false){
  if(!battle)return;const now=performance.now();if(!force&&now-previousUpdate<90)return;previousUpdate=now;
  $('#lives').textContent=String(battle.lives).padStart(2,'0');$('#kills').textContent=String(battle.killed).padStart(2,'0');$('#wave').textContent=String(battle.wave).padStart(2,'0');$('#dp').textContent=String(battle.dp);$('#timer').textContent=time(battle.elapsed);$('#unit-count').textContent=String(battle.units.length);$('#dp-tick').style.width=`${battle.elapsed%1*100}%`;
  $('#phase-label').textContent=['第一波 / 基础防守','第二波 / 装甲威胁','第三波 / 最终攻势'][battle.wave-1];$('#field-status').textContent=battle.paused?'战术暂停':battle.status==='playing'?'作战进行中':'行动结束';
  for(const kind of UNIT_ORDER){const btn=$<HTMLButtonElement>(`.operator-card[data-kind="${kind}"]`);btn.classList.toggle('unavailable',!!battle.availability(kind));btn.classList.toggle('selected',selectedKind===kind);const status=btn.querySelector<HTMLElement>('.card-status')!;const count=battle.units.filter(u=>u.kind===kind).length;status.textContent=battle.cooldowns[kind]>0?`${Math.ceil(battle.cooldowns[kind])}s`:count?`${count} / 2`:'';status.classList.toggle('cooling',battle.cooldowns[kind]>0);}
  const u=battle.units.find(u=>u.id===selectedId);if(selectedId&&!u){selectedId=null;sync();renderPanel();return;}
  if(u&&$('#unit-hp')){const c=UNITS[u.kind];$('#unit-hp').textContent=String(Math.ceil(u.hp));$('#unit-hp-fill').style.width=`${u.hp/c.hp*100}%`;
    const ready=u.skillCharge>=c.cooldown&&u.kind!=='vanguard'&&!u.active&&!u.empowered;
    $('#skill-state').textContent=u.active>0?`生效中 ${u.active.toFixed(1)}s`:u.empowered?'强化攻击已装填':ready?'技能就绪':u.kind==='liberator'?`蓄力 ${Math.round(u.charge*100)}% · ${Math.ceil(c.cooldown-u.skillCharge)}s`:`${Math.ceil(u.skillCharge)} / ${c.cooldown}s`;
    $('#skill-progress').style.width=`${(u.active?u.active/c.duration:u.skillCharge/c.cooldown)*100}%`;
    const button=$<HTMLButtonElement>('#skill-button');if(button){button.disabled=!ready;button.classList.toggle('ready',ready);button.querySelector('span')!.textContent=u.kind==='vanguard'?'自动补给':u.active?'技能生效中':u.empowered?'等待下一次攻击':ready?'释放技能':'技能充能中';}
  }
}
function onEvent(e:GameEvent){
  if(['deploy','skill','leak','down','heal'].includes(e.type)||e.type==='attack'&&Math.random()<.18)sound.play(e.type);
  if(e.type==='wave'){const banner=$('#wave-banner');banner.hidden=false;banner.innerHTML=`<small>INCOMING / PHASE 0${e.value}</small><strong>${e.value===2?'装甲威胁':'最终攻势'}</strong><span>${e.value===2?'高防御目标接近，准备法术火力。':'双线同时承压，破阵者即将进入战场。'}</span>`;const token=run;window.setTimeout(()=>{if(run===token)banner.hidden=true;},3500);}
  if(e.type==='leak')toast(`防线被突破 · 剩余 ${battle?.lives} 点完整度`,2500);
  if((e.type==='victory'||e.type==='defeat')&&!resultScheduled){resultScheduled=true;const token=run;if(e.type==='victory'&&battle){saved.clears++;saved.bestLives=Math.max(saved.bestLives,battle.lives);saved.bestTime=!saved.bestTime?battle.elapsed:Math.min(saved.bestTime,battle.elapsed);}persist();window.setTimeout(()=>{if(run===token)result();},1350);}
}
let manualPause=false,orientationPause=false;
function isPortrait(){return window.innerWidth<window.innerHeight&&window.innerWidth<700;}
function orientation(){if(!battle)return;orientationPause=isPortrait();battle.paused=manualPause||orientationPause||!!document.querySelector('.modal');}
window.addEventListener('resize',orientation);
function togglePause(){if(!battle||battle.status!=='playing')return;manualPause=!manualPause;battle.paused=manualPause||orientationPause;const overlay=$('#pause-overlay');overlay.hidden=!manualPause;$('#pause').innerHTML=icon(manualPause?'play':'pause');$('#pause').setAttribute('aria-label',manualPause?'继续作战':'暂停作战');if(manualPause){overlay.innerHTML=`<small>TACTICAL HOLD</small><h2>行动暂停</h2><p>你仍可部署干员、查看范围并调整防线。</p><button id="resume">${icon('play')}继续作战</button>`;$('#resume').onclick=()=>togglePause();}sound.play('click');}
function toast(message:string,duration=2400){const el=$('#toast');if(!el)return;window.clearTimeout(toastTimer);el.textContent=message;el.classList.add('visible');toastTimer=window.setTimeout(()=>el.classList.remove('visible'),duration);}
let beforeModalPause=false;let focusBeforeModal:HTMLElement|null=null;
function modal(content:string){
  focusBeforeModal=document.activeElement as HTMLElement;beforeModalPause=!!battle?.paused;if(battle)battle.paused=true;
  $('#modal-root').innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="作战终端对话框"><button class="modal-close icon-button" aria-label="关闭">${icon('close')}</button>${content}</section></div>`;
  $('.modal-close').onclick=closeModal;$('.modal-backdrop').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal();});$('.modal-close').focus();
}
function closeModal(){if(battle)battle.paused=beforeModalPause||orientationPause;$('#modal-root').innerHTML='';focusBeforeModal?.focus();}
function manual(){
  modal(`<span class="eyebrow">FIELD MANUAL / 01</span><h2>指挥官，守住两条防线。</h2><p class="modal-intro">敌人从左侧进入。阻挡他们，并在其抵达右侧终点前歼灭。防线完整度归零，行动失败。</p><div class="manual-grid"><div><b>01 / 部署</b><p>选择底部干员 → 点击高亮格子 → 选择方向 → 确认。近战部署在地面，远程部署在高台。</p></div><div><b>02 / 经济</b><p>初始 10 DP，每秒恢复 1 点。先锋「隼线」每 18 秒额外生产 8 DP。同类最多 2 名，总计最多 8 名。</p></div><div><b>03 / 技能</b><p>点击场上干员查看范围。黄色技能标记代表就绪。蓄势剑士平时不阻挡，必须手动开启爆发。</p></div><div><b>04 / 防线</b><p>重装挡住重甲，术师处理高护甲。医疗选择方向覆盖前线；收割者依靠命中自愈，不能接受医疗。</p></div></div><div class="manual-tip">建议开局：隼线部署在上路中后段，朝左迎敌；随后积攒费用，建立下路防线。可随时暂停部署。</div><div class="manual-keys"><span><kbd>1–8</kbd> 选择干员</span><span><kbd>SPACE</kbd> 暂停</span><span><kbd>F</kbd> 技能</span><span><kbd>ESC</kbd> 取消选择</span></div>`);
}
function records(){modal(`<span class="eyebrow">AFTER ACTION / ARCHIVE</span><h2>每一次坚守，都被记住。</h2><div class="records-grid"><div><strong>${String(saved.attempts).padStart(2,'0')}</strong><span>行动次数</span></div><div><strong>${String(saved.clears).padStart(2,'0')}</strong><span>成功防守</span></div><div><strong>${saved.bestLives?'★'.repeat(saved.bestLives):'—'}</strong><span>最佳防线完整度</span></div><div><strong>${saved.bestTime?time(saved.bestTime):'—'}</strong><span>最快通关</span></div></div><p class="modal-intro">记录保存在当前浏览器中。每次行动使用相同的干员参数与敌人时间表，没有随机养成。</p>`);}
function confirmRestart(){modal(`<span class="eyebrow">RESTART OPERATION</span><h2>重新组织防线？</h2><p class="modal-intro">当前行动将结束，重新获得 10 DP，并从第一波开始。</p><button id="confirm-restart" class="primary-button">重新开始 ${icon('restart')}</button>`);$('#confirm-restart').onclick=()=>{manualPause=false;start();};}
function confirmExit(){modal(`<span class="eyebrow">RETURN TO COMMAND</span><h2>返回指挥终端？</h2><p class="modal-intro">当前行动进度将结束。通关记录和音效设置会保留。</p><button id="confirm-exit" class="primary-button">返回终端 ${icon('back')}</button>`);$('#confirm-exit').onclick=()=>{manualPause=false;home();};}
function result(){
  if(!battle)return;const victory=battle.status==='victory';
  $('#modal-root').innerHTML=`<div class="result-screen ${victory?'victory':'defeat'}"><div class="result-lines"></div><section><span class="eyebrow">OPERATION 01 / AFTER ACTION REPORT</span><div class="result-symbol">${icon(victory?'shield':'close')}</div><small>${victory?'MISSION ACCOMPLISHED':'DEFENSE COMPROMISED'}</small><h1>${victory?'防线，仍在。':'防线失守。'}</h1><p>${victory?'中继站通讯已恢复。你的小队守住了这片边境。':'灰域突破了中继站。重新部署，让每一分费用都成为转机。'}</p><div class="result-stars">${Array.from({length:3},(_,i)=>`<span class="${victory&&i<battle!.lives?'lit':''}">◆</span>`).join('')}</div><div class="result-stats"><span><small>行动用时</small><b>${time(battle.elapsed)}</b></span><span><small>歼灭目标</small><b>${battle.killed}<em> / ${TOTAL_ENEMIES}</em></b></span><span><small>防线完整度</small><b>${battle.lives}<em> / 3</em></b></span></div><div class="result-actions"><button id="retry" class="primary-button">再次挑战 ${icon('restart')}</button><button id="to-home">返回指挥终端 ${icon('arrow')}</button></div></section><footer>BORDERLINE / THE LINE HOLDS AS LONG AS YOU DO.</footer></div>`;
  $('#retry').onclick=()=>{manualPause=false;start();};$('#to-home').onclick=()=>{manualPause=false;home();};$('#retry').focus();
}
document.addEventListener('keydown',e=>{
  const activeModal=document.querySelector('.modal');if(activeModal){if(e.key==='Escape')closeModal();if(e.key==='Tab'){const elements=Array.from(activeModal.querySelectorAll<HTMLElement>('button,a,[tabindex="0"]'));const first=elements[0],last=elements.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}return;}
  if(!battle||battle.status!=='playing')return;
  if(e.code==='Space'){e.preventDefault();togglePause();}else if(/^[1-8]$/.test(e.key))choose(UNIT_ORDER[Number(e.key)-1]);else if(e.key==='Escape')cancelSelection();else if(e.key.toLowerCase()==='f')activateSkill();else if(pending){const d:Record<string,Direction>={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};if(d[e.key]){e.preventDefault();direction=d[e.key];sync();renderDirection();}if(e.key==='Enter')commitDeploy();}
});
// Read-only state is available in development for reproducible browser QA.
if(import.meta.env.DEV)Object.defineProperty(window,'__borderline',{get:()=>({battle,scene,start,project})});
home();
