# Tiny Tetris Duel (Web + WebSocket)

A lightweight **Tetris-style** game that runs in any modern browser with **real-time two-player** online play.

- Client: **HTML5 + Canvas + vanilla JS**
- Server: **Node.js** using **ws**
- Two players join the same room (code or auto-match). Optional garbage lines on multi-line clears.
- Controls: **Keyboard**, **Mouse**, and **On-screen mobile buttons**
- **No page scrolling** during gameplay.

---

# Quick Start (Local Dev)

1) Start the WebSocket server

```bash
cd server
npm install
npm start
# defaults to PORT=8080
```
2) Serve the client statically

You can use any static file server. Examples:

# Option A: npx http-server (install if needed)
cd client
npx http-server -p 5173 --cors

# Option B: Python
cd client
python3 -m http.server 5173

Now open: http://localhost:5173

Override server host/port by adding to the hash:

http://localhost:5173/#host=localhost&port=8080

Deploy

Client (Vercel or Netlify)

Vercel
	1.	vercel → project root, set client/ as the public root.
	2.	Framework preset: None (static).
	3.	Ensure it serves files from client/.

Netlify
	1.	New site → Deploy manually or connect repo.
	2.	Build command: (leave empty).
	3.	Publish directory: client/.

Tip: If you’re using a mono-repo, you can set base to client/ in Netlify UI.

Server (Render / Railway / Fly.io)

Render
	1.	New → Web Service
	2.	Connect repo, set root to server/.
	3.	Build Command: npm install
	4.	Start Command: npm start
	5.	Runtime: Node 18+
	6.	Expose port: Render will detect from PORT.

Railway
	1.	New Project → Deploy from repo.
	2.	Set service root to server/.
	3.	Railway sets PORT env; no further config.

Fly.io
	1.	fly launch in server/.
	2.	Expose the TCP port from PORT.
	3.	fly deploy.

Vercel Serverless: Vercel’s classic serverless functions are not a generic persistent WebSocket host. Use Render/Railway/Fly for a persistent WS server.

⸻

Environment variables

Server (/server):
	•	PORT — the port to listen on (default: 8080)

Client (/client):
	•	Override server via URL hash, e.g. #host=my-ws.example.com&port=443

⸻

Rooms
	•	Create Room: Click the button to create a 4-6 character code. Share it with a friend.
	•	Join Room: Enter the code and click Join.
	•	Auto-Match: Server finds the first room with space available.

Max room size is 2. Disconnects are handled; leaving notifies the peer. Rejoin by entering the same code.

⸻

Controls

Keyboard
	•	Left/Right: Move
	•	Down: Soft drop
	•	Up / X: Rotate CW
	•	Z: Rotate CCW
	•	Space: Hard drop
	•	C: Hold
	•	P: Pause

Mouse/Mobile
	•	On-screen buttons mirror the actions.
	•	Prevents default touch scrolling/zoom with touch-action: none.

Accessibility
	•	Buttons have ARIA labels and focus outlines.
	•	Keyboard-only play supported.
	•	Mute toggle and volume slider.

⸻

Networking Protocol (compact JSON)

Messages:
	•	create / auto / join → handshake
	•	created / joined / peerJoin / peerLeave
	•	state { payload: { board, cur, hold, next, score, lines, level, alive } }
	•	lock { payload: { board, linesCleared, stats } }
	•	garbage { rows }
	•	gameOver
	•	heartbeat

Validation: On lock, server recomputes full rows from the provided board and may emit correctedClear. Simple garbage: (linesCleared - 1) rows sent to opponent.

Tick/loop:
	•	Client renders at 60 FPS with requestAnimationFrame.
	•	Logic ticks at 30 TPS.
	•	Snapshots sent ~ every frame; could be thinned if desired.

⸻

Test Mode (no server)

Click Local Test on the menu, or open:

http://localhost:5173/?local=1
This mirrors your state to the “opponent” view with a small delay. Useful to validate mechanics quickly.

⸻

Assets
	•	Buttons use text; client/assets.json references Heroicons SVGs and a few Wikimedia Commons blips as examples.
	•	If assets fail or are blocked by CORS, the game falls back to WebAudio beeps (so it still works).

⸻

Known Limitations & Future Work
	•	Board state is sent as JSON; could be bit-packed to shrink bandwidth further.
	•	Server-side full validation (re-simulating placements) is simplified.
	•	No reconnection state restore; re-joining places you as a fresh player.
	•	Spectator mode not implemented.
	•	Garbage hole is random and not synchronized (acceptable for casual play).

⸻

QA Checklist
	•	No scrolling on desktop and mobile.
	•	Keyboard controls: move, rotate, soft & hard drop, hold, pause.
	•	On-screen controls responsive and large enough.
	•	Sounds play or fall back to beeps; Mute & Volume work.
	•	Two-player online sync: both see each other’s boards.
	•	Line clears score and speed up; Tetris sends garbage.
	•	Pause overlay and resume.
	•	Disconnection shows “opponent left”.
    
⸻

License

MIT for code. External asset licenses belong to their respective owners.