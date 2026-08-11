const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// This callback fires once per browser tab that connects — `socket` is that
// one client's private connection. Everything below is scoped to it.
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Custom event, not built into Socket.IO — we invented the name 'join'.
  // Client and server just have to agree on the event name and payload shape.
  socket.on('join', (username) => {
    socket.data.username = username;

    // broadcast = everyone EXCEPT this socket. The joining user doesn't
    // need to be told they joined; everyone else does.
    socket.broadcast.emit('system', `${username} joined the chat`);
  });

  socket.on('chat message', (text) => {
    const username = socket.data.username || 'Anonymous';

    // io.emit = every connected client, INCLUDING the sender. That's what
    // makes the sender's own message show up in their own chat window.
    io.emit('chat message', { username, text });
  });

  // Fires automatically when the tab closes or loses connection —
  // no client-side code has to ask for this one.
  socket.on('disconnect', () => {
    const username = socket.data.username;
    if (username) {
      socket.broadcast.emit('system', `${username} left the chat`);
    }
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
