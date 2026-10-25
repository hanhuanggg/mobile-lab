/* Verifies render-order independence of the generative simulation. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
(async()=>{
  const root=path.resolve(__dirname,'..');
  const mime={'.html':'text/html','.js':'text/javascript','.ttf':'font/ttf','.otf':'font/otf','.wav':'audio/wav'};
  const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+decodeURIComponent(req.url==='/'?'/index.html':req.url));
    if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}
    catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({executablePath:process.env.HYPERFRAMES_BROWSER_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=gl-egl','--enable-gpu-rasterization','--ignore-gpu-blocklist','--disable-software-rasterizer']});
  const page=await browser.newPage({viewport:{width:1920,height:1080}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>window.chopperReady);
  const times=[0,1.6,2.6,4.4,5.15,6.6,7.8,10.4,12.2,13.8,14.6];
  async function sample(t){return page.evaluate(t=>{
    window.renderChopper(t);
    const c=document.createElement('canvas');c.width=480;c.height=270;
    const x=c.getContext('2d');x.drawImage(document.getElementById('world'),0,0,480,270);
    const p=x.getImageData(0,0,480,270).data;
    let hash=2166136261;for(let i=0;i<p.length;i++){hash^=p[i];hash=Math.imul(hash,16777619);}
    return hash>>>0;
  },t);}
  const forward={};for(const t of times)forward[t]=await sample(t);
  const reverse={};for(const t of [...times].reverse())reverse[t]=await sample(t);
  const mismatches=times.filter(t=>forward[t]!==reverse[t]);
  const report={ok:mismatches.length===0&&errors.length===0,times,forward,reverse,mismatches,errors};
  fs.writeFileSync(path.join(root,'preview/seek-verification.json'),JSON.stringify(report,null,2));
  await browser.close();await new Promise(resolve=>server.close(resolve));console.log(JSON.stringify(report));if(!report.ok)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1);});
