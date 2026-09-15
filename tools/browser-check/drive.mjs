// Headless Chrome over the DevTools Protocol. Node 24 has a native WebSocket, so
// this needs nothing installed — see the browser-verification-harness note.
const PORT = process.env.CDP_PORT || 9331;

async function target() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('no CDP page target');
}

const ws = new WebSocket(await target());
await new Promise(r => ws.addEventListener('open', r, { once: true }));

let id = 0;
const pending = new Map();
ws.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
export function send(method, params = {}) {
  const myId = ++id;
  ws.send(JSON.stringify({ id: myId, method, params }));
  return new Promise(r => pending.set(myId, r));
}
export async function evaluate(expr) {
  const r = await send('Runtime.evaluate', {
    expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true,
  });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
  return r.result?.result?.value;
}
export async function goto(url) {
  await send('Page.enable');
  await send('Runtime.enable');
  // ⚠️ Chrome's own cache is a SECOND stale-asset trap on top of the one serve.py's
  // no-store header solves. A CSS edit did not reach the page here and produced a
  // clean, confident, wrong FAIL on a rule that was already fixed. Disable the
  // cache AND cache-bust the URL, every navigation.
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  const bust = (url.includes('?') ? '&' : '?') + 'cdp=' + Date.now();
  const [path, hash] = url.split('#');
  await send('Page.navigate', { url: path + bust + (hash ? '#' + hash : '') });
  await new Promise(r => setTimeout(r, 900));
}
export async function key(k, type = 'keyDown') {
  const codes = { Escape: 27, Tab: 9, ArrowRight: 39, ArrowLeft: 37, Enter: 13 };
  await send('Input.dispatchKeyEvent', {
    type, key: k, code: k, windowsVirtualKeyCode: codes[k], nativeVirtualKeyCode: codes[k],
  });
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp', key: k, code: k, windowsVirtualKeyCode: codes[k], nativeVirtualKeyCode: codes[k],
  });
  await new Promise(r => setTimeout(r, 160));
}
export async function metrics(w, h) {
  await send('Emulation.setDeviceMetricsOverride',
    { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 450));
}
export function close() { ws.close(); }
