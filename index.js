const jsonServer = require('json-server');
const express = require('express');
const session = require('express-session');
const server = jsonServer.create();
const router = jsonServer.router('./db/db.json');
const cors = require('cors');
const middlewares = jsonServer.defaults();

server.use(cors());
server.use(middlewares);
server.use(express.json());
server.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: false,
}));

const db = router.db;

server.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/relatos') {
    const novoRelato = req.body;

    if (novoRelato) {
      novoRelato.liked = novoRelato.liked !== undefined ? novoRelato.liked : false;
      novoRelato.likes = novoRelato.likes !== undefined ? novoRelato.likes : 0;
    }
  }

  next();
});

const authenticateUser = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

server.post('/login', (req, res) => {
  const { email, senha } = req.body;
  const user = db.get('users').find({ email: email, senha: senha }).value();
  if (user) {
    req.session.user = user;
    res.json({ message: 'Login successful', user });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

server.get('/me', authenticateUser, (req, res) => {
  res.json(req.session.user);
});

server.get('/check-email', (req, res) => {
  const { email } = req.query;
  console.log(`Verificando email: ${email}`); // Log para verificar o email recebido
  const user = db.get('users').find({ email: email }).value();
  if (user) {
    console.log(`Email já utilizado: ${email}`); // Log quando o email já está cadastrado
    return res.status(400).json({ message: 'Email já cadastrado' });
  }
  console.log(`Email disponível: ${email}`); // Log quando o email está disponível
  res.status(200).json({ message: 'Email disponível' });
});

server.use(router);

server.listen(3000, () => {
  console.log('JSON Server is running em http://localhost:3000');
});