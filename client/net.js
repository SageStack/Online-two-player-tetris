// net.js - WebSocket client + protocol
import { toast, setConn } from "./ui.js";
const WS_URL = "wss://tetris-ws.onrender.com";

const DEFAULT_HOST = location.hostname || "localhost";
const DEFAULT_PORT = location.search.includes("local=1")
  ? 0
  : location.port || (location.protocol === "https:" ? 443 : 80);

export const netState = {
  ws: null,
  roomId: null,
  playerId: null,
  onConnected: null,
  onDisconnected: null,
  onOpponentState: null,
  onGarbage: null,
  onPeerJoin: null,
  onPeerLeave: null,
  onCorrectedClear: null,
  onGameOver: null,
};

let identity = { name: null };
export function setIdentity(name) {
  identity.name = (name || "").slice(0, 12);
}

function makeSocket(host, port) {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const h = host || DEFAULT_HOST;
  let url;
  if (port && String(port) !== "0") url = `${proto}://${h}:${port}`;
  else url = `${proto}://${h}`;
  return new WebSocket(url);
}

export function connectWS(kind, roomId, host, port) {
  if (location.search.includes("local=1")) {
    toast("Local test mode: not connecting", "warn");
    return;
  }
  const ws = makeSocket(host, port);
  netState.ws = ws;

  ws.onopen = () => {
    setConn(true);
    const payload = { type: kind, roomId, name: identity.name };
    ws.send(JSON.stringify(payload));
  };
  ws.onclose = () => {
    setConn(false);
    netState.onDisconnected && netState.onDisconnected();
  };
  ws.onerror = () => {
    toast("WebSocket error", "error");
  };

  ws.onmessage = (ev) => {
    let m;
    try {
      m = JSON.parse(ev.data);
    } catch {
      return;
    }
    switch (m.type) {
      case "created":
      case "joined":
        netState.roomId = m.roomId;
        netState.playerId = m.playerId;
        localStorage.setItem("tetris.room", netState.roomId);
        netState.onConnected &&
          netState.onConnected(m.roomId, m.playerId, m.size);
        break;
      case "peerJoin":
        netState.onPeerJoin && netState.onPeerJoin(m.playerId);
        break;
      case "peerLeave":
        netState.onPeerLeave && netState.onPeerLeave(m.playerId);
        break;
      case "opponentState":
        netState.onOpponentState && netState.onOpponentState(m.payload);
        break;
      case "garbage":
        netState.onGarbage && netState.onGarbage(m.rows);
        break;
      case "correctedClear":
        netState.onCorrectedClear && netState.onCorrectedClear(m.linesCleared);
        break;
      case "gameOver":
        netState.onGameOver && netState.onGameOver();
        break;
      case "heartbeat":
        // no-op
        break;
      case "error":
        toast(m.reason || "Server error", "error");
        break;
    }
  };

  // heartbeat
  const hb = setInterval(() => {
    if (ws.readyState !== 1) {
      clearInterval(hb);
      return;
    }
    try {
      ws.send(JSON.stringify({ type: "heartbeat" }));
    } catch {}
  }, 25000);
}

// send compact periodic state
export function sendState(payload) {
  const ws = netState.ws;
  if (!ws || ws.readyState !== 1) return;
  try {
    ws.send(JSON.stringify({ type: "state", payload }));
  } catch {}
}

export function sendLock(payload) {
  const ws = netState.ws;
  if (!ws || ws.readyState !== 1) return;
  try {
    ws.send(JSON.stringify({ type: "lock", payload }));
  } catch {}
}

export function sendGameOver() {
  const ws = netState.ws;
  if (!ws || ws.readyState !== 1) return;
  try {
    ws.send(JSON.stringify({ type: "gameOver" }));
  } catch {}
}
