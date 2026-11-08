import {test,expect,type Page} from '@playwright/test';

// Inspect rendered pixels as well as model state: clicks alone can pass while
// a portrait camera still renders outside the landscape canvas (the reported bug).
async function expectWholeMap(page:Page){
  await page.waitForFunction(()=>{
    const scene=(window as any).__borderline?.scene;
    return scene?.cameras.main.fadeEffect.progress>=1;
  });
  const screenshot=await page.locator('canvas').screenshot({scale:'css'});
  const coverage=await page.evaluate(async(base64)=>{
    const image=new Image();image.src=`data:image/png;base64,${base64}`;await image.decode();
    const surface=document.createElement('canvas');surface.width=image.width;surface.height=image.height;
    const context=surface.getContext('2d')!;context.drawImage(image,0,0);
    return [[.15,.24,.35,.44],[.70,.24,.88,.44],[.20,.56,.40,.76],[.72,.56,.90,.76]].map(([x1,y1,x2,y2])=>{
      const pixels=context.getImageData(Math.floor(x1*image.width),Math.floor(y1*image.height),Math.max(1,Math.floor((x2-x1)*image.width)),Math.max(1,Math.floor((y2-y1)*image.height))).data;
      let floor=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]+pixels[i+1]+pixels[i+2]>150)floor++;
      return floor/(pixels.length/4);
    });
  },screenshot.toString('base64'));
  for(const part of coverage)expect(part,'Each corner of the map must contain visible industrial floor').toBeGreaterThan(.35);
  const geometry=await page.evaluate(()=>{
    const field=document.querySelector('#battlefield')!.getBoundingClientRect();
    const canvas=document.querySelector('canvas')!.getBoundingClientRect();
    return{height:field.height,width:field.width,canvasHeight:canvas.height,canvasWidth:canvas.width,viewport:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  expect(geometry.overflow).toBe(false);expect(geometry.canvasHeight).toBeCloseTo(geometry.height,0);expect(geometry.canvasWidth).toBeCloseTo(geometry.width,0);
  if(geometry.viewport<=330)expect(geometry.height/geometry.viewport).toBeGreaterThan(.54);
}
async function tapCell(page:Page,x:number,y:number){
  const point=await page.evaluate(({x,y})=>(window as any).__borderline.project(x,y),{x,y});
  const bounds=(await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(bounds.x+point.x/1280*bounds.width,bounds.y+point.y/590*bounds.height);
}
async function deploy(page:Page,y:number,direction:string){
  await page.locator('[data-kind="vanguard"]').tap();await tapCell(page,8,y);
  await expect(page.locator('#direction-picker')).toBeVisible();
  for(const control of ['[data-dir="left"]','#confirm-deploy']){
    const box=(await page.locator(control).boundingBox())!,viewport=page.viewportSize()!;
    expect(box.height).toBeGreaterThanOrEqual(44);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(viewport.height);
  }
  await page.locator(`[data-dir="${direction}"]`).tap();await page.locator('#confirm-deploy').tap();
}
for(const [width,height,dpr]of [[844,290,2.75],[800,280,3],[640,280,2],[1232,432,2.75]])test(`complete map and two-lane touch deployment at ${width}×${height}, DPR ${dpr}`,async({browser})=>{
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.locator('#start').tap();await expectWholeMap(page);
  await page.locator('#pause').tap();await deploy(page,2,'left');
  // Recover the second unit's normal DP cost by advancing eleven real game seconds.
  await page.evaluate(()=>{const b=(window as any).__borderline.battle;b.paused=false;for(let i=0;i<44;i++)b.tick(.25);b.paused=true;b.drainEvents();});
  await deploy(page,4,'down');
  expect(await page.evaluate(()=>(window as any).__borderline.battle.units.map((u:any)=>[u.x,u.y,u.direction]))).toEqual([[8,2,'left'],[8,4,'down']]);
  await page.locator('#close-panel').tap();await tapCell(page,8,4);await expect(page.locator('#unit-panel')).toContainText('隼线');
  expect(errors).toEqual([]);await context.close();
});
test('portrait rotation, changing browser toolbar height and repeated orientation changes keep the full board visible',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  const page=await context.newPage();await page.goto('/');await page.locator('#start').tap();await expect(page.locator('.orientation-hint')).toBeVisible();
  for(const height of [290,250,390,280]){
    await page.setViewportSize({width:844,height});await expect(page.locator('.orientation-hint')).toBeHidden();await expectWholeMap(page);
  }
  await page.setViewportSize({width:390,height:844});await expect(page.locator('.orientation-hint')).toBeVisible();
  await page.setViewportSize({width:844,height:290});await expectWholeMap(page);await page.locator('#pause').tap();await deploy(page,4,'left');
  await expect(page.locator('#unit-count')).toHaveText('1');await context.close();
});
