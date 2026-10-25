/* Original, deterministic Chopper fan animation. All geometry and acting are authored here.
   Three.js renders a real articulated model; GSAP controls its emotional and camera beats. */
import * as THREE from './assets/vendor/three.module.js';
const W=1920,H=1080,PI=Math.PI,TAU=PI*2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,t)=>{const x=clamp((t-a)/(b-a));return x*x*(3-2*x)};
const hash=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)};
const canvas=document.getElementById('world');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setSize(W,H);renderer.setPixelRatio(1);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#f2ddbb');
scene.fog=new THREE.Fog('#eedcc1',19,39);
const camera=new THREE.PerspectiveCamera(34,W/H,.1,80);
scene.add(camera);
const captionMaterial=new THREE.MeshBasicMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
const caption=new THREE.Mesh(new THREE.PlaneGeometry(1.0872,.0792),captionMaterial);caption.position.set(0,-.2602,-1);caption.renderOrder=99999;caption.visible=false;camera.add(caption);
const captionTextures=new Map();
const S={t:0,cx:5.1,cy:3.6,cz:10.8,tx:0,ty:2.15,tz:0,headYaw:.08,headTilt:0,deny:0,joy:0,dance:0,blush:0,peek:0};
const tl=gsap.timeline({paused:true});
tl.to(S,{t:15,duration:15,ease:'none'},0)
 .to(S,{cx:4.25,cy:3.4,cz:9.2,ty:2.3,duration:3.3,ease:'sine.inOut'},0)
 .to(S,{headYaw:-.38,headTilt:.09,duration:.32,ease:'back.out(1.5)'},1.18)
 .to(S,{headYaw:.31,headTilt:-.09,deny:1,blush:.3,duration:.28,ease:'back.out(2.3)'},2.36)
 .to(S,{headYaw:.08,duration:.4,ease:'sine.inOut'},3.2)
 .to(S,{cx:1.55,cy:.78,cz:5.0,ty:.64,duration:1.1,ease:'power2.inOut'},3.95)
 .to(S,{dance:.25,blush:.5,duration:1.2,ease:'power2.in'},4.0)
 .to(S,{cx:3.6,cy:3.05,cz:10.2,ty:2.1,duration:1.4,ease:'power2.inOut'},5.45)
 .to(S,{dance:1,joy:.75,deny:.4,blush:1,headYaw:0,duration:2.0,ease:'power1.inOut'},5.7)
 .to(S,{cx:-1.0,cy:3.3,cz:10.3,ty:2.25,duration:2.5,ease:'sine.inOut'},7.0)
 .to(S,{joy:1,deny:0,duration:1.1,ease:'sine.inOut'},8.6)
 .to(S,{cx:1.05,cy:3.15,cz:9.0,ty:2.05,duration:1.65,ease:'power2.inOut'},9.5)
 .to(S,{dance:.06,joy:.20,deny:.65,peek:1,headTilt:.12,duration:.2,ease:'power3.out'},11.9)
 .to(S,{joy:1,deny:0,dance:.75,headTilt:-.12,peek:0,duration:.32,ease:'back.out(1.8)'},12.74)
 .to(S,{cx:.25,cy:3.3,cz:6.0,ty:2.9,duration:1.9,ease:'sine.inOut'},12.6)
 .to(S,{dance:.45,headTilt:.06,duration:.5,ease:'sine.inOut'},14.3);

