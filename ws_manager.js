// ws_manager.js
// Gestisce tutte le connessioni WebSocket:
//   - Radio scritta (chat) tra Centrale e Mezzi
//   - Aggiornamenti GPS in tempo reale
//   - Notifiche push di nuovi servizi ai mezzi
//
// PROTOCOLLO MESSAGGI (JSON):
//   { type: 'auth',    token: '...', aziendaSlug: '...' }
//   { type: 'radio',   testo: '...', destinatario_id: null|id }
//   { type: 'gps',     lat: 0, lng: 0, vel: 0 }
//   { type: 'ping' }
//
// SERVER → CLIENT:
//   { type: 'radio',   da: {nome,ruolo,mezzo}, testo, ts }
//   { type: 'gps_update', mezzo_id, nome, lat, lng, vel, ts }
//   { type: 'nuovo_servizio', servizio: {...} }
//   { type: 'pong' }
//   { type: 'errore',  messaggio }

const { query, auditLog } = require('./db');

// Map: ws → { utente, aziendaId, mezzoId, ruolo }
const clients = new Map();

function setup(wss) {
  wss.on('connection', (ws, req) => {
    ws.isAlive = true;

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }

      switch (msg.type) {

        // ── AUTENTICAZIONE ──────────────────────────────────────
        case 'auth': {
          try {
            const { sessionId, aziendaSlug } = msg;
            // Verifica sessione dal DB
            const sr = await query(
              `SELECT s.sess FROM sessioni s WHERE s.sid = $1 AND s.expire > NOW()`,
              [sessionId]
            );
            if (!sr.rows.length) { ws.send(J({type:'errore',messaggio:'Sessione non valida'})); return; }

            const sess = JSON.parse(sr.rows[0].sess);
            if (!sess.userId) { ws.send(J({type:'errore',messaggio:'Non autenticato'})); return; }

            const ur = await query(
              `SELECT u.*, a.slug, a.id as aid FROM utenti u
               JOIN aziende a ON a.id = u.azienda_id
               WHERE u.id = $1 AND a.slug = $2 AND u.attivo = true`,
              [sess.userId, aziendaSlug]
            );
            if (!ur.rows.length) { ws.send(J({type:'errore',messaggio:'Utente non trovato'})); return; }

            const utente = ur.rows[0];
            // Recupera mezzo associato se ruolo=mezzo
            let mezzoId = null, mezzoNome = null;
            if (utente.ruolo === 'mezzo') {
              const mr = await query(
                `SELECT m.* FROM mezzi m
                 JOIN utenti_mezzi um ON um.mezzo_id = m.id
                 WHERE um.utente_id = $1`, [utente.id]
              );
              if (mr.rows.length) { mezzoId = mr.rows[0].id; mezzoNome = mr.rows[0].nome; }
            }

            clients.set(ws, {
              utente,
              aziendaId: utente.aid,
              mezzoId,
              mezzoNome,
              ruolo: utente.ruolo,
              nome: `${utente.nome || ''} ${utente.cognome || ''}`.trim() || utente.username
            });

            ws.send(J({ type: 'auth_ok', ruolo: utente.ruolo, nome: clients.get(ws).nome, mezzoNome }));

            // Invia ultimi 30 messaggi radio
            const msgs = await query(
              `SELECT mr.*, 
                COALESCE(u.nome||' '||u.cognome, u.username) as mitt_nome,
                u.ruolo as mitt_ruolo,
                m.nome as mezzo_nome
               FROM messaggi_radio mr
               JOIN utenti u ON u.id = mr.mittente_id
               LEFT JOIN mezzi m ON m.id = mr.mezzo_id
               WHERE mr.azienda_id = $1
               ORDER BY mr.inviato_il DESC LIMIT 30`,
              [utente.aid]
            );
            ws.send(J({ type: 'radio_history', messaggi: msgs.rows.reverse() }));

            // Invia posizioni GPS correnti di tutti i mezzi
            const gps = await query(
              `SELECT DISTINCT ON (pg.mezzo_id)
                 pg.mezzo_id, pg.latitudine, pg.longitudine, pg.velocita, pg.rilevato_il,
                 m.nome as mezzo_nome, m.colore
               FROM posizioni_gps pg
               JOIN mezzi m ON m.id = pg.mezzo_id
               WHERE pg.azienda_id = $1
               ORDER BY pg.mezzo_id, pg.rilevato_il DESC`,
              [utente.aid]
            );
            ws.send(J({ type: 'gps_snapshot', posizioni: gps.rows }));

          } catch(e) {
            console.error('WS auth error:', e.message);
            ws.send(J({type:'errore',messaggio:'Errore autenticazione'}));
          }
          break;
        }

        // ── RADIO SCRITTA ───────────────────────────────────────
        case 'radio': {
          const info = clients.get(ws);
          if (!info) return;
          const { testo, destinatario_id } = msg;
          if (!testo || !testo.trim()) return;

          // Salva nel DB
          let rid;
          try {
            const ins = await query(
              `INSERT INTO messaggi_radio
                 (azienda_id, mittente_id, destinatario_id, mezzo_id, testo, tipo)
               VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, inviato_il`,
              [info.aziendaId, info.utente.id, destinatario_id||null,
               info.mezzoId||null, testo.trim(), msg.tipoMsg||'messaggio']
            );
            rid = ins.rows[0];
          } catch(e) { return; }

          // Broadcast a tutti i client della stessa azienda
          const broadcast = J({
            type: 'radio',
            id: rid.id,
            da: {
              id: info.utente.id,
              nome: info.nome,
              ruolo: info.ruolo,
              mezzo: info.mezzoNome
            },
            destinatario_id: destinatario_id || null,
            testo: testo.trim(),
            tipoMsg: msg.tipoMsg || 'messaggio',
            ts: rid.inviato_il
          });

          for (const [clientWs, clientInfo] of clients.entries()) {
            if (clientInfo.aziendaId !== info.aziendaId) continue;
            // Se messaggio privato, invia solo al destinatario + mittente
            if (destinatario_id && clientInfo.utente.id !== destinatario_id &&
                clientInfo.utente.id !== info.utente.id) continue;
            if (clientWs.readyState === 1) clientWs.send(broadcast);
          }
          break;
        }

        // ── GPS ─────────────────────────────────────────────────
        case 'gps': {
          const info = clients.get(ws);
          if (!info || info.ruolo !== 'mezzo' || !info.mezzoId) return;
          const { lat, lng, vel } = msg;
          if (!lat || !lng) return;

          // Salva nel DB
          await query(
            `INSERT INTO posizioni_gps (azienda_id, mezzo_id, utente_id, latitudine, longitudine, velocita)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [info.aziendaId, info.mezzoId, info.utente.id, lat, lng, vel||0]
          ).catch(()=>{});

          // Broadcast aggiornamento GPS a tutti (solo centrale e admin)
          const upd = J({
            type: 'gps_update',
            mezzo_id: info.mezzoId,
            mezzo_nome: info.mezzoNome,
            lat, lng, vel: vel||0,
            operatore: info.nome,
            ts: new Date().toISOString()
          });
          for (const [cws, cinfo] of clients.entries()) {
            if (cinfo.aziendaId === info.aziendaId && cws.readyState === 1) {
              cws.send(upd);
            }
          }
          break;
        }

        case 'ping':
          ws.send(J({type:'pong'}));
          break;
      }
    });

    ws.on('close', () => { clients.delete(ws); });
    ws.on('error', () => { clients.delete(ws); });
  });

  // Heartbeat ogni 30s per rilevare connessioni morte
  setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) { clients.delete(ws); return ws.terminate(); }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
}

// Invia notifica push di nuovo servizio a un mezzo specifico (o broadcast)
function notificaServizio(aziendaId, servizio, mezzoId = null) {
  const msg = J({ type: 'nuovo_servizio', servizio });
  for (const [ws, info] of clients.entries()) {
    if (info.aziendaId !== aziendaId) continue;
    if (mezzoId && info.mezzoId !== mezzoId && info.ruolo !== 'centrale') continue;
    if (ws.readyState === 1) ws.send(msg);
  }
}

// Restituisce lista mezzi online (con ultima posizione)
function mezziOnline(aziendaId) {
  const result = [];
  for (const [, info] of clients.entries()) {
    if (info.aziendaId === aziendaId && info.ruolo === 'mezzo') {
      result.push({ id: info.mezzoId, nome: info.mezzoNome, operatore: info.nome });
    }
  }
  return result;
}

const J = (obj) => JSON.stringify(obj);

module.exports = { setup, notificaServizio, mezziOnline };
