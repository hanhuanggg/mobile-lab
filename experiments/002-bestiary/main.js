'use strict';
(() => {
  const { beasts, tiers } = window.BESTIARY;
  const $ = id => document.getElementById(id);
  const number = n => String(n).padStart(2, '0');
  const numerals = ['壹', '贰', '叁', '肆', '伍', '陆', '柒'];
  const fields = [
    ['appearance', '外形描写'], ['anatomy', '身体结构与特殊器官'],
    ['ecology', '栖息地与生态位'], ['power', '核心能力'], ['fear', '最可怕之处'],
    ['evolution', '血脉 / 进化路径'], ['weakness', '弱点 / 克制方式'],
    ['record', '古籍记载 / 传闻'], ['role', '剧情定位'],
  ];
  // Content is local and authored, but escape it so future additions stay text, not markup.
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  let current = null;
  let lastRead = null;
  try { lastRead = beasts.find(b => b.id === localStorage.getItem('bestiary-last-read')); } catch { /* storage is optional */ }
  function updateContinue() {
    $('continue-reading').hidden = !lastRead;
    if (lastRead) {
      $('continue-reading').href = `#${lastRead.id}`;
      $('continue-reading').textContent = `续读 · ${lastRead.name} →`;
    }
  }
  tiers.forEach((tier, i) => {
    const option = document.createElement('option'); option.value = i + 1; option.textContent = `${numerals[i]} · ${tier.short}`; $('tier-filter').append(option);
  });
  function catalogue() {
    const query = $('search').value.trim().normalize('NFKC').toLocaleLowerCase();
    const selectedTier = Number($('tier-filter').value);
    const matches = beasts.filter(b => (!selectedTier || b.tier === selectedTier) && (!query || Object.values(b).filter(v => typeof v === 'string').join(' ').normalize('NFKC').toLocaleLowerCase().includes(query)));
    $('catalogue-list').innerHTML = tiers.map((tier, index) => {
      const items = matches.filter(b => b.tier === index + 1);
      if (!items.length) return '';
      return `<section class="chapter" aria-labelledby="tier-${index + 1}"><div class="chapter-heading"><span class="chapter-number" aria-hidden="true">${numerals[index]}</span><div><h3 id="tier-${index + 1}">${esc(tier.name)}</h3><p>${esc(tier.note)}</p></div></div>${items.map(b => `<a class="specimen-link" href="#${b.id}"><img src="${b.image.replace('assets/', 'assets/thumb-')}" alt="" width="68" height="85" loading="lazy" decoding="async"><span><span class="specimen-meta">图 ${number(beasts.indexOf(b) + 1)} / ${esc(b.region.split(' · ')[0])}</span><span class="specimen-name">${esc(b.name)}</span><span class="specimen-note">${esc(b.epithet)}</span></span><span class="specimen-arrow" aria-hidden="true">↗</span></a>`).join('')}</section>`;
    }).join('');
    $('result-count').textContent = query || selectedTier ? `查得 ${matches.length} 种异闻。` : '共十四种，按阶收录。';
    $('empty').hidden = matches.length !== 0;
  }
  function read(beast, focus = true) {
    current = beast;
    const index = beasts.indexOf(beast), tier = tiers[beast.tier - 1];
    document.title = `${beast.name} · ${tier.short} — 异兽图鉴`;
    $('library').hidden = true; $('reader').hidden = false;
    $('page-marker').textContent = `${number(index + 1)} / 14`;
    $('top-catalogue').textContent = '总目 ↗';
    $('entry').innerHTML = `<header class="entry-head"><div class="entry-kicker"><span>第${numerals[beast.tier - 1]}阶 · ${esc(tier.name)}</span><span>图 ${number(index + 1)}</span></div><h1 id="reader-title" tabindex="-1">${esc(beast.name)}</h1><p class="entry-epithet">${esc(beast.epithet)}</p></header>
      <figure class="plate"><img src="${beast.image}" width="1024" height="1280" alt="${esc(beast.plate)}" decoding="async" fetchpriority="high"><figcaption><details><summary>图录题注 · ${esc(beast.region)}</summary><p>${esc(beast.plate)}</p></details></figcaption></figure>
      <div class="entry-body"><details class="entry-index"><summary>本页笺目 / 九则</summary><nav aria-label="本页段落">${fields.map(([key, label]) => `<a href="#${beast.id}~${key}">${label}</a>`).join('')}</nav></details>
      ${fields.map(([key, label], i) => `<section id="${key}" class="entry-section${key === 'fear' ? ' warning' : ''}"><h2><span>${number(i + 1)}</span>${label}</h2>${key === 'record' ? `<blockquote><p>${esc(beast[key])}</p><cite>—— ${esc(beast.source)}</cite></blockquote>` : `<p>${esc(beast[key])}</p>`}</section>`).join('')}
      <p class="rule-line">第${numerals[beast.tier - 1]}阶判语 / ${esc(tier.rule)}</p></div>`;
    const previous = beasts[index - 1], next = beasts[index + 1];
    $('page-turner').innerHTML = `<a href="${previous ? '#' + previous.id : '#catalogue'}"><span>← ${previous ? '前一异闻' : '返回总目'}</span><strong>${previous ? esc(previous.name) : '七阶异录'}</strong></a><a href="${next ? '#' + next.id : '#catalogue'}"><span>${next ? '后一异闻' : '卷一终'} →</span><strong>${next ? esc(next.name) : '归于总目'}</strong></a>`;
    lastRead = beast; updateContinue();
    try { localStorage.setItem('bestiary-last-read', beast.id); } catch { /* keep reading without persistence */ }
    if (focus) $('reader-title').focus({ preventScroll: true });
    // One plate is requested for reading. Thumbnails use native lazy loading.
  }
  function route(initial = false) {
    let hash;
    try { hash = decodeURIComponent(location.hash.slice(1)); } catch { hash = ''; }
    if (hash === 'main-content') { $('main-content').setAttribute('tabindex', '-1'); $('main-content').focus(); return; }
    const [id, section] = hash.split('~');
    const beast = beasts.find(b => b.id === id);
    if (beast) {
      const changed = current?.id !== beast.id;
      if (changed) read(beast, !initial);
      if (section && fields.some(([key]) => key === section)) $(section).scrollIntoView();
      else if (changed) window.scrollTo(0, 0);
      return;
    }
    current = null; $('reader').hidden = true; $('library').hidden = false;
    document.title = '异兽图鉴 · 七阶异录 — mobile-lab 002';
    updateContinue();
    if (hash === 'catalogue') { $('catalogue').scrollIntoView(); if (!initial) $('catalogue').focus({ preventScroll: true }); }
    else window.scrollTo(0, 0);
  }
  $('search').addEventListener('input', catalogue);
  $('tier-filter').addEventListener('change', catalogue);
  $('share').addEventListener('click', async () => {
    if (!current) return;
    const url = new URL(location.href); url.hash = current.id;
    if (navigator.share) {
      try { await navigator.share({ title: `${current.name} · 异兽图鉴`, text: current.epithet, url: url.href }); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    $('share-url').value = url.href; $('share-dialog').showModal();
    $('share-url').focus(); $('share-url').select();
  });
  $('share-dialog').addEventListener('click', e => { if (e.target === $('share-dialog')) $('share-dialog').close(); });
  // Desktop page keys are an extra; all navigation also has large touch links.
  document.addEventListener('keydown', e => {
    if (!current || e.altKey || e.metaKey || e.ctrlKey || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || $('share-dialog').open) return;
    const index = beasts.indexOf(current), step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (step && beasts[index + step]) { e.preventDefault(); location.hash = beasts[index + step].id; }
  });
  window.addEventListener('hashchange', () => route());
  catalogue(); updateContinue(); route(true);
})();
