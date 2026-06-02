// routes/api.js — tutti gli endpoint REST
const express  = require('express');
const router   = express.Router();
const { requireAuth } = require('../auth');
const { query, auditLog } = require('../db');
const { hashPassword } = require('../auth');
const { notificaServizio, mezziOnline } = require('../ws_manager');

const aid = (req) => req.session.aziendaId;

// ── STATS ─────────────────────────────────────────────────────────
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const [paz, srv, tur, pers] = await Promise.all([
      query('SELECT COUNT(*) n FROM pazienti WHERE azienda_id=$1', [aid(req)]),
      query("SELECT COUNT(*) n FROM servizi WHERE azienda_id=$1", [aid(req)]),
      query("SELECT COUNT(*) n FROM turni WHERE azienda_id=$1 AND DATE(inizio_turno)=CURRENT_DATE AND stato IN ('programmato','in_corso')", [aid(req)]),
      query('SELECT COUNT(*) n FROM utenti WHERE azienda_id=$1 AND attivo=true', [aid(req)]),
    ]);
    const attivi = await query("SELECT COUNT(*) n FROM servizi WHERE azienda_id=$1 AND stato='in_corso'", [aid(req)]);
    res.json({
      n_pazienti: +paz.rows[0].n, n_servizi: +srv.rows[0].n,
      n_turni: +tur.rows[0].n,   n_personale: +pers.rows[0].n,
      n_attivi: +attivi.rows[0].n,
      mezzi_online: mezziOnline(aid(req)).length
    });
  } catch(e) { res.status(500).json({error:e.message}); }
});

// ── PAZIENTI ──────────────────────────────────────────────────────
router.get('/pazienti', requireAuth, async (req, res) => {
  const r = await query('SELECT * FROM pazienti WHERE azienda_id=$1 ORDER BY cognome,nome', [aid(req)]);
  auditLog(aid(req), req.session.userId, 'LETTURA', `Lista pazienti consultata | IP: ${req.ip}`);
  res.json(r.rows);
});