const mat=(color,roughness=.75)=>new THREE.MeshStandardMaterial({color,roughness,metalness:0});
const fur=mat('#b07843',.92),furLight=mat('#c7955a',.93),muzzleMat=mat('#e4bf83',.95),hoofMat=mat('#503026',.72);
const hatMat=mat('#e66c99',.86),hatEdge=mat('#c74b7b',.83),hatPale=mat('#f28db0',.9),ivory=mat('#fff4d5',.7);
const hornMat=mat('#956548',.88),hornTip=mat('#a77b56',.87),blue=mat('#35a9d3',.2);
const black=mat('#241a19',.22),white=mat('#fffdf0',.15),mouthMat=mat('#5e2029',.82),tongueMat=mat('#ef8895',.8);
const blushMat=new THREE.MeshStandardMaterial({color:'#dd8278',roughness:1,transparent:true,opacity:.01,depthWrite:false});
const teal=mat('#448b8d'),wood=mat('#a8693e'),woodLight=mat('#d5a56d'),brass=new THREE.MeshStandardMaterial({color:'#c79846',roughness:.44,metalness:.48});
const meshes=[];
function sphere(parent,name,pos,scale,material,segments=32){
 const o=new THREE.Mesh(new THREE.SphereGeometry(1,segments,24),material);o.name=name;o.position.set(...pos);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);meshes.push(o);return o;
}
function box(parent,name,pos,size,material){const o=new THREE.Mesh(new THREE.BoxGeometry(...size),material);o.name=name;o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function cylinder(parent,name,pos,r1,r2,height,material,segments=48){const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,height,segments),material);o.name=name;o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function curve(parent,name,points,r,material){const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const o=new THREE.Mesh(new THREE.TubeGeometry(path,Math.max(12,points.length*7),r,8,false),material);o.name=name;o.castShadow=true;parent.add(o);return o}
function torus(parent,name,pos,r,tube,material){const o=new THREE.Mesh(new THREE.TorusGeometry(r,tube,12,80),material);o.name=name;o.position.set(...pos);o.castShadow=true;parent.add(o);return o}
function roundedBox(parent,name,pos,w,h,d,r,material){
 const shape=new THREE.Shape();shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);shape.lineTo(-w/2+r,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
 const g=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSize:r*.25,bevelThickness:r*.25,bevelSegments:3,steps:1});g.translate(0,0,-d/2);
 const o=new THREE.Mesh(g,material);o.position.set(...pos);o.name=name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
}
function planeShape(parent,name,shape,material,z=0){const m=new THREE.Mesh(new THREE.ShapeGeometry(shape,32),material);m.name=name;m.position.z=z;parent.add(m);return m}
function tubeBetween(mesh,a,b,r){const d=new THREE.Vector3().subVectors(b,a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.set(r,d.length(),r);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize())}
function textureCanvas(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex}

// Light: large warm key, blue sea fill, warm aft rim. Rough surfaces retain shape.
scene.add(new THREE.HemisphereLight('#fff2d8','#b68c67',2.2));
const key=new THREE.DirectionalLight('#ffedc9',3.4);key.position.set(-4,8,7);key.castShadow=true;
key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-9;key.shadow.camera.right=9;key.shadow.camera.top=10;key.shadow.camera.bottom=-6;key.shadow.camera.near=.1;key.shadow.camera.far=30;key.shadow.bias=-.0003;key.shadow.normalBias=.025;key.shadow.radius=3;
scene.add(key);const fill=new THREE.DirectionalLight('#bce9f3',1.2);fill.position.set(5,4,1);scene.add(fill);
const rim=new THREE.DirectionalLight('#ffe5b6',2.1);rim.position.set(-3,5,-5);scene.add(rim);

