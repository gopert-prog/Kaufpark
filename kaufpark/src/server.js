const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStoreFactory = require('connect-sqlite3');
const helmet = require('helmet');

// Initialize DB (creates tables and seeds users/config if needed)
const db = require('./db');

const app = express();

const SQLiteStore = SQLiteStoreFactory(session);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(
  session({
    store: new SQLiteStore({
      db: 'sessions.sqlite',
      dir: path.join(__dirname, 'db')
    }),
    secret: process.env.SESSION_SECRET || 'kaufpark-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }
  })
);

// Routes
const clientRoutes = require('./routes/client');
const operatorRoutes = require('./routes/operator');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

app.use('/', clientRoutes);
app.use('/operator', operatorRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Kaufpark running on http://localhost:${PORT}`);
});