router.post('/paziente', requireAuth, async (req, res) => {
  const d = req.body;
  if (!d.consenso_gdpr) return res.status(400).json({error:'Consenso GDPR obbligatorio'});
  const r = await query(
    `INSERT INTO pazienti (azienda_id,nome,cognome,codice_fiscale,data_nascita,genere,
       telefono,email,indirizzo,gruppo_sanguigno,note_mediche,tipo_soggetto,
       destinazione_fiscale,codice_sdi,pec,consenso_gdpr)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
    [aid(req),d.nome,d.cognome,d.codice_fiscale||null,d.data_nascita||null,d.genere||null,
     d.telefono||null,d.email||null,d.indirizzo||null,d.gruppo_sanguigno||null,
     d.note_mediche||null,d.tipo_soggetto||'privato',d.destinazione_fiscale||'tessera_sanitaria',
     d.codice_sdi||null,d.pec||null,true]
  );
  auditLog(aid(req),req.session.userId,'SCRITTURA',`Paziente salvato: ${d.cognome} ${d.nome} | CF: ${d.codice_fiscale||'N/D'} | Dest: ${d.destinazione_fiscale} | ID: ${r.rows[0].id}`);
  res.json({ok:true, id: r.rows[0].id});
});

router.delete('/paziente/:id', requireAuth, async (req, res) => {
  await query('DELETE FROM pazienti WHERE id=$1 AND azienda_id=$2', [req.params.id, aid(req)]);
  auditLog(aid(req),req.session.userId,'SCRITTURA',`Paziente eliminato ID: ${req.params.id}`);
  res.json({ok:true});
});

// ── SERVIZI ───────────────────────────────────────────────────────
router.get('/servizi', requireAuth, async (req, res) => {
  const r = await query(
    'SELECT * FROM servizi WHERE azienda_id=$1 ORDER BY creato_il DESC LIMIT 100', [aid(req)]
  );
  res.json(r.rows);
});

router.post('/servizio', requireAuth, async (req, res) => {
  const d = req.body;
  if (!d.paz_nome||!d.paz_cognome) return res.status(400).json({error:'Nome paziente obbligatorio'});
  if (!d.luogo_recupero||!d.luogo_destinazione) return res.status(400).json({error:'Luoghi obbligatori'});
  const r = await query(
    `INSERT INTO servizi (azienda_id,mezzo_id,operatore_id,paz_nome,paz_cognome,paz_cf,paz_tel,
       tipo_servizio,priorita,luogo_recupero,recupero_piano,recupero_note,
       dest_struttura,luogo_destinazione,dest_reparto,dest_tel,
       fat_intestatario,fat_cf_piva,fat_destinazione,fat_sdi,fat_pec,fat_pagamento,
       condizioni_paziente,note_operative,stato)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
     RETURNING *`,
    [aid(req), d.mezzo_id||null, req.session.userId,
     d.paz_nome,d.paz_cognome,d.paz_cf||null,d.paz_tel||null,
     d.tipo_servizio,d.priorita||'normale',
     d.luogo_recupero,d.recupero_piano||null,d.recupero_note||null,
     d.dest_struttura||null,d.luogo_destinazione,d.dest_reparto||null,d.dest_tel||null,
     d.fat_intestatario||null,d.fat_cf_piva||null,d.fat_destinazione||'tessera_sanitaria',
     d.fat_sdi||null,d.fat_pec||null,d.fat_pagamento||null,
     d.condizioni_paziente||null,d.note_operative||null,d.stato||'programmato']
  );
  const servizio = r.rows[0];
  auditLog(aid(req),req.session.userId,'SCRITTURA',
    `Servizio [${servizio.stato}] pz. ${d.paz_cognome} ${d.paz_nome} | ${d.tipo_servizio} | ${d.luogo_recupero}→${d.luogo_destinazione} | ID: ${servizio.id}`);
  // Notifica push via WebSocket al mezzo e alla centrale
  notificaServizio(aid(req), servizio, d.mezzo_id||null);
  res.json({ok:true, servizio});
});

router.patch('/servizio/:id/stato', requireAuth, async (req, res) => {
  await query('UPDATE servizi SET stato=$1, aggiornato_il=NOW() WHERE id=$2 AND azienda_id=$3',
    [req.body.stato, req.params.id, aid(req)]);
  res.json({ok:true});
});

// ── TURNI ─────────────────────────────────────────────────────────
router.get('/turni', requireAuth, async (req, res) => {
  const r = await query(
    `SELECT t.*, COALESCE(u.nome||' '||u.cognome, u.username) as operatore_nome,
       m.nome as mezzo_nome
     FROM turni t LEFT JOIN utenti u ON u.id=t.utente_id LEFT JOIN mezzi m ON m.id=t.mezzo_id
     WHERE t.azienda_id=$1 ORDER BY t.inizio_turno DESC LIMIT 50`, [aid(req)]
  );
  res.json(r.rows);
});

router.post('/turno', requireAuth, async (req, res) => {
  const d = req.body;
  const r = await query(
    `INSERT INTO turni(azienda_id,utente_id,mezzo_id,inizio_turno,fine_turno,stato,note)
     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [aid(req),d.utente_id||null,d.mezzo_id||null,d.inizio_turno,d.fine_turno||null,d.stato||'programmato',d.note||null]
  );
  auditLog(aid(req),req.session.userId,'SCRITTURA',`Turno creato ID: ${r.rows[0].id}`);
  res.json({ok:true, id: r.rows[0].id});
});

router.patch('/turno/:id/stato', requireAuth, async (req, res) => {
  await query('UPDATE turni SET stato=$1 WHERE id=$2 AND azienda_id=$3',
    [req.body.stato, req.params.id, aid(req)]);
  res.json({ok:true});
});

// ── PERSONALE / UTENTI ────────────────────────────────────────────
router.get('/personale', requireAuth, async (req, res) => {
  const r = await query(
    `SELECT u.id, u.username, u.ruolo, u.nome, u.cognome, u.attivo,
       m.id as mezzo_id, m.nome as mezzo_nome, m.targa, m.colore
     FROM utenti u LEFT JOIN utenti_mezzi um ON um.utente_id=u.id LEFT JOIN mezzi m ON m.id=um.mezzo_id
     WHERE u.azienda_id=$1 ORDER BY u.cognome, u.nome`, [aid(req)]
  );
  res.json(r.rows);
});

