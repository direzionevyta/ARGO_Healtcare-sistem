// routes/centrale.js
const express = require('express');
const router  = express.Router();
const { requireAuth, requireRuolo } = require('../auth');

router.get('/', requireAuth, (req, res) => {
  const sess = req.session;
  res.send(centraleHTML(sess));
});

function centraleHTML(sess) {
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ARGO — Centrale Operativa · ${sess.aziendaNome}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.0.0/dist/tabler-icons.min.css">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#F0F4FA;--s:#FFF;--s2:#F7F9FC;--s3:#EEF2F8;
  --b:#E2E8F0;--b2:#CBD5E1;
  --t:#0F172A;--t2:#475569;--t3:#94A3B8;
  --blue:#1D6FD8;--bl:#EFF6FF;--bd:#1558B0;
  --green:#16A34A;--gl:#F0FDF4;
  --red:#DC2626;--rl:#FEF2F2;
  --amber:#D97706;--al:#FFFBEB;
  --teal:#0D9488;--tl:#F0FDFA;
  --purple:#7C3AED;--pl:#F5F3FF;
  --r:9px;--rl2:14px;
  font-family:'DM Sans',sans-serif;
}
body{display:flex;height:100vh;background:var(--bg);color:var(--t);font-size:13px;overflow:hidden}

/* SIDEBAR */
.sb{width:205px;flex-shrink:0;background:var(--s);border-right:1px solid var(--b);
  display:flex;flex-direction:column;height:100vh}
.sb-logo{padding:14px 16px;border-bottom:1px solid var(--b);display:flex;align-items:center;gap:10px}
.sb-badge{width:34px;height:34px;border-radius:9px;background:var(--blue);display:flex;
  align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;letter-spacing:.5px}
.sb-n{font-size:14px;font-weight:700;color:var(--t)}
.sb-s{font-size:10px;color:var(--t3)}
nav{flex:1;padding:8px;overflow-y:auto}
.nav-sec{font-size:9px;font-weight:700;color:var(--t3);letter-spacing:2px;padding:12px 8px 4px;text-transform:uppercase}
.ni{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;color:var(--t2);
  cursor:pointer;font-size:12px;font-weight:500;border:none;background:none;width:100%;
  text-align:left;font-family:'DM Sans',sans-serif;transition:.12s;margin-bottom:1px}
.ni:hover{background:var(--s2);color:var(--t)}
.ni.on{background:var(--bl);color:var(--blue);font-weight:600}
.ni i{font-size:16px;flex-shrink:0}
.nb{margin-left:auto;background:var(--rl);color:var(--red);font-size:9px;font-weight:700;
  padding:1px 6px;border-radius:20px;min-width:18px;text-align:center}
.nb.green{background:var(--gl);color:var(--green)}
.sb-foot{padding:12px;border-top:1px solid var(--b)}
.uf{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.uava{width:30px;height:30px;border-radius:50%;background:var(--bl);display:flex;
  align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--blue)}
.un{font-size:12px;font-weight:600;color:var(--t)}
.ur{font-size:10px;color:var(--t3)}

/* MAIN */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.topbar{background:var(--s);border-bottom:1px solid var(--b);padding:0 18px;height:46px;
  display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.pt{font-size:14px;font-weight:700;color:var(--t)}
.tr{display:flex;align-items:center;gap:10px}
.clk{font-size:11px;color:var(--t3);font-family:'DM Mono',monospace}
.ws-dot{font-size:11px;padding:3px 8px;border-radius:20px;background:var(--s2);color:var(--t3);font-weight:600}
.ws-dot.ok{background:var(--gl);color:var(--green)}
.ws-dot.err{background:var(--rl);color:var(--red)}
.content{flex:1;overflow-y:auto;padding:18px}
.sec{display:none}.sec.on{display:block}

/* CARDS & GRID */
.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px}
.sc{background:var(--s);border:1px solid var(--b);border-radius:var(--rl2);padding:14px}
.si{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:17px;margin-bottom:7px}
.sl{font-size:9px;font-weight:700;color:var(--t3);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:2px}
.sv{font-size:24px;font-weight:700;color:var(--t);line-height:1}
.ss{font-size:10px;color:var(--t3);margin-top:2px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.card{background:var(--s);border:1px solid var(--b);border-radius:var(--rl2);padding:14px}
.ct{font-size:12px;font-weight:600;color:var(--t);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between}
.badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600}
.b-blue{background:var(--bl);color:var(--blue)}.b-green{background:var(--gl);color:var(--green)}
.b-red{background:var(--rl);color:var(--red)}.b-amber{background:var(--al);color:var(--amber)}
.b-teal{background:var(--tl);color:var(--teal)}.b-purple{background:var(--pl);color:var(--purple)}
.b-gray{background:var(--s2);color:var(--t2)}
.sh{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;gap:10px}
.stit{font-size:15px;font-weight:700;color:var(--t)}
.btn{display:inline-flex;align-items:center;gap:5px;padding:6px 13px;border-radius:var(--r);
  font-size:12px;font-weight:600;cursor:pointer;border:1px solid var(--b2);background:var(--s);
  color:var(--t2);transition:.12s;font-family:'DM Sans',sans-serif}
