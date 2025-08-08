import {
  connectWS,
  sendState,
  sendLock,
  sendGameOver,
  netState,
  setIdentity,
} from "./net.js";
import {
  toast,
  setConn,
  getVolume,
  onUIMount,
  onLocalTestRequested,
} from "./ui.js";

// === Constants ===
const COLS = 10,
  ROWS = 22;
const VISIBLE_ROWS = 20;
const TICK_HZ = 30;
const GRAVITY_BASE = 1000;
const GRAVITY_MIN = 60;
const DAS = 150;
const ARR = 40;

// Shapes...
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

// SRS kicks (correct now)
const KICKS = {
  JLSTZ: {
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
  },
  I: {
    0: {
      1: [
        [0, 0],
        [-2, 0],
        [1, 0],
        [-2, -1],
        [1, 2],
      ],
      3: [
        [0, 0],
        [-1, 0],
        [2, 0],
        [-1, 2],
        [2, -1],
      ],
    },
    1: {
      0: [
        [0, 0],
        [2, 0],
        [-1, 0],
        [2, 1],
        [-1, -2],
      ],
      2: [
        [0, 0],
        [-1, 0],
        [2, 0],
        [-1, 2],
        [2, -1],
      ],
    },
    2: {
      1: [
        [0, 0],
        [1, 0],
        [-2, 0],
        [1, -2],
        [-2, 1],
      ],
      3: [
        [0, 0],
        [2, 0],
        [-1, 0],
        [2, 1],
        [-1, -2],
      ],
    },
    3: {
      0: [
        [0, 0],
        [-2, 0],
        [1, 0],
        [-2, -1],
        [1, 2],
      ],
      2: [
        [0, 0],
        [1, 0],
        [-2, 0],
        [1, -2],
        [-2, 1],
      ],
    },
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
function cloneMatrix(m) {
  return m.map((r) => r.slice());
}
function bag7() {
  const p = ["I", "O", "T", "S", "Z", "J", "L"];
  for (let i = p.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p;
}
class RNGBag {
  constructor() {
    this.queue = [];
    this.refill();
  }
  refill() {
    this.queue.push(...bag7());
  }
  next() {
    if (this.queue.length < 7) this.refill();
    return this.queue.shift();
  }
  peek(n = 5) {
    while (this.queue.length < n) this.refill();
    return this.queue.slice(0, n);
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
  constructor(seed = Math.random()) {
    this.board = newMatrix(COLS, ROWS);
    this.rng = new RNGBag();
    this.hold = null;
    this.holdUsed = false;
    this.cur = this.spawn();
    this.alive = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropInterval = 1000;
    this.dropAcc = 0;
    this.paused = false;
    this.dasTimer = null;
    this.arrTimer = null;
    this.movePressed = 0;
  }
  spawn() {
    const p = new Piece(this.rng.next());
    p.x = ((COLS / 2) | 0) - 2;
    p.y = 0;
    if (this.collides(p, p.x, p.y)) this.alive = false;
    return p;
  }
  levelForLines(l) {
    return Math.min(20, 1 + Math.floor(l / 10));
  }
  intervalForLevel(l) {
    return Math.max(60, Math.floor(1000 * Math.pow(0.85, l - 1)));
  }
  tick(dt) {
    if (!this.alive || this.paused) return;
    this.dropAcc += dt;
    if (this.dropAcc >= this.dropInterval) {
      this.dropAcc = 0;
      this.softDrop();
    }
  }
  move(dir) {
    if (!this.alive || this.paused) return false;
    const nx = this.cur.x + dir;
    if (!this.collides(this.cur, nx, this.cur.y)) {
      this.cur.x = nx;
      return true;
    }
    return false;
  }
  rotate(dir) {
    if (!this.alive || this.paused) return false;
    const old = this.cur.rot,
      next = (old + (dir > 0 ? 1 : 3)) % 4;
    const kicks = (this.cur.type === "I" ? KICKS.I : KICKS.JLSTZ)[old][next];
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
    if (!this.alive || this.paused) return 0;
    let d = 0;
    while (!this.collides(this.cur, this.cur.x, this.cur.y + 1)) {
      this.cur.y++;
      d++;
    }
    this.lock();
    return d;
  }
  softDrop() {
    if (!this.alive || this.paused) return false;
    if (!this.collides(this.cur, this.cur.x, this.cur.y + 1)) {
      this.cur.y++;
      return true;
    } else {
      this.lock();
      return false;
    }
  }
  holdPiece() {
    if (this.holdUsed) return false;
    const prev = this.hold;
    this.hold = this.cur.type;
    this.holdUsed = true;
    if (prev) {
      this.cur = new Piece(prev);
      this.cur.x = ((COLS / 2) | 0) - 2;
      this.cur.y = 0;
    } else {
      this.cur = this.spawn();
    }
    return true;
  }
  collides(piece, x, y, rot = piece.rot) {
    const s = SHAPES[piece.type][rot];
    for (let py = 0; py < 4; py++)
      for (let px = 0; px < 4; px++) {
        if (!s[py][px]) continue;
        const bx = x + px,
          by = y + py;
        if (bx < 0 || bx >= COLS || by >= ROWS) return true;
        if (by >= 0 && this.board[by][bx]) return true;
      }
    return false;
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
    return c;
  }
  scoreForClears(c) {
    const base = [0, 100, 300, 500, 800];
    return base[c] * this.level;
  }
  lock() {
    this.place(this.cur);
    const lines = this.clearLines();
    if (lines > 0) {
      this.score += this.scoreForClears(lines);
      this.lines += lines;
      this.level = this.levelForLines(this.lines);
      this.dropInterval = this.intervalForLevel(this.level);
    }
    this.holdUsed = false;
    this.cur = this.spawn();
    sendLock({
      board: this.board,
      linesCleared: lines,
      stats: { score: this.score, lines: this.lines },
    });
  }
  addGarbage(n) {
    for (let i = 0; i < n; i++) {
      this.board.shift();
      const row = new Array(COLS).fill("G".charCodeAt(0));
      row[Math.floor(Math.random() * COLS)] = 0;
      this.board.push(row);
    }
    if (this.collides(this.cur, this.cur.x, this.cur.y)) {
      while (this.cur.y > 0 && this.collides(this.cur, this.cur.x, this.cur.y))
        this.cur.y--;
      if (this.collides(this.cur, this.cur.x, this.cur.y)) this.alive = false;
    }
  }
  startDAS(dir) {
    this.stopDAS();
    this.move(dir);
    this.movePressed = dir;
    this.dasTimer = setTimeout(() => {
      this.arrTimer = setInterval(() => this.move(this.movePressed), ARR);
    }, DAS);
  }
  stopDAS() {
    this.movePressed = 0;
    if (this.dasTimer) {
      clearTimeout(this.dasTimer);
      this.dasTimer = null;
    }
    if (this.arrTimer) {
      clearInterval(this.arrTimer);
      this.arrTimer = null;
    }
  }
  serializeState() {
    return {
      board: this.board,
      cur: {
        type: this.cur.type,
        x: this.cur.x,
        y: this.cur.y,
        rot: this.cur.rot,
      },
      hold: this.hold,
      next: this.rng.peek(5),
      score: this.score,
      lines: this.lines,
      level: this.level,
      alive: this.alive,
    };
  }
}

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.scaleForDPR();
  }
  scaleForDPR() {
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
    ctx.fillStyle = "#0b0f26";
    ctx.fillRect(offX, offY, cell * COLS, cell * VISIBLE_ROWS);
    ctx.strokeStyle = "#1b2248";
    ctx.lineWidth = 1;
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
    // draw current piece (tolerant of plain objects without .shape())
    if (game.alive && game.cur) {
      const cur = game.cur;
      const shape =
        typeof cur.shape === "function"
          ? cur.shape()
          : SHAPES[cur.type]
          ? SHAPES[cur.type][cur.rot || 0]
          : null;

      if (shape) {
        for (let py = 0; py < 4; py++) {
          for (let px = 0; px < 4; px++) {
            if (!shape[py][px]) continue;
            const x = cur.x + px;
            const y = cur.y + py;
            if (y >= 2) {
              const color = COLORS[cur.type] || "#64748b";
              this.tile(offX + x * cell, offY + (y - 2) * cell, cell, color);
            }
          }
        }
      }
    }
    if (!game.alive) {
      ctx.fillStyle = "rgba(0,0,0,.6)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 20px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", w / 2, h / 2);
    }
  }
  tile(x, y, s, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
    ctx.strokeStyle = "rgba(255,255,255,.15)";
    ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
  }
}

const el = (id) => document.getElementById(id);
const meCanvas = el("boardMe");
const opCanvas = el("boardOp");
const meR = new Renderer(meCanvas);
const opR = new Renderer(opCanvas);

let game = new Game();
let opState = null;
let lastTime = performance.now();

// resize
let resizeRAF = 0;
const onResize = () => {
  if (resizeRAF) return;
  resizeRAF = requestAnimationFrame(() => {
    resizeRAF = 0;
    meR.scaleForDPR();
    opR.scaleForDPR();
  });
};
const ro = new ResizeObserver(onResize);
ro.observe(meCanvas);
ro.observe(opCanvas);

// inputs
function bindInputs() {
  window.addEventListener(
    "keydown",
    (e) => {
      if (
        document.activeElement &&
        ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
      )
        return;
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
        case "KeyC":
          e.preventDefault();
          game.holdPiece();
          break;
        case "KeyP":
          e.preventDefault();
          togglePause();
          break;
      }
    },
    { passive: false }
  );
  window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft" || e.code === "ArrowRight") game.stopDAS();
  });

  const pressRepeat = (down, up) => {
    let itv = null,
      tout = null;
    const onDown = (ev) => {
      ev.preventDefault();
      if (down) down();
      tout = setTimeout(() => {
        itv = setInterval(() => down && down(), ARR);
      }, DAS);
    };
    const onUp = (ev) => {
      if (ev) ev.preventDefault();
      clearTimeout(tout);
      clearInterval(itv);
      itv = null;
      tout = null;
      up && up();
    };
    return { onDown, onUp };
  };
  const bindBtn = (id, down, up = () => {}) => {
    const btn = el(id);
    btn.addEventListener("touchstart", down, { passive: false });
    btn.addEventListener("mousedown", down);
    const end = (ev) => {
      ev.preventDefault();
      up();
    };
    btn.addEventListener("touchend", end, { passive: false });
    btn.addEventListener("mouseup", end);
    btn.addEventListener("mouseleave", end);
  };
  const left = pressRepeat(
    () => game.move(-1),
    () => {}
  );
  const right = pressRepeat(
    () => game.move(1),
    () => {}
  );
  const down = pressRepeat(
    () => game.softDrop(),
    () => {}
  );
  bindBtn("btnLeft", left.onDown, left.onUp);
  bindBtn("btnRight", right.onDown, right.onUp);
  bindBtn("btnDown", down.onDown, down.onUp);
  bindBtn("btnRotL", (e) => {
    e.preventDefault();
    game.rotate(-1);
  });
  bindBtn("btnRotR", (e) => {
    e.preventDefault();
    game.rotate(1);
  });
  bindBtn("btnHard", (e) => {
    e.preventDefault();
    game.hardDrop();
  });
  bindBtn("btnHold", (e) => {
    e.preventDefault();
    game.holdPiece();
  });
  bindBtn("btnPause", (e) => {
    e.preventDefault();
    togglePause();
  });
  el("resumeBtn").addEventListener("click", () => togglePause(false));
}
function togglePause(forceState) {
  const next = typeof forceState === "boolean" ? forceState : !game.paused;
  game.paused = next;
  const overlay = el("pauseOverlay");
  overlay.classList.toggle("hidden", !next);
  overlay.setAttribute("aria-hidden", String(!next));
}

