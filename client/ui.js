// ui.js - UI helpers: menu, toasts, sounds, connection indicator

const $ = (id) => document.getElementById(id);

let handlers = { onCreate: null, onJoin: null, onAuto: null };
let localTestCb = null;

export function onUIMount(h) {
  handlers = h;

  const roomInput = $("roomInput");
  const nameInput = $("nameInput");

  // Prefill from localStorage
  const lastRoom = localStorage.getItem("tetris.room");
  if (lastRoom) roomInput.value = lastRoom;

  $("createBtn").addEventListener("click", () => {
    const { host, port } = getServerFromHash();
    handlers.onCreate(host, port, nameInput.value);
  });

  $("autoBtn").addEventListener("click", () => {
    const { host, port } = getServerFromHash();
    handlers.onAuto(host, port, nameInput.value);
  });

  $("joinBtn").addEventListener("click", () => {
    const { host, port } = getServerFromHash();
    handlers.onJoin(roomInput.value, host, port, nameInput.value);
  });

  $("localTestBtn").addEventListener("click", () => {
    localTestCb && localTestCb();
  });

  // Mute/volume
  $("muteBtn").addEventListener("click", toggleMute);
  $("volume").addEventListener("input", (e) =>
    setVolume(parseFloat(e.target.value))
  );
}

export function onLocalTestRequested(cb) {
  localTestCb = cb;
}

function getServerFromHash() {
  // Allow overriding server: #host=example.com&port=8080
  const hash = new URLSearchParams(location.hash.slice(1));
  const host = hash.get("host") || location.hostname;
  const port =
    hash.get("port") || (location.protocol === "https:" ? 443 : 8080);
  return { host, port };
}

export function setConn(connected) {
  const el = $("connStatus");
  el.textContent = connected ? "online" : "offline";
  el.style.background = connected ? "#0d4e23" : "#4a1d1d";
}

// === Toasts ===
export function toast(text, type = "info") {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = text;
  if (type === "ok") t.style.borderColor = "#1f5131";
  if (type === "error") t.style.borderColor = "#5b1f2a";
  if (type === "warn") t.style.borderColor = "#5b4f1f";
  $("toasts").appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// === Sounds ===
// We try to fetch assets.json; if it fails or audio blocked, we fallback to WebAudio tone.
let audioEnabled = true;
let vol = 0.6;
let ctx = null;

function ensureCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}
function tone(freq = 440, ms = 60) {
  if (!audioEnabled) return;
  const ac = ensureCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  gain.gain.value = vol * 0.1;
  osc.frequency.value = freq;
  osc.connect(gain).connect(ac.destination);
  osc.start();
  setTimeout(() => osc.stop(), ms);
}

let assets = null;
(async function loadAssets() {
  try {
    const res = await fetch("./assets.json");
    if (res.ok) assets = await res.json();
  } catch {}
})();

export function play(name) {
  if (!audioEnabled) return;
  // If we had URLs we could play them here, but for reliability, tone:
  const map = {
    move: 480,
    rotate: 520,
    lock: 300,
    line: 600,
    tetris: 700,
    gameover: 200,
    ready: 650,
  };
  tone(map[name] || 500, name === "gameover" ? 200 : 60);
}

export function getVolume() {
  return vol;
}
function setVolume(v) {
  vol = Math.max(0, Math.min(1, v));
  if (vol === 0) audioEnabled = false;
}
function toggleMute() {
  audioEnabled = !audioEnabled;
  $("muteBtn").textContent = audioEnabled ? "🔊" : "🔇";
}

// Expose for other modules if needed
window.__ui = { toast, play, setConn, getVolume };
