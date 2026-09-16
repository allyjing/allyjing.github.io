import { evaluate, goto, metrics, send, waitFor, close } from './drive.mjs';
const out=[]; const ok=(n,p,d='')=>out.push(`${p?'PASS':'FAIL'}  ${n}${d?'  — '+d:''}`);

await metrics(1400, 900);
await goto('http://localhost:8000/#/exterior');
await new Promise(r=>setTimeout(r,700));

const before = await evaluate(`
  const j=document.querySelector('.actor');
  return {pos:j.style.left+','+j.style.top, walking:j.dataset.walking};
`);

// A REAL mouse event through CDP. input.js listens for `pointerdown`, and a
// synthetic `new MouseEvent('click')` never produces one — it reported "did not
// move" while everything was working.
const box = await evaluate(`
  const s=document.getElementById('stage').getBoundingClientRect();
  return {x:s.left+s.width*0.58, y:s.top+s.height*0.90};
`);
await send('Input.dispatchMouseEvent', { type:'mousePressed', x:box.x, y:box.y, button:'left', clickCount:1 });
await send('Input.dispatchMouseEvent', { type:'mouseReleased', x:box.x, y:box.y, button:'left', clickCount:1 });
await new Promise(r=>setTimeout(r,1100));

const after = await evaluate(`
  const j=document.querySelector('.actor');
  return {pos:j.style.left+','+j.style.top, pose:j.dataset.pose,
          legs:[...j.querySelectorAll('img')].map(i=>i.getAttribute('src').split('/').pop())};
`);
ok('Jingwen walks on a real click', before.pos!==after.pos, `${before.pos} -> ${after.pos}`);
ok('she is drawn from body + two legs', after.legs.length===3, after.legs.join(' '));

// walking into the door goes inside
const door = await evaluate(`
  const s=document.getElementById('stage').getBoundingClientRect();
  return {x:s.left+s.width*0.31, y:s.top+s.height*0.88};
`);
await send('Input.dispatchMouseEvent', { type:'mousePressed', x:door.x, y:door.y, button:'left', clickCount:1 });
await send('Input.dispatchMouseEvent', { type:'mouseReleased', x:door.x, y:door.y, button:'left', clickCount:1 });
await new Promise(r=>setTimeout(r,3000));
const inside = await evaluate(`return {hash:location.hash, scene:document.getElementById('stage').dataset.scene};`);
ok('walking to the door goes inside', inside.hash==='#/interior', `${inside.hash} scene=${inside.scene}`);

// and the Back outside control is there, bottom-right
const back = await evaluate(`
  const b=[...document.querySelectorAll('button,a')].find(e=>/back outside/i.test(e.textContent));
  if(!b) return {found:false};
  const r=b.getBoundingClientRect();
  return {found:true, bottomRight: r.right>innerWidth*0.6 && r.bottom>innerHeight*0.6,
          tappable: r.width>=44&&r.height>=44,
          onTop: (document.elementFromPoint(r.left+r.width/2, r.top+r.height/2)||{}).textContent};
`);
ok('Back outside control exists', back.found);
ok('...bottom-right and tappable', back.bottomRight && back.tappable);
ok('...and nothing covers it', /back outside/i.test(back.onTop||''), back.onTop||'');

// --- the "Please enter" sign must not sit on the walkway
//
// ⚠️ Back OUTSIDE first. By this point the checks above have walked to the door and
// gone in, and there are no garden signs inside the bakery — without this the whole
// block failed on "the enter sign exists" while the sign was perfectly fine.
await goto('http://localhost:8000/#/exterior');
await waitFor("[...document.querySelectorAll('.sign')].some(function(e){return /please enter/i.test(e.textContent);})",
              {label:'the enter sign'});
const sign = await evaluate(`
  const s=[...document.querySelectorAll('.sign')].find(function(e){
    return /please enter/i.test(e.textContent);});
  if(!s) return {found:false};
  const r=s.getBoundingClientRect();
  const others=[...document.querySelectorAll('.sign')].filter(function(e){return e!==s;})
    .map(function(e){return e.getBoundingClientRect();});
  const clash=others.some(function(o){
    return r.left<o.right && o.left<r.right && r.top<o.bottom && o.top<r.bottom;});
  return {found:true, left:s.style.left, top:s.style.top, clash:clash,
          onScreen: r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight,
          tappable: r.width>=44 && r.height>=44};
`);
ok('the enter sign exists', sign.found);
/* Coordinates, not pixels: the sign was moved OFF the stepping stones deliberately
   and the only durable way to assert that is to pin where it stands. See scenes.js. */
ok('...stands clear of the walkway, right of the path',
   sign.left === '41%' && sign.top === '87%', `${sign.left}, ${sign.top}`);
ok('...does not collide with the other signs', sign.clash === false);
ok('...is on screen and tappable', sign.onScreen && sign.tappable);

console.log(out.join('\n'));
close();
