<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta http-equiv="Content-Style-Type" content="text/css">
  <title></title>
  <meta name="Generator" content="Cocoa HTML Writer">
  <meta name="CocoaVersion" content="2685.6">
  <style type="text/css">
    body {background-color: #f1f4f9}
    p.p1 {margin: 0.0px 0.0px 0.0px 0.0px; font: 8.2px '.SF NS Mono'; color: #2a2a27; -webkit-text-stroke: #2a2a27}
    p.p2 {margin: 0.0px 0.0px 0.0px 0.0px; font: 12.0px '.AppleSystemUIFontMonospaced'; color: #101318; -webkit-text-stroke: #101318; background-color: #fcfdfb}
    p.p3 {margin: 0.0px 0.0px 0.0px 0.0px; font: 12.0px '.AppleSystemUIFontMonospaced'; color: #101318; -webkit-text-stroke: #101318; background-color: #fcfdfb; min-height: 15.0px}
    p.p4 {margin: 0.0px 0.0px 0.0px 0.0px; font: 12.0px '.AppleSystemUIFontMonospaced'; color: #0f7001; -webkit-text-stroke: #0f7001; background-color: #fcfdfb}
    p.p5 {margin: 0.0px 0.0px 0.0px 0.0px; font: 12.0px '.AppleSystemUIFontMonospaced'; color: #0f7001; -webkit-text-stroke: #0f7001}
    p.p6 {margin: 0.0px 0.0px 0.0px 0.0px; font: 8.2px '.SF NS'; color: #2a2a27; -webkit-text-stroke: #2a2a27}
    p.p7 {margin: 0.0px 0.0px 0.0px 0.0px; font: 12.0px '.AppleSystemUIFontMonospaced'; color: #101318; -webkit-text-stroke: #101318}
    span.s1 {font-kerning: none; background-color: #fcfdfb}
    span.s2 {font-kerning: none; color: #0439b5; -webkit-text-stroke: 0px #0439b5}
    span.s3 {font-kerning: none}
    span.s4 {font-kerning: none; color: #0f7001; -webkit-text-stroke: 0px #0f7001}
    span.s5 {font-kerning: none; color: #a23704; background-color: #fcfdfb; -webkit-text-stroke: 0px #a23704}
    span.s6 {font-kerning: none; color: #101318; background-color: #fcfdfb; -webkit-text-stroke: 0px #101318}
  </style>
</head>
<body>
<p class="p1"><span class="s1">bash</span></p>
<p class="p2"><span class="s2">cat</span><span class="s3"> &gt; /home/claude/ARGO_SaaS/app.py &lt;&lt; </span><span class="s4">'PYEOF'</span></p>
<p class="p2"><span class="s3"># =============================================================================</span></p>
<p class="p2"><span class="s3"># ARGO VYTA Hospital — app.py<span class="Apple-converted-space">  </span>(Streamlit entry point)</span></p>
<p class="p2"><span class="s3"># Avvia FastAPI su porta 8502 in background, serve la UI HTML sull'iframe.</span></p>
<p class="p2"><span class="s3"># AVVIO:<span class="Apple-converted-space">  </span>streamlit run app.py</span></p>
<p class="p2"><span class="s3"># =============================================================================</span></p>
<p class="p2"><span class="s3">import streamlit as st</span></p>
<p class="p2"><span class="s3">import streamlit.components.v1 as components</span></p>
<p class="p2"><span class="s3">import threading, uvicorn</span></p>
<p class="p2"><span class="s3">from pathlib import Path</span></p>
<p class="p2"><span class="s3">from api_server import crea_app_fastapi</span></p>
<p class="p2"><span class="s3">from backend import inizializza_db, leggi_log_sistema, leggi_pazienti, leggi_servizi, leggi_turni, leggi_personale</span></p>
<p class="p3"><span class="s3"></span><br></p>
<p class="p2"><span class="s3">st.set_page_config(page_title="ARGO — VYTA Hospital",page_icon="🏥",</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                   </span>layout="wide",initial_sidebar_state="collapsed")</span></p>
<p class="p2"><span class="s3">st.markdown("""</span></p>
<p class="p2"><span class="s3">&lt;style&gt;</span></p>
<p class="p2"><span class="s3">#MainMenu,footer,header{visibility:hidden}</span></p>
<p class="p2"><span class="s3">.block-container{padding:0!important;max-width:100%!important}</span></p>
<p class="p2"><span class="s3">iframe{border:none!important}</span></p>
<p class="p2"><span class="s3">section[data-testid="stSidebar"]{display:none}</span></p>
<p class="p2"><span class="s3">&lt;/style&gt;""", unsafe_allow_html=True)</span></p>
<p class="p3"><span class="s3"></span><br></p>
<p class="p2"><span class="s3"># ---------------------------------------------------------------------------</span></p>
<p class="p2"><span class="s3">def avvia_api():</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>app = crea_app_fastapi()</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>uvicorn.run(app, host="0.0.0.0", port=8502, log_level="warning")</span></p>
<p class="p3"><span class="s3"></span><br></p>
<p class="p2"><span class="s3">if "api_ok" not in st.session_state:</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>inizializza_db()</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>threading.Thread(target=avvia_api, daemon=True).start()</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>st.session_state["api_ok"] = True</span></p>
<p class="p3"><span class="s3"></span><br></p>
<p class="p2"><span class="s3"># ---------------------------------------------------------------------------</span></p>
<p class="p2"><span class="s3">html_path = Path(__file__).parent / "argo_ui.html"</span></p>
<p class="p2"><span class="s3">html = html_path.read_text(encoding="utf-8").replace("[[API_BASE_URL]]","http://localhost:8502")</span></p>
<p class="p2"><span class="s3">components.html(html, height=740, scrolling=False)</span></p>
<p class="p3"><span class="s3"></span><br></p>
<p class="p2"><span class="s3"># ---------------------------------------------------------------------------</span></p>
<p class="p2"><span class="s3">st.markdown("---")</span></p>
<p class="p2"><span class="s3">tab1, tab2, tab3, tab4 = st.tabs(["📋 Audit Log GDPR","👥 Pazienti DB","🚑 Servizi DB","⚙️ Admin"])</span></p>
<p class="p3"><span class="s3"></span><br></p>
<p class="p2"><span class="s3">with tab1:</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>st.caption("Log immutabile append-only · ogni riga firmata con SHA-256 · GDPR Art.30")</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>logs = leggi_log_sistema(60)</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>if logs:</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>colori = {"INFO":"#58a6ff","SCRITTURA":"#bc8cff","LETTURA":"#79c0ff",</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                  </span>"ACCESSO":"#3fb950","WARN":"#d29922","ERROR":"#f85149"}</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>html_log = '&lt;div style="font-family:monospace;font-size:12px;background:#0d1117;color:#c9d1d9;padding:14px;border-radius:10px;max-height:320px;overflow-y:auto"&gt;'</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>for e in reversed(logs):</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">            </span>c = colori.get(e.get("tipo",""), "#8b949e")</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">            </span>html_log += (f'&lt;div style="margin-bottom:5px"&gt;'</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                         </span>f'&lt;span style="color:#8b949e"&gt;{e["timestamp"]}&lt;/span&gt; '</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                         </span>f'&lt;span style="color:{c};font-weight:bold"&gt; [{e["tipo"]}]&lt;/span&gt; '</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                         </span>f'&lt;span style="color:#e6edf3"&gt; {e["messaggio"]}&lt;/span&gt;'</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                         </span>f'&lt;span style="color:#3d444d;font-size:10px"&gt; #{e.get("hash","")}&lt;/span&gt;&lt;/div&gt;')</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>html_log += '&lt;/div&gt;'</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>st.markdown(html_log, unsafe_allow_html=True)</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>else:</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>st.info("Nessun log ancora. Esegui operazioni nell'app.")</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>if st.button("🔄 Aggiorna log"):</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>st.rerun()</span></p>
<p class="p3"><span class="s3"></span><br></p>
<p class="p2"><span class="s3">with tab2:</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>pazienti = leggi_pazienti()</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>st.metric("Totale pazienti nel CSV", len(pazienti))</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>if pazienti:</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>import pandas as pd</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>df = pd.DataFrame(pazienti)[["id","cognome","nome","codice_fiscale","gruppo_sanguigno","telefono","destinazione_fiscale","timestamp"]]</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>df.columns = ["ID","Cognome","Nome","CF","Gruppo","Telefono","Dest. Fiscale","Registrato"]</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>st.dataframe(df, use_container_width=True, hide_index=True)</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>csv_bytes = Path(__file__).parent/"data"/"pazienti.csv"</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>if csv_bytes.exists():</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">            </span>st.download_button("📥 Scarica CSV completo", csv_bytes.read_bytes(),</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                               </span>"pazienti_vyta.csv","text/csv")</span></p>
<p class="p3"><span class="s3"></span><br></p>
<p class="p2"><span class="s3">with tab3:</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>servizi = leggi_servizi()</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>st.metric("Totale servizi salvati", len(servizi))</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>if servizi:</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>import pandas as pd</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>rows = []</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>for s in servizi:</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">            </span>rows.append({"ID":s.get("id",""),"Paziente":f"{s.get('paz_cognome','')} {s.get('paz_nome','')}",</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                         </span>"Tipo":s.get("tipo_servizio",""),"Recupero":s.get("luogo_recupero",""),</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                         </span>"Destinazione":s.get("luogo_destinazione",""),"Operatore":s.get("operatore",""),</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                         </span>"Stato":s.get("stato",""),"Dest.Fiscale":s.get("fat_destinazione","")})</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)</span></p>
<p class="p3"><span class="s3"></span><br></p>
<p class="p2"><span class="s3">with tab4:</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>st.subheader("Gestione utenti sistema")</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>with st.expander("➕ Crea nuovo utente"):</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>c1,c2 = st.columns(2)</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>nu = c1.text_input("Username"); np_ = c1.text_input("Password",type="password")</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>nn = c2.text_input("Nome"); nc = c2.text_input("Cognome")</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>nr = st.selectbox("Ruolo",["operatore","medico","infermiere","autista","amministratore"])</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">        </span>if st.button("Crea utente"):</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">            </span>if nu and np_:</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                </span>import requests, json as _json</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                </span>try:</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                    </span>r = requests.post("http://localhost:8502/api/utente",</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                                      </span>json={"username":nu,"password":np_,"ruolo":nr,"nome":nn,"cognome":nc})</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                    </span>if r.status_code == 200:</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                        </span>st.success(f"✓ Utente '{nu}' creato!")</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                    </span>else:</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                        </span>st.error(r.json().get("detail","Errore"))</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                </span>except:</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                    </span>from backend import crea_utente</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                    </span>try:</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                        </span>crea_utente(nu,np_,nr,nn,nc)</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                        </span>st.success(f"✓ Utente '{nu}' creato!")</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                    </span>except ValueError as e:</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                        </span>st.error(str(e))</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">            </span>else:</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">                </span>st.warning("Username e password obbligatori")</span></p>
<p class="p3"><span class="s3"></span><br></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>st.subheader("Credenziali default")</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>st.code("Username: admin\nPassword: admin123", language="text")</span></p>
<p class="p2"><span class="s3"><span class="Apple-converted-space">    </span>st.caption("⚠️ Cambia la password admin in produzione!")</span></p>
<p class="p4"><span class="s3">PYEOF</span></p>
<p class="p5"><span class="s5">echo</span><span class="s6"> </span><span class="s1">"app.py scritto"</span></p>
<p class="p6"><span class="s1"><b>Output</b><b></b></span></p>
<p class="p7"><span class="s1">app.py scritto</span></p>
</body>
</html>
