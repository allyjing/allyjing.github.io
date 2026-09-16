import { evaluate, goto, metrics, close } from './drive.mjs';
const out=[]; const ok=(n,p,d='')=>out.push(`${p?'PASS':'FAIL'}  ${n}${d?'  — '+d:''}`);

// 1400x800 = 1.75, comfortably ABOVE the 8/5 (1.6) breakpoint, so this is the
// wide layout where tables sit on the painted tables.
await metrics(1400, 800);
await goto('http://localhost:8000/#/interior');

const wide = await evaluate(`
  const b=document.getElementById('table-life');
  const d=b.querySelector('img.dessert').getBoundingClientRect();
  const k=b.querySelector('img.drink').getBoundingClientRect();
  const s=b.querySelector('.serving').getBoundingClientRect();
  const bb=b.getBoundingClientRect();
  const mq=matchMedia('(max-aspect-ratio: 8/5)').matches;
  return {menuActive:mq, dBottom:d.bottom, kBottom:k.bottom, dW:d.width, kW:k.width,
          sW:s.width, bW:bb.width, drinkDisplay:getComputedStyle(b.querySelector('img.drink')).display};
`);
ok('wide layout active (not the phone menu)', wide.menuActive===false, `menu=${wide.menuActive}`);
ok('drink is visible', wide.drinkDisplay!=='none' && wide.kW>0, `${wide.drinkDisplay} ${wide.kW.toFixed(0)}px`);
ok('dessert and drink stand on one line', Math.abs(wide.dBottom-wide.kBottom)<1.5,
   `${wide.dBottom.toFixed(1)} vs ${wide.kBottom.toFixed(1)}`);
ok('drink narrower than dessert', wide.kW<wide.dW, `${wide.kW.toFixed(0)} vs ${wide.dW.toFixed(0)}`);
ok('plate spans dessert not whole table', wide.sW<wide.bW*0.75, `${wide.sW.toFixed(0)} of ${wide.bW.toFixed(0)}`);

// all five, bottoms aligned per table
const rows = await evaluate(`
  return [...document.querySelectorAll('.table')].map(b=>{
    const d=b.querySelector('img.dessert').getBoundingClientRect();
    const k=b.querySelector('img.drink');
    const kr=k?k.getBoundingClientRect():null;
    return {id:b.id, dB:+d.bottom.toFixed(1), kB:kr?+kr.bottom.toFixed(1):null,
            w:+d.width.toFixed(0), overlaps:false};
  });
`);
ok('all desserts have real size', rows.every(r=>r.w>30), rows.map(r=>r.w).join(' '));
ok('each drink aligns with its dessert',
   rows.filter(r=>r.kB!==null).every(r=>Math.abs(r.dB-r.kB)<1.5),
   rows.filter(r=>r.kB!==null).map(r=>`${r.id.replace('table-','')}:${(r.dB-r.kB).toFixed(1)}`).join(' '));

// no two tables overlap (the trap the memory calls out)
const ov = await evaluate(`
  const r=[...document.querySelectorAll('.table')].map(b=>({id:b.id,...b.getBoundingClientRect().toJSON()}));
  const bad=[];
  for(let i=0;i<r.length;i++)for(let j=i+1;j<r.length;j++){
    const a=r[i],b=r[j];
    if(a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom) bad.push(a.id+'/'+b.id);
  }
  return bad;
`);
ok('no two tables overlap', ov.length===0, ov.join(' ')||'clear');

// --- the generated sprites, and what the layout depends on about them
const sprites = await evaluate(`
  const tables=[...document.querySelectorAll('.table')];
  return {
    ids: tables.map(function(b){return b.id.replace('table-','');}),
    decoded: tables.every(function(b){
      return [...b.querySelectorAll('img')].every(function(i){return i.naturalWidth>0;});}),
    /* ⚠️ All eight share ONE intrinsic height. key-desserts.py guarantees it by
       cropping a shared VERTICAL box, and the CSS depends on it: the row has a
       definite height and every image takes height:100%, so one shared height is
       what makes them render at one scale with their baselines on a line. */
    heights: tables.map(function(b){return b.querySelector('img.dessert').naturalHeight;}),
    srcs: tables.map(function(b){return b.querySelector('img.dessert').getAttribute('src');}),
    plated: tables.map(function(b){
      return b.querySelector('.serving').classList.contains('serving--plated');}),
    /* The whole setting must sit ON its painted table rather than hang off it. */
    fit: tables.map(function(b){
      const kids=[...b.querySelectorAll('.serving,.drink')].map(function(e){return e.getBoundingClientRect();});
      const span=Math.max.apply(null,kids.map(function(k){return k.right;}))
               - Math.min.apply(null,kids.map(function(k){return k.left;}));
      return {span:span, table:b.getBoundingClientRect().width};
    }),
    /* Every sprite's own bottom row must be opaque, or its baseline is a lie. */
    bottomRows: tables.map(function(b){
      const i=b.querySelector('img.dessert');
      return i.naturalHeight;
    }),
  };
`);
ok('every sprite decoded', sprites.decoded);
ok('all sprites share one intrinsic height',
   new Set(sprites.heights).size===1, sprites.heights.join(','));
ok('Life is tiramisu, not the bolo bao',
   sprites.srcs.some(s=>/dessert-tiramisu\.webp/.test(s)) && !sprites.srcs.some(s=>/dessert-bao/.test(s)),
   sprites.srcs[3]);
ok('exactly one sprite suppresses the CSS plate',
   sprites.plated.filter(Boolean).length===1,
   sprites.ids.filter((id,i)=>sprites.plated[i]).join(',') || 'none');
ok('every place setting fits its table',
   sprites.fit.every(f=>f.span <= f.table),
   sprites.fit.map((f,i)=>sprites.ids[i]+':'+Math.round(f.span)+'/'+Math.round(f.table)).join(' '));

// --- phone: the menu layout
await metrics(390, 844);
await new Promise(r=>setTimeout(r,500));
const phone = await evaluate(`
  const b=document.getElementById('table-life');
  const k=b.querySelector('img.drink');
  const s=b.querySelector('.serving');
  const rects=[...document.querySelectorAll('.table')].map(x=>x.getBoundingClientRect());
  return {
    menuActive: matchMedia('(max-aspect-ratio: 8/5)').matches,
    drinkHidden: getComputedStyle(k).display==='none',
    plateHidden: getComputedStyle(s,'::after').display==='none',
    dessertW: b.querySelector('img.dessert').getBoundingClientRect().width,
    allOnScreen: rects.every(r=>r.left>=0&&r.right<=390&&r.top>=0&&r.bottom<=844&&r.width>=44&&r.height>=44),
    tapSizes: rects.map(function(r){return r.width.toFixed(0)+'x'+r.height.toFixed(0);}),
  };
`);
ok('phone menu layout active', phone.menuActive===true);
ok('drink hidden in the menu', phone.drinkHidden);
ok('plate hidden in the menu', phone.plateHidden);
ok('dessert icon still drawn', phone.dessertW>20, `${phone.dessertW.toFixed(0)}px`);
ok('all five menu rows on screen and tappable', phone.allOnScreen, phone.tapSizes.join(' '));

console.log(out.join('\n'));
close();
