// Feed Junnie!, the fountain post, the depth sort, the scroll lock, and the room's
// light. Every flow here was asked for directly — see CLAUDE.md "Feed Junnie!".
import { evaluate, goto, metrics, key, waitFor, close } from './drive.mjs';
const out=[]; const ok=(n,p,d='')=>out.push(`${p?'PASS':'FAIL'}  ${n}${d?'  — '+d:''}`);

await metrics(1600, 900);
await goto('http://localhost:8000/#/exterior');
await waitFor("document.getElementById('open-feed-junnie')");

// --- the post by the fountain ---------------------------------------------
const post = await evaluate(`
  const a=document.getElementById('open-feed-junnie');
  const r=a.getBoundingClientRect();
  const hit=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
  return {href:a.getAttribute('href'), top: hit===a,
          outdoorBoard: document.querySelectorAll('#props a[href*="leaderboard"]').length};
`);
ok('Feed Junnie! is a route link', post.href==='#/exterior/feed-junnie', post.href);
ok('nothing covers the Feed Junnie! board', post.top===true);
// Asked for directly: "no leaderbaord display on the exterior".
ok('there is NO leaderboard link outdoors', post.outdoorBoard===0, `${post.outdoorBoard}`);

// --- flow: how to play first, click off it, then pick a level --------------
await evaluate(`location.hash='#/exterior/feed-junnie'; return 1;`);
await waitFor("document.querySelector('.game__card')");
const first = await evaluate(`
  return {open:!document.getElementById('panel').hidden,
          title:document.getElementById('panel-title').textContent,
          card:document.querySelector('.game__card h3').textContent,
          wide:document.querySelector('.panel__card').classList.contains('panel__card--wide')};
`);
ok('the game panel opens outdoors', first.open===true && first.title==='Feed Junnie!', first.title);
ok('How to play pops up first', first.card==='How to play', first.card);
ok('...in the wide card', first.wide===true);

const dismissed = await evaluate(`
  const o=document.querySelector('.game__overlay');
  o.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  return {hidden:o.hidden, levels:document.querySelectorAll('.game__level').length,
          focus:document.activeElement.className};
`);
ok('clicking off the card closes it', dismissed.hidden===true);
ok('...and the three levels are there to pick', dismissed.levels===3, `${dismissed.levels}`);
ok('...with focus on the first level', dismissed.focus==='game__level', dismissed.focus);

// Asked for directly: levels VERTICAL, and the leaderboard at the BOTTOM of the game,
// with dividers like the About me tabs.
const shape = await evaluate(`
  const lv=[...document.querySelectorAll('.game__level')].map(e=>e.getBoundingClientRect());
  const main=document.querySelector('.game__main').getBoundingClientRect();
  const book=document.querySelector('.game .journal');
  const page=book.querySelector('.journal__page').getBoundingClientRect();
  const tabs=[...book.querySelectorAll('.journal__tab')].map(e=>e.getBoundingClientRect());
  return {stacked: lv[1].top>=lv[0].bottom && lv[2].top>=lv[1].bottom && lv[0].left===lv[2].left,
          below: page.top>=main.bottom,
          tabsRight: tabs.every(t=>t.left>=page.right-30),
          tabsInside: tabs.every(t=>t.bottom<=page.bottom)};
`);
ok('the levels are listed vertically', shape.stacked===true);
ok('the leaderboard is UNDER the game, not beside it', shape.below===true);
ok('...with About-me dividers sticking out of its right edge', shape.tabsRight===true);
ok('...and no divider hangs below the page', shape.tabsInside===true);

// --- a seeded win: the first click is safe, the board clears, a name is asked --
const win = await evaluate(`
  let seed=3; const rnd=()=>{seed=(seed*16807)%2147483647; return (seed-1)/2147483646;};
  const ms=await import('/src/engine/minesweeper.js');
  Math.random=rnd; seed=3; const twin=ms.createBoard(9,9,10); ms.dig(twin,0); seed=3;
  document.querySelector('.game__level').click();
  const cells=[...document.querySelectorAll('.game__cell')];
  const n=cells.length;
  cells[0].click();
  const firstSafe=cells[0].dataset.state==='open';
  await new Promise(r=>setTimeout(r,1100));
  for (let i=0;i<n;i++) if(!twin.cells[i].fish && cells[i].dataset.state==='hidden') cells[i].click();
  return {n, firstSafe, card:document.querySelector('.game__card h3')?.textContent};
`);
ok('Easy is 9 x 9', win.n===81, `${win.n}`);
ok('the first click is always safe', win.firstSafe===true);
ok('clearing the board wins', win.card==='Junnie is fed!', win.card||'no card');

