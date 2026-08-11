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

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  // Matches socket.on('chat message', ...) in server.js.
  socket.emit('chat message', text);
  messageInput.value = '';
});

// Fires when the server calls io.emit('chat message', ...) — that includes
// messages we sent ourselves, so we don't render our own text locally above.
socket.on('chat message', ({ username: sender, text }) => {
  addMessage(`${sender}: ${text}`);
});

socket.on('system', (text) => {
  addMessage(text, true);
});

function addMessage(text, isSystem = false) {
  const li = document.createElement('li');
  li.textContent = text;
  if (isSystem) li.classList.add('system');
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
}
