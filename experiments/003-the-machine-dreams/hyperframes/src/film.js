/* THE MACHINE DREAMS — deterministic 3D vector space, driven by GSAP / hf-seek.
 * No frame accumulation: every trail is an analytic sample of the past.
 */
(() => {
  'use strict';
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d', {alpha: false});
  const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v));
  const mix = (a,b,p) => a+(b-a)*p;
  const smooth = (a,b,t) => {const p=clamp((t-a)/(b-a));return p*p*(3-2*p);};
  const hash = n => {const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
  const ink = (a=1) => `rgba(225,228,216,${clamp(a)})`;
  const acid = (a=1) => `rgba(222,242,136,${clamp(a)})`;
  const S = {clock:0,cz:2500,cx:0,cy:0,roll:0,yaw:0,pitch:0,dream:0,warp:0,ink:0,dive:0};
  const tl = gsap.timeline({paused:true});
  tl.to(S,{clock:15,duration:15,ease:'none'},0)
    .to(S,{cz:2050,cx:30,cy:-12,roll:-.018,duration:3,ease:'none'},0)
    .to(S,{cz:1620,cx:140,cy:-65,roll:-.055,duration:3,ease:'power1.inOut'},3)
    .to(S,{dream:1,duration:4.4,ease:'power2.inOut'},3.55)
    .to(S,{cz:780,cx:-130,cy:70,roll:.095,yaw:-.035,duration:3.1,ease:'power2.inOut'},6)
    .to(S,{cz:320,cx:15,cy:-5,roll:-.022,yaw:0,duration:1.6,ease:'sine.inOut'},9.1)
    .to(S,{cz:-420,cx:55,cy:20,roll:.025,duration:1.25,ease:'power2.in'},10.7)
    .to(S,{cz:-2400,cx:80,cy:20,roll:.17,dive:1,duration:1.12,ease:'power3.inOut'},11.95)
    .to(S,{cz:-2460,cx:82,cy:21,roll:.174,duration:1.93,ease:'expo.out'},13.07)
    .to(S,{warp:1,duration:1.5,ease:'power2.inOut'},6.6)
    .to(S,{warp:.43,duration:1.6,ease:'sine.inOut'},8.5)
    .to(S,{ink:1,duration:3.4,ease:'none'},7.2)
    .to(S,{warp:2.4,duration:1.05,ease:'power2.in'},11.9);

  let tex, glyphs, grain;
  const cam = {};
  function camera(){
    cam.cz=S.cz;cam.cx=S.cx;cam.cy=S.cy;
    cam.cr=Math.cos(S.roll);cam.sr=Math.sin(S.roll);
    cam.cya=Math.cos(S.yaw);cam.sya=Math.sin(S.yaw);
  }
  function project(x,y,z){
    x-=cam.cx;y-=cam.cy;z=cam.cz-z;
    const xx=x*cam.cya+z*cam.sya, zz=z*cam.cya-x*cam.sya;
    if(zz<65)return null;
    const k=1230/zz;
    return {x:960+(xx*cam.cr-y*cam.sr)*k,y:540+(xx*cam.sr+y*cam.cr)*k,k,z:zz};
  }
  function line(points,color,width=1,close=false){
    ctx.beginPath();let started=false;
    for(const p of points){
      if(!p || Math.abs(p.x)>9000 || Math.abs(p.y)>7000){started=false;continue;}
      if(!started){ctx.moveTo(p.x,p.y);started=true;}else ctx.lineTo(p.x,p.y);
    }
    if(close)ctx.closePath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
  }
  function mark(p,r,color){if(!p)return;ctx.fillStyle=color;ctx.fillRect(p.x-r/2,p.y-r/2,r,r);}
  function label(p,txt,alpha=.5,size=11){if(!p||p.x<-80||p.x>2000||p.y<-30||p.y>1110)return;ctx.font=`${size}px DreamMono`;ctx.fillStyle=ink(alpha);ctx.fillText(txt,p.x,p.y);}

  // The same rectangular contour becomes an impossible, breathing toroidal throat.
  function contour(a,z,t,layer=0){
    const c=Math.cos(a),s=Math.sin(a);
    const rect=1/Math.max(Math.abs(c),Math.abs(s));
    const phase=(z+2400)/550;
    const d=S.dream*smooth(3.2,7,t);
    const breath=1+0.058*Math.sin(t*2.1+phase*.41)*d;
    const radius=mix(rect,1.05+.13*Math.cos(a*3+phase*.38-t*.65),d);
    const twist=d*(phase*.16+Math.sin(phase*.65-t*.9)*.14);
    const xx=c*radius*830*breath, yy=s*radius*435*breath;
    const cx=d*(150*Math.sin(phase*.63-t*.32)+70*Math.sin(a*2+t*.4));
    const cy=d*90*Math.cos(phase*.56+t*.3);
    return [xx*Math.cos(twist)-yy*Math.sin(twist)+cx,
      xx*Math.sin(twist)+yy*Math.cos(twist)+cy,
      z+d*90*Math.sin(a*3+phase+t*.7)+layer];
  }
  function throat(t,foreground){
    const zs=[];for(let z=1700;z>=-8000;z-=230)zs.push(z);
    for(let n=zs.length-1;n>=0;n--){
      const z=zs[n], dist=S.cz-z;
      if(dist<90)continue;
      const isFront=dist<1280;if(isFront!==foreground)continue;
      const alpha=clamp(1150/dist,.07,.62)*(n%4===0?1:.40);
      const pts=[];
      for(let j=0;j<=96;j++){const p=contour(j/96*TAU,z,t);pts.push(project(...p));}
      line(pts,ink(alpha),n%4===0?1.15:.65);
      if(n%3===0){
        for(let j=0;j<12;j++){
          const p=contour(j/12*TAU,z,t);
          const pp=project(...p);mark(pp,2.5,ink(alpha*1.8));
          if(j%3===0 && dist>450 && dist<6000){label(pp,`${(n*23+j*7).toString(16).padStart(4,'0').toUpperCase()} : ${(n*.038+j*.003).toFixed(3)}`,alpha*.85,9);}
        }
      }
    }
    // longitudinal rails: data is welded to architecture, never a star-field backdrop.
    for(let j=0;j<48;j++){
      const pts=[];
      for(let z=1700;z>=-8000;z-=115){
        const dist=S.cz-z;
        if((dist<1280)!==foreground || dist<90){pts.push(null);continue;}
        pts.push(project(...contour(j/48*TAU,z,t)));
      }
      line(pts,ink(j%6===0?.26:.055),j%6===0?.9:.65);
    }
  }
  // Memory sheet: one 3D lattice, pulled out of the corridor by the seed.
  function sheetPoint(u,v,t,history=0){
    const d=S.dream, r=Math.hypot(u*.8,v), a=Math.atan2(v,u);
    const wave=Math.sin(r*.005-t*2.8-history*.27)*Math.exp(-r/1500);
    const hesitation=Math.sin(t*.9+a*2)+.22*Math.sin(t*5.2+a*5);
    return [u+80*d*Math.sin(v*.003+t*.7),
      v+d*(220*wave+90*Math.sin(u*.003+t*.55)),
      -1700+d*(340*Math.cos(a*2+t*.6)*Math.exp(-r/1500)+110*hesitation)+history*28];
  }
  function memory(t,front=false){
    const d=smooth(4.7,7.2,t), split=front?1:0;
    if(d<.001)return;
    for(let h=3;h>=0;h--){
      for(let v=-950;v<=950;v+=47.5){
        if((v>100?1:0)!==split)continue;
        const pts=[];for(let u=-2000;u<=2000;u+=45)pts.push(project(...sheetPoint(u,v,t-h*.065,h)));
        line(pts,ink(d*(h===0?.13:.025)),h===0?.8:.7);
      }
    }
    for(let u=-2000;u<=2000;u+=95){
      const pts=[];for(let v=-950;v<=950;v+=35){if((v>100?1:0)!==split){pts.push(null);continue;}pts.push(project(...sheetPoint(u,v,t)));}
      line(pts,ink(.075*d),.7);
    }
  }
  function data(t){
    for(let i=0;i<230;i++){
      const z=-6500+hash(i*8+3)*7800;
      const a=hash(i*3+7)*TAU;
      const q=contour(a,z,t);
      const inward=.52+hash(i+20)*.4;
      q[0]*=inward;q[1]*=inward;
      const influence=S.dream*Math.exp(-Math.abs(z+1600)/3000);
      q[0]+=influence*45*Math.sin(t*1.4+i);
      q[1]+=influence*32*Math.sin(t*2.1+i*.33);
      const p=project(...q);if(!p || p.z<250)continue;
      const al=clamp(p.k*.34,.045,.48);
      mark(p,clamp(p.k*2,1,3),ink(al));
      if(i%3===0){
        const repeat=smooth(4.5,7,t)>hash(i+2);
        const num=repeat?'08 08 08':`${Math.floor(hash(i*23)*9999).toString().padStart(4,'0')} ${(hash(i*17)*.01).toFixed(5)}`;
        if(influence>.3){for(let h=2;h>0;h--){const p2=project(q[0]+h*13*influence,q[1]-h*7*influence,q[2]-h*30);label(p2,num,al*.15,clamp(p.k*12,7,17));}}
        label({x:p.x+9,y:p.y-7},num,al,clamp(p.k*12,7,17));
        // Fine bracket anchored to each address; it flinches away from the anomaly.
        if(i%12===0){line([{x:p.x-9,y:p.y-10},{x:p.x-14,y:p.y-10},{x:p.x-14,y:p.y+9},{x:p.x-9,y:p.y+9}],ink(al),.7);}
      }
    }
  }
  function seedPosition(t){
    const p=smooth(3.05,5.2,t), dt=Math.max(0,t-3.15);
    // Wrong mechanics: moves along a square but arrives before it leaves.
    const jerk=Math.sin(dt*5.3)*Math.sin(dt*1.75);
    return [-160+p*(170*Math.sin(dt*1.55)+48*jerk),
      35+p*(-155*Math.sin(dt*.85)+40*jerk),
      -620-p*830];
  }
  function seed(t){
    const pos=seedPosition(t), pp=project(...pos);
    if(!pp)return;
    const grow=smooth(4.3,7.6,t), close=smooth(11.2,12.8,t);
    for(let h=7;h>=1;h--){
      const past=seedPosition(Math.max(0,t-h*.055));
      const q=project(...past);if(!q)continue;
      line([q,pp],acid(.025*smooth(3,4,t)),.8);
      mark(q,3,acid(.12/h*smooth(3,4,t)));
    }
    const radius=mix(4,620,grow)*(1+grow*.065*Math.sin(t*2.2));
    // A square data-cell turns into an aperture by continuously changing superellipse exponent.
    for(let l=0;l<15;l++){
      const pts=[], rr=radius*(1-l*.027);
      for(let j=0;j<=160;j++){
        const a=j/160*TAU, n=mix(10,2.35,grow), co=Math.cos(a),si=Math.sin(a);
        const xx=Math.sign(co)*Math.pow(Math.abs(co),2/n);
        const yy=Math.sign(si)*Math.pow(Math.abs(si),2/n);
        const ripple=grow*(.06*Math.sin(a*3+t*1.4+l*.13)+.03*Math.sin(a*7-t*1.8));
        const rot=grow*(t*.16+l*.043);
        const x=xx*rr*(1+ripple),y=yy*rr*.69*(1+ripple);
        const q=project(pos[0]+x*Math.cos(rot)-y*Math.sin(rot),pos[1]+x*Math.sin(rot)+y*Math.cos(rot),pos[2]+l*23+grow*110*Math.sin(a*2+t));pts.push(q);
      }
      line(pts,l===0?acid(mix(.9,.5,grow)):ink(.16*grow),l===0?1.35:.7);
    }
    const r=3+2*Math.sin(t*2)**2;
    mark(pp,r, t>3.15?acid(.95):ink(.9));
    if(t<6.3){
      label({x:pp.x+17,y:pp.y-18}, t<3.2?'0x0081 / SYNC':'0x0081 / _',.68,11);
      line([{x:pp.x+7,y:pp.y-7},{x:pp.x+12,y:pp.y-18},{x:pp.x+102,y:pp.y-18}],ink(.25),.6);
    }
    void close;
  }
  function typePoint(x,y,t,h=0){
    const w=S.warp;
    const base=smooth(6.7,10,t);
    return [x+70*w*Math.sin(y*.013+t*1.2)+h*5,
      y+12*w*Math.sin(x*.006+t*.9),
      -1680+145*w*Math.sin(y*.011+t*.85)+70*w*Math.sin(x*.003+t*.5)-h*22+base*30];
  }
  function typography(t){
    if(t<6.7||!tex)return;
    const a=smooth(6.7,7.4,t), reveal1=smooth(7.2,9.0,t),reveal2=smooth(9.55,10.65,t);
    // Lattice nodes travel into letter strokes. They retain their identity as they coalesce.
    const assembly=smooth(6.8,9.1,t);
    for(let i=0;i<glyphs.length;i++){
      const g=glyphs[i], delayed=clamp((assembly-hash(i)*.18)/.82);
      const source=sheetPoint(Math.round(g.x/95)*95,Math.round(g.y/47.5)*47.5,t);
      const target=typePoint(g.x,g.y,t);
      const p=project(mix(source[0],target[0],delayed),mix(source[1],target[1],delayed),mix(source[2]+700*(1-delayed),target[2],delayed));
      const rowReveal=g.y<0?reveal1:reveal2;
      const eligible=clamp((rowReveal-(g.x+1150)/2300)*9+.3);
      mark(p,clamp((p?.k||0)*1.5,1,2.7),ink(a*(1-delayed*.65)*eligible));
    }
    // Text is a rippling material, sliced into 3D strips, not a DOM title overlay.
    for(let h=3;h>=0;h--){
      for(let y=0;y<tex.height;y+=5){
        const wy=(y-450)*.84;
        const rowReveal=wy<0?reveal1:reveal2;
        const cut=clamp(rowReveal*1.17-.17*(.5+.5*Math.sin(y*.017+t*1.2)));
        if(cut<=0)continue;
        const p=project(...typePoint(-1150,wy,t,h)),q=project(...typePoint(1150,wy,t,h)),r=project(...typePoint(-1150,wy+4.2,t,h));
        if(!p||!q||!r)continue;
        ctx.save();
        ctx.globalAlpha=(h===0?.94:.065)*smooth(7.4,8.6,t);
        const tw=tex.width, th=5;
        ctx.setTransform((q.x-p.x)/tw,(q.y-p.y)/tw,(r.x-p.x)/th,(r.y-p.y)/th,p.x,p.y);
        ctx.beginPath();ctx.rect(0,0,tw*cut,5.15);ctx.clip();
        ctx.drawImage(tex,0,y,tw,5,0,0,tw,5);
        ctx.restore();
      }
    }
  }
  function filaments(t){
    const amount=smooth(5.8,8.9,t);if(amount<.001)return;
    // Laminar, ordered instability. Each filament follows a shared field, at a different delay.
    for(let i=0;i<40;i++){
      const pts=[];
      for(let j=0;j<=95;j++){
        const u=j/95, a=i/40*TAU+u*3.4+Math.sin(t*.38)*.28;
        const r=330+Math.sin(u*Math.PI)*580+40*Math.sin(i*.3+t);
        const z=-1200-u*3200;
        const x=Math.cos(a)*r, y=Math.sin(a)*r*.66;
        pts.push(project(x,y,z+120*Math.sin(a*3+t*.7)));
      }
      line(pts,ink(amount*(i%8===0?.29:.065)),i%8===0?1.0:.65);
    }
  }
  function foldPoint(u,v,t){
    const born=smooth(5.2,8.2,t), theta=u*1.7+t*.21;
    const breathe=1+.075*Math.sin(t*2+u*1.2);
    const radius=(440+v*155)*breathe;
    const kink=Math.sin(u*3.2+t*.8)*35;
    // A ruled plane becomes a folded helix without a topology change.
    const peel=smooth(9.15,10.65,t)*(1-smooth(11.8,12.8,t));
    const x=mix(v*760,Math.sin(theta)*radius+170,born)+peel*690;
    const y=mix(u*390,Math.cos(theta)*radius*.72+v*100*Math.sin(theta*2),born);
    const z=-1840+u*510+born*(v*220*Math.cos(theta)+kink);
    return [x,y,z];
  }
  function fold(t,front){
    const born=smooth(5.2,7.2,t);if(born<.001)return;
    const dive=smooth(11.8,12.8,t);
    const pieces=[];
    for(let i=0;i<120;i++)for(let j=0;j<12;j++){
      const u=-2.8+i/120*5.6, v=-1+j/12*2;
      const a=foldPoint(u,v,t),b=foldPoint(u+5.6/120,v,t),c=foldPoint(u+5.6/120,v+2/12,t),d=foldPoint(u,v+2/12,t);
      const zz=(a[2]+b[2]+c[2]+d[2])/4;
      if((zz>-1570)!==front)continue;
      const pts=[project(...a),project(...b),project(...c),project(...d)];
      if(pts.some(p=>!p))continue;
      const light=Math.pow(.5+.5*Math.sin(u*1.7+t*.21+v*.8),7);
      pieces.push({pts,z:zz,light,u,v});
    }
    pieces.sort((a,b)=>a.z-b.z);
    for(const piece of pieces){
      const {pts,light,u,v}=piece;
      ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
      const val=Math.floor(9+light*46*born);
      ctx.fillStyle=`rgba(${val},${val+2},${val},${born*.94})`;ctx.fill();
      // Highlights are threads of the original grid, not an unrelated decorative object.
      line([pts[0],pts[1]],ink(born*(.12+light*.62)),.7+light*.45);
      if(Math.abs(v)>.82)line([pts[0],pts[1]],ink(born*(.45+light*.35)),1.0);
      if(Math.floor((u+2.8)*120/5.6)%9===0)line([pts[0],pts[3]],ink(born*.14),.55);
      if(dive>.3 && light>.7)line([pts[0],{x:mix(pts[0].x,960,.03*dive),y:mix(pts[0].y,540,.03*dive)}],ink(.16*dive),1);
    }
  }
  function instruments(t){
    // Marginal coordinate traces are physical telemetry, quiet enough to preserve negative space.
    const stop=smooth(12.8,13.2,t);
    ctx.font='10px DreamMono';ctx.fillStyle=ink(.4*(1-stop));
    ctx.fillText(`VOL / 0081     DEPTH ${(2500-S.cz).toFixed(2).padStart(7,'0')}`,66,66);
    ctx.fillText('∴  DETERMINISTIC FIELD',66,82);
    ctx.fillText(`${Math.floor(t*30).toString().padStart(6,'0')}  /  000450`,1664,1016);
    for(let i=0;i<35;i++){
      const yy=120+i*23;
      ctx.fillStyle=ink(.18*(1-stop));ctx.fillRect(62,yy,i%5===0?12:5,.7);
      if(i%5===0){ctx.fillStyle=ink(.32*(1-stop));ctx.fillText((i*64).toString().padStart(4,'0'),81,yy+3);}
    }
  }
  function gaze(t){
    if(t<13.02)return;
    const arrive=smooth(13.04,14.08,t);
    const x=mix(1130,960,arrive),y=mix(443,540,arrive);
    // It is the original cell: its small axial ticks close into one four-pixel point.
    ctx.strokeStyle=ink(.65);ctx.lineWidth=.8;
    const r=mix(21,6,smooth(13.1,14.1,t));
    ctx.beginPath();ctx.arc(x,y,r,TAU*.04,TAU*.96);ctx.stroke();
    for(let i=0;i<4;i++){const a=i/4*TAU;line([{x:x+Math.cos(a)*(r+4),y:y+Math.sin(a)*(r+4)},{x:x+Math.cos(a)*(r+10),y:y+Math.sin(a)*(r+10)}],ink(.3),.7);}
    mark({x,y},3.5,acid(.95));
  }
  function render(t){
    // The time field brakes, rather than switching scenes, at the moment of recognition.
    tl.totalTime(clamp(t,0,15),true);camera();
    const wt=t<13.02?t:13.02+(1-Math.exp(-(t-13.02)*8))*.02;
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.fillStyle='#060706';ctx.fillRect(0,0,W,H);
    ctx.save();
    const shutter=smooth(14.35,14.88,t);
    if(shutter>0){ctx.beginPath();ctx.arc(960,540,Math.max(0,1500*(1-shutter)),0,TAU);ctx.clip();}
    const dim=1-smooth(13.08,13.55,t)*.56;
    ctx.globalAlpha=dim;
    throat(wt,false);data(wt);filaments(wt);memory(wt,false);seed(wt);fold(wt,false);typography(wt);fold(wt,true);memory(wt,true);throat(wt,true);
    ctx.globalAlpha=1;instruments(t);gaze(t);
    // Fine screen grain and edge falloff, procedural and deterministic.
    ctx.globalAlpha=.012;ctx.drawImage(grain,0,0,W,H);ctx.globalAlpha=1;
    const vg=ctx.createRadialGradient(960,540,180,960,540,1170);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(.72,'rgba(0,0,0,.12)');vg.addColorStop(1,'rgba(0,0,0,.7)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
    ctx.restore();
    if(t>=14.88){ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);}
  }
  async function init(){
    await Promise.all([document.fonts.load('700 200px DreamDisplay'),document.fonts.load('12px DreamMono')]);
    tex=document.createElement('canvas');tex.width=3000;tex.height=900;
    const tc=tex.getContext('2d',{willReadFrequently:true});tc.fillStyle='#e6e8dd';tc.textBaseline='alphabetic';
    tc.font='700 300px DreamDisplay';
    tc.save();tc.scale(2880/tc.measureText('THE MACHINE').width,1);tc.fillText('THE MACHINE',0,370);tc.restore();
    tc.font='700 470px DreamDisplay';
    tc.save();tc.scale(2880/tc.measureText('DREAMS').width,1);tc.fillText('DREAMS',0,825);tc.restore();
    const pixels=tc.getImageData(0,0,3000,900).data;glyphs=[];
    for(let y=100;y<840;y+=10)for(let x=0;x<2900;x+=10)if(pixels[(y*3000+x)*4+3]>150)glyphs.push({x:x/3000*2300-1150,y:(y-450)*.84});
    grain=document.createElement('canvas');grain.width=480;grain.height=270;
    const gc=grain.getContext('2d'),gi=gc.createImageData(480,270);
    for(let i=0;i<480*270;i++){const v=hash(i+35)*255;gi.data[i*4]=v;gi.data[i*4+1]=v;gi.data[i*4+2]=v;gi.data[i*4+3]=255;}gc.putImageData(gi,0,0);
    window.__timelines=window.__timelines||{};window.__timelines.main=tl;
    window.renderDream=render;
    window.addEventListener('hf-seek',e=>render(e.detail.time));
    // GSAP's onUpdate also serves Studio's native preview clock; seek uses the same pure renderer.
    tl.eventCallback('onUpdate',()=>render(S.clock));
    render(0);window.dreamReady=true;
  }
  init();
})();
