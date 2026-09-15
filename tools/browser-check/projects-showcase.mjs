import { evaluate, goto, metrics, key, waitFor, close } from './drive.mjs';
const out=[]; const ok=(n,p,d='')=>out.push(`${p?'PASS':'FAIL'}  ${n}${d?'  — '+d:''}`);

await metrics(1400, 950);

// --- the index
await goto('http://localhost:8000/#/interior/projects');
await waitFor("document.querySelectorAll('.showcase__card').length===6", {label:'six cards'});
const idx = await evaluate(`
  const cards=[...document.querySelectorAll('.showcase__card')];
  return {
    n: cards.length,
    ids: cards.map(c=>c.id),
    labelled: cards.every(c=>/^Read about /.test(c.getAttribute('aria-label')||'')),
    covers: cards.filter(c=>c.querySelector('img.showcase__cover')).length,
    placeholders: [...document.querySelectorAll('.showcase__cover--none')].map(e=>e.textContent),
    coverDecoded: [...document.querySelectorAll('img.showcase__cover')].every(i=>i.naturalWidth>0),
    equalHeights: (()=>{const h=cards.map(c=>Math.round(c.getBoundingClientRect().height));
      return new Set(h.slice(0,2)).size===1;})(),
    title: document.getElementById('panel-title').textContent,
  };
`);
ok('six project cards', idx.n===6, idx.ids.join(' '));
ok('each card says what it opens', idx.labelled);
ok('two cards carry a real cover photo', idx.covers===2, String(idx.covers));
ok('cover photos decoded', idx.coverDecoded);
ok('photo-less cards say so, not a letter',
   idx.placeholders.length===4 && idx.placeholders.every(t=>t==='No photos yet'),
   idx.placeholders.join(' | '));
ok('cards in a row are the same height', idx.equalHeights);
ok('panel titled Projects on the index', idx.title==='Projects', idx.title);

// --- clicking a card opens its page, and it is a ROUTE change
const det = await evaluate(`
  document.getElementById('project-arcadium').click();
  await new Promise(r=>setTimeout(r,900));
  const facts=[...document.querySelectorAll('.project__facts dt')].map(d=>d.textContent);
  return {
    hash: location.hash,
    title: document.getElementById('panel-title').textContent,
    subtitle: (document.querySelector('.project__subtitle')||{}).textContent,
    facts,
    sections: [...document.querySelectorAll('.project__section h3')].map(h=>h.textContent),
    chars: document.getElementById('panel-body').textContent.length,
    photos: document.querySelectorAll('.gallery__item').length,
    photosDecoded: [...document.querySelectorAll('.gallery__thumb')].every(i=>i.naturalWidth>0),
    back: (document.querySelector('.showcase__back')||{}).textContent,
    // the way out must be the FIRST focusable inside the body
    firstFocusable: (document.querySelector('#panel-body button, #panel-body a')||{}).className,
    panelStillOpen: !document.getElementById('panel').hidden,
    introGone: !document.querySelector('.panel__intro'),
    noDuplicateTitle: !document.querySelector('.project__title'),
  };
`);
ok('clicking a card changes the URL', det.hash==='#/interior/projects/arcadium', det.hash);
ok('the panel stays open (no close/reopen)', det.panelStillOpen);
ok('dialog is titled by the project', det.title==='Arcadium', det.title);
ok('no duplicated project heading', det.noDuplicateTitle);
ok('panel intro is not repeated over one project', det.introGone);
ok('subtitle shown', /Portable arcade/.test(det.subtitle||''), det.subtitle||'');
ok('facts are labelled', det.facts.join(',')==='Year,For,Made with', det.facts.join(','));
ok('her three sections render', det.sections.length>=3, det.sections.join(' | '));
ok('real depth of content', det.chars>1200, det.chars+' chars');
ok('four build photos', det.photos===4, String(det.photos));
ok('build photos decoded', det.photosDecoded);
ok('the way out is first in the page', det.firstFocusable==='showcase__back', det.firstFocusable);

