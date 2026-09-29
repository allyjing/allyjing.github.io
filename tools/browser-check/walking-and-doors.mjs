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

// --- the resume is reachable from INSIDE the bakery
//
// The top-right corner link was removed, so this sign and the board on the LinkedIn
// post are the only two ways to the resume anywhere on the site. If this block fails,
// a recruiter standing in the room has no way out to it — see the R23 override note
// in CLAUDE.md.
//
// ⚠️ 1400x900 is 1.56, BELOW the 8:5 breakpoint, so this runs in the DOCKED layout —
// where this sign and "Back outside" both want the bottom-right corner. That overlap
// is the whole reason the last assertion here exists.
const shelf = await evaluate(`
  const a=[...document.querySelectorAll('.sign__board')].find(function(e){
    return /resume/i.test(e.textContent);});
  if(!a) return {found:false};
  const r=a.getBoundingClientRect();
  const b=[...document.querySelectorAll('button,a')].find(function(e){
    return /back outside/i.test(e.textContent);});
  const o=b.getBoundingClientRect();
  return {found:true, href:a.getAttribute('href'), tag:a.tagName,
          onScreen: r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight,
          tappable: r.width>=44 && r.height>=44,
          onTop: (document.elementFromPoint(r.left+r.width/2, r.top+r.height/2)||{}).textContent,
          clearsBack: !(r.left<o.right && o.left<r.right && r.top<o.bottom && o.top<r.bottom)};
`);
ok('the resume sign exists inside the bakery', shelf.found);
ok('...is a real link to resume.html', shelf.tag==='A' && shelf.href==='resume.html',
   `${shelf.tag} -> ${shelf.href}`);
ok('...is on screen and tappable', shelf.onScreen && shelf.tappable);
ok('...and nothing covers it', /resume/i.test(shelf.onTop||''), shelf.onTop||'');
ok('...and it does not sit on top of Back outside', shelf.clearsBack===true);

// --- the corner Resume link is GONE, in both scenes
//
// Removing it was asked for directly and overrides PRD R23. Pinned so that restoring
// R23 from the spec is a deliberate act with a failing check to answer, rather than
// something that quietly grows a third copy of the same link.
const corner = await evaluate(`
  return {n: document.querySelectorAll('.chrome--resume').length};
`);
ok('no corner Resume link in the interior', corner.n===0, `found ${corner.n}`);

// --- the "Please enter" sign must not sit on the walkway
//
// ⚠️ Back OUTSIDE first. By this point the checks above have walked to the door and
// gone in, and the only sign inside the bakery is the resume one — without this the
// whole block failed on "the enter sign exists" while the sign was perfectly fine.
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
ok('...stands on the grass under the bay window, clear of the walkway',
   sign.left === '23%' && sign.top === '78%', `${sign.left}, ${sign.top}`);
ok('...does not collide with the other signs', sign.clash === false);
ok('...is on screen and tappable', sign.onScreen && sign.tappable);

/* It is the ONE board on the site that is deliberately loud. If it quietly reverts to
   the cream shop-sign face it stops being the thing that says where the door is. */
const enterFace = await evaluate(`
  const b=[...document.querySelectorAll('.sign--enter .sign__board')][0];
  if(!b) return {found:false};
  const c=getComputedStyle(b);
  return {found:true, bg:c.backgroundColor, ink:c.color, text:b.textContent};
`);
ok('...is the berry board, not a cream one', enterFace.found && enterFace.bg!==enterFace.ink,
   `${enterFace.bg} on ${enterFace.ink}`);
/* The sign stands LEFT of the door now, so the arrow points RIGHT. Pinned because a
   sign pointing away from the door is worse than a sign with no arrow at all. */
ok('...and it points right, at the door', /→/.test(enterFace.text||''), enterFace.text||'');

// --- LinkedIn and Resume are ONE board, not two stacked
//
// Asked for directly: "just have one large sign instead of like having 2 boxes
// together". The links must therefore have NO board face of their own — the panel
// around them carries it. Asserting on the rendered background is the only way to
// catch a revert; counting elements would pass either way.
const contact = await evaluate(`
  const p=document.querySelector('.sign__panel');
  if(!p) return {found:false};
  const links=[...p.querySelectorAll('.sign__board')];
  const face=getComputedStyle(p);
  const kids=links.map(function(a){const c=getComputedStyle(a);
    return {bg:c.backgroundColor, bw:c.borderTopWidth, shadow:c.boxShadow};});
  return {found:true, n:links.length,
          labels:links.map(function(a){return a.textContent;}).join('+'),
          panelPainted: face.backgroundColor!=='rgba(0, 0, 0, 0)' && face.borderStyle!=='none',
          kidsBare: kids.every(function(k){return k.bg==='rgba(0, 0, 0, 0)' && k.shadow==='none';}),
          divided: kids[1] && kids[1].bw!=='0px',
          posts: document.querySelectorAll('.sign').length};
`);
ok('LinkedIn and Resume share one board', contact.found && contact.n===2, contact.labels||'');
ok('...and the board is the thing that is painted', contact.panelPainted===true);
ok('...the links on it have no box of their own', contact.kidsBare===true);
ok('...with a rule between them', contact.divided===true);
ok('...on three posts total, not four', contact.posts===3, `${contact.posts} posts`);

const cornerOut = await evaluate(`
  return {n: document.querySelectorAll('.chrome--resume').length};
`);
ok('no corner Resume link outdoors either', cornerOut.n===0, `found ${cornerOut.n}`);

console.log(out.join('\n'));
close();
