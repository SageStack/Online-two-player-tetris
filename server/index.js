const http = require("http");
const { WebSocketServer } = require("ws");
const crypto = require("crypto");

const PORT = process.env.PORT || 8080;
const server = http.createServer();
const wss = new WebSocketServer({ server });

/** roomId => { players: Map<playerId, ws>, lastState: Map<playerId, any>, created: number } */
const rooms = new Map();

function rid() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++)
    s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
function sanitizeRoom(id) {
  return (id || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}
function opponent(room, me) {
  for (const [pid, peer] of room.players) if (pid !== me.id) return peer;
  return null;
}
function broadcast(room, msg, exceptId = null) {
  for (const [pid, ws] of room.players) {
    if (exceptId && pid === exceptId) continue;
    if (ws.readyState === 1) ws.send(JSON.stringify(msg));
  }
}

function fullRowsCount(board, width = 10, height = 22) {
  let rows = 0;
  for (let y = 0; y < height; y++) {
    let full = true;
    for (let x = 0; x < width; x++) {
      const v = Array.isArray(board[y]) ? board[y][x] : board[y * width + x];
      if (!v) {
        full = false;
        break;
      }
    }
    if (full) rows++;
  }
  return rows;
}

wss.on("connection", (ws) => {
  ws.id = crypto.randomBytes(8).toString("hex");
  ws.roomId = null;
  ws.isAlive = true;

  ws.on("pong", () => (ws.isAlive = true));

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.type === "create" || msg.type === "auto") {
      let roomId = sanitizeRoom(msg.roomId);
      if (msg.type === "auto") {
        for (const [id, r] of rooms) {
          if (r.players.size < 2) {
            roomId = id;
            break;
          }
        }
      }
      if (!roomId) roomId = rid();

      if (!rooms.has(roomId))
        rooms.set(roomId, {
          players: new Map(),
          lastState: new Map(),
          created: Date.now(),
        });
      const room = rooms.get(roomId);
      if (room.players.size >= 2) {
        ws.send(JSON.stringify({ type: "error", reason: "Room full" }));
        return;
      }
      room.players.set(ws.id, ws);
      ws.roomId = roomId;
      ws.send(
        JSON.stringify({
          type: "created",
          roomId,
          playerId: ws.id,
          size: room.players.size,
        })
      );
      const peer = opponent(room, ws);
      if (peer && peer.readyState === 1) {
        peer.send(JSON.stringify({ type: "peerJoin", playerId: ws.id }));
        ws.send(JSON.stringify({ type: "peerJoin", playerId: peer.id }));
      }
      logRooms();
      return;
    }

    if (msg.type === "join") {
      const roomId = sanitizeRoom(msg.roomId);
      const room = rooms.get(roomId);
      if (!room) {
        ws.send(JSON.stringify({ type: "error", reason: "No such room" }));
        return;
      }
      if (room.players.size >= 2) {
        ws.send(JSON.stringify({ type: "error", reason: "Room full" }));
        return;
      }
      room.players.set(ws.id, ws);
      ws.roomId = roomId;
      ws.send(
        JSON.stringify({
          type: "joined",
          roomId,
          playerId: ws.id,
          size: room.players.size,
        })
      );
      const peer = opponent(room, ws);
      if (peer && peer.readyState === 1) {
        peer.send(JSON.stringify({ type: "peerJoin", playerId: ws.id }));
        ws.send(JSON.stringify({ type: "peerJoin", playerId: peer.id }));
      }
      logRooms();
      return;
    }

    if (!ws.roomId) {
      ws.send(JSON.stringify({ type: "error", reason: "Not in room" }));
      return;
    }
    const room = rooms.get(ws.roomId);
    if (!room) {
      ws.send(JSON.stringify({ type: "error", reason: "No such room" }));
      return;
    }

    if (msg.type === "state") {
      room.lastState.set(ws.id, msg.payload);
      const peer = opponent(room, ws);
      if (peer && peer.readyState === 1) {
        peer.send(
          JSON.stringify({ type: "opponentState", payload: msg.payload })
        );
      }
      return;
    }

    if (msg.type === "lock") {
      const peer = opponent(room, ws);
      let lc = 0;
      try {
        lc = fullRowsCount(msg.payload.board);
      } catch {}
      const validated = Math.max(0, Math.min(4, lc));
      if (validated !== msg.payload.linesCleared) {
        broadcast(room, {
          type: "correctedClear",
          playerId: ws.id,
          linesCleared: validated,
        });
      }
      const garbage = Math.max(0, validated - 1);
      if (peer && garbage > 0 && peer.readyState === 1) {
        peer.send(JSON.stringify({ type: "garbage", rows: garbage }));
      }
      return;
    }

    if (msg.type === "gameOver") {
      broadcast(room, { type: "gameOver", playerId: ws.id }, null);
      return;
    }

    if (msg.type === "heartbeat") {
      ws.send(JSON.stringify({ type: "heartbeat" }));
      return;
    }
  });

  ws.on("close", () => {
    const room = rooms.get(ws.roomId);
    if (room) {
      room.players.delete(ws.id);
      broadcast(room, { type: "peerLeave", playerId: ws.id });
      if (room.players.size === 0) rooms.delete(ws.roomId);
    }
    logRooms();
  });
});

const interval = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) {
      try {
        ws.terminate();
      } catch {}
      continue;
    }
    ws.isAlive = false;
    try {
      ws.ping();
    } catch {}
  }
}, 30000);

server.on("close", function close() {
  clearInterval(interval);
});

server.listen(PORT, () => console.log(`WebSocket server listening on ${PORT}`));

function logRooms() {
  const info = [...rooms.entries()].map(([id, r]) => ({
    id,
    size: r.players.size,
    created: new Date(r.created).toISOString(),
  }));
  console.log("Rooms:", info);
}
