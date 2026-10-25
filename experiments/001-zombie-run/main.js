'use strict';
(() => {
  // All coordinates are logical pixels. Gameplay is time-based, rendering is DPR-capped.
  const $ = id => document.getElementById(id);
  const canvas = $('field');
  const ctx = canvas.getContext('2d', { alpha: false });
  const W = 420;
  let H = 820, dpr = 1, last = 0, state = 'intro', game;
  let audio, sound = true, pointer = null, lastPointerX = 0;
  const keys = new Set();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const WEAPONS = {
    pistol: { name: 'PISTOL', color: '#fff1b0', interval: .48, damage: 1, speed: 760, radius: 3, pellets: 1, range: 720, desc: '精准单发 · 远程点杀' },
    smg: { name: 'SMG', color: '#b9f7ff', interval: .115, damage: .42, speed: 880, radius: 2.5, pellets: 1, range: 660, desc: '高速连射 · 清理脆皮' },
    shotgun: { name: 'SHOTGUN', color: '#ffd184', interval: .62, damage: .66, speed: 670, radius: 3, pellets: 6, range: 350, desc: '六发散弹 · 近距穿透' },
    minigun: { name: 'MINIGUN', color: '#faff9a', interval: .052, damage: .29, speed: 1050, radius: 2.5, pellets: 1, range: 720, desc: '旋转枪管 · 持续弹幕' },
    flame: { name: 'FLAMETHROWER', color: '#ff9d47', interval: .09, damage: .22, range: 310, desc: '持续火焰 · 扇形灼烧' },
    rocket: { name: 'ROCKET LAUNCHER', color: '#ff8a5c', interval: .92, damage: 2.6, speed: 470, radius: 6, pellets: 1, range: 760, desc: '范围爆炸 · 轰碎尸群' },
  };
  // Each choice is contextual. A new weapon replaces the old one; global upgrades persist.
  const ROUNDS = [
    { at: 3, type: 'normal', count: 22, title: 'WAVE 01 / 散落感染者', hint: 'SMG 连射清脆皮 · 散弹贴身穿透', gates: [['smg', 'SMG', '+20 ATK', '高速连射', 20], ['shotgun', 'SHOTGUN', '+45 ATK', '近距离六发散弹', 45]] },
    { at: 19, type: 'tank', count: 16, title: 'WAVE 02 / 重装感染者', hint: '高伤害更克制厚皮 · 射速带来更多击退', gates: [['damage', '+30 DAMAGE', '重型弹药', '每发更狠', 30], ['rate', '×2 FIRE RATE', '双倍射速', '击退更密集', 2]] },
    { at: 35, type: 'horde', count: 75, title: 'WAVE 03 / HORDE 75', hint: '火焰灼烧近处整片 · 火箭远程范围爆破', gates: [['flame', 'FLAMETHROWER', '+55 ATK', '持续扇形灼烧', 55], ['rocket', 'ROCKET', '+85 ATK', '远程范围爆炸', 85]] },
    { at: 51, type: 'fast', count: 46, title: 'WAVE 04 / 急速感染者', hint: '生命补给保容错 · 多弹头扩大覆盖', gates: [['hp', '+50 HP', '恢复 + 护甲', '减伤护盾环', 50], ['projectile', '+1 PROJECTILE', '额外弹头', '多一路火力', 1]] },
    { at: 67, type: 'horde', count: 110, title: 'WAVE 05 / HORDE 110', hint: '机枪远程压制 · 散弹近距扫群', gates: [['minigun', 'MINIGUN', '+75 ATK', '旋转枪管弹幕', 75], ['shotgun', 'SHOTGUN', '+100 ATK', '贴身穿透六散弹', 100]] },
    { at: 83, type: 'tank', count: 28, title: 'WAVE 06 / 重装纵队', hint: '高单发打厚皮 · 高射速打持续压制', gates: [['rate', '×2 FIRE RATE', '超频供弹', '弹幕密度翻倍', 2], ['damage', '+90 DAMAGE', '重型弹药', '更大弹体与冲击', 90]] },
    { at: 99, type: 'horde', count: 160, title: 'WAVE 07 / HORDE 160', hint: '把整群僵尸变成金币', gates: [['rocket', 'ROCKET', '+150 ATK', '大范围爆破', 150], ['flame', 'FLAMETHROWER', '+135 ATK', '灼烧整条前路', 135]] },
    { at: 115, type: 'mixed', count: 38, title: 'WAVE 08 / 最后防线', hint: '多弹头集中轰炸 Boss · 装甲保命', gates: [['projectile', '+1 PROJECTILE', '分裂弹头', '火箭 / 火焰也生效', 1], ['hp', '+120 HP', '恢复 + 护甲', '带盾迎战 Boss', 120]] },
  ];
  const ENEMIES = {
    normal: { hp: 18, speed: 29, size: 10, color: '#a9c66f', damage: 7, coins: 2 },
    fast: { hp: 24, speed: 72, size: 8, color: '#e5a078', damage: 6, coins: 3 },
    tank: { hp: 190, speed: 20, size: 16, color: '#98aab7', damage: 18, coins: 9 },
  };
  let storageBest = 0;
  try { storageBest = Number(localStorage.getItem('zombie-run-best')) || 0; } catch { /* storage is optional */ }

  function resize() {
    const r = canvas.getBoundingClientRect();
    const previousH = H;
    H = W * r.height / Math.max(1, r.width);
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    if (game && previousH !== H) {
      const ratio = H / previousH;
      for (const list of [game.enemies, game.bullets, game.particles, game.texts, game.explosions, game.corpses]) for (const o of list) o.y *= ratio;
      if (game.gate) game.gate.y *= ratio;
      if (game.boss) game.boss.y *= ratio;
    }
  }
  const playerY = () => H * .79;
  function newGame() {
    game = {
      time: 0, x: W / 2, targetX: W / 2, hp: 100, maxHp: 100, armor: 0,
      weapon: 'pistol', level: 1, atk: 10, rate: 1, projectiles: 1,
      coins: 0, kills: 0, shot: 0, muzzle: 0, hurt: 0, shake: 0,
      enemies: [], bullets: [], particles: [], texts: [], explosions: [], corpses: [],
      gate: null, nextRound: 0, pending: [], group: null, groupId: 0, boss: null,
      choices: [], damageDealt: 0, escaped: 0, toastTime: 0, waveTime: 0,
      scroll: 0, flash: 0, bossStarted: false, endTime: 0, danger: null, ambient: .8,
    };
    state = 'playing'; keys.clear(); pointer = null;
    for (const id of ['intro', 'result', 'pause-screen']) $(id).hidden = true;
    for (const id of ['hud', 'weapon', 'swipe']) $(id).hidden = false;
    $('pause').textContent = 'Ⅱ'; $('toast').classList.remove('show');
    initAudio(); updateHud();
  }
  function initAudio() {
    if (!sound) return;
    try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume().catch(() => {}); } catch { /* silent fallback */ }
  }
  function tone(freq, length = .05, volume = .018, type = 'square') {
    if (!audio || !sound || audio.state !== 'running') return;
    const o = audio.createOscillator(), gain = audio.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(25, freq * .35), audio.currentTime + length);
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + length);
    o.connect(gain); gain.connect(audio.destination); o.start(); o.stop(audio.currentTime + length);
  }
  function toast(text) { $('toast').textContent = text; $('toast').classList.add('show'); game.toastTime = 1.7; }
  function announce(title, hint, time = 4) { $('wave-title').textContent = title; $('wave-hint').textContent = hint; $('wave').hidden = false; game.waveTime = time; }
  function updateHud() {
    const g = game, w = WEAPONS[g.weapon];
    $('clock').textContent = formatTime(g.time);
    $('hp-label').textContent = `HP ${Math.ceil(g.hp)} / ${g.maxHp}`;
    $('hp-fill').style.width = `${100 * g.hp / g.maxHp}%`;
    $('hp-fill').style.background = g.hp < g.maxHp * .3 ? '#ff8062' : '#d9fa65';
    $('coins').textContent = g.coins;
    $('weapon-name').replaceChildren(document.createTextNode(`${w.name} `));
    const lv = document.createElement('small'); lv.textContent = `LV.${g.level}`; $('weapon-name').append(lv);
    $('attack').textContent = `ATK ${g.atk}`;
    $('mods').textContent = `${w.desc} / 射速 ×${g.rate} / ${g.projectiles > 1 ? `${g.projectiles} 路弹头` : '单路弹头'}${g.armor ? ' / 护甲' : ''}`;
    $('progress-fill').style.width = `${Math.min(g.time / 134, 1) * 100}%`;
    $('phase').textContent = g.bossStarted ? 'FINAL / 母体清除' : `SECTOR ${Math.min(g.nextRound + 1, 8).toString().padStart(2, '0')} / 突围`;
  }
  function formatTime(t) { return `${Math.floor(t / 60).toString().padStart(2, '0')}:${Math.floor(t % 60).toString().padStart(2, '0')}`; }
  function burst(x, y, color, count = 8, force = 90) {
    const g = game;
    for (let i = 0; i < count && g.particles.length < 240; i++) {
      const a = rand(0, Math.PI * 2), speed = rand(force * .2, force);
      g.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: rand(.2, .6), max: .6, color, size: rand(2, 5) });
    }
  }
  function float(x, y, text, color = '#fff5ca', size = 17) {
    if (game.texts.length < 32) game.texts.push({ x, y, text, color, size, life: .65 });
  }
  function chooseGate(side) {
    const g = game, gate = g.gate, choice = gate.round.gates[side], kind = choice[0];
    g.level++; g.atk += 12 + gate.index * 4;
    if (WEAPONS[kind]) { g.weapon = kind; g.atk += choice[4]; }
    else if (kind === 'damage') g.atk += choice[4];
    else if (kind === 'rate') g.rate = Math.min(8, g.rate * 2);
    else if (kind === 'projectile') g.projectiles++;
    else if (kind === 'hp') { g.maxHp += choice[4]; g.hp = Math.min(g.maxHp, g.hp + choice[4] + 30); g.armor = Math.min(.5, g.armor + .2); }
    // Supply health keeps an aggressive run viable; dodging and build choices still matter.
    g.hp = Math.min(g.maxHp, g.hp + 12);
    g.choices.push({ sector: gate.index + 1, side, upgrade: kind });
    g.shot = 0; g.flash = .13; g.shake = 4;
    burst(g.x, playerY(), '#d9fa65', 25, 140);
    toast(`${choice[1]}  /  LV.${g.level}`); tone(680, .18, .05, 'triangle');
    spawnWave(gate.round, gate.index);
    g.gate = null; updateHud();
  }
  function spawnWave(round, index) {
    const g = game;
    announce(round.title, round.hint, 3.5);
    const groupId = ++g.groupId;
    if (round.type === 'horde') g.group = { id: groupId, total: round.count, remaining: round.count, display: round.count };
    for (let i = 0; i < round.count; i++) {
      let type = round.type;
      if (type === 'horde') type = i % 12 === 0 ? 'fast' : 'normal';
      if (type === 'mixed') type = i % 4 === 0 ? 'tank' : i % 3 === 0 ? 'fast' : 'normal';
      // Dense groups arrive in tight rows; small waves are spread through the sector.
      const delay = round.type === 'horde' ? Math.floor(i / 12) * .22 : i * (round.type === 'tank' ? .20 : .14);
      g.pending.push({ due: g.time + delay, type, index, group: groupId, column: i % 12 });
    }
  }
  function spawnEnemy(p) {
    const g = game, spec = ENEMIES[p.type];
    const scale = 1 + p.index * .24;
    const hp = spec.hp * (p.type === 'tank' ? (1 + p.index * .55) ** 2 : scale);
    const x = p.type === 'tank' ? rand(65, 355) : 43 + p.column * 30 + rand(-9, 9);
    g.enemies.push({ x, y: H * .19 - rand(0, 36), type: p.type, hp, maxHp: hp, size: spec.size, speed: spec.speed + 16 + p.index * 1.1, group: p.group, phase: rand(0, 6.28), hit: 0, knock: 0 });
  }
  function hurtEnemy(e, damage, knock = 5) {
    if (e.hp <= 0) return;
    const g = game;
    const actual = e.type === 'tank' ? damage * .83 : damage;
    e.hp -= actual; e.hit = .09; e.knock = Math.min(e.knock + knock, 22);
    g.damageDealt += actual;
    if (e.hp <= 0) {
      g.kills++; g.coins += ENEMIES[e.type].coins;
      if (g.corpses.length < 70) g.corpses.push({ x: e.x, y: e.y, size: e.size, color: ENEMIES[e.type].color, life: .35 });
      if (g.group && e.group === g.group.id) g.group.remaining--;
      burst(e.x, e.y - 3, ENEMIES[e.type].color, e.type === 'tank' ? 10 : 4, 70);
      // Corpse flecks move backwards before fading. Numbers are aggregated for large groups.
      if (g.kills % 3 === 0 || e.type === 'tank') float(e.x, e.y, `+${ENEMIES[e.type].coins}`, '#ffd26c', 13);
    } else if (Math.random() < .13) float(e.x, e.y - 12, Math.round(actual), '#e9f5e1', 12);
  }
  function hurtBoss(damage) {
    const b = game.boss;
    if (!b || b.hp <= 0) return;
    const dealt = damage * .22; // Visible heavy plating: all weapons obey the same armor rule.
    b.hp = Math.max(0, b.hp - dealt); b.hit = .08; game.damageDealt += dealt;
    if (Math.random() < .18) float(b.x + rand(-35, 35), b.y - 35, Math.round(dealt), '#ffd26c', 18);
    if (b.hp === 0) {
      game.coins += 500; game.shake = 18; game.flash = .5; game.endTime = 2;
      burst(b.x, b.y, '#ffd26c', 90, 300);
      game.explosions.push({ x: b.x, y: b.y, r: 160, life: .9, max: .9 });
      tone(75, .6, .12, 'sawtooth');
      for (const e of game.enemies) hurtEnemy(e, 100000, 10);
      game.pending = []; game.danger = null;
    }
  }
  function explode(x, y, radius, damage) {
    const g = game;
    g.explosions.push({ x, y, r: radius, life: .32, max: .32 });
    burst(x, y, '#ffa153', 10, 150); g.shake = Math.max(g.shake, 3);
    for (const e of g.enemies) if (Math.hypot(e.x - x, e.y - y) < radius + e.size) hurtEnemy(e, damage, 15);
    if (g.boss && Math.hypot(g.boss.x - x, g.boss.y - y) < radius + 47) hurtBoss(damage);
    tone(65, .13, .045, 'sawtooth');
  }
  function aimTarget() {
    const g = game, py = playerY();
    let best = null, score = Infinity;
    for (const e of g.enemies) {
      if (e.hp <= 0 || e.y > py + 8) continue;
      const s = Math.hypot(e.x - g.x, py - e.y);
      if (s < score) { score = s; best = e; }
    }
    if (!best && g.boss && g.boss.hp > 0) best = g.boss;
    return best;
  }
  function shoot() {
    const g = game, w = WEAPONS[g.weapon], py = playerY() - 18;
    const target = aimTarget();
    const angle = target ? clamp(Math.atan2(target.x - g.x, py - target.y), -.8, .8) : 0;
    g.aim = angle;
    if (g.weapon === 'flame') {
      const range = w.range + (g.projectiles - 1) * 24;
      const width = .28 + (g.projectiles - 1) * .10;
      for (const e of g.enemies) {
        const dy = py - e.y, dx = e.x - g.x;
        if (dy > -8 && dy < range && Math.abs(dx - Math.tan(angle) * dy) < 20 + dy * width) hurtEnemy(e, g.atk * w.damage, 2 / g.rate);
      }
      if (g.boss && g.boss.hp > 0) {
        const b = g.boss, dy = py - b.y;
        if (dy < range + 50 && Math.abs(b.x - g.x - Math.tan(angle) * dy) < 50 + dy * width) hurtBoss(g.atk * w.damage * (1 + .35 * (g.projectiles - 1)));
      }
      if (Math.random() < .16) tone(85, .08, .009, 'sawtooth');
    } else {
      const lanes = Math.min(g.projectiles, 4);
      for (let lane = 0; lane < lanes; lane++) {
        for (let i = 0; i < w.pellets; i++) {
          if (g.bullets.length >= 210) break;
          const spread = g.weapon === 'shotgun' ? (i - 2.5) * .10 : g.weapon === 'minigun' ? rand(-.045, .045) : rand(-.012, .012);
          const a = angle + spread + (lane - (lanes - 1) / 2) * .075;
          g.bullets.push({ x: g.x + (lane - (lanes - 1) / 2) * 10, y: py, vx: Math.sin(a) * w.speed, vy: -Math.cos(a) * w.speed, life: w.range / w.speed, damage: g.atk * w.damage, kind: g.weapon, radius: w.radius + Math.min(2, g.atk / 220), hits: new Set() });
        }
      }
      if (g.weapon !== 'minigun' || Math.random() < .32) tone(g.weapon === 'rocket' ? 115 : g.weapon === 'shotgun' ? 170 : 280, .035, .012);
    }
    g.muzzle = .07;
  }
  function damagePlayer(amount) {
    const g = game;
    // A brief grace period stops a whole packed row dealing damage in one frame.
    if (g.hurt > 0 || g.endTime > 0) return;
    g.hp = Math.max(0, g.hp - amount * (1 - g.armor)); g.hurt = .42; g.shake = 5;
    burst(g.x, playerY(), '#ff8062', 8, 90); tone(90, .12, .045, 'triangle');
    if (g.hp <= 0) finish(false);
  }
  function spawnBoss() {
    const g = game;
    g.bossStarted = true;
    g.boss = { x: W / 2, y: -80, hp: 18000, maxHp: 18000, hit: 0, age: 0, attack: 3.5, add: 7 };
    g.gate = null; g.pending = [];
    g.hp = Math.min(g.maxHp, g.hp + 35);
    announce('FINAL / 母体 · 18,000 HP', '装甲减伤 78% · 躲开红色冲撞线', 5);
    tone(65, .4, .06, 'sawtooth'); updateHud();
  }
  function update(dt) {
    const g = game;
    g.time += dt; g.scroll += dt * 105; g.shot -= dt; g.hurt = Math.max(0, g.hurt - dt);
    g.muzzle = Math.max(0, g.muzzle - dt); g.flash = Math.max(0, g.flash - dt);
    g.shake = Math.max(0, g.shake - dt * 18);
    if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) g.targetX -= dt * 300;
    if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) g.targetX += dt * 300;
    g.targetX = clamp(g.targetX, 43, 377);
    g.x += (g.targetX - g.x) * Math.min(1, dt * 20);
    $('swipe').hidden = g.time > 9;
    if (g.toastTime > 0) { g.toastTime -= dt; if (g.toastTime <= 0) $('toast').classList.remove('show'); }
    if (g.waveTime > 0) { g.waveTime -= dt; if (g.waveTime <= 0) $('wave').hidden = true; }
    if (g.nextRound < ROUNDS.length && g.time >= ROUNDS[g.nextRound].at) {
      const index = g.nextRound++;
      g.gate = { y: H * .21, round: ROUNDS[index], index };
      announce('选择补给 / NEXT WAVE', ROUNDS[index].title.split(' / ')[1] + ' · 滑入左门或右门', 4);
    }
    if (g.gate) {
      g.gate.y += dt * H * .108;
      if (g.gate.y >= playerY() - 10) chooseGate(g.x < W / 2 ? 0 : 1);
    }
    for (let i = g.pending.length - 1; i >= 0; i--) if (g.pending[i].due <= g.time && g.enemies.length < 185) { spawnEnemy(g.pending[i]); g.pending.splice(i, 1); }
    // Small stragglers keep the road alive between the big, finite waves.
    g.ambient -= dt;
    if (!g.bossStarted && g.ambient <= 0) {
      const index = Math.max(0, g.nextRound - 1);
      spawnEnemy({ type: g.time < 14 ? 'normal' : Math.random() < .17 ? 'tank' : Math.random() < .32 ? 'fast' : 'normal', index, group: -2, column: Math.floor(rand(0, 12)) });
      g.ambient = g.time < 8 ? 1.1 : .9;
    }
    if (!g.bossStarted && g.time >= 134) spawnBoss();
    if (g.boss && g.boss.hp > 0) {
      const b = g.boss; b.age += dt;
      const bossY = g.weapon === 'flame' ? Math.max(H * .31, playerY() - 235) : H * .31;
      b.y += (bossY - b.y) * Math.min(1, dt * 1.3);
      b.x = W / 2 + Math.sin(b.age * .6) * 85;
      b.hit = Math.max(0, b.hit - dt); b.attack -= dt; b.add -= dt;
      if (b.attack <= 0) { g.danger = { x: g.x, width: 100, life: 1.8, fired: false }; b.attack = 4.2; }
      if (b.add <= 0) { for (let i = 0; i < 12; i++) g.pending.push({ due: g.time + i * .1, type: i % 3 === 0 ? 'tank' : 'fast', index: 6, group: -1, column: i }); b.add = 8; }
      // Flame builds fight at close range even on very tall screens.
    }
    if (g.danger) {
      const d = g.danger; d.life -= dt;
      if (d.life <= .4 && !d.fired) {
        d.fired = true; g.shake = 7;
        if (Math.abs(g.x - d.x) < d.width / 2 + 10) damagePlayer(28);
        burst(d.x, playerY(), '#ff8062', 20, 150);
      }
      if (d.life <= 0) g.danger = null;
    }
    for (const e of g.enemies) {
      if (e.hp <= 0) continue;
      e.y += e.speed * dt - e.knock * dt * 14; e.knock *= Math.max(0, 1 - dt * 9);
      e.hit = Math.max(0, e.hit - dt); e.phase += dt * (e.type === 'fast' ? 12 : 7);
      // Fast enemies chase gently, normal hordes keep readable lanes.
      if (e.type === 'fast' && e.y < playerY()) e.x += clamp(g.x - e.x, -90, 90) * dt * .28;
      if (Math.abs(e.y - playerY()) < e.size + 13 && Math.abs(e.x - g.x) < e.size + 11) { damagePlayer(ENEMIES[e.type].damage); e.y += 34; }
      if (e.y > playerY() + 50) {
        e.hp = 0; g.escaped++;
        if (g.group && e.group === g.group.id) g.group.remaining--;
        // Missed zombies attack the rear line. Repositioning matters, even with auto-aim.
        damagePlayer(e.type === 'tank' ? 8 : 2);
      }
    }
    if (state !== 'playing') return;
    for (let volley = 0; volley < 6 && g.shot <= 0 && (!g.boss || g.boss.hp > 0); volley++) {
      shoot(); g.shot += WEAPONS[g.weapon].interval / g.rate;
    }
    for (const bullet of g.bullets) {
      const ox = bullet.x, oy = bullet.y;
      bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; bullet.life -= dt;
      if (bullet.life <= 0) continue;
      for (const e of g.enemies) {
        if (e.hp <= 0 || bullet.hits.has(e)) continue;
        if (segmentHit(ox, oy, bullet.x, bullet.y, e.x, e.y, e.size + bullet.radius)) {
          if (bullet.kind === 'rocket') { explode(bullet.x, bullet.y, 76 + g.level * 3, bullet.damage); bullet.life = 0; break; }
          hurtEnemy(e, bullet.damage, bullet.kind === 'shotgun' ? 12 : 5);
          bullet.hits.add(e);
          if (bullet.kind !== 'shotgun' || bullet.hits.size >= 2) { bullet.life = 0; break; }
        }
      }
      if (bullet.life > 0 && g.boss && g.boss.hp > 0 && segmentHit(ox, oy, bullet.x, bullet.y, g.boss.x, g.boss.y, 48 + bullet.radius)) {
        if (bullet.kind === 'rocket') explode(bullet.x, bullet.y, 76 + g.level * 3, bullet.damage);
        else hurtBoss(bullet.damage);
        bullet.life = 0;
      }
      if (bullet.kind === 'rocket' && bullet.y < H * .12 && bullet.life > 0) { explode(bullet.x, bullet.y, 76 + g.level * 3, bullet.damage); bullet.life = 0; }
    }
    g.bullets = g.bullets.filter(b => b.life > 0 && b.x > -30 && b.x < W + 30 && b.y > -30);
    g.enemies = g.enemies.filter(e => e.hp > 0);
    if (g.group) g.group.display += (g.group.remaining - g.group.display) * Math.min(1, dt * 12);
    for (const p of g.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 3; p.vy *= 1 - dt * 3; p.life -= dt; }
    for (const t of g.texts) { t.y -= 42 * dt; t.life -= dt; }
    for (const c of g.corpses) { c.y -= 75 * dt; c.life -= dt; }
    for (const e of g.explosions) e.life -= dt;
    g.corpses = g.corpses.filter(c => c.life > 0);
    g.particles = g.particles.filter(p => p.life > 0); g.texts = g.texts.filter(t => t.life > 0); g.explosions = g.explosions.filter(e => e.life > 0);
    if (g.endTime > 0) { g.endTime -= dt; if (g.endTime <= 0) finish(true); }
  }
  function segmentHit(ax, ay, bx, by, x, y, radius) {
    const dx = bx - ax, dy = by - ay;
    const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    return (ax + t * dx - x) ** 2 + (ay + t * dy - y) ** 2 < radius * radius;
  }
  function finish(win) {
    if (state !== 'playing') return;
    state = win ? 'victory' : 'dead';
    const g = game;
    storageBest = Math.max(storageBest, g.coins);
    try { localStorage.setItem('zombie-run-best', String(storageBest)); } catch { /* optional */ }
    $('result-kicker').textContent = win ? 'ROAD CLEARED / 母体已清除' : 'RUN ENDED / 突围失败';
    $('result-title').textContent = win ? 'VICTORY' : '倒下，重来。';
    $('result-copy').textContent = win ? '从一把手枪，到一路火海。你打穿了。' : '试试换条路线。厚皮怕重弹，尸群怕范围。';
    $('reward-caption').textContent = win ? '金币 / Boss +500' : '本局金币';
    $('reward').textContent = `✦ ${g.coins}`;
    $('record').textContent = `${g.kills} / ${formatTime(g.time)}`;
    $('final-weapon').textContent = `${WEAPONS[g.weapon].name} LV.${g.level}`;
    $('best').textContent = `${storageBest} 金币`;
    $('result').hidden = false; $('wave').hidden = true; $('swipe').hidden = true;
    $('restart').focus({ preventScroll: true });
  }
  function pause() {
    if (state === 'playing') { state = 'paused'; $('pause-screen').hidden = false; keys.clear(); pointer = null; $('resume').focus(); }
  }
  function resume() { if (state === 'paused') { state = 'playing'; $('pause-screen').hidden = true; last = performance.now(); initAudio(); } }

  // Rendering: no image downloads, gradients or per-enemy shadow filters in the hot path.
  function text(str, x, y, size = 16, color = '#fff', align = 'center', weight = 800) {
    ctx.fillStyle = color; ctx.font = `${weight} ${size}px Arial, sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(str, x, y);
  }
  function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
  function ellipse(x, y, rx, ry, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
  function line(x1, y1, x2, y2, color, width = 2) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function drawRoad() {
    const scroll = game ? game.scroll : performance.now() * .03;
    rect(0, 0, W, H, '#263438'); rect(28, 0, 364, H, '#344246');
    rect(31, 0, 3, H, '#65716b'); rect(386, 0, 3, H, '#65716b');
    for (let y = scroll % 90 - 90; y < H; y += 90) {
      rect(136, y, 3, 38, '#697064'); rect(281, y, 3, 38, '#697064');
      rect(5, y, 17, 42, '#1c292d'); rect(398, y, 17, 42, '#1c292d');
      rect(26, y, 3, 24, '#c9aa59'); rect(391, y, 3, 24, '#c9aa59');
      line(48, y + 63, 80, y + 67, '#3c4b4d', 2); line(310, y + 21, 354, y + 16, '#3c4b4d', 2);
    }
    // Roadside quarantine markings and broken rubble move with the world.
    const markY = (scroll * .85) % (H + 350) - 160;
    ctx.save(); ctx.translate(210, markY); ctx.rotate(-Math.PI / 2);
    text('EVACUATION →', 0, 0, 32, '#56615a'); ctx.restore();
    for (let i = 0; i < 9; i++) { const y = (i * 137 + scroll * .9) % (H + 30) - 15; rect(i % 2 ? 10 : 401, y, 7, 10, '#596861'); }
  }
  function drawEnemy(e) {
    const spec = ENEMIES[e.type], r = e.size, bob = Math.sin(e.phase) * 2;
    ellipse(e.x, e.y + r, r * .85, r * .4, '#1c292b');
    ctx.save(); ctx.translate(e.x, e.y + bob); ctx.rotate(Math.sin(e.phase) * .08);
    const c = e.hit > 0 ? '#f9ffe2' : spec.color;
    line(-r * .45, r * .3, -r * .5 + Math.sin(e.phase) * 3, r * 1.1, '#202b2f', r * .45);
    line(r * .45, r * .3, r * .5 - Math.sin(e.phase) * 3, r * 1.1, '#202b2f', r * .45);
    rect(-r * .8, -r * .5, r * 1.6, r * 1.2, e.type === 'tank' ? '#657a83' : '#64775c');
    line(-r * .7, -r * .15, -r * 1.2, r * .5, c, r * .35);
    line(r * .7, -r * .15, r * 1.2, r * .5, c, r * .35);
    ellipse(0, -r * .65, r * .65, r * .65, c);
    rect(-r * .37, -r * .82, r * .24, 2.5, '#e94f44'); rect(r * .15, -r * .82, r * .24, 2.5, '#e94f44');
    if (e.type === 'tank') { rect(-r * .85, -r * .45, r * 1.7, 5, '#94aab1'); line(-5, 2, 5, 2, '#eac571', 3); }
    ctx.restore();
    if (e.hp < e.maxHp && e.type === 'tank') { rect(e.x - 15, e.y - r - 12, 30, 3, '#1d282b'); rect(e.x - 15, e.y - r - 12, 30 * e.hp / e.maxHp, 3, '#e9be6b'); }
  }
  function drawPlayer() {
    const g = game, x = g ? g.x : 210, y = playerY(), w = WEAPONS[g ? g.weapon : 'pistol'];
    const t = game ? game.time : performance.now() / 1000;
    ellipse(x, y + 17, 21, 9, '#1d292c');
    if (g && g.armor) {
      ctx.strokeStyle = '#85e7df'; ctx.lineWidth = 2 + g.armor * 3;
      ctx.beginPath(); ctx.ellipse(x, y, 29, 34, 0, 0, Math.PI * 2); ctx.stroke();
    }
    if (g && g.hurt > 0 && Math.floor(g.hurt * 24) % 2) ctx.globalAlpha = .45;
    rect(x - 10, y + 4 + Math.sin(t * 16) * 4, 7, 16, '#121e22');
    rect(x + 3, y + 4 - Math.sin(t * 16) * 4, 7, 16, '#121e22');
    rect(x - 15, y - 12, 30, 26, '#ddaf55'); rect(x - 10, y - 10, 20, 20, '#e8cb78');
    rect(x - 6, y - 5, 12, 16, '#586366'); ellipse(x, y - 17, 11, 11, '#e5c4a1');
    rect(x - 10, y - 24, 20, 10, '#d9fa65'); rect(x - 12, y - 17, 24, 4, '#354849');
    ctx.save(); ctx.translate(x, y - 12); ctx.rotate(g ? g.aim || 0 : 0);
    const level = g ? g.level : 1;
    if (g && ['minigun', 'rocket', 'flame'].includes(g.weapon)) { rect(-16, 0, 10, 17, '#667477'); rect(6, 0, 10, 17, w.color); }
    const barrels = g ? (g.weapon === 'minigun' ? 3 : Math.min(3, g.projectiles)) : 1;
    for (let i = 0; i < barrels; i++) {
      const bx = (i - (barrels - 1) / 2) * 9;
      rect(bx - 4, -21 - level * .6, 8, 25, '#18272d'); rect(bx - 2, -21 - level * .6, 4, 16, w.color);
      if (g && g.weapon === 'rocket') { rect(bx - 6, -20, 12, 22, '#6c7d69'); rect(bx - 4, -22, 8, 6, '#ffb476'); }
      if (g && g.muzzle > 0 && g.weapon !== 'flame') {
        ctx.fillStyle = w.color; ctx.beginPath(); ctx.moveTo(bx - 6, -24); ctx.lineTo(bx, -42 - rand(0, 8)); ctx.lineTo(bx + 6, -24); ctx.fill();
      }
    }
    ctx.restore(); ctx.globalAlpha = 1;
    // A visual footprint grows with the build rather than only changing HUD numbers.
    if (g && g.level >= 5) { line(x - 24, y + 18, x - 24, y + 27, '#d9fa65', 3); line(x + 24, y + 18, x + 24, y + 27, '#d9fa65', 3); }
  }
  function drawGate(gate) {
    const y = gate.y;
    for (let i = 0; i < 2; i++) {
      const x = i === 0 ? 38 : 218, c = i === 0 ? '#a6e8ec' : '#d9fa65', selected = (game.x < 210 ? 0 : 1) === i;
      ctx.globalAlpha = selected ? .95 : .70;
      rect(x, y - 68, 164, 98, '#15272d'); rect(x, y - 68, 164, 4, c);
      rect(x, y - 68, 4, 98, c); rect(x + 160, y - 68, 4, 98, c);
      ctx.globalAlpha = .16; rect(x + 4, y - 64, 156, 90, c); ctx.globalAlpha = 1;
      const choice = gate.round.gates[i];
      text(choice[1], x + 82, y - 44, choice[1].length > 12 ? 14 : 19, c);
      text(choice[2], x + 82, y - 17, 17, '#f3f7dc');
      text(choice[3], x + 82, y + 6, 11, '#c7d7cd', 'center', 500);
      text(selected ? '▼' : '⌄', x + 82, y - 85, 17, c);
      line(x, y + 34, x + 164, y + 34, c, 2);
    }
  }
  function drawBoss(b) {
    const x = b.x, y = b.y;
    ellipse(x, y + 40, 60, 20, '#1c292b');
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(b.age * 3) * .04);
    const body = b.hit > 0 ? '#fff1d5' : '#9eae76';
    rect(-39, -26, 78, 73, '#69785e'); rect(-51, -23, 20, 51, body); rect(31, -23, 20, 51, body);
    rect(-31, 36, 23, 23, '#3a4945'); rect(8, 36, 23, 23, '#3a4945');
    rect(-28, -31, 56, 45, '#344b4d'); line(-22, -12, 22, -12, '#e8ba63', 7);
    ellipse(0, -38, 24, 23, body); rect(-18, -42, 12, 6, '#ff745d'); rect(6, -42, 12, 6, '#ff745d');
    rect(-12, -23, 24, 6, '#303d38'); ctx.restore();
    const by = Math.max(H * .21, y - 100);
    text('BOSS / THE MOTHER', x, by - 30, 14, '#ffb08a');
    rect(x - 85, by - 13, 170, 9, '#19252a'); rect(x - 85, by - 13, 170 * b.hp / b.maxHp, 9, '#ff8062');
    text(Math.ceil(b.hp).toLocaleString('en-US'), x, by + 12, 29, '#fff1d8');
  }
  function drawFlame() {
    const g = game, py = playerY() - 25, angle = g.aim || 0, range = WEAPONS.flame.range + (g.projectiles - 1) * 24;
    ctx.save(); ctx.translate(g.x, py); ctx.rotate(angle);
    const width = .28 + (g.projectiles - 1) * .10;
    ctx.globalCompositeOperation = 'lighter';
    const tongues = 12 + Math.min(12, g.rate * 3);
    for (let i = 0; i < tongues; i++) {
      const phase = (g.time * 2.8 + i / tongues) % 1, dy = phase * range;
      const rx = (18 + dy * width) * (.5 + .3 * Math.sin(i * 8));
      ctx.globalAlpha = (1 - phase) * .48;
      ellipse(Math.sin(i * 17 + g.time * 18) * dy * width * .5, -dy, rx, 30 + dy * .08, i % 3 ? '#ff7c26' : '#ffe87c');
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.restore();
  }
  function render() {
    ctx.save();
    drawRoad();
    const g = game;
    if (g) {
      if (!reduced && g.shake > 0) ctx.translate(rand(-g.shake, g.shake), rand(-g.shake, g.shake));
      if (g.danger) {
        const d = g.danger;
        ctx.globalAlpha = d.fired ? .65 : .15 + Math.sin(g.time * 16) * .06;
        rect(d.x - d.width / 2, H * .3, d.width, H * .55, '#ff6148'); ctx.globalAlpha = 1;
        line(d.x - d.width / 2, H * .3, d.x - d.width / 2, H * .85, '#ef7957');
        line(d.x + d.width / 2, H * .3, d.x + d.width / 2, H * .85, '#ef7957');
        text(d.fired ? 'IMPACT' : '⚠ 躲开红线', d.x, playerY() + 48, 13, '#ffc09b');
      }
      if (g.gate) drawGate(g.gate);
      if (g.boss && g.boss.hp > 0) drawBoss(g.boss);
      for (const c of g.corpses) {
        ctx.globalAlpha = c.life / .35;
        const r = c.size * (.5 + c.life);
        ellipse(c.x, c.y, r, r * .55, c.color);
        rect(c.x - 3, c.y - r, 6, 7, c.color);
      } ctx.globalAlpha = 1;
      for (const e of g.enemies) drawEnemy(e);
      if (g.group && (g.group.remaining > 0 || g.group.display > .5)) {
        const first = g.enemies.find(e => e.group === g.group.id);
        const yy = first ? clamp(first.y - 42, H * .25, H * .6) : H * .29;
        rect(167, yy - 28, 86, 59, '#172428'); text('HORDE', 210, yy - 15, 10, '#c8dcac');
        text(Math.ceil(g.group.display), 210, yy + 12, 32, '#d9fa65');
      }
      if (g.weapon === 'flame' && state === 'playing') drawFlame();
      for (const b of g.bullets) {
        const color = WEAPONS[b.kind].color;
        if (b.kind === 'rocket') { line(b.x, b.y + 18, b.x - b.vx * .03, b.y + 29, '#ffab58', 4); ellipse(b.x, b.y, 5, 10, '#e4ecc1'); }
        else { line(b.x, b.y, b.x - b.vx * .018, b.y - b.vy * .018, color, b.radius * 1.3); }
      }
      for (const e of g.explosions) {
        const t = 1 - e.life / e.max;
        ctx.globalAlpha = (1 - t) * .6; ellipse(e.x, e.y, e.r * t, e.r * t, '#ffb34f');
        ctx.globalAlpha = 1 - t; ctx.strokeStyle = '#ffebba'; ctx.lineWidth = 4 * (1 - t) + 1;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * Math.max(.01, t), 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
      }
      for (const p of g.particles) { ctx.globalAlpha = Math.min(1, p.life * 3); rect(p.x, p.y, p.size, p.size, p.color); } ctx.globalAlpha = 1;
      for (const t of g.texts) { ctx.globalAlpha = Math.min(1, t.life * 3); text(t.text, t.x, t.y, t.size, t.color); } ctx.globalAlpha = 1;
      drawPlayer();
      if (!reduced && g.flash > 0) { ctx.globalAlpha = Math.min(.3, g.flash); rect(0, 0, W, H, '#fff5cd'); ctx.globalAlpha = 1; }
      if (g.hurt > 0) { ctx.strokeStyle = '#ef785e'; ctx.lineWidth = 9; ctx.strokeRect(0, 0, W, H); }
    } else {
      // Live title-screen battlefield, not a website landing page.
      for (let i = 0; i < 17; i++) drawEnemy({ x: 50 + (i * 67) % 320, y: H * .43 + (i * 47) % (H * .22), type: i % 6 === 0 ? 'tank' : 'normal', size: i % 6 === 0 ? 16 : 10, phase: performance.now() / 180 + i, hit: 0, hp: 18, maxHp: 18 });
      drawPlayer();
    }
    ctx.restore();
  }
  let hudTick = 0;
  function frame(now) {
    const dt = Math.min((now - (last || now)) / 1000, .05); last = now;
    if (state === 'playing') { update(dt); hudTick += dt; if (hudTick > .1) { updateHud(); hudTick = 0; } }
    render(); requestAnimationFrame(frame);
  }
  canvas.addEventListener('pointerdown', e => {
    if (state !== 'playing' || pointer !== null) return;
    e.preventDefault(); pointer = e.pointerId; lastPointerX = e.clientX; canvas.setPointerCapture(e.pointerId); initAudio();
  });
  canvas.addEventListener('pointermove', e => {
    if (pointer !== e.pointerId || state !== 'playing') return;
    e.preventDefault();
    game.targetX += (e.clientX - lastPointerX) * W / canvas.getBoundingClientRect().width * 1.15;
    game.targetX = clamp(game.targetX, 43, 377); lastPointerX = e.clientX;
  });
  function release(e) { if (pointer === e.pointerId) pointer = null; }
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release); canvas.addEventListener('lostpointercapture', release);
  document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  document.addEventListener('keydown', e => {
    if (['ArrowLeft', 'ArrowRight', ' ', 'p', 'P', 'Escape'].includes(e.key)) e.preventDefault();
    if (['p', 'P', 'Escape'].includes(e.key) && !e.repeat) { if (state === 'playing') pause(); else resume(); }
    keys.add(e.key);
  });
  document.addEventListener('keyup', e => keys.delete(e.key));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('blur', pause);
  $('start').addEventListener('click', newGame); $('restart').addEventListener('click', newGame);
  $('pause').addEventListener('click', pause); $('resume').addEventListener('click', resume);
  $('sound').addEventListener('click', () => { sound = !sound; $('sound').textContent = sound ? '♪' : '♪̸'; $('sound').setAttribute('aria-label', sound ? '关闭声音' : '开启声音'); $('sound').setAttribute('aria-pressed', String(sound)); if (sound) initAudio(); });
  // Read-only diagnostics for real-time browser playtests; no clock, health or damage cheats.
  window.ZombieRun = Object.freeze({ snapshot: () => game ? {
    state, time: game.time, hp: game.hp, maxHp: game.maxHp, x: game.x, width: W, height: H,
    weapon: game.weapon, atk: game.atk, rate: game.rate, level: game.level, projectiles: game.projectiles,
    kills: game.kills, coins: game.coins, enemies: game.enemies.length, bullets: game.bullets.length,
    gate: game.gate ? { y: game.gate.y, choices: game.gate.round.gates.map(c => c[0]) } : null,
    choices: game.choices.map(c => ({ ...c })), boss: game.boss ? { hp: game.boss.hp, x: game.boss.x, y: game.boss.y } : null,
    danger: game.danger ? { x: game.danger.x, life: game.danger.life } : null,
    escaped: game.escaped,
  } : { state } });
  window.addEventListener('resize', resize); resize(); requestAnimationFrame(frame);
})();
