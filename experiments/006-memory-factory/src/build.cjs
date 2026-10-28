/* Original vector diagrams + editable PowerPoint text, shapes, and chart.
   Run npm install && npm run build from the experiment directory. */
const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
const JSZip = require('jszip');
const sharp = require('sharp');
const root = path.join(__dirname, '..');
const assets=path.join(root,'assets');
const C={ink:'36369B',blue:'3975D7',purple:'7655CE',orange:'F39A45',teal:'37B8C9',pink:'DC668A',bg:'F8F8FC',text:'292A3A',muted:'62647B',line:'DADBEA',light:'EEEDF9',white:'FFFFFF',paleBlue:'EDF3FC',paleOrange:'FFF2E5',paleTeal:'E8F7F9'};
const FONT='Noto Sans CJK SC';
const p=new pptxgen();p.layout='LAYOUT_WIDE';p.author='Pocket Creative Lab';p.subject='40分钟初中心理健康课 · 记忆的信息加工与学习策略';p.title='大脑“记忆”工厂';p.company='mobile-lab';p.lang='zh-CN';
p.theme={headFontFace:FONT,bodyFontFace:FONT,lang:'zh-CN'};
const S=p.ShapeType;const W=13.333333,H=7.5;
let audit=[], slideNo=0;
function box(s,x,y,w,h,fill=C.white,stroke=fill,r=.16,extra={}){s.addShape(r?S.roundRect:S.rect,{x,y,w,h,rectRadius:r,radius:r,fill:{color:fill},line:{color:stroke,width:stroke===fill?0:1},...extra});}
function txt(s,t,x,y,w,h,size=20,color=C.text,bold=false,extra={}){s.addText(t,{x,y,w,h,fontFace:FONT,fontSize:size,color,bold,margin:0,breakLine:false,vertAnchor:'mid',valign:'mid',fit:'resize',paraSpaceAfterPt:0,...extra});audit.push({slide:slideNo,text:typeof t==='string'?t:'rich-text',x,y,w,h,size});}
function line(s,x1,y1,x2,y2,color=C.line,width=1.5,arrow=false,dash){s.addShape(S.line,{x:Math.min(x1,x2),y:Math.min(y1,y2),w:Math.abs(x2-x1),h:Math.abs(y2-y1),flipH:x2<x1,flipV:y2<y1,line:{color,width,beginArrowType:'none',endArrowType:arrow?'triangle':'none',...(dash?{dashType:'dash'}:{})}});}
function dot(s,x,y,r,color){s.addShape(S.ellipse,{x:x-r,y:y-r,w:r*2,h:r*2,fill:{color},line:{color,width:0}});}
function pill(s,t,x,y,w,color=C.ink,fill=C.light,size=16){box(s,x,y,w,.4,fill);txt(s,t,x+.08,y,w-.16,.4,size,color,true,{align:'center'});}
function icon(s,name,x,y,size=.6,color=C.ink,bg){if(bg){box(s,x-.1,y-.1,size+.2,size+.2,bg);}s.addImage({path:iconPath(name,color),x,y,w:size,h:size});}
const icache={};
function iconPath(name,color){const k=name+'-'+color;if(!icache[k]){const dest=path.join(assets,'icons',k+'.svg');let data=fs.readFileSync(require.resolve('lucide-static/icons/'+name+'.svg'),'utf8').replace(/currentColor/g,'#'+color);fs.writeFileSync(dest,data);icache[k]=dest;}return icache[k];}
function svg(s,name,x,y,w,h){s.addImage({path:path.join(assets,'illustrations',name+'.svg'),x,y,w,h});}
function header(s,title,sub,section='探索记忆'){txt(s,section+' / MEMORY LAB',.56,.27,9,.3,11,C.ink,true,{charSpacing:1});txt(s,title,.55,.77,12.2,.62,32,C.ink,true);if(sub)txt(s,sub,.58,1.45,12.1,.42,17,C.muted);}
function base(title,sub,section){slideNo++;const s=p.addSlide();s.background={color:C.bg};header(s,title,sub,section);line(s,.56,7.08,12.77,7.08,C.line,.8);txt(s,'大脑“记忆”工厂',.56,7.16,5,.18,10,C.muted);txt(s,String(slideNo).padStart(2,'0')+' / 22',11.4,7.12,1.35,.26,11,C.ink,true,{align:'right'});for(let i=0;i<4;i++)box(s,10.8+i*.49,.33,.36,.05,i<=Math.min(3,Math.floor((slideNo-1)/6))?C.ink:C.line,undefined,0);return s;}
function callout(s,t,y=6.35,color=C.ink,fill=C.light){box(s,.58,y,12.17,.56,fill);txt(s,t,.83,y+.04,11.67,.47,21,color,true,{align:'center'});}
function note(s,t,time){s.addNotes(`【建议用时】${time}\n${t}`);}
function miniFlow(s,x,y,w,labels,colors=[C.blue,C.purple,C.ink],h=.7){const gap=.28,unit=(w-gap*(labels.length-1))/labels.length;labels.forEach((a,i)=>{box(s,x+i*(unit+gap),y,unit,h,i%2?C.light:C.paleBlue);txt(s,a,x+i*(unit+gap)+.06,y+.06,unit-.12,h-.12,18,colors[i%colors.length],true,{align:'center'});if(i<labels.length-1)line(s,x+i*(unit+gap)+unit+.03,y+h/2,x+(i+1)*(unit+gap)-.03,y+h/2,C.ink,1.5,true);});}
function brainAsset(){const shape=`<path d="M207 259C172 277 131 269 114 241C77 248 42 225 42 192C15 176 12 139 35 117C30 83 55 59 86 57C100 25 138 17 164 34C194 9 238 17 253 43C292 27 332 43 342 75C378 79 395 108 387 137C419 159 419 197 390 217C392 251 357 275 326 265L298 304L268 302L270 263C248 272 227 272 207 259Z" fill="#7655CE"/><path d="M114 241C142 220 170 224 181 201M86 57C77 91 102 113 122 113C151 111 159 136 150 156M164 34C184 58 173 90 154 94M253 43C231 69 250 94 272 101M342 75C312 80 297 101 305 126C319 157 354 146 367 164M35 117C66 113 83 134 77 160M42 192C63 180 93 187 100 210M207 259C216 235 202 209 216 189C230 169 226 143 207 134M390 217C364 209 341 221 328 241M270 263C284 240 276 213 261 203M207 53C202 80 220 97 210 113M112 172C136 166 156 178 164 194M268 149C267 173 285 190 308 184" fill="none" stroke="#B9A5EE" stroke-width="9" stroke-linecap="round"/><path d="M111 114L154 94L210 113L272 101L305 126L268 149L216 189L164 194L112 172Z M210 113L216 189 M268 149L261 203 M154 94L164 194" fill="none" stroke="#E0D7FA" stroke-width="3"/>`;
let nodes=[[111,114],[154,94],[210,113],[272,101],[305,126],[268,149],[216,189],[164,194],[112,172],[261,203]];return `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="330" viewBox="0 0 440 330">${shape}${nodes.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="7" fill="${i%3===0?'#F39A45':'#FFFFFF'}"/>`).join('')}</svg>`;}
function studentAsset(){return `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="420" viewBox="0 0 180 420"><path d="M59 238L54 336L40 398L64 402L93 306L100 249Z" fill="#36369B"/><path d="M99 243L111 320L139 390L159 382L143 298L130 232Z" fill="#4446A6"/><path d="M38 395L64 397L65 411L27 411Q24 401 38 395M138 385L158 379L172 393L145 403Z" fill="#292A3A"/><path d="M57 119Q43 134 44 176L53 248Q94 264 133 239L131 159Q125 123 105 120Z" fill="#3975D7"/><path d="M61 130L90 169L111 124" fill="#FFFFFF"/><path d="M48 144L22 206L60 242L71 226L46 201L71 157M119 145L143 200L171 182L177 198L141 226Q129 229 121 210L103 165" fill="#D7A17E"/><path d="M45 139L33 170L60 183L76 151M115 134L134 167L112 181L97 148" fill="#3975D7"/><path d="M81 100L78 128L94 147L107 126L103 99" fill="#D7A17E"/><ellipse cx="92" cy="72" rx="32" ry="41" fill="#E4B18B"/><path d="M60 70Q45 33 74 24Q111 8 126 43L125 81L111 68L108 45Q83 56 63 49Z" fill="#292A3A"/><circle cx="105" cy="75" r="2.3" fill="#292A3A"/><path d="M111 94L98 96" stroke="#9D5A4F" stroke-width="2.5" stroke-linecap="round"/><path d="M46 130L36 137L26 211L47 225L57 156" fill="#7655CE"/></svg>`;}
fs.writeFileSync(path.join(assets,'illustrations','brain.svg'),brainAsset());fs.writeFileSync(path.join(assets,'illustrations','student.svg'),studentAsset());
// 01 / A connected, explanatory cover.
{
 const s=base('大脑“记忆”工厂','你的记忆，真的靠谱吗？','初中心理健康 / 40分钟');
 box(s,4.45,2.05,4.45,3.6,C.light);svg(s,'brain',4.83,2.28,3.7,2.78);pill(s,'信息正在被加工',5.22,5.08,2.9,C.ink,C.white);
 const items=[['eye','看见',1.05,2.16],['ear','听见',.72,3.62],['book-open','学过',1.5,5.12],['key-round','做过',10.5,2.12],['message-circle','聊过',11,3.62],['image','经历过',10.2,5.13]];
 items.forEach(([ic,la,x,y],i)=>{line(s,x+1.2,y+.36,i<3?4.45:8.9,3.2+i%3*.55,C.line,2);box(s,x,y,1.55,.95,C.white,C.line);icon(s,ic,x+.12,y+.18,.42,i%2?C.blue:C.ink);txt(s,la,x+.68,y+.19,.8,.5,18,C.ink,true);});
 pill(s,'单词',3.4,2.05,.8,C.blue,C.paleBlue);pill(s,'音乐',9.25,4.7,.9,C.purple,C.light);pill(s,'考试',3.6,5.45,.85,C.ink,C.light);
 miniFlow(s,.8,6.24,11.75,['信息进入','注意筛选','暂时保存','理解加工','长期留下'],[C.blue,C.purple,C.ink],.56);
 note(s,'开场：今天我们把大脑当成一座信息加工厂。请学生带着一个自己的记忆困扰参与。封面图中的线条表示信息进入，工厂是教学隐喻，并不对应大脑中的三个物理房间。','0:30');
}
// 02 / Door-lock story.
{
 const s=base('我到底锁门了吗？','熟悉的动作，为什么会留下模糊的记忆？');
 box(s,.62,2.05,3.65,3.72,C.paleBlue);box(s,9.1,2.05,3.62,3.72,C.light);
 // Stairs and a naturally proportioned student.
 for(let i=0;i<4;i++)box(s,.92+i*.61,5.3-i*.4,.64,.28,'D9E4F7',undefined,0);
 svg(s,'student',1.4,2.3,1.25,2.92);pill(s,'已经走下楼',1.12,5.23,2.6,C.blue,C.white);
 box(s,9.93,2.38,1.94,2.67,C.ink,undefined,.06);box(s,10.15,2.62,1.5,2.22,'6263B6',undefined,.03);icon(s,'lock-keyhole',10.65,3.52,.48,C.white);line(s,11.45,3.79,11.75,3.79,C.orange,4);pill(s,'门锁在楼上',9.6,5.23,2.6,C.ink,C.white);
 box(s,4.68,2.65,3.98,1.67,C.white,C.line);icon(s,'circle-help',6.23,2.15,.68,C.orange);txt(s,'“我刚刚……\n到底锁没锁？”',4.95,2.94,3.44,1.03,25,C.ink,true,{align:'center'});line(s,4.27,3.9,4.65,3.6,C.ink,2,true);line(s,8.67,3.6,9.07,3.9,C.ink,2,true);
 pill(s,'现实：动作是否发生？',4.68,4.65,3.98,C.blue,C.paleBlue,18);pill(s,'脑中：我感觉发生过',4.68,5.18,3.98,C.ink,C.light,18);
 callout(s,'感觉记得很清楚，就一定是真的吗？');note(s,'邀请举手：有没有走出家门后突然怀疑自己锁没锁门？保留悬念，不现场判定学生有没有锁。追问：熟练动作发生时，注意力可能在哪里？','1:45');
}
// 03 / Two versions of one memory.
{
 const s=base('同一段童年，两种版本','情境讨论：第一次在亲友面前表演');
 const xs=[.68,7.2]; const labels=['我的童年记忆','爸妈告诉我的版本'];
 xs.forEach((x,i)=>{box(s,x,2.12,5.45,3.75,i?C.light:C.paleBlue);pill(s,labels[i],x+.28,2.38,4.89,i?C.ink:C.blue,C.white,20);icon(s,i?'users':'user-round',x+.4,3.2,.74,i?C.purple:C.blue);txt(s,i?'“你唱完以后，\n大家都鼓掌了。”':'“我忘词了，\n所有人都在笑我。”',x+1.5,3.2,3.5,1.25,25,C.text,true);miniFlow(s,x+.3,5.0,4.85,i?['被转述','再想象','再记住']:['当时感受','后来的解释','现在回忆'],[C.ink],.5);});
 txt(s,'≠',6.18,3.25,.93,1,48,C.orange,true,{align:'center'});callout(s,'大脑真的像录像机吗？');
 note(s,'这是虚构讨论情境。请学生想：两种版本可能都带着各自的视角。记忆会受情绪、后来的信息和提取过程影响；不能仅凭不一致断定谁撒谎，也不能认定家长版本一定正确。','1:00');
}
// 04 / Metaphor reveal.
{
 const s=base('大脑不是录像机','它更像一座“信息加工厂”。');
 box(s,.78,2.13,4.1,2.55,C.paleBlue);icon(s,'video',1.15,2.7,1.15,C.blue);txt(s,'原样录制\n原样回放',2.65,2.58,2,1.2,25,C.blue,true);txt(s,'≠',5.18,2.77,1.02,.9,54,C.orange,true,{align:'center'});
 box(s,6.52,2.13,6.03,2.55,C.light);svg(s,'brain',6.85,2.47,2.25,1.69);txt(s,'选择信息\n重新组织\n留下痕迹',9.45,2.6,2.5,1.45,24,C.ink,true);
 const stages=[['inbox','接收'],['scan-line','筛选'],['combine','加工'],['folder-open','保存'],['archive-x','丢失']];stages.forEach(([ic,t],i)=>{const x=.8+i*2.47;box(s,x,5.05,2.12,1.06,C.white,C.line);icon(s,ic,x+.17,5.3,.5,i===4?C.muted:C.ink);txt(s,t,x+.83,5.25,1.1,.5,22,C.ink,true);if(i<4)line(s,x+2.14,5.58,x+2.41,5.58,C.ink,1.5,true);});callout(s,'回忆，是一次“重新提取与组织”。');
 note(s,'强调工厂是帮助理解的比喻。记忆包含编码、保持和提取。丢失可以发生在多个环节，不是有一个专门负责丢掉记忆的房间。','0:45');
}
// 05 / Challenge dashboard with intentional number hierarchy.
{
 const s=base('MEMORY CHALLENGE','我画我猜：让记忆留下自己的“加工痕迹”。','体验记忆');
 const cards=[['4','名同学','users','负责在黑板作画'],['24','个词语','layers','全班一起尝试记忆'],['3s','每个词','timer','听词、画图、继续']];
 cards.forEach(([n,u,ic,desc],i)=>{const x=.7+i*4.22;box(s,x,2.15,3.8,3.12,i===1?C.light:C.paleBlue);icon(s,ic,x+.25,2.42,.62,C.ink);txt(s,n,x+.28,3.04,3.15,.95,58,C.ink,true);txt(s,u,x+.3,4.12,3.1,.4,24,C.ink,true);txt(s,desc,x+.3,4.72,3.12,.35,17,C.muted);});
 icon(s,'pencil-off',1.0,5.73,.5,C.orange);txt(s,'只画图，禁止写文字',1.7,5.68,4.5,.55,22,C.text,true);icon(s,'hand',7,5.73,.5,C.ink);txt(s,'随机提问，全班抢答',7.7,5.68,4.9,.55,22,C.text,true);callout(s,'不比画技，观察：什么更容易被记住？',6.45);
 note(s,'请4名同学上台，每人负责6个词，其余同学看图记忆。教师每3秒读一个词，共24词。禁止写汉字、字母、数字或拼音。词表（每竖线为一组）：雨伞、钥匙、自行车、月亮、书包、面包｜篮球、眼镜、火车、树叶、闹钟、桥梁｜蝴蝶、帐篷、蛋糕、海浪、吉他、信封｜台灯、地图、风筝、雪人、相机、鞋子。最后随机提问，不按原顺序。计时约72秒，留时间邀请、解释、抢答。可让学生留在座位做简笔记录，避免行动不便者被排除。','5:00');
}
// 06 / Trace the challenge.
{
 const s=base('刚才，你的大脑做了什么？','同一个词，经历了好几道加工。','体验记忆');
 const steps=[['ear','听到词语','声音输入'],['lightbulb','形成画面','调动已有经验'],['pencil','画下来','转换表达方式'],['layers','继续记忆','新信息不断进入'],['message-circle','随机回忆','寻找提取线索']];
 steps.forEach(([ic,t,d],i)=>{const x=.68+i*2.49;box(s,x,2.6,2.15,2.43,i===2?C.light:C.white,C.line);pill(s,'0'+(i+1),x+.17,2.12,.64,C.ink,C.light);icon(s,ic,x+.78,2.94,.68,i===2?C.purple:C.ink);txt(s,t,x+.12,3.94,2,.45,21,C.ink,true,{align:'center'});txt(s,d,x+.13,4.53,1.99,.32,16,C.muted,false,{align:'center'});if(i<4)line(s,x+2.17,3.68,x+2.46,3.68,C.ink,1.8,true);if(i===0||i===3){line(s,x+1.12,5.05,x+1.12,5.52,C.line,1.5,true);box(s,x+.7,5.55,.84,.36,'E9E9F1');box(s,x+.88,6.02,.49,.16,'F0F0F6');}});
 callout(s,'为什么有些东西留下来了，有些消失了？');
 note(s,'请学生先报告亲身体验：容易记住哪一个词？画得具体、联想到生活、和相邻图连成故事，都可能提供额外线索。不要把这个活动当作正式的记忆能力测验，也不评价谁记性差。','1:30');
}
// 07 / Definition as a hub with inputs and transformed output.
{
 const s=base('记忆，是加工后留下的痕迹','见过、听过、想过、做过、经历过，都可能成为材料。','认识记忆');
 box(s,4.12,2.1,4.2,3.8,C.light);svg(s,'brain',4.45,2.72,3.55,2.66);pill(s,'编码 → 保持 → 提取',4.45,5.25,3.55,C.ink,C.white,18);
 [['eye','见过',.85,2.2],['ear','听过',.85,3.63],['sparkles','想过',.85,5.06]].forEach(([ic,t,x,y])=>{box(s,x,y,2.3,.86,C.white,C.line);icon(s,ic,x+.16,y+.18,.48,C.blue);txt(s,t,x+.9,y+.18,1.2,.5,22,C.blue,true);line(s,x+2.33,y+.44,4.08,3.1+(y-2.2)*.5,C.blue,1.5,true);});
 [['hand','做过',9.2,2.2],['footprints','经历过',9.2,3.63]].forEach(([ic,t,x,y])=>{box(s,x,y,3.05,.86,C.white,C.line);icon(s,ic,x+.16,y+.18,.48,C.purple);txt(s,t,x+.9,y+.18,1.9,.5,22,C.ink,true);line(s,x-.04,y+.44,8.37,3.2+(y-2.2)*.5,C.purple,1.5,true);});
 box(s,9.2,5.0,3.05,.94,C.ink);txt(s,'加工后的痕迹',9.37,5.17,2.7,.5,23,C.white,true,{align:'center'});line(s,8.35,5.1,9.16,5.44,C.ink,2,true);callout(s,'MEMORY ≠ VIDEO  ·  记忆不是原版录像');
 note(s,'简要定义：记忆是人脑对经历过的事物进行编码、保持和提取的过程。人们提取的是经过加工的表征，而非一段完整、绝对准确的视频。','0:45');
}
function overview(s,{loss=false,summary=false}={}){
 const xs=[2.55,6.0,9.45], colors=[C.blue,C.purple,C.ink];
 box(s,.64,2.44,1.38,2.96,C.white,C.line);txt(s,'外界\n信息',.86,2.66,.95,.82,23,C.ink,true,{align:'center'});['eye','ear','hand'].forEach((ic,i)=>icon(s,ic,1.04,3.75+i*.49,.36,C.blue));line(s,2.05,3.9,2.5,3.9,C.ink,2,true);
 const stages=[['01','感觉记忆','scan-eye','0.25–2 秒','瞬间快照'],['02','短时记忆','panels-top-left','1秒–1分钟','7±2 组块*'],['03','长时记忆','folder-open','长期保存','容量巨大']];
 stages.forEach(([n,title,ic,d,k],i)=>{const x=xs[i];box(s,x,2.44,2.85,2.96,i===0?C.paleBlue:C.light);pill(s,n,x+.18,2.66,.56,colors[i],C.white);txt(s,title,x+.87,2.67,1.8,.44,24,colors[i],true);icon(s,ic,x+1.02,3.35,.8,colors[i]);txt(s,d,x+.15,4.35,2.55,.43,24,colors[i],true,{align:'center'});txt(s,k,x+.16,4.91,2.53,.3,17,C.muted,false,{align:'center'});line(s,x+1.42,5.42,x+1.42,5.88,loss?C.orange:C.line,2,true);pill(s,loss?['没注意 → 遗忘','没加工 → 遗忘','没复习 → 模糊'][i]:'遗忘',x+.08,5.96,2.69,loss?C.ink:C.muted,loss?C.paleOrange:'EEEEF3',18);if(i<2)line(s,x+2.88,3.9,x+3.4,3.9,C.ink,2,true);});
 pill(s,'注意',4.94,1.96,1.25,C.blue,C.paleBlue,18);pill(s,'复述 / 理解 / 加工',7.53,1.96,3.4,C.ink,C.white,17);
 if(summary){pill(s,'注意',2.75,6.58,1.4,C.blue,C.paleBlue);pill(s,'加工',6.2,6.58,1.4,C.purple,C.light);pill(s,'复习 + 输出',9.7,6.58,2.26,C.ink,C.light);}
}
// 08 / The main process model.
{
 const s=base('记忆三车间：信息怎样留下来？','一张地图，读懂“进入—筛选—加工—保存”。','记忆三车间');overview(s);
 txt(s,'* 经典短时记忆估计；时长与容量受材料、任务和策略影响。',.72,6.65,11.8,.3,16,C.muted);
 note(s,'按箭头走一遍：感觉记忆短暂保持输入；被注意的信息可能进入短时记忆；复述有助于维持，理解与组织有助于长期编码；每个阶段都可能流失。图为经典多存储模型的教学简化，并非真实解剖分区。感觉记忆不同通道时间不同；短时记忆并无固定1秒至1分钟的统一范围，此处按教案的近似表述讲解，不复述时常在数十秒内衰退。7±2来自经典研究，现代工作记忆研究在某些条件下常估计约4个组块。长时记忆也不保证永不遗忘。','2:00');
}
// 09 / Sensory memory scene and fading trace.
{
 const s=base('01 感觉记忆：瞬间快照','容量很大，停留却极短。','记忆三车间');
 box(s,.7,2.2,3.65,2.36,C.ink);txt(s,'黑板上闪过的信息',.98,2.4,3.1,.4,20,C.white,true);txt(s,'山 川  日 月\nA B  7  2\n春 风  海 星',1.05,3,2.92,1.1,25,C.white,false,{align:'center',charSpacing:3});
 icon(s,'eye',4.67,2.94,.79,C.blue);line(s,4.35,3.34,4.64,3.34,C.blue,2,true);line(s,5.56,3.34,6.15,3.34,C.blue,2,true);
 const fades=[C.blue,'91AFE0','CAD6EB'];fades.forEach((c,i)=>{box(s,6.3+i*2.1,2.6,1.82,1.63,C.white,C.line);txt(s,'山  日\nA  7',6.47+i*2.1,2.91,1.48,.88,26,c,true,{align:'center'});txt(s,['刚刚看见','迅速变淡','大部分消失'][i],6.2+i*2.1,4.43,2.02,.4,17,C.muted,false,{align:'center'});if(i<2)line(s,8.16+i*2.1,3.4,8.37+i*2.1,3.4,C.line,1.5,true);});
 txt(s,'0.25–2',.85,5.02,3.32,.77,43,C.blue,true);txt(s,'秒',3.74,5.27,.55,.42,22,C.blue,true);txt(s,'约数；不同感觉通道有所不同',.9,5.95,5,.32,16,C.muted);
 pill(s,'注意闸门',7.24,5.23,2.05,C.blue,C.paleBlue,20);line(s,9.36,5.44,9.93,5.44,C.blue,2,true);pill(s,'进入短时记忆',10.0,5.23,2.53,C.ink,C.light,20);
 callout(s,'没有被注意的信息，很快消失。',6.45);
 note(s,'可请学生闭眼一瞬，再看教室，体验视觉印象的短暂残留；不要用强光或频闪。图中的逐渐变淡是概念示意，并不意味着大家都能看清同样多的字符。视觉感觉痕迹通常更短，听觉痕迹可持续更久。','1:15');
}
// 10 / Editable temporary workbench.
{
 const s=base('02 短时记忆：一张有限的工作台','新信息不断进来，桌面却不会无限变大。','记忆三车间');
 box(s,.7,2.14,3.24,3.95,C.light);icon(s,'timer',1,2.44,.63,C.ink);txt(s,'1秒–1分钟',1,3.26,2.7,.57,29,C.ink,true);txt(s,'短暂停留',1,3.95,2.5,.37,20,C.muted);txt(s,'7±2',1,4.6,2.6,.7,45,C.ink,true);txt(s,'组块 · 经典估计',1,5.47,2.65,.39,18,C.muted);
 box(s,4.65,3.0,7.42,2.08,C.paleBlue,C.line);box(s,4.46,5.02,7.82,.17,C.ink,undefined,0);box(s,4.88,5.19,.18,.85,C.ink,undefined,0);box(s,11.68,5.19,.18,.85,C.ink,undefined,0);
 const letters=['钥匙','公式','单词','作业','晚饭'];letters.forEach((t,i)=>{const x=4.9+i*1.38;box(s,x,3.35,1.13,1.2,C.white,C.line);icon(s,['key-round','sigma','languages','notebook-pen','utensils'][i],x+.35,3.53,.4,C.blue);txt(s,t,x+.08,4.1,.97,.3,17,C.ink,true,{align:'center'});});
 icon(s,'inbox',4.85,2.15,.48,C.blue);line(s,5.5,2.4,6.1,2.9,C.blue,2,true);txt(s,'更多信息',5.6,2.1,2.2,.4,18,C.blue,true);
 box(s,11.8,5.6,.82,.54,'E9E9F2',C.line,.08,{rotate:16});txt(s,'挤出',11.85,5.67,.7,.3,16,C.muted,true,{rotate:16});line(s,12.18,4.8,12.32,5.48,C.orange,2,true);txt(s,'容量有限',8.14,5.6,3,.4,23,C.ink,true,{align:'center'});
 callout(s,'会复述、能分组，工作台就更好用。',6.44);
 note(s,'说明短时保持是临时性的；持续复述可以延长停留。屏幕上时长是便于课堂理解的近似范围，具体任务差异很大。7±2为Miller的经典估计，不是每个人固定拥有7个格子；现代工作记忆研究在一些条件下约为4组块。避免用这个数字评价学生能力。','1:30');
}
// 11 / Matched-material chunking experiment.
{
 const s=base('组块化：把信息打包得更聪明','两行使用完全相同的字母，只改变组织方式。','记忆三车间');
 pill(s,'A · 分散记',.75,2.06,1.75,C.muted,C.white,18);
 const chars='CCTVNBAUNESCO'.split('');chars.forEach((ch,i)=>{const x=.83+i*.91;box(s,x,2.7,.72,.81,C.white,C.line,.08);txt(s,ch,x,2.86,.72,.47,27,C.muted,true,{align:'center'});});
 line(s,6.66,3.65,6.66,4.07,C.purple,2,true);pill(s,'CHUNKING / 组块化',4.62,4.15,4.1,C.purple,C.light,22);
 [['CCTV','熟悉的频道'],['NBA','熟悉的联赛'],['UNESCO','联合国教科文组织']].forEach(([a,b],i)=>{const x=.84+i*4.22;box(s,x,4.94,3.8,1.1,C.paleBlue);txt(s,a,x+.18,5.08,3.44,.47,30,C.blue,true,{align:'center'});txt(s,b,x+.1,5.68,3.6,.29,16,C.muted,false,{align:'center'});});
 callout(s,'不是记住更多，而是把信息打包得更聪明。',6.44);
 note(s,'先用手或屏幕遮住下半区，给学生3秒看上排，再问能回忆几个字母；揭示下排后比较。两排字符相同：C C T V N B A U N E S C O，共13个。熟悉缩写的学生可形成3组；不熟悉UNESCO就不能自动把它当成1组。这说明组块依赖已有知识和意义，而不是任意加框。上排原教案随机字母例子已改成严格相同材料，以免材料差异造成误解。','2:30');
}
// 12 / Knowledge network.
{
 const s=base('03 长时记忆：相互连接的知识网络','容量巨大，可以长期保存；有意义的联系更容易成为线索。','记忆三车间');
 const center=[6.67,4.12];const nodes=[['古诗','book-open',1.0,2.16],['英语','languages',1.0,4.81],['人物','users',5.17,2.07],['事件','calendar-days',9.33,2.16],['技能','bike',9.33,4.81],['生活经历','image',5.17,5.2]];
 nodes.forEach(([t,ic,x,y],i)=>{line(s,center[0],center[1],x+1.5,y+.57,i%2?C.purple:C.blue,2);});
 box(s,4.75,3.28,3.84,1.77,C.ink);icon(s,'network',5.0,3.79,.62,C.white);txt(s,'意义编码',5.9,3.64,2.34,.49,27,C.white,true);txt(s,'分类 · 联系 · 提取',5.2,4.4,2.94,.33,17,C.white,false,{align:'center'});
 nodes.forEach(([t,ic,x,y],i)=>{box(s,x,y,3,.99,C.white,C.line);icon(s,ic,x+.22,y+.22,.5,i%2?C.purple:C.blue);txt(s,t,x+.98,y+.25,1.9,.5,23,C.ink,true);});
 pill(s,'容量巨大',.9,6.48,2.4,C.blue,C.paleBlue,20);pill(s,'长期保存',4.45,6.48,2.4,C.purple,C.light,20);pill(s,'有联系，更好提取',8.0,6.48,4.44,C.ink,C.light,20);
 note(s,'长时记忆包括事实、事件、技能等不同形式，图中只作生活化分类而非严格分类学。问：学“春天”的诗能连到哪些画面、情绪或生活经历？记忆不是整齐独立的文件夹，网络表示知识之间的联系。长期保存不等于永久准确、随时可提取。','1:15');
}
// 13 / Loss map.
{
 const s=base('信息为什么没有留下？','遗忘可能发生在不同环节。先找到“漏点”，再选策略。','理解遗忘');overview(s,{loss:true});
 txt(s,'找漏点：刚刚没听进去？当时没弄懂？学过后很少再提取？',.82,6.65,11.7,.3,18,C.ink,true,{align:'center'});
 note(s,'让学生把“背了就忘”拆分：是从未注意、没有形成联系、还是后续缺少提取？图是策略诊断地图，不是遗忘的完整科学解释。干扰、提取线索不足、情境变化等也可能造成想不起来；想不起来未必等于痕迹已完全消失。','1:15');
}
// 14 / Real native editable chart, no rasterization of chart.
{
 const s=base('艾宾浩斯遗忘曲线：先快后慢','把复习安排在“快要忘”的路上。','记忆升级');
 const labels=Array.from({length:33},(_,i)=>String(i));
 const unreviewed=labels.map((_,i)=>Math.round(20+80*Math.exp(-i/5.2)));
 const reviewed=labels.map((_,i)=>{if(i<5)return unreviewed[i];if(i<13)return Math.round(62+35*Math.exp(-(i-5)/5));if(i<25)return Math.round(72+26*Math.exp(-(i-13)/9));return Math.round(85+14*Math.exp(-(i-25)/10));});
 s.addChart(p.ChartType.line,[{name:'未复习 · 示意',labels,values:unreviewed},{name:'间隔复习 · 示意',labels,values:reviewed}],{
 x:.72,y:2.66,w:8.24,h:3.37,showLegend:false,showTitle:false,showValue:false,chartColors:[C.muted,C.blue],showBorder:false,
 lineSize:3,lineSmooth:true,lineDataSymbol:'none',
 catAxisHidden:true,catAxisLineShow:false,valAxisLabelFontFace:FONT,valAxisLabelFontSize:14,valAxisLabelColor:C.muted,valAxisMinVal:0,valAxisMaxVal:100,valAxisMajorUnit:50,valAxisLineShow:false,valGridLine:{color:'E7E7F1',width:1},
 layout:{x:.08,y:.08,w:.87,h:.83},
 altText:'遗忘先快后慢；在当天、第2天、第7天复习后保持程度重新升高。教学示意，横轴不按实际时间比例。'
 });
 txt(s,'记忆保持（示意）',.85,2.09,3.2,.3,16,C.muted);
 line(s,4.15,2.27,4.55,2.27,C.muted,3);txt(s,'未复习',4.68,2.08,1.2,.34,16,C.muted);line(s,6.3,2.27,6.7,2.27,C.blue,3);txt(s,'间隔复习',6.83,2.08,1.7,.34,16,C.blue);
 // Labels align to the near-vertical lifts. The time axis is deliberately schematic.
 [['学后',1.14],['当天',2.3],['第2天',4.07],['第7天',6.76],['更久',8.16]].forEach(([t,x])=>txt(s,t,x,6.05,.85,.3,16,C.muted,false,{align:'center'}));
 txt(s,'教学示意 · 时间轴非等比例',.85,2.43,7.8,.26,16,C.muted);
 box(s,9.25,2.16,3.35,4.16,C.light);icon(s,'rotate-ccw',9.56,2.44,.56,C.ink);txt(s,'复习，让曲线\n重新抬高',9.56,3.18,2.72,.96,25,C.ink,true);['当天','第2天','第7天'].forEach((t,i)=>pill(s,t,9.57,4.48+i*.48,2.7,C.blue,C.white,19));
 callout(s,'不要等忘光了，再从头学一次。',6.49);
 note(s,'图表是可编辑的PowerPoint原生折线图，数值是教学示意，并非艾宾浩斯原始实验数据或个人预测。关键规律是早期遗忘较快、随后放缓；在间隔中主动提取可帮助保持。当日、第2天、第7天为可执行的示例安排，需按难度、掌握情况和考试时间调整，不是普适最佳间隔。可以让学生说出下次要复习的一项内容。','2:00');
}
// 15 / An output cycle with concrete subject tasks.
{
 const s=base('主动输出：试着把它讲明白','费曼学习法 · 用简单的话解释，再回到卡住的地方。','记忆升级');
 const pts=[[.84,2.25],[4.98,2.25],[9.12,2.25],[9.12,4.25],[4.98,4.25],[.84,4.25]];
 const labs=[['book-open','学习'],['book-x','合上书'],['message-circle','讲出来'],['circle-help','发现卡住'],['search','回去检查'],['refresh-cw','再次表达']];
 [[4.2,2.8,4.91,2.8],[8.34,2.8,9.05,2.8],[10.78,3.38,10.78,4.18],[9.06,4.8,8.36,4.8],[4.92,4.8,4.23,4.8],[2.5,4.18,2.5,3.4]].forEach(c=>line(s,...c,C.ink,2,true));
 pts.forEach(([x,y],i)=>{box(s,x,y,3.32,1.1,i===3?C.paleOrange:C.white,C.line);icon(s,labs[i][0],x+.2,y+.28,.51,i===3?C.orange:C.ink);txt(s,labs[i][1],x+.96,y+.28,2.14,.53,23,C.ink,true);});
 txt(s,'能讲明白，才是真的会。',2.5,3.64,8.3,.44,26,C.ink,true,{align:'center'});
 [['英语','用新词造句'],['历史','讲清因果'],['数学','解释每一步']].forEach(([a,b],i)=>{const x=.84+i*4.14;box(s,x,5.94,3.32,.73,C.light);txt(s,a,x+.18,6.09,.72,.4,18,C.purple,true);txt(s,b,x+1,6.09,2.12,.4,18,C.ink);});
 note(s,'中心句是学习提醒，不是严格的能力判断：清楚讲解是检验理解的一种方式，表达困难也可能来自紧张、语言或提取困难。可示范“负数相减为什么变成加法”中解释卡住的一步，回去查后再讲。鼓励用自己的话，不背定义。','1:30');
}
// 16 / Emotional salience comparison, schematic anatomy.
{
 const s=base('情绪，让某些记忆更鲜明','惊喜、快乐、适度紧张和成就感，都可能成为记忆线索。','记忆升级');
 box(s,.72,2.16,5.45,2.38,C.white,C.line);box(s,6.62,2.16,5.98,2.38,C.paleOrange);
 icon(s,'calendar',1.0,2.54,.6,C.muted);txt(s,'普通的一天',1.91,2.51,3.75,.45,24,C.muted,true);line(s,1.12,3.7,5.7,3.7,'BCBDCC',3,true);dot(s,2.2,3.7,.08,'BCBDCC');dot(s,4.5,3.7,.08,'BCBDCC');
 icon(s,'award',6.92,2.54,.6,C.orange);txt(s,'第一次被全班鼓掌',7.84,2.51,4.32,.45,24,C.ink,true);line(s,7.06,3.7,12.13,3.7,C.orange,6,true);[7.5,9.2,11.35].forEach(x=>dot(s,x,3.7,.13,C.orange));
 svg(s,'brain',.95,4.78,2.49,1.87);dot(s,2.37,5.92,.13,C.orange);line(s,2.54,5.92,3.68,5.55,C.orange,1.8,true);txt(s,'杏仁核',3.82,5.1,1.6,.46,22,C.ink,true);txt(s,'与情绪加工有关\n位置为简化示意',3.82,5.7,2.8,.76,17,C.muted);
 [['惊喜',6.98],['快乐',8.35],['成就感',9.72]].forEach(([t,x])=>pill(s,t,x,4.97,1.22,C.ink,C.white,18));txt(s,'更鲜明 ≠ 更准确',6.98,5.63,5.2,.58,28,C.ink,true);txt(s,'压力过大，反而可能妨碍回忆。',6.98,6.28,5.3,.37,18,C.muted);
 note(s,'杏仁核位于颞叶内侧，图为侧面脑的简化投影位置，并非可见于脑表面；情绪记忆涉及杏仁核与海马等网络的协作。情绪可以影响注意、编码与巩固，但强烈情绪不保证准确，过强压力可能干扰学习和回忆。不通过制造恐惧、羞辱或高压强化记忆；可用兴趣、成就感、个人意义参与。','1:30');
}
// 17 / Question-based learning, two paths.
{
 const s=base('好奇心：给阅读一个寻找的方向','同样打开书，不同的起点，会带来不同的加工。','记忆升级');
 const paths=[{y:2.35,label:'没有问题',c:C.muted,fill:'EEEEF3',labs:[['book-open','打开书'],['eye','看一遍'],['eye','再看一遍'],['cloud-off','很快忘记']]},{y:4.53,label:'先带着问题',c:C.ink,fill:C.light,labs:[['circle-help','提出问题'],['search','寻找答案'],['network','产生连接'],['lightbulb','理解表达']]}];
 paths.forEach(o=>{pill(s,o.label,.73,o.y,2.08,o.c,o.fill,18);o.labs.forEach(([ic,t],i)=>{const x=3.18+i*2.4;box(s,x,o.y-.02,2.07,1.35,C.white,C.line);icon(s,ic,x+.79,o.y+.17,.48,o.c);txt(s,t,x+.1,o.y+.86,1.87,.36,19,o.c,true,{align:'center'});if(i<3)line(s,x+2.08,o.y+.64,x+2.35,o.y+.64,o.c,1.7,true);});});
 txt(s,'例：为什么“夏天”北半球白天更长？',3.24,6.12,9.18,.43,20,C.ink,true);callout(s,'带着问题学，让知识有地方连接。',6.5);
 note(s,'普通阅读也可能有效，图中是对低投入、机械重复阅读的示意，并非每次看两遍都会遗忘。请学生把一个课题改成问题：历史事件为什么发生？数学这个步骤为什么成立？好奇心可以促进注意和探索，但仍需可靠资料、理解与练习。','1:15');
}
// 18 / Four reinforcing routes, second hero infographic.
{
 const s=base('记忆升级地图','四条路径，一起帮助重要的信息留下来。','记忆升级');
 const nodes=[{x:.8,y:2.15,ic:'calendar-check',t:'重复复习',sub:'隔一段时间，再提取一次',col:C.blue},{x:8.95,y:2.15,ic:'message-circle',t:'主动输出',sub:'合上书，用自己的话说',col:C.ink},{x:.8,y:4.75,ic:'heart-handshake',t:'情绪参与',sub:'寻找兴趣、意义与成就感',col:C.blue},{x:8.95,y:4.75,ic:'circle-help',t:'主动提问',sub:'先问为什么，再找联系',col:C.ink}];
 // Four paths meet at the storage network; the elbow joints stay visible.
 [[4.4,2.925,4.72,2.925,4.72,3.62,5.01,3.62],[8.95,2.925,8.62,2.925,8.62,3.62,8.33,3.62],[4.4,5.525,4.72,5.525,4.72,4.6,5.01,4.6],[8.95,5.525,8.62,5.525,8.62,4.6,8.33,4.6]].forEach((a,i)=>{line(s,a[0],a[1],a[2],a[3],i%2?C.ink:C.blue,2.2);line(s,a[2],a[3],a[4],a[5],i%2?C.ink:C.blue,2.2);line(s,a[4],a[5],a[6],a[7],i%2?C.ink:C.blue,2.2,true);dot(s,a[2],a[3],.05,i%2?C.ink:C.blue);});
 box(s,5.05,3.0,3.24,2.43,C.light);svg(s,'brain',5.2,3.12,2.94,2.2);box(s,4.95,4.88,3.44,.59,C.ink);txt(s,'LONG-TERM MEMORY',5.04,5.02,3.26,.25,16,C.white,true,{align:'center'});txt(s,'长时记忆',5.55,5.68,2.24,.38,22,C.ink,true,{align:'center'});
 nodes.forEach(n=>{box(s,n.x,n.y,3.6,1.55,C.white,C.line);icon(s,n.ic,n.x+.22,n.y+.26,.56,n.col);txt(s,n.t,n.x+1.02,n.y+.26,2.34,.45,24,n.col,true);txt(s,n.sub,n.x+.22,n.y+.99,3.16,.31,16,C.muted);});
 txt(s,'先注意到 → 再理解它 → 多次把它想起来',.9,6.6,11.5,.35,22,C.ink,true,{align:'center'});
 note(s,'请学生用手指选一条自己最少使用的路径。强调四种方法可以组合，不是保证所有内容永不忘记的配方。重复复习尽量包含主动回忆，而非只重复盯着材料。','1:30');
}
// 19 / Restrained sticky wall with actionable discussion.
{
 const s=base('我的记忆困扰墙','先选一个最像自己的，再补充一个真实情境。','小组活动');
 const notes=[['背了就忘','背完古诗，隔天只剩开头'],['考试突然空白','走出考场又想起来了'],['单词记不住','看着认识，合上就不会'],['公式混淆','知道公式，却选错了'],['古诗背串','上下句总和另一首混在一起'],['知道却说不出','答案就在嘴边，表达卡住了']];
 notes.forEach(([a,b],i)=>{const x=.82+(i%3)*4.22,y=2.18+Math.floor(i/3)*1.74;box(s,x,y,3.8,1.42,i===0||i===4?C.paleBlue:C.light);box(s,x+.2,y,.5,.06,i%2?C.ink:C.blue,undefined,0);txt(s,a,x+.25,y+.26,3.3,.44,24,C.ink,true);txt(s,b,x+.25,y+.92,3.3,.32,17,C.muted);});
 box(s,.83,5.92,11.68,.74,C.white,C.line);icon(s,'plus',1.04,6.07,.38,C.ink);txt(s,'我的补充：在 __________ 的时候，我常常 __________。',1.7,6.08,10.4,.4,21,C.ink,true);
 note(s,'4人一组。每人用20秒说一个具体困扰，不使用“我记性就是差”这样的整体标签。组员先判断可能卡在注意、加工或后续提取的哪一环，再选两条策略。不要要求公开敏感或创伤经历。','3:00');
}
// 20 / Fillable native template.
{
 const s=base('我的记忆升级计划','把“我要努力”变成一次具体行动。','小组活动');
 box(s,.8,2.14,5.57,3.96,C.white,C.line);txt(s,'01 我的困扰',1.08,2.39,4.9,.45,24,C.ink,true);line(s,1.1,3.44,6.02,3.44,C.line,1.3);txt(s,'02 我准备应用在',1.08,3.91,4.9,.45,24,C.ink,true);line(s,1.1,4.96,5.12,4.96,C.line,1.3);txt(s,'学科',5.3,4.5,.72,.42,20,C.muted);txt(s,'把情境说具体：哪一章、哪一类题？',1.1,5.5,4.92,.35,17,C.muted);
 box(s,6.75,2.14,5.77,3.96,C.light);txt(s,'03 我准备使用',7.03,2.39,5.1,.45,24,C.ink,true);['策略 1','策略 2'].forEach((t,i)=>{pill(s,t,7.04,3.16+i*.78,1.23,C.ink,C.white,18);line(s,8.52,3.56+i*.78,12.1,3.56+i*.78,C.line,1.3);});txt(s,'04 下一次行动',7.03,4.95,5.1,.45,24,C.ink,true);line(s,7.05,5.82,12.1,5.82,C.ink,1.3);
 pill(s,'什么时候？',.9,6.38,2.02,C.blue,C.paleBlue,18);pill(s,'做什么？',3.14,6.38,2.02,C.blue,C.paleBlue,18);pill(s,'怎样检查？',5.38,6.38,2.02,C.ink,C.light,18);txt(s,'例：明晚合上书，讲出3个历史事件的因果。',7.69,6.34,4.71,.55,17,C.muted);
 note(s,'每组讨论后，每人完成自己的计划。示例：困扰—英语单词隔天忘；策略—间隔复习+主动输出；行动—明晚遮住中文写5个词，再用其中2个造句；检查—第2天和第7天尝试回忆。请1至2名同学分享。此页的空白线和文字均可编辑，可另行打印。','5:00');
}
// 21 / Reunited map and retrieval exit ticket.
{
 const s=base('把整座“记忆工厂”装进脑中','记忆的关键，不只在“看过”，更在如何加工与提取。','课程回顾');overview(s,{summary:true});
 note(s,'先请学生不看笔记，口述信息经过哪三个阶段。再请同桌指出注意、理解加工、复习输出分别帮助什么。最后做退出条：写出一个“漏点”和一次可在24小时内完成的行动。可根据课堂时间遮挡关键词进行回忆。','2:45');
}
// 22 / Closure is a complete compact map, echoing cover.
{
 const s=base('遗忘，是大脑的正常工作方式。','学会记忆，不是要求自己过目不忘，','带走一张地图');
 txt(s,'而是学会让重要的信息留下来。',.6,1.95,12.1,.62,31,C.ink,true);
 box(s,4.87,2.89,3.6,2.93,C.light);svg(s,'brain',5.1,3.0,3.14,2.36);pill(s,'重要的信息',5.48,5.25,2.38,C.ink,C.white,18);
 const ends=[['eye','注意',1.15,3.09],['network','理解',1.15,5.07],['refresh-cw','复习',9.6,3.09],['message-circle','输出',9.6,5.07]];
 ends.forEach(([ic,t,x,y],i)=>{box(s,x,y,2.58,.96,C.white,C.line);icon(s,ic,x+.2,y+.23,.49,i<2?C.blue:C.ink);txt(s,t,x+.95,y+.21,1.4,.5,24,C.ink,true);line(s,i<2?x+2.62:x-.04,y+.48,i<2?4.83:8.5,4.2+(i%2)*.8,C.line,2,true);});
 callout(s,'今天带走的，不是“记性好坏”的标签，而是一种可尝试的方法。',6.44);
 note(s,'收束：遗忘很常见，今天学习的是可改变的策略。邀请学生在课后实行自己的下一次行动，下一节用简短回顾交流。若学生提出持续明显影响生活的记忆问题，课后个别了解，并按学校支持流程处理。','0:30');
}
fs.writeFileSync(path.join(root,'src','layout-audit.json'),JSON.stringify({size:{w:W,h:H},font:FONT,slides:slideNo,textBoxes:audit},null,2));
// PptxGenJS in Node preserves the SVG but can write SVG bytes into its PNG
// fallback entry. Supply genuine PNG fallback bytes for older Office viewers.
(async()=>{
 const file=path.join(root,'大脑记忆工厂.pptx');
 await p.writeFile({fileName:file});
 const zip=await JSZip.loadAsync(fs.readFileSync(file));
 const pngs=Object.values(zip.files).filter(f=>f.name.startsWith('ppt/media/')&&f.name.endsWith('.png'));
 const cache=new Map();let fixed=0;
 for(const f of pngs){const raw=await f.async('nodebuffer');if(raw.subarray(0,800).toString().includes('<svg')){const key=raw.toString();if(!cache.has(key))cache.set(key,await sharp(raw,{density:192}).resize({width:raw.length>1200?960:192}).png().toBuffer());zip.file(f.name,cache.get(key));fixed++;}}
 fs.writeFileSync(file,await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));
 console.log(`Built ${slideNo} editable slides; generated ${fixed} genuine PNG fallbacks while retaining SVGs.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
