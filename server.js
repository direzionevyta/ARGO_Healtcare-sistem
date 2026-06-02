// server.js — Entry point ARGO SaaS
require('dotenv').config();
const express     = require('express');
const http        = require('http');
const { WebSocketServer } = require('ws');
const session     = require('express-session');
const pgSession   = require('connect-pg-simple')(session);
const cookieParser= require('cookie-parser');
const path        = require('path');
const { pool, query } = require('./db');
const wsManager   = require('./ws_manager');
const { hashPassword } = require('./auth');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server, path: '/ws' });
const PORT   = process.env.PORT || 3000;

// ── MIDDLEWARE ────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'static')));

app.use(session({
  store: new pgSession({
    pool,
    tableName: 'sessioni',
    createTableIfMissing: false,
  }),
  secret: process.env.SESSION_SECRET || 'argo-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 12 * 60 * 60 * 1000, // 12 ore
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// ── WEBSOCKET ─────────────────────────────────────────────────────
wsManager.setup(wss);

// ── ROUTES ────────────────────────────────────────────────────────
app.use('/', require('./routes/auth'));
app.use('/api', require('./routes/api'));
app.use('/centrale', require('./routes/centrale'));
app.use('/mezzo', require('./routes/mezzo'));

// ── AVVIO ─────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🏥 ARGO SaaS avviato sulla porta ${PORT}`);
  try {
    const r = await query('SELECT NOW()');
    console.log('✅ PostgreSQL connesso:', r.rows[0].now);
    await seedAdmin();
  } catch(e) {
    console.error('❌ DB non raggiungibile:', e.message);
  }
});

// Crea admin di default se non esiste
async function seedAdmin() {
  const r = await query(`SELECT COUNT(*) as n FROM utenti`);
  if (parseInt(r.rows[0].n) > 0) return;
  console.log('🌱 Creazione admin default...');
  const az = await query(`SELECT id FROM aziende WHERE slug='vyta'`);
  if (!az.rows.length) {
    await query(`INSERT INTO aziende(nome,slug,piano) VALUES('VYTA Hospital','vyta','pro')`);
  }
  const azId = (await query(`SELECT id FROM aziende WHERE slug='vyta'`)).rows[0].id;
  const pw = await hashPassword('admin123');
  await query(
    `INSERT INTO utenti(azienda_id,username,password,ruolo,nome,cognome)
     VALUES($1,'admin',$2,'centrale','Admin','VYTA')
     ON CONFLICT DO NOTHING`,
    [azId, pw]
  );
  console.log('✅ Admin creato: admin / admin123');
}
