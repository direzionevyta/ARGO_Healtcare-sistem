// db.js — Pool PostgreSQL condiviso
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('DB pool error:', err.message);
});

// Helper: query con log degli errori
async function query(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return result;
  } catch (err) {
    console.error('DB query error:', err.message, '\nSQL:', sql.substring(0, 100));
    throw err;
  }
}

// Audit log GDPR — scrivi evento immutabile
async function auditLog(aziendaId, utenteId, tipo, messaggio, ip = null) {
  const crypto = require('crypto');
  const contenuto = JSON.stringify({ aziendaId, utenteId, tipo, messaggio, ip, ts: new Date().toISOString() });
  const hash = crypto.createHash('sha256').update(contenuto).digest('hex').substring(0, 16);
  try {
    await pool.query(
      `INSERT INTO audit_log (azienda_id, utente_id, tipo, messaggio, ip, hash)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [aziendaId, utenteId, tipo, messaggio, ip, hash]
    );
  } catch (e) { /* non bloccare il flusso principale */ }
}

module.exports = { pool, query, auditLog };
