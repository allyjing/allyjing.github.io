// The welcome card (2026-11-03): it opens on a BARE arrival only, carries the three
// quick links, fits a phone, and gets out of the way like any other panel.
import { evaluate, goto, metrics, waitFor, send, close } from './drive.mjs';
import { writeFileSync } from 'node:fs';
const out=[]; const ok=(n,p,d='')=>out.push(`${p?'PASS':'FAIL'}  ${n}${d?'  — '+d:''}`);

await metrics(1600, 900);

// --- a bare address opens it
await goto('http://localhost:8000/');
await waitFor("!document.getElementById('panel').hidden", {label:'welcome open'});
const open = await evaluate(`
  return {hash: location.hash,
          title: document.getElementById('panel-title').textContent,
          inert: document.getElementById('stage').hasAttribute('inert'),
          links: [...document.querySelectorAll('.welcome__link')].map(a=>a.textContent+'='+a.getAttribute('href')),
          focus: document.activeElement.className};
`);
ok('a bare address opens the welcome card', open.hash==='#/exterior/welcome', open.hash);
ok('...titled as the bakery', /Peachy Sweets/.test(open.title), open.title);
ok('...with the scene behind it inert', open.inert);
ok('...and focus on Close, like every panel', /panel__close/.test(open.focus), open.focus);
ok('quick links: Resume, LinkedIn, Projects, in that order',
   open.links.join(' | ')==='Resume=resume.html | LinkedIn=https://www.linkedin.com/in/allyjing/ | Projects=#/interior/projects',
   open.links.join(' | '));

// --- Start exploring closes it through the router
await evaluate(`document.querySelector('.welcome__start').click(); await new Promise(r=>setTimeout(r,400));`);
const shut = await evaluate(`return {hidden: document.getElementById('panel').hidden, hash: location.hash,
  inert: document.getElementById('stage').hasAttribute('inert')};`);
ok('Start exploring closes it', shut.hidden, shut.hash);
ok('...back to the plain exterior', shut.hash==='#/exterior', shut.hash);
ok('...and the scene is usable again', !shut.inert);

// --- a deliberate link does NOT get the card
await goto('http://localhost:8000/#/exterior');
const quiet = await evaluate(`return document.getElementById('panel').hidden;`);
ok('#/exterior does not open the welcome card', quiet);

// --- Projects jumps straight into the Projects panel indoors
await goto('http://localhost:8000/');
await waitFor("!document.getElementById('panel').hidden", {label:'welcome open again'});
await evaluate(`document.querySelectorAll('.welcome__link')[2].click(); await new Promise(r=>setTimeout(r,700));`);
const jump = await evaluate(`return {hash: location.hash, title: document.getElementById('panel-title').textContent};`);
ok('the Projects link opens the Projects panel', jump.hash==='#/interior/projects' && jump.title==='Projects',
   jump.hash+' / '+jump.title);

// --- fits a phone, and nothing in it is cut off at the side
await metrics(390, 844);
await goto('http://localhost:8000/');
await waitFor("!document.getElementById('panel').hidden", {label:'welcome on a phone'});
const phone = await evaluate(`
  const c=document.querySelector('.panel__card').getBoundingClientRect();
  const s=document.querySelector('.welcome__start').getBoundingClientRect();
  const widest=Math.max(...[...document.querySelectorAll('#panel-body *')].map(e=>e.getBoundingClientRect().right));
  return {left:+c.left.toFixed(0), right:+c.right.toFixed(0), vw: innerWidth, widest:+widest.toFixed(0),
          startH:+s.height.toFixed(0),
          linksTall: [...document.querySelectorAll('.welcome__link')].every(a=>a.getBoundingClientRect().height>=44)};
`);
ok('the card fits a 390px phone', phone.left>=0 && phone.right<=phone.vw, `${phone.left}–${phone.right} of ${phone.vw}`);
ok('nothing inside it runs past the card', phone.widest<=phone.right, `widest ${phone.widest}, card ${phone.right}`);
ok('quick links are full tap targets', phone.linksTall);
ok('Start exploring is a full tap target', phone.startH>=44, phone.startH+'px');
const shot = await send('Page.captureScreenshot', { format: 'png' });
// send() returns the whole CDP reply, so the image is under .result
writeFileSync(process.env.SHOT || '/dev/null', Buffer.from(shot.result.data, 'base64'));

// --- Minesweeper is in About me → Hobbies
await metrics(1600, 900);
await goto('http://localhost:8000/#/interior/life/hobbies');
await waitFor("document.querySelector('.journal__page')", {label:'hobbies page'});
const ms = await evaluate(`return document.querySelector('.journal__page').textContent;`);
ok('Minesweeper is in Hobbies', /Minesweeper/.test(ms));
ok('...with her rank and best time', /108,297/.test(ms) && /4\.825/.test(ms));

console.log(out.join('\n'));
close();
