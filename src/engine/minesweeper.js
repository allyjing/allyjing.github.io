/* Repo path: src/engine/minesweeper.js
 *
 * The rules of Feed Junnie!, which are the rules of minesweeper with fish for mines.
 * Pure logic, like movement.js: it never touches the DOM. engine/game.js draws the
 * board and turns clicks into calls on this.
 *
 * The board is one flat array of cells, row by row. Cell i is at row
 * Math.floor(i / cols), column i % cols.
 */

export function createBoard(rows, cols, fishCount) {
  const cells = [];
  for (let i = 0; i < rows * cols; i++) {
    cells.push({ fish: false, open: false, flag: false, near: 0 });
  }
  return {
    rows, cols, fishCount, cells,
    placed: false,         // fish go down on the FIRST dig, so it is always safe
    state: 'ready',        // 'ready' -> 'playing' -> 'won' | 'lost'
    opened: 0,
    flags: 0,
    lostAt: null,          // the fish that ended the game, to highlight it
  };
}

/* The up-to-eight cells touching cell i. */
export function neighbours(board, i) {
  const { rows, cols } = board;
  const row = Math.floor(i / cols);
  const col = i % cols;
  const out = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) out.push(r * cols + c);
    }
  }
  return out;
}

/* Scatters the fish, keeping the first-dug cell AND its neighbours clear, so the
 * first click always opens a patch of board rather than a single number. That is
 * how modern minesweeper plays; a first click that can lose is just bad luck. */
function placeFish(board, safeIndex) {
  const keepClear = new Set([safeIndex, ...neighbours(board, safeIndex)]);
  const spots = [];
  for (let i = 0; i < board.cells.length; i++) {
    if (!keepClear.has(i)) spots.push(i);
  }
  /* Fisher-Yates shuffle, then take the first fishCount. */
  for (let i = spots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [spots[i], spots[j]] = [spots[j], spots[i]];
  }
  for (const i of spots.slice(0, board.fishCount)) board.cells[i].fish = true;

  board.cells.forEach((cell, i) => {
    cell.near = neighbours(board, i).filter((n) => board.cells[n].fish).length;
  });
  board.placed = true;
}

/* Digs one cell. A cell with no fish around it opens all its neighbours too, and
 * so on outward — the "flood" that clears big empty areas in one click. */
export function dig(board, i) {
  if (board.state === 'won' || board.state === 'lost') return;
  const cell = board.cells[i];
  if (cell.open || cell.flag) return;

  if (!board.placed) {
    placeFish(board, i);
    board.state = 'playing';
  }

  if (cell.fish) {
    cell.open = true;
    board.state = 'lost';
    board.lostAt = i;
    return;
  }

  /* A stack instead of recursion: an empty Expert board can flood hundreds of
   * cells, and recursion that deep is how a browser runs out of stack. */
  const stack = [i];
  while (stack.length) {
    const at = stack.pop();
    const here = board.cells[at];
    if (here.open || here.flag) continue;
    here.open = true;
    board.opened += 1;
    if (here.near === 0) stack.push(...neighbours(board, at));
  }

  if (board.opened === board.cells.length - board.fishCount) board.state = 'won';
}

/* Clicking an OPEN number whose fish are all flagged digs every other neighbour at
 * once (a "chord"). If a flag was wrong, this is how you lose. */
export function chord(board, i) {
  const cell = board.cells[i];
  if (!cell.open || cell.near === 0 || board.state !== 'playing') return;
  const around = neighbours(board, i);
  const flagged = around.filter((n) => board.cells[n].flag).length;
  if (flagged !== cell.near) return;
  for (const n of around) dig(board, n);
}

export function toggleFlag(board, i) {
  if (board.state === 'won' || board.state === 'lost') return;
  const cell = board.cells[i];
  if (cell.open) return;
  cell.flag = !cell.flag;
  board.flags += cell.flag ? 1 : -1;
}

/* How many fish are still unmarked, as shown in the counter. Can go negative if the
 * player flags too many, which is what real minesweeper does too. */
export function fishLeft(board) {
  return board.fishCount - board.flags;
}
