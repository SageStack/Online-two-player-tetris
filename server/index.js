// TODO: Implement server
const http = require("http");
// OOPS: forgot to import ws (no WebSocket handling yet)

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Tetris server running");
});

server.listen(process.env.PORT || 8080, () => {
  console.log("Server on", process.env.PORT || 8080);
});
