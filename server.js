const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { WebSocketServer } = require('ws');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');
const JWT_SECRET = 'change_this_secret';

function loadJson(file, def) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(def, null, 2));
  }
  return JSON.parse(fs.readFileSync(file));
}
function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

let users = loadJson(USERS_FILE, { users: [] });
let logs = loadJson(LOGS_FILE, { donations: [] });

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ secret: 'session_secret', resave: false, saveUninitialized: false }));
app.use(express.static(path.join(__dirname, 'public')));

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

function findUser(username) {
  return users.users.find(u => u.username === username);
}

function generateApiKey() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.send('Missing fields');
  if (findUser(username)) return res.send('User exists');
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = { id: Date.now(), username, passwordHash, apiKey: generateApiKey(), settings: { color: '#ff0000', layout: 'default', sound: '' } };
  users.users.push(user);
  saveJson(USERS_FILE, users);
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = findUser(username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.send('Invalid credentials');
  }
  req.session.userId = user.id;
  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  req.session.token = token;
  res.redirect('/home');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/api/user', requireAuth, (req, res) => {
  const user = users.users.find(u => u.id === req.session.userId);
  if (!user) return res.status(401).end();
  const donations = logs.donations.filter(d => d.username === user.username);
  const count = donations.length;
  const total = donations.reduce((s, d) => s + Number(d.amount || 0), 0);
  const last = donations[donations.length - 1] || null;
  res.json({ username: user.username, apiKey: user.apiKey, total, last, count, settings: user.settings });
});

app.get('/home', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/settings', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

app.post('/settings', requireAuth, (req, res) => {
  const user = users.users.find(u => u.id === req.session.userId);
  if (!user) return res.sendStatus(401);
  user.settings = { ...user.settings, ...req.body };
  saveJson(USERS_FILE, users);
  res.send('Settings saved');
});

app.get('/:username', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'feed.html'));
});

app.post('/:username', (req, res) => {
  const { username } = req.params;
  const { key, message, amount, user } = req.body;
  const u = findUser(username);
  if (!u || key !== u.apiKey) {
    return res.status(401).send('Unauthorized');
  }
  const donation = { username, message, amount, user, timestamp: new Date().toISOString() };
  logs.donations.push(donation);
  saveJson(LOGS_FILE, logs);
  broadcast(username, donation);
  res.send('ok');
});

const server = app.listen(3000, () => console.log('Server running on 3000'));
const wss = new WebSocketServer({ server });
const clients = {};

function broadcast(username, data) {
  (clients[username] || []).forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const username = url.searchParams.get('username');
  if (!username) return ws.close();
  if (!clients[username]) clients[username] = new Set();
  clients[username].add(ws);
  ws.on('close', () => clients[username].delete(ws));
});
