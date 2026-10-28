/* Repo path: src/engine/game.js
 *
 * Feed Junnie! — draws the minesweeper and its leaderboard inside the panel.
 * panel.js calls fillGame() for the outdoor panel; the rules themselves are in
 * minesweeper.js and the scores go through scores.js.
 *
 * The flow, as asked for:
 *   1. "How to play" pops up first. Clicking off it (or its button) closes it.
 *   2. Then the player picks a level, from a list down the page.
 *   3. They play. A win asks for a name, which they can skip.
 *   4. Then that level's top 10 pops up.
 *
 * Two dividers stick out of the side of the panel WINDOW, Game and Leaderboard,
 * asked for directly. Leaderboard shows all three levels side by side, laid out
 * after a screenshot Jingwen supplied: level name, then 1-10 with the name on the
 * left and the time on the right, under a "seconds" label.
 *
 * Everything the player reads comes from gameCopy in content.js.
 */

import { gameCopy } from '../data/content.js';
import { levels, levelById, checkName, formatTime, nameMaxLength } from '../data/game.js';
import { createBoard, dig, chord, toggleFlag, fishLeft } from './minesweeper.js';
import { scoresConnected, topScores, submitScore } from './scores.js';

/* A tiny helper so building the DOM reads top to bottom. */
function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(className, text, onClick) {
  const node = make('button', className, text);
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
}

/* --- leaderboard columns ---------------------------------------------------- */

/* One level's top 10, as one column: the level's name, then a table whose only
 * visible header is "seconds" over the times — asked for directly, "add the second
 * label on top of the seconds". The rank and name headers exist for a screen
 * reader and are visually hidden, as in the screenshot.
 *
 * `highlightId` is the row just saved, so the player can find themselves. Async
 * because the scores come over the network; it shows "Loading…" first so the space
 * is never blank. */
async function renderScores(into, levelId, highlightId = null) {
  const copy = gameCopy.board;
  into.replaceChildren(make('p', 'scores__note', copy.loading));

  if (!scoresConnected) {
    into.replaceChildren(make('p', 'scores__note', copy.notConnected));
    return;
  }

  let rows;
  try {
    rows = await topScores(levelId);
  } catch {
    into.replaceChildren(make('p', 'scores__note', copy.error));
    return;
  }

  if (!rows.length) {
    into.replaceChildren(make('p', 'scores__note', copy.empty));
    return;
  }

  const table = make('table', 'scores__table');
  const head = make('thead');
  const headRow = make('tr');
  const headers = [[copy.rank, 'scores__hidden'], [copy.name, 'scores__hidden'],
                   [copy.secondsLabel, 'scores__unit']];
  /* The hidden labels go in a span INSIDE the cell, not on the cell itself: a
   * visually-hidden <th> is taken out of the table's layout, and "seconds" then
   * slid left into the rank column. */
  for (const [label, className] of headers) {
    const th = make('th');
    th.scope = 'col';
    th.append(make('span', className, label));
    headRow.append(th);
  }
  head.append(headRow);

  const bodyRows = make('tbody');
  rows.forEach((row, at) => {
    const tr = make('tr');
    if (highlightId !== null && row.id === highlightId) tr.className = 'scores__mine';
    tr.append(
      make('td', 'scores__rank', copy.rankNumber(at + 1)),
      make('td', 'scores__name', row.name),
      make('td', 'scores__time', formatTime(row.time_ms)),
    );
    bodyRows.append(tr);
  });
  table.append(head, bodyRows);
  into.replaceChildren(table);
}

/* All three levels side by side, hardest first, as in the screenshot. */
function buildLeaderboard() {
  const wrap = make('div', 'scoreboards');
  const columns = [...levels].reverse().map((level) => {
    const column = make('section', 'scoreboards__column');
    const heading = make('h3', 'scoreboards__title', gameCopy.levels[level.id].label);
    const list = make('div', 'scoreboards__list');
    column.append(heading, list);
    wrap.append(column);
    return { id: level.id, list };
  });

  /* Re-read from the database each time the tab is opened, so a time saved a
   * moment ago is on it. */
  function refresh(highlight = {}) {
    for (const column of columns) {
      renderScores(column.list, column.id, highlight[column.id] ?? null);
    }
  }
  return { node: wrap, refresh };
}

