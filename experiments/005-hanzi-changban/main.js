import {Game,LEVELS,TYPES} from './core.js';
const $=id=>document.getElementById(id),canvas=$('board'),ctx=canvas.getContext('2d'),modal=$('modal');
const nums=['壹','贰','叁','肆','伍','陆'],reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let saved={stars:[0,0,0,0,0,0],sound:false};
try{const p=JSON.parse(localStorage.getItem('changban-v1'));if(p&&Array.isArray(p.stars)){saved.stars=saved.stars.map((_,i)=>Math.max(0,Math.min(3,Number(p.stars[i])||0)));saved.sound=!!p.sound;}}catch{}
let game,level=0,blueprint='bow',selected=null,obstacle=null,speed=1,pointer=null,hover=null,keyCell={x:2,y:2},keyMode=false,toastTimer,audio,selectionKey='',strategyOpen=false,strategyWasPaused=false,landscape=innerWidth>650,W,H;
function persist(){try{localStorage.setItem('changban-v1',JSON.stringify(saved));}catch{toast('浏览器未允许存档，本次仍可完整游玩');}}
const unlocked=i=>i===0||saved.stars[i-1]>0;
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3300);}
function announce(t){$('boardAccess').textContent=t;}
function tone(freq=400){if(!saved.sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq;g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.13);}catch{}}
function event(e){
 if(e.type==='message')toast(e.message);
 if(e.type==='place'){tone(490);$('boardNote').innerHTML='<span>贰</span> 同字同级，拖到一起即可合成';}
 if(e.type==='merge'){tone(780);toast('合字成军！兵种已升至'+e.tower.level+'级');}
 if(e.type==='wave'){tone(210);$('boardNote').style.display='none';announce('第'+e.wave+'波敌军来袭');}
 if(e.type==='waveEnd'){tone(580);toast(e.fragment?'守住了！获得「'+e.fragment+'」字牌和军粮补给':'守住了！军粮补给已送达，可以调整阵容');}
 if(e.type==='leak'){tone(160);announce('阿斗遇险，剩余'+game.lives+'点生命');}
 if(e.type==='skill')tone(660);
 if(e.type==='sacrifice'){tone(880);selected=null;toast('赵云舍身护主：阿斗恢复2命，敌军后退！');}
 if(e.type==='end'){if(e.won){saved.stars[level]=Math.max(saved.stars[level],e.stars);persist();}queueMicrotask(()=>showResult(e));}
}
function loadLevel(i){
 if(!unlocked(i)){toast('先守住前一关，再出发');return;}
 hideModal();level=i;game=new Game(i,event);selected=null;obstacle=null;blueprint='bow';speed=1;pointer=null;
 $('boardNote').style.display='';$('boardNote').innerHTML='<span>壹</span> 先选下方兵种，再点空地布阵';
 $('levelTitle').innerHTML=LEVELS[i].name+' <span>守住阿斗，便是胜局。</span>';$('levelTag').textContent='第'+nums[i]+'章 · '+LEVELS[i].tag;$('chapters').textContent='关卡 '+nums[i];$('chapters').setAttribute('aria-label','选择关卡：'+LEVELS[i].name);
 $('tipText').textContent=['弓兵放在道路的内弯，一次布阵，就能守住前后两段。','别急着合成所有兵种。多一点覆盖，有时比一位强兵更有用。','快马将至，术士的寒霜能为整条防线争取时间。','盾兵能挡住普通箭矢，枪兵却能穿透它的护甲。','障碍下藏有军粮。先清空，再落字，化荒地为阵地。','赵云不只是强兵。危急时「舍将护主」，放弃他换取阿斗生机。'][i];
 hideModal();renderLevels();renderShop();ui(true);announce('第'+(i+1)+'关，'+LEVELS[i].name+'。请选择兵种布阵。');
}
function renderLevels(){
 $('totalStars').textContent=saved.stars.reduce((a,b)=>a+b,0)+' / 18 ★';
 $('levelList').innerHTML=LEVELS.map((l,i)=>'<button class="level-item '+(i===level?'active':'')+'" data-level="'+i+'" '+(unlocked(i)?'':'disabled')+' aria-label="第'+(i+1)+'关 '+l.name+(unlocked(i)?'':' 未解锁')+'" '+(i===level?'aria-current="step"':'')+'><span class="num">'+nums[i]+'</span><span><strong>'+l.name+'</strong><small>'+(saved.stars[i]?'<span class="stars">'+'★'.repeat(saved.stars[i])+'☆'.repeat(3-saved.stars[i])+'</span>':l.tag)+'</small></span><span class="status">'+(unlocked(i)?i===level?'◂':'·':'锁')+'</span></button>').join('');
 $('levelList').querySelectorAll('button').forEach(b=>b.onclick=()=>{const next=+b.dataset.level;if(next===level)return;if(game.wave>0&&!game.over)confirmAction(()=>loadLevel(next),'切换关卡会重新开始本关，已获得的通关星级会保留。','切换关卡');else loadLevel(next);});
}
function renderShop(){
 $('shop').innerHTML=['bow','spear','blade','frost'].map((k,i)=>{const t=TYPES[k];return '<button class="unit-card '+(blueprint===k?'selected':'')+'" data-type="'+k+'" aria-pressed="'+(blueprint===k)+'" style="--unit-color:'+t.color+'" aria-label="'+t.name+'，'+t.cost+'军粮，快捷键'+(i+1)+'"><span class="unit-glyph">'+t.glyph+'</span><span><b>'+t.name+'</b><small>'+['远程 · 点射','穿甲 · 强攻','近战 · 群伤','寒霜 · 减速'][i]+'</small><span class="price">◈ '+t.cost+'</span></span></button>';}).join('');
 $('shop').insertAdjacentHTML('beforeend','<button id="inspect" class="inspect-btn" aria-label="打开军师：升级、撤回与召将">军师</button>');
 $('shop').querySelectorAll('button[data-type]').forEach(b=>b.onclick=()=>choose(b.dataset.type));$('inspect').onclick=showStrategy;
}
function choose(type){if(game.over)return;blueprint=type;selected=null;obstacle=null;renderShop();ui(true);toast(type==='hero'?'选择空地，让赵云出阵':'已选'+TYPES[type].name+'，点击草地布阵');}
function selectionHTML(){
 const t=game.towers.find(t=>t.id===selected);
 if(t){const d=TYPES[t.type],cost=game.upgradeCost(t);return '<div class="selected-heading"><span class="selected-icon" style="color:'+d.color+'">'+d.glyph+'</span><div><h3>'+d.name+'</h3><small>'+'◆'.repeat(t.level)+'◇'.repeat(4-t.level)+' · '+t.level+'级</small></div></div><p>'+d.desc+'</p><div class="stats"><span>伤害<b>'+Math.round(d.damage*1.85**(t.level-1))+'</b></span><span>射程<b>'+(d.range+(t.level-1)*.15).toFixed(1)+'</b></span><span>间隔<b>'+d.rate+'秒</b></span></div><div class="selection-actions"><button id="upgrade" '+(t.level>=4||game.gold<cost||game.over?'disabled':'')+'>'+(t.level>=4?'已至四级':'升级 ◈'+cost)+'</button><button class="sell" id="sell" '+(game.over||t.type==='hero'&&!game.active?'disabled':'')+'>'+(t.type==='hero'?'舍将护主':'撤回 +'+Math.floor(t.spent*7/10))+'</button></div><p>'+(t.type==='hero'?'舍去赵云，恢复2命，击退全场敌军。每次召唤仅可用一次。':'点击空格可移动；拖到同字同级兵种上合成。')+'</p>';}
 if(obstacle)return '<div class="selected-heading"><span class="selected-icon">木</span><div><h3>荒野障碍</h3><small>清理后可以布阵</small></div></div><p>一丛挡路的灌木，下面似乎藏着行军留下的补给。</p><div class="selection-actions"><button id="clearObstacle" '+(game.gold<20||game.over?'disabled':'')+'>清理 ◈20 · 获得35军粮</button></div>';
 if(blueprint){const d=TYPES[blueprint];return '<div class="selected-heading"><span class="selected-icon" style="color:'+d.color+'">'+d.glyph+'</span><div><h3>'+d.name+'</h3><small>'+(blueprint==='hero'?'龙胆在手，长坂可守':'待命 · 点击草地布阵')+'</small></div></div><p>'+d.desc+'</p><div class="stats"><span>伤害<b>'+d.damage+'</b></span><span>射程<b>'+d.range+'格</b></span><span>军粮<b>'+(blueprint==='hero'?'赵＋云':d.cost)+'</b></span></div>';}
 return '<div class="empty-selection"><div class="empty-symbol">阵</div><strong>落一字，守一方</strong><p>选择下方兵种布阵，<br>也可以点选已有兵种查看详情。</p></div>';
}
function ui(force=false){
 if(!game)return;
 if($('inspect')){$('inspect').textContent=selected?'兵策':obstacle?'清障':'军师';$('inspect').classList.toggle('has-selection',!!selected||!!obstacle);}
 $('gold').textContent=game.gold;$('lives').textContent=game.lives;
 $('waveText').textContent=game.wave===0?'布阵阶段':'第 '+game.wave+' / '+game.level.waves+' 波'+(game.active?' · 敌军来袭':' · 已守住');
 $('waveDots').innerHTML=Array.from({length:game.level.waves},(_,i)=>'<i class="'+(i<game.wave-1||i===game.wave-1&&!game.active?'done':i===game.wave-1?'now':'')+'"></i>').join('');
 $('wave').disabled=game.active||game.over||game.paused;
 $('wave').innerHTML=game.over?'战役结束':game.active?'剩余 '+(game.enemies.length+game.queue.length)+' 敌军':'开始第 '+(game.wave+1)+' 波 <span>→</span>';
 $('pause').textContent=game.paused?'▶':'Ⅱ';$('pause').disabled=game.over;$('pause').setAttribute('aria-label',game.paused?'继续游戏':'暂停游戏');$('speed').textContent=speed+'×';
 $('skill').disabled=game.skillCD>0||!game.active||game.paused||game.over;$('skillLabel').textContent=game.skillCD>0?Math.ceil(game.skillCD)+'秒后可用':'全场伤害 · 冻缓敌军';$('skill').querySelector('span').textContent=game.skillCD>0?Math.ceil(game.skillCD):'霜';$('skill').setAttribute('aria-label','寒霜令：'+$('skillLabel').textContent);
 for(const key of ['zhao','yun']){$(key).classList.toggle('collected',game.fragments[key]>0);$(key).querySelector('small').textContent=game.fragments[key]?'已获得 ×'+game.fragments[key]:key==='zhao'?'第2波获得':'第4波获得';}
 const ready=game.fragments.zhao>0&&game.fragments.yun>0;$('summon').disabled=!ready||game.over;$('summon').textContent=ready?'二字成将 · 召唤赵云':'集齐字牌后召唤';
 $('sound').textContent=saved.sound?'♫':'♪';$('sound').setAttribute('aria-label',saved.sound?'关闭音效':'开启音效');$('sound').title=saved.sound?'关闭音效':'开启音效';
 const key=[selected,obstacle?.x,obstacle?.y,blueprint,game.gold,game.over,game.active,game.towers.find(t=>t.id===selected)?.level].join('/');
 if(force||key!==selectionKey){selectionKey=key;const activeId=document.activeElement?.id;$('selection').innerHTML=selectionHTML();
 if($('upgrade'))$('upgrade').onclick=()=>{game.upgrade(selected);ui(true);};
 if($('sell'))$('sell').onclick=()=>{const t=game.towers.find(t=>t.id===selected);if(t?.type==='hero'){hideModal();confirmAction(()=>{game.sacrifice(selected);selected=null;ui(true);},'赵云将离开战场，换来阿斗恢复2命、敌军后退与全场伤害。','舍将护主');}else{game.sell(selected);selected=null;ui(true);hideModal();ui();}};
 if($('clearObstacle'))$('clearObstacle').onclick=()=>{game.clear(obstacle.x,obstacle.y);obstacle=null;ui(true);hideModal();ui();toast('补给已找到！净获得15军粮');};
 if(['upgrade','sell','clearObstacle'].includes(activeId)&&$(activeId))$(activeId).focus({preventScroll:true});}
}
function restoreStrategy(){
 if(!strategyOpen)return;
 document.querySelector('.shell').appendChild($('strategyPanel'));strategyOpen=false;modal.classList.remove('strategy-view');if(game)game.paused=strategyWasPaused;
}
function hideModal(){restoreStrategy();if(modal.open)modal.close();}
function showStrategy(){
 if(landscape)return;
 strategyWasPaused=game.paused;game.paused=true;ui(true);
 openModal('<div class="drawer-heading"><h2>军师手札</h2><button id="closeStrategy">返回战场</button></div><div id="strategyMount"></div>');
 strategyOpen=true;modal.classList.add('strategy-view');$('strategyMount').appendChild($('strategyPanel'));
 $('closeStrategy').onclick=()=>{hideModal();ui();};modal.oncancel=()=>{restoreStrategy();ui();};
}
function showChapters(){
 const paused=game.paused;game.paused=true;ui();
 openModal('<div class="modal-tag">长坂行记 · '+saved.stars.reduce((a,b)=>a+b,0)+' / 18 ★</div><h2>选择关卡</h2><div class="chapter-choices">'+LEVELS.map((l,i)=>'<button data-chapter="'+i+'" '+(unlocked(i)?'':'disabled')+'>'+nums[i]+' · '+l.name+' <span>'+(saved.stars[i]?'★'.repeat(saved.stars[i]):unlocked(i)?'可挑战':'未解锁')+'</span></button>').join('')+'</div><div class="modal-actions"><button id="closeChapters">返回战场</button><button id="restartChapter">重整旗鼓</button></div><a class="gallery-link" href="../../">← 返回陈列馆</a>');
 const close=()=>{hideModal();game.paused=paused;ui();};
 $('closeChapters').onclick=close;modal.oncancel=()=>{game.paused=paused;ui();};
 $('restartChapter').onclick=()=>{close();$('restart').click();};
 modal.querySelectorAll('[data-chapter]').forEach(b=>b.onclick=()=>{const next=+b.dataset.chapter;close();if(next===level)return;if(game.wave>0&&!game.over)confirmAction(()=>loadLevel(next),'切换关卡会重新开始本关，通关星级会保留。','切换关卡');else loadLevel(next);});
}
modal.addEventListener('close',()=>{restoreStrategy();ui();});
function openModal(html){$('modalBody').innerHTML=html;if(!modal.open)modal.showModal();}
function confirmAction(action,text,title='重整旗鼓'){
 const paused=game.paused;game.paused=true;ui();
 openModal('<div class="modal-tag">军师有言</div><h2>'+title+'</h2><p>'+text+'</p><div class="modal-actions"><button id="cancelModal">继续守城</button><button class="primary" id="confirmModal">'+title+'</button></div>');
 $('cancelModal').onclick=()=>{game.paused=paused;hideModal();ui();};$('confirmModal').onclick=()=>{game.paused=paused;hideModal();action();};modal.oncancel=()=>{game.paused=paused;ui();};
}
function showHelp(){
 const paused=game.paused;game.paused=true;ui();
 openModal('<div class="modal-tag">一字一兵 · 一笔一城</div><h2>如何守住长坂</h2><ol><li>选兵种，再点草地布阵；道路不能放兵。</li><li>拖动同字同级兵种合成，最高四级。点选守军后，手机点「军师」升级或撤回；也可移动。</li><li>击败敌军获得军粮，清理灌木花20、得35。</li><li>点击「开始下一波」迎敌。寒霜令有24秒冷却。</li><li>第2、4波获得「赵」「云」，凑齐可在空地召将。危急时可舍将护主。</li><li>10命通关获三星，6—9命两星，其余一星；通关解锁下一关。</li></ol><p>键盘：1–4 选兵，方向键选格，Enter 落子，Q 寒霜，P 暂停，Esc 取消选择。后台自动暂停。</p><div class="modal-actions"><button id="closeHelp" class="primary">明白了 · 落字成军</button></div>');
 $('closeHelp').onclick=()=>{game.paused=paused;hideModal();ui();};modal.oncancel=()=>{game.paused=paused;ui();};
}
function showResult(r){
 renderLevels();const next=level+1;
 openModal('<div class="modal-tag">第'+nums[level]+'章 · '+game.level.name+'</div><div class="modal-seal">'+(r.won?'守':'憾')+'</div><h2>'+(r.won?'此城，守住了。':'胜负未定，再起一阵。')+'</h2><div class="modal-stars">'+(r.won?'★'.repeat(r.stars)+'☆'.repeat(3-r.stars):'☆☆☆')+'</div><p>'+(r.won?next===6?'六章已毕，长坂无恙。你已守住整卷山河。':'阿斗安然无恙，下一段山河正等你落笔。':'试试在弯道增加弓兵，用术士减速，记得及时合成升级。')+'</p><div class="result-summary"><span>击退 <b>'+game.kills+'</b> 敌军</span><span>余命 <b>'+game.lives+'</b> / 10</span><span>'+game.wave+' / '+game.level.waves+' 波</span></div><div class="modal-actions"><button id="retry">再守一次</button><button id="nextLevel" class="primary">'+(r.won&&next<6?'出发 · 下一关':'返回战场')+'</button></div>');
 $('retry').onclick=()=>loadLevel(level);$('nextLevel').onclick=()=>{if(r.won&&next<6)loadLevel(next);else hideModal();};modal.oncancel=null;
}
const point=(x,y)=>landscape?{x:(y+.5)*64,y:(x+.5)*64}:{x:(x+.5)*64,y:(y+.5)*64};
function cell(e){const r=canvas.getBoundingClientRect(),sx=(e.clientX-r.left)*W/r.width,sy=(e.clientY-r.top)*H/r.height;return landscape?{x:Math.floor(sy/64),y:Math.floor(sx/64)}:{x:Math.floor(sx/64),y:Math.floor(sy/64)};}
function act(c){
 if(game.paused||game.over||modal.open)return;keyCell=c;const t=game.towerAt(c.x,c.y),o=game.obstacleAt(c.x,c.y);
 if(t){if(selected&&selected!==t.id){const moved=game.move(selected,c.x,c.y);selected=moved?moved.id:t.id;}else selected=selected===t.id?null:t.id;blueprint=null;obstacle=null;}
 else if(o){obstacle=o;selected=null;blueprint=null;}
 else if(selected){const moved=game.move(selected,c.x,c.y);if(moved)selected=moved.id;}
 else if(blueprint){const t=game.place(blueprint,c.x,c.y);if(t&&blueprint==='hero'){blueprint=null;selected=t.id;}if(t)announce(TYPES[t.type].name+'已布阵，剩余'+game.gold+'军粮');}
 else toast('先选下方兵种，再点空地布阵');renderShop();ui(true);
}
canvas.addEventListener('pointerdown',e=>{if(modal.open||game.paused||game.over)return;keyMode=false;const c=cell(e);pointer={clientX:e.clientX,clientY:e.clientY,tower:game.towerAt(c.x,c.y)?.id,drag:false};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{hover=cell(e);if(pointer?.tower&&Math.hypot(e.clientX-pointer.clientX,e.clientY-pointer.clientY)>9){pointer.drag=true;selected=pointer.tower;blueprint=null;obstacle=null;document.body.classList.add('dragging');}});
canvas.addEventListener('pointerup',e=>{if(!pointer)return;const c=cell(e);if(pointer.drag){const moved=game.move(pointer.tower,c.x,c.y);if(moved)selected=moved.id;renderShop();ui(true);}else act(c);pointer=null;document.body.classList.remove('dragging');});
canvas.addEventListener('pointercancel',()=>{pointer=null;document.body.classList.remove('dragging');});canvas.addEventListener('pointerleave',()=>{hover=null;});
function pause(){if(game.over||modal.open)return;game.paused=!game.paused;ui();announce(game.paused?'游戏已暂停':'继续守城');}
addEventListener('keydown',e=>{
 if(modal.open||['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;
 if(e.key.toLowerCase()==='q'){game.skill();ui();return;}if(e.key.toLowerCase()==='p'){pause();return;}
 if(e.key==='Escape'){selected=null;blueprint=null;obstacle=null;renderShop();ui(true);return;}
 if('1234'.includes(e.key)&&e.key.length===1){choose(['bow','spear','blade','frost'][+e.key-1]);return;}
 if(document.activeElement!==canvas)return;
 if(e.key.startsWith('Arrow')){e.preventDefault();keyMode=true;if(e.key==='ArrowLeft')landscape?keyCell.y--:keyCell.x--;if(e.key==='ArrowRight')landscape?keyCell.y++:keyCell.x++;if(e.key==='ArrowUp')landscape?keyCell.x--:keyCell.y--;if(e.key==='ArrowDown')landscape?keyCell.x++:keyCell.y++;keyCell.x=Math.max(0,Math.min(5,keyCell.x));keyCell.y=Math.max(0,Math.min(8,keyCell.y));const t=game.towerAt(keyCell.x,keyCell.y);announce('第'+(keyCell.x+1)+'列，第'+(keyCell.y+1)+'行，'+(t?TYPES[t.type].name:game.isPath(keyCell.x,keyCell.y)?'道路':game.obstacleAt(keyCell.x,keyCell.y)?'障碍':'空地'));}
 if(e.key==='Enter'||e.key===' '){e.preventDefault();act(keyCell);}
});
$('wave').onclick=()=>{if(!game.towers.length){toast('先布置至少一名守军，再迎战');return;}game.startWave();ui();};
$('pause').onclick=pause;$('speed').onclick=()=>{speed=speed===1?2:1;ui();};$('skill').onclick=()=>{game.skill();ui();};$('summon').onclick=()=>{hideModal();choose('hero');};$('chapters').onclick=showChapters;$('help').onclick=showHelp;$('sound').onclick=()=>{saved.sound=!saved.sound;persist();tone(500);ui();};$('restart').onclick=()=>confirmAction(()=>loadLevel(level),'本关军粮、兵种和波次将重新开始，通关记录会保留。');
addEventListener('visibilitychange',()=>{if(document.hidden&&game&&!game.over){game.paused=true;ui();}});
function resize(){if(innerWidth>650&&strategyOpen)hideModal();document.documentElement.style.setProperty('--viewport-height',(window.visualViewport?.height||innerHeight)+'px');landscape=innerWidth>650;W=landscape?576:384;H=landscape?384:576;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.aspectRatio=W+' / '+H;ctx.setTransform(dpr,0,0,dpr,0,0);fitCanvas();}
function fitCanvas(){
 if(landscape){canvas.style.width='';canvas.style.height='';return;}
 const wrap=document.querySelector('.board-wrap');
 const width=Math.floor(Math.min(wrap.clientWidth,wrap.clientHeight*W/H));
 canvas.style.width=width+'px';canvas.style.height=width*H/W+'px';
}
addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);
new ResizeObserver(fitCanvas).observe(document.querySelector('.board-wrap'));
function rect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
function text(s,x,y,size,color,sans=false){ctx.fillStyle=color;ctx.font=(sans?'':'600 ')+size+'px '+(sans?'system-ui':'"Songti SC",STSong,serif');ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,x,y);}
function grass(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.strokeStyle='#96a77a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-6,4);ctx.lineTo(-3,-3);ctx.moveTo(0,5);ctx.lineTo(2,-5);ctx.moveTo(4,5);ctx.lineTo(7,0);ctx.stroke();ctx.restore();}
function draw(){
 if(!game)return;ctx.clearRect(0,0,W,H);ctx.fillStyle='#e5ebd4';ctx.fillRect(0,0,W,H);
 for(let y=0;y<9;y++)for(let x=0;x<6;x++){const p=point(x,y);ctx.fillStyle=(x+y)%2?'#e3e9d2':'#e8edd9';ctx.fillRect(p.x-32,p.y-32,64,64);if(!game.isPath(x,y)&&!game.towerAt(x,y)&&!game.obstacleAt(x,y)){const seed=(x*43+y*29)%17;if(seed<8)grass(p.x-16+seed*2,p.y+15,seed%2?.8:1.15);if(seed>10){ctx.fillStyle='#d9dfc5';ctx.beginPath();ctx.ellipse(p.x+14,p.y-13,5,2.7,0,0,7);ctx.fill();}}}
 const path=game.level.path;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();path.forEach(([x,y],i)=>{const p=point(x,y);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.lineWidth=45;ctx.strokeStyle='#cbd0ad';ctx.stroke();ctx.lineWidth=38;ctx.strokeStyle='#e0d6b5';ctx.stroke();ctx.lineWidth=29;ctx.strokeStyle='#e9dfc2';ctx.stroke();ctx.lineWidth=1;
 for(let i=0;i<path.length;i+=2){const p=point(...path[i]);ctx.fillStyle='#c8bc9648';ctx.beginPath();ctx.ellipse(p.x+((i*7)%13)-6,p.y+((i*3)%11)-5,3,1.4,-.5,0,7);ctx.fill();}
 for(const o of game.obstacles){const p=point(o.x,o.y);ctx.fillStyle='#c5cfaf';ctx.beginPath();ctx.ellipse(p.x,p.y+13,23,8,0,0,7);ctx.fill();ctx.fillStyle='#9eb78b';for(const [a,b,r]of [[-12,1,12],[0,-9,16],[12,0,12]]){ctx.beginPath();ctx.arc(p.x+a,p.y+b,r,0,7);ctx.fill();}ctx.fillStyle='#b2c49b';ctx.beginPath();ctx.arc(p.x-5,p.y-12,9,0,7);ctx.fill();ctx.strokeStyle='#839f73';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y+17);ctx.lineTo(p.x,p.y-2);ctx.stroke();ctx.lineWidth=1;if(obstacle?.x===o.x&&obstacle?.y===o.y)rect(p.x-28,p.y-28,56,56,8,null,'#8d734d');}
 const start=point(...path[0]),end=point(...path.at(-1));rect(start.x-17,start.y-17,34,34,7,'#d0b99a');text('敌',start.x,start.y,20,'#9a755a');
 ctx.fillStyle='#8ba07c';ctx.beginPath();ctx.moveTo(end.x-24,end.y-10);ctx.lineTo(end.x,end.y-27);ctx.lineTo(end.x+24,end.y-10);ctx.closePath();ctx.fill();rect(end.x-20,end.y-10,40,34,3,'#f6f1da','#b7b895');text('斗',end.x,end.y+5,27,game.lives<=3?'#b3624b':'#5e7453');ctx.fillStyle='#c6a17b';ctx.fillRect(end.x-23,end.y-12,46,4);for(let i=0;i<3;i++)text('♥',end.x-12+i*12,end.y-33,10,i<Math.ceil(game.lives/3.34)?'#be815f':'#b7c1a1',true);
 const focus=game.towers.find(t=>t.id===selected);
 if(focus){const p=point(focus.x,focus.y),r=(TYPES[focus.type].range+(focus.level-1)*.15)*64;ctx.fillStyle='#688c6618';ctx.strokeStyle='#6c8b5e60';ctx.beginPath();ctx.arc(p.x,p.y,r,0,7);ctx.fill();ctx.setLineDash([4,5]);ctx.stroke();ctx.setLineDash([]);}
 if(hover&&game.valid(hover.x,hover.y)&&blueprint&&!game.towerAt(hover.x,hover.y)&&!game.obstacleAt(hover.x,hover.y)){const p=point(hover.x,hover.y);rect(p.x-27,p.y-27,54,54,6,'#75956d22','#7f9d6f');text(TYPES[blueprint].glyph,p.x,p.y,29,'#69895a88');}
 for(const t of game.towers){const p=point(t.x,t.y),d=TYPES[t.type];ctx.fillStyle='#a8b59860';ctx.beginPath();ctx.ellipse(p.x,p.y+22,23,7,0,0,7);ctx.fill();rect(p.x-23,p.y-26,46,49,6,t.type==='hero'?'#f7edd0':'#f9f6e7',t.id===selected?'#678558':t.type==='hero'?'#ba995d':'#c7cfb6');rect(p.x-19,p.y-22,38,39,4,null,t.type==='hero'?'#dbbf80':'#e4e7d6');text(d.glyph,p.x,p.y-3,31,d.color);for(let i=0;i<t.level;i++){ctx.fillStyle=t.type==='hero'?'#bd9946':'#839b70';ctx.beginPath();ctx.arc(p.x-(t.level-1)*4+i*8,p.y+18,2,0,7);ctx.fill();}if(t.type==='hero')text('赵',p.x-16,p.y-19,8,'#b18b40');}
 for(const e of game.enemies){const p=point(e.x,e.y),boss=e.kind==='boss',r=boss?22:15;ctx.save();ctx.translate(p.x,p.y);if(!reduced)ctx.rotate(Math.sin(game.clock*10+e.id)*.045);ctx.fillStyle='#a08d6940';ctx.beginPath();ctx.ellipse(0,r-1,r*.9,5,0,0,7);ctx.fill();rect(-r,-r,r*2,r*2,5,e.slow>0?'#c3d7d9':boss?'#805548':e.kind==='shield'?'#b2a58a':'#cbb291',boss?'#684335':'#a48b67');text(boss?'将':e.kind==='runner'?'骑':e.kind==='shield'?'盾':'贼',0,0,boss?27:21,boss?'#f6e7ce':'#785b43');ctx.restore();const bw=boss?45:30;rect(p.x-bw/2,p.y-r-7,bw,3,1,'#aca98b');rect(p.x-bw/2,p.y-r-7,bw*Math.max(0,e.hp/e.maxHP),3,1,e.slow>0?'#779eaa':'#ae7759');}
 for(const f of game.effects){const p=point(f.x,f.y);ctx.save();ctx.globalAlpha=f.ttl/f.max;if(f.type==='shot'||f.type==='slash'){const q=point(f.tx,f.ty);ctx.strokeStyle=f.color;ctx.lineWidth=f.type==='slash'?9:2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();if(f.type==='slash'){ctx.beginPath();ctx.arc(q.x,q.y,55,0,7);ctx.stroke();}}if(f.type==='coin')text('+粮',p.x,p.y-20-(1-f.ttl/f.max)*22,12,'#9a803f',true);if(f.type==='storm'){ctx.fillStyle='#b5d6e64a';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#7da3b8';ctx.lineWidth=2;for(let j=0;j<18;j++){const x=(j*79+game.clock*50)%W,y=(j*53+game.clock*90)%H;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-10,y+25);ctx.stroke();}}if(f.type==='hit'){ctx.strokeStyle='#b86847';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,30+(1-f.ttl/f.max)*25,0,7);ctx.stroke();}ctx.restore();}
 if(keyMode){const p=point(keyCell.x,keyCell.y);ctx.lineWidth=3;rect(p.x-29,p.y-29,58,58,3,null,'#b77946');ctx.lineWidth=1;}
 if(pointer?.drag&&hover){const t=game.towers.find(t=>t.id===pointer.tower);if(t){const p=point(hover.x,hover.y);ctx.save();ctx.globalAlpha=.7;rect(p.x-23,p.y-25,46,50,6,'#fff9df','#6f8962');text(TYPES[t.type].glyph,p.x,p.y,31,TYPES[t.type].color);ctx.restore();}}
 if(game.paused&&!modal.open){ctx.fillStyle='#e7ecd4c9';ctx.fillRect(0,0,W,H);text('暂歇片刻',W/2,H/2-13,31,'#486449');text('点击继续按钮，重回长坂',W/2,H/2+24,12,'#829775',true);}
}
let last=performance.now(),lastUI=0;
function frame(now){const dt=Math.min((now-last)/1000,.06);last=now;if(game){game.update(dt*speed);if(now-lastUI>160){ui();lastUI=now;}draw();}requestAnimationFrame(frame);}
window.Changban=Object.freeze({snapshot:()=>({level,wave:game.wave,waves:game.level.waves,gold:game.gold,lives:game.lives,active:game.active,paused:game.paused,over:game.over,stars:[...saved.stars],result:game.result?{...game.result}:null,fragments:{...game.fragments},towers:game.towers.map(t=>({...t})),enemies:game.enemies.map(e=>({x:e.x,y:e.y,hp:e.hp,kind:e.kind})),obstacles:game.obstacles.map(o=>({...o})),speed,blueprint,selected})});
resize();loadLevel(0);requestAnimationFrame(frame);
