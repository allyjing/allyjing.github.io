import { evaluate, goto, metrics, key, waitFor, close } from './drive.mjs';
const out=[]; const ok=(n,p,d='')=>out.push(`${p?'PASS':'FAIL'}  ${n}${d?'  — '+d:''}`);

await metrics(1400, 900);
await goto('http://localhost:8000/#/interior/experience');

// --- the interior and its panel must not change with the clock.
// Resolve the tokens' computed values rather than hardcoding hexes (harness note 4).
const themed = await evaluate(`
  const read = () => {
    const panel=document.querySelector('.panel__card');
    const body=document.getElementById('panel-body');
    const stage=document.getElementById('stage');
    const table=document.querySelector('.table');
    const cs=getComputedStyle;
    return {
      time: document.body.dataset.time,
      panelBg: cs(panel).backgroundColor,
      panelInk: cs(body).color,
      bar: cs(document.querySelector('.panel__bar')).backgroundColor,
      closeBg: cs(document.querySelector('.panel__close')).backgroundColor,
      closeInk: cs(document.querySelector('.panel__close')).color,
      bubbleBg: cs(document.querySelector('.bubble')).backgroundColor,
      closeRing: cs(document.querySelector('.panel__close')).backgroundColor,
      plate: cs(document.querySelector('.serving'),'::after').backgroundColor,
      tint: cs(document.querySelector('.layer--tint')).display,
      sceneFilter: cs(document.querySelector('.layer--scene')).filter,
    };
  };
  const seen=[read()];
  const clock=document.querySelector('.chrome--clock');
  for (let i=0;i<4;i++){ clock.click(); await new Promise(r=>setTimeout(r,750)); seen.push(read()); }
  return seen;
`);
const times = themed.map(s=>s.time);
ok('the clock really cycled all four states', new Set(times).size===4, times.join(' '));
for (const k of ['panelBg','panelInk','bar','closeBg','closeInk','bubbleBg','plate','tint','sceneFilter']) {
  const vals = new Set(themed.map(s=>s[k]));
  ok(`interior ${k} does not change with the clock`, vals.size===1, [...vals].join(' | '));
}

// --- lightbox focus trap with a REAL Tab (programmatic focus does not fire :focus-visible)
await goto('http://localhost:8000/#/interior/photography');
await evaluate(`document.querySelectorAll('.gallery__open')[0].click(); await new Promise(r=>setTimeout(r,400));`);
const ids=[];
for (let i=0;i<6;i++){
  await key('Tab');
  ids.push(await evaluate(`return document.activeElement.id || document.activeElement.className;`));
}
ok('Tab stays inside the lightbox', ids.every(i=>i.startsWith('lightbox')), ids.join(' > '));

// backdrop click closes it; a click on the photo does not
const scrim = await evaluate(`
  document.querySelector('.lightbox__scrim').click();
  await new Promise(r=>setTimeout(r,300));
  return {closed: document.getElementById('lightbox').hidden};
`);
ok('backdrop click closes the lightbox', scrim.closed);

const onImg = await evaluate(`
  document.querySelectorAll('.gallery__open')[0].click(); await new Promise(r=>setTimeout(r,300));
  document.getElementById('lightbox-image').click(); await new Promise(r=>setTimeout(r,250));
  return {stillOpen: !document.getElementById('lightbox').hidden};
`);
ok('a click on the photograph does NOT close it', onImg.stillOpen);

// a scene change with the lightbox open must take both down
const both = await evaluate(`
  location.hash='#/exterior'; await new Promise(r=>setTimeout(r,600));
  return {lightbox:!document.getElementById('lightbox').hidden,
          panel:!document.getElementById('panel').hidden,
          panelInert:document.getElementById('panel').hasAttribute('inert')};
`);
ok('leaving the room closes the lightbox too', both.lightbox===false);
ok('...and the panel', both.panel===false);
ok('...and clears the panel inert left by the lightbox', both.panelInert===false);

