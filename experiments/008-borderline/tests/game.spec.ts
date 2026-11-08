import { test,expect,type Page } from '@playwright/test';
type QAWindow=Window&{__borderline:{battle:any;scene:any;project:(x:number,y:number,high?:boolean)=>{x:number;y:number}}};
async function enter(page:Page){await page.goto('/');await page.getByRole('button',{name:'开始作战'}).click();await expect(page.locator('canvas')).toBeVisible();await page.waitForFunction(()=>((window as unknown as QAWindow).__borderline.scene?.textures.getTextureKeys().length??0)>10);}
async function cell(page:Page,x:number,y:number,high=false){const p=await page.evaluate(({x,y,high})=>(window as unknown as QAWindow).__borderline.project(x,y,high),{x,y,high});const rect=(await page.locator('canvas').boundingBox())!;await page.mouse.click(rect.x+p.x/1280*rect.width,rect.y+p.y/590*rect.height);}
async function place(page:Page,kind:string,x:number,y:number,direction:string,high=false){await page.locator(`[data-kind="${kind}"]`).click();await cell(page,x,y,high);await expect(page.locator('#direction-picker')).toBeVisible();await page.locator(`[data-dir="${direction}"]`).click();await page.locator('#confirm-deploy').click();}
test('desktop home, manual, audio preference and records work',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('h1')).toContainText('边境');await page.locator('#manual').click();await expect(page.getByRole('dialog')).toContainText('收割者');await page.keyboard.press('Escape');await page.getByRole('button',{name:'关闭音效'}).click();await page.reload();await expect(page.getByRole('button',{name:'开启音效'})).toBeVisible();await page.locator('#records').click();await expect(page.getByRole('dialog')).toContainText('行动次数');expect(errors).toEqual([]);
});
test('real canvas deployment, illegal positions, facing, skill panel, retreat and restart',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await enter(page);await page.getByRole('button',{name:'暂停作战',exact:true}).click();await expect(page.locator('#pause-overlay')).toBeVisible();const initialDP=await page.evaluate(()=>(window as unknown as QAWindow).__borderline.battle.dp);await page.locator('[data-kind="vanguard"]').click();await cell(page,0,2);await expect(page.locator('#toast')).toContainText('无法部署');expect(await page.evaluate(()=>(window as unknown as QAWindow).__borderline.battle.dp)).toBe(initialDP);
  await cell(page,8,2);await page.locator('[data-dir="left"]').click();await page.locator('#confirm-deploy').click();await expect(page.locator('#unit-count')).toHaveText('1');expect(await page.evaluate(()=>(window as unknown as QAWindow).__borderline.battle.units[0].direction)).toBe('left');await expect(page.locator('#unit-panel')).toContainText('前线补给');await page.locator('#retreat').click();await expect(page.locator('#dp')).toHaveText(String(initialDP-5));await expect(page.locator('[data-kind="vanguard"] .card-status')).toContainText('22s');await page.locator('#speed').click();await expect(page.locator('#speed')).toHaveText('2×');await page.locator('#restart').click();await page.locator('#confirm-restart').click();await expect(page.locator('#dp')).toHaveText('10');await expect(page.locator('#unit-count')).toHaveText('0');await expect(page.locator('#speed')).toHaveText('1×');expect(errors).toEqual([]);
});
test('unattended combat reaches defeat and a clean retry',async({page})=>{
  await enter(page);await page.evaluate(()=>{const b=(window as unknown as QAWindow).__borderline.battle;for(let i=0;i<400;i++)b.tick(.25);});await expect(page.locator('.result-screen')).toBeVisible({timeout:10000});await expect(page.locator('.result-screen h1')).toContainText('防线失守');await page.locator('#retry').click();await expect(page.locator('#lives')).toHaveText('03');await expect(page.locator('#kills')).toHaveText('00');
});
test('full affordable strategy reaches victory in the rendered game and persists its record',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await enter(page);
  const result=await page.evaluate(()=>{
    const b=(window as unknown as QAWindow).__borderline.battle;
    const plan=[['vanguard',8,2,'left'],['vanguard',8,4,'down'],['sniper',6,0,'down'],['caster',9,3,'down'],['medic',7,3,'right'],['caster',8,0,'down'],['defender',9,4,'left'],['lord',9,2,'left']];let n=0;
    for(let i=0;i<240*30&&b.status==='playing';i++){
      if(n<plan.length){const[k,x,y,d]=plan[n];if(!b.availability(k)){if(b.deploy(k,{x,y},d))n++;}}
      for(const u of b.units)if(u.kind!=='vanguard'&&u.skillCharge>=20)b.skill(u.id);
      b.tick(1/30);
      if(b.status==='playing')b.drainEvents();
    }
    return {status:b.status,lives:b.lives,killed:b.killed,elapsed:b.elapsed};
  });
  expect(result.status).toBe('victory');expect(result.lives).toBeGreaterThan(0);await expect(page.locator('.result-screen h1')).toHaveText('防线，仍在。',{timeout:10000});await page.locator('#to-home').click();await page.locator('#records').click();await expect(page.locator('.records-grid')).toContainText('01');expect(errors).toEqual([]);
});
for(const width of [320,390])test(`portrait ${width}px home fits; rotation pauses and resumes combat`,async({page})=>{
  await page.setViewportSize({width,height:844});await page.goto('/');expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);await expect(page.locator('#start')).toBeVisible();await page.locator('#start').click();await expect(page.locator('.orientation-hint')).toBeVisible();expect(await page.evaluate(()=>(window as unknown as QAWindow).__borderline.battle.paused)).toBe(true);await page.setViewportSize({width:844,height:390});await expect(page.locator('.orientation-hint')).toBeHidden();await expect.poll(()=>page.evaluate(()=>(window as unknown as QAWindow).__borderline.battle.paused)).toBe(false);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(844);await place(page,'vanguard',8,2,'left');await expect(page.locator('#unit-count')).toHaveText('1');
});
test('touch deployment supports the four-direction confirmation on a landscape phone',async({browser})=>{
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});const page=await context.newPage();await enter(page);await page.locator('[data-kind="vanguard"]').tap();const p=await page.evaluate(()=>(window as unknown as QAWindow).__borderline.project(8,2));const rect=(await page.locator('canvas').boundingBox())!;await page.touchscreen.tap(rect.x+p.x/1280*rect.width,rect.y+p.y/590*rect.height);await page.locator('[data-dir="left"]').tap();await page.locator('#confirm-deploy').tap();await expect(page.locator('#unit-count')).toHaveText('1');await context.close();
});
