"""Real Chromium clicks/touch, real clocks; observation-only game snapshot."""
import json, math, os, time
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.getenv('CHANGBAN_BASE_URL','http://127.0.0.1:8000')
URL=BASE+'/experiments/005-hanzi-changban/'
OUT=Path(os.getenv('CHANGBAN_REPORT_DIR','/tmp/changban-review'));OUT.mkdir(exist_ok=True)
report={'layout':[],'checks':[],'errors':[],'failed_resources':[]}
PATH=[(0,1),(1,1),(2,1),(3,1),(3,2),(3,3),(3,4),(2,4),(1,4),(1,5),(1,6),(1,7),(2,7),(3,7),(4,7),(5,7)]
def check(name,ok):
 assert ok,name
 report['checks'].append(name);(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS',name,flush=True)
def snap(page):return page.evaluate('window.Changban.snapshot()')
def locate(page,x,y):
 c=page.locator('#board');c.scroll_into_view_if_needed();r=c.bounding_box();land=page.viewport_size['width']>650
 return (r['x']+(y+.5)*r['width']/9,r['y']+(x+.5)*r['height']/6) if land else (r['x']+(x+.5)*r['width']/6,r['y']+(y+.5)*r['height']/9)
def cell(page,x,y):
 a,b=locate(page,x,y);page.touchscreen.tap(a,b)
def click(page,selector):page.locator(selector).tap()
def free(s):
 occupied={(t['x'],t['y']) for t in s['towers']}|{(o['x'],o['y']) for o in s['obstacles']}|set(PATH)
 return [(x,y) for y in range(9) for x in range(6) if (x,y) not in occupied]
def prep(page):
 s=snap(page)
 for o in s['obstacles']:
  cell(page,o['x'],o['y']);click(page,'#clearObstacle')
 s=snap(page);slots=free(s);slots.sort(key=lambda q:sum(math.hypot(q[0]-p[0],q[1]-p[1])<2.5 for p in PATH),reverse=True)
 if s['fragments']['zhao'] and s['fragments']['yun']:
  click(page,'#summon');cell(page,*slots.pop(0));check('name fragments summon Zhao Yun via touch',any(t['type']=='hero' for t in snap(page)['towers']))
 s=snap(page)
 if len(s['towers'])>=4:
  for t in sorted([t for t in s['towers'] if t['type']=='bow'],key=lambda t:t['level']):
   cell(page,t['x'],t['y'])
   # A freshly summoned hero may still be selected; clicking a bow selects it.
   for _ in range(3):
    b=page.locator('#upgrade')
    if b.count() and b.is_enabled():click(page,'#upgrade')
    else:break
 while snap(page)['gold']>=45 and slots:
  click(page,'[data-type="bow"]');cell(page,*slots.pop(0))
  if len(snap(page)['towers'])>=6:break
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 for w,h in [(320,740),(390,844),(1440,1000)]:
  context=browser.new_context(viewport={'width':w,'height':h},has_touch=True,device_scale_factor=1)
  page=context.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
  page.on('requestfailed',lambda r:report['failed_resources'].append(r.url))
  page.goto(URL);page.wait_for_function('window.Changban')
  layout=page.evaluate('''() => ({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,small:[...document.querySelectorAll('button,a')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').filter(e=>{let r=e.getBoundingClientRect();return r.height<43.9||r.width<43.9}).map(e=>({text:e.textContent,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})),cell:document.querySelector('#board').getBoundingClientRect().width/(innerWidth>650?9:6)})''')
  report['layout'].append(layout);check(str(w)+'px no overflow, touch targets >=44px',not layout['overflow'] and not layout['small'] and layout['cell']>=44)
  click(page,'#help');check('help pauses game',snap(page)['paused']);click(page,'#closeHelp');check('closing help restores pause state',not snap(page)['paused'])
  if w==1440:
   page.locator('#board').focus();page.keyboard.press('1');page.keyboard.press('Enter');check('keyboard placement works',len(snap(page)['towers'])==1)
   page.keyboard.press('ArrowRight');check('keyboard grid announces coordinates',bool(page.locator('#boardAccess').inner_text()))
  page.screenshot(path=str(OUT/f'layout-{w}.png'),full_page=True);context.close()
 context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,device_scale_factor=1)
 page=context.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)));page.on('requestfailed',lambda r:report['failed_resources'].append(r.url))
 page.goto(URL);page.wait_for_function('window.Changban')
 check('later levels begin locked',page.locator('[data-level="1"]').is_disabled())
 cell(page,2,2);cell(page,4,2);check('touch places two bow units',len(snap(page)['towers'])==2)
 a=locate(page,2,2);b=locate(page,4,2);cdp=context.new_cdp_session(page)
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':a[0],'y':a[1]}]})
 for i in range(1,7):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':a[0]+(b[0]-a[0])*i/6,'y':a[1]+(b[1]-a[1])*i/6}]})
 cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 check('real touch drag merges equal units',len(snap(page)['towers'])==1 and snap(page)['towers'][0]['level']==2)
 cell(page,5,4);check('selected unit can move to a free tile',snap(page)['towers'][0]['x']==5 and snap(page)['towers'][0]['y']==4)
 click(page,'#sell');check('merged unit refund is exactly 63',snap(page)['gold']==193)
 click(page,'#restart');click(page,'#cancelModal');check('cancel reset preserves state',snap(page)['gold']==193)
 click(page,'#restart');click(page,'#confirmModal');check('confirmed reset restores initial state',snap(page)['gold']==220 and not snap(page)['towers'])
 click(page,'#wave');check('empty defense start gives feedback',snap(page)['wave']==0)
 for wave in range(1,6):
  prep(page)
  if wave==1:click(page,'#speed')
  click(page,'#wave')
  if wave==1:
   page.wait_for_timeout(400);click(page,'#pause');before=snap(page);page.wait_for_timeout(350);after=snap(page);check('pause freezes real enemy positions',before['enemies']==after['enemies'] and after['paused']);click(page,'#pause')
  if wave==3:
   click(page,'#skill');check('skill enters cooldown',page.locator('#skill').is_disabled())
   page.screenshot(path=str(OUT/'battle.png'),full_page=True)
  deadline=time.monotonic()+40
  while snap(page)['active'] and time.monotonic()<deadline:page.wait_for_timeout(250)
  check('real-clock wave '+str(wave)+' completes',not snap(page)['active'] and (not snap(page)['over'] or snap(page).get('result',{}).get('won',False)))
 check('victory saves stars and unlocks next level',snap(page)['result']['won'] and snap(page)['stars'][0]>0 and page.locator('[data-level="1"]').is_enabled())
 page.screenshot(path=str(OUT/'victory.png'),full_page=True)
 click(page,'#nextLevel');check('next-level button loads second map',snap(page)['level']==1 and snap(page)['wave']==0)
 page.reload();page.wait_for_function('window.Changban');check('reload preserves stars',snap(page)['stars'][0]>0)
 # Exercise the sacrifice with earned fragments, during replay, without setters.
 for wave in range(1,5):
  prep(page)
  if wave==1:click(page,'#speed')
  click(page,'#wave')
  page.wait_for_function('!window.Changban.snapshot().active',timeout=40000)
 prep(page);click(page,'#wave');hero=next(t for t in snap(page)['towers'] if t['type']=='hero');cell(page,hero['x'],hero['y']);click(page,'#sell');click(page,'#confirmModal')
 check('sacrifice removes hero in browser and gives clear feedback',not any(t['type']=='hero' for t in snap(page)['towers']) and '舍身护主' in page.locator('#toast').inner_text())
 click(page,'#restart');click(page,'#confirmModal');check('reset after active combat clears wave',snap(page)['wave']==0 and not snap(page)['enemies'])
 # A blade outside the route cannot stop the waves: exercise actual defeat/retry.
 click(page,'[data-type="blade"]');cell(page,5,0);click(page,'#speed')
 for wave in range(2):
  if snap(page)['over']:break
  click(page,'#wave');page.wait_for_function('!window.Changban.snapshot().active',timeout=40000)
 check('defeat opens result with zero lives',snap(page)['over'] and not snap(page)['result']['won'] and snap(page)['lives']==0)
 click(page,'#retry');check('retry restores playable state',snap(page)['wave']==0 and snap(page)['lives']==10 and not snap(page)['over'])
 page.goto(BASE+'/');check('gallery links to new experiment and count is six',page.locator('a[href="experiments/005-hanzi-changban/"]').count()==1 and '006 件' in page.locator('.label').inner_text())
 page.locator('a[href="experiments/005-hanzi-changban/"]').tap();page.wait_for_function('window.Changban');click(page,'.gallery-link');page.wait_for_url(BASE+'/');page.locator('.label').wait_for();check('experiment returns to gallery',page.locator('.label').count()==1)
 check('no console exceptions',not report['errors']);check('no failed resources',not report['failed_resources'])
 browser.close()
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('REPORT',OUT/'report.json',flush=True)