// --- all five panels render real content
await goto('http://localhost:8000/#/interior');
const panels = await evaluate(`
  const ids=['experience','projects','photography','life','arts'];
  const seen=[];
  for (const id of ids){
    location.hash='#/interior/'+id;
    await new Promise(r=>setTimeout(r,420));
    const body=document.getElementById('panel-body');
    seen.push({id, title:document.getElementById('panel-title').textContent,
      entries:body.querySelectorAll('.entry').length,
      groups:[...body.querySelectorAll('.entrygroup__label')].map(function(h){return h.textContent;}),
      cards:body.querySelectorAll('.showcase__card').length,
      photos:body.querySelectorAll('.gallery__item').length,
      chars:body.textContent.length,
      placeholder:/Placeholder (bullet|heading|introduction|role|project|meta|set)|Organisation · City/i.test(body.textContent)});
  }
  return seen;
`);
for (const p of panels) {
  ok(`${p.id} panel has real content`, p.chars>200 && !p.placeholder,
     `${p.title}: ${p.entries} entries, ${p.cards} cards, ${p.photos} photos, ${p.chars} chars${p.placeholder?' PLACEHOLDER TEXT':''}`);
}
const exp = panels.find(p=>p.id==='experience');
ok('Experience groups work and clubs together',
   exp.groups.length===2 && /Clubs/i.test(exp.groups[1]), exp.groups.join(' | '));

// --- the Life journal
await goto('http://localhost:8000/#/interior/life');
await waitFor("document.querySelectorAll('.journal__tab').length===3", {label:'journal tabs'});
const jr = await evaluate(`
  const img=document.querySelector('.portrait__image');
  const tabs=[...document.querySelectorAll('.journal__tab')];
  const list=document.querySelector('[role=tablist]');
  const page=document.querySelector('.journal__page');
  const t0=tabs[0].getBoundingClientRect(), pr=page.getBoundingClientRect();
  return {
    labels: tabs.map(function(b){return b.textContent;}),
    roles: tabs.every(function(b){return b.getAttribute('role')==='tab';}),
    listRole: list.getAttribute('role'),
    orientation: list.getAttribute('aria-orientation'),
    selected: tabs.filter(function(b){return b.getAttribute('aria-selected')==='true';}).length,
    controls: tabs.every(function(b){return document.getElementById(b.getAttribute('aria-controls'))!==null || b.getAttribute('aria-selected')==='false';}),
    roving: tabs.map(function(b){return b.tabIndex;}).join(','),
    pageRole: page.getAttribute('role'),
    pageLabelled: document.getElementById(page.getAttribute('aria-labelledby'))!==null,
    // tabs beside the page, not above it, on a wide screen
    beside: t0.right <= pr.left + 2,
    tappable: tabs.every(function(b){var r=b.getBoundingClientRect();return r.height>=44;}),
    portraitDecoded: img.naturalWidth,
    portraitAlt: img.alt,
    entries: document.querySelectorAll('.journal__entry').length,
    // one page at a time: the other tabs' content must NOT be in the DOM
    onlyOnePage: document.querySelectorAll('.journal__page').length===1,
  };
`);
ok('three journal tabs', jr.labels.length===3, jr.labels.join(' | '));
ok('a real tablist, not buttons that look like one',
   jr.listRole==='tablist' && jr.roles && jr.pageRole==='tabpanel' && jr.pageLabelled);
ok('exactly one tab selected', jr.selected===1, String(jr.selected));
ok('roving tabindex', jr.roving==='0,-1,-1', jr.roving);
ok('tabs sit BESIDE the page on a wide screen', jr.beside);
ok('aria-orientation matches the layout', jr.orientation==='vertical', jr.orientation);
ok('tabs are tappable', jr.tappable);
ok('one page at a time', jr.onlyOnePage);
ok('portrait decoded with real alt text',
   jr.portraitDecoded>0 && (jr.portraitAlt||'').length>20, jr.portraitAlt);

