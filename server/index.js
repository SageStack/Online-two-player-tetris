const http = require("http");
const { WebSocketServer } = require("ws");
const crypto = require("crypto");

const PORT = process.env.PORT || 8080;
const server = http.createServer();
const wss = new WebSocketServer({ server });

const rooms = new Map(); // roomId => { players: Map, created }

function rid() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++)
    s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function opponent(room, me) {
  for (const [pid, peer] of room.players) if (pid !== me.id) return peer;
  return null;
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

    if (msg.type === "create") {
      const roomId = msg.roomId || rid();
      if (!rooms.has(roomId))
        rooms.set(roomId, { players: new Map(), created: Date.now() });
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
      }
    }

    if (msg.type === "join") {
      const room = rooms.get(msg.roomId);
      if (!room) {
        ws.send(JSON.stringify({ type: "error", reason: "No such room" }));
        return;
      }
      if (room.players.size >= 2) {
        ws.send(JSON.stringify({ type: "error", reason: "Room full" }));
        return;
      }
      room.players.set(ws.id, ws);
      ws.roomId = msg.roomId;

      // FIX: send joined ack
      ws.send(
        JSON.stringify({
          type: "joined",
          roomId: ws.roomId,
          playerId: ws.id,
          size: room.players.size,
        })
      );
      const peer = opponent(room, ws);
      if (peer && peer.readyState === 1) {
        peer.send(JSON.stringify({ type: "peerJoin", playerId: ws.id }));
      }
    }

    if (msg.type === "state") {
      const room = rooms.get(ws.roomId);
      if (!room) return;
      for (const [pid, peer] of room.players) {
        if (pid !== ws.id && peer.readyState === 1) {
          peer.send(
            JSON.stringify({ type: "opponentState", payload: msg.payload })
          );
        }
      }
    }

    if (msg.type === "heartbeat") {
      ws.send(JSON.stringify({ type: "heartbeat" }));
    }
  });

  ws.on("close", () => {
    const room = rooms.get(ws.roomId);
    if (room) {
      room.players.delete(ws.id);
      for (const [pid, peer] of room.players) {
        if (peer.readyState === 1)
          peer.send(JSON.stringify({ type: "peerLeave", playerId: ws.id }));
      }
      if (room.players.size === 0) rooms.delete(ws.roomId);
    }
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

server.listen(PORT, () => {
  console.log("Server on", PORT);
});