router.post('/utente', requireAuth, async (req, res) => {
  const d = req.body;
  if (!d.username||!d.password) return res.status(400).json({error:'Username e password obbligatori'});
  const pw = await hashPassword(d.password);
  try {
    const r = await query(
      `INSERT INTO utenti(azienda_id,username,password,ruolo,nome,cognome) VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,
      [aid(req),d.username,pw,d.ruolo||'centrale',d.nome||null,d.cognome||null]
    );
    auditLog(aid(req),req.session.userId,'SCRITTURA',`Utente creato: ${d.username} (${d.ruolo})`);
    res.json({ok:true, id: r.rows[0].id});
  } catch(e) {
    if (e.code === '23505') return res.status(400).json({error:'Username già esistente'});
    res.status(500).json({error:e.message});
  }
});

// ── MEZZI ─────────────────────────────────────────────────────────
router.get('/mezzi', requireAuth, async (req, res) => {
  const r = await query('SELECT * FROM mezzi WHERE azienda_id=$1 ORDER BY nome', [aid(req)]);
  res.json(r.rows);
});

router.post('/mezzo', requireAuth, async (req, res) => {
  const d = req.body;
  if (!d.nome) return res.status(400).json({error:'Nome mezzo obbligatorio'});
  const r = await query(
    `INSERT INTO mezzi(azienda_id,nome,targa,tipo,colore) VALUES($1,$2,$3,$4,$5) RETURNING *`,
    [aid(req), d.nome, d.targa||null, d.tipo||'ambulanza', d.colore||'#DC2626']
  );
  auditLog(aid(req),req.session.userId,'SCRITTURA',`Mezzo creato: ${d.nome} (${d.targa||'—'})`);
  res.json({ok:true, mezzo: r.rows[0]});
});

router.delete('/mezzo/:id', requireAuth, async (req, res) => {
  await query('UPDATE mezzi SET attivo=false WHERE id=$1 AND azienda_id=$2', [req.params.id, aid(req)]);
  res.json({ok:true});
});

// ── GPS ───────────────────────────────────────────────────────────
router.get('/gps/snapshot', requireAuth, async (req, res) => {
  const r = await query(
    `SELECT DISTINCT ON (pg.mezzo_id)
       pg.mezzo_id, pg.latitudine, pg.longitudine, pg.velocita, pg.rilevato_il,
       m.nome as mezzo_nome, m.colore, m.targa
     FROM posizioni_gps pg JOIN mezzi m ON m.id=pg.mezzo_id
     WHERE pg.azienda_id=$1 ORDER BY pg.mezzo_id, pg.rilevato_il DESC`,
    [aid(req)]
  );
  res.json(r.rows);
});

// ── MESSAGGI RADIO ────────────────────────────────────────────────
router.get('/radio', requireAuth, async (req, res) => {
  const r = await query(
    `SELECT mr.*, COALESCE(u.nome||' '||u.cognome, u.username) as mitt_nome,
       u.ruolo as mitt_ruolo, m.nome as mezzo_nome
     FROM messaggi_radio mr
     JOIN utenti u ON u.id=mr.mittente_id
     LEFT JOIN mezzi m ON m.id=mr.mezzo_id
     WHERE mr.azienda_id=$1 ORDER BY mr.inviato_il DESC LIMIT 100`, [aid(req)]
  );
  res.json(r.rows.reverse());
});

// ── AUDIT LOG ─────────────────────────────────────────────────────
router.get('/log', requireAuth, async (req, res) => {
  const r = await query(
    `SELECT al.*, COALESCE(u.nome||' '||u.cognome, u.username) as utente_nome
     FROM audit_log al LEFT JOIN utenti u ON u.id=al.utente_id
     WHERE al.azienda_id=$1 ORDER BY al.creato_il DESC LIMIT 100`, [aid(req)]
  );
  auditLog(aid(req),req.session.userId,'LETTURA','Audit log consultato');
  res.json(r.rows);
});

// ── HEALTH ────────────────────────────────────────────────────────
router.get('/health', (req, res) => res.json({ok:true, v:'2.0.0', ts: new Date()}));

module.exports = router;
