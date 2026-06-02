// auth.js — middleware autenticazione e helpers
const bcrypt = require('bcryptjs');
const { query, auditLog } = require('./db');

// Richiede login (redirect se non autenticato)
function requireAuth(req, res, next) {
  if (req.session?.userId) return next();
  if (req.headers['accept']?.includes('application/json')) {
    return res.status(401).json({ error: 'Non autenticato' });
  }
  res.redirect('/login');
}

// Richiede ruolo specifico
function requireRuolo(...ruoli) {
  return (req, res, next) => {
    if (!req.session?.userId) return res.redirect('/login');
    if (ruoli.includes(req.session.userRuolo)) return next();
    res.status(403).json({ error: 'Accesso negato' });
  };
}

// Login: verifica credenziali, restituisce utente
async function login(aziendaSlug, username, password, ruoloScelto, mezzoId, ip) {
  // Trova l'azienda
  const az = await query('SELECT * FROM aziende WHERE slug=$1 AND attiva=true', [aziendaSlug]);
  if (!az.rows.length) throw new Error('Azienda non trovata');
  const azienda = az.rows[0];

  // Trova l'utente
  const ur = await query(
    `SELECT * FROM utenti WHERE azienda_id=$1 AND username=$2 AND attivo=true`,
    [azienda.id, username]
  );
  if (!ur.rows.length) throw new Error('Credenziali non valide');
  const utente = ur.rows[0];

  // Verifica password
  const ok = await bcrypt.compare(password, utente.password);
  if (!ok) {
    await auditLog(azienda.id, utente.id, 'WARN', `Login fallito per ${username}`, ip);
    throw new Error('Credenziali non valide');
  }

  // Se ruolo=mezzo, verifica che il mezzo selezionato esista e appartenga a questa azienda
  let mezzo = null;
  if (ruoloScelto === 'mezzo') {
    if (!mezzoId) throw new Error('Seleziona un mezzo');
    const mr = await query(
      `SELECT m.* FROM mezzi m WHERE m.id=$1 AND m.azienda_id=$2 AND m.attivo=true`,
      [mezzoId, azienda.id]
    );
    if (!mr.rows.length) throw new Error('Mezzo non trovato');
    mezzo = mr.rows[0];

    // Associa utente al mezzo (upsert)
    await query(
      `INSERT INTO utenti_mezzi(utente_id, mezzo_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,
      [utente.id, mezzo.id]
    );
  }

  await auditLog(azienda.id, utente.id, 'ACCESSO', `Login OK: ${username} come ${ruoloScelto} | IP: ${ip}`, ip);

  return { utente, azienda, mezzo };
}

// Crea hash bcrypt per una password
async function hashPassword(pw) {
  return bcrypt.hash(pw, 10);
}

module.exports = { requireAuth, requireRuolo, login, hashPassword };
