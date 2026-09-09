// Connects to the same origin the page was served from. Socket.IO
// negotiates the connection (WebSocket, falling back to polling) for us.
const socket = io();

const joinScreen = document.getElementById('join-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const classCodeInput = document.getElementById('class-code-input');
const joinBtn = document.getElementById('join-btn');
const joinError = document.getElementById('join-error');
const messages = document.getElementById('messages');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const userList = document.getElementById('user-list');
const connectionDot = document.getElementById('connection-dot');
const connectionStatus = document.getElementById('connection-status');

let username = '';
let pendingUsername = '';
let hasJoined = false;

joinBtn.addEventListener('click', () => {
  const name = usernameInput.value.trim();
  const code = classCodeInput.value.trim();
  if (!name || !code) return;

  // We don't know yet whether the code is right, so don't switch screens
  // here — wait for the server's 'join success' or 'join error' response.
  // Matches socket.on('join', ...) in server.js.
  pendingUsername = name;
  joinError.textContent = '';
  socket.emit('join', { username: name, code });
});

// The server only sends this after the class code checks out.
socket.on('join success', () => {
  username = pendingUsername;
  hasJoined = true;
  joinScreen.remove();
  chatScreen.classList.remove('hidden');
  messageInput.focus();
});

socket.on('join error', (message) => {
  joinError.textContent = message;
});

socket.on('connect', () => {
  connectionDot.classList.remove('offline');
  connectionStatus.textContent = 'Connected';
});

// Fires on a dropped connection (server restart, network blip, etc). The
// server has already forgotten this socket's username by this point, so
// send whoever it was back to the join screen instead of leaving them
// staring at a "connected" chat that no longer actually is.
socket.on('disconnect', () => {
  connectionDot.classList.add('offline');
  connectionStatus.textContent = 'Disconnected';

  if (hasJoined) {
    hasJoined = false;
    chatScreen.classList.add('hidden');
    // joinScreen was fully removed from the DOM on join, not just hidden —
    // put it back in its original spot, right before the chat screen.
    chatScreen.before(joinScreen);
  }
});

const sendBtn = chatForm.querySelector('button');

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  // Matches socket.on('chat message', ...) in server.js. The server is the
  // real gatekeeper on rate/length — this button disable is just UX polish
  // so people get instant feedback instead of silently-dropped messages.
  socket.emit('chat message', text);
  messageInput.value = '';

  sendBtn.disabled = true;
  setTimeout(() => { sendBtn.disabled = false; }, 400);
});

// Sent once, right after we join, so we see recent context instead of a
// blank chat window. Reuses the same rendering as live messages.
socket.on('history', (history) => {
  history.forEach(renderMessage);
});

// Fires when the server calls io.emit('chat message', ...) — that includes
// messages we sent ourselves, so we don't render our own text locally above.
socket.on('chat message', renderMessage);

socket.on('system', (text) => {
  const li = document.createElement('li');
  li.className = 'system';
  li.textContent = text;
  appendMessage(li);
});

// Sent only to us when the server rejects a message for being too fast —
// never broadcast, since it's not a chat message, just feedback for the sender.
socket.on('rate limited', (text) => {
  const li = document.createElement('li');
  li.className = 'system';
  li.textContent = text;
  appendMessage(li);
});

socket.on('user list', (users) => {
  userList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');

    const dot = document.createElement('span');
    dot.className = 'dot small';

    const label = document.createElement('span');
    label.textContent = user;

    li.append(dot, label);
    userList.appendChild(li);
  });
});

function renderMessage({ username: sender, text }) {
  const li = document.createElement('li');
  if (sender === username) li.classList.add('own');

  const senderEl = document.createElement('span');
  senderEl.className = 'sender';
  senderEl.textContent = sender;

  li.append(senderEl, text);
  appendMessage(li);
}

function appendMessage(li) {
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
}