function setupNetworking() {
  netState.onConnected = (roomId, playerId, size) => {
    setConn(true);
    if (roomId) {
      el("shareText").textContent = `Share room code: ${roomId}`;
      localStorage.setItem("tetris.room", roomId);
    }
    el("menu").classList.add("hidden");
    el("arena").classList.remove("hidden");
  };
  netState.onDisconnected = () => {
    setConn(false);
    toast("Disconnected", "error");
    el("menu").classList.remove("hidden");
    el("arena").classList.add("hidden");
  };
  netState.onOpponentState = (payload) => {
    opState = payload;
    updateOpponentPanels(payload);
  };
  netState.onGarbage = (rows) => {
    game.addGarbage(rows);
    toast(`+${rows} garbage`, "warn");
  };
  netState.onPeerJoin = () => {
    el("opStatus").textContent = "Connected";
    toast("Opponent joined", "ok");
  };
  netState.onPeerLeave = () => {
    el("opStatus").textContent = "Left";
    toast("Opponent left", "warn");
  };
  netState.onCorrectedClear = (n) => {};
  netState.onGameOver = () => {
    toast("Opponent topped out", "ok");
  };
}
function updatePanels() {
  el("meScore").textContent = game.score;
  el("meLines").textContent = game.lines;
  el("meLevel").textContent = game.level;
}
function updateOpponentPanels(s) {
  el("opScore").textContent = s.score ?? 0;
  el("opLines").textContent = s.lines ?? 0;
}

