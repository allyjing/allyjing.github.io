import { evaluate, goto, metrics, key, close } from './drive.mjs';
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

console.log(out.join('\n'));
close();
