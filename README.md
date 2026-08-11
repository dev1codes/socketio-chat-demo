# Socket.IO Chat Demo

A minimal chat app for learning how [Socket.IO](https://socket.io) works. Socket.IO lets a server and browser push messages to each other in real time over a persistent connection, instead of the browser having to poll or refresh for updates.

## Run it

```bash
npm install
npm start
```

Then open `http://localhost:3000` in two separate browser tabs (or windows) and chat with yourself — each tab is treated as a separate connected client.

## Connecting over a network

Whoever runs `npm start` becomes the server — everyone else on the **same Wi-Fi network** connects to that person's IP address instead of `localhost`.

**Find your IP address:**

- **Mac:** open Terminal and run
  ```bash
  ipconfig getifaddr en0
  ```
  (if that prints nothing, you're on Ethernet or a different Wi-Fi adapter — try `en1`)

- **Windows:** open Command Prompt and run
  ```bat
  ipconfig
  ```
  Look for **IPv4 Address** under your active network adapter (Wi-Fi or Ethernet). To skip straight to it:
  ```bat
  ipconfig | findstr /i "IPv4"
  ```

Then share that address with everyone else on the network, who open it in their browser with the port the server printed, e.g.:

```
http://192.168.0.164:3000
```

Notes:
- Everyone must be on the same Wi-Fi/LAN — this won't work over different networks or cellular data.
- The server only needs to run on **one** machine; everyone else is just a browser tab pointed at that machine's IP.
- If others can't connect, check that your OS firewall isn't blocking incoming connections to Node (macOS will usually prompt you to allow it the first time).
- Your IP can change between sessions (DHCP) — re-check it if connections stop working.

## What to look at

Everything worth understanding lives in two files:

- **[server.js](server.js)** — the three events that matter:
  - `io.on('connection', ...)` — runs once per client that connects.
  - `socket.on('join', ...)` and `socket.on('chat message', ...)` — custom events we made up; the client emits them and the server listens.
  - `socket.on('disconnect', ...)` — runs automatically when a tab closes.

  Pay attention to the difference between `socket.emit` (sender only), `socket.broadcast.emit` (everyone except sender), and `io.emit` (everyone including sender) — mixing these up is the most common beginner bug.

- **[public/client.js](public/client.js)** — the browser side of the same three events, so you can see both ends of each conversation side by side.

## Next steps for students

Once this makes sense, good follow-up exercises:
- Add a typing indicator (`socket.emit('typing')` on keypress).
- Show a list of currently online users.
- Turn the single shared room into private 1-on-1 direct messages by tracking each user's `socket.id` and using `io.to(socketId).emit(...)`.