// --- back to the index
const back = await evaluate(`
  document.querySelector('.showcase__back').click();
  await new Promise(r=>setTimeout(r,900));
  return {hash: location.hash, cards: document.querySelectorAll('.showcase__card').length,
          title: document.getElementById('panel-title').textContent};
`);
ok('"All projects" returns to the index', back.cards===6 && back.title==='Projects',
   `${back.hash} ${back.cards} cards`);
ok('...and it is a route change', back.hash==='#/interior/projects', back.hash);

// --- the browser Back button steps through it
const hist = await evaluate(`
  document.getElementById('project-cadodile').click();
  await new Promise(r=>setTimeout(r,700));
  const deep=location.hash;
  history.back();
  await new Promise(r=>setTimeout(r,900));
  return {deep, afterBack: location.hash,
          cards: document.querySelectorAll('.showcase__card').length};
`);
ok('Back steps out of a project, not out of the site',
   hist.afterBack==='#/interior/projects' && hist.cards===6,
   `${hist.deep} -> ${hist.afterBack}`);

// --- a cold deep link, and a bad slug
await goto('http://localhost:8000/#/interior/projects/cadodile');
await waitFor("document.getElementById('panel-title').textContent==='CADodile'", {label:'CADodile page'});
const cold = await evaluate(`
  return {title: document.getElementById('panel-title').textContent,
          open: !document.getElementById('panel').hidden,
          photos: document.querySelectorAll('.gallery__item').length};
`);
ok('a project URL works on a cold load', cold.open && cold.title==='CADodile',
   `${cold.title}, ${cold.photos} photos`);

await goto('http://localhost:8000/#/interior/projects/does-not-exist');
await waitFor("document.querySelectorAll('.showcase__card').length===6", {label:'fallback to index'});
const bad = await evaluate(`
  return {cards: document.querySelectorAll('.showcase__card').length,
          title: document.getElementById('panel-title').textContent};
`);
ok('an unknown project falls back to the index', bad.cards===6 && bad.title==='Projects',
   `${bad.title}, ${bad.cards} cards`);

// --- the lightbox still works from inside a project
await goto('http://localhost:8000/#/interior/projects/arcadium');
// Wait for the thumbnails to EXIST rather than sleeping and hoping. A fixed wait made
// `querySelectorAll(...)[0].click()` throw on undefined, intermittently.
await waitFor("document.querySelectorAll('.gallery__open').length===4", {label:'four project photos'});
await evaluate(`document.querySelectorAll('.gallery__open')[0].click();`);
// Same as the gallery suite: wait for the photo to decode, not just for the dialog.
await waitFor("!document.getElementById('lightbox').hidden && document.getElementById('lightbox-image').naturalWidth > 0",
              {label:'lightbox photo decoded'});
const lb = await evaluate(`
  return {open: !document.getElementById('lightbox').hidden,
          count: document.getElementById('lightbox-count').textContent,
          src: document.getElementById('lightbox-image').currentSrc.split('/').pop()};
`);
ok('project photos open in the lightbox', lb.open, lb.src);
ok("it counts only that project's photos", lb.count==='1 of 4', lb.count);
await key('Escape');
const after = await evaluate(`
  return {lightbox:!document.getElementById('lightbox').hidden,
          panel:!document.getElementById('panel').hidden, hash:location.hash};
`);
ok('Escape closes the photo, keeps the project', after.lightbox===false && after.panel===true,
   after.hash);

// --- narrow screen: cards go to one column, photos stay two
await metrics(390, 844);
await goto('http://localhost:8000/#/interior/projects');
await waitFor("document.querySelectorAll('.showcase__card').length===6", {label:'cards on phone'});
const phone = await evaluate(`
  const sc=getComputedStyle(document.querySelector('.showcase')).gridTemplateColumns.split(' ').length;
  const card=document.querySelector('.showcase__card');
  return {showcaseCols: sc, row: getComputedStyle(card).flexDirection,
          fits: card.getBoundingClientRect().width <= 390};
`);
ok('cards drop to one column on a phone', phone.showcaseCols===1, phone.showcaseCols+' columns');
ok('...laid out cover-beside-text', phone.row==='row', phone.row);
ok('...and fit the viewport', phone.fits);

console.log(out.join('\n'));
close();