// Ship's small infirmary: physical set, relative depth and parallax throughout.
const set=new THREE.Group();scene.add(set);
const grainTex=textureCanvas(256,512,(x,w,h)=>{x.fillStyle='#c59159';x.fillRect(0,0,w,h);for(let i=0;i<260;i++){x.strokeStyle=`rgba(${hash(i)>.5?'83,41,19':'246,209,153'},${.03+hash(i+2)*.09})`;x.lineWidth=.4+hash(i+1)*2;x.beginPath();const yy=hash(i+3)*h;x.moveTo(0,yy);for(let j=1;j<=8;j++)x.lineTo(j*w/8,yy+Math.sin(j*.7+i)*4);x.stroke()}});
grainTex.wrapS=grainTex.wrapT=THREE.RepeatWrapping;
const plankMat=new THREE.MeshStandardMaterial({map:grainTex,roughness:.92,color:'#f5dab1'});
for(let i=-9;i<=9;i++){const p=box(set,'deck-plank-'+i,[i*1.2,-.085,-1],[1.18,.16,18],plankMat);p.receiveShadow=true;}
box(set,'ivory-cabin-wall',[0,3,-4.7],[24,9,.2],mat('#f7dfb6'));
box(set,'lower-timber-wall',[0,.7,-4.5],[24,1.4,.2],woodLight);
box(set,'wall-rail',[0,1.48,-4.32],[24,.12,.16],wood);
for(let i=-6;i<=6;i++)box(set,'wall-panel-seam',[i*1.5,.7,-4.34],[.035,1.35,.03],wood);
box(set,'port-vertical-beam',[-5.9,3,-3.5],[.36,7,.45],wood);
const windowGroup=new THREE.Group();windowGroup.position.set(-3.4,3.1,-4.29);set.add(windowGroup);
const seaCanvas=document.createElement('canvas');seaCanvas.width=512;seaCanvas.height=512;const seaCtx=seaCanvas.getContext('2d');
const seaTex=new THREE.CanvasTexture(seaCanvas);seaTex.colorSpace=THREE.SRGBColorSpace;
const sea=new THREE.Mesh(new THREE.CircleGeometry(1.45,80),new THREE.MeshBasicMaterial({map:seaTex}));windowGroup.add(sea);
torus(windowGroup,'brass-porthole',[0,0,.02],1.5,.14,brass);torus(windowGroup,'porthole-inner-ring',[0,0,.08],1.39,.035,wood);
for(let i=0;i<12;i++){const a=i/12*TAU;sphere(windowGroup,'porthole-bolt',[Math.cos(a)*1.51,Math.sin(a)*1.51,.15],[.042,.042,.035],ivory,12)}
const cabinet=roundedBox(set,'medical-cabinet',[3.6,1.58,-3.7],2.55,3.05,.66,.09,teal);
box(set,'cabinet-inset',[3.6,1.84,-3.30],[2.17,2.25,.05],mat('#30686d'));
for(const y of [.88,1.63,2.42,3.0])box(set,'shelf',[3.6,y,-3.0],[2.32,.1,.7],woodLight);
for(const x of [2.4,4.8])box(set,'cabinet-post',[x,1.75,-3.0],[.12,2.66,.12],teal);
const bottleRigs=[];
function bottle(x,y,z,r,h,color,index){const g=new THREE.Group();g.position.set(x,y,z);g.userData={baseY:y,index};set.add(g);
 cylinder(g,'medicine-bottle',[0,h*.43,0],r*.92,r,h*.78,mat(color,.30),32);sphere(g,'bottle-shoulder',[0,h*.79,0],[r*.92,h*.16,r*.92],mat(color,.32),20);
 cylinder(g,'bottle-neck',[0,h*.95,0],r*.52,r*.52,h*.18,ivory,24);cylinder(g,'bottle-cork',[0,h*1.06,0],r*.60,r*.6,h*.1,wood,24);
 roundedBox(g,'cream-bottle-label',[0,h*.45,r*.97],r*1.6,h*.28,.015,.015,ivory);
 box(g,'label-cross-v',[0,h*.45,r+ .014],[r*.2,h*.19,.012],mat('#bf6564'));box(g,'label-cross-h',[0,h*.45,r+ .025],[r*.8,h*.055,.012],mat('#bf6564'));
 bottleRigs.push(g);return g;
}
for(let i=0;i<8;i++)bottle(2.85+(i%3)*.64,.95+Math.floor(i/3)*.75,-2.96,.11+(i%2)*.025,.34+(i%3)*.06,['#a66537','#4c998c','#c38c3c'][i%3],i);
const table=new THREE.Group();table.position.set(-3.55,0,1.4);set.add(table);
roundedBox(table,'medical-side-table',[0,.78,0],1.9,.14,1.2,.07,woodLight);
for(const x of [-.7,.7])for(const z of [-.4,.4])cylinder(table,'table-leg',[x,.35,z],.06,.08,.75,wood,16);
const bag=new THREE.Group();bag.position.set(-3.55,.9,1.4);set.add(bag);
roundedBox(bag,'doctor-bag',[0,.34,0],1.14,.65,.60,.13,mat('#efe4bf'));
torus(bag,'bag-handle',[0,.75,0],.19,.055,wood).scale.set(1,.7,1);
box(bag,'bag-cross-v',[0,.35,.33],[.11,.32,.04],mat('#bd6865'));box(bag,'bag-cross-h',[0,.35,.34],[.32,.11,.04],mat('#bd6865'));
const book=roundedBox(set,'medical-book',[2.7,.16,1.0],1.12,.16,.78,.03,teal);book.rotation.y=-.25;
const cottonBowl=cylinder(set,'cotton-bowl',[3.6,.13,1.5],.48,.33,.25,ivory,40);
for(let i=0;i<7;i++)sphere(set,'cotton-ball',[3.6+Math.cos(i*2.4)*.24,.33+hash(i)*.13,1.5+Math.sin(i*2.4)*.21],[.15,.13,.15],ivory,16);
// A warm oval contact shadow anchors the little feet, including during the reveal.
const shadowTex=textureCanvas(128,128,(x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,3,w/2,h/2,w*.48);g.addColorStop(0,'rgba(53,28,15,.4)');g.addColorStop(1,'rgba(53,28,15,0)');x.fillStyle=g;x.fillRect(0,0,w,h)});
const contact=new THREE.Mesh(new THREE.PlaneGeometry(3.1,2.4),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}));contact.rotation.x=-PI/2;contact.position.y=.008;scene.add(contact);

