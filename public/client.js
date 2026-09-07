// Connects to the same origin the page was served from. Socket.IO
// negotiates the connection (WebSocket, falling back to polling) for us.
const socket = io();

const joinScreen = document.getElementById('join-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const joinBtn = document.getElementById('join-btn');
const messages = document.getElementById('messages');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const userList = document.getElementById('user-list');

let username = '';

joinBtn.addEventListener('click', () => {
  username = usernameInput.value.trim();
  if (!username) return;

  // Tells the server who we are. Matches socket.on('join', ...) in server.js.
  socket.emit('join', username);

  joinScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
  messageInput.focus();
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