// switching tab is a route change, and focus follows
await evaluate(`document.querySelectorAll('.journal__tab')[1].click();`);
await waitFor("location.hash==='#/interior/life/places'", {label:'tab route'});
const sw = await evaluate(`
  return {hash: location.hash,
          focus: document.activeElement.id,
          selected: document.querySelector('[aria-selected=true]').textContent,
          heading: (document.querySelector('.journal__title')||{}).textContent,
          panelOpen: !document.getElementById('panel').hidden};
`);
ok('a tab is a shareable route', sw.hash==='#/interior/life/places', sw.hash);
ok('the panel is refilled, not reopened', sw.panelOpen);
ok('focus follows to the chosen tab', sw.focus==='tab-places', sw.focus);
ok('the page actually changed', sw.selected==='Places' && sw.heading==='Los Angeles',
   `${sw.selected} / ${sw.heading}`);

// arrow keys move between tabs
await key('ArrowDown');
await waitFor("location.hash==='#/interior/life/small-things'", {label:'arrow to next tab'});
const arrow = await evaluate(`return document.querySelector('[aria-selected=true]').textContent;`);
ok('arrow keys move between tabs', arrow==='Small things', arrow);
await key('ArrowDown');
await waitFor("location.hash==='#/interior/life'  || location.hash==='#/interior/life/hobbies'", {label:'wrap'});
const wrapped = await evaluate(`return document.querySelector('[aria-selected=true]').textContent;`);
ok('...and wrap round', wrapped==='Hobbies', wrapped);

// a cold deep link to a tab
await goto('http://localhost:8000/#/interior/life/small-things');
await waitFor("document.querySelector('[aria-selected=true]')", {label:'cold tab'});
const cold = await evaluate(`
  return {selected: document.querySelector('[aria-selected=true]').textContent,
          focus: document.activeElement.className,
          heading: (document.querySelector('.journal__title')||{}).textContent};
`);
ok('a tab URL works on a cold load', cold.selected==='Small things', cold.selected);
ok('...and opening the dialog still focuses Close, not a tab',
   cold.focus==='panel__close', cold.focus);

// an unknown tab falls back to the first
await goto('http://localhost:8000/#/interior/life/nope');
await waitFor("document.querySelector('[aria-selected=true]')", {label:'fallback tab'});
const bad = await evaluate(`return document.querySelector('[aria-selected=true]').textContent;`);
ok('an unknown tab falls back to the first', bad==='Hobbies', bad);

// ⚠️ the whole point of this change: no school in Life
const school = await evaluate(`
  const seen=[];
  for (const slug of ['hobbies','places','small-things']) {
    location.hash='#/interior/life/'+slug;
    await new Promise(r=>setTimeout(r,350));
    seen.push(document.querySelector('.journal__page').textContent);
  }
  const text=seen.join(' ');
  const words=['Makers Club','Science Club','CADodile','Red Vest','Makerspace','makerspace'];
  return {hits: words.filter(function(w){return text.indexOf(w)>=0;})};
`);
ok('no academic clubs anywhere in Life', school.hits.length===0,
   school.hits.length ? school.hits.join(', ') : 'clean');

// ...and they are still findable where they belong
await goto('http://localhost:8000/#/interior/experience');
await waitFor("document.querySelectorAll('.entrygroup').length===2", {label:'experience groups'});
const moved = await evaluate(`
  const t=document.getElementById('panel-body').textContent;
  return {clubs: t.indexOf('Makers Club')>=0 && t.indexOf('Science Club for Girls')>=0,
          work: t.indexOf('Red Vest')>=0};
`);
ok('the clubs still live in Experience', moved.clubs);
ok('the Red Vest job still lives in Experience', moved.work);

console.log(out.join('\n'));
close();
