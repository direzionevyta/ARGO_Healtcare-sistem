// routes/auth.js
const express  = require('express');
const router   = express.Router();
const { login } = require('../auth');
const { query } = require('../db');

// ── GET / → redirect
router.get('/', (req, res) => {
  if (req.session?.userId) {
    return res.redirect(req.session.userRuolo === 'mezzo' ? '/mezzo' : '/centrale');
  }
  res.redirect('/login');
});

// ── GET /login
router.get('/login', async (req, res) => {
  // Carica lista aziende attive (per il selettore)
  let aziende = [];
  try { aziende = (await query('SELECT slug, nome FROM aziende WHERE attiva=true ORDER BY nome')).rows; }
  catch(e) { console.error(e.message); }
  res.send(loginPage(aziende, req.query.err || ''));
});

// ── API: GET /api/mezzi-per-login?azienda=slug
// Restituisce i mezzi disponibili per il login come Mezzo
router.get('/api/mezzi-per-login', async (req, res) => {
  const { azienda } = req.query;
  if (!azienda) return res.json([]);
  try {
    const r = await query(
      `SELECT m.id, m.nome, m.targa, m.tipo, m.colore
       FROM mezzi m JOIN aziende a ON a.id = m.azienda_id
       WHERE a.slug = $1 AND m.attivo = true ORDER BY m.nome`,
      [azienda]
    );
    res.json(r.rows);
  } catch(e) { res.json([]); }
});

// ── POST /login
router.post('/login', async (req, res) => {
  const { azienda_slug, username, password, ruolo_scelto, mezzo_id } = req.body;
  try {
    const { utente, azienda, mezzo } = await login(
      azienda_slug, username, password, ruolo_scelto, mezzo_id ? parseInt(mezzo_id) : null,
      req.ip
    );
    req.session.userId     = utente.id;
    req.session.username   = utente.username;
    req.session.userRuolo  = ruolo_scelto;
    req.session.aziendaId  = azienda.id;
    req.session.aziendaSlug= azienda.slug;
    req.session.aziendaNome= azienda.nome;
    req.session.nome       = `${utente.nome||''} ${utente.cognome||''}`.trim() || utente.username;
    if (mezzo) {
      req.session.mezzoId   = mezzo.id;
      req.session.mezzoNome = mezzo.nome;
    }
    res.redirect(ruolo_scelto === 'mezzo' ? '/mezzo' : '/centrale');
  } catch(e) {
    let aziende = [];
    try { aziende = (await query('SELECT slug, nome FROM aziende WHERE attiva=true')).rows; } catch {}
    res.send(loginPage(aziende, e.message));
  }
});

// ── GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// ── HTML LOGIN PAGE ───────────────────────────────────────────────
function loginPage(aziende, errore = '') {
  const optsAziende = aziende.map(a =>
    `<option value="${a.slug}">${a.nome}</option>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ARGO — Accesso</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{min-height:100vh;background:linear-gradient(135deg,#0F172A 0%,#1E3A5F 60%,#0F2027 100%);
  display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif}
.card{background:#fff;border-radius:20px;padding:40px;width:420px;box-shadow:0 32px 80px rgba(0,0,0,.35)}
.logo{display:flex;align-items:center;gap:12px;margin-bottom:8px}
.lb{width:46px;height:46px;border-radius:13px;background:#1D6FD8;display:flex;align-items:center;
  justify-content:center;font-size:15px;font-weight:700;color:#fff;letter-spacing:1px}
.lt{font-size:22px;font-weight:700;color:#0F172A}
.ls{font-size:12px;color:#94A3B8;margin-bottom:28px}
.step{display:none}.step.on{display:block}
.fl{margin-bottom:14px}
.fl label{display:block;font-size:10px;font-weight:600;color:#94A3B8;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px}
.fi{width:100%;border:1.5px solid #E2E8F0;border-radius:9px;padding:10px 13px;font-size:14px;
  font-family:'DM Sans',sans-serif;color:#0F172A;outline:none;transition:.15s}
.fi:focus{border-color:#1D6FD8;box-shadow:0 0 0 3px rgba(29,111,216,.1)}
.role-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px}
.role-card{border:2px solid #E2E8F0;border-radius:12px;padding:16px 12px;text-align:center;
  cursor:pointer;transition:.15s;background:#fff}
.role-card:hover{border-color:#1D6FD8;background:#EFF6FF}
.role-card.sel{border-color:#1D6FD8;background:#EFF6FF}
.role-card .ri{font-size:28px;margin-bottom:6px}
.role-card .rn{font-size:13px;font-weight:600;color:#0F172A}
.role-card .rd{font-size:11px;color:#94A3B8;margin-top:2px}
.mezzo-grid{display:grid;gap:8px;max-height:200px;overflow-y:auto;margin-bottom:14px}
.mezzo-card{border:2px solid #E2E8F0;border-radius:10px;padding:12px 14px;
  cursor:pointer;transition:.15s;display:flex;align-items:center;gap:10px}
.mezzo-card:hover{border-color:#1D6FD8}
.mezzo-card.sel{border-color:#1D6FD8;background:#EFF6FF}
.mezzo-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.mezzo-name{font-size:13px;font-weight:600;color:#0F172A}
.mezzo-targa{font-size:11px;color:#94A3B8;font-family:'DM Mono',monospace}
.btn{width:100%;padding:12px;background:#1D6FD8;color:#fff;border:none;border-radius:9px;
  font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:.15s;margin-top:4px}
.btn:hover{background:#1558B0}
.btn-back{background:#F1F5F9;color:#475569;margin-top:8px}
.btn-back:hover{background:#E2E8F0}
.err{background:#FEF2F2;color:#DC2626;border-radius:9px;padding:10px 14px;font-size:12px;font-weight:500;margin-bottom:16px}
.loading{display:none;text-align:center;padding:16px;color:#94A3B8;font-size:13px}
</style>
</head>
<body>
<div class="card">
  <div class="logo">
    <div class="lb">AR</div>
    <div>
      <div class="lt">ARGO</div>
    </div>
  </div>
  <div class="ls">Sistema gestionale ambulanze · Accesso sicuro</div>

  ${errore ? `<div class="err">⚠ ${errore}</div>` : ''}

  <form method="POST" action="/login" id="form-login">
    <input type="hidden" name="ruolo_scelto" id="inp-ruolo" value="">
    <input type="hidden" name="mezzo_id" id="inp-mezzo" value="">

    <!-- STEP 1: Azienda + Credenziali -->
    <div class="step on" id="step1">
      <div class="fl">
        <label>Organizzazione</label>
        <select class="fi" name="azienda_slug" id="sel-az" required>
          ${optsAziende || '<option value="vyta">VYTA Hospital</option>'}
        </select>
      </div>
      <div class="fl">
        <label>Username</label>
        <input class="fi" type="text" name="username" placeholder="es. admin" required autocomplete="username">
      </div>
      <div class="fl">
        <label>Password</label>
        <input class="fi" type="password" name="password" placeholder="••••••••" required autocomplete="current-password">
      </div>
      <button type="button" class="btn" onclick="goStep2()">Continua →</button>
    </div>

    <!-- STEP 2: Scelta ruolo -->
    <div class="step" id="step2">
      <div style="font-size:13px;color:#475569;margin-bottom:16px">Seleziona come vuoi accedere:</div>
      <div class="role-grid">
        <div class="role-card" id="rc-centrale" onclick="selRuolo('centrale')">
          <div class="ri">🏥</div>
          <div class="rn">Centrale operativa</div>
          <div class="rd">Dashboard completa, gestione servizi, mappa globale</div>
        </div>
        <div class="role-card" id="rc-mezzo" onclick="selRuolo('mezzo')">
          <div class="ri">🚑</div>
          <div class="rn">Mezzo / Equipaggio</div>
          <div class="rd">Ricevi servizi, radio, invia GPS</div>
        </div>
      </div>
      <button type="button" class="btn btn-back" onclick="goStep(1)">← Indietro</button>
    </div>

    <!-- STEP 3: Selezione mezzo (solo se ruolo=mezzo) -->
    <div class="step" id="step3">
      <div style="font-size:13px;color:#475569;margin-bottom:12px">Seleziona il tuo mezzo:</div>
      <div class="loading" id="load-mezzi">Caricamento mezzi...</div>
      <div class="mezzo-grid" id="mezzi-grid"></div>
      <button type="submit" class="btn" id="btn-mezzo-ok" style="display:none">Accedi come equipaggio →</button>
      <button type="button" class="btn btn-back" onclick="goStep(2)">← Indietro</button>
    </div>

    <!-- STEP 3b: Login centrale diretta -->
    <div class="step" id="step3b">
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:40px;margin-bottom:10px">🏥</div>
        <div style="font-size:15px;font-weight:600;color:#0F172A">Accesso Centrale Operativa</div>
        <div style="font-size:12px;color:#94A3B8;margin-top:6px;margin-bottom:20px">Accederai alla dashboard completa</div>
      </div>
      <button type="submit" class="btn">Accedi alla centrale →</button>
      <button type="button" class="btn btn-back" onclick="goStep(2)">← Indietro</button>
    </div>

  </form>
  <p style="font-size:10px;color:#CBD5E1;text-align:center;margin-top:16px">
    🔒 Accesso riservato · Dati protetti GDPR Reg. UE 2016/679
  </p>
</div>

<script>
let ruoloSel = '';
let mezzoSel = null;
const az = () => document.getElementById('sel-az').value;

function goStep(n) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('on'));
  document.getElementById('step' + n).classList.add('on');
}

function goStep2() {
  const u = document.querySelector('[name=username]').value;
  const p = document.querySelector('[name=password]').value;
  if (!u || !p) { alert('Inserisci username e password'); return; }
  goStep(2);
}

function selRuolo(r) {
  ruoloSel = r;
  document.getElementById('inp-ruolo').value = r;
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('sel'));
  document.getElementById('rc-' + r).classList.add('sel');
  if (r === 'mezzo') { caricaMezzi(); goStep(3); }
  else { goStep('3b'); }
}

async function caricaMezzi() {
  const grid = document.getElementById('mezzi-grid');
  const load = document.getElementById('load-mezzi');
  load.style.display = 'block'; grid.innerHTML = '';
  document.getElementById('btn-mezzo-ok').style.display = 'none';
  try {
    const r = await fetch('/api/mezzi-per-login?azienda=' + az());
    const mezzi = await r.json();
    load.style.display = 'none';
    if (!mezzi.length) { grid.innerHTML = '<div style="color:#94A3B8;font-size:13px;padding:8px">Nessun mezzo disponibile. Creane uno dalla Centrale.</div>'; return; }
    grid.innerHTML = mezzi.map(m => \`
      <div class="mezzo-card" id="mc-\${m.id}" onclick="selMezzo(\${m.id}, '\${m.nome}')">
        <div class="mezzo-dot" style="background:\${m.colore||'#DC2626'}"></div>
        <div>
          <div class="mezzo-name">\${m.nome}</div>
          <div class="mezzo-targa">\${m.targa||'—'} · \${m.tipo}</div>
        </div>
      </div>\`).join('');
  } catch {
    load.style.display = 'none';
    grid.innerHTML = '<div style="color:#DC2626;font-size:12px">Errore caricamento mezzi</div>';
  }
}

function selMezzo(id, nome) {
  mezzoSel = id;
  document.getElementById('inp-mezzo').value = id;
  document.querySelectorAll('.mezzo-card').forEach(c => c.classList.remove('sel'));
  document.getElementById('mc-' + id)?.classList.add('sel');
  document.getElementById('btn-mezzo-ok').style.display = 'block';
  document.getElementById('btn-mezzo-ok').textContent = 'Accedi con ' + nome + ' →';
}
</script>
</body>
</html>`;
}

module.exports = router;
