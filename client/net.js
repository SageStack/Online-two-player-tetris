// net.js - WebSocket client + protocol
import { toast, setConn } from "./ui.js";

/** Resolve the WebSocket URL from hash overrides, env, or location */
function resolveWSURL(hostArg, portArg) {
  // Hash overrides: #ws=... OR #host=...&port=...
  const hash = new URLSearchParams(location.hash.slice(1));
  const wsParam = hash.get("ws");
  const hostParam = hash.get("host");
  const portParam = hash.get("port");

  if (wsParam) {
    // Accept full ws/wss URL
    return wsParam;
  }

  const host = hostArg || hostParam || null;
  const port = portArg || portParam || null;

  // Production (Netlify) → use your Render WS by default
  if (window.location.hostname.includes("netlify.app")) {
    return "wss://online-two-player-tetris.onrender.com";
  }

  // Local test bypass: don't connect
  if (location.search.includes("local=1")) {
    return null;
  }

  // If explicit host was provided (arg or hash), build from it
  if (host) {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    if (port && String(port) !== "0") return `${proto}://${host}:${port}`;
    return `${proto}://${host}`;
  }

  // Default: same host as page, choose proto by scheme
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const lp = location.port || (proto === "wss" ? 443 : 8080);
  return `${proto}://${location.hostname}:${lp}`;
}

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

export function connectWS(kind, roomId, host, port) {
  const url = resolveWSURL(host, port);

  if (!url) {
    toast("Local test mode: not connecting", "warn");
    return;
  }

  let ws;
  try {
    ws = new WebSocket(url);
  } catch (e) {
    console.error("WS create failed:", e);
    toast("Failed to create WebSocket", "error");
    return;
  }

  netState.ws = ws;

  ws.onopen = () => {
    setConn(true);
    toast(`Connected`, "ok");
    try {
      ws.send(JSON.stringify({ type: kind, roomId, name: identity.name }));
    } catch {}
  };

  ws.onclose = () => {
    setConn(false);
    netState.onDisconnected && netState.onDisconnected();
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
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
        // ignore
        break;
      case "error":
        toast(m.reason || "Server error", "error");
        break;
    }
  };

  // heartbeat
  const hb = setInterval(() => {
    if (!ws || ws.readyState !== 1) {
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