// An articulated chibi model: large reindeer head, classic stovepipe hat and blue nose.
const chopper=new THREE.Group();scene.add(chopper);
const torso=new THREE.Group();chopper.add(torso);
sphere(torso,'furry-body',[0,1.13,0],[.56,.72,.43],fur);
sphere(torso,'soft-chest',[0,1.23,.36],[.35,.42,.10],furLight);
const shortsMat=mat('#9c3e4b');
roundedBox(torso,'shorts-waist',[0,.77,0],1.02,.25,.77,.10,shortsMat);
for(const x of [-.255,.255])roundedBox(torso,'shorts-leg',[x,.60,0],.49,.36,.76,.09,shortsMat);
box(torso,'waistband',[0,.87,.01],[1.03,.08,.72],mat('#d46c7b'));
for(const x of [-.49,.49])sphere(torso,'shorts-button',[x,.74,.40],[.035,.035,.024],brass,12);
const backpack=new THREE.Group();backpack.position.set(0,1.35,-.44);torso.add(backpack);
roundedBox(backpack,'blue-backpack',[0,0,-.08],.76,.77,.33,.16,mat('#4d9eaf'));
const roll=cylinder(backpack,'rolled-blanket',[0,.41,-.08],.15,.15,.98,mat('#b9cbd1'));roll.rotation.z=PI/2;
for(const x of [-.36,.36])curve(torso,'backpack-strap',[[x,1.74,-.3],[x*.95,1.68,.29],[x*.9,.98,.42]],.035,mat('#377f92'));
const head=new THREE.Group();head.position.y=2.47;torso.add(head);
sphere(head,'head',[0,0,0],[1.12,.96,.86],furLight,48);
sphere(head,'muzzle',[0,-.30,.70],[.69,.40,.23],muzzleMat,40);
for(const side of [-1,1]){
 const ear=new THREE.Group();ear.position.set(side*1.05,.26,-.05);ear.rotation.z=side*.19;head.add(ear);
 sphere(ear,'ear',[side*.16,0,0],[.36,.17,.12],fur);sphere(ear,'inner-ear',[side*.19,.005,.09],[.23,.09,.025],mat('#d59e85'));
 // Three small cheek tufts, each following head motion instead of a decorative particle coat.
 for(let j=0;j<3;j++){const tuft=sphere(head,'cheek-tuft',[side*(.95+j*.025),-.20-j*.13,.05],[.20,.12,.12],furLight,16);tuft.rotation.z=side*(.3+j*.12)}
}
const hat=new THREE.Group();hat.position.y=.66;head.add(hat);
cylinder(hat,'pink-hat-brim',[0,0,0],1.31,1.31,.15,hatMat,80);
const brimRim=torus(hat,'brim-piping',[0,0,0],1.27,.065,hatEdge);brimRim.rotation.x=PI/2;
cylinder(hat,'pink-stovepipe',[0,.50,0],1.00,1.045,.92,hatMat,80);
sphere(hat,'soft-hat-top',[0,.97,0],[1.0,.085,1.0],hatPale,48);
const topRim=torus(hat,'hat-top-seam',[0,.95,0],.98,.025,hatEdge);topRim.rotation.x=PI/2;
const crossShape=new THREE.Shape(),cw=.075,cl=.34;
[[-cw,-cl],[cw,-cl],[cw,-cw],[cl,-cw],[cl,cw],[cw,cw],[cw,cl],[-cw,cl],[-cw,cw],[-cl,cw],[-cl,-cw],[-cw,-cw]].forEach((p,i)=>i?crossShape.lineTo(...p):crossShape.moveTo(...p));crossShape.closePath();
const cross=new THREE.Mesh(new THREE.ExtrudeGeometry(crossShape,{depth:.035,bevelEnabled:true,bevelSize:.012,bevelThickness:.01,bevelSegments:2,steps:1}),ivory);cross.position.set(0,.50,1.03);cross.rotation.z=PI/4;hat.add(cross);
// Visible stitches on the brim are deliberately quiet.
for(let i=0;i<30;i++){const a=i/30*TAU;const stitch=sphere(hat,'hat-stitch',[Math.cos(a)*1.21,.081,Math.sin(a)*1.21],[.012,.012,.025],hatPale,8);stitch.rotation.y=-a;}
const antlers=[];
for(const side of [-1,1]){
 const g=new THREE.Group();g.position.set(side*.91,.98,-.25);head.add(g);antlers.push(g);
 const P=(x,y,z=0)=>[side*x,y,z];
 curve(g,'antler-main',[P(0,0),P(.38,.05),P(.64,.34),P(.81,.67),P(.94,.86)],.095,hornMat);
 curve(g,'antler-tine-inner',[P(.37,.05),P(.33,.42),P(.30,.60)],.075,hornMat);
 curve(g,'antler-tine-outer',[P(.64,.34),P(1.04,.38),P(1.20,.61)],.078,hornMat);
 for(const p of [P(.94,.86),P(.30,.60),P(1.20,.61)])sphere(g,'antler-rounded-tip',p,[.076,.085,.076],hornTip,16);
}
const nose=sphere(head,'blue-nose',[0,-.14,.959],[.18,.132,.132],blue,32);
sphere(head,'nose-highlight',[-.045,-.10,1.072],[.035,.020,.012],white,12);
const eyeRigs=[],closedEyes=[],brows=[];
for(const side of [-1,1]){
 const e=new THREE.Group();e.position.set(side*.46,.10,.761);e.rotation.y=side*.19;head.add(e);eyeRigs.push(e);
 sphere(e,'black-eye',[0,0,.025],[.135,.19,.075],black,32);
 sphere(e,'eye-sparkle',[-.035,.064,.089],[.041,.049,.018],white,16);
 sphere(e,'eye-small-sparkle',[.035,-.055,.09],[.018,.022,.012],ivory,12);
 const ce=curve(head,'smiling-closed-eye',[[side*.46-.19,.08,.805],[side*.46-.10,.20,.83],[side*.46,.23,.84],[side*.46+.10,.20,.83],[side*.46+.19,.08,.805]],.035,black);closedEyes.push(ce);
 const brow=curve(head,'brow',[[-.19,0,0],[0,.05,.015],[.19,0,0]],.035,fur);brow.position.set(side*.46,.40,.74);brow.rotation.z=side*-.18;brows.push(brow);
 sphere(head,'blushing-cheek',[side*.69,-.25,.772],[.23,.095,.025],blushMat,24);
}
const mouth=new THREE.Group();mouth.position.set(0,-.44,.894);head.add(mouth);
const mouthShape=new THREE.Shape();mouthShape.moveTo(-.43,.08);mouthShape.bezierCurveTo(-.22,-.015,.22,-.015,.43,.08);mouthShape.bezierCurveTo(.38,-.53,-.38,-.53,-.43,.08);
planeShape(mouth,'open-happy-mouth',mouthShape,mouthMat,.002);
const teethShape=new THREE.Shape();teethShape.moveTo(-.39,.055);teethShape.quadraticCurveTo(0,-.028,.39,.055);teethShape.quadraticCurveTo(.34,-.10,.29,-.12);teethShape.quadraticCurveTo(0,-.18,-.29,-.12);teethShape.quadraticCurveTo(-.34,-.10,-.39,.055);
planeShape(mouth,'happy-teeth',teethShape,ivory,.012);
sphere(mouth,'tongue',[0,-.29,.018],[.19,.09,.018],tongueMat,24);
const tightMouth=curve(head,'trying-not-to-smile',[[-.24,-.44,.91],[-.12,-.46,.94],[0,-.445,.96],[.12,-.46,.94],[.24,-.44,.91]],.025,hoofMat);
const armRigs=[];
for(const side of [-1,1]){
 const a=new THREE.Group();a.position.set(side*.49,1.48,0);torso.add(a);armRigs.push(a);
 sphere(a,'upper-arm',[side*.035,-.18,.02],[.18,.27,.18],fur);
 const fore=new THREE.Group();fore.position.set(side*.07,-.37,.025);a.add(fore);
 sphere(fore,'forearm',[0,-.10,.025],[.17,.22,.16],furLight);
 const hand=sphere(fore,'little-hoof',[0,-.28,.04],[.185,.15,.18],hoofMat,24);
 curve(fore,'hoof-cleft',[[0,-.41,.12],[0,-.28,.215],[0,-.20,.20]],.009,mat('#271918'));
 a.userData.fore=fore;
}
const legs=[];
for(const side of [-1,1]){
 const bone=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,24),fur);bone.castShadow=true;chopper.add(bone);
 const foot=new THREE.Group();chopper.add(foot);
 sphere(foot,'cloven-hoof',[0,.13,.045],[.24,.16,.30],hoofMat,28);
 curve(foot,'foot-cleft',[[0,.02,.28],[0,.12,.34],[0,.24,.26]],.011,mat('#241914'));
 sphere(foot,'ankle',[0,.28,0],[.16,.18,.16],furLight,24);
 legs.push({bone,foot,side});
}
// A springy tail peeks around the backpack during the side-to-side dance.
const tail=sphere(torso,'reindeer-tail',[0,.82,-.52],[.19,.20,.22],furLight,24);
const sweat=[];
for(let i=0;i<2;i++){const drop=sphere(head,'embarrassed-sweat',[1.04-i*.10,.2-i*.3,.55],[.06,.12,.05],mat('#8ccdde',.2),20);drop.visible=false;sweat.push(drop)}

