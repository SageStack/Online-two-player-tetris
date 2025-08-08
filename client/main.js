// Basic Tetris core

const COLS = 10,
  ROWS = 22; // includes 2 hidden rows
const VISIBLE_ROWS = 20;

const SHAPES = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],
  O: [
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  T: [
    [
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  S: [
    [
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  Z: [
    [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  L: [
    [
      [0, 0, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
};

const KICKS_I = {
  0: { 1: [[0, 0]], 3: [[0, 0]] },
  1: { 0: [[0, 0]], 2: [[0, 0]] },
  2: { 1: [[0, 0]], 3: [[0, 0]] },
  3: { 0: [[0, 0]], 2: [[0, 0]] },
};

const KICKS_JLSTZ = {
  0: {
    1: [
      [0, 0],
      [-1, 0],
      [-1, 1],
      [0, -2],
      [-1, -2],
    ],
    3: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, -2],
      [1, -2],
    ],
  },
  1: {
    0: [
      [0, 0],
      [1, 0],
      [1, -1],
      [0, 2],
      [1, 2],
    ],
    2: [
      [0, 0],
      [1, 0],
      [1, -1],
      [0, 2],
      [1, 2],
    ],
  },
  2: {
    1: [
      [0, 0],
      [-1, 0],
      [-1, 1],
      [0, -2],
      [-1, -2],
    ],
    3: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, -2],
      [1, -2],
    ],
  },
  3: {
    2: [
      [0, 0],
      [-1, 0],
      [-1, -1],
      [0, 2],
      [-1, 2],
    ],
    0: [
      [0, 0],
      [-1, 0],
      [-1, -1],
      [0, 2],
      [-1, 2],
    ],
  },
};

const COLORS = {
  I: "#60a5fa",
  O: "#fbbf24",
  T: "#a78bfa",
  S: "#34d399",
  Z: "#f87171",
  J: "#93c5fd",
  L: "#f59e0b",
};

function newMatrix(w, h) {
  const a = new Array(h);
  for (let y = 0; y < h; y++) a[y] = new Array(w).fill(0);
  return a;
}
function bag7() {
  const pieces = ["I", "O", "T", "S", "Z", "J", "L"];
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return pieces;
}
class RNGBag {
  constructor() {
    this.q = [];
    this.refill();
  }
  refill() {
    this.q.push(...bag7());
  }
  next() {
    if (this.q.length < 7) this.refill();
    return this.q.shift();
  }
}
class Piece {
  constructor(type) {
    this.type = type;
    this.rot = 0;
    this.x = 3;
    this.y = 0;
  }
  shape() {
    return SHAPES[this.type][this.rot];
  }
}
class Game {
  constructor() {
    this.board = newMatrix(COLS, ROWS);
    this.rng = new RNGBag();
    this.cur = this.spawn();
    this.alive = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;

    this.das = 150;
    this.arr = 40;
    this.dasTimer = null;
    this.arrTimer = null;
  }
  spawn() {
    const p = new Piece(this.rng.next());
    p.x = ((COLS / 2) | 0) - 2;
    p.y = 0;
    if (this.collides(p, p.x, p.y)) this.alive = false;
    return p;
  }
  collides(piece, x, y, rot = piece.rot) {
    const shape = SHAPES[piece.type][rot];
    for (let py = 0; py < 4; py++) {
      for (let px = 0; px < 4; px++) {
        if (!shape[py][px]) continue;
        const bx = x + px,
          by = y + py;
        if (bx < 0 || bx >= COLS || by >= ROWS) return true;
        if (by >= 0 && this.board[by][bx]) return true;
      }
    }
    return false;
  }
  move(d) {
    const nx = this.cur.x + d;
    if (!this.collides(this.cur, nx, this.cur.y)) {
      this.cur.x = nx;
      return true;
    }
    return false;
  }
  rotate(dir) {
    const old = this.cur.rot;
    const next = (old + (dir > 0 ? 1 : 3)) % 4;
    const kicks = (this.cur.type === "I" ? KICKS_I : KICKS_JLSTZ)[old][next];
    for (const [kx, ky] of kicks) {
      if (!this.collides(this.cur, this.cur.x + kx, this.cur.y + ky, next)) {
        this.cur.x += kx;
        this.cur.y += ky;
        this.cur.rot = next;
        return true;
      }
    }
    return false;
  }
  hardDrop() {
    let d = 0;
    while (!this.collides(this.cur, this.cur.x, this.cur.y + 1)) {
      this.cur.y++;
      d++;
    }
    this.lock();
    return d;
  }
  softDrop() {
    if (!this.collides(this.cur, this.cur.x, this.cur.y + 1)) {
      this.cur.y++;
      return true;
    } else {
      this.lock();
      return false;
    }
  }
  place(piece) {
    const s = piece.shape();
    for (let py = 0; py < 4; py++)
      for (let px = 0; px < 4; px++) {
        if (!s[py][px]) continue;
        const bx = piece.x + px,
          by = piece.y + py;
        if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS)
          this.board[by][bx] = piece.type.charCodeAt(0);
      }
  }
  clearLines() {
    let c = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      let full = true;
      for (let x = 0; x < COLS; x++) {
        if (!this.board[y][x]) {
          full = false;
          break;
        }
      }
      if (full) {
        c++;
        for (let yy = y; yy > 0; yy--)
          this.board[yy] = this.board[yy - 1].slice();
        this.board[0] = new Array(COLS).fill(0);
        y++;
      }
    }
    this.lines += c;
    this.score += [0, 100, 300, 500, 800][c] || 0;
    return c;
  }
  lock() {
    this.place(this.cur);
    this.clearLines();
    this.cur = this.spawn();
  }

  startDAS(dir) {
    this.move(dir);
    this.dasTimer = setTimeout(() => {
      this.arrTimer = setInterval(() => this.move(dir), this.arr);
    }, this.das);
  }
  stopDAS() {}
}

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.scale();
  }
  scale() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  draw(game) {
    const ctx = this.ctx;
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);
    const cell = Math.floor(Math.min(w / COLS, h / VISIBLE_ROWS));
    const offX = Math.floor((w - cell * COLS) / 2);
    const offY = Math.floor((h - cell * VISIBLE_ROWS) / 2);

    // board
    ctx.fillStyle = "#0b0f26";
    ctx.fillRect(offX, offY, cell * COLS, cell * VISIBLE_ROWS);
    ctx.strokeStyle = "#1b2248";
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(offX + x * cell, offY);
      ctx.lineTo(offX + x * cell, offY + cell * VISIBLE_ROWS);
      ctx.stroke();
    }
    for (let y = 0; y <= VISIBLE_ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(offX, offY + y * cell);
      ctx.lineTo(offX + cell * COLS, offY + y * cell);
      ctx.stroke();
    }

    for (let y = 2; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const v = game.board[y][x];
        if (v) {
          const t = String.fromCharCode(v);
          const color = COLORS[t] || "#64748b";
          this.tile(offX + x * cell, offY + (y - 2) * cell, cell, color);
        }
      }
    }
    // current
    const s = game.cur.shape();
    for (let py = 0; py < 4; py++)
      for (let px = 0; px < 4; px++) {
        if (!s[py][px]) continue;
        const x = game.cur.x + px,
          y = game.cur.y + py;
        if (y >= 2)
          this.tile(
            offX + x * cell,
            offY + (y - 2) * cell,
            cell,
            COLORS[game.cur.type]
          );
      }
  }
  tile(x, y, s, c) {
    const ctx = this.ctx;
    ctx.fillStyle = c;
    ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
    ctx.strokeStyle = "rgba(255,255,255,.15)";
    ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
  }
}

const meCanvas = document.getElementById("boardMe");
const opCanvas = document.getElementById("boardOp");
const meR = new Renderer(meCanvas);
const opR = new Renderer(opCanvas);

let game = new Game();
function loop() {
  meR.draw(game);
  // fake opponent blank
  opR.draw({
    board: newMatrix(COLS, ROWS),
    cur: { type: "O", x: 0, y: 0, rot: 0 },
    alive: true,
  });
  requestAnimationFrame(loop);
}
loop();

window.addEventListener("keydown", (e) => {
  switch (e.code) {
    case "ArrowLeft":
      e.preventDefault();
      game.startDAS(-1);
      break;
    case "ArrowRight":
      e.preventDefault();
      game.startDAS(1);
      break;
    case "ArrowDown":
      e.preventDefault();
      game.softDrop();
      break;
    case "ArrowUp":
      e.preventDefault();
      game.rotate(1);
      break;
    case "KeyZ":
      e.preventDefault();
      game.rotate(-1);
      break;
    case "KeyX":
      e.preventDefault();
      game.rotate(1);
      break;
    case "Space":
      e.preventDefault();
      game.hardDrop();
      break;
  }
});
window.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft" || e.code === "ArrowRight") game.stopDAS();
});