/* The two dividers on the side of the panel WINDOW — Game and Leaderboard — asked
 * for directly: "i want the tabs to be on the side of the actual opening window".
 *
 * They live in #panel-tabs, BESIDE the card rather than inside it: the card clips
 * its contents to its rounded corners, and a divider has to stick out past its
 * edge. #panel-tabs is inside the dialog frame, so the focus trap and a screen
 * reader still reach it. panel.js empties and hides it for every other panel.
 *
 * Same divider look as the About me journal (.journal__tab), and a real ARIA
 * tablist with arrow keys. */
function buildWindowTabs(playView, scoresView, onShowScores) {
  const strip = document.getElementById('panel-tabs');
  strip.setAttribute('role', 'tablist');
  strip.setAttribute('aria-label', gameCopy.tabs.label);
  /* Beside the window on a wide screen, along its top on a phone (game.css). */
  const stacked = window.matchMedia('(max-width: 600px)').matches;
  strip.setAttribute('aria-orientation', stacked ? 'horizontal' : 'vertical');

  const choices = [
    { id: 'play', label: gameCopy.tabs.game, view: playView },
    { id: 'scores', label: gameCopy.tabs.leaderboard, view: scoresView },
  ];
  const tabs = choices.map((choice) => {
    const tab = button('journal__tab', choice.label, () => select(choice.id));
    tab.id = `game-tab-${choice.id}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `game-view-${choice.id}`);
    return tab;
  });

  function select(id, { focus = false } = {}) {
    choices.forEach((choice, at) => {
      const selected = choice.id === id;
      choice.view.hidden = !selected;
      tabs[at].setAttribute('aria-selected', String(selected));
      tabs[at].tabIndex = selected ? 0 : -1;
      if (selected && focus) tabs[at].focus();
    });
    if (id === 'scores') onShowScores();
  }

  strip.addEventListener('keydown', (event) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const at = tabs.indexOf(document.activeElement);
    const next = choices[(Math.max(at, 0) + step + choices.length) % choices.length];
    select(next.id, { focus: true });
  });

  strip.replaceChildren(...tabs);
  strip.hidden = false;
  select('play');
}

/* --- the game panel -------------------------------------------------------- */

/* Phones get Expert turned on its side — 16 wide and 30 tall instead of 30 wide —
 * because 30 columns on a 390px screen makes every tile a 12px crumb. */
function boardShape(level) {
  const narrow = window.matchMedia('(max-width: 40rem)').matches;
  if (narrow && level.cols > level.rows) return { rows: level.cols, cols: level.rows };
  return { rows: level.rows, cols: level.cols };
}

export function fillGame(body) {
  /* Two views in the panel body, switched by the dividers on the window's side.
   * Switching only hides one and shows the other, so a game in progress is still
   * there, clock and all, when the player comes back from the leaderboard. */
  const playView = make('div', 'game');
  playView.id = 'game-view-play';
  playView.setAttribute('role', 'tabpanel');
  playView.setAttribute('aria-labelledby', 'game-tab-play');

  const scoresView = make('div', 'game__scores');
  scoresView.id = 'game-view-scores';
  scoresView.setAttribute('role', 'tabpanel');
  scoresView.setAttribute('aria-labelledby', 'game-tab-scores');
  scoresView.hidden = true;
  const leaderboard = buildLeaderboard();
  scoresView.append(leaderboard.node);

  const main = make('div', 'game__main');
  const view = make('div', 'game__view');
  const overlay = make('div', 'game__overlay');
  overlay.hidden = true;
  main.append(view, overlay);
  playView.append(main);

  /* Announces win, loss and level changes to a screen reader. Visually hidden. */
  const live = make('p', 'game__live');
  live.setAttribute('aria-live', 'polite');

  body.append(playView, scoresView, live);

  /* The id of the score just saved on each level, so the Leaderboard tab can
   * highlight it too, not only the pop-up after the win. */
  const saved = {};
  buildWindowTabs(playView, scoresView, () => leaderboard.refresh(saved));

  let timer = null;          // the setInterval that ticks the clock
  let startedAt = null;      // performance.now() of the first dig

  function stopTimer() {
    if (timer !== null) clearInterval(timer);
    timer = null;
  }

  /* --- the pop-up card over the game ---- */

  /* `dismissable` cards close when the player clicks outside them — only the how-to
   * card, asked for directly ("after they click off"). The win and loss cards stay
   * until a button is pressed, so a stray click cannot throw away a winning time. */
  function showCard(build, { dismissable = false, onDismiss = null } = {}) {
    /* Cards sit in the middle of the game area. showLoss moves its own card to the
     * bottom afterwards; every other card puts it back here. */
    delete overlay.dataset.place;
    const card = make('div', 'game__card');
    card.setAttribute('role', 'group');
    build(card);
    overlay.replaceChildren(card);
    overlay.hidden = false;
    overlay.onclick = dismissable
      ? (event) => { if (event.target === overlay) { hideCard(); if (onDismiss) onDismiss(); } }
      : null;
    /* First control in the card, so a keyboard user lands inside it. */
    const first = card.querySelector('input, button, a');
    if (first) first.focus();
  }

  function hideCard() {
    overlay.hidden = true;
    overlay.replaceChildren();
    overlay.onclick = null;
  }

  /* --- 1. how to play ---- */

  function showHowTo() {
    const copy = gameCopy.howTo;
    showCard((card) => {
      card.append(make('h3', 'game__card-title', copy.title), make('p', null, copy.lead));
      const list = make('ul', 'game__rules');
      for (const rule of copy.rules) list.append(make('li', null, rule));
      card.append(list, make('p', 'game__hint', copy.keys));
      card.append(button('game__button game__button--main', copy.start, () => {
        hideCard();
        showPicker();
      }));
      card.append(make('p', 'game__hint', copy.dismissHint));
    }, { dismissable: true, onDismiss: showPicker });
  }

  /* --- 2. pick a level ---- */

  function showPicker() {
    stopTimer();
    const copy = gameCopy.pick;
    const heading = make('h3', 'game__heading', copy.title);
    const choices = make('div', 'game__levels');
    for (const level of levels) {
      const words = gameCopy.levels[level.id];
      const choice = button('game__level', '', () => startGame(level.id));
      choice.append(make('span', 'game__level-name', words.label),
                    make('span', 'game__level-detail', words.detail));
      choices.append(choice);
    }
    const help = button('game__button', copy.help, showHowTo);
    view.replaceChildren(heading, choices, help);
    if (overlay.hidden) choices.firstElementChild.focus();
  }

  /* --- 3. play ---- */

  function startGame(levelId) {
    stopTimer();
    hideCard();
    startedAt = null;

    const level = levelById(levelId);
    const shape = boardShape(level);
    const board = createBoard(shape.rows, shape.cols, level.fish);
    const label = gameCopy.levels[levelId].label;

    let flagMode = false;      // the phone-friendly toggle: taps place paws instead
    let focused = 0;           // which cell holds the roving tabindex

    /* The bar above the board: fish left, the clock, and the controls. */
    const bar = make('div', 'game__bar');
    const fishOut = make('span', 'game__count');
    const timeOut = make('span', 'game__count');
    const mode = button('game__button', gameCopy.bar.modeDig, () => {
      flagMode = !flagMode;
      mode.textContent = flagMode ? gameCopy.bar.modeFlag : gameCopy.bar.modeDig;
      mode.setAttribute('aria-pressed', String(flagMode));
    });
    mode.setAttribute('aria-pressed', 'false');
    mode.setAttribute('aria-label', gameCopy.bar.modeAria);
    bar.append(
      fishOut, timeOut, mode,
      button('game__button', gameCopy.bar.newGame, () => startGame(levelId)),
      button('game__button', gameCopy.bar.changeLevel, showPicker),
    );

    /* The board is a grid of real buttons, so a click, Enter and Space all work
     * without any key handling. role="grid" + rows + gridcells tells a screen reader
     * it is a two-dimensional thing to move around with the arrows. */
    const grid = make('div', 'game__board');
    grid.setAttribute('role', 'grid');
    grid.setAttribute('aria-label', gameCopy.boardAria(label));
    grid.style.setProperty('--cols', String(board.cols));
    /* Each tile's size: as big as fits, capped so Easy does not become huge. */
    grid.dataset.level = levelId;

    const cells = [];
    for (let r = 0; r < board.rows; r++) {
      const row = make('div', 'game__row');
      row.setAttribute('role', 'row');
      for (let c = 0; c < board.cols; c++) {
        const cell = make('button', 'game__cell');
        cell.type = 'button';
        cell.setAttribute('role', 'gridcell');
        cell.dataset.i = String(r * board.cols + c);
        cell.tabIndex = -1;
        cells.push(cell);
        row.append(cell);
      }
      grid.append(row);
    }
    cells[0].tabIndex = 0;

    function tick() {
      /* The panel can be closed mid-game; a board that is no longer on the page
       * stops its own clock rather than ticking forever. */
      if (!grid.isConnected) { stopTimer(); return; }
      const ms = startedAt === null ? 0 : performance.now() - startedAt;
      timeOut.textContent = `${gameCopy.bar.time} ${formatTime(ms)}`;
    }

    function draw() {
      const ended = board.state === 'won' || board.state === 'lost';
      board.cells.forEach((data, i) => {
        const cell = cells[i];
        const r = Math.floor(i / board.cols) + 1;
        const c = (i % board.cols) + 1;
        let text = '';
        let state = 'hidden';
        let aria = gameCopy.cellAria.hidden(r, c);

        if (data.open && data.fish) {
          text = gameCopy.fish; state = 'fish'; aria = gameCopy.cellAria.fish(r, c);
        } else if (data.open) {
          state = 'open';
          if (data.near) {
            text = String(data.near);
            aria = gameCopy.cellAria.number(r, c, data.near);
          } else {
            aria = gameCopy.cellAria.empty(r, c);
          }
        } else if (data.flag) {
          text = gameCopy.flag; state = 'flag'; aria = gameCopy.cellAria.flagged(r, c);
        } else if (ended && data.fish) {
          /* Once the round ends, every fish is shown — the classic reveal. */
          text = gameCopy.fish; state = 'fish'; aria = gameCopy.cellAria.fish(r, c);
        }

        cell.textContent = text;
        cell.dataset.state = state;
        cell.dataset.near = data.open && !data.fish ? String(data.near) : '';
        cell.dataset.boom = String(board.lostAt === i);
        cell.setAttribute('aria-label', aria);
      });
      fishOut.textContent = `${gameCopy.bar.fishLeft} ${fishLeft(board)}`;
    }

    function act(i, { flag = false } = {}) {
      const wasReady = board.state === 'ready';
      if (flag) {
        toggleFlag(board, i);
      } else if (board.cells[i].open) {
        chord(board, i);
      } else {
        dig(board, i);
      }

      /* The clock starts on the first dig, not when the board appears. */
      if (wasReady && board.state !== 'ready') {
        startedAt = performance.now();
        timer = setInterval(tick, 100);
      }
      draw();

      if (board.state === 'won') {
        const ms = performance.now() - startedAt;
        stopTimer();
        timeOut.textContent = `${gameCopy.bar.time} ${formatTime(ms)}`;
        live.textContent = gameCopy.won.title;
        showWin(levelId, ms);
      } else if (board.state === 'lost') {
        stopTimer();
        tick();                             // show the time the round lasted
        live.textContent = gameCopy.lost.title;
        showLoss(levelId);
      }
    }

    /* Right-click places a paw. Long-press does the same on a touch screen, where
     * there is no right button; the mode toggle is there for anyone who finds the
     * long-press awkward. */
    let pressTimer = null;
    let suppressClick = false;

    grid.addEventListener('click', (event) => {
      const cell = event.target.closest('.game__cell');
      if (!cell) return;
      if (suppressClick) { suppressClick = false; return; }
      act(Number(cell.dataset.i), { flag: flagMode });
    });

    grid.addEventListener('contextmenu', (event) => {
      const cell = event.target.closest('.game__cell');
      if (!cell) return;
      event.preventDefault();               // no browser menu over the board
      act(Number(cell.dataset.i), { flag: true });
    });

    grid.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'touch') return;
      const cell = event.target.closest('.game__cell');
      if (!cell) return;
      pressTimer = setTimeout(() => {
        suppressClick = true;               // the lift that follows is not a dig
        act(Number(cell.dataset.i), { flag: true });
      }, 450);
    });
    for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
      grid.addEventListener(type, () => clearTimeout(pressTimer));
    }

    /* Arrow keys move around the board (roving tabindex: only one tile is in the
     * Tab order, so Tab leaves the board instead of walking through 480 tiles).
     * F places a paw. Enter and Space come free with <button>. */
    grid.addEventListener('keydown', (event) => {
      const cell = event.target.closest('.game__cell');
      if (!cell) return;
      const i = Number(cell.dataset.i);
      const row = Math.floor(i / board.cols);
      const col = i % board.cols;
      let next = null;
      if (event.key === 'ArrowRight' && col < board.cols - 1) next = i + 1;
      else if (event.key === 'ArrowLeft' && col > 0) next = i - 1;
      else if (event.key === 'ArrowDown' && row < board.rows - 1) next = i + board.cols;
      else if (event.key === 'ArrowUp' && row > 0) next = i - board.cols;
      else if (event.key === 'Home') next = row * board.cols;
      else if (event.key === 'End') next = row * board.cols + board.cols - 1;
      else if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        act(i, { flag: true });
        return;
      }
      if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') {
        event.preventDefault();             // do not scroll the panel underneath
      }
      if (next === null) return;
      cells[focused].tabIndex = -1;
      focused = next;
      cells[focused].tabIndex = 0;
      cells[focused].focus();
    });

    view.replaceChildren(bar, grid);
    draw();
    tick();
    live.textContent = gameCopy.boardAria(label);
    cells[0].focus();
  }

  /* --- 4. after a round ---- */

  function showWin(levelId, ms) {
    const copy = gameCopy.won;
    showCard((card) => {
      card.append(make('h3', 'game__card-title', copy.title),
                  make('p', null, copy.time(formatTime(ms))));

      if (!scoresConnected) {
        card.append(make('p', 'game__hint', copy.notConnected));
        card.append(button('game__button game__button--main', copy.seeBoard,
          () => showAfter(levelId, null)));
        return;
      }

      const form = make('form', 'game__form');
      const field = make('label', 'game__label', copy.nameLabel);
      const input = make('input', 'game__input');
      input.type = 'text';
      input.name = 'name';
      input.maxLength = nameMaxLength;
      input.autocomplete = 'nickname';
      input.id = 'game-name';
      field.htmlFor = 'game-name';
      const hint = make('p', 'game__hint', copy.nameHint);
      hint.id = 'game-name-hint';
      const error = make('p', 'game__error');
      error.id = 'game-name-error';
      error.setAttribute('aria-live', 'assertive');
      input.setAttribute('aria-describedby', 'game-name-hint game-name-error');

      const save = make('button', 'game__button game__button--main', copy.save);
      save.type = 'submit';
      const skip = button('game__button', copy.skip, () => showAfter(levelId, null));
      const actions = make('div', 'game__actions');
      actions.append(save, skip);

      form.append(field, input, hint, error, actions);
      form.addEventListener('submit', async (event) => {
        event.preventDefault();               // no page reload
        const checked = checkName(input.value, gameCopy.anonymous);
        if (!checked.ok) {
          error.textContent = gameCopy.nameErrors[checked.reason];
          input.setAttribute('aria-invalid', 'true');
          input.focus();
          return;
        }
        save.disabled = true;
        save.textContent = copy.saving;
        try {
          const row = await submitScore({ difficulty: levelId, name: checked.name, timeMs: ms });
          showAfter(levelId, row ? row.id : null);
        } catch (failure) {
          error.textContent = gameCopy.nameErrors[failure.reason] || gameCopy.nameErrors.network;
          save.disabled = false;
          save.textContent = copy.save;
          input.focus();
        }
      });
      card.append(form);
    });
  }

  function showLoss(levelId) {
    const copy = gameCopy.lost;
    showCard((card) => {
      card.append(make('h3', 'game__card-title', copy.title), make('p', null, copy.body));
      const actions = make('div', 'game__actions');
      actions.append(
        button('game__button game__button--main', gameCopy.after.again, () => startGame(levelId)),
        button('game__button', gameCopy.after.changeLevel, showPicker),
      );
      card.append(actions);
    });
    /* A loss card over the board hides where the fish were, which is half the fun of
     * losing. It sits at the BOTTOM of the game area instead of in the middle. */
    overlay.dataset.place = 'bottom';
  }

  /* That level's leaderboard, popped up after the name is saved or skipped. */
  function showAfter(levelId, highlightId) {
    if (highlightId !== null) saved[levelId] = highlightId;
    const level = gameCopy.levels[levelId];
    showCard((card) => {
      card.append(make('h3', 'game__card-title', gameCopy.after.title(level.label)));
      const list = make('div', 'scoreboards__list');
      card.append(list);
      renderScores(list, levelId, highlightId);
      const actions = make('div', 'game__actions');
      actions.append(
        button('game__button game__button--main', gameCopy.after.again, () => startGame(levelId)),
        button('game__button', gameCopy.after.changeLevel, showPicker),
      );
      card.append(actions);
    });
  }

  /* Start: the picker is underneath, the how-to card on top of it. */
  showPicker();
  showHowTo();
}
