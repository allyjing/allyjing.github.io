import { evaluate, goto, metrics, key, close } from './drive.mjs';
const out=[]; const ok=(n,p,d='')=>out.push(`${p?'PASS':'FAIL'}  ${n}${d?'  — '+d:''}`);

await metrics(1400, 900);

// tab order now reaches the way out first
await goto('http://localhost:8000/#/interior/photography');
await evaluate(`document.querySelectorAll('.gallery__open')[0].click(); await new Promise(r=>setTimeout(r,400));`);
// Focus already STARTS on the close button, so the DOM order is what to assert —
// tabbing from close correctly lands on prev next.
const order = await evaluate(`
  return [...document.querySelectorAll('#lightbox button')].map(b=>b.id);
`);
ok('close is first in the lightbox tab order', order[0]==='lightbox-close', order.join(' > '));
const ids=[]; const start = await evaluate(`return document.activeElement.id;`);
for (let i=0;i<3;i++){ await key('Tab'); ids.push(await evaluate(`return document.activeElement.id;`)); }
ok('Tab cycles the three controls and wraps', ids.join(',')==='lightbox-prev,lightbox-next,lightbox-close',
   'start '+start+' > '+ids.join(' > '));

// the lightbox frame did not lose its layout to the moved button
const lay = await evaluate(`
  const f=document.querySelector('.lightbox__frame').getBoundingClientRect();
  const i=document.getElementById('lightbox-image').getBoundingClientRect();
  const c=document.querySelector('.lightbox__controls').getBoundingClientRect();
  const b=document.getElementById('lightbox-close').getBoundingClientRect();
  return {frameW:+f.width.toFixed(0), imgW:+i.width.toFixed(0), imgH:+i.height.toFixed(0),
          imgAboveControls: i.bottom <= c.top + 1,
          closeAboveFrame: b.bottom <= f.top + 2,
          closeTappable: b.width>=44 && b.height>=44,
          imgInFrame: i.left>=f.left-1 && i.right<=f.right+1};
`);
ok('photo sits above the controls', lay.imgAboveControls, `img ${lay.imgW}x${lay.imgH}`);
ok('close button sits above the frame, still tappable', lay.closeAboveFrame && lay.closeTappable);
ok('photo stays inside the frame', lay.imgInFrame);

// --- contrast inside the lightbox, measured not assumed
const con = await evaluate(`
  const lum=c=>{const [r,g,b]=c.match(/\\d+/g).slice(0,3).map(Number).map(v=>v/255)
    .map(v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4));
    return 0.2126*r+0.7152*g+0.0722*b;};
  const ratio=(a,b)=>{const x=lum(a),y=lum(b),hi=Math.max(x,y),lo=Math.min(x,y);return (hi+0.05)/(lo+0.05);};
  const cs=getComputedStyle;
  const mat=cs(document.querySelector('.lightbox__frame')).backgroundColor;
  return {
    caption:+ratio(cs(document.getElementById('lightbox-caption')).color, mat).toFixed(2),
    count:+ratio(cs(document.getElementById('lightbox-count')).color, mat).toFixed(2),
    navInk:+ratio(cs(document.getElementById('lightbox-next')).color, mat).toFixed(2),
    closeOnAccent:+ratio(cs(document.getElementById('lightbox-close')).color,
                         cs(document.getElementById('lightbox-close')).backgroundColor).toFixed(2),
  };
`);
ok('caption AAA on the mat', con.caption>=7, String(con.caption));
ok('counter AAA on the mat', con.count>=7, String(con.count));
ok('arrow glyphs AAA on the mat', con.navInk>=7, String(con.navInk));
ok('close label AA on the accent', con.closeOnAccent>=4.5, String(con.closeOnAccent));

// --- the exterior still works after the shared token rebinding change
await goto('http://localhost:8000/#/exterior');
const ext = await evaluate(`
  await new Promise(r=>setTimeout(r,700));
  /* ⚠️ Cycle to a time that actually applies a filter before asserting.
   * --scene-filter is 'none' at NOON by design, and the time of day comes from the
   * visitor's real clock (R27) — so this assertion passed at night and failed at
   * 2pm, on identical code. A check whose result depends on when it is run is worse
   * than no check. Advance until the filter is non-none, at most four clicks. */
  const clock=document.querySelector('.chrome--clock');
  let filter=getComputedStyle(document.querySelector('.layer--scene')).filter;
  let tries=0;
  while (filter==='none' && tries<4) {
    clock.click();
    await new Promise(r=>setTimeout(r,750));
    filter=getComputedStyle(document.querySelector('.layer--scene')).filter;
    tries++;
  }
  return {signs: document.querySelectorAll('.sign').length,
          actors: document.querySelectorAll('.actor').length,
          exteriorThemes: filter,
          time: document.body.dataset.time};
`);
ok('exterior renders its signs', ext.signs>=2, String(ext.signs));
ok('exterior renders its actors', ext.actors>=2, String(ext.actors));
ok('exterior STILL re-themes with the clock', ext.exteriorThemes!=='none', `${ext.time}: ${ext.exteriorThemes}`);
// Walking is checked in check6, which dispatches a REAL pointer event. A synthetic
// `new MouseEvent('click')` never produces the pointerdown input.js listens for.

console.log(out.join('\n'));
close();
