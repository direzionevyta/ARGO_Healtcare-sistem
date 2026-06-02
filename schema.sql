-- ============================================================
-- ARGO SaaS — schema.sql
-- Esegui questo su Neon.tech prima di avviare il server
-- ============================================================

-- Aziende (multi-tenant: ogni azienda cliente è isolata)
CREATE TABLE IF NOT EXISTS aziende (
  id          SERIAL PRIMARY KEY,
  nome        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,  -- es. "vyta", "croce-rossa-bergamo"
  piano       TEXT DEFAULT 'base',   -- base | pro | enterprise
  attiva      BOOLEAN DEFAULT true,
  creata_il   TIMESTAMPTZ DEFAULT NOW()
);

-- Utenti (appartengono a un'azienda)
CREATE TABLE IF NOT EXISTS utenti (
  id          SERIAL PRIMARY KEY,
  azienda_id  INTEGER REFERENCES aziende(id) ON DELETE CASCADE,
  username    TEXT NOT NULL,
  password    TEXT NOT NULL,         -- bcrypt hash
  ruolo       TEXT NOT NULL,         -- centrale | mezzo | admin
  nome        TEXT,
  cognome     TEXT,
  attivo      BOOLEAN DEFAULT true,
  creato_il   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(azienda_id, username)
);

-- Mezzi (ambulanze, automediche, ecc.)
CREATE TABLE IF NOT EXISTS mezzi (
  id          SERIAL PRIMARY KEY,
  azienda_id  INTEGER REFERENCES aziende(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,         -- es. "Ambulanza 1 — MAN TGE"
  targa       TEXT,
  tipo        TEXT DEFAULT 'ambulanza', -- ambulanza | automedica | furgone
  colore      TEXT DEFAULT '#DC2626',
  attivo      BOOLEAN DEFAULT true,
  creato_il   TIMESTAMPTZ DEFAULT NOW()
);

-- Collegamento utente ↔ mezzo (un utente-mezzo è associato a un mezzo fisico)
CREATE TABLE IF NOT EXISTS utenti_mezzi (
  utente_id   INTEGER REFERENCES utenti(id) ON DELETE CASCADE,
  mezzo_id    INTEGER REFERENCES mezzi(id) ON DELETE CASCADE,
  PRIMARY KEY (utente_id, mezzo_id)
);

-- Pazienti
CREATE TABLE IF NOT EXISTS pazienti (
  id          SERIAL PRIMARY KEY,
  azienda_id  INTEGER REFERENCES aziende(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  cognome     TEXT NOT NULL,
  codice_fiscale TEXT,
  data_nascita DATE,
  genere      TEXT,
  telefono    TEXT,
  email       TEXT,
  indirizzo   TEXT,
  gruppo_sanguigno TEXT,
  note_mediche TEXT,
  tipo_soggetto TEXT DEFAULT 'privato',
  destinazione_fiscale TEXT DEFAULT 'tessera_sanitaria',
  codice_sdi  TEXT,
  pec         TEXT,
  consenso_gdpr BOOLEAN DEFAULT false,
  creato_il   TIMESTAMPTZ DEFAULT NOW()
);

-- Servizi (interventi/trasporti)
CREATE TABLE IF NOT EXISTS servizi (
  id          SERIAL PRIMARY KEY,
  azienda_id  INTEGER REFERENCES aziende(id) ON DELETE CASCADE,
  mezzo_id    INTEGER REFERENCES mezzi(id),
  paziente_id INTEGER REFERENCES pazienti(id),
  operatore_id INTEGER REFERENCES utenti(id),
  paz_nome    TEXT,
  paz_cognome TEXT,
  paz_cf      TEXT,
  paz_tel     TEXT,
  tipo_servizio TEXT,
  priorita    TEXT DEFAULT 'normale',
  luogo_recupero TEXT,
  recupero_piano TEXT,
  recupero_note TEXT,
  dest_struttura TEXT,
  luogo_destinazione TEXT,
  dest_reparto TEXT,
  dest_tel    TEXT,
  fat_intestatario TEXT,
  fat_cf_piva TEXT,
  fat_destinazione TEXT DEFAULT 'tessera_sanitaria',
  fat_sdi     TEXT,
  fat_pec     TEXT,
  fat_pagamento TEXT,
  condizioni_paziente TEXT,
  note_operative TEXT,
  stato       TEXT DEFAULT 'programmato',
  creato_il   TIMESTAMPTZ DEFAULT NOW(),
  aggiornato_il TIMESTAMPTZ DEFAULT NOW()
);

-- Turni
CREATE TABLE IF NOT EXISTS turni (
  id          SERIAL PRIMARY KEY,
  azienda_id  INTEGER REFERENCES aziende(id) ON DELETE CASCADE,
  utente_id   INTEGER REFERENCES utenti(id),
  mezzo_id    INTEGER REFERENCES mezzi(id),
  inizio_turno TIMESTAMPTZ NOT NULL,
  fine_turno  TIMESTAMPTZ,
  stato       TEXT DEFAULT 'programmato',
  note        TEXT,
  creato_il   TIMESTAMPTZ DEFAULT NOW()
);

-- Posizioni GPS (storico)
CREATE TABLE IF NOT EXISTS posizioni_gps (
  id          SERIAL PRIMARY KEY,
  azienda_id  INTEGER REFERENCES aziende(id) ON DELETE CASCADE,
  mezzo_id    INTEGER REFERENCES mezzi(id),
  utente_id   INTEGER REFERENCES utenti(id),
  latitudine  DECIMAL(10,7) NOT NULL,
  longitudine DECIMAL(10,7) NOT NULL,
  velocita    DECIMAL(5,1),
  rilevato_il TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gps_mezzo ON posizioni_gps(mezzo_id, rilevato_il DESC);

-- Radio scritta (chat real-time)
CREATE TABLE IF NOT EXISTS messaggi_radio (
  id          SERIAL PRIMARY KEY,
  azienda_id  INTEGER REFERENCES aziende(id) ON DELETE CASCADE,
  mittente_id INTEGER REFERENCES utenti(id),
  destinatario_id INTEGER REFERENCES utenti(id), -- NULL = broadcast a tutti
  mezzo_id    INTEGER REFERENCES mezzi(id),       -- NULL = dalla centrale
  testo       TEXT NOT NULL,
  tipo        TEXT DEFAULT 'messaggio',            -- messaggio | servizio | allerta | sistema
  letto       BOOLEAN DEFAULT false,
  inviato_il  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_radio_azienda ON messaggi_radio(azienda_id, inviato_il DESC);

-- Sessioni
CREATE TABLE IF NOT EXISTS sessioni (
  sid         TEXT PRIMARY KEY,
  sess        TEXT NOT NULL,
  expire      TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sess_expire ON sessioni(expire);

-- Audit log GDPR (append-only)
CREATE TABLE IF NOT EXISTS audit_log (
  id          SERIAL PRIMARY KEY,
  azienda_id  INTEGER REFERENCES aziende(id),
  utente_id   INTEGER REFERENCES utenti(id),
  tipo        TEXT NOT NULL,
  messaggio   TEXT NOT NULL,
  ip          TEXT,
  hash        TEXT,
  creato_il   TIMESTAMPTZ DEFAULT NOW()
);

-- ── DATI DEMO ────────────────────────────────────────────────────
INSERT INTO aziende (nome, slug, piano) VALUES ('VYTA Hospital', 'vyta', 'pro')
ON CONFLICT (slug) DO NOTHING;

-- Password hash per 'admin123' (bcrypt)
-- In produzione usa il server per crearli
INSERT INTO utenti (azienda_id, username, password, ruolo, nome, cognome)
SELECT id, 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LkT6YF/a9si', 'centrale', 'Admin', 'VYTA'
FROM aziende WHERE slug='vyta'
ON CONFLICT DO NOTHING;

INSERT INTO mezzi (azienda_id, nome, targa, tipo, colore)
SELECT id, 'Ambulanza 1 — MAN TGE', 'BG 123 AA', 'ambulanza', '#DC2626'
FROM aziende WHERE slug='vyta'
ON CONFLICT DO NOTHING;
