import { evaluate, goto, metrics, send, close } from './drive.mjs';
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

console.log(out.join('\n'));
close();