function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  const clamped = Math.min(50, Math.max(0, dt));
  game.tick(clamped);
  meR.draw(game);

  if (opState) {
    const src = opState;
    const cur = src.cur || { type: "O", x: 0, y: 0, rot: 0 };
    const wrapped = {
      board: src.board,
      alive: src.alive ?? true,
      cur: {
        ...cur,
        shape: () =>
          SHAPES[cur.type]
            ? SHAPES[cur.type][cur.rot || 0]
            : [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
              ],
      },
    };
    opR.draw(wrapped);
  }
  sendState(game.serializeState());
  updatePanels();
  requestAnimationFrame(loop);
}

function enableLocalTest() {
  let buf = [];
  setInterval(() => {
    buf.push(game.serializeState());
    if (buf.length > 3) {
      opState = buf.shift();
      updateOpponentPanels(opState);
    }
  }, 100);
}

bindInputs();
setupNetworking();
onUIMount({
  onCreate: (serverHost, serverPort, name) => {
    setIdentity(name);
    connectWS("create", null, serverHost, serverPort);
  },
  onAuto: (serverHost, serverPort, name) => {
    setIdentity(name);
    connectWS("auto", null, serverHost, serverPort);
  },
  onJoin: (room, serverHost, serverPort, name) => {
    setIdentity(name);
    connectWS("join", room, serverHost, serverPort);
  },
});
onLocalTestRequested(() => {
  enableLocalTest();
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("arena").classList.remove("hidden");
  setConn(true);
  toast("Local test mode enabled", "ok");
});

let last = performance.now();
requestAnimationFrame(loop);

const overCheck = setInterval(() => {
  if (!game.alive) {
    sendGameOver();
    clearInterval(overCheck);
  }
}, 250);

// expose
window.__tetris = { game };