.btn:hover{background:var(--s2);color:var(--t)}
.btn-p{background:var(--blue);color:#fff;border-color:transparent}.btn-p:hover{background:var(--bd)}
.btn-r{background:var(--rl);color:var(--red);border-color:transparent}
.btn-g{background:var(--gl);color:var(--green);border-color:transparent}
.btn-sm{padding:4px 10px;font-size:11px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{font-size:9px;font-weight:700;color:var(--t3);letter-spacing:1px;text-transform:uppercase;
  padding:7px 10px;border-bottom:1px solid var(--b);text-align:left}
td{padding:8px 10px;border-bottom:1px solid var(--b);color:var(--t2);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:var(--s2)}
.fg{margin-bottom:10px}
.fl{display:block;font-size:9px;font-weight:700;color:var(--t3);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px}
input,select,textarea{width:100%;border:1.5px solid var(--b);border-radius:var(--r);
  padding:8px 10px;font-size:12px;font-family:'DM Sans',sans-serif;color:var(--t);
  background:#fff;outline:none;transition:.15s}
input:focus,select:focus,textarea:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(29,111,216,.1)}
textarea{resize:vertical;min-height:56px}
.fr2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.alert{padding:9px 12px;border-radius:var(--r);font-size:12px;margin-bottom:10px;display:flex;align-items:center;gap:8px;font-weight:500}
.a-ok{background:var(--gl);color:var(--green)}.a-err{background:var(--rl);color:var(--red)}
.a-info{background:var(--bl);color:var(--blue)}.a-warn{background:var(--al);color:var(--amber)}
.divider{height:1px;background:var(--b);margin:12px 0}
.empty{text-align:center;padding:28px;color:var(--t3);font-size:12px}
.sbox{border:1px solid var(--b);border-radius:var(--rl2);overflow:hidden;margin-bottom:10px}
.sbox-h{padding:9px 14px;display:flex;align-items:center;gap:7px;border-bottom:1px solid var(--b);background:var(--s);font-size:12px;font-weight:600}
.sbox-b{padding:13px;background:var(--bg)}
.fbox{background:var(--al);border:1px solid #FDE68A;border-radius:var(--r);padding:10px;margin-bottom:10px}
.fbox-t{font-size:9px;font-weight:700;color:var(--amber);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:5px}
/* MAPPA */
#mappa{height:320px;border-radius:var(--r);overflow:hidden;border:1px solid var(--b)}
.gbar{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.gc{background:var(--s);border:1px solid var(--b);border-radius:var(--r);padding:5px 10px;font-size:11px;display:flex;align-items:center;gap:5px;font-weight:500}
.dot{width:7px;height:7px;border-radius:50%;animation:pulse 1.5s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
/* RADIO */
.radio-wrap{display:flex;flex-direction:column;height:calc(100vh - 140px);max-height:600px}
.radio-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:var(--s2);border-radius:var(--r) var(--r) 0 0;border:1px solid var(--b);border-bottom:none}
.msg-row{display:flex;gap:8px;align-items:flex-end}
.msg-row.mine{flex-direction:row-reverse}
.msg-ava{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
.msg-bubble{max-width:70%;padding:8px 12px;border-radius:12px;font-size:12px;line-height:1.4}
.msg-mine{background:var(--blue);color:#fff;border-radius:12px 12px 0 12px}
.msg-other{background:var(--s);border:1px solid var(--b);color:var(--t);border-radius:12px 12px 12px 0}
.msg-servizio{background:var(--al);border:1px solid #FDE68A;color:var(--amber)}
.msg-allerta{background:var(--rl);border:1px solid #FCA5A5;color:var(--red)}
.msg-sistema{background:var(--s3);border:1px solid var(--b);color:var(--t3);font-style:italic;font-size:11px}
.msg-meta{font-size:10px;color:var(--t3);margin-top:2px;display:flex;gap:6px;align-items:center}
.radio-input{display:flex;gap:8px;padding:10px;background:var(--s);border:1px solid var(--b);border-radius:0 0 var(--r) var(--r)}
.radio-input input{border-radius:20px;padding:8px 14px;font-size:13px}
.radio-type{width:auto;border-radius:20px;padding:7px 10px;font-size:11px;min-width:110px}
/* LOG */
.logcon{background:#0D1117;border-radius:var(--r);padding:12px;font-family:'DM Mono',monospace;
  font-size:11px;color:#C9D1D9;max-height:400px;overflow-y:auto;line-height:1.6}
/* SCROLL */
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(0,0,0,.12);border-radius:2px}
.spin{display:inline-block;animation:sp .7s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}
</style>
</head>
<body>

<!-- SIDEBAR -->
<aside class="sb">
  <div class="sb-logo">
    <div class="sb-badge">AR</div>
    <div><div class="sb-n">ARGO</div><div class="sb-s">Centrale · ${sess.aziendaNome}</div></div>
  </div>
  <nav>
    <div class="nav-sec">Operativo</div>
    <button class="ni on" onclick="go('dash',this)"><i class="ti ti-layout-dashboard"></i>Dashboard</button>
    <button class="ni" onclick="go('nuovo',this)"><i class="ti ti-phone-incoming"></i>Nuovo servizio<span class="nb">!</span></button>
    <button class="ni" onclick="go('servizi',this)"><i class="ti ti-ambulance"></i>Servizi</button>
    <button class="ni" onclick="go('radio',this)"><i class="ti ti-radio"></i>Radio scritta<span class="nb" id="radio-badge" style="display:none">0</span></button>
    <button class="ni" onclick="go('mappa',this)"><i class="ti ti-map-2"></i>Mappa GPS live</button>
    <div class="nav-sec">Gestione</div>
    <button class="ni" onclick="go('mezzi',this)"><i class="ti ti-truck"></i>Mezzi</button>
    <button class="ni" onclick="go('personale',this)"><i class="ti ti-users"></i>Personale & utenti</button>
    <button class="ni" onclick="go('pazienti',this)"><i class="ti ti-id"></i>Pazienti</button>
    <button class="ni" onclick="go('turni',this)"><i class="ti ti-calendar"></i>Turni</button>
    <div class="nav-sec">Sistema</div>
    <button class="ni" onclick="go('log',this)"><i class="ti ti-shield-lock"></i>Log GDPR</button>
  </nav>
  <div class="sb-foot">
    <div class="uf">
      <div class="uava">${sess.nome.substring(0,2).toUpperCase()}</div>
      <div><div class="un">${sess.nome}</div><div class="ur">Centrale operativa</div></div>
    </div>
    <a href="/logout" style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--t3);text-decoration:none;padding:4px 0">
      <i class="ti ti-logout" style="font-size:14px"></i> Esci
    </a>
  </div>
</aside>

<!-- MAIN -->
<div class="main">
  <div class="topbar">
    <div class="pt" id="ptitle">Dashboard</div>
    <div class="tr">
      <span id="ws-status" class="ws-dot">⬤ WS</span>
      <span class="clk" id="clk">--:--:--</span>
    </div>
  </div>

  <div class="content" id="content">

    <!-- DASHBOARD -->
    <div class="sec on" id="sec-dash">
      <div class="stats">
        <div class="sc"><div class="si" style="background:var(--bl);color:var(--blue)"><i class="ti ti-truck"></i></div><div class="sl">Mezzi online</div><div class="sv" id="st-m">—</div><div class="ss">Connessi ora</div></div>
        <div class="sc"><div class="si" style="background:var(--gl);color:var(--green)"><i class="ti ti-ambulance"></i></div><div class="sl">Servizi attivi</div><div class="sv" id="st-a">—</div><div class="ss">In corso</div></div>
        <div class="sc"><div class="si" style="background:var(--al);color:var(--amber)"><i class="ti ti-calendar"></i></div><div class="sl">Turni oggi</div><div class="sv" id="st-t">—</div><div class="ss">Attivi</div></div>
        <div class="sc"><div class="si" style="background:var(--tl);color:var(--teal)"><i class="ti ti-id"></i></div><div class="sl">Pazienti</div><div class="sv" id="st-p">—</div><div class="ss">In archivio</div></div>
        <div class="sc"><div class="si" style="background:var(--pl);color:var(--purple)"><i class="ti ti-users"></i></div><div class="sl">Personale</div><div class="sv" id="st-u">—</div><div class="ss">Utenti attivi</div></div>
      </div>
      <div class="g2">
        <div class="card"><div class="ct">Ultimi servizi</div><div id="dash-srv"><div class="empty">Caricamento...</div></div></div>
        <div class="card"><div class="ct">Mezzi GPS<span id="dash-online-badge" class="badge b-green">0 online</span></div><div id="dash-mezzi"><div class="empty">Caricamento...</div></div></div>
      </div>
    </div>

    <!-- NUOVO SERVIZIO -->
    <div class="sec" id="sec-nuovo">
      <div class="sh"><div><span class="badge b-red" style="padding:5px 12px;font-size:11px">🚨 NUOVO SERVIZIO</span><div style="font-size:11px;color:var(--t3);margin-top:3px">Presa in carico chiamata</div></div>
        <div id="sv-spin" style="display:none;align-items:center;gap:5px;font-size:11px;color:var(--blue);font-weight:600"><span class="spin">⟳</span>Salvataggio...</div>
      </div>
      <div id="sv-alert" style="display:none" class="alert"></div>

      <div class="sbox">
        <div class="sbox-h" style="color:var(--blue)"><i class="ti ti-user"></i>Paziente / Cliente</div>
        <div class="sbox-b">
          <div class="fr2" style="margin-bottom:8px">
            <div class="fg" style="margin:0"><label class="fl">Nome *</label><input id="sv-n" placeholder="Nome"></div>
            <div class="fg" style="margin:0"><label class="fl">Cognome *</label><input id="sv-c" placeholder="Cognome"></div>
          </div>
          <div class="fr2" style="margin-bottom:8px">
            <div class="fg" style="margin:0"><label class="fl">Codice Fiscale</label><input id="sv-cf" placeholder="RSSMRA..." style="text-transform:uppercase"></div>
            <div class="fg" style="margin:0"><label class="fl">Telefono</label><input id="sv-t" placeholder="+39 ..." type="tel"></div>
          </div>
          <div class="fbox">
            <div class="fbox-t"><i class="ti ti-receipt-tax"></i>Fatturazione</div>
            <div class="fr2" style="margin-bottom:8px">
              <div class="fg" style="margin:0"><label class="fl">Intestatario</label><input id="fat-i" placeholder="Nome / Ragione Sociale"></div>
              <div class="fg" style="margin:0"><label class="fl">CF / P.IVA *</label><input id="fat-p" placeholder="Codice Fiscale o P.IVA" style="text-transform:uppercase"></div>
            </div>
            <div class="fr2">
              <div class="fg" style="margin:0"><label class="fl">Destinazione fiscale *</label>
                <select id="fat-d" onchange="showSdi(this.value)">
                  <option value="tessera_sanitaria">Sistema Tessera Sanitaria (privati)</option>
                  <option value="fattura_sdi">Fatturazione SDI (B2B)</option>
                  <option value="esente">Esente / SSN</option>
                </select>
              </div>
              <div class="fg" style="margin:0"><label class="fl">Pagamento</label>
                <select id="fat-pg"><option>Contante</option><option>Carta</option><option>Bonifico</option><option>Assicurazione</option><option>SSN</option></select>
              </div>
            </div>
            <div id="sdi-extra" style="display:none;margin-top:8px">
              <div class="fr2">
                <div class="fg" style="margin:0"><label class="fl">Codice SDI</label><input id="fat-s" placeholder="XXXXXXX"></div>
                <div class="fg" style="margin:0"><label class="fl">PEC fatturazione</label><input id="fat-e" type="email" placeholder="pec@..."></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="sbox">
        <div class="sbox-h" style="color:var(--amber)"><i class="ti ti-map-pin"></i>Luoghi</div>
        <div class="sbox-b">
          <div style="border:1px solid var(--b);border-radius:var(--r);padding:10px;margin-bottom:8px">
            <div style="font-size:9px;font-weight:700;color:var(--blue);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">📍 RECUPERO *</div>
            <div class="fg"><input id="sv-rec" placeholder="Via, numero civico, città..."></div>
            <div class="fr2">
              <div class="fg" style="margin:0"><label class="fl">Piano / interno</label><input id="sv-rp" placeholder="es. 3° piano"></div>
              <div class="fg" style="margin:0"><label class="fl">Note accesso</label><input id="sv-rn" placeholder="Citofono..."></div>
            </div>
          </div>
          <div style="border:1px solid var(--b);border-radius:var(--r);padding:10px">
            <div style="font-size:9px;font-weight:700;color:var(--green);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">🏥 DESTINAZIONE *</div>
            <div class="fr2" style="margin-bottom:8px">
              <div class="fg" style="margin:0"><label class="fl">Struttura</label><input id="sv-ds" placeholder="Ospedale, clinica..."></div>
              <div class="fg" style="margin:0"><label class="fl">Indirizzo *</label><input id="sv-da" placeholder="Via, città..."></div>
            </div>
            <div class="fr2">
              <div class="fg" style="margin:0"><label class="fl">Reparto</label><input id="sv-dr" placeholder="Pronto Soccorso..."></div>
              <div class="fg" style="margin:0"><label class="fl">Tel. struttura</label><input id="sv-dt" placeholder="+39 ..." type="tel"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="sbox">
        <div class="sbox-h" style="color:var(--teal)"><i class="ti ti-ambulance"></i>Servizio & Assegnazione</div>
        <div class="sbox-b">
          <div class="fr2" style="margin-bottom:8px">
            <div class="fg" style="margin:0"><label class="fl">Tipo servizio *</label>
              <select id="sv-tipo"><option value="">Seleziona...</option>
                <option>Emergenza 118</option><option>Trasporto programmato</option>
                <option>Dimissione ospedaliera</option><option>Trasporto dialisi</option>
                <option>Trasporto oncologico</option><option>Trasporto disabili</option>
                <option>Servizio privato</option><option>Gara sportiva / evento</option>
              </select>
            </div>
            <div class="fg" style="margin:0"><label class="fl">Priorità</label>
              <select id="sv-prio"><option value="normale">🟡 Normale</option><option value="urgente">🔴 Urgente</option><option value="differibile">🟢 Differibile</option></select>
            </div>
          </div>
          <div class="fr2" style="margin-bottom:8px">
            <div class="fg" style="margin:0"><label class="fl">Mezzo assegnato</label>
              <select id="sv-mezzo"><option value="">— Nessun mezzo —</option></select>
            </div>
            <div class="fg" style="margin:0"><label class="fl">Stato</label>
              <select id="sv-stato"><option value="programmato">Programmato</option><option value="in_corso">In corso (attiva subito)</option></select>
            </div>
          </div>
          <div class="fg"><label class="fl">Condizioni paziente</label>
            <textarea id="sv-cond" placeholder="Sintomi, terapie in corso..."></textarea></div>
          <div class="fg" style="margin:0"><label class="fl">Note operative</label>
            <textarea id="sv-note" placeholder="Istruzioni per l'equipaggio..."></textarea></div>
        </div>
      </div>

      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
        <button class="btn" onclick="salvaServizio('programmato')"><i class="ti ti-calendar"></i>Salva programmato</button>
        <button class="btn btn-r" onclick="salvaServizio('in_corso')" style="padding:8px 18px">
          <i class="ti ti-ambulance"></i>ATTIVA SUBITO
        </button>
      </div>
    </div>

    <!-- SERVIZI -->
    <div class="sec" id="sec-servizi">
      <div class="sh"><div class="stit">Servizi</div>
        <button class="btn btn-p btn-sm" onclick="go('nuovo',document.querySelector('[onclick*=nuovo]'))"><i class="ti ti-plus"></i>Nuovo</button>
      </div>
      <div class="card">
        <table><thead><tr><th>Paziente</th><th>Tipo</th><th>Mezzo</th><th>Recupero</th><th>Destinazione</th><th>Fiscale</th><th>Stato</th><th></th></tr></thead>
          <tbody id="tb-srv"><tr><td colspan="8" class="empty">Caricamento...</td></tr></tbody>
        </table>
      </div>
    </div>

    <!-- RADIO SCRITTA -->
    <div class="sec" id="sec-radio">
      <div class="sh"><div class="stit">📻 Radio Scritta — Centrale ↔ Mezzi</div>
        <div style="display:flex;align-items:center;gap:8px">
          <span id="radio-online" class="badge b-green">0 mezzi online</span>
          <button class="btn btn-sm" onclick="inviaAllerta()"><i class="ti ti-alert-triangle"></i>Allerta</button>
        </div>
      </div>
      <div class="radio-wrap">
        <div class="radio-msgs" id="radio-msgs"></div>
        <div class="radio-input">
          <select class="radio-type" id="radio-tipo">
            <option value="messaggio">💬 Messaggio</option>
            <option value="servizio">🚑 Servizio</option>
            <option value="allerta">⚠ Allerta</option>
          </select>
          <select class="radio-type" id="radio-dest" style="min-width:140px">
            <option value="">📡 A tutti i mezzi</option>
          </select>
          <input id="radio-txt" placeholder="Scrivi un messaggio... (Invio per inviare)" onkeydown="if(event.key==='Enter'&&!event.shiftKey){inviaRadio();event.preventDefault()}">
          <button class="btn btn-p btn-sm" onclick="inviaRadio()"><i class="ti ti-send"></i></button>
        </div>
      </div>
    </div>

    <!-- MAPPA -->
    <div class="sec" id="sec-mappa">
      <div class="sh"><div class="stit">Mappa GPS Live</div>
        <span id="mappa-online" class="badge b-green">0 mezzi</span>
      </div>
      <div id="mappa"></div>
      <div class="gbar" id="gps-bar"></div>
    </div>

    <!-- MEZZI -->
    <div class="sec" id="sec-mezzi">
      <div class="sh"><div class="stit">Gestione Mezzi</div>
        <button class="btn btn-p btn-sm" onclick="showf('f-mezzo')"><i class="ti ti-plus"></i>Nuovo mezzo</button>
      </div>
      <div class="card">
        <table><thead><tr><th>Nome</th><th>Targa</th><th>Tipo</th><th>GPS</th><th>Stato</th><th></th></tr></thead>
          <tbody id="tb-mezzi"><tr><td colspan="6" class="empty">Caricamento...</td></tr></tbody>
        </table>
      </div>
      <div id="f-mezzo" style="display:none;margin-top:12px">
        <div class="card">
          <div class="ct">Nuovo mezzo</div>
          <div class="fr2" style="margin-bottom:8px">
            <div class="fg" style="margin:0"><label class="fl">Nome mezzo *</label><input id="mz-n" placeholder="es. Ambulanza 1 — MAN TGE"></div>
            <div class="fg" style="margin:0"><label class="fl">Targa</label><input id="mz-t" placeholder="BG 123 AA" style="text-transform:uppercase"></div>
          </div>
          <div class="fr2">
            <div class="fg" style="margin:0"><label class="fl">Tipo</label>
              <select id="mz-tipo"><option value="ambulanza">🚑 Ambulanza</option><option value="automedica">🚗 Automedica</option><option value="furgone">🚐 Furgone</option></select>
            </div>
            <div class="fg" style="margin:0"><label class="fl">Colore identificativo</label>
              <input id="mz-col" type="color" value="#DC2626" style="height:38px;cursor:pointer"></div>
          </div>
          <div id="mz-alert" style="display:none;margin-top:8px" class="alert"></div>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
            <button class="btn btn-sm" onclick="showf('f-mezzo')">Annulla</button>
            <button class="btn btn-p btn-sm" onclick="salvaMezzo()"><i class="ti ti-check"></i>Salva mezzo</button>
          </div>
        </div>
      </div>
    </div>

    <!-- PERSONALE -->
    <div class="sec" id="sec-personale">
      <div class="sh"><div class="stit">Personale & Utenti</div>
        <button class="btn btn-p btn-sm" onclick="showf('f-utente')"><i class="ti ti-plus"></i>Nuovo utente</button>
      </div>
      <div class="card">
        <table><thead><tr><th>Utente</th><th>Ruolo</th><th>Mezzo assoc.</th><th>Stato</th></tr></thead>
          <tbody id="tb-pers"><tr><td colspan="4" class="empty">Caricamento...</td></tr></tbody>
        </table>
      </div>
      <div id="f-utente" style="display:none;margin-top:12px">
        <div class="card">
          <div class="ct">Nuovo utente</div>
          <div class="fr2" style="margin-bottom:8px">
            <div class="fg" style="margin:0"><label class="fl">Nome</label><input id="ut-n" placeholder="Nome"></div>
            <div class="fg" style="margin:0"><label class="fl">Cognome</label><input id="ut-c" placeholder="Cognome"></div>
          </div>
          <div class="fr2" style="margin-bottom:8px">
            <div class="fg" style="margin:0"><label class="fl">Username *</label><input id="ut-u" placeholder="username.operatore"></div>
            <div class="fg" style="margin:0"><label class="fl">Password *</label><input id="ut-p" type="password" placeholder="••••••••"></div>
          </div>
          <div class="fg"><label class="fl">Ruolo</label>
            <select id="ut-r"><option value="centrale">🏥 Centrale operativa</option><option value="mezzo">🚑 Mezzo / Equipaggio</option><option value="admin">⚙ Amministratore</option></select>
          </div>
          <div id="ut-alert" style="display:none;margin-top:8px" class="alert"></div>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
            <button class="btn btn-sm" onclick="showf('f-utente')">Annulla</button>
            <button class="btn btn-p btn-sm" onclick="salvaUtente()"><i class="ti ti-check"></i>Crea utente</button>
          </div>
        </div>
      </div>
    </div>

    <!-- PAZIENTI -->
    <div class="sec" id="sec-pazienti">
      <div class="sh"><div class="stit">Pazienti</div>
        <button class="btn btn-p btn-sm" onclick="showf('f-paz')"><i class="ti ti-plus"></i>Nuovo</button>
      </div>
      <div class="card">
        <table><thead><tr><th>Paziente</th><th>CF</th><th>Nascita</th><th>Gruppo</th><th>Fiscale</th><th>Note</th><th></th></tr></thead>
          <tbody id="tb-paz"><tr><td colspan="7" class="empty">Caricamento...</td></tr></tbody>
        </table>
      </div>
      <div id="f-paz" style="display:none;margin-top:12px">
        <div class="card">
          <div class="ct">Nuovo paziente</div>
          <div id="pz-alert" style="display:none" class="alert"></div>
          <div class="fr2" style="margin-bottom:8px">
            <div class="fg" style="margin:0"><label class="fl">Nome *</label><input id="pz-n" placeholder="Nome"></div>
            <div class="fg" style="margin:0"><label class="fl">Cognome *</label><input id="pz-c" placeholder="Cognome"></div>
          </div>
          <div class="fr2" style="margin-bottom:8px">
            <div class="fg" style="margin:0"><label class="fl">Codice Fiscale</label><input id="pz-cf" style="text-transform:uppercase"></div>
            <div class="fg" style="margin:0"><label class="fl">Data nascita</label><input id="pz-dn" type="date"></div>
          </div>
          <div class="fr2" style="margin-bottom:8px">
            <div class="fg" style="margin:0"><label class="fl">Gruppo sanguigno</label>
              <select id="pz-gs"><option value="">—</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>0+</option><option>0-</option></select></div>
            <div class="fg" style="margin:0"><label class="fl">Telefono</label><input id="pz-tel" type="tel"></div>
          </div>
          <div class="fr2" style="margin-bottom:8px">
            <div class="fg" style="margin:0"><label class="fl">Dest. fiscale</label>
              <select id="pz-df"><option value="tessera_sanitaria">Tessera Sanitaria</option><option value="fattura_sdi">Fatturazione SDI</option><option value="esente">Esente / SSN</option></select></div>
            <div class="fg" style="margin:0"><label class="fl">Tipo</label>
              <select id="pz-tipo"><option value="privato">Privato</option><option value="azienda">Azienda</option></select></div>
          </div>
          <div class="fg"><label class="fl">Note mediche</label><textarea id="pz-note" placeholder="Allergie, patologie..."></textarea></div>
          <div style="display:flex;align-items:flex-start;gap:8px;padding:9px;background:var(--bl);border-radius:var(--r);margin-bottom:10px">
            <input type="checkbox" id="pz-gdpr" style="width:auto;margin-top:2px;flex-shrink:0">
            <label for="pz-gdpr" style="font-size:11px;color:var(--blue);cursor:pointer">
              <strong>Consenso GDPR:</strong> Il paziente ha prestato consenso al trattamento dei dati sanitari (Reg. UE 2016/679).
            </label>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn btn-sm" onclick="showf('f-paz')">Annulla</button>
            <button class="btn btn-p btn-sm" onclick="salvaPaziente()"><i class="ti ti-user-plus"></i>Salva</button>
          </div>
        </div>
      </div>
    </div>

    <!-- TURNI -->
    <div class="sec" id="sec-turni">
      <div class="sh"><div class="stit">Turni</div>
        <button class="btn btn-p btn-sm" onclick="showf('f-tur')"><i class="ti ti-plus"></i>Aggiungi</button>
      </div>
      <div class="card">
        <table><thead><tr><th>Operatore</th><th>Mezzo</th><th>Inizio</th><th>Fine</th><th>Stato</th><th></th></tr></thead>
          <tbody id="tb-tur"><tr><td colspan="6" class="empty">Caricamento...</td></tr></tbody>
        </table>
      </div>
      <div id="f-tur" style="display:none;margin-top:12px">
        <div class="card">
          <div class="ct">Nuovo turno</div>
          <div class="fr2" style="margin-bottom:8px">
            <div class="fg" style="margin:0"><label class="fl">Mezzo</label><select id="tr-m"><option value="">—</option></select></div>
            <div class="fg" style="margin:0"><label class="fl">Stato</label>
              <select id="tr-s"><option value="programmato">Programmato</option><option value="in_corso">In corso</option><option value="completato">Completato</option></select></div>
          </div>
          <div class="fr2">
            <div class="fg" style="margin:0"><label class="fl">Inizio *</label><input id="tr-i" type="datetime-local"></div>
            <div class="fg" style="margin:0"><label class="fl">Fine</label><input id="tr-f" type="datetime-local"></div>
          </div>
          <div id="tr-alert" style="display:none;margin-top:8px" class="alert"></div>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
            <button class="btn btn-sm" onclick="showf('f-tur')">Annulla</button>
            <button class="btn btn-p btn-sm" onclick="salvaTurno()">Salva</button>
          </div>
        </div>
      </div>
    </div>

    <!-- LOG GDPR -->
    <div class="sec" id="sec-log">
      <div class="sh"><div class="stit">Audit Log GDPR</div>
        <button class="btn btn-sm" onclick="caricaLog()"><i class="ti ti-refresh"></i>Aggiorna</button>
      </div>
      <div class="alert a-warn" style="margin-bottom:12px">
        <i class="ti ti-shield"></i>Log immutabile · ogni riga firmata SHA-256 · GDPR Art.30
      </div>
      <div class="card" style="padding:0"><div class="logcon" id="logcon">Caricamento...</div></div>
    </div>

  </div><!-- /content -->
</div><!-- /main -->

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
'use strict';
const SLUG = '${sess.aziendaSlug}';
const SID  = '${sess.id || ''}';
const MEID = null; // centrale non ha mezzo

// ── NAV ──────────────────────────────────────────────────────────
function go(id, btn) {
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('on'));
  document.getElementById('sec-' + id).classList.add('on');
  if (btn) btn.classList.add('on');
  document.getElementById('ptitle').textContent = btn ? btn.textContent.trim() : id;
  if (id === 'dash') aggDash();
  if (id === 'servizi') aggServizi();
  if (id === 'mappa') initMappa();
  if (id === 'mezzi') aggMezzi();
  if (id === 'personale') aggPersonale();
  if (id === 'pazienti') aggPazienti();
  if (id === 'turni') aggTurni();
  if (id === 'log') caricaLog();
  if (id === 'radio') scrollRadio();
}
function showf(id) {
  const f = document.getElementById(id);
  f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

// ── CLOCK ─────────────────────────────────────────────────────────
setInterval(() => {
  document.getElementById('clk').textContent = new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
}, 1000);

// ── API HELPER ────────────────────────────────────────────────────
async function api(m, p, b) {
  const o = {method:m, headers:{'Content-Type':'application/json'}};
  if (b) o.body = JSON.stringify(b);
  const r = await fetch('/api'+p, o);
  const d = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(d.error||'Errore '+r.status);
  return d;
}

// ── WEBSOCKET ─────────────────────────────────────────────────────
let ws, wsTimer;
const mapMarkers = {}; // mezzo_id → L.marker

function connectWS() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(proto + '://' + location.host + '/ws');

  ws.onopen = () => {
    setWS('ok');
    ws.send(JSON.stringify({type:'auth', sessionId: SID, aziendaSlug: SLUG}));
    wsTimer = setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({type:'ping'})), 25000);
  };

  ws.onmessage = (e) => {
    let msg; try { msg = JSON.parse(e.data); } catch { return; }
    switch (msg.type) {
      case 'auth_ok':
        console.log('WS autenticato come', msg.nome);
        break;
      case 'radio_history':
        document.getElementById('radio-msgs').innerHTML = '';
        msg.messaggi.forEach(m => appendRadioMsg(m, false));
        scrollRadio();
        break;
      case 'radio':
        appendRadioMsg(msg, true);
        // Badge se non sulla pagina radio
        if (!document.getElementById('sec-radio').classList.contains('on')) {
          const b = document.getElementById('radio-badge');
          b.style.display = 'flex';
          b.textContent = parseInt(b.textContent||'0') + 1;
        }
        break;
      case 'gps_snapshot':
        msg.posizioni.forEach(p => aggiornaMarker(p));
        aggDashMezzi();
        break;
      case 'gps_update':
        aggiornaMarker({mezzo_id:msg.mezzo_id,mezzo_nome:msg.mezzo_nome,latitudine:msg.lat,longitudine:msg.lng,velocita:msg.vel,colore:'#DC2626'});
        aggiornaMezziBar(msg);
        break;
      case 'nuovo_servizio':
        mostraNotificaServizio(msg.servizio);
        break;
      case 'pong': break;
    }
  };

  ws.onclose = () => { setWS('err'); clearInterval(wsTimer); setTimeout(connectWS, 4000); };
  ws.onerror = () => setWS('err');
}
connectWS();

function setWS(s) {
  const el = document.getElementById('ws-status');
  el.textContent = s === 'ok' ? '⬤ Live' : '⬤ Offline';
  el.className = 'ws-dot ' + s;
}

// ── MAPPA LEAFLET ─────────────────────────────────────────────────
let mappa = null;
function initMappa() {
  if (mappa) { mappa.invalidateSize(); return; }
  mappa = L.map('mappa').setView([45.5000, 9.7500], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:'© OpenStreetMap',maxZoom:18
  }).addTo(mappa);
  // Richiedi snapshot GPS corrente via API
  api('GET','/gps/snapshot').then(data => data.forEach(p => aggiornaMarker(p))).catch(()=>{});
}

function aggiornaMarker(p) {
  if (!mappa || !p.latitudine || !p.longitudine) return;
  const lat = parseFloat(p.latitudine), lng = parseFloat(p.longitudine);
  if (isNaN(lat) || isNaN(lng)) return;
  const col = p.colore || '#DC2626';
  const icon = L.divIcon({
    html: \`<div style="background:\${col};width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)">🚑</div>\`,
    className:'', iconAnchor:[17,17]
  });
  if (mapMarkers[p.mezzo_id]) {
    mapMarkers[p.mezzo_id].setLatLng([lat, lng]);
  } else {
    mapMarkers[p.mezzo_id] = L.marker([lat, lng], {icon})
      .addTo(mappa)
      .bindPopup(\`<b>\${p.mezzo_nome}</b><br>\${p.velocita||0} km/h\`);
  }
  // Aggiorna bar GPS
  const barEl = document.getElementById('gps-bar');
  let chip = document.getElementById('gps-chip-' + p.mezzo_id);
  if (!chip) {
    chip = document.createElement('div');
    chip.id = 'gps-chip-' + p.mezzo_id;
    chip.className = 'gc';
    barEl.appendChild(chip);
  }
  chip.innerHTML = \`<span class="dot" style="background:\${col}"></span><strong>\${p.mezzo_nome}</strong> · \${parseFloat(p.velocita||0).toFixed(0)} km/h\`;
}

function aggiornaMezziBar(msg) {
  const n = Object.keys(mapMarkers).length;
  const el = document.getElementById('mappa-online');
  if (el) el.textContent = n + ' mezz' + (n===1?'o':'i') + ' live';
}

// ── DASHBOARD ─────────────────────────────────────────────────────
async function aggDash() {
  try {
    const s = await api('GET', '/stats');
    document.getElementById('st-m').textContent = s.mezzi_online ?? '—';
    document.getElementById('st-a').textContent = s.n_attivi ?? '—';
    document.getElementById('st-t').textContent = s.n_turni ?? '—';
    document.getElementById('st-p').textContent = s.n_pazienti ?? '—';
    document.getElementById('st-u').textContent = s.n_personale ?? '—';
  } catch {}
  aggDashServizi();
  aggDashMezzi();
}

async function aggDashServizi() {
  try {
    const list = await api('GET', '/servizi');
    const ul = list.slice(0, 5);
    const bm = {programmato:'b-blue',in_corso:'b-green',completato:'b-gray',annullato:'b-red'};
    document.getElementById('dash-srv').innerHTML = ul.length
      ? ul.map(s => \`<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--b);font-size:12px">
          <div><div style="font-weight:600;color:var(--t)">\${s.paz_cognome} \${s.paz_nome}</div>
          <div style="font-size:11px;color:var(--t3)">\${s.tipo_servizio} · \${s.luogo_recupero?.substring(0,30)||'—'}</div></div>
          <span class="badge \${bm[s.stato]||'b-gray'}">\${s.stato}</span></div>\`).join('')
      : '<div class="empty">Nessun servizio</div>';
  } catch { document.getElementById('dash-srv').innerHTML = '<div class="empty">API offline</div>'; }
}

async function aggDashMezzi() {
  try {
    const mezzi = await api('GET', '/mezzi');
    const online = Object.keys(mapMarkers).map(Number);
    document.getElementById('dash-online-badge').textContent = online.length + ' online';
    document.getElementById('dash-mezzi').innerHTML = mezzi.length
      ? mezzi.map(m => {
          const isOn = online.includes(m.id);
          return \`<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--b)">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:10px;height:10px;border-radius:50%;background:\${m.colore||'#DC2626'}"></div>
              <div><div style="font-size:12px;font-weight:600;color:var(--t)">\${m.nome}</div>
              <div style="font-size:10px;color:var(--t3)">\${m.targa||'—'}</div></div>
            </div>
            <span class="badge \${isOn?'b-green':'b-gray'}">\${isOn?'● Online':'Offline'}</span></div>\`;
        }).join('')
      : '<div class="empty">Nessun mezzo creato</div>';
  } catch {}
}

// ── SERVIZI ───────────────────────────────────────────────────────
async function aggServizi() {
  try {
    const list = await api('GET', '/servizi');
    renderServizi(list);
  } catch { document.getElementById('tb-srv').innerHTML = '<tr><td colspan="8" class="empty">API offline</td></tr>'; }
}
function renderServizi(list) {
  const bm = {programmato:'b-blue',in_corso:'b-green',completato:'b-gray',annullato:'b-red'};
  const fm = {tessera_sanitaria:'b-teal',fattura_sdi:'b-amber',esente:'b-gray'};
  const fl = {tessera_sanitaria:'Tessera',fattura_sdi:'SDI',esente:'Esente'};
  document.getElementById('tb-srv').innerHTML = list.length
    ? list.map(s => \`<tr>
        <td><div style="font-weight:600;color:var(--t)">\${s.paz_cognome||''} \${s.paz_nome||''}</div>
            <div style="font-size:10px;color:var(--t3)">\${s.paz_cf||s.paz_tel||'—'}</div></td>
        <td>\${s.tipo_servizio||'—'}</td>
        <td>\${s.mezzo_nome||'—'}</td>
        <td style="font-size:11px">\${(s.luogo_recupero||'—').substring(0,30)}</td>
        <td style="font-size:11px">\${(s.luogo_destinazione||'—').substring(0,30)}</td>
        <td><span class="badge \${fm[s.fat_destinazione]||'b-gray'}">\${fl[s.fat_destinazione]||'—'}</span></td>
        <td><span class="badge \${bm[s.stato]||'b-gray'}">\${s.stato}</span></td>
        <td>\${s.stato!=='completato'?\`<button class="btn btn-g btn-sm" onclick="chiudiSrv(\${s.id},this)">✓</button>\`:''}</td>
      </tr>\`).join('')
    : '<tr><td colspan="8" class="empty">Nessun servizio</td></tr>';
}
async function chiudiSrv(id, btn) {
  await api('PATCH', \`/servizio/\${id}/stato\`, {stato:'completato'});
  btn.textContent='✓'; btn.disabled=true; aggServizi();
}

async function salvaServizio(stato) {
  const n = document.getElementById('sv-n').value.trim();
  const c = document.getElementById('sv-c').value.trim();
  const tipo = document.getElementById('sv-tipo').value;
  const rec = document.getElementById('sv-rec').value.trim();
  const dst = document.getElementById('sv-da').value.trim();
  if (!n||!c) { showAl('sv-alert','err','Nome e cognome obbligatori'); return; }
  if (!tipo) { showAl('sv-alert','err','Tipo servizio obbligatorio'); return; }
  if (!rec||!dst) { showAl('sv-alert','err','Luoghi obbligatori'); return; }
  const mezzoId = document.getElementById('sv-mezzo').value;
  const payload = {
    paz_nome:n, paz_cognome:c,
    paz_cf: document.getElementById('sv-cf').value.toUpperCase(),
    paz_tel: document.getElementById('sv-t').value,
    fat_intestatario: document.getElementById('fat-i').value,
    fat_cf_piva: document.getElementById('fat-p').value.toUpperCase(),
    fat_destinazione: document.getElementById('fat-d').value,
    fat_pagamento: document.getElementById('fat-pg').value,
    fat_sdi: document.getElementById('fat-s').value,
    fat_pec: document.getElementById('fat-e').value,
    luogo_recupero: rec, recupero_piano: document.getElementById('sv-rp').value,
    recupero_note: document.getElementById('sv-rn').value,
    dest_struttura: document.getElementById('sv-ds').value,
    luogo_destinazione: dst, dest_reparto: document.getElementById('sv-dr').value,
    dest_tel: document.getElementById('sv-dt').value,
    tipo_servizio: tipo, priorita: document.getElementById('sv-prio').value,
    mezzo_id: mezzoId || null,
    condizioni_paziente: document.getElementById('sv-cond').value,
    note_operative: document.getElementById('sv-note').value,
    stato: stato || document.getElementById('sv-stato').value
  };
  document.getElementById('sv-spin').style.display = 'flex';
  try {
    const r = await api('POST', '/servizio', payload);
    showAl('sv-alert', stato==='in_corso'?'ok':'info',
      \`✓ Servizio \${stato==='in_corso'?'attivato':'programmato'} — ID: \${r.servizio.id}\`);
  } catch(e) { showAl('sv-alert','err','Errore: '+e.message); }
  finally { document.getElementById('sv-spin').style.display = 'none'; }
}

// ── RADIO ─────────────────────────────────────────────────────────
function appendRadioMsg(m, animate) {
  const mine = m.da?.ruolo === 'centrale' || m.mitt_ruolo === 'centrale';
  const nome = m.da?.nome || m.mitt_nome || '?';
  const mezzo = m.da?.mezzo || m.mezzo_nome;
  const ts = new Date(m.ts||m.inviato_il).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
  const tipo = m.tipoMsg || m.tipo || 'messaggio';
  const bc = tipo==='allerta'?'msg-allerta':tipo==='servizio'?'msg-servizio':'';
  const col = mine ? '#1D6FD8' : '#DC2626';
  const ava = nome.substring(0,2).toUpperCase();

  const div = document.createElement('div');
  div.className = 'msg-row' + (mine?' mine':'');
  div.innerHTML = \`
    <div class="msg-ava" style="background:\${col}20;color:\${col}">\${ava}</div>
    <div>
      <div class="msg-bubble \${mine?'msg-mine':('msg-other '+bc)}">\${escHtml(m.testo)}</div>
      <div class="msg-meta">\${nome}\${mezzo?' · '+mezzo:''} · \${ts}</div>
    </div>\`;
  if (animate) div.style.animation = 'fadeIn .2s ease';
  document.getElementById('radio-msgs').appendChild(div);
  scrollRadio();
}

function scrollRadio() {
  const el = document.getElementById('radio-msgs');
  if (el) el.scrollTop = el.scrollHeight;
  // Azzera badge
  document.getElementById('radio-badge').style.display = 'none';
  document.getElementById('radio-badge').textContent = '0';
}

function inviaRadio() {
  const txt = document.getElementById('radio-txt').value.trim();
  if (!txt || !ws || ws.readyState !== 1) return;
  const tipo = document.getElementById('radio-tipo').value;
  const dest = document.getElementById('radio-dest').value;
  ws.send(JSON.stringify({type:'radio', testo:txt, tipoMsg:tipo, destinatario_id:dest||null}));
  document.getElementById('radio-txt').value = '';
}

function inviaAllerta() {
  const txt = prompt('Testo allerta da inviare a tutti i mezzi:');
  if (!txt) return;
  ws.send(JSON.stringify({type:'radio', testo:'⚠ ALLERTA: '+txt, tipoMsg:'allerta'}));
}

// ── MEZZI ─────────────────────────────────────────────────────────
async function aggMezzi() {
  try {
    const list = await api('GET', '/mezzi');
    const online = Object.keys(mapMarkers).map(Number);
    const bm = {ambulanza:'b-red',automedica:'b-blue',furgone:'b-amber'};
    document.getElementById('tb-mezzi').innerHTML = list.length
      ? list.map(m => \`<tr>
          <td><div style="display:flex;align-items:center;gap:8px">
            <div style="width:12px;height:12px;border-radius:50%;background:\${m.colore||'#DC2626'}"></div>
            <span style="font-weight:600;color:var(--t)">\${m.nome}</span></div></td>
          <td style="font-family:'DM Mono',monospace">\${m.targa||'—'}</td>
          <td><span class="badge \${bm[m.tipo]||'b-gray'}">\${m.tipo}</span></td>
          <td>\${online.includes(m.id)?'<span class="badge b-green">● Live</span>':'<span class="badge b-gray">Offline</span>'}</td>
          <td>\${m.attivo?'<span class="badge b-green">Attivo</span>':'<span class="badge b-red">Disattivo</span>'}</td>
          <td><button class="btn btn-r btn-sm" onclick="eliminaMezzo(\${m.id},this)"><i class="ti ti-trash"></i></button></td>
        </tr>\`).join('')
      : '<tr><td colspan="6" class="empty">Nessun mezzo. Crea il primo!</td></tr>';
    // Aggiorna select servizio e turni
    const opts = '<option value="">— Nessun mezzo —</option>' +
      list.map(m => \`<option value="\${m.id}">\${m.nome}</option>\`).join('');
    document.getElementById('sv-mezzo').innerHTML = opts;
    document.getElementById('tr-m').innerHTML = opts;
    // Aggiorna select destinatari radio
    const rOpts = '<option value="">📡 A tutti i mezzi</option>' +
      list.map(m => \`<option value="mezzo:\${m.id}">\${m.nome}</option>\`).join('');
    document.getElementById('radio-dest').innerHTML = rOpts;
  } catch {}
}

async function salvaMezzo() {
  const nome = document.getElementById('mz-n').value.trim();
  if (!nome) { showAl('mz-alert','err','Nome obbligatorio'); return; }
  try {
    await api('POST', '/mezzo', {
      nome, targa: document.getElementById('mz-t').value.toUpperCase(),
      tipo: document.getElementById('mz-tipo').value,
      colore: document.getElementById('mz-col').value
    });
    showAl('mz-alert','ok','✓ Mezzo creato!');
    aggMezzi();
    setTimeout(() => showf('f-mezzo'), 1500);
  } catch(e) { showAl('mz-alert','err',e.message); }
}

async function eliminaMezzo(id, btn) {
  if (!confirm('Disattivare questo mezzo?')) return;
  await api('DELETE', \`/mezzo/\${id}\`);
  btn.closest('tr').remove();
}

// ── PERSONALE ─────────────────────────────────────────────────────
async function aggPersonale() {
  try {
    const list = await api('GET', '/personale');
    const rm = {centrale:'b-blue',mezzo:'b-red',admin:'b-purple'};
    document.getElementById('tb-pers').innerHTML = list.length
      ? list.map(u => \`<tr>
          <td><div style="font-weight:600;color:var(--t)">\${u.cognome||''} \${u.nome||u.username}</div>
              <div style="font-size:10px;color:var(--t3)">@\${u.username}</div></td>
          <td><span class="badge \${rm[u.ruolo]||'b-gray'}">\${u.ruolo}</span></td>
          <td>\${u.mezzo_nome||'—'}</td>
          <td>\${u.attivo?'<span class="badge b-green">Attivo</span>':'<span class="badge b-red">Disattivo</span>'}</td>
        </tr>\`).join('')
      : '<tr><td colspan="4" class="empty">Nessun utente</td></tr>';
  } catch {}
}

async function salvaUtente() {
  const u = document.getElementById('ut-u').value.trim();
  const p = document.getElementById('ut-p').value;
  if (!u||!p) { showAl('ut-alert','err','Username e password obbligatori'); return; }
  try {
    await api('POST', '/utente', {
      username: u, password: p,
      nome: document.getElementById('ut-n').value,
      cognome: document.getElementById('ut-c').value,
      ruolo: document.getElementById('ut-r').value
    });
    showAl('ut-alert','ok','✓ Utente creato! Potrà ora fare login.');
    aggPersonale();
    setTimeout(() => showf('f-utente'), 1500);
  } catch(e) { showAl('ut-alert','err',e.message); }
}

// ── PAZIENTI ──────────────────────────────────────────────────────
async function aggPazienti() {
  try {
    const list = await api('GET', '/pazienti');
    const fm = {tessera_sanitaria:'b-teal',fattura_sdi:'b-amber',esente:'b-gray'};
    document.getElementById('tb-paz').innerHTML = list.length
      ? list.map(p => \`<tr>
          <td><div style="font-weight:600;color:var(--t)">\${p.cognome} \${p.nome}</div></td>
          <td style="font-family:'DM Mono',monospace;font-size:11px">\${p.codice_fiscale||'—'}</td>
          <td>\${p.data_nascita?new Date(p.data_nascita+'T12:00').toLocaleDateString('it-IT'):'—'}</td>
          <td>\${p.gruppo_sanguigno?\`<span class="badge b-red">\${p.gruppo_sanguigno}</span>\`:'—'}</td>
          <td><span class="badge \${fm[p.destinazione_fiscale]||'b-gray'}">\${p.destinazione_fiscale?.replace('_',' ')||'—'}</span></td>
          <td style="font-size:11px;color:var(--t3)">\${(p.note_mediche||'—').substring(0,40)}</td>
          <td><button class="btn btn-r btn-sm" onclick="eliminaPaz(\${p.id},this)"><i class="ti ti-trash"></i></button></td>
        </tr>\`).join('')
      : '<tr><td colspan="7" class="empty">Nessun paziente</td></tr>';
  } catch {}
}
async function eliminaPaz(id, btn) {
  if (!confirm('Eliminare?')) return;
  await api('DELETE', \`/paziente/\${id}\`);
  btn.closest('tr').remove();
}
async function salvaPaziente() {
  const n=document.getElementById('pz-n').value.trim(), c=document.getElementById('pz-c').value.trim();
  if (!n||!c) { showAl('pz-alert','err','Nome e cognome obbligatori'); return; }
  if (!document.getElementById('pz-gdpr').checked) { showAl('pz-alert','err','Consenso GDPR obbligatorio'); return; }
  try {
    await api('POST', '/paziente', {
      nome:n, cognome:c, codice_fiscale:document.getElementById('pz-cf').value.toUpperCase(),
      data_nascita:document.getElementById('pz-dn').value,
      gruppo_sanguigno:document.getElementById('pz-gs').value,
      telefono:document.getElementById('pz-tel').value,
      note_mediche:document.getElementById('pz-note').value,
      destinazione_fiscale:document.getElementById('pz-df').value,
      tipo_soggetto:document.getElementById('pz-tipo').value,
      consenso_gdpr:true
    });
    showAl('pz-alert','ok','✓ Paziente salvato');
    aggPazienti(); setTimeout(() => showf('f-paz'), 1500);
  } catch(e) { showAl('pz-alert','err',e.message); }
}

// ── TURNI ─────────────────────────────────────────────────────────
async function aggTurni() {
  try {
    const list = await api('GET', '/turni');
    const bm={programmato:'b-blue',in_corso:'b-green',completato:'b-gray'};
    document.getElementById('tb-tur').innerHTML = list.length
      ? list.map(t => \`<tr>
          <td>\${t.operatore_nome||'—'}</td>
          <td>\${t.mezzo_nome||'—'}</td>
          <td>\${t.inizio_turno?new Date(t.inizio_turno).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'—'}</td>
          <td>\${t.fine_turno?new Date(t.fine_turno).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}):'—'}</td>
          <td><span class="badge \${bm[t.stato]||'b-gray'}">\${t.stato}</span></td>
          <td>\${t.stato!=='completato'?\`<button class="btn btn-g btn-sm" onclick="chiudiTurno(\${t.id},this)">✓</button>\`:''}</td>
        </tr>\`).join('')
      : '<tr><td colspan="6" class="empty">Nessun turno</td></tr>';
    // Popola select mezzo per turni
    try {
      const m = await api('GET','/mezzi');
      document.getElementById('tr-m').innerHTML = '<option value="">— nessun mezzo —</option>' +
        m.map(x => \`<option value="\${x.id}">\${x.nome}</option>\`).join('');
    } catch {}
  } catch {}
}
async function chiudiTurno(id,btn) {
  await api('PATCH',\`/turno/\${id}/stato\`,{stato:'completato'});
  btn.textContent='✓'; btn.disabled=true; aggTurni();
}
async function salvaTurno() {
  const i = document.getElementById('tr-i').value;
  if (!i) { showAl('tr-alert','err','Inserisci orario inizio'); return; }
  try {
    await api('POST','/turno',{mezzo_id:document.getElementById('tr-m').value||null,
      inizio_turno:i, fine_turno:document.getElementById('tr-f').value||null,
      stato:document.getElementById('tr-s').value});
    showAl('tr-alert','ok','✓ Turno salvato'); aggTurni();
    setTimeout(()=>showf('f-tur'),1500);
  } catch(e) { showAl('tr-alert','err',e.message); }
}

// ── LOG ───────────────────────────────────────────────────────────
async function caricaLog() {
  const con = document.getElementById('logcon');
  try {
    const logs = await api('GET', '/log');
    const cl = {INFO:'#58a6ff',SCRITTURA:'#bc8cff',LETTURA:'#79c0ff',ACCESSO:'#3fb950',WARN:'#d29922',ERROR:'#f85149'};
    con.innerHTML = logs.length
      ? logs.map(l => \`<div style="margin-bottom:4px">
          <span style="color:#8b949e">\${l.creato_il?.replace('T',' ').substring(0,19)||'—'}</span>
          <span style="color:\${cl[l.tipo]||'#8b949e'};font-weight:700"> [\${l.tipo}]</span>
          <span style="color:#E6EDF3"> \${l.messaggio}</span>
          <span style="color:#3d444d;font-size:10px"> #\${l.hash||''}</span>
        </div>\`).join('')
      : '<div style="color:#8b949e">Nessun log.</div>';
    con.scrollTop = 0;
  } catch { con.innerHTML = '<div style="color:#f85149">API non raggiungibile</div>'; }
}

// ── NOTIFICA NUOVO SERVIZIO (push da mezzo) ───────────────────────
function mostraNotificaServizio(s) {
  const n = document.createElement('div');
  n.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999;background:#fff;border:1px solid var(--b);border-radius:12px;padding:14px 18px;box-shadow:0 8px 24px rgba(0,0,0,.15);max-width:320px;animation:fadeIn .3s ease';
  n.innerHTML = \`<div style="font-size:12px;font-weight:700;color:var(--red);margin-bottom:4px">🚨 Nuovo servizio dal mezzo</div>
    <div style="font-size:13px;font-weight:600;color:var(--t)">\${s.paz_cognome} \${s.paz_nome}</div>
    <div style="font-size:11px;color:var(--t3)">\${s.tipo_servizio} · \${s.luogo_recupero?.substring(0,40)||''}</div>
    <button onclick="this.parentElement.remove()" style="position:absolute;top:8px;right:10px;background:none;border:none;cursor:pointer;color:var(--t3);font-size:14px">✕</button>\`;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 10000);
}

// ── UTILITY ───────────────────────────────────────────────────────
function showAl(id, tipo, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'alert ' + ({ok:'a-ok',err:'a-err',info:'a-info',warn:'a-warn'}[tipo]||'a-info');
  el.innerHTML = msg; el.style.display = 'flex';
  if (tipo === 'ok') setTimeout(() => el.style.display = 'none', 4000);
}
function showSdi(v) { document.getElementById('sdi-extra').style.display = v==='fattura_sdi'?'block':'none'; }
function escHtml(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Primo caricamento
aggDash();
aggMezzi();
</script>
</body>
</html>`;
}

module.exports = router;
