# simple-websocket

Broadcast WebSocket test server, purpose-built to be compatible with
`canscloud-react-native-v6`'s WebSocket client
(`src/services/websocket/`) for on-device testing.

## Protocol

Every frame is JSON shaped `{ "type": string, "payload": any }` — exactly
what `defaultSerialize`/`defaultParse` in that repo's
`src/services/websocket/config.ts` produce and expect.

The server does one thing: **any frame sent by any connected client is
rebroadcast verbatim to every currently connected client, including the
sender.** That single behavior covers three needs at once:

- **Heartbeat**: the app's own `ping` frame comes back to itself with a
  matching `id`, so the app's built-in pong-matching treats it as a real
  pong (same trick `wss://echo.websocket.events` relies on).
- **Round-trip proof**: the app's own "Verify" test frame is echoed back
  to itself, same as a plain echo server.
- **Cross-client push**: a message typed into this server's web page (or
  sent from `wscat`/Postman/another phone) reaches every *other* connected
  client too — e.g. your phone app connected to the same URL — which a
  pure echo server can never do, since it only mirrors back to the sender.

## Run locally

```bash
npm install
npm start
```

Listens on `:8080` (or `$PORT`). Open `http://localhost:8080` in a
browser for the test page, or point the app's WebSocket Test screen
Endpoint field at `ws://<your-lan-ip>:8080` (phone must be on the same
WiFi).

## Deploy to Render

1. Push this folder to its own GitHub repo (or use Render's "deploy from
   local Blueprint" flow with the included `render.yaml`).
2. In Render: **New → Blueprint**, point it at the repo — `render.yaml`
   already declares a free Node web service with a health check at
   `/healthz`.
3. Once deployed, Render gives you a URL like
   `https://simple-websocket-xxxx.onrender.com`.
4. Test page: open that URL in a browser.
5. Point the app's WebSocket Test screen (User → Developer → WebSocket →
   Endpoint) at `wss://simple-websocket-xxxx.onrender.com` and Connect.
6. Type a message on the Render-hosted web page — it should show up in
   the app's Live Feed / Traffic log almost immediately.

Render's free plan spins the service down after inactivity; the first
connection after a while sleeping takes a few extra seconds to wake up.
# web-socket-101
