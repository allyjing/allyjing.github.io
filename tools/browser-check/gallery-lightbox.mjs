import { evaluate, goto, metrics, key, send, close } from './drive.mjs';
const out=[]; const ok=(n,p,d='')=>out.push(`${p?'PASS':'FAIL'}  ${n}${d?'  — '+d:''}`);

await metrics(1400, 900);
await goto('http://localhost:8000/#/interior');

// tables no longer overlap at the measured width
const ov = await evaluate(`
  const t=[...document.querySelectorAll('.table')].map(b=>({id:b.id,...b.getBoundingClientRect().toJSON()}));
  const bad=[];
  for(let i=0;i<t.length;i++)for(let j=i+1;j<t.length;j++){
    const a=t[i],b=t[j];
    if(a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom) bad.push(a.id+'/'+b.id);
  }
  return bad;
`);
ok('no two tables overlap', ov.length===0, ov.join(' ')||'clear');

// every table's own centre actually hits itself (elementFromPoint, per the harness note)
const hits = await evaluate(`
  return [...document.querySelectorAll('.table')].map(b=>{
    const r=b.getBoundingClientRect();
    const el=document.elementFromPoint(r.left+r.width/2, r.bottom-8);
    return {id:b.id.replace('table-',''), hit: el && el.closest('.table') ? el.closest('.table').id.replace('table-','') : null};
  });
`);
ok('each plate click lands on its own table', hits.every(h=>h.id===h.hit),
   hits.map(h=>h.id+'->'+h.hit).join(' '));

// --- the gallery
await goto('http://localhost:8000/#/interior/photography');
const gal = await evaluate(`
  const thumbs=[...document.querySelectorAll('.gallery__open')];
  const imgs=thumbs.map(b=>b.querySelector('img'));
  await new Promise(r=>setTimeout(r,1200));
  return {
    open: !document.getElementById('panel').hidden,
    title: document.getElementById('panel-title').textContent,
    n: thumbs.length,
    srcs: imgs.map(i=>i.currentSrc.split('/').pop()),
    decoded: imgs.map(i=>i.naturalWidth>0),
    lazy: imgs.every(i=>i.loading==='lazy'),
    hasSizes: imgs.every(i=>i.sizes.length>0),
    hasSrcset: imgs.every(i=>i.srcset.split(',').length===3),
    emptyAlt: imgs.every(i=>i.alt===''),
    labelled: thumbs.every(b=>b.getAttribute('aria-label')?.startsWith('Open larger:')),
    notes: [...document.querySelectorAll('.gallery__note')].length,
  };
`);
ok('photography panel opens from the URL', gal.open, gal.title);
ok('six thumbnails', gal.n===6);
ok('every thumbnail decoded', gal.decoded.every(Boolean), gal.srcs.join(' '));
ok('browser picked a responsive width', gal.srcs.every(s=>/-(480|960|1600)\.webp$/.test(s)), gal.srcs[0]);
ok('lazy + sizes + 3-entry srcset', gal.lazy && gal.hasSizes && gal.hasSrcset);
ok('images decorative, button carries the name', gal.emptyAlt && gal.labelled);
ok('gear and outro notes rendered', gal.notes===2, String(gal.notes));

// --- the lightbox
await evaluate(`document.querySelectorAll('.gallery__open')[2].click(); await new Promise(r=>setTimeout(r,500));`);
const lb1 = await evaluate(`
  const lb=document.getElementById('lightbox');
  return {open:!lb.hidden, count:document.getElementById('lightbox-count').textContent,
          src:document.getElementById('lightbox-image').currentSrc.split('/').pop(),
          alt:document.getElementById('lightbox-image').alt.slice(0,30),
          caption:document.getElementById('lightbox-caption').textContent.slice(0,40),
          focus:document.activeElement.id,
          panelInert:document.getElementById('panel').hasAttribute('inert'),
          decoded:document.getElementById('lightbox-image').naturalWidth};
`);
ok('lightbox opens on a thumbnail', lb1.open);
ok('it opens the one that was clicked', lb1.count==='3 of 6', lb1.count);
ok('it loads the 1600 file', lb1.src.endsWith('-1600.webp'), lb1.src);
ok('full image decoded', lb1.decoded>0, String(lb1.decoded));
ok('full image has real alt text', lb1.alt.length>10, lb1.alt+'...');
ok('focus moved to its close button', lb1.focus==='lightbox-close', lb1.focus);
ok('panel behind is inert', lb1.panelInert);

await key('ArrowRight');
const lb2 = await evaluate(`return document.getElementById('lightbox-count').textContent;`);
ok('right arrow advances', lb2==='4 of 6', lb2);
await evaluate(`
  for (let i=0;i<3;i++){document.getElementById('lightbox-next').click(); await new Promise(r=>setTimeout(r,60));}
`);
const lb3 = await evaluate(`return document.getElementById('lightbox-count').textContent;`);
ok('the set wraps round', lb3==='1 of 6', lb3);

// Escape must close the LIGHTBOX only, leaving the panel open
await key('Escape');
const esc = await evaluate(`
  return {lightbox:!document.getElementById('lightbox').hidden,
          panel:!document.getElementById('panel').hidden,
          hash:location.hash,
          focus:document.activeElement.className,
          panelInert:document.getElementById('panel').hasAttribute('inert')};
`);
ok('Escape closes the lightbox', esc.lightbox===false);
ok('...and leaves the panel OPEN', esc.panel===true, 'hash '+esc.hash);
ok('...and hands focus back to the thumbnail', esc.focus==='gallery__open', esc.focus);
ok('...and un-inerts the panel', esc.panelInert===false);

// a second Escape should now close the panel
await key('Escape');
const esc2 = await evaluate(`return {panel:!document.getElementById('panel').hidden, hash:location.hash};`);
ok('a second Escape closes the panel', esc2.panel===false, 'hash '+esc2.hash);

console.log(out.join('\n'));
close();
