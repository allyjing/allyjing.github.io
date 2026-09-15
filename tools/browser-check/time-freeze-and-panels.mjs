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

// --- the Life menu
await goto('http://localhost:8000/#/interior/life');
await waitFor("document.querySelector('.portrait__image')", {label:'portrait'});
const menu = await evaluate(`
  const img=document.querySelector('.portrait__image');
  const rows=[...document.querySelectorAll('.menu__item')];
  const line=document.querySelector('.menu__line');
  const name=line.querySelector('.menu__name').getBoundingClientRect();
  const note=line.querySelector('.menu__note').getBoundingClientRect();
  const leader=getComputedStyle(line,'::after');
  return {
    headings: [...document.querySelectorAll('.menu__heading')].map(function(h){return h.textContent;}),
    rows: rows.length,
    withNote: document.querySelectorAll('.menu__note').length,
    withBody: document.querySelectorAll('.menu__body').length,
    portraitDecoded: img.naturalWidth,
    portraitAlt: img.alt,
    portraitSrc: img.currentSrc.split('/').pop(),
    portraitRound: getComputedStyle(img).borderRadius,
    portraitSquare: Math.abs(img.getBoundingClientRect().width - img.getBoundingClientRect().height) < 1,
    proprietor: (document.querySelector('.portrait__role')||{}).textContent,
    // name and note must sit on ONE line with the note to the right of the name
    sameLine: Math.abs(name.top - note.top) < 12,
    noteAfterName: note.left > name.right,
    leaderDrawn: leader.backgroundImage !== 'none',
    /* No literal dots typed into the text.
       ⚠️ The backslash is DOUBLED because this regex lives inside a JS template
       literal. \\. there collapses to a bare . before the page ever sees it, and
       /.{4,}/ matches any four characters — so this "found literal periods" in
       perfectly clean text. Every backslash in an evaluate() string needs doubling. */
    literalDots: /\\.{4,}/.test(document.getElementById('panel-body').textContent),
  };
`);
ok('menu has the three sections asked for', menu.headings.length===3, menu.headings.join(' | '));
ok('twelve menu items', menu.rows===12, String(menu.rows));
ok('every item has a note and a description',
   menu.withNote===12 && menu.withBody===12, `${menu.withNote} notes, ${menu.withBody} bodies`);
ok('portrait decoded', menu.portraitDecoded>0, `${menu.portraitDecoded}px, ${menu.portraitSrc}`);
ok('portrait has real alt text', (menu.portraitAlt||'').length>20, menu.portraitAlt);
ok('portrait is a round square', menu.portraitSquare && /999|50%/.test(menu.portraitRound),
   menu.portraitRound);
ok('portrait names her role', menu.proprietor==='Proprietor', menu.proprietor);
ok('name and note share one line', menu.sameLine && menu.noteAfterName);
/* Two assertions, not one with an && — a combined check reported the wrong reason
   for the failure and sent me looking at the CSS when the test's own regex was
   broken. One cause per line. */
ok('leader dots are drawn in CSS', menu.leaderDrawn, menu.leaderDrawn ? 'gradient' : 'no background-image');
ok('no literal periods typed into the copy', !menu.literalDots,
   menu.literalDots ? 'found a run of periods' : 'clean');

console.log(out.join('\n'));
close();
