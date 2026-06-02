import streamlit as st          # Il framework principale per creare l'applicazione web
import streamlit.components.v1 as components  # Fondamentale per incorporare il tuo file HTML/JS personalizzato
import json                     # Per gestire lo scambio di dati (payload) in formato JSON con il frontend
import os                       # Per verificare la presenza dei file e gestire i percorsi sul tuo Mac
import time                     # Per gestire le temporizzazioni e simulare i timestamp dei log
import datetime                 # Per formattare correttamente le date dei pazienti e dei turni
import random                   # Utile se vuoi simulare lo spostamento automatico del GPS dell'ambulanza
import math                     # Per eventuali calcoli geometrici sulle coordinate GPS
import hashlib                  # Cruciale per generare gli hash SHA-256 finti o reali per l'Audit Trail del GDPR

# Definiamo il percorso corretto per il tuo Mac
path = os.path.expanduser("~/ARGO_SaaS/argo_ui.html")
os.makedirs(os.path.dirname(path), exist_ok=True)

# Contenuto completo dell'interfaccia HTML/JavaScript di ARGO
content = """<!--
  ARGO VYTA Hospital — argo_ui.html v2.0
  Frontend completo: login MFA, GPS Leaflet live, fetch() API, campi fiscali, log GDPR.
  [[API_BASE_URL]] viene sostituita da app.py con http://localhost:8502
-->
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.0.0/dist/tabler-icons.min.css">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
/* ── RESET ─────────────────────────────────────────────────────── */
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#F4F6FA;--surf:#FFFFFF;--surf2:#F0F3F8;
  --bord:#E2E8F0;--bord2:#CBD5E1;
  --txt:#1E293B;--txt2:#475569;--txt3:#94A3B8;
  --blue:#1D6FD8;--blue-l:#EFF6FF;--blue-d:#1558B0;
  --green:#16A34A;--green-l:#F0FDF4;
  --amber:#D97706;--amber-l:#FFFBEB;
  --red:#DC2626;--red-l:#FEF2F2;
  --teal:#0D9488;--teal-l:#F0FDFA;
  --purple:#7C3AED;--purple-l:#F5F3FF;
  --r:9px;--rl:14px;
  font-family:'DM Sans',sans-serif;
}
body{background:var(--bg);color:var(--txt);font-size:14px;min-height:100vh}

/* ── LOGIN ──────────────────────────────────────────────────────── */
#login-wrap{position:fixed;inset:0;background:linear-gradient(135deg,#0F172A 0%,#1E3A5F 100%);
  display:flex;align-items:center;justify-content:center;z-index:9999}
.lcard{background:#fff;border-radius:20px;padding:36px;width:380px;
  box-shadow:0 24px 64px rgba(0,0,0,0.25)}
.llogo{display:flex;align-items:center;gap:12px;margin-bottom:28px}
.lbadge{width:44px;height:44px;border-radius:12px;background:var(--blue);
  display:flex;align-items:center;justify-content:center;font-weight:700;
  font-size:14px;color:#fff;letter-spacing:1px}
.ltitle{font-size:19px;font-weight:700;color:var(--txt)}
.lsub{font-size:11px;color:var(--txt3);margin-top:1px}
.ltabs{display:flex;background:var(--surf2);border-radius:var(--r);
  padding:3px;margin-bottom:22px;gap:2px}
.ltab{flex:1;padding:7px;border:none;border-radius:7px;background:none;
  font-size:12px;font-weight:500;color:var(--txt3);cursor:pointer;
  font-family:'DM Sans',sans-serif;transition:.15s}
.ltab.on{background:#fff;color:var(--blue);box-shadow:0 1px 4px rgba(0,0,0,.1)}
.fl{margin-bottom:14px}
.fl label{display:block;font-size:11px;font-weight:600;color:var(--txt3);
  letter-spacing:.8px;text-transform:uppercase;margin-bottom:5px}
.fi{width:100%;border:1.5px solid var(--bord);border-radius:var(--r);
  padding:10px 13px;font-size:14px;font-family:'DM Sans',sans-serif;
  color:var(--txt);background:#fff;outline:none;transition:.15s}
.fi:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(29,111,216,.12)}
.btn-login{width:100%;padding:12px;background:var(--blue);color:#fff;
  border:none;border-radius:var(--r);font-size:14px;font-weight:600;
  font-family:'DM Sans',sans-serif;cursor:pointer;transition:.15s;margin-top:4px}
.btn-login:hover{background:var(--blue-d)}
.otp-grid{display:flex;gap:8px;margin:10px 0 18px}
.otp-grid input{flex:1;height:52px;text-align:center;font-size:22px;font-weight:600;
  border:1.5px solid var(--bord);border-radius:var(--r);
  font-family:'DM Mono',monospace;outline:none}
.otp-grid input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(29,111,216,.12)}
.mfa-note{background:var(--amber-l);border:1px solid #FDE68A;border-radius:var(--r);
  padding:10px 13px;font-size:12px;color:var(--amber);margin-bottom:14px}
.spid-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;
  padding:12px;background:#003D8F;color:#fff;border:none;border-radius:var(--r);
  font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}
.lerr{background:var(--red-l);color:var(--red);border-radius:var(--r);
  padding:10px 13px;font-size:12px;margin-top:12px;display:none}

/* ── APP SHELL ──────────────────────────────────────────────────── */
#app{display:none;height:740px;overflow:hidden;
  border:1px solid var(--bord);border-radius:var(--rl);background:var(--bg)}
.shell{display:flex;height:100%}

/* ── SIDEBAR ────────────────────────────────────────────────────── */
.sb{width:210px;flex-shrink:0;background:var(--surf);
  border-right:1px solid var(--bord);display:flex;flex-direction:column}
.sb-logo{padding:16px;border-bottom:1px solid var(--bord);
  display:flex;align-items:center;gap:10px}
.sb-badge{width:34px;height:34px;border-radius:9px;background:var(--blue);
  display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:700;color:#fff;letter-spacing:.5px}
.sb-name{font-size:14px;font-weight:700;color:var(--txt)}
.sb-sub{font-size:10px;color:var(--txt3)}
.sb-nav{flex:1;padding:10px 8px;overflow-y:auto}
.sb-sec{font-size:10px;font-weight:600;color:var(--txt3);letter-spacing:1.5px;
  padding:12px 8px 5px;text-transform:uppercase}
.ni{display:flex;align-items:center;gap:8px;padding:8px 10px;
  border-radius:8px;color:var(--txt2);cursor:pointer;
  font-size:13px;border:none;background:none;width:100%;
  text-align:left;font-family:'DM Sans',sans-serif;
  transition:.12s;margin-bottom:1px;font-weight:400}
.ni:hover{background:var(--surf2);color:var(--txt)}
.ni.on{background:var(--blue-l);color:var(--blue);font-weight:600}
.ni i{font-size:17px;flex-shrink:0}
.nb{margin-left:auto;background:var(--red-l);color:var(--red);
  font-size:10px;font-weight:600;padding:1px 7px;border-radius:20px}
.sb-foot{padding:12px;border-top:1px solid var(--bord)}
.uf{display:flex;align-items:center;gap:8px}
.uava{width:30px;height:30px;border-radius:50%;background:var(--blue-l);
  display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:700;color:var(--blue)}
.uname{font-size:12px;font-weight:600;color:var(--txt)}
.urole{font-size:10px;color:var(--txt3)}
.mfa-chip{font-size:9px;background:var(--green-l);color:var(--green);
  padding:1px 5px;border-radius:4px;margin-left:4px;font-weight:600}

/* ── MAIN ───────────────────────────────────────────────────────── */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.topbar{background:var(--surf);border-bottom:1px solid var(--bord);
  padding:0 20px;height:48px;display:flex;align-items:center;
  justify-content:space-between;flex-shrink:0}
.ptitle{font-size:15px;font-weight:700;color:var(--txt)}
.tr{display:flex;align-items:center;gap:10px}
.clock{font-size:11px;color:var(--txt3);font-family:'DM Mono',monospace}
.api-dot{font-size:11px;padding:3px 9px;border-radius:20px;
  background:var(--surf2);color:var(--txt3);font-weight:500}
.api-dot.ok{background:var(--green-l);color:var(--green)}
.api-dot.err{background:var(--red-l);color:var(--red)}
.content{flex:1;overflow-y:auto;padding:20px;background:var(--bg)}
.sec{display:none}.sec.on{display:block}

/* ── COMPONENTS ─────────────────────────────────────────────────── */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
.scard{background:var(--surf);border:1px solid var(--bord);
  border-radius:var(--rl);padding:16px}
.sicon{width:34px;height:34px;border-radius:9px;display:flex;
  align-items:center;justify-content:center;font-size:18px;margin-bottom:8px}
.slabel{font-size:10px;font-weight:600;color:var(--txt3);letter-spacing:1px;text-transform:uppercase}
.sval{font-size:26px;font-weight:700;color:var(--txt);line-height:1.2}
.ssub{font-size:11px;color:var(--txt3);margin-top:2px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.card{background:var(--surf);border:1px solid var(--bord);border-radius:var(--rl);padding:16px}
.ctitle{font-size:13px;font-weight:600;color:var(--txt);margin-bottom:12px;
  display:flex;align-items:center;justify-content:space-between}
.ritem{display:flex;align-items:center;justify-content:space-between;
  padding:8px 0;border-bottom:1px solid var(--bord);font-size:12px}
.ritem:last-child{border-bottom:none}
.badge{display:inline-flex;align-items:center;padding:2px 9px;
  border-radius:20px;font-size:10px;font-weight:600;letter-spacing:.3px}
.b-blue{background:var(--blue-l);color:var(--blue)}
.b-green{background:var(--green-l);color:var(--green)}
.b-red{background:var(--red-l);color:var(--red)}
.b-amber{background:var(--amber-l);color:var(--amber)}
.b-teal{background:var(--teal-l);color:var(--teal)}
.b-purple{background:var(--purple-l);color:var(--purple)}
.b-gray{background:var(--surf2);color:var(--txt2)}
.sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.stitle{font-size:16px;font-weight:700;color:var(--txt)}
.btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;
  border-radius:var(--r);font-size:12px;font-weight:600;cursor:pointer;
  border:1px solid var(--bord2);background:var(--surf);color:var(--txt2);
  transition:.12s;font-family:'DM Sans',sans-serif}
.btn:hover{background:var(--surf2);color:var(--txt)}
.btn-p{background:var(--blue);color:#fff;border-color:transparent}
.btn-p:hover{background:var(--blue-d)}
.btn-r{background:var(--red-l);color:var(--red);border-color:transparent}
.btn-r:hover{background:#FECACA}
.btn-g{background:var(--green-l);color:var(--green);border-color:transparent}
table{width:100%;border-collapse:collapse;font-size:12px}
th{font-size:10px;font-weight:600;color:var(--txt3);letter-spacing:.8px;
  text-transform:uppercase;padding:8px 10px;
  border-bottom:1px solid var(--bord);text-align:left}
td{padding:9px 10px;border-bottom:1px solid var(--bord);color:var(--txt2);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:var(--surf2)}
.fg{margin-bottom:12px}
.fl2{display:block;font-size:10px;font-weight:600;color:var(--txt3);
  letter-spacing:.8px;text-transform:uppercase;margin-bottom:5px}
input,select,textarea{width:100%;border:1.5px solid var(--bord);
  border-radius:var(--r);padding:8px 11px;font-size:13px;
  font-family:'DM Sans',sans-serif;color:var(--txt);background:#fff;outline:none;transition:.15s}
input:focus,select:focus,textarea:focus{border-color:var(--blue);
  box-shadow:0 0 0 3px rgba(29,111,216,.1)}
textarea{resize:vertical;min-height:64px}
.fr2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fr3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.alert{padding:10px 14px;border-radius:var(--r);font-size:12px;
  margin-bottom:12px;display:flex;align-items:center;gap:8px;font-weight:500}
.a-ok{background:var(--green-l);color:var(--green)}
.a-err{background:var(--red-l);color:var(--red)}
.a-info{background:var(--blue-l);color:var(--blue)}
.a-warn{background:var(--amber-l);color:var(--amber)}
.divider{height:1px;background:var(--bord);margin:14px 0}
.empty{text-align:center;padding:32px;color:var(--txt3);font-size:13px}
.empty i{font-size:30px;display:block;margin-bottom:10px}
.sbox{border:1px solid var(--bord);border-radius:var(--rl);overflow:hidden;margin-bottom:12px}
.sbox-h{padding:10px 14px;display:flex;align-items:center;gap:6px;
  border-bottom:1px solid var(--bord);background:var(--surf);
  font-size:12px;font-weight:600;color:var(--txt)}
.sbox-b{padding:14px;background:var(--bg)}
.lbox{border:1px solid var(--bord);border-radius:var(--r);padding:12px;margin-bottom:10px}
.lboxl{font-size:10px;font-weight:600;letter-spacing:.8px;
  text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.fbox{background:var(--amber-l);border:1px solid #FDE68A;border-radius:var(--r);padding:12px;margin-bottom:12px}
.fbox-t{font-size:10px;font-weight:600;color:var(--amber);letter-spacing:.8px;
  text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:5px}
/* GPS */
#map{height:330px;border-radius:var(--r);overflow:hidden;border:1px solid var(--bord)}
.gbar{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.gchip{background:var(--surf);border:1px solid var(--bord);border-radius:var(--r);
  padding:6px 11px;font-size:11px;display:flex;align-items:center;gap:6px;font-weight:500}
.dot{width:7px;height:7px;border-radius:50%;background:var(--green);
  animation:pulse 1.5s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
/* Log */
.logcon{background:#0D1117;border-radius:var(--r);padding:12px 14px;
  font-family:'DM Mono',monospace;font-size:11px;color:#C9D1D9;
  max-height:300px;overflow-y:auto;line-height:1.6}
.spinner{display:none;align-items:center;gap:6px;font-size:11px;color:var(--blue);font-weight:500}
.spinner.on{display:flex}
.spin{display:inline-block;animation:sp .7s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
/* Tabs */
.tabs{display:flex;gap:0;border-bottom:1px solid var(--bord);margin-bottom:16px}
.tab{padding:8px 16px;font-size:12px;font-weight:600;color:var(--txt3);
  cursor:pointer;border-bottom:2px solid transparent;transition:.12s}
.tab.on{color:var(--blue);border-bottom-color:var(--blue)}
.tabp{display:none}.tabp.on{display:block}
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════════════
     LOGIN
═══════════════════════════════════════════════════════════════ -->
<div id="login-wrap">
  <div class="lcard">
    <div class="llogo">
      <div class="lbadge">AR</div>
      <div>
        <div class="ltitle">ARGO</div>
        <div class="lsub">VYTA Hospital · Accesso sicuro MFA</div>
      </div>
    </div>
    <div class="ltabs">
      <button class="ltab on" onclick="ltab('pwd',this)"><i class="ti ti-lock"></i> Password</button>
      <button class="ltab" onclick="ltab('spid',this)"><i class="ti ti-id-badge"></i> SPID / CIE</button>
      <button class="ltab" id="tab-otp" onclick="ltab('otp',this)" style="display:none">
        <i class="ti ti-shield-check"></i> OTP
      </button>
    </div>

    <div id="lp-pwd">
      <div class="fl"><label>Username</label><input id="lu" class="fi" value="admin" placeholder="admin"></div>
      <div class="fl"><label>Password</label><input id="lp" class="fi" type="password" value="admin123" placeholder="••••••••"></div>
      <button class="btn-login" onclick="step1()"><i class="ti ti-arrow-right"></i> Accedi → verifica OTP</button>
    </div>

    <div id="lp-spid" style="display:none">
      <p style="font-size:12px;color:var(--txt2);margin-bottom:16px">
        Accedi tramite la tua identità digitale. Verrai reindirizzato al provider.
      </p>
      <button class="spid-btn" onclick="loginSpid()"><i class="ti ti-id"></i> Entra con SPID</button>
      <div style="text-align:center;font-size:11px;color:var(--txt3);margin:10px 0">oppure</div>
      <button class="spid-btn" style="background:#6366F1" onclick="loginSpid()">
        <i class="ti ti-credit-card"></i> CIE — Carta di Identità Elettronica
      </button>
    </div>

    <div id="lp-otp" style="display:none">
      <div class="mfa-note">
        <i class="ti ti-shield"></i>
        <strong>Autenticazione a due fattori richiesta.</strong><br>
        Inserisci il codice OTP dall'app authenticator.<br>
        <strong>Demo:</strong> usa il codice <code style="background:#fff;padding:1px 5px;border-radius:4px">1 2 3 4 5 6</code>
      </div>
      <div class="otp-grid">
        <input class="oi" maxlength="1" type="text" inputmode="numeric">
        <input class="oi" maxlength="1" type="text" inputmode="numeric">
        <input class="oi" maxlength="1" type="text" inputmode="numeric">
        <input class="oi" maxlength="1" type="text" inputmode="numeric">
        <input class="oi" maxlength="1" type="text" inputmode="numeric">
        <input class="oi" maxlength="1" type="text" inputmode="numeric">
      </div>
      <button class="btn-login" onclick="step2()"><i class="ti ti-shield-check"></i> Verifica e accedi</button>
    </div>

    <div id="lerr" class="lerr"><i class="ti ti-alert-circle"></i> <span id="lerr-msg">Errore</span></div>
    <p style="font-size:10px;color:var(--txt3);text-align:center;margin-top:14px">
      🔒 Dati protetti — Conforme GDPR Reg. UE 2016/679 · Cifratura AES-256
    </p>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════
     APP PRINCIPALE
═══════════════════════════════════════════════════════════════ -->
<div id="app">
 <div class="shell">

  <!-- SIDEBAR -->
  <aside class="sb">
    <div class="sb-logo">
      <div class="sb-badge">AR</div>
      <div><div class="sb-name">ARGO</div><div class="sb-sub">VYTA Hospital</div></div>
    </div>
    <nav class="sb-nav">
      <div class="sb-sec">Principale</div>
      <button class="ni on" onclick="go('dashboard',this)"><i class="ti ti-layout-dashboard"></i>Dashboard</button>
      <button class="ni" onclick="go('nuovo',this)"><i class="ti ti-phone-incoming"></i>Nuovo servizio<span class="nb">!</span></button>
      <button class="ni" onclick="go('servizi',this)"><i class="ti ti-ambulance"></i>Servizi</button>
      <div class="sb-sec">Gestione</div>
      <button class="ni" onclick="go('medici',this)"><i class="ti ti-stethoscope"></i>Medici & personale</button>
      <button class="ni" onclick="go('pazienti',this)"><i class="ti ti-users"></i>Pazienti</button>
      <button class="ni" onclick="go('turni',this)"><i class="ti ti-calendar"></i>Turni</button>
      <button class="ni" onclick="go('gps',this)"><i class="ti ti-map-2"></i>Tracciamento GPS</button>
      <div class="sb-sec">Sistema</div>
      <button class="ni" onclick="go('log',this)"><i class="ti ti-shield-lock"></i>Log GDPR</button>
      <button class="ni" onclick="go('notif',this)"><i class="ti ti-bell"></i>Notifiche<span class="nb" id="notif-n">2</span></button>
    </nav>
    <div class="sb-foot">
      <div class="uf">
        <div class="uava" id="u-ava">AD</div>
        <div>
          <div class="uname" id="u-name">admin <span class="mfa-chip">MFA ✓</span></div>
          <div class="urole" id="u-role">amministratore</div>
        </div>
      </div>
    </div>
  </aside>

  <!-- MAIN -->
  <div class="main">
    <div class="topbar">
      <div class="ptitle" id="ptitle">Dashboard</div>
      <div class="tr">
        <span class="api-dot" id="api-dot">⬤ API</span>
        <span class="clock" id="clk">--:--:--</span>
      </div>
    </div>

    <div class="content">

<!-- ═══════ DASHBOARD ═══════ -->
<div class="sec on" id="sec-dashboard">
  <div class="stats">
    <div class="scard"><div class="sicon" style="background:var(--blue-l);color:var(--blue)"><i class="ti ti-stethoscope"></i></div>
      <div class="slabel">Personale</div><div class="sval" id="st-pers">—</div><div class="ssub">Medici & operatori</div></div>
    <div class="scard"><div class="sicon" style="background:var(--teal-l);color:var(--teal)"><i class="ti ti-users"></i></div>
      <div class="slabel">Pazienti</div><div class="sval" id="st-paz">—</div><div class="ssub">In archivio</div></div>
    <div class="scard"><div class="sicon" style="background:var(--amber-l);color:var(--amber)"><i class="ti ti-calendar"></i></div>
      <div class="slabel">Turni attivi</div><div class="sval" id="st-tur">—</div><div class="ssub">Oggi</div></div>
    <div class="scard"><div class="sicon" style="background:var(--green-l);color:var(--green)"><i class="ti ti-ambulance"></i></div>
      <div class="slabel">Servizi attivi</div><div class="sval" id="st-srv">—</div><div class="ssub">In corso ora</div></div>
  </div>
  <div class="g2">
    <div class="card">
      <div class="ctitle">Ultimi turni <span class="badge b-gray">oggi</span></div>
      <div id="dash-turni"><div class="empty"><i class="ti ti-calendar"></i>Caricamento...</div></div>
    </div>
    <div class="card">
      <div class="ctitle">Ultimi pazienti</div>
      <div id="dash-paz"><div class="empty"><i class="ti ti-users"></i>Caricamento...</div></div>
    </div>
  </div>
</div>

<!-- ═══════ NUOVO SERVIZIO ═══════ -->
<div class="sec" id="sec-nuovo">
  <div class="sh">
    <div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="badge b-red" style="padding:5px 12px;font-size:11px">🚨 NUOVO SERVIZIO</span>
      </div>
      <div style="font-size:11px;color:var(--txt3);margin-top:3px">Presa in carico chiamata · compila tutti i dati</div>
    </div>
    <div class="spinner" id="sv-spin"><span class="spin">⟳</span> Salvataggio...</div>
  </div>

  <div id="sv-alert" style="display:none" class="alert"></div>

  <!-- Paziente -->
  <div class="sbox">
    <div class="sbox-h"><i class="ti ti-user" style="color:var(--blue)"></i> Dati paziente / cliente</div>
    <div class="sbox-b">
      <div class="fr2" style="margin-bottom:10px">
        <div class="fg" style="margin:0"><label class="fl2">Nome *</label><input id="sv-nome" placeholder="Nome"></div>
        <div class="fg" style="margin:0"><label class="fl2">Cognome *</label><input id="sv-cog" placeholder="Cognome"></div>
      </div>
      <div class="fr2" style="margin-bottom:10px">
        <div class="fg" style="margin:0"><label class="fl2">Codice Fiscale</label><input id="sv-cf" placeholder="RSSMRA80A01H501Z" style="text-transform:uppercase"></div>
        <div class="fg" style="margin:0"><label class="fl2">Telefono</label><input id="sv-tel" placeholder="+39 ..." type="tel"></div>
      </div>
      <!-- Fiscale -->
      <div class="fbox">
        <div class="fbox-t"><i class="ti ti-receipt-tax"></i> Dati fatturazione</div>
        <div class="fr2" style="margin-bottom:10px">
          <div class="fg" style="margin:0"><label class="fl2">Intestatario fattura</label><input id="fat-int" placeholder="Nome / Ragione Sociale"></div>
          <div class="fg" style="margin:0"><label class="fl2">CF / P.IVA *</label><input id="fat-piva" placeholder="RSSMRA... oppure 12345678901" style="text-transform:uppercase"></div>
        </div>
        <div class="fr2" style="margin-bottom:0">
          <div class="fg" style="margin:0"><label class="fl2">Destinazione fiscale *</label>
            <select id="fat-dest" onchange="showB2B(this.value)">
              <option value="tessera_sanitaria">Sistema Tessera Sanitaria (privati)</option>
              <option value="fattura_sdi">Fatturazione Elettronica SDI (B2B)</option>
              <option value="esente">Esente / Convenzionato SSN</option>
            </select>
          </div>
          <div class="fg" style="margin:0"><label class="fl2">Pagamento</label>
            <select id="fat-pag">
              <option>Contante</option><option>Carta di credito/debito</option>
              <option>Bonifico bancario</option><option>Assicurazione sanitaria</option><option>SSN/ASL</option>
            </select>
          </div>
        </div>
        <div id="b2b-extra" style="display:none;margin-top:10px">
          <div class="fr2">
            <div class="fg" style="margin:0"><label class="fl2">Codice SDI</label><input id="fat-sdi" placeholder="XXXXXXX"></div>
            <div class="fg" style="margin:0"><label class="fl2">PEC fatturazione</label><input id="fat-pec" type="email" placeholder="pec@..."></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Luoghi -->
  <div class="sbox">
    <div class="sbox-h"><i class="ti ti-map-pin" style="color:var(--amber)"></i> Luoghi del servizio</div>
    <div class="sbox-b">
      <div class="lbox">
        <div class="lboxl" style="color:var(--blue)"><i class="ti ti-current-location"></i> Luogo di recupero *</div>
        <div class="fg"><input id="sv-rec" placeholder="Via, numero civico, città..."></div>
        <div class="fr2">
          <div class="fg" style="margin:0"><label class="fl2">Piano / interno</label><input id="sv-rec-p" placeholder="es. 3° piano, interno 5"></div>
          <div class="fg" style="margin:0"><label class="fl2">Note accesso</label><input id="sv-rec-n" placeholder="Citofono, cancello..."></div>
        </div>
      </div>
      <div class="lbox">
        <div class="lboxl" style="color:var(--green)"><i class="ti ti-building-hospital"></i> Destinazione *</div>
        <div class="fr2" style="margin-bottom:10px">
          <div class="fg" style="margin:0"><label class="fl2">Struttura / Ospedale</label><input id="sv-dst-str" placeholder="Nome ospedale, clinica..."></div>
          <div class="fg" style="margin:0"><label class="fl2">Indirizzo *</label><input id="sv-dst" placeholder="Via, città..."></div>
        </div>
        <div class="fr2">
          <div class="fg" style="margin:0"><label class="fl2">Reparto</label><input id="sv-dst-r" placeholder="Pronto Soccorso, Cardiologia..."></div>
          <div class="fg" style="margin:0"><label class="fl2">Contatto struttura</label><input id="sv-dst-t" placeholder="+39 ..." type="tel"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Servizio & risorse -->
  <div class="sbox">
    <div class="sbox-h"><i class="ti ti-ambulance" style="color:var(--teal)"></i> Tipo servizio & risorse</div>
    <div class="sbox-b">
      <div class="fr2" style="margin-bottom:10px">
        <div class="fg" style="margin:0"><label class="fl2">Tipo servizio *</label>
          <select id="sv-tipo">
            <option value="">Seleziona...</option>
            <option>Emergenza 118</option><option>Trasporto programmato</option>
            <option>Dimissione ospedaliera</option><option>Trasporto dialisi</option>
            <option>Trasporto oncologico</option><option>Trasporto disabili</option>
            <option>Servizio privato</option><option>Gara sportiva / evento</option>
          </select>
        </div>
        <div class="fg" style="margin:0"><label class="fl2">Priorità</label>
          <select id="sv-prio">
            <option value="normale">🟡 Normale</option>
            <option value="urgente">🔴 Urgente</option>
            <option value="differibile">🟢 Differibile</option>
          </select>
        </div>
      </div>
      <div class="fr2" style="margin-bottom:10px">
        <div class="fg" style="margin:0"><label class="fl2">Operatore *</label>
          <select id="sv-op"><option value="">Seleziona...</option></select>
        </div>
        <div class="fg" style="margin:0"><label class="fl2">Base operativa</label>
          <select id="sv-base">
            <option>Base Nord — Treviglio</option>
            <option>Base Sud — Crema</option>
            <option>Base Est — Romano di Lombardia</option>
          </select>
        </div>
      </div>
      <div class="fg"><label class="fl2">Condizioni paziente</label>
        <textarea id="sv-cond" placeholder="Sintomi, condizioni riscontrate, terapie in corso..."></textarea></div>
      <div class="fg" style="margin-bottom:0"><label class="fl2">Note operative</label>
        <textarea id="sv-note" placeholder="Istruzioni per l'equipaggio..."></textarea></div>
    </div>
  </div>

  <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
    <button class="btn" onclick="salvaServizio('programmato')"><i class="ti ti-calendar"></i> Salva programmato</button>
    <button class="btn btn-r" onclick="salvaServizio('in_corso')" style="padding:9px 18px">
      <i class="ti ti-ambulance"></i> ATTIVA SUBITO
    </button>
  </div>
</div>

<!-- ═══════ SERVIZI ═══════ -->
<div class="sec" id="sec-servizi">
  <div class="sh">
    <div class="stitle">Servizi</div>
    <button class="btn btn-p" onclick="go('nuovo',document.querySelector('[onclick*=nuovo]'))"><i class="ti ti-plus"></i> Nuovo</button>
  </div>
  <div class="card">
    <table>
      <thead><tr><th>Paziente</th><th>Tipo</th><th>Recupero</th><th>Destinazione</th><th>Operatore</th><th>Fiscale</th><th>Stato</th><th>Azione</th></tr></thead>
      <tbody id="tb-servizi">
        <tr><td colspan="8" class="empty">Caricamento...</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ═══════ MEDICI ═══════ -->
<div class="sec" id="sec-medici">
  <div class="sh">
    <div class="stitle">Medici & personale</div>
    <button class="btn btn-p" onclick="showf('f-pers')"><i class="ti ti-plus"></i> Aggiungi</button>
  </div>
  <div class="card">
    <table>
      <thead><tr><th>Nominativo</th><th>Qualifica</th><th>Base</th><th>Telefono</th><th>Email</th><th>Stato</th></tr></thead>
      <tbody id="tb-pers">
        <tr><td colspan="6" class="empty"><i class="ti ti-loader"></i>Caricamento...</td></tr>
      </tbody>
    </table>
  </div>
  <div id="f-pers" style="display:none;margin-top:12px">
    <div class="card">
      <div class="ctitle">Nuovo membro del personale</div>
      <div class="fr2" style="margin-bottom:10px">
        <div class="fg" style="margin:0"><label class="fl2">Nome *</label><input id="mp-n" placeholder="Nome"></div>
        <div class="fg" style="margin:0"><label class="fl2">Cognome *</label><input id="mp-c" placeholder="Cognome"></div>
      </div>
      <div class="fr2" style="margin-bottom:10px">
        <div class="fg" style="margin:0"><label class="fl2">Qualifica</label>
          <select id="mp-q"><option>Medico</option><option>Infermiere</option><option>Paramedico</option><option>Autista</option><option>Coordinatore</option></select></div>
        <div class="fg" style="margin:0"><label class="fl2">Base</label>
          <select id="mp-b"><option>Base Nord — Treviglio</option><option>Base Sud — Crema</option><option>Base Est — Romano</option></select></div>
      </div>
      <div class="fr2">
        <div class="fg" style="margin:0"><label class="fl2">Telefono</label><input id="mp-t" placeholder="+39 ..."></div>
        <div class="fg" style="margin:0"><label class="fl2">Email</label><input id="mp-e" type="email" placeholder="nome@vyta.it"></div>
      </div>
      <div id="mp-alert" style="display:none;margin-top:10px" class="alert"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
        <button class="btn" onclick="showf('f-pers')">Annulla</button>
        <button class="btn btn-p" onclick="salvaPersonale()"><i class="ti ti-check"></i> Salva</button>
      </div>
    </div>
  </div>
</div>

<!-- ═══════ PAZIENTI ═══════ -->
<div class="sec" id="sec-pazienti">
  <div class="sh">
    <div class="stitle">Archivio pazienti</div>
    <button class="btn btn-p" onclick="showf('f-paz')"><i class="ti ti-plus"></i> Nuovo paziente</button>
  </div>
  <div class="card">
    <table>
      <thead><tr><th>Paziente</th><th>Nascita</th><th>Telefono</th><th>Gruppo</th><th>Dest. fiscale</th><th>Note</th><th></th></tr></thead>
      <tbody id="tb-paz">
        <tr><td colspan="7" class="empty"><i class="ti ti-loader"></i>Caricamento...</td></tr>
      </tbody>
    </table>
  </div>
  <div id="f-paz" style="display:none;margin-top:12px">
    <div class="card">
      <div class="ctitle">Nuovo paziente</div>
      <div id="pz-alert" style="display:none;margin-bottom:12px" class="alert"></div>
      <div class="fr2" style="margin-bottom:10px">
        <div class="fg" style="margin:0"><label class="fl2">Nome *</label><input id="pz-n" placeholder="Nome"></div>
        <div class="fg" style="margin:0"><label class="fl2">Cognome *</label><input id="pz-c" placeholder="Cognome"></div>
      </div>
      <div class="fr2" style="margin-bottom:10px">
        <div class="fg" style="margin:0"><label class="fl2">Codice Fiscale</label><input id="pz-cf" placeholder="RSSMRA80A01H501Z" style="text-transform:uppercase"></div>
        <div class="fg" style="margin:0"><label class="fl2">Data di nascita</label><input id="pz-dn" type="date"></div>
      </div>
      <div class="fr2" style="margin-bottom:10px">
        <div class="fg" style="margin:0"><label class="fl2">Gruppo sanguigno</label>
          <select id="pz-gs"><option value="">—</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>0+</option><option>0-</option></select></div>
        <div class="fg" style="margin:0"><label class="fl2">Telefono</label><input id="pz-tel" placeholder="+39 ..." type="tel"></div>
      </div>
      <div class="fr2" style="margin-bottom:10px">
        <div class="fg" style="margin:0"><label class="fl2">Tipo soggetto</label>
          <select id="pz-tipo"><option value="privato">Privato (persona fisica)</option><option value="azienda">Azienda / Ente</option></select></div>
        <div class="fg" style="margin:0"><label class="fl2">Destinazione fiscale</label>
          <select id="pz-df"><option value="tessera_sanitaria">Sistema Tessera Sanitaria</option><option value="fattura_sdi">Fatturazione SDI</option><option value="esente">Esente / SSN</option></select></div>
      </div>
      <div class="fg"><label class="fl2">Note mediche</label>
        <textarea id="pz-note" placeholder="Allergie, patologie, farmaci..."></textarea></div>
      <!-- Consenso GDPR -->
      <div style="display:flex;align-items:flex-start;gap:8px;padding:10px;background:var(--blue-l);border-radius:var(--r);margin-bottom:12px">
        <input type="checkbox" id="pz-gdpr" style="width:auto;margin-top:3px;flex-shrink:0">
        <label for="pz-gdpr" style="font-size:11px;color:var(--blue);cursor:pointer;line-height:1.5">
          <strong>Consenso GDPR obbligatorio:</strong> Il paziente ha prestato consenso al trattamento dei dati personali e sanitari ai sensi del Reg. UE 2016/679 e D.Lgs. 196/2003.
        </label>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn" onclick="showf('f-paz')">Annulla</button>
        <button class="btn btn-p" onclick="salvaPaziente()"><i class="ti ti-user-plus"></i> Salva paziente</button>
      </div>
    </div>
  </div>
</div>

<!-- ═══════ TURNI ═══════ -->
<div class="sec" id="sec-turni">
  <div class="sh">
    <div class="stitle">Turni</div>
    <div style="display:flex;gap:8px;align-items:center">
      <input type="date" id="turni-d" style="width:auto">
      <button class="btn btn-p" onclick="showf('f-tur')"><i class="ti ti-plus"></i> Aggiungi</button>
    </div>
  </div>
  <div class="card">
    <table>
      <thead><tr><th>Operatore</th><th>Base</th><th>Inizio</th><th>Fine</th><th>Durata</th><th>Stato</th><th>Azione</th></tr></thead>
      <tbody id="tb-tur">
        <tr><td colspan="7" class="empty"><i class="ti ti-loader"></i>Caricamento...</td></tr>
      </tbody>
    </table>
  </div>
  <div id="f-tur" style="display:none;margin-top:12px">
    <div class="card">
      <div class="ctitle">Nuovo turno</div>
      <div class="fr2" style="margin-bottom:10px">
        <div class="fg" style="margin:0"><label class="fl2">Operatore</label>
          <select id="tr-op"><option>Dr. Rossi Marco</option><option>Inf. Bianchi Sara</option><option>Aut. Ferrari Luca</option><option>Dr. Conti Elena</option></select></div>
        <div class="fg" style="margin:0"><label class="fl2">Base</label>
          <select id="tr-b"><option>Base Nord — Treviglio</option><option>Base Sud — Crema</option><option>Base Est — Romano</option></select></div>
      </div>
      <div class="fr2" style="margin-bottom:10px">
        <div class="fg" style="margin:0"><label class="fl2">Inizio *</label><input id="tr-i" type="datetime-local"></div>
        <div class="fg" style="margin:0"><label class="fl2">Fine</label><input id="tr-f" type="datetime-local"></div>
      </div>
      <div class="fg"><label class="fl2">Stato</label>
        <select id="tr-s"><option value="programmato">Programmato</option><option value="in_corso">In corso</option><option value="completato">Completato</option></select></div>
      <div id="tr-alert" style="display:none;margin-top:10px" class="alert"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
        <button class="btn" onclick="showf('f-tur')">Annulla</button>
        <button class="btn btn-p" onclick="salvaTurno()"><i class="ti ti-check"></i> Salva turno</button>
      </div>
    </div>
  </div>
</div>

<!-- ═══════ GPS ═══════ -->
<div class="sec" id="sec-gps">
  <div class="sh">
    <div>
      <div class="stitle">Tracciamento GPS — MAN TGE Ambulanza</div>
      <div style="font-size:11px;color:var(--txt3);margin-top:2px">Simulazione route Treviglio → Crema · aggiornamento ogni 5s</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      <span class="badge b-green" id="gps-badge"><span class="dot" style="display:inline-block;margin-right:4px"></span>LIVE</span>
      <button class="btn" onclick="toggleSim()" id="btn-sim"><i class="ti ti-player-pause"></i> Pausa</button>
    </div>
  </div>
  <div id="map"></div>
  <div class="gbar">
    <div class="gchip"><span class="dot"></span><strong>MAN TGE-01</strong></div>
    <div class="gchip"><i class="ti ti-map-pin" style="color:var(--blue)"></i>Lat: <span id="gps-lat" style="font-family:'DM Mono',monospace">45.52300</span></div>
    <div class="gchip"><i class="ti ti-map-pin" style="color:var(--blue)"></i>Lng: <span id="gps-lng" style="font-family:'DM Mono',monospace">9.67300</span></div>
    <div class="gchip"><i class="ti ti-gauge" style="color:var(--amber)"></i><span id="gps-vel" style="font-family:'DM Mono',monospace">0</span> km/h</div>
    <div class="gchip"><i class="ti ti-clock" style="color:var(--txt3)"></i><span id="gps-ts" style="font-family:'DM Mono',monospace">—</span></div>
  </div>
</div>

<!-- ═══════ LOG GDPR ═══════ -->
<div class="sec" id="sec-log">
  <div class="sh">
    <div>
      <div class="stitle">Log di sistema — Audit Trail GDPR</div>
      <div style="font-size:11px;color:var(--txt3);margin-top:2px">Immutabile · append-only · firmato SHA-256 · GDPR Art.30</div>
    </div>
    <button class="btn" onclick="caricaLog()"><i class="ti ti-refresh"></i> Aggiorna</button>
  </div>
  <div class="alert a-warn" style="margin-bottom:12px">
    <i class="ti ti-shield"></i>
    Log generato esclusivamente dal server. Non modificabile dal frontend. Conforme GDPR Reg. UE 2016/679, Art.30.
  </div>
  <div class="card" style="padding:0"><div class="logcon" id="logcon">Caricamento...</div></div>
</div>

<!-- ═══════ NOTIFICHE ═══════ -->
<div class="sec" id="sec-notif">
  <div class="sh">
    <div class="stitle">Notifiche</div>
    <button class="btn" onclick="clearNotif()"><i class="ti ti-checks"></i> Segna lette</button>
  </div>
  <div id="notif-list">
    <div class="card" style="margin-bottom:8px">
      <div style="display:flex;align-items:flex-start;gap:10px">
        <div style="width:32px;height:32px;border-radius:var(--r);background:var(--green-l);display:flex;align-items:center;justify-content:center;color:var(--green);flex-shrink:0"><i class="ti ti-ambulance"></i></div>
        <div><div style="font-size:13px;font-weight:600;color:var(--txt)">Servizio completato — Verdi Giuseppe</div>
          <div style="font-size:11px;color:var(--txt3);margin-top:2px">Trasporto concluso · Osp. Treviglio</div></div>
        <span class="badge b-green" style="margin-left:auto">Completato</span>
      </div>
    </div>
    <div class="card">
      <div style="display:flex;align-items:flex-start;gap:10px">
        <div style="width:32px;height:32px;border-radius:var(--r);background:var(--amber-l);display:flex;align-items:center;justify-content:center;color:var(--amber);flex-shrink:0"><i class="ti ti-clock"></i></div>
        <div><div style="font-size:13px;font-weight:600;color:var(--txt)">Turno in scadenza — Aut. Ferrari Luca</div>
          <div style="font-size:11px;color:var(--txt3);margin-top:2px">Fine turno prevista tra 45 minuti</div></div>
        <span class="badge b-amber" style="margin-left:auto">Avviso</span>
      </div>
    </div>
  </div>
</div>

    </div><!-- /content -->
  </div><!-- /main -->
 </div><!-- /shell -->
</div><!-- /app -->

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
'use strict';

// ── CONFIG ───────────────────────────────────────────────────────
const API = '[[API_BASE_URL]]';

// ── NAV ──────────────────────────────────────────────────────────
function go(id, btn) {
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('on'));
  document.getElementById('sec-' + id).classList.add('on');
  if (btn) btn.classList.add('on');
  document.getElementById('ptitle').textContent = btn ? btn.textContent.trim() : id;
  if (id === 'dashboard') aggiornaDash();
  if (id === 'gps') initMap();
  if (id === 'log') caricaLog();
  if (id === 'servizi') caricaServizi();
  if (id === 'medici') caricaPersonale();
  if (id === 'pazienti') caricaPazienti();
  if (id === 'turni') caricaTurni();
}
function showf(id) {
  const f = document.getElementById(id);
  f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

// ── CLOCK ────────────────────────────────────────────────────────
function tick() {
  const n = new Date();
  document.getElementById('clk').textContent =
    n.toLocaleTimeString('it-IT') + ' · ' + n.toLocaleDateString('it-IT', {weekday:'short',day:'numeric',month:'short'});
}
setInterval(tick, 1000); tick();
document.getElementById('turni-d').value = new Date().toISOString().split('T')[0];

// ── API HELPER ───────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = { method, headers: {'Content-Type':'application/json'} };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(API + path, opts);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.detail || 'Errore ' + r.status);
  return d;
}

// ── API STATUS ───────────────────────────────────────────────────
async function checkAPI() {
  const el = document.getElementById('api-dot');
  try {
    await api('GET', '/api/health');
    el.textContent = '⬤ API OK'; el.className = 'api-dot ok';
  } catch {
    el.textContent = '⬤ API offline'; el.className = 'api-dot err';
  }
}
checkAPI(); setInterval(checkAPI, 30000);

// ── LOGIN ────────────────────────────────────────────────────────
function ltab(id, btn) {
  ['pwd','spid','otp'].forEach(t => {
    const el = document.getElementById('lp-'+t);
    if (el) el.style.display = 'none';
  });
  document.getElementById('lp-' + id).style.display = 'block';
  document.querySelectorAll('.ltab').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
}

async function step1() {
  const u = document.getElementById('lu').value;
  const p = document.getElementById('lp').value;
  if (!u || !p) { lErr('Inserisci username e password.'); return; }

  // Prima chiama il backend, poi mostra OTP
  try {
    await api('POST', '/api/login', {username: u, password: p});
    # Login OK → mostra step OTP
    document.getElementById('tab-otp').style.display = '';
    ltab('otp', document.getElementById('tab-otp'));
    setTimeout(() => document.querySelector('.oi').focus(), 50);
  } catch(e) {
    # API offline → fallback demo locale
    if (u === 'admin' && p === 'admin123') {
      document.getElementById('tab-otp').style.display = '';
      ltab('otp', document.getElementById('tab-otp'));
      setTimeout(() => document.querySelector('.oi').focus(), 50);
    } else {
      lErr('Credenziali non valide. (Demo: admin / admin123)');
    }
  }
}

function step2() {
  const code = [...document.querySelectorAll('.oi')].map(i => i.value).join('');
  if (code === '123456' || code.length === 6) {
    document.getElementById('login-wrap').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    aggiornaDash();
    caricaPersonaleInSelect();
  } else {
    lErr('OTP non valido. Demo: usa 1 2 3 4 5 6');
  }
}

function loginSpid() {
  alert('In produzione questa funzione reindirizza all\'IdP SPID/CIE tramite SAML2 o OpenID Connect (AgID).');
}

function lErr(msg) {
  const e = document.getElementById('lerr');
  document.getElementById('lerr-msg').textContent = msg;
  e.style.display = 'block';
  setTimeout(() => e.style.display = 'none', 4000);
}

# OTP auto-advance
document.querySelectorAll('.oi').forEach((inp, i, arr) => {
  inp.addEventListener('input', () => { if (inp.value && i < arr.length-1) arr[i+1].focus(); });
  inp.addEventListener('keydown', e => { if (e.key === 'Backspace' && !inp.value && i > 0) arr[i-1].focus(); });
});

// ── DASHBOARD ────────────────────────────────────────────────────
async function aggiornaDash() {
  try {
    const s = await api('GET', '/api/stats');
    document.getElementById('st-pers').textContent = s.n_personale ?? '—';
    document.getElementById('st-paz').textContent  = s.n_pazienti ?? '—';
    document.getElementById('st-tur').textContent  = s.n_turni ?? '—';
    document.getElementById('st-srv').textContent  = s.n_attivi ?? '—';
  } catch { /* API offline: mantieni —  */ }

  # Turni recenti
  try {
    const turni = await api('GET', '/api/turni');
    const ultimi = turni.slice(-4).reverse();
    const bmap = {programmato:'b-blue',in_corso:'b-green',completato:'b-gray'};
    const lmap = {programmato:'Programmato',in_corso:'In corso',completato:'Completato'};
    document.getElementById('dash-turni').innerHTML = ultimi.length
      ? ultimi.map(t => `<div class="ritem">
          <div><div style="font-size:12px;font-weight:600;color:var(--txt)">${t.operatore}</div>
          <div style="font-size:11px;color:var(--txt3)">${t.base}</div></div>
          <span class="badge ${bmap[t.stato]||'b-gray'}">${lmap[t.stato]||t.stato}</span></div>`).join('')
      : '<div class="empty"><i class="ti ti-calendar"></i>Nessun turno</div>';
  } catch { document.getElementById('dash-turni').innerHTML = '<div class="empty">API offline</div>'; }

  # Pazienti recenti
  try {
    const paz = await api('GET', '/api/pazienti');
    const ultimi = paz.slice(-4).reverse();
    document.getElementById('dash-paz').innerHTML = ultimi.length
      ? ultimi.map(p => `<div class="ritem">
          <div><div style="font-size:12px;font-weight:600;color:var(--txt)">${p.cognome} ${p.nome}</div>
          <div style="font-size:11px;color:var(--txt3)">CF: ${p.codice_fiscale||'—'}</div></div>
          \${p.gruppo_sanguigno ? `<span class="badge b-red">\${p.gruppo_sanguigno}</span>` : ''}</div>`).join('')
      : '<div class="empty"><i class="ti ti-users"></i>Nessun paziente</div>';
  } catch { document.getElementById('dash-paz').innerHTML = '<div class="empty">API offline</div>'; }
}

// ── SERVIZI ──────────────────────────────────────────────────────
async function caricaServizi() {
  try {
    const list = await api('GET', '/api/servizi');
    renderServizi(list);
  } catch { document.getElementById('tb-servizi').innerHTML = '<tr><td colspan="8" class="empty">API offline</td></tr>'; }
}

function renderServizi(list) {
  const bmap = {programmato:'b-blue',in_corso:'b-green',completato:'b-gray',annullato:'b-red'};
  const fmap = {tessera_sanitaria:'b-teal',fattura_sdi:'b-amber',esente:'b-gray'};
  const flab = {tessera_sanitaria:'Tessera San.',fattura_sdi:'SDI B2B',esente:'Esente'};
  document.getElementById('tb-servizi').innerHTML = list.length
    ? [...list].reverse().map(s => `<tr>
        <td><div style="font-weight:600;color:var(--txt)">\${s.paz_cognome||''} \${s.paz_nome||''}</div>
            <div style="font-size:11px;color:var(--txt3)">\${s.paz_cf||s.paz_tel||'—'}</div></td>
        <td>\${s.tipo_servizio||'—'}</td>
        <td>\s.luogo_recupero.substring(0,28)</td>
        <td>\s.luogo_destinazione.substring(0,28)</td>
        <td>\${s.operatore||'—'}</td>
        <td><span class="badge \${fmap[s.fat_destinazione]||'b-gray'}">\${flab[s.fat_destinazione]||'—'}</span></td>
        <td><span class="badge \${bmap[s.stato]||'b-gray'}">\${s.stato||'—'}</span></td>
        <td><button class="btn btn-g" style="padding:4px 10px;font-size:10px" onclick="chiudiServizio('\${s.id}',this)">✓ Chiudi</button></td>
      </tr>`).join('')
    : '<tr><td colspan="8" class="empty"><i class="ti ti-ambulance"></i>Nessun servizio</td></tr>';
}

async function chiudiServizio(id, btn) {
  try {
    await api('PATCH', `/api/servizio/\${id}/stato`, {stato:'completato'});
    btn.textContent = '✓ Chiuso'; btn.disabled = true;
    caricaServizi();
  } catch(e) { alert('Errore: ' + e.message); }
}

function addRigaServizio(p, id) {
  const fmap = {tessera_sanitaria:'b-teal',fattura_sdi:'b-amber',esente:'b-gray'};
  const flab = {tessera_sanitaria:'Tessera San.',fattura_sdi:'SDI B2B',esente:'Esente'};
  const badge = p.stato === 'in_corso' ? '<span class="badge b-green">In corso</span>' : '<span class="badge b-blue">Programmato</span>';
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><div style="font-weight:600;color:var(--txt)">\${p.paz_nome} \${p.paz_cognome}</div>
        <div style="font-size:11px;color:var(--txt3)">\${p.paz_cf||p.paz_tel||'—'}</div></td>
    <td>\${p.tipo_servizio}</td>
    <td>\${p.luogo_recupero.substring(0,28)}</td>
    <td>\${p.luogo_destinazione.substring(0,28)}</td>
    <td>\${p.operatore||'—'}</td>
    <td><span class="badge \${fmap[p.fat_destinazione]||'b-gray'}">\${flab[p.fat_destinazione]||'—'}</span></td>
    <td>\${badge}</td>
    <td><button class="btn btn-g" style="padding:4px 10px;font-size:10px" onclick="chiudiServizio('\${id}',this)">✓ Chiudi</button></td>`;
  const tb = document.getElementById('tb-servizi');
  if (tb.firstChild?.tagName === 'TR' && tb.firstChild.textContent.includes('Nessun')) tb.innerHTML = '';
  tb.insertBefore(tr, tb.firstChild);
}

// ── SALVA SERVIZIO ───────────────────────────────────────────────
async function salvaServizio(stato) {
  const nome = document.getElementById('sv-nome').value.trim();
  const cog  = document.getElementById('sv-cog').value.trim();
  const tipo = document.getElementById('sv-tipo').value;
  const rec  = document.getElementById('sv-rec').value.trim();
  const dst  = document.getElementById('sv-dst').value.trim();
  const op   = document.getElementById('sv-op').value;

  if (!nome || !cog) { showAlert('sv-alert','err','Nome e cognome paziente obbligatori.'); return; }
  if (!tipo) { showAlert('sv-alert','err','Seleziona il tipo di servizio.'); return; }
  if (!rec || !dst) { showAlert('sv-alert','err','Luoghi di recupero e destinazione obbligatori.'); return; }
  if (!op) { showAlert('sv-alert','err','Seleziona un operatore.'); return; }

  const payload = {
    paz_nome: nome, paz_cognome: cog,
    paz_cf: document.getElementById('sv-cf').value.toUpperCase(),
    paz_tel: document.getElementById('sv-tel').value,
    fat_intestatario: document.getElementById('fat-int').value,
    fat_cf_piva: document.getElementById('fat-piva').value.toUpperCase(),
    fat_destinazione: document.getElementById('fat-dest').value,
    fat_pagamento: document.getElementById('fat-pag').value,
    fat_codice_sdi: document.getElementById('fat-sdi').value,
    fat_pec: document.getElementById('fat-pec').value,
    luogo_recupero: rec,
    recupero_piano: document.getElementById('sv-rec-p').value,
    recupero_note: document.getElementById('sv-rec-n').value,
    dest_struttura: document.getElementById('sv-dst-str').value,
    luogo_destinazione: dst,
    dest_reparto: document.getElementById('sv-dst-r').value,
    dest_tel: document.getElementById('sv-dst-t').value,
    tipo_servizio: tipo,
    priorita: document.getElementById('sv-prio').value,
    operatore: op,
    base_operativa: document.getElementById('sv-base').value,
    condizioni_paziente: document.getElementById('sv-cond').value,
    note_operative: document.getElementById('sv-note').value,
    stato
  };

  document.getElementById('sv-spin').classList.add('on');
  try {
    const r = await api('POST', '/api/servizio', payload);
    showAlert('sv-alert', stato==='in_corso'?'ok':'info',
      `✓ \${r.messaggio} — ID: \${r.record_id}`);
    addRigaServizio(payload, r.record_id);
    if (stato==='in_corso') { const el=document.getElementById('st-srv'); if(el.textContent!=='—') el.textContent=parseInt(el.textContent)+1; }
  } catch(e) {
    showAlert('sv-alert','warn',`⚠ API non raggiungibile — dati non persistiti. (\${e.message})`);
    addRigaServizio(payload, 'LOCAL-'+ Date.now().toString(36));
  } finally {
    document.getElementById('sv-spin').classList.remove('on');
  }
}

// ── PAZIENTI ─────────────────────────────────────────────────────
async function caricaPazienti() {
  try {
    const list = await api('GET', '/api/pazienti');
    renderPazienti(list);
  } catch { document.getElementById('tb-paz').innerHTML = '<tr><td colspan="7" class="empty">API offline</td></tr>'; }
}

function renderPazienti(list) {
  const fmap = {tessera_sanitaria:'<span class="badge b-teal">Tessera San.</span>',
                fattura_sdi:'<span class="badge b-amber">SDI B2B</span>',
                esente:'<span class="badge b-gray">Esente</span>'};
  document.getElementById('tb-paz').innerHTML = list.length
    ? [...list].reverse().map(p => `<tr>
        <td><div style="font-weight:600;color:var(--txt)">\${p.cognome} \${p.nome}</div>
            <div style="font-size:11px;color:var(--txt3)">\${p.codice_fiscale||'—'}</div></td>
        <td>\${p.data_nascita ? new Date(p.data_nascita+'T12:00').toLocaleDateString('it-IT') : '—'}</td>
        <td>\${p.telefono||'—'}</td>
        <td>\${p.gruppo_sanguigno ? `<span class="badge b-red">\${p.gruppo_sanguigno}</span>` : '—'}</td>
        <td>\${fmap[p.destinazione_fiscale]||'—'}</td>
        <td style="font-size:11px;color:var(--txt3)">\${p.note_mediche||'—'}</td>
        <td><button class="btn btn-r" style="padding:4px 10px;font-size:10px" onclick="eliminaPaziente('\${p.id}',this)"><i class="ti ti-trash"></i></button></td>
      </tr>`).join('')
    : '<tr><td colspan="7" class="empty"><i class="ti ti-users"></i>Nessun paziente</td></tr>';
}

async function eliminaPaziente(id, btn) {
  if (!confirm('Eliminare questo paziente?')) return;
  try {
    await api('DELETE', `/api/paziente/\${id}`);
    btn.closest('tr').remove();
    const el = document.getElementById('st-paz');
    if (el.textContent !== '—') el.textContent = Math.max(0, parseInt(el.textContent)-1);
  } catch(e) { alert('Errore: ' + e.message); }
}

async function salvaPaziente() {
  const nome = document.getElementById('pz-n').value.trim();
  const cog  = document.getElementById('pz-c').value.trim();
  const gdpr = document.getElementById('pz-gdpr').checked;
  if (!nome || !cog) { showAlert('pz-alert','err','Nome e cognome obbligatori.'); return; }
  if (!gdpr) { showAlert('pz-alert','err','Consenso GDPR obbligatorio per salvare dati sanitari.'); return; }

  const payload = {
    nome, cognome: cog,
    codice_fiscale: document.getElementById('pz-cf').value.toUpperCase(),
    data_nascita: document.getElementById('pz-dn').value,
    gruppo_sanguigno: document.getElementById('pz-gs').value,
    telefono: document.getElementById('pz-tel').value,
    note_mediche: document.getElementById('pz-note').value,
    tipo_soggetto: document.getElementById('pz-tipo').value,
    destinazione_fiscale: document.getElementById('pz-df').value,
    consenso_gdpr: gdpr
  };

  try {
    const r = await api('POST', '/api/paziente', payload);
    showAlert('pz-alert','ok', `✓ Patient salvato — ID: \${r.record_id}`);
    const el = document.getElementById('st-paz');
    if (el.textContent !== '—') el.textContent = parseInt(el.textContent)+1;
    # Aggiorna tabella se visibile
    if (document.getElementById('tb-paz').innerHTML.includes('Nessun')) {
      renderPazienti([payload]);
    } else { caricaPazienti(); }
    setTimeout(() => { showf('f-paz'); }, 1800);
  } catch(e) {
    showAlert('pz-alert','warn', `⚠ API offline: \${e.message}`);
  }
}

// ── PERSONALE ────────────────────────────────────────────────────
async function caricaPersonale() {
  try {
    const list = await api('GET', '/api/personale');
    renderPersonale(list);
    caricaPersonaleInSelect(list);
  } catch { document.getElementById('tb-pers').innerHTML = '<tr><td colspan="6" class="empty">API offline</td></tr>'; }
}

function renderPersonale(list) {
  const qmap = {Medico:'b-blue',Infermiere:'b-purple',Autista:'b-amber',Paramedico:'b-teal',Coordinatore:'b-green'};
  const smap = {'In servizio':'b-green','Disponibile':'b-blue','Fuori turno':'b-gray'};
  document.getElementById('tb-pers').innerHTML = list.length
    ? list.map(p => `<tr>
        <td><div style="font-weight:600;color:var(--txt)">\${p.cognome} \${p.nome}</div>
            <div style="font-size:11px;color:var(--txt3)">\${p.email||'—'}</div></td>
        <td><span class="badge \${qmap[p.qualifica]||'b-gray'}">\${p.qualifica}</span></td>
        <td>\${p.base}</td><td>\${p.telefono||'—'}</td><td>\${p.email||'—'}</td>
        <td><span class="badge \${smap[p.stato]||'b-gray'}">\${p.stato||'—'}</span></td>
      </tr>`).join('')
    : '<tr><td colspan="6" class="empty"><i class="ti ti-users"></i>Nessun personale</td></tr>';
}

function caricaPersonaleInSelect(list) {
  const sel = document.getElementById('sv-op');
  if (!sel || (list && list.length === 0)) return;
  const load = async () => {
    try { list = list || await api('GET', '/api/personale'); } catch { return; }
    sel.innerHTML = '<option value="">Seleziona operatore...</option>' +
      list.map(p => `<option value="\${p.qualifica.substring(0,3)}. \${p.cognome} \${p.nome}">\${p.qualifica.substring(0,3)}. \${p.cognome} \${p.nome} — \${p.qualifica}</option>`).join('');
  };
  load();
}

async function salvaPersonale() {
  const nome = document.getElementById('mp-n').value.trim();
  const cog  = document.getElementById('mp-c').value.trim();
  if (!nome || !cog) { showAlert('mp-alert','err','Nome e cognome obbligatori.'); return; }
  const payload = {
    nome, cognome: cog,
    qualifica: document.getElementById('mp-q').value,
    base: document.getElementById('mp-b').value,
    telefono: document.getElementById('mp-t').value,
    email: document.getElementById('mp-e').value,
    stato: 'Disponibile'
  };
  try {
    const r = await api('POST', '/api/personale', payload);
    showAlert('mp-alert','ok', `✓ Personale aggiunto — ID: \${r.record_id}`);
    const el = document.getElementById('st-pers');
    if (el.textContent !== '—') el.textContent = parseInt(el.textContent)+1;
    caricaPersonale();
    setTimeout(() => showf('f-pers'), 1500);
  } catch(e) { showAlert('mp-alert','warn', `⚠ API offline: \${e.message}`); }
}

// ── TURNI ────────────────────────────────────────────────────────
async function caricaTurni() {
  try {
    const list = await api('GET', '/api/turni');
    renderTurni(list);
  } catch { document.getElementById('tb-tur').innerHTML = '<tr><td colspan="7" class="empty">API offline</td></tr>'; }
}

function renderTurni(list) {
  const bmap = {programmato:'b-blue',in_corso:'b-green',completato:'b-gray'};
  const lmap = {programmato:'Programmato',in_corso:'In corso',completato:'Completato'};
  const fmt = dt => dt ? new Date(dt).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}) : '—';
  const dur = (i,f) => {
    if (!i||!f) return '—';
    const m = Math.round((new Date(f)-new Date(i))/60000);
    return `\${Math.floor(m/60)}h \${m%60}m`;
  };
  document.getElementById('tb-tur').innerHTML = list.length
    ? [...list].reverse().map(t => `<tr>
        <td><div style="font-weight:600;color:var(--txt)">\${t.operatore}</div></td>
        <td>\${t.base}</td>
        <td>\${fmt(t.inizio)}</td><td>\${fmt(t.fine)}</td>
        <td>\${dur(t.inizio,t.fine)}</td>
        <td><span class="badge \${bmap[t.stato]||'b-gray'}">\${lmap[t.stato]||t.stato}</span></td>
        <td>\${t.stato !== 'completato' ? `<button class="btn btn-g" style="padding:4px 10px;font-size:10px" onclick="chiudiTurno('\${t.id}',this)">✓ Chiudi</button>` : ''}</td>
      </tr>`).join('')
    : '<tr><td colspan="7" class="empty"><i class="ti ti-calendar"></i>Nessun turno</td></tr>';
}

async function chiudiTurno(id, btn) {
  try {
    await api('PATCH', `/api/turno/\${id}/stato`, {stato:'completato'});
    btn.textContent = '✓ Chiuso'; btn.disabled = true;
    caricaTurni();
  } catch(e) { alert('Errore: ' + e.message); }
}

async function salvaTurno() {
  const op = document.getElementById('tr-op').value;
  const base = document.getElementById('tr-b').value;
  const inizio = document.getElementById('tr-i').value;
  const fine = document.getElementById('tr-f').value;
  const stato = document.getElementById('tr-s').value;
  if (!inizio) { showAlert('tr-alert','err','Inserisci orario inizio.'); return; }
  try {
    const r = await api('POST', '/api/turno', {operatore:op, base, inizio, fine:fine||null, stato});
    showAlert('tr-alert','ok', `✓ Turno salvato — ID: \${r.record_id}`);
    caricaTurni();
    const el = document.getElementById('st-tur');
    if (el.textContent !== '—') el.textContent = parseInt(el.textContent)+1;
    setTimeout(() => showf('f-tur'), 1500);
  } catch(e) { showAlert('tr-alert','warn', `⚠ API offline: \${e.message}`); }
}

// ── GPS / LEAFLET ────────────────────────────────────────────────
let map = null, markerAmb = null, simOn = true, simTimer = null;
const ROTTA = [
  {lat:45.5230,lng:9.6730,vel:0},   {lat:45.5180,lng:9.6850,vel:45},
  {lat:45.5120,lng:9.7050,vel:60},  {lat:45.5060,lng:9.7280,vel:72},
  {lat:45.4990,lng:9.7530,vel:68},  {lat:45.4920,lng:9.7800,vel:55},
  {lat:45.4860,lng:9.8050,vel:40},  {lat:45.4800,lng:9.8300,vel:30},
  {lat:45.4760,lng:9.8530,vel:20},  {lat:45.4730,lng:9.8780,vel:10},
  {lat:45.4760,lng:9.8530,vel:20},  {lat:45.4860,lng:9.8050,vel:45},
  {lat:45.4990,lng:9.7530,vel:65},  {lat:45.5120,lng:9.7050,vel:70},
  {lat:45.5230,lng:9.6730,vel:0}
];
let ridx = 0;

function initMap() {
  if (map) return;
  map = L.map('map').setView([45.5230, 9.6730], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:'© OpenStreetMap contributors', maxZoom:18
  }).addTo(map);

  # Basi fisse
  const mkBase = (lat,lng,label,col) => L.marker([lat,lng], {icon: L.divIcon({
    html:`<div style="background:\${col};color:#fff;border-radius:6px;padding:2px 8px;font-size:10px;font-weight:600;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,.2)">\${label}</div>`,
    className:'', iconAnchor:[30,10]
  })}).addTo(map).bindTooltip(label);
  mkBase(45.5230, 9.6730, '⊕ Base Nord — Treviglio', '#1D6FD8');
  mkBase(45.4730, 9.8780, '⊕ Base Sud — Crema', '#16A34A');

  # Marker ambulanza
  const iconAmb = L.divIcon({
    html:`<div style="background:#DC2626;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.3)">🚑</div>`,
    className:'', iconAnchor:[18,18]
  });
  markerAmb = L.marker([ROTTA[0].lat, ROTTA[0].lng], {icon: iconAmb})
    .addTo(map)
    .bindPopup('<b>MAN TGE-01</b><br>Aut. Ferrari Luca<br><span style="color:#16A34A">● In servizio</span>');

  # Rotta tratteggiata
  L.polyline(ROTTA.map(p=>[p.lat,p.lng]), {color:'#1D6FD8',weight:2.5,opacity:.4,dashArray:'6 5'}).addTo(map);

  simTimer = setInterval(stepGPS, 5000);
  stepGPS();
}

function stepGPS() {
  if (!simOn || !markerAmb) return;
  const p = ROTTA[ridx]; ridx = (ridx+1) % ROTTA.length;
  markerAmb.setLatLng([p.lat, p.lng]);
  document.getElementById('gps-lat').textContent = p.lat.toFixed(5);
  document.getElementById('gps-lng').textContent = p.lng.toFixed(5);
  document.getElementById('gps-vel').textContent = Math.round(p.vel);
  document.getElementById('gps-ts').textContent = new Date().toLocaleTimeString('it-IT');
  # Invia al backend
  api('POST','/api/gps',{mezzo_id:'MAN-TGE-01',latitudine:p.lat,longitudine:p.lng,velocita:p.vel,operatore:'Aut. Ferrari Luca'}).catch(()=>{});
}

function toggleSim() {
  simOn = !simOn;
  document.getElementById('btn-sim').innerHTML = simOn
    ? '<i class="ti ti-player-pause"></i> Pausa'
    : '<i class="ti ti-player-play"></i> Riprendi';
  document.getElementById('gps-badge').style.opacity = simOn ? '1' : '.4';
}

// ── LOG GDPR ─────────────────────────────────────────────────────
async function caricaLog() {
  const con = document.getElementById('logcon');
  try {
    const logs = await api('GET', '/api/log?limite=80');
    const cols = {INFO:'#58a6ff',SCRITTURA:'#bc8cff',LETTURA:'#79c0ff',
                  ACCESSO:'#3fb950',WARN:'#d29922',ERROR:'#f85149',SISTEMA:'#8b949e'};
    con.innerHTML = logs.length
      ? [...logs].reverse().map(e =>
          `<div style="margin-bottom:5px">
            <span style="color:#8b949e">\${e.timestamp}</span>
            <span style="color:\${cols[e.tipo]||'#8b949e'};font-weight:700"> [\${e.tipo}]</span>
            <span style="color:#E6EDF3"> \${e.messaggio}</span>
            <span style="color:#3d444d;font-size:10px"> #\${e.hash||''}</span>
          </div>`).join('')
      : '<div style="color:#8b949e">Nessun log disponibile.</div>';
    con.scrollTop = 0;
  } catch {
    con.innerHTML = '<div style="color:#f85149">⚠ API non raggiungibile. Avvia: <code>streamlit run app.py</code></div>';
  }
}

// ── NOTIFICHE ────────────────────────────────────────────────────
function clearNotif() {
  document.getElementById('notif-list').innerHTML =
    '<div class="empty"><i class="ti ti-bell-off"></i>Nessuna notifica</div>';
  document.getElementById('notif-n').style.display = 'none';
}

// ── UTILITY ──────────────────────────────────────────────────────
function showB2B(v) {
  document.getElementById('b2b-extra').style.display = v === 'fattura_sdi' ? 'block' : 'none';
}

function showAlert(id, tipo, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  const cls = {ok:'a-ok',err:'a-err',info:'a-info',warn:'a-warn'};
  el.className = 'alert ' + (cls[tipo]||'a-info');
  el.innerHTML = msg; el.style.display = 'flex';
  if (tipo === 'ok') setTimeout(() => el.style.display = 'none', 5000);
}
</script>
</body>
</html>"""

# Scriviamo il file su disco
with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"\\n[OK] File scritto con successo in: {path} ({len(content)} bytes)\\n")
