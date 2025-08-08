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

wss.on("connection", (ws) => {
  ws.id = crypto.randomBytes(8).toString("hex");
  ws.roomId = null;

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
      ws.send(JSON.stringify({ type: "created", roomId, playerId: ws.id }));
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
      // BUG: forgot to notify client that join succeeded here
    }

    if (msg.type === "state") {
      // relay to opponent
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
  });

  // BUG: no heartbeat handler
});

server.listen(PORT, () => {
  console.log("Server on", PORT);
});