function drawSea(t){
 const x=seaCtx,w=512,h=512;const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#bce3eb');g.addColorStop(.48,'#d5ece8');g.addColorStop(.49,'#58aab4');g.addColorStop(1,'#287c94');x.fillStyle=g;x.fillRect(0,0,w,h);
 x.fillStyle='rgba(255,249,221,.8)';for(let i=0;i<4;i++){const xx=((i*160+t*3)%800)-100;x.beginPath();x.ellipse(xx,130+i%2*30,56,15,0,0,TAU);x.ellipse(xx+28,122+i%2*30,31,22,0,0,TAU);x.fill();}
 for(let i=0;i<18;i++){const yy=270+i*15;x.strokeStyle=`rgba(224,247,233,${.15+i*.012})`;x.lineWidth=2;x.beginPath();for(let j=0;j<=32;j++){const xx=j*16, y=yy+Math.sin(j*.45+t*1.2+i)*3;(j?x.lineTo(xx,y):x.moveTo(xx,y));}x.stroke();}
 seaTex.needsUpdate=true;
}
function blink(t){let v=0;for(const at of [.42,2.12,4.8,7.0,11.72,13.95])v=Math.max(v,Math.exp(-(((t-at)/.065)**2)));return v;}
let lastFrameTime=-1;
function update(t){
 if(Math.abs(t-lastFrameTime)<1e-8)return;
 lastFrameTime=t;
 tl.totalTime(clamp(t,0,15),true);
 const phase=(t-4.2)*6.9,joy=S.joy,deny=S.deny;
 const stop=1-smooth(11.88,12.08,t)*(1-smooth(12.76,12.93,t));
 const dance=S.dance;
 const bounce=dance*(.07+.15*Math.abs(Math.sin(phase)))*stop;
 const shimmy=dance*Math.sin(phase*.5)*.15;
 chopper.position.x=Math.sin(phase*.5)*dance*.14;
 chopper.rotation.y=.22+shimmy*.8;
 torso.position.y=bounce;
 torso.rotation.z=shimmy*.4;
 torso.scale.set(1+bounce*.15,1-bounce*.15,1+bounce*.08);
 const headLag=Math.sin(phase*.5-.34)*dance*.075;
 head.rotation.y=S.headYaw+Math.sin(t*7.1)*deny*.055+headLag;
 head.rotation.z=S.headTilt+Math.sin(phase*.5-.5)*dance*.065;
 head.rotation.x=-.015+Math.sin(phase-.3)*dance*.025;
 hat.rotation.z=Math.sin(phase*.5-.85)*dance*.035;hat.rotation.x=Math.sin(phase-1)*dance*.022;
 hat.position.y=.66+Math.max(0,Math.sin(phase-.5))*dance*.032;
 antlers.forEach((a,i)=>a.rotation.z=Math.sin(phase*.5-.7+i*.2)*dance*.015);
 const closed=smooth(.35,.92,joy)*(1-S.peek*.85),bl=blink(t);
 eyeRigs.forEach((e,i)=>{e.scale.y=Math.max(.02,(1-closed)*(1-bl)*(1-S.peek*(i===0?.90:.25)));e.scale.x=1+closed*.04;e.visible=closed<.38&&!(S.peek>.5&&i===0);e.position.x=(i===0?-1:1)*.46+deny*.014*Math.sin(t*4);});
 closedEyes.forEach((e,i)=>{e.visible=closed>.36||(S.peek>.5&&i===0);e.scale.y=clamp(clamp((closed-.36)/.30)+(i===0?S.peek:0));});
 brows.forEach((b,i)=>{const side=i===0?-1:1;b.rotation.z=side*(.1+deny*.45-joy*.22);b.position.y=.40-deny*.09+joy*.06;});
 const talk=smooth(3.05,3.2,t)*(1-smooth(5.1,5.3,t));
 const speechOpen=talk*(.15+.4*Math.abs(Math.sin(t*13.2)));
 mouth.scale.set(.35+.65*joy,.02+joy*.98+speechOpen*.65,1);mouth.visible=joy>.26||talk>.01;
 tightMouth.visible=joy<=.26&&talk<.03;
 blushMat.opacity=.52*S.blush;
 const shoulderPulse=Math.sin(phase*.5-.35)*dance;
 armRigs.forEach((a,i)=>{const side=i===0?-1:1;
   const swat=deny*Math.sin(t*12.5+i*.5)*.16*smooth(2.35,2.7,t)*(1-smooth(4.5,5.2,t));
   a.rotation.z=side*(.26+deny*.95+joy*.30)+shoulderPulse*.21+swat;
   a.rotation.x=-deny*.15+joy*.21+Math.cos(phase*.5+i)*dance*.14;
   a.rotation.y=side*(-deny*.10+joy*.12);
   a.userData.fore.rotation.x=-deny*.12-joy*.38;
   a.userData.fore.rotation.z=side*joy*.12;
 });
 for(const {bone,foot,side} of legs){
   const step=Math.sin(phase+(side===1?PI:0));
   const secret=smooth(4.1,4.6,t)*(1-smooth(5.3,5.7,t));
   const lift=Math.max(0,step)*dance*.27*stop+secret*(side===1?.12:0)*Math.max(0,Math.sin(t*10));
   const tap=S.peek*(side===-1?.06:0)*Math.max(0,Math.sin(t*13));
   const fx=side*.28+Math.sin(phase*.5)*dance*.08, fz=Math.cos(phase+(side===1?PI:0))*dance*.12;
   foot.position.set(fx,lift+tap,fz);foot.rotation.z=side*joy*.08;foot.rotation.x=-Math.max(0,step)*dance*.13;
   const a=new THREE.Vector3(side*.28,.72+bounce,0),b=new THREE.Vector3(fx,.27+lift+tap,fz);
   tubeBetween(bone,a,b,.16);
 }
 contact.position.x=chopper.position.x;contact.material.opacity=1-bounce*.5;
 backpack.rotation.z=Math.sin(phase*.5-.7)*dance*.045;tail.rotation.x=Math.sin(phase)*dance*.2;
 sweat.forEach((d,i)=>{d.visible=t>2.45&&t<4.65;d.position.y=.2-i*.30-Math.max(0,t-2.55)*.07;const k=1+Math.sin(t*3+i)*.08;d.scale.set(.06*k,.12*k,.05*k)});
 for(const bottle of bottleRigs){const i=bottle.userData.index,delay=.4+i*.12,beat=Math.max(0,Math.sin(phase-delay));bottle.position.y=bottle.userData.baseY+dance*beat**3*.08;bottle.rotation.z=dance*Math.sin(phase*.5-delay)*.045;}
 bag.rotation.z=dance*Math.sin(phase*.5-1.1)*.03;bag.position.y=.9+dance*Math.max(0,Math.sin(phase-.8))**2*.045;
 drawSea(t);
 camera.position.set(S.cx,S.cy,S.cz);camera.lookAt(S.tx,S.ty,S.tz);
 // Dialogue is a camera-attached transparent plane, rendered in the same WebGL pass.
 let text='';if(t>=.95&&t<3.0)text='乔巴，你真厉害！';else if(t>=3.05&&t<5.4)text='才、才没有高兴呢！';
 caption.visible=Boolean(text);if(text&&captionMaterial.map!==captionTextures.get(text)){captionMaterial.map=captionTextures.get(text);captionMaterial.needsUpdate=true;}
 renderer.render(scene,camera);
}
async function init(){
 await document.fonts.load('58px Dialogue');
 for(const text of ['乔巴，你真厉害！','才、才没有高兴呢！']){
   const tex=textureCanvas(1920,140,x=>{x.font='58px Dialogue';x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';x.lineWidth=8;x.strokeStyle='#4c342d';x.fillStyle='#fff9e7';x.strokeText(text,960,70);x.fillText(text,960,70);});captionTextures.set(text,tex);
 }
 update(0);
 window.__timelines=window.__timelines||{};window.__timelines.main=tl;
 window.renderChopper=update;window.addEventListener('hf-seek',e=>update(e.detail.time));
 tl.eventCallback('onUpdate',()=>update(S.t));
 window.chopperReady=true;window.chopperDiagnostics={meshes:meshes.length,three:THREE.REVISION};
}
init();
