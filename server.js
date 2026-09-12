/**
 * Broadcast WebSocket test server with React Native app.
 *
 * Behavior: every inbound frame — from ANY connected client, including
 * pings — is rebroadcast verbatim to EVERY currently connected client
 * (sender included). This makes the server simultaneously:
 *
 *  - A heartbeat responder: the app's own ping comes back to itself with
 *    a matching id, so WebSocketService's matchPong() treats it as a pong
 *    (see defaultMatchPong — it accepts a mirrored "ping" type too).
 *  - An echo server: the app's own round-trip "Verify" proof frame comes
 *    back to itself, same as wss://echo.websocket.events.
 *  - A multi-client push: a message typed into the /  web test page (or
 *    sent from another client) reaches every OTHER connected client too —
 *    e.g. the mobile app connected to the same URL — which a pure echo
 *    server can never do (it only mirrors back to the sender).
 *
 * Non-JSON / malformed frames are broadcast unchanged as raw text; the
 * client's defaultParse() already tolerates that (RAW_MESSAGE_TYPE).
 */

const path = require("path");
const express = require("express");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

const server = app.listen(PORT, () => {
  console.log(`simple-websocket listening on :${PORT}`);
});

const wss = new WebSocketServer({ server });

const send = (ws, obj) => {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
};

const broadcastRaw = (data, senderIp) => {
  let delivered = 0;
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(data);
      delivered += 1;
    }
  }
  console.log(`[broadcast] from ${senderIp} -> ${delivered} client(s): ${data}`);
};

wss.on("connection", (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`[connect] ${ip} (clients: ${wss.clients.size})`);

  send(ws, {
    type: "server.hello",
    payload: { message: "connected", clients: wss.clients.size, at: Date.now() },
  });

  ws.on("message", (data, isBinary) => {
    if (isBinary) {
      broadcastRaw(data, ip);
      return;
    }
    broadcastRaw(data.toString(), ip);
  });

  ws.on("close", () => {
    console.log(`[disconnect] ${ip} (clients: ${wss.clients.size - 1})`);
  });

  ws.on("error", (err) => {
    console.error(`[error] ${ip}: ${err.message}`);
  });
});
