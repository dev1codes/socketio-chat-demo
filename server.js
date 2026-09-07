const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Filter } = require('bad-words');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const filter = new Filter();

// Tell browsers (and any carrier/proxy cache in between) to never reuse a
// cached copy of these files — otherwise a phone can keep showing an old
// version of the CSS/JS after a redeploy long after a laptop has the update.
app.use(express.static('public', {
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-store'),
}));

// In-memory only — the free tier's filesystem is ephemeral and the process
// itself gets recycled after inactivity, so this resets on every restart.
// Fine for "recent context on join"; not a substitute for a real database.
const MAX_HISTORY = 50;
const messageHistory = [];

// socket.id -> username, so we can rebuild the online list on every
// join/disconnect without asking each client who's still there.
const onlineUsers = new Map();

// One client sending too fast (a bug, or someone mashing enter) shouldn't be
// able to flood everyone else — enforce a minimum gap between messages,
// per socket, server-side. Client-side limits alone don't count: anyone can
// open devtools and call socket.emit directly, skipping the browser code.
const MIN_MESSAGE_INTERVAL_MS = 400;
const MAX_MESSAGE_LENGTH = 500;
const MAX_USERNAME_LENGTH = 30;

function broadcastUserList() {
  io.emit('user list', Array.from(onlineUsers.values()));
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join', (username) => {
    // The client already blocks an empty name, but that's only a UI nicety —
    // validate again here so a devtools-emitted 'join' can't sneak an empty
    // or blank username past the check and end up posting as nothing.
    if (typeof username !== 'string') return;
    const trimmed = username.trim().slice(0, MAX_USERNAME_LENGTH);
    if (!trimmed) return;

    socket.data.username = trimmed;
    onlineUsers.set(socket.id, trimmed);

    // Sent to this socket only — everyone else already has this history,
    // it's just the new arrival who needs catching up.
    socket.emit('history', messageHistory);

    socket.broadcast.emit('system', `${trimmed} joined the chat`);
    broadcastUserList();
  });

  socket.on('chat message', (text) => {
    if (typeof text !== 'string') return;

    // No anonymous posting: a socket that skipped 'join' (or got disconnected
    // and hasn't rejoined) has no username on record, so reject the message
    // outright instead of ever falling back to a generic "Anonymous" sender.
    const username = socket.data.username;
    if (!username) {
      socket.emit('system', 'You need to enter a name and join before sending messages.');
      return;
    }

    const now = Date.now();
    const elapsed = now - (socket.data.lastMessageAt || 0);
    if (elapsed < MIN_MESSAGE_INTERVAL_MS) {
      socket.emit('rate limited', 'Slow down — wait a moment before sending another message.');
      return;
    }
    socket.data.lastMessageAt = now;

    const trimmed = text.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!trimmed) return;

    const cleanText = filter.clean(trimmed);

    const message = { username, text: cleanText };
    messageHistory.push(message);
    if (messageHistory.length > MAX_HISTORY) messageHistory.shift();

    io.emit('chat message', message);
  });

  socket.on('disconnect', () => {
    const username = socket.data.username;
    if (username) {
      onlineUsers.delete(socket.id);
      socket.broadcast.emit('system', `${username} left the chat`);
      broadcastUserList();
    }
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
