/* 22 editable teaching infographics, with original scene backgrounds and SVGs. */
const fs=require('fs'),path=require('path'),pptxgen=require('pptxgenjs'),JSZip=require('jszip'),sharp=require('sharp');
const root=path.join(__dirname,'..'),assets=path.join(root,'assets');
const manifest=require('./illustrations.cjs').generate(root),lesson=require('./lesson.json');
const C={ink:'36369B',blue:'3975D7',purple:'7655CE',orange:'F39A45',bg:'F8F8FC',text:'292A3A',muted:'62647B',line:'CCD0E7',light:'EEEDF9',white:'FFFFFF',paleBlue:'EDF3FC',paleOrange:'FFF2E5'};
const FONT='Noto Sans CJK SC',W=13.333333,H=7.5;
const p=new pptxgen();p.layout='LAYOUT_WIDE';p.author='Pocket Creative Lab';p.title='大脑“记忆”工厂 · 场景插画版';p.subject='40分钟初中心理健康课';p.lang='zh-CN';p.theme={headFontFace:FONT,bodyFontFace:FONT,lang:'zh-CN'};const S=p.ShapeType;
let slideNo=0,audit=[],artAudit=[];
function box(s,x,y,w,h,fill=C.white,stroke=fill,r=.12,extra={}){s.addShape(r?S.roundRect:S.rect,{x,y,w,h,radius:r,rectRadius:r,fill:{color:fill},line:{color:stroke,width:stroke===fill?0:1},...extra});}
function txt(s,t,x,y,w,h,size=20,color=C.text,bold=false,extra={}){s.addText(t,{x,y,w,h,fontFace:FONT,fontSize:size,color,bold,margin:0,valign:'mid',fit:'resize',paraSpaceAfterPt:0,...extra});audit.push({slide:slideNo,text:t,x,y,w,h,size});}
function line(s,x,y,X,Y,color=C.ink,width=2,arrow=false,dash=false){s.addShape(S.line,{x:Math.min(x,X),y:Math.min(y,Y),w:Math.abs(X-x),h:Math.abs(Y-y),flipH:X<x,flipV:Y<y,line:{color,width,beginArrowType:'none',endArrowType:arrow?'triangle':'none',...(dash?{dashType:'dash'}:{})}});}
function dot(s,x,y,r,color){s.addShape(S.ellipse,{x:x-r,y:y-r,w:r*2,h:r*2,fill:{color},line:{color,width:0}});}
function pill(s,t,x,y,w,color=C.ink,fill=C.light,size=18){box(s,x,y,w,.43,fill);txt(s,t,x+.08,y+.01,w-.16,.4,size,color,true,{align:'center'});}
const icache={};function icon(s,name,x,y,size=.55,color=C.ink){const k=name+'-'+color;if(!icache[k]){const file=path.join(assets,'icons',k+'.svg');fs.writeFileSync(file,fs.readFileSync(require.resolve('lucide-static/icons/'+name+'.svg'),'utf8').replace(/currentColor/g,'#'+color));icache[k]=file;}s.addImage({path:icache[k],x,y,w:size,h:size,objectName:'知识图标：'+name});}
function art(s,name,x,y,w,h){const meta=manifest.scenes.find(a=>a.name===name);if(name!=='packing'){const ratio=meta.width/meta.height;if(w/h>ratio){const nw=h*ratio;x+=(w-nw)/2;w=nw;}else{const nh=w/ratio;y+=(h-nh)/2;h=nh;}}s.addImage({path:path.join(assets,'scenes',name+'.svg'),x,y,w,h,objectName:'场景插画：'+name,altText:'用于解释记忆与学习的原创扁平矢量场景：'+name});artAudit.push({slide:slideNo,name,x,y,w,h});}
function base(title,sub,section='探索记忆'){
 slideNo++;let s=p.addSlide();s.background={color:C.bg};s.addImage({path:path.join(assets,'backgrounds',`background-${String(slideNo).padStart(2,'0')}.svg`),x:0,y:0,w:W,h:H,objectName:'主题背景插画：'+manifest.backgrounds[slideNo-1].theme});
 txt(s,section+' / MEMORY LAB',.56,.27,10,.28,11,C.ink,true,{charSpacing:1});txt(s,title,.55,.74,12.1,.65,32,C.ink,true);txt(s,sub,.58,1.47,12.1,.4,18,C.muted);
 line(s,.56,7.08,12.77,7.08,C.line,.8);txt(s,'大脑“记忆”工厂 · 场景插画版',.56,7.15,8,.2,10,C.muted);txt(s,String(slideNo).padStart(2,'0')+' / 22',11.38,7.13,1.37,.25,11,C.ink,true,{align:'right'});
 const meta=lesson.slides[slideNo-1],sec=meta.durationSeconds;s.addNotes(`【建议用时】${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}\n${meta.notes}`);return s;
}
function conclusion(s,t,y=6.48){box(s,.58,y,12.17,.55,C.white);txt(s,t,.8,y+.035,11.73,.46,21,C.ink,true,{align:'center'});}
function flow(s,labels,x,y,w,h=.65,color=C.ink){const gap=.26,n=labels.length,u=(w-gap*(n-1))/n;labels.forEach((t,i)=>{box(s,x+i*(u+gap),y,u,h,C.white);txt(s,t,x+i*(u+gap)+.06,y+.06,u-.12,h-.12,18,color,true,{align:'center'});if(i<n-1)line(s,x+i*(u+gap)+u+.035,y+h/2,x+(i+1)*(u+gap)-.035,y+h/2,color,1.6,true);});}
function takeaway(s,ic,title,desc,x,y,w=3.6){box(s,x,y,w,1.1,C.white);icon(s,ic,x+.18,y+.22,.5,C.blue);txt(s,title,x+.92,y+.16,w-1.1,.44,23,C.ink,true);txt(s,desc,x+.22,y+.72,w-.44,.3,17,C.muted);}
// 01 / Connected cover, populated by working students and meaningful objects.
{
 const s=base('大脑“记忆”工厂','你的记忆，真的靠谱吗？','初中心理健康 / 40分钟');
 art(s,'hub',1.07,1.94,11.15,4.33);
 [['看见',.72,2.12],['听见',.66,3.75],['学过',2.4,5.68],['做过',10.82,2.1],['声音',11.1,3.85],['经历',10.26,5.65]].forEach(([t,x,y])=>pill(s,t,x,y,1.17,C.ink,C.white));
 pill(s,'接收 · 筛选 · 加工 · 保存',4.5,5.75,4.45,C.ink,C.white,20);flow(s,['信息进入','注意筛选','暂时保存','理解加工','长期留下'],.76,6.41,11.82,.56);
}
// 02 / Two linked life scenes instead of isolated icons.
{
 const s=base('我到底锁门了吗？','熟悉的动作，为什么会留下模糊的记忆？');
 art(s,'stairs',.58,2.12,5.2,4.34);art(s,'door',9.08,2.35,3.55,3.34);
 box(s,5.48,2.62,3.5,1.47,C.white);txt(s,'“我刚刚……\n到底锁没锁？”',5.69,2.88,3.08,.98,25,C.ink,true,{align:'center'});icon(s,'circle-help',6.87,2.05,.6,C.orange);
 line(s,4.83,4.05,5.41,3.48,C.blue,2,true);line(s,9.01,3.45,9.35,3.45,C.ink,2,true);
 pill(s,'现实：动作是否发生？',5.5,4.55,3.49,C.blue,C.white,18);pill(s,'脑中：我感觉发生过',5.5,5.18,3.49,C.ink,C.white,18);
 conclusion(s,'感觉记得很清楚，就一定是真的吗？');
}
// 03 / A performance recalled through two viewpoints.
{
 const s=base('同一段童年，两种版本','情境讨论：第一次在亲友面前表演');
 pill(s,'我的童年记忆',.8,2.07,4.95,C.blue,C.white,22);pill(s,'爸妈告诉我的版本',7.55,2.07,4.95,C.ink,C.white,22);
 art(s,'memory-a',.73,2.72,5.13,2.95);art(s,'memory-b',7.48,2.72,5.13,2.95);
 txt(s,'≠',6.12,3.47,1.1,.9,56,C.orange,true,{align:'center'});
 box(s,.88,5.58,4.83,.61,C.white);txt(s,'“我忘词了，大家都在笑我。”',1.03,5.66,4.52,.44,20,C.ink,true,{align:'center'});
 box(s,7.65,5.58,4.83,.61,C.white);txt(s,'“你唱完后，大家都鼓掌了。”',7.8,5.66,4.52,.44,20,C.ink,true,{align:'center'});
 conclusion(s,'回忆可能带着感受和解释。大脑真的像录像机吗？');
}
// 04 / A processing floor, with an editable conceptual comparison.
{
 const s=base('大脑不是录像机','它更像一座“信息加工厂”。');
 box(s,.74,2.1,3.07,1.04,C.white);icon(s,'video',.96,2.31,.59,C.blue);txt(s,'原样录制\n原样回放',1.77,2.25,1.86,.69,20,C.blue,true);txt(s,'≠',3.98,2.17,.8,.7,44,C.orange,true,{align:'center'});pill(s,'选择 → 组织 → 留下痕迹',4.94,2.31,7.52,C.ink,C.white,23);
 art(s,'factory',.7,2.94,11.9,3.18);flow(s,['接收','筛选','加工','保存','丢失'],.79,6.25,11.75,.59);
}
// 05 / Editable 24-cell board and four illustrated classmates.
{
 const s=base('MEMORY CHALLENGE','我画我猜：4人上台，全班一起体验记忆与遗忘。','体验记忆');
 box(s,.66,2.12,8.0,2.72,C.ink);const gx=.85,gy=2.31,cw=1.24,ch=.56;
 for(let r=0;r<4;r++)for(let c=0;c<6;c++){const n=r*6+c+1,x=gx+c*cw,y=gy+r*ch;box(s,x,y,cw-.045,ch-.04,C.white,undefined,.025);txt(s,String(n),x+.07,y+.05,.38,.26,16,C.blue,true);if(r===0&&c<3)icon(s,['umbrella','key-round','bike'][c],x+.64,y+.06,.38,C.ink);}
 pill(s,'1–24 编号画板 · 示意',1.85,4.9,5.52,C.ink,C.white,18);art(s,'students-four',.8,5.33,7.56,1.06);
 box(s,9.02,2.12,3.56,4.14,C.white);[['4','名同学\n每人6格'],['24','个词语\n台下同步记忆'],['3s','每词3秒\n读2遍并作画']].forEach(([n,d],i)=>{txt(s,n,9.26,2.37+i*1.12,1.1,.62,40,C.ink,true);txt(s,d,10.4,2.4+i*1.12,1.92,.76,18,C.muted);});
 conclusion(s,'只画简笔画，禁止文字；教师随机报号，全班举手抢答。');
}
// 06 / Five miniature explanatory scenes on a continuous route.
{
 const s=base('刚才，你的大脑做了什么？','听见、想象、画出、继续接收、再尝试想起来。','体验记忆');
 const data=[['hearing','听到词语'],['imagine','形成画面'],['draw','画下来'],['queue','继续接收'],['recall','随机回忆']];
 data.forEach(([a,t],i)=>{const x=.66+i*2.48;art(s,a,x,2.58,2.16,1.92);pill(s,'0'+(i+1),x+.73,2.05,.68,C.ink,C.white,18);txt(s,t,x,4.68,2.18,.46,22,C.ink,true,{align:'center'});if(i<4)line(s,x+2.17,3.62,x+2.45,3.62,C.blue,2,true);if(i===0||i===3){line(s,x+1.08,5.21,x+1.08,5.66,C.muted,1.6,true);box(s,x+.73,5.78,.7,.32,'DBDEED');box(s,x+.87,6.17,.42,.13,'E9EAF4');}});
 conclusion(s,'为什么有的留下，有的消失？画出来，就一定记得住吗？');
}
// 07 / A trace is the outcome of transforming multiple kinds of experience.
{
 const s=base('记忆，是加工后留下的痕迹','见过、听过、想过、做过、经历过，都可能成为材料。','认识记忆');
 art(s,'trace',.67,2.1,7.06,4.0);
 box(s,8.02,2.26,4.57,3.63,C.white);txt(s,'人脑对经历过的\n事物留下的反映',8.37,2.66,3.88,1.05,27,C.ink,true);flow(s,['编码','保持','提取'],8.32,4.1,3.98,.66);txt(s,'加工后的痕迹',8.36,5.15,3.85,.46,25,C.ink,true,{align:'center'});
 conclusion(s,'MEMORY ≠ VIDEO  ·  记忆不是原版录像');
}
function overview(s,loss=false,summary=false){
 const xs=[2.0,5.62,9.24],data=[['01 感觉记忆','sensory-pod','0.25–2 秒','瞬间快照'],['02 短时记忆','short-pod','1秒–1分钟','经典估计 7±2 组块'],['03 长时记忆','long-pod','长期保存','容量巨大 · 意义编码']];
 box(s,.59,2.78,1.04,2.62,C.white);txt(s,'外界\n信息',.7,2.98,.82,.73,21,C.ink,true,{align:'center'});['eye','ear','hand'].forEach((a,i)=>icon(s,a,.88,3.91+i*.42,.34,C.blue));line(s,1.65,4.04,1.96,4.04,C.blue,2,true);
 data.forEach(([t,a,d,k],i)=>{const x=xs[i];box(s,x,2.13,3.15,3.6,C.white);txt(s,t,x+.09,2.28,2.97,.44,23,i===0?C.blue:C.ink,true,{align:'center'});art(s,a,x+.1,2.93,2.95,1.85);txt(s,d,x+.09,4.88,2.97,.46,25,i===0?C.blue:C.ink,true,{align:'center'});txt(s,k,x+.09,5.4,2.97,.3,16,C.muted,false,{align:'center'});line(s,x+1.57,5.76,x+1.57,summary?5.89:6.05,loss?C.orange:C.muted,1.8,true);pill(s,loss?['没注意 → 遗忘','没加工 → 遗忘','少提取 → 模糊'][i]:'遗忘',x+.16,summary?5.96:6.11,2.83,loss?C.ink:C.muted,loss?C.paleOrange:C.white,18);if(i<2)line(s,x+3.18,4.07,x+3.57,4.07,C.blue,2.2,true);});
 pill(s,'注意',4.93,2.95,.98,C.blue,C.paleBlue,17);pill(s,'复述 / 理解',8.03,2.95,1.77,C.ink,C.light,17);
 if(summary)conclusion(s,'注意输入 → 理解加工 → 间隔复习 + 主动输出');
}
// 08 / Main processing infographic.
{
 const s=base('记忆三车间：信息怎样留下来？','沿着一条路径，看见信息的进入、筛选、加工和保存。','记忆三车间');overview(s);txt(s,'教学近似范围；时长、容量受材料、任务和策略影响。',1.3,6.7,10.7,.29,16,C.muted,false,{align:'center'});
}
// 09 / A classroom moment becomes a fading snapshot.
{
 const s=base('01 感觉记忆：瞬间快照','容量很大，停留却极短。','记忆三车间');
 art(s,'classroom-look',.63,2.28,5.35,3.65);
 const colors=[C.blue,'8AA9DA','C0CCE2'];colors.forEach((c,i)=>{const x=6.3+i*2.13;box(s,x,2.52,1.84,1.7,C.white);txt(s,'山  日\nA  7',x+.12,2.86,1.6,.93,27,c,true,{align:'center'});txt(s,['看见','变淡','消失'][i],x,4.39,1.84,.36,19,C.muted,false,{align:'center'});if(i<2)line(s,x+1.87,3.35,x+2.09,3.35,C.line,1.5,true);});
 txt(s,'0.25–2 秒',6.4,5.12,4.93,.73,43,C.blue,true);txt(s,'约数；不同感觉通道有所不同',6.44,5.93,5.54,.34,17,C.muted);conclusion(s,'没有被注意的信息，很快消失。');
}
// 10 / A physically limited illustrated bench with editable information cards.
{
 const s=base('02 短时记忆：有限的工作台','新信息不断进来，桌面却不会无限变大。','记忆三车间');
 art(s,'short-pod',.72,2.68,7.0,4.12);box(s,8.17,2.21,4.42,3.9,C.white);icon(s,'timer',8.5,2.51,.56,C.blue);txt(s,'1秒–1分钟',8.51,3.2,3.72,.55,29,C.ink,true);txt(s,'7±2',8.51,4.12,3.65,.79,48,C.ink,true);txt(s,'组块 · 经典估计',8.55,5.1,3.62,.39,20,C.muted);txt(s,'容量有限，需要及时加工',8.55,5.65,3.62,.31,17,C.muted);
 ['公式','单词','钥匙'].forEach((t,i)=>pill(s,t,2.55+i*1.27,3.86,1.05,C.ink,C.white,16));line(s,7.25,4.43,7.53,5.46,C.orange,2.3,true);box(s,7.0,5.55,.83,.5,'DADDEB',C.line,.05,{rotate:14});txt(s,'挤出',7.06,5.63,.7,.28,16,C.muted,true,{rotate:14});conclusion(s,'会复述、能分组，工作台就更好用。');
}
// 11 / Same letters, meaningful packages.
{
 const s=base('组块化：把信息打包得更聪明','相同的10个字母，只改变组织方式。','记忆三车间');
 pill(s,'逐个记',.79,2.1,1.48,C.muted,C.white);'CCTVNBAUFO'.split('').forEach((t,i)=>{const x=2.48+i*.96;box(s,x,2.12,.76,.73,C.white,C.line,.07);txt(s,t,x,2.24,.76,.47,27,C.muted,true,{align:'center'});});
 line(s,6.7,2.99,6.7,3.43,C.purple,2,true);pill(s,'CHUNKING / 组块化',4.65,3.48,4.1,C.purple,C.white,21);
 art(s,'packing',.95,3.95,11.43,2.45);
 [['CCTV','电视频道'],['NBA','篮球联赛'],['UFO','不明飞行物']].forEach(([a,b],i)=>{const x=1.92+i*3.5;box(s,x,4.93,2.64,.62,C.white);txt(s,a,x+.08,5.01,2.48,.42,28,C.ink,true,{align:'center'});box(s,x,5.63,2.64,.39,C.white);txt(s,b,x,5.65,2.64,.33,18,C.muted,false,{align:'center'});});conclusion(s,'不是记住更多，而是把信息打包得更聪明。');
}
// 12 / A library network, with six classified examples.
{
 const s=base('03 长时记忆：相互连接的知识网络','可以长期保存；理解和组织，为提取提供线索。','记忆三车间');art(s,'library',.58,2.14,7.2,4.4);
 const labels=[['古诗','book-open'],['英语','languages'],['人物','users'],['事件','calendar-days'],['技能','bike'],['生活经历','image']];labels.forEach(([t,ic],i)=>{const x=8.0+(i%2)*2.38,y=2.24+Math.floor(i/2)*1.21;box(s,x,y,2.17,1.02,C.white);icon(s,ic,x+.15,y+.24,.46,C.blue);txt(s,t,x+.78,y+.25,1.26,.47,20,C.ink,true);});
 conclusion(s,'容量巨大 · 长期保存 · 意义编码');
}
// 13 / Repeat the same system to reveal its loss points.
{
 const s=base('信息为什么没有留下？','先找到信息流失的环节，再选择适合的策略。','理解遗忘');overview(s,true);txt(s,'没听进去？没弄懂？还是后来很少再尝试想起来？',1.15,6.72,11.0,.29,18,C.ink,true,{align:'center'});
}
// 14 / Editable native curve plus a learner and a calendar, not a chart-only page.
{
 const s=base('艾宾浩斯遗忘曲线：先快后慢','及时复习，让记忆保持的曲线重新抬高。','记忆升级');
 box(s,.65,2.13,7.6,4.19,C.white);const labels=Array.from({length:33},(_,i)=>String(i)),unreviewed=labels.map((_,i)=>20+80*Math.exp(-i/5.2)),reviewed=labels.map((_,i)=>i<5?unreviewed[i]:i<13?62+35*Math.exp(-(i-5)/5):i<25?72+26*Math.exp(-(i-13)/9):85+14*Math.exp(-(i-25)/10));
 s.addChart(p.ChartType.line,[{name:'未复习 · 示意',labels,values:unreviewed},{name:'间隔复习 · 示意',labels,values:reviewed}],{x:.75,y:2.72,w:7.25,h:3.16,showLegend:false,showTitle:false,showValue:false,chartColors:[C.muted,C.blue],showBorder:false,lineSize:3,lineSmooth:true,lineDataSymbol:'none',catAxisHidden:true,catAxisLineShow:false,valAxisLabelFontFace:FONT,valAxisLabelFontSize:16,valAxisLabelColor:C.muted,valAxisMinVal:0,valAxisMaxVal:100,valAxisMajorUnit:50,valAxisLineShow:false,valGridLine:{color:'E7E7F1',width:1},layout:{x:.08,y:.06,w:.87,h:.85},altText:'遗忘先快后慢，间隔复习使保持程度重新升高。示意数据及非等比例时间轴。'});
 txt(s,'记忆保持（示意）',.9,2.26,3.2,.3,16,C.muted);line(s,4.65,2.44,4.97,2.44,C.muted,3);txt(s,'未复习',5.1,2.27,1.14,.3,16,C.muted);line(s,6.35,2.44,6.67,2.44,C.blue,3);txt(s,'复习',6.79,2.27,1,.3,16,C.blue);
 [['学后',1.15],['当天',2.08],['第2天',3.65],['第7天',6.03],['更久',7.18]].forEach(([t,x])=>txt(s,t,x,5.92,.8,.3,16,C.muted,false,{align:'center'}));
 art(s,'review',8.63,2.14,3.94,3.56);['当天','第2天','第7天'].forEach((t,i)=>pill(s,t,8.58+i*1.35,5.88,1.24,C.blue,C.white,18));
 conclusion(s,'不要等忘光了，再从头学一次。');txt(s,'教学示意，时间轴非等比例',.86,6.24,7.23,.23,16,C.muted);
}
// 15 / A real teaching pair plus an actionable editable cycle.
{
 const s=base('主动输出：试着把它讲明白','费曼学习法 · 说、写、用，找到理解中卡住的地方。','记忆升级');art(s,'teach',.57,2.36,5.36,3.7);
 const pts=[[6.18,2.22],[8.43,2.22],[10.68,2.22],[10.68,4.35],[8.43,4.35],[6.18,4.35]],labs=['学习','合上书','讲出来','发现卡住','回去检查','再次表达'],ics=['book-open','book-x','message-circle','circle-help','search','refresh-cw'];
 [[8.15,2.89,8.37,2.89],[10.4,2.89,10.62,2.89],[11.66,3.61,11.66,4.28],[10.62,5.02,10.4,5.02],[8.37,5.02,8.15,5.02],[7.16,4.28,7.16,3.61]].forEach(a=>line(s,...a,C.ink,1.8,true));
 pts.forEach(([x,y],i)=>{box(s,x,y,1.96,1.33,i===3?C.paleOrange:C.white);icon(s,ics[i],x+.73,y+.17,.5,i===3?C.orange:C.blue);txt(s,labs[i],x+.05,y+.87,1.86,.34,19,C.ink,true,{align:'center'});});
 txt(s,'用自己的话',6.8,3.78,5.5,.35,21,C.ink,true,{align:'center'});conclusion(s,'英语：造句  ·  历史：讲因果  ·  数学：解释每一步');
}
// 16 / Emotional salience, schematic amygdala, and a compact safety example.
{
 const s=base('情绪，让某些记忆更鲜明','小目标、小奖励与成就感，可以帮助我们投入学习。','记忆升级');
 art(s,'ordinary',.69,2.3,4.27,2.61);art(s,'achievement',8.0,2.3,4.55,2.61);pill(s,'普通的一天',1.0,2.05,3.65,C.muted,C.white,21);pill(s,'第一次被全班鼓掌',8.26,2.05,4.03,C.ink,C.white,21);
 box(s,5.24,2.48,2.43,2.39,C.white);s.addImage({path:path.join(assets,'illustrations','brain.svg'),x:5.41,y:2.74,w:2.12,h:1.59,objectName:'杏仁核位置示意'});dot(s,6.62,3.75,.085,C.orange);txt(s,'杏仁核',5.42,4.24,2.08,.35,20,C.ink,true,{align:'center'});txt(s,'位置为简化示意',5.36,4.65,2.19,.23,16,C.muted,false,{align:'center'});
 pill(s,'更鲜明 ≠ 更准确',.86,5.13,5.23,C.ink,C.white,23);pill(s,'压力过大，也会妨碍回忆',6.49,5.13,6.0,C.ink,C.white,21);
 art(s,'safety',.85,5.76,2.28,.72);box(s,3.31,5.77,9.11,.66,C.white);txt(s,'简单了解：安全相关信息可能更容易获得注意。',3.51,5.89,8.71,.39,19,C.muted);conclusion(s,'给自己一个小目标，让学习多一点参与感与成就感。',6.52);
}
// 17 / Curiosity represented by searching and linking, not only a question icon.
{
 const s=base('好奇心：带着问题学习','给阅读一个明确的寻找方向。','记忆升级');art(s,'curiosity',.65,2.25,4.7,3.7);
 pill(s,'机械通读',5.65,2.2,2.0,C.muted,C.white,18);flow(s,['打开书','看一遍','再看','忘记'],5.64,2.94,6.98,.91,C.muted);
 pill(s,'先带问题',5.65,4.12,2.0,C.ink,C.white,18);flow(s,['提出问题','寻找答案','产生连接','理解表达'],5.64,4.88,6.98,.91,C.ink);
 conclusion(s,'试着问：为什么北半球夏天白天更长？');
}
// 18 / Rich four-scene strategy map, with visible paths into a storage network.
{
 const s=base('记忆升级地图','四条路径，一起帮助重要的信息留下来。','记忆升级');
 const nodes=[['review-mini','重复复习','隔一段时间，再提取',.67,2.14],['teach-mini','主动输出','合上书，用自己的话说',9.0,2.14],['reward-mini','情绪参与','寻找兴趣与成就感',.67,4.3],['ask-mini','主动提问','先问为什么，再找联系',9.0,4.3]];
 nodes.forEach(([a,t,d,x,y])=>{box(s,x,y,3.64,1.98,C.white);art(s,a,x+.14,y+.48,1.64,1.03);txt(s,t,x+1.83,y+.3,1.63,.48,21,C.ink,true);txt(s,d,x+.18,y+1.59,3.27,.31,17,C.muted,false,{align:'center'});});
 art(s,'long-pod',4.99,3.0,3.35,2.29);pill(s,'LONG-TERM MEMORY',4.64,5.35,4.05,C.ink,C.white,18);
 [[4.35,3.06,4.67,3.06,4.67,3.66,4.96,3.66],[8.96,3.06,8.63,3.06,8.63,3.66,8.37,3.66],[4.35,5.24,4.67,5.24,4.67,4.61,4.96,4.61],[8.96,5.24,8.63,5.24,8.63,4.61,8.37,4.61]].forEach(a=>{line(s,a[0],a[1],a[2],a[3],C.blue,2);line(s,a[2],a[3],a[4],a[5],C.blue,2);line(s,a[4],a[5],a[6],a[7],C.blue,2,true);});conclusion(s,'注意输入 → 理解加工 → 多次把重要的信息想起来');
}
// 19 / Group scene plus a wall of specific, relatable problems.
{
 const s=base('我的记忆困扰墙','4人一组，写下一个具体的困扰；本页讨论3分钟。','小组活动');art(s,'discussion',.55,2.61,4.71,3.68);
 const data=[['背了就忘','古诗隔天只剩开头'],['考试突然空白','走出考场又想起来'],['单词记不住','合上书就说不出'],['公式混淆','做题时选错公式'],['古诗背串','和另一首混在一起'],['知道却说不出','答案就在嘴边']];
 data.forEach(([a,b],i)=>{const x=5.53+(i%2)*3.6,y=2.18+Math.floor(i/2)*1.27;box(s,x,y,3.28,1.06,C.white);box(s,x+.17,y,.46,.055,i%2?C.blue:C.purple,undefined,0);txt(s,a,x+.19,y+.19,2.9,.42,22,C.ink,true);txt(s,b,x+.19,y+.71,2.9,.28,16,C.muted);});
 conclusion(s,'我的情境：在 __________ 的时候，我常常 __________。');
}
// 20 / A printable native form paired with a real planning scene.
{
 const s=base('我的记忆升级计划','继续讨论3分钟，再邀请2–3组分享3分钟。','小组活动');art(s,'plan',.55,2.57,3.7,3.92);
 const X=4.47,Y=2.13;box(s,X,Y,8.11,4.17,C.white);line(s,8.49,2.36,8.49,6.04,C.line,1.2);
 txt(s,'01 我的困扰',X+.26,2.4,3.35,.44,23,C.ink,true);line(s,X+.28,3.39,8.19,3.39,C.line,1.2);txt(s,'02 应用在哪门学科',X+.26,3.84,3.35,.44,23,C.ink,true);line(s,X+.28,4.84,8.19,4.84,C.line,1.2);txt(s,'说具体：哪一章？哪一类题？',X+.28,5.48,3.43,.57,17,C.muted);
 txt(s,'03 我选择的两种策略',8.77,2.4,3.5,.44,23,C.ink,true);['策略1','策略2'].forEach((t,i)=>{txt(s,t,8.81,3.2+i*.66,1.04,.35,18,C.muted);line(s,9.97,3.55+i*.66,12.28,3.55+i*.66,C.line,1.2);});txt(s,'04 下一次行动',8.77,4.75,3.5,.44,23,C.ink,true);line(s,8.81,5.78,12.28,5.78,C.line,1.2);
 conclusion(s,'什么时候做？做什么？怎样检查自己是否记住了？');
}
// 21 / Retrieval practice on the same visual processing system.
{
 const s=base('把整座“记忆工厂”装进脑中','3分钟回顾：说出三个车间，再找到注意、加工与复习的作用。','课程回顾');overview(s,false,true);
}
// 22 / Return to the populated information hub, with an empowering conclusion.
{
 const s=base('遗忘，是大脑的正常工作方式。','学会记忆，不是要求自己过目不忘，','带走一张地图');txt(s,'而是学会让重要的信息留下来。',.58,1.98,12.1,.58,30,C.ink,true);
 art(s,'hub',2.3,2.73,8.82,3.64);[['注意','eye',.82,3.2],['理解','network',.82,4.96],['复习','refresh-cw',10.3,3.2],['输出','message-circle',10.3,4.96]].forEach(([t,ic,x,y])=>{box(s,x,y,2.19,.78,C.white);icon(s,ic,x+.14,y+.18,.42,C.blue);txt(s,t,x+.76,y+.17,1.24,.44,23,C.ink,true);});conclusion(s,'遗忘不等于笨。你可以用合适的方法，帮助重要的信息留下来。');
}
fs.writeFileSync(path.join(root,'src/layout-audit.json'),JSON.stringify({size:{w:W,h:H},font:FONT,slides:slideNo,textBoxes:audit,scenePlacements:artAudit},null,2)+'\n');
(async()=>{const file=path.join(root,'大脑记忆工厂.pptx');await p.writeFile({fileName:file});const zip=await JSZip.loadAsync(fs.readFileSync(file)),pngs=Object.values(zip.files).filter(f=>f.name.startsWith('ppt/media/')&&f.name.endsWith('.png')),cache=new Map();let fixed=0;
for(const f of pngs){const raw=await f.async('nodebuffer');if(raw.subarray(0,800).toString().includes('<svg')){const key=raw.toString();if(!cache.has(key)){const meta=await sharp(raw).metadata();cache.set(key,await sharp(raw,{density:192}).resize({width:meta.width>=1000?1600:meta.width>400?1200:700}).png().toBuffer());}zip.file(f.name,cache.get(key));fixed++;}}
fs.writeFileSync(file,await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));console.log(`Built ${slideNo} slides, ${manifest.backgrounds.length} illustrated backgrounds, ${artAudit.length} scene placements; ${fixed} PNG fallbacks.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
