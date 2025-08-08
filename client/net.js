// Simple WS client
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

function makeSocket(host, port) {
  const url = `ws://${host}:${port}`;
  return new WebSocket(url);
}

export function connectWS(
  kind = "auto",
  roomId = null,
  host = location.hostname,
  port = location.port || 8080
) {
  const ws = makeSocket(host, port);
  netState.ws = ws;

  ws.onopen = () => {
    const payload = { type: kind, roomId };
    ws.send(JSON.stringify(payload));
  };
  ws.onclose = () => {
    netState.onDisconnected && netState.onDisconnected();
  };
  ws.onerror = () => {};

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
    }
  };
}

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