// --- the name filter (pure, from data) -------------------------------------
const names = await evaluate(`
  const g=await import('/src/data/game.js');
  const t=(s)=>g.checkName(s,'Anonymous');
  return {blank:t('   ').name, ok:t('Ally_99').ok, rude:t('f u c k').ok, leet:t('5h1t').ok,
          word:t('my ass').ok, grape:t('Grape Class').ok, peacock:t('peacock').ok,
          long:t('a'.repeat(17)).reason, emoji:t('cat😺').reason};
`);
ok('a blank name is saved as Anonymous', names.blank==='Anonymous', names.blank);
ok('a handle is accepted', names.ok===true);
ok('spaced-out swearing is refused', names.rude===false);
ok('number-for-letter swearing is refused', names.leet===false);
ok('a rude whole word is refused', names.word===false);
ok('innocent words containing one are allowed', names.grape===true && names.peacock===true);
ok('17 characters is too long', names.long==='tooLong', names.long);
ok('emoji are refused', names.emoji==='characters', names.emoji);

// --- Escape closes it and focus returns to the board on the post ------------
await key('Escape');
await new Promise(r=>setTimeout(r,300));
const closed = await evaluate(`
  return {hash:location.hash, hidden:document.getElementById('panel').hidden,
          focus:document.activeElement.id};
`);
ok('Escape closes the game back to the garden', closed.hidden===true && closed.hash==='#/exterior', closed.hash);
ok('...and focus goes back to the Feed Junnie! board', closed.focus==='open-feed-junnie', closed.focus);

// --- the full leaderboard: all three levels ---------------------------------
await evaluate(`location.hash='#/exterior/leaderboard'; return 1;`);
await waitFor("document.querySelectorAll('.scoreboards__page').length");
const board = await evaluate(`
  return {pages:[...document.querySelectorAll('.scoreboards__page h3')].map(h=>h.textContent)};
`);
ok('the leaderboard panel shows all three levels', board.pages.join(',')==='Easy,Intermediate,Expert', board.pages.join(','));
await key('Escape');

// --- a game panel does not open indoors, nor a table panel outdoors ---------
await evaluate(`location.hash='#/interior/feed-junnie'; return 1;`);
await new Promise(r=>setTimeout(r,600));
const wrong = await evaluate(`return document.getElementById('panel').hidden;`);
ok('#/interior/feed-junnie opens no panel', wrong===true);

// --- the room's light follows the clock -------------------------------------
const light = await evaluate(`
  const w=document.querySelector('.room-light__window');
  /* Read the TARGET value on <body>, not the window element: the window cross-fades
     its registered colour over 600ms, and headless Chrome does not run that
     transition, so the element itself still reported noon at "night". */
  const read=()=>getComputedStyle(document.body).getPropertyValue('--room-window-top').trim();
  document.body.dataset.time='noon'; await new Promise(r=>setTimeout(r,900));
  const noon=read();
  document.body.dataset.time='night'; await new Promise(r=>setTimeout(r,900));
  const night=read();
  const card=getComputedStyle(document.querySelector('.table .bubble')).backgroundColor;
  document.body.dataset.time='noon'; await new Promise(r=>setTimeout(r,900));
  const cardNoon=getComputedStyle(document.querySelector('.table .bubble')).backgroundColor;
  return {noon, night, shown:getComputedStyle(document.querySelector('.layer--room-light')).display,
          blend:getComputedStyle(w).mixBlendMode, layerZ:getComputedStyle(document.querySelector('.layer--room-light')).zIndex,
          card, cardNoon};
`);
ok('the room light layer is shown indoors', light.shown==='block', light.shown);
ok('the window is untouched at noon', /255, 255, 255|#fff/i.test(light.noon), light.noon);
ok('...and dark at night', light.noon!==light.night, light.night);
ok('the light layer is NOT a stacking context, so the blend reaches the art', light.layerZ==='auto', light.layerZ);
ok('the bubbles still do not change with the clock', light.card===light.cardNoon, `${light.card} vs ${light.cardNoon}`);

// --- depth: Jingwen in front of Junnie when she is lower on screen -----------
await evaluate(`location.hash='#/exterior'; return 1;`);
await waitFor("document.getElementById('actor-junnie')");
const depth = await evaluate(`
  return {j:Number(document.getElementById('actor-jingwen').style.zIndex),
          k:Number(document.getElementById('actor-junnie').style.zIndex)};
`);
ok('Jingwen (y 94) is drawn in front of Junnie (y 86)', depth.j>depth.k, `${depth.j} vs ${depth.k}`);

// --- the stage cannot be scrolled by focus ----------------------------------
const scroll = await evaluate(`
  const s=document.getElementById('stage');
  s.scrollTop=200; s.scrollLeft=200;
  return {ov:getComputedStyle(s).overflowX, top:s.scrollTop, left:s.scrollLeft};
`);
ok('the stage is overflow: clip', scroll.ov==='clip', scroll.ov);
ok('...so nothing can scroll it', scroll.top===0 && scroll.left===0, `${scroll.left},${scroll.top}`);

console.log(out.join('\n'));
close();
