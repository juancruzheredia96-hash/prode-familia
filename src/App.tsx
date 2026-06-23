import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, doc, setDoc, getDoc, collection,
  onSnapshot, query, orderBy, where, serverTimestamp, deleteDoc, addDoc, getDocs
} from "firebase/firestore";
import {
  getAuth, signInWithPopup, GoogleAuthProvider,
  onAuthStateChanged, signOut
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const provider = new GoogleAuthProvider();

const MARFIL = "#e8e8e8";
const BORDO = "#2c3e50";
const BORDO_LIGHT = "#4a6278";
const BORDO_DARK = "#1a2530";
const MARFIL_DARK = "#a0a8b0";
const MARFIL_LIGHT = "#f2f4f6";
const VERDE = "#2e7d32";
const AMARILLO = "#e65100";
const ROJO = "#c62828";

const PAISES: Record<string, string> = {
  "Argentina":"ar","Brasil":"br","Uruguay":"uy","Paraguay":"py","Chile":"cl",
  "Colombia":"co","Ecuador":"ec","Perú":"pe","Bolivia":"bo","Venezuela":"ve",
  "México":"mx","EEUU":"us","Canadá":"ca","Costa Rica":"cr","Panamá":"pa",
  "Honduras":"hn","Jamaica":"jm","El Salvador":"sv","Trinidad":"tt",
  "Alemania":"de","Francia":"fr","España":"es","Portugal":"pt","Italia":"it",
  "Inglaterra":"gb-eng","Holanda":"nl","Bélgica":"be","Croacia":"hr",
  "Austria":"at","Suiza":"ch","Dinamarca":"dk","Polonia":"pl","Serbia":"rs",
  "Escocia":"gb-sct","Turquía":"tr","Ucrania":"ua","Hungría":"hu",
  "Japón":"jp","Corea del Sur":"kr","Arabia Saudita":"sa","Irán":"ir",
  "Australia":"au","Marruecos":"ma","Senegal":"sn","Nigeria":"ng",
  "Ghana":"gh","Camerún":"cm","Egipto":"eg","Sudáfrica":"za",
  "Noruega":"no","Suecia":"se","Eslovenia":"si","Eslovaquia":"sk",
  "Bosnia y Herzegovina":"ba","Rep. Checa":"cz","República Checa":"cz",
  "Haití":"ht","Qatar":"qa","Túnez":"tn","Curazao":"cw",
  "Costa de Marfil":"ci","Cabo Verde":"cv","Nueva Zelanda":"nz",
  "Jordania":"jo","Argelia":"dz","Uzbekistán":"uz","RD Congo":"cd",
  "Irak":"iq","Rumanía":"ro","Por definir":"",
};

const FECHA_CIERRE_PREDICCIONES = new Date("2026-06-11T15:00:00-03:00");

const PREDICCIONES_CATEGORIAS = [
  { id:"campeon", label:"Campeón", emoji:"🏆", pts:10, tipo:"pais" },
  { id:"balon_oro", label:"Balón de Oro", emoji:"⚽", pts:5, tipo:"jugador" },
  { id:"bota_oro", label:"Bota de Oro", emoji:"👟", pts:5, tipo:"jugador" },
  { id:"guante_oro", label:"Guante de Oro", emoji:"🧤", pts:5, tipo:"jugador" },
  { id:"mejor_joven", label:"Mejor Jugador Joven", emoji:"🌟", pts:5, tipo:"jugador" },
];

const JUGADORES_BASE: Record<string, string[]> = {
  balon_oro: [
    "Lionel Messi","Kylian Mbappé","Vinicius Jr","Jude Bellingham","Erling Haaland",
    "Mohamed Salah","Kevin De Bruyne","Pedri","Rodri","Lamine Yamal","Robert Lewandowski",
    "Ángel Di María","Alexis Mac Allister","Rodrigo De Paul","Julián Álvarez","Paulo Dybala",
    "Cristiano Ronaldo","Bruno Fernandes","Rafael Leão","Bernardo Silva",
    "Darwin Núñez","Federico Valverde","Edinson Cavani","João Félix",
  ],
  bota_oro: [
    "Kylian Mbappé","Erling Haaland","Vinicius Jr","Robert Lewandowski","Harry Kane",
    "Victor Osimhen","Lautaro Martínez","Darwin Núñez","Julián Álvarez","Lionel Messi",
    "Cristiano Ronaldo","Romelu Lukaku","Paulo Dybala","Antoine Griezmann",
  ],
  guante_oro: [
    "Thibaut Courtois","Alisson Becker","Ederson","Marc-André ter Stegen",
    "Gianluigi Donnarumma","Emiliano Martínez","Yassine Bounou","Mike Maignan",
    "Wojciech Szczęsny","David Raya",
  ],
  mejor_joven: [
    "Lamine Yamal","Gavi","Eduardo Camavinga","Endrick","Savinho","Kobbie Mainoo",
    "Arda Güler","Warren Zaïre-Emery","Alejandro Garnacho","Claudio Echeverri",
    "Franco Mastantuono","Nicolás Barrios","Facundo Buonanotte","Pedri",
    "Mathys Tel","Florian Wirtz","Xavi Simons",
  ],
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { overflow-x: hidden; width: 100%; }
  body { font-family: 'Barlow', sans-serif; background: #f2f4f6; min-height: 100vh; display: flex; justify-content: center; margin: 0; overflow-x: hidden; width: 100%; touch-action: pan-y; }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
  input[type=number] { -moz-appearance: textfield; }
  button { cursor: pointer; font-family: 'Barlow', sans-serif; }
  input, select { font-family: 'Barlow', sans-serif; }
`;


function horaART() {
  return new Date().toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit", minute: "2-digit", hour12: false
  });
}

// Redimensiona una imagen a un cuadrado de `tamano`px, recortando el centro,
// y la devuelve como Base64 JPEG comprimido. Pensado para fotos de perfil chicas
// que entren cómodas en un documento de Firestore (limite 1MB).
function comprimirImagenAFoto(file: File, tamano = 200, calidad = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("No se pudo procesar la imagen"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = tamano;
        canvas.height = tamano;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas no disponible")); return; }

        // Recorte centrado cuadrado (cover), igual que object-fit:cover
        const lado = Math.min(img.width, img.height);
        const sx = (img.width - lado) / 2;
        const sy = (img.height - lado) / 2;
        ctx.drawImage(img, sx, sy, lado, lado, 0, 0, tamano, tamano);

        resolve(canvas.toDataURL("image/jpeg", calidad));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function estaBloquado(fecha: string, hora: string, horasAntes: number): boolean {
  if (!fecha || !hora) return false;
  const [h, m] = hora.split(":").map(Number);
  const inicio = new Date(`${fecha}T${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00-03:00`);
  const limite = new Date(inicio.getTime() - horasAntes * 60 * 60 * 1000);
  return new Date() >= limite;
}

function calcPtsNuevo(gL: number|null, gV: number|null, mL: number|null, mV: number|null): number|null {
  if (mL === null || mV === null || gL === null || gV === null) return null;
  const resReal = gL > gV ? "L" : gV > gL ? "V" : "E";
  const resPron = mL > mV ? "L" : mV > mL ? "V" : "E";
  if (resReal !== resPron) return 0;
  const aciertaL = mL === gL;
  const aciertaV = mV === gV;
  if (aciertaL && aciertaV) return 3;
  if (aciertaL || aciertaV) return 2;
  return 1;
}

function inputStyle(extra?: object) {
  return { border:`1px solid ${BORDO_LIGHT}`, borderRadius:6, padding:"0 10px",
    fontSize:13, background:MARFIL_LIGHT, color:BORDO_DARK, height:34, width:"100%", ...extra };
}


function FlagImg({ pais, size=22, showName=false }: { pais: string, size?: number, showName?: boolean }) {
  const code = PAISES[pais];
  const flag = code
    ? <img src={`https://flagcdn.com/w40/${code}.png`} alt={pais}
        style={{ width:size, height:"auto", borderRadius:2, objectFit:"cover", flexShrink:0 }}
        onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
    : <span style={{ fontSize:size }}>🏳️</span>;
  if (!showName) return flag;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      {flag}
      <span style={{ fontSize:11, fontWeight:600, color:BORDO }}>{pais}</span>
    </div>
  );
}

function Badge({ pts }: { pts: number|null }) {
  if (pts === null) return null;
  const cfg = pts === 3
    ? { color:VERDE, icon:"✓", label:"3" }
    : pts === 2 ? { color:AMARILLO, icon:"✓", label:"2" }
    : pts === 1 ? { color:AMARILLO, icon:"✓", label:"1" }
    : { color:ROJO, icon:"✕", label:"0" };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4,
      border:`2px solid ${cfg.color}`, padding:"3px 8px", minWidth:48, justifyContent:"center" }}>
      <span style={{ fontSize:13, fontWeight:600, color:cfg.color }}>{cfg.icon}</span>
      <span style={{ fontSize:13, fontWeight:600, color:cfg.color }}>{cfg.label}</span>
    </div>
  );
}


async function calcularPuntosPredicciones(resultados: Record<string,string>) {
  const predsSnap = await getDocs(collection(db, "predicciones"));
  for (const pDoc of predsSnap.docs) {
    const userId = pDoc.id;
    const data = pDoc.data();
    let ptsTotales = 0;
    const aciertos: string[] = [];
    for (const cat of PREDICCIONES_CATEGORIAS) {
      if (data[cat.id] && resultados[cat.id] &&
          data[cat.id].toLowerCase().trim() === resultados[cat.id].toLowerCase().trim()) {
        ptsTotales += cat.pts;
        aciertos.push(cat.id);
      }
    }
    if (ptsTotales > 0) {
      const userRef = doc(db, "usuarios", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const ud = userSnap.data();
        await setDoc(userRef, {
          pts: (ud.pts || 0) + ptsTotales,
          hoy: (ud.hoy || 0) + ptsTotales,
        }, { merge: true });
      }
      await setDoc(pDoc.ref, { aciertos, ptsGanados: ptsTotales }, { merge: true });
    }
  }
  await setDoc(doc(db, "config", "resultados_premios"), {
    ...resultados,
    calculado: true,
    updatedAt: serverTimestamp()
  });
}


async function calcularPuntosPartido(matchId: string, gL: number, gV: number) {
  const pronosSnap = await getDocs(collection(db, "pronosticos"));
  const delPartido = pronosSnap.docs.filter(d => d.data().matchId === matchId);
  const pronosticoPorUsuario: Record<string, any> = {};
  for (const pDoc of delPartido) {
    const data = pDoc.data();
    pronosticoPorUsuario[data.userId] = { ref: pDoc.ref, ...data };
  }

  // Este partido cuenta para el denominador de TODOS los usuarios registrados,
  // hayan pronosticado o no (si no pronosticaron, no suman al numerador de ninguna metrica).
  const usuariosSnap = await getDocs(collection(db, "usuarios"));

  for (const userDoc of usuariosSnap.docs) {
    const userId = userDoc.id;
    const ud = userDoc.data();
    const pronostico = pronosticoPorUsuario[userId];
    const mL = pronostico?.mL ?? null;
    const mV = pronostico?.mV ?? null;
    const tienePronostico = mL !== null && mV !== null;

    const pts = tienePronostico ? (calcPtsNuevo(gL, gV, mL, mV) ?? 0) : 0;
    const esExacto = pts === 3;
    const rachaActual = esExacto ? (ud.rachaActual || 0) + 1 : 0;
    const rachaMasLarga = Math.max(ud.rachaMasLarga || 0, rachaActual);
    const ceroRacha = pts === 0 ? (ud.ceroRacha || 0) + 1 : ud.ceroRacha || 0;

    // Acierto de goles: de los 2 marcadores pronosticados (local y visitante), cuantos coincidieron exacto
    const golesAciertaL = tienePronostico && mL === gL ? 1 : 0;
    const golesAciertaV = tienePronostico && mV === gV ? 1 : 0;
    const golesAcertados = (ud.golesAcertados || 0) + golesAciertaL + golesAciertaV;
    const golesPronosticados = (ud.golesPronosticados || 0) + 2;
    const acierto = golesPronosticados > 0 ? Math.round((golesAcertados / golesPronosticados) * 100) : 0;

    // % resultados exactos y % acierto resultado: sobre el TOTAL de partidos con resultado (haya pronosticado o no)
    const partidosConResultado = (ud.partidosConResultado || 0) + 1;
    const exactos = esExacto ? (ud.exactos || 0) + 1 : (ud.exactos || 0);
    const aciertosResultado = (tienePronostico && pts >= 1) ? (ud.aciertosResultado || 0) + 1 : (ud.aciertosResultado || 0);
    const pctExactos = Math.round((exactos / partidosConResultado) * 100);
    const pctAciertoResultado = Math.round((aciertosResultado / partidosConResultado) * 100);

    await setDoc(userDoc.ref, {
      pts: (ud.pts || 0) + pts,
      hoy: (ud.hoy || 0) + pts,
      exactos, rachaActual, rachaMasLarga, ceroRacha,
      golesAcertados, golesPronosticados, acierto,
      partidosConResultado, aciertosResultado, pctExactos, pctAciertoResultado,
    }, { merge: true });

    if (pronostico) {
      await setDoc(pronostico.ref, { pts, calculado: true }, { merge: true });
    }
  }

  const usuariosOrdenSnap = await getDocs(query(collection(db, "usuarios"), orderBy("pts", "desc")));
  await Promise.all(usuariosOrdenSnap.docs.map((d, idx) =>
    setDoc(d.ref, { pos: idx + 1, mov: (d.data().posAnterior || idx + 1) - (idx + 1) }, { merge: true })
  ));
  await Promise.all(usuariosOrdenSnap.docs.map((d, idx) =>
    setDoc(d.ref, { posAnterior: idx + 1 }, { merge: true })
  ));
}


function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function handleLogin() {
    setLoading(true); setError("");
    try { await signInWithPopup(auth, provider); }
    catch { setError("No se pudo iniciar sesión. Intentá de nuevo."); }
    finally { setLoading(false); }
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", minHeight:"80vh", padding:32,
      background:MARFIL_LIGHT, gap:24 }}>
      <div style={{ fontSize:56 }}>⚽</div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:22, fontWeight:700, color:BORDO }}>Prode Familiar</div>
        
      </div>
      <button onClick={handleLogin} disabled={loading} style={{
        background:BORDO, color:MARFIL, border:"none", borderRadius:8,
        padding:"13px 24px", fontSize:15, fontWeight:600, width:"100%", opacity:loading?0.7:1 }}>
        {loading ? "Entrando..." : "🔑 Ingresar con Google"}
      </button>
      {error && <div style={{ color:ROJO, fontSize:12 }}>{error}</div>}
      <div style={{ fontSize:11, color:"#aaa", textAlign:"center" }}>Al ingresar aparecés en la tabla del prode</div>
    </div>
  );
}


function MatchCard({ match, userId, lockHoras }: { match: any, userId: string, lockHoras: number }) {
  const [mL, setML] = useState<number|null>(null);
  const [mV, setMV] = useState<number|null>(null);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [aciertos, setAciertos] = useState<{tres:string[], dos:string[], uno:string[]}>({tres:[],dos:[],uno:[]});
  const [loadingAciertos, setLoadingAciertos] = useState(false);
  const hasResult = match.gL !== null && match.gL !== undefined;
  const bloqueado = hasResult || estaBloquado(match.fecha, match.hora, lockHoras);
  const pts = calcPtsNuevo(match.gL ?? null, match.gV ?? null, mL, mV);

  useEffect(() => {
    if (!userId) return;
    getDoc(doc(db, "pronosticos", `${userId}_${match.id}`)).then(snap => {
      if (snap.exists()) { setML(snap.data().mL); setMV(snap.data().mV); setSaved(true); }
    });
  }, [match.id, userId]);

  async function toggleExpanded() {
    if (!hasResult) return;
    if (!expanded && aciertos.tres.length === 0 && aciertos.dos.length === 0 && aciertos.uno.length === 0) {
      setLoadingAciertos(true);
      const pronosSnap = await getDocs(collection(db, "pronosticos"));
      const delPartido = pronosSnap.docs.filter(d => d.data().matchId === match.id);
      const usuariosSnap = await getDocs(collection(db, "usuarios"));
      const usuariosMap: Record<string,string> = {};
      usuariosSnap.docs.forEach(d => { usuariosMap[d.id] = d.data().nick || "?"; });
      const tres: string[] = [], dos: string[] = [], uno: string[] = [];
      delPartido.forEach(d => {
        const { userId:uid, mL:pL, mV:pV } = d.data();
        const p = calcPtsNuevo(match.gL, match.gV, pL, pV);
        const nick = usuariosMap[uid] || "?";
        if (p === 3) tres.push(nick);
        else if (p === 2) dos.push(nick);
        else if (p === 1) uno.push(nick);
      });
      setAciertos({ tres, dos, uno });
      setLoadingAciertos(false);
    }
    setExpanded(e => !e);
  }

  async function save() {
    if (mL === null || mV === null || bloqueado) return;
    await setDoc(doc(db, "pronosticos", `${userId}_${match.id}`), {
      userId, matchId: match.id, mL, mV, updatedAt: serverTimestamp()
    });
    setSaved(true);
  }

  return (
    <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5",
      padding:"10px 12px", marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <span style={{ fontSize:10, color:MARFIL, fontWeight:600,
          background:BORDO, padding:"2px 8px", borderRadius:3 }}>{match.grupo || match.fase}</span>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {bloqueado && !hasResult && <span style={{ fontSize:9, background:"#ff6f00", color:"white",
            padding:"1px 6px", borderRadius:3 }}>🔒 Cerrado</span>}
          <span style={{ fontSize:10, color:"#888" }}>🕐 {match.hora} Hs</span>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:4 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5, flex:1 }}>
          <FlagImg pais={match.localN} size={22} showName={true} />
        </div>
        <div style={{ minWidth:72, display:"flex", justifyContent:"center" }}>
          {hasResult
            ? <div style={{ display:"flex", alignItems:"center", gap:5, background:BORDO,
                borderRadius:4, padding:"3px 10px" }}>
                <span style={{ color:MARFIL, fontSize:14, fontWeight:600 }}>{match.gL}</span>
                <span style={{ color:MARFIL_DARK }}>-</span>
                <span style={{ color:MARFIL, fontSize:14, fontWeight:600 }}>{match.gV}</span>
              </div>
            : <span style={{ color:"#aaa", fontSize:11 }}>vs</span>
          }
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5, flex:1, flexDirection:"row-reverse" }}>
          <FlagImg pais={match.visitaN} size={22} showName={true} />
        </div>
      </div>
      <div style={{ borderTop:"0.5px solid #eee", paddingTop:8, marginTop:8 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
          <span style={{ fontSize:10, color:"#888" }}>✏️ Pronóstico</span>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            {(["mL","mV"] as const).map((field, i) => (
              <span key={field} style={{ display:"flex", alignItems:"center", gap:5 }}>
                {i===1 && <span style={{ fontSize:13, color:"#aaa" }}>-</span>}
                <input type="number" min="0" max="20"
                  value={(field==="mL"?mL:mV) !== null ? (field==="mL"?mL:mV)! : ""}
                  placeholder="–" disabled={bloqueado}
                  onChange={e => {
                    const v = e.target.value===""?null:parseInt(e.target.value);
                    field==="mL"?setML(v):setMV(v); setSaved(false);
                  }}
                  style={{ width:32, height:28, textAlign:"center", fontSize:14, fontWeight:600,
                    border:`1.5px solid ${BORDO_LIGHT}`, borderRadius:4,
                    background:MARFIL_LIGHT, color:BORDO_DARK, opacity:bloqueado?0.6:1 }}
                />
              </span>
            ))}
          </div>
          {hasResult
            ? <Badge pts={pts} />
            : bloqueado
              ? <span style={{ fontSize:10, color:"#888" }}>🔒</span>
              : <button onClick={save} disabled={mL===null||mV===null}
                  style={{ background:saved?VERDE:BORDO, color:MARFIL, border:"none",
                    borderRadius:4, fontSize:10, padding:"4px 10px", fontWeight:600,
                    opacity:(mL===null||mV===null)?0.4:1 }}>
                  {saved?"✓ Guardado":"Guardar"}
                </button>
          }
        </div>
      </div>
      {hasResult && (
        <div>
          <div onClick={toggleExpanded}
            style={{ borderTop:"0.5px solid #eee", marginTop:8, paddingTop:8,
              display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", gap:4 }}>
            <span style={{ fontSize:10, color:BORDO, fontWeight:500 }}>
              {expanded ? "▲ Ocultar aciertos" : "▼ Ver quién acertó"}
            </span>
          </div>
          {expanded && (
            <div style={{ marginTop:8 }}>
              {loadingAciertos ? (
                <div style={{ fontSize:11, color:"#888", textAlign:"center", padding:8 }}>Cargando...</div>
              ) : (
                <div style={{ display:"flex", gap:8 }}>
                  {[
                    { label:"⭐ 3 pts", nicks:aciertos.tres, color:VERDE },
                    { label:"✓ 2 pts", nicks:aciertos.dos, color:AMARILLO },
                    { label:"~ 1 pt", nicks:aciertos.uno, color:"#888" },
                  ].filter(g => g.nicks.length > 0).map(grupo => (
                    <div key={grupo.label} style={{ flex:1, background:MARFIL_LIGHT,
                      borderRadius:8, padding:"8px 10px" }}>
                      <div style={{ fontSize:10, fontWeight:600, color:grupo.color,
                        marginBottom:6 }}>{grupo.label}</div>
                      {grupo.nicks.map(nick => (
                        <div key={nick} style={{ fontSize:11, color:"#333",
                          padding:"2px 0", borderBottom:"0.5px solid #eee" }}>{nick}</div>
                      ))}
                    </div>
                  ))}
                  {aciertos.tres.length === 0 && aciertos.dos.length === 0 && aciertos.uno.length === 0 && (
                    <div style={{ fontSize:11, color:"#888", textAlign:"center", width:"100%", padding:8 }}>
                      Nadie acertó este partido
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function TabPartidos({ userId, lockHoras }: { userId: string, lockHoras: number }) {
  const [partidos, setPartidos] = useState<any[]>([]);
  const [currentDay, setCurrentDay] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "partidos"), orderBy("fecha"), orderBy("hora"));
    return onSnapshot(q, snap => {
      setPartidos(snap.docs.map(d => ({ id:d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const dias = [...new Set(partidos.map((p: any) => p.fecha))].sort();

  useEffect(() => {
    const hoy = new Date().toISOString().split("T")[0];
    const idx = dias.findIndex(d => d >= hoy);
    if (idx >= 0) setCurrentDay(idx);
  }, [dias.length]);

  const diaActual = dias[currentDay] || "";
  const matchesDelDia = partidos.filter((p: any) => p.fecha === diaActual);

  function formatFecha(f: string) {
    if (!f) return "";
    const [y,m,d] = f.split("-");
    const meses = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const diasN = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
    const fecha = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
    return `${diasN[fecha.getDay()]} ${d} ${meses[parseInt(m)]}`;
  }

  if (loading) return (
    <div style={{ padding:40, textAlign:"center", color:"#888", background:MARFIL_LIGHT, flex:1 }}>
      Cargando partidos...
    </div>
  );

  if (partidos.length === 0) return (
    <div style={{ padding:32, textAlign:"center", background:MARFIL_LIGHT, flex:1 }}>
      <div style={{ fontSize:40, marginBottom:12 }}>⚽</div>
      <div style={{ fontSize:14, color:BORDO, fontWeight:600 }}>No hay partidos cargados</div>
      <div style={{ fontSize:12, color:"#888", marginTop:4 }}>El administrador debe cargar los partidos</div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", background:MARFIL_LIGHT, flex:1, overflow:"hidden" }}>
      <div style={{ padding:"10px 12px 6px", background:MARFIL_LIGHT, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          background:BORDO, borderRadius:8, padding:"8px 12px" }}>
          <button onClick={() => setCurrentDay(d => Math.max(0,d-1))} disabled={currentDay===0}
            style={{ background:"none", border:"none", color:MARFIL, fontSize:22,
              padding:"0 8px", opacity:currentDay===0?0.3:1, cursor:"pointer" }}>‹</button>
          <div style={{ textAlign:"center" }}>
            <div style={{ color:MARFIL, fontSize:13, fontWeight:600 }}>{formatFecha(diaActual)}</div>
            <div style={{ color:MARFIL_DARK, fontSize:10 }}>
              {matchesDelDia[0]?.fase} · {matchesDelDia.length} partido{matchesDelDia.length!==1?"s":""}
            </div>
          </div>
          <button onClick={() => setCurrentDay(d => Math.min(dias.length-1,d+1))}
            disabled={currentDay===dias.length-1}
            style={{ background:"none", border:"none", color:MARFIL, fontSize:22,
              padding:"0 8px", opacity:currentDay===dias.length-1?0.3:1, cursor:"pointer" }}>›</button>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"0 12px 12px", position:"relative" }}>
        <div
          onClick={() => setCurrentDay(d => Math.max(0,d-1))}
          style={{ position:"fixed", left:0, top:"20%", width:40, height:"60%",
            zIndex:5, cursor:"pointer" }} />
        <div
          onClick={() => setCurrentDay(d => Math.min(dias.length-1,d+1))}
          style={{ position:"fixed", right:0, top:"20%", width:40, height:"60%",
            zIndex:5, cursor:"pointer" }} />
        {matchesDelDia.map(m => (
          <MatchCard key={m.id} match={m} userId={userId} lockHoras={lockHoras} />
        ))}
      </div>
    </div>
  );
}


function TabTabla({ onSelectUser }: { onSelectUser: (uid: string) => void }) {
  const [jugadores, setJugadores] = useState<any[]>([]);
  const [desglose, setDesglose] = useState<Record<string, { x3:number, x2:number, x1:number }>>({});
  const [viewportWidth, setViewportWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 600);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2,"0");
  const fecha = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  useEffect(() => {
    const update = () => setViewportWidth(Math.min(window.innerWidth, 600));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "usuarios"), orderBy("pts","desc"));
    return onSnapshot(q, snap => setJugadores(snap.docs.map(d => ({ id:d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    const q = query(collection(db, "pronosticos"), where("calculado", "==", true));
    return onSnapshot(q, snap => {
      const acc: Record<string, { x3:number, x2:number, x1:number }> = {};
      snap.docs.forEach(d => {
        const { userId, pts } = d.data();
        if (!userId || (pts !== 3 && pts !== 2 && pts !== 1)) return;
        if (!acc[userId]) acc[userId] = { x3:0, x2:0, x1:0 };
        if (pts === 3) acc[userId].x3++;
        else if (pts === 2) acc[userId].x2++;
        else acc[userId].x1++;
      });
      setDesglose(acc);
    });
  }, []);

  const COL_NUM = 38;
  const PADDING = 12;
  const FIXED_COL_WIDTH = 18 + 6 + 30 + 6 + 90 + 8 + 12; // #, gaps, foto, gap, nombre, padding interno
  const cardWidth = viewportWidth - PADDING * 2; // ancho de la card blanca
  const scrollAreaWidth = Math.max(cardWidth - FIXED_COL_WIDTH, 100); // lo que le queda al area scrolleable

  return (
    <div style={{ padding:PADDING, background:MARFIL_LIGHT, flex:1, width:viewportWidth, boxSizing:"border-box", overflowX:"hidden" }}>
      <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5", overflowX:"hidden", width:cardWidth }}>
        <div style={{ background:BORDO, padding:"10px 12px" }}>
          <div style={{ color:MARFIL, fontSize:12, fontWeight:600 }}>Tabla de posiciones</div>
          <div style={{ color:MARFIL_DARK, fontSize:10, marginTop:2 }}>{fecha}</div>
        </div>

        {jugadores.length === 0 && (
          <div style={{ padding:20, textAlign:"center", fontSize:12, color:"#aaa" }}>
            Aún no hay jugadores registrados
          </div>
        )}

        {jugadores.length > 0 && (
          <div style={{ display:"flex", width:cardWidth, overflowX:"hidden" }}>
            {/* Columnas fijas: #, foto, jugador */}
            <div style={{ flexShrink:0, width:FIXED_COL_WIDTH, background:"white",
              boxShadow:"2px 0 4px rgba(0,0,0,0.06)", zIndex:2 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 8px 4px 12px",
                background:BORDO_DARK, height:24 }}>
                <span style={{ fontSize:9, color:MARFIL_DARK, fontWeight:500, minWidth:18 }}>#</span>
                <span style={{ width:30 }} />
                <span style={{ fontSize:9, color:MARFIL_DARK, fontWeight:500, minWidth:90 }}>Jugador</span>
              </div>
              {jugadores.map((j, idx) => {
                const pos = idx+1;
                const tipo = tipoRacha(j);
                return (
                  <div key={j.id} onClick={() => onSelectUser(j.id)} style={{ display:"flex", alignItems:"center", gap:6,
                    padding:"8px 8px 8px 12px", borderBottom:"0.5px solid #eee", height:46, boxSizing:"border-box",
                    cursor:"pointer" }}>
                    <span style={{ fontSize:13, fontWeight:500, color:pos<=3?BORDO:"#aaa", minWidth:18 }}>{pos}</span>
                    <div style={{ position:"relative", width:30, height:30, flexShrink:0 }}>
                      <div style={{ width:30, height:30, borderRadius:"50%", border:`1.5px solid ${BORDO}`,
                        overflow:"hidden", background:MARFIL, position:"relative", zIndex:1,
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {(j.fotoPersonalizada || j.photoURL)
                          ? <img src={j.fotoPersonalizada || j.photoURL} alt={j.nick} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                          : <span style={{ fontSize:11, fontWeight:500, color:BORDO }}>{(j.ini||"?").slice(0,2)}</span>
                        }
                      </div>
                      <RachaOverlay tipo={tipo} size={30} />
                    </div>
                    <span style={{ minWidth:90, fontSize:13, overflow:"hidden", textOverflow:"ellipsis",
                      whiteSpace:"nowrap", color:"#111" }}>{j.nick||"Usuario"}</span>
                  </div>
                );
              })}
            </div>

            {/* Columnas con scroll horizontal: Pts, x3, x2, x1, +Hoy, mov */}
            <div style={{ overflowX:"auto", width:scrollAreaWidth, touchAction:"pan-x", WebkitOverflowScrolling:"touch" }}>
              <div style={{ display:"flex", gap:6, padding:"4px 12px", background:BORDO_DARK, height:24,
                boxSizing:"border-box", alignItems:"center", width:"max-content" }}>
                {["Pts","x3","x2","x1","+Hoy","▲▼"].map((h,i) => (
                  <span key={i} style={{ fontSize:9, color:MARFIL_DARK, fontWeight:500,
                    minWidth:i===0?36:i===4?32:i===5?28:COL_NUM, textAlign:"right" }}>{h}</span>
                ))}
              </div>
              {jugadores.map(j => {
                const d = desglose[j.id] || { x3:0, x2:0, x1:0 };
                const mov = j.mov || 0;
                const movEl = mov > 0
                  ? <span style={{ color:VERDE }}>▲{mov}</span>
                  : mov < 0 ? <span style={{ color:ROJO }}>▼{Math.abs(mov)}</span>
                  : <span style={{ color:"#aaa" }}>—</span>;
                return (
                  <div key={j.id} onClick={() => onSelectUser(j.id)} style={{ display:"flex", gap:6, alignItems:"center",
                    padding:"8px 12px", borderBottom:"0.5px solid #eee", height:46, boxSizing:"border-box",
                    width:"max-content", cursor:"pointer" }}>
                    <span style={{ fontSize:14, fontWeight:600, color:MARFIL, background:BORDO,
                      padding:"2px 7px", borderRadius:3, minWidth:36, textAlign:"center" }}>{j.pts||0}</span>
                    <span style={{ fontSize:13, fontWeight:500, color:BORDO, minWidth:COL_NUM, textAlign:"right" }}>{d.x3}</span>
                    <span style={{ fontSize:13, fontWeight:500, color:"#555", minWidth:COL_NUM, textAlign:"right" }}>{d.x2}</span>
                    <span style={{ fontSize:13, fontWeight:500, color:"#999", minWidth:COL_NUM, textAlign:"right" }}>{d.x1}</span>
                    <span style={{ fontSize:11, color:VERDE, minWidth:32, textAlign:"right" }}>+{j.hoy||0}</span>
                    <span style={{ fontSize:10, fontWeight:500, minWidth:28, textAlign:"right" }}>{movEl}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function prediccionesBloqueadas(): boolean {
  return new Date() >= FECHA_CIERRE_PREDICCIONES;
}

function PlayerAutocomplete({ value, onChange, categoria }: { value:string, onChange:(v:string)=>void, categoria:string }) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [jugadoresDB, setJugadoresDB] = useState<string[]>([]);

  useEffect(() => {
    getDocs(collection(db, "jugadores_predicciones")).then(snap => {
      setJugadoresDB(snap.docs.map(d => d.data().nombre));
    });
  }, []);

  const base = JUGADORES_BASE[categoria] || [];
  const todos = [...new Set([...base, ...jugadoresDB])].sort();

  function handleInput(val: string) {
    setQuery(val);
    onChange(val);
    if (val.length < 2) { setSuggestions([]); return; }
    setSuggestions(todos.filter(j => j.toLowerCase().includes(val.toLowerCase())).slice(0, 6));
  }

  async function select(nombre: string) {
    setQuery(nombre);
    onChange(nombre);
    setSuggestions([]);
    if (!base.includes(nombre) && !jugadoresDB.includes(nombre)) {
      await addDoc(collection(db, "jugadores_predicciones"), { nombre, categoria, createdAt: serverTimestamp() });
    }
  }

  async function handleBlur() {
    setSuggestions([]);
    const nombre = query.trim();
    if (nombre.length < 2) return;
    if (!base.includes(nombre) && !jugadoresDB.includes(nombre)) {
      await addDoc(collection(db, "jugadores_predicciones"), { nombre, categoria, createdAt: serverTimestamp() });
    }
  }

  return (
    <div style={{ position:"relative" }}>
      <input value={query} onChange={e => handleInput(e.target.value)}
        onBlur={handleBlur}
        placeholder="Escribí un nombre..."
        disabled={prediccionesBloqueadas()}
        style={{ ...inputStyle(), opacity: prediccionesBloqueadas() ? 0.6 : 1 }} />
      {suggestions.length > 0 && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:20,
          background:"white", border:`1px solid ${BORDO_LIGHT}`, borderRadius:6,
          boxShadow:"0 4px 12px rgba(0,0,0,0.15)", overflow:"hidden" }}>
          {suggestions.map(s => (
            <div key={s} onMouseDown={e => { e.preventDefault(); select(s); }}
              style={{ padding:"9px 12px", borderBottom:"0.5px solid #eee",
                cursor:"pointer", fontSize:13, color:BORDO }}>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MisPredicciones({ userId, onBack }: { userId:string, onBack:()=>void }) {
  const [preds, setPreds] = useState<Record<string,string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [resultadosOficiales, setResultadosOficiales] = useState<Record<string,string>>({});
  const [misAciertos, setMisAciertos] = useState<string[]>([]);
  const bloqueado = prediccionesBloqueadas();
  const fechaCierre = "Jueves 11 de Junio a las 15:00 hs";

  useEffect(() => {
    getDoc(doc(db, "predicciones", userId)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setPreds(data as Record<string,string>);
        setMisAciertos(data.aciertos || []);
      }
    });
    getDoc(doc(db, "config", "resultados_premios")).then(snap => {
      if (snap.exists() && snap.data().calculado) {
        setResultadosOficiales(snap.data() as Record<string,string>);
      }
    });
  }, [userId]);

  async function guardar() {
    setSaving(true);
    await setDoc(doc(db, "predicciones", userId), { ...preds, updatedAt: serverTimestamp() });
    setMsg("✓ Predicciones guardadas");
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  }

  return (
    <div style={{ padding:12, background:MARFIL_LIGHT, flex:1 }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:BORDO,
        fontSize:12, marginBottom:12, display:"flex", alignItems:"center", gap:4 }}>
        ← Volver al perfil
      </button>
      <div style={{ fontSize:14, fontWeight:600, color:BORDO, marginBottom:4 }}>
        🏆 Predicciones del torneo
      </div>

      <div style={{ background: bloqueado ? "#fce4ec" : MARFIL_LIGHT,
        border:`0.5px solid ${bloqueado ? ROJO : BORDO_LIGHT}`,
        borderRadius:8, padding:"10px 12px", marginBottom:14, fontSize:11 }}>
        {bloqueado
          ? <span style={{ color:ROJO, fontWeight:500 }}>🔒 Las predicciones están cerradas desde el {fechaCierre}. Solo el administrador puede modificarlas.</span>
          : <span style={{ color:BORDO }}>⏰ Podés editar tus predicciones hasta el <strong>{fechaCierre}</strong>. Después no será posible.</span>
        }
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {PREDICCIONES_CATEGORIAS.map(cat => (
          <div key={cat.id} style={{ background:"white", borderRadius:12,
            border:"0.5px solid #e0ddd5", padding:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
              <span style={{ fontSize:18 }}>{cat.emoji}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:BORDO }}>{cat.label}</div>
                <div style={{ fontSize:10, color:"#888" }}>{cat.pts} puntos si acertás</div>
              </div>
            </div>
            {cat.tipo === "pais" ? (
              <TeamAutocomplete
                value={preds[cat.id] || ""}
                onChange={v => setPreds(p => ({...p, [cat.id]: v}))}
                placeholder="Buscá un país..."
              />
            ) : (
              <PlayerAutocomplete
                value={preds[cat.id] || ""}
                onChange={v => setPreds(p => ({...p, [cat.id]: v}))}
                categoria={cat.id}
              />
            )}
            {preds[cat.id] && (
              <div style={{ fontSize:11, color:VERDE, marginTop:4 }}>
                Tu predicción: <strong>{preds[cat.id]}</strong>
              </div>
            )}
          </div>
        ))}
      </div>

      {Object.keys(resultadosOficiales).length > 0 && (
        <div style={{ background:"white", borderRadius:12, border:`1.5px solid ${VERDE}`,
          padding:14, marginTop:14 }}>
          <div style={{ fontSize:12, fontWeight:600, color:VERDE, marginBottom:10 }}>
            🏆 Resultados oficiales
          </div>
          {PREDICCIONES_CATEGORIAS.map(cat => {
            const ganador = resultadosOficiales[cat.id];
            if (!ganador) return null;
            const acerte = misAciertos.includes(cat.id);
            return (
              <div key={cat.id} style={{ display:"flex", alignItems:"center",
                gap:8, padding:"7px 0", borderBottom:"0.5px solid #eee" }}>
                <span style={{ fontSize:14 }}>{cat.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, color:"#888" }}>{cat.label}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:"#111" }}>{ganador}</div>
                </div>
                {acerte
                  ? <span style={{ background:VERDE, color:"white", fontSize:10,
                      padding:"2px 8px", borderRadius:20, fontWeight:600 }}>
                      +{cat.pts} ✓
                    </span>
                  : preds[cat.id]
                    ? <span style={{ background:"#eee", color:"#888", fontSize:10,
                        padding:"2px 8px", borderRadius:20 }}>
                        {preds[cat.id]}
                      </span>
                    : null
                }
              </div>
            );
          })}
          <div style={{ fontSize:11, color:VERDE, fontWeight:600, marginTop:8, textAlign:"center" }}>
            Acertaste {misAciertos.length} de {PREDICCIONES_CATEGORIAS.length} premios
            {" "}(+{misAciertos.reduce((acc, id) => acc + (PREDICCIONES_CATEGORIAS.find(c=>c.id===id)?.pts||0), 0)} pts)
          </div>
        </div>
      )}

      {!bloqueado && (
        <button onClick={guardar} disabled={saving}
          style={{ width:"100%", marginTop:14, background:BORDO, color:MARFIL,
            border:"none", borderRadius:8, padding:12, fontSize:14,
            fontWeight:600, opacity:saving?0.7:1 }}>
          {saving ? "Guardando..." : "Guardar predicciones"}
        </button>
      )}
      {msg && <div style={{ color:VERDE, fontSize:12, textAlign:"center", marginTop:8 }}>{msg}</div>}
    </div>
  );
}

function TabTendencias() {
  const [partidos, setPartidos] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "partidos"), orderBy("fecha"), orderBy("hora"));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id:d.id, ...d.data() })) as any[];
      const sinResultado = data.filter((p:any) =>
        p.localN !== "Por definir" && p.visitaN !== "Por definir" &&
        (p.gL === null || p.gL === undefined)
      );
      setPartidos(sinResultado);
      if (sinResultado.length > 0 && !selectedId) setSelectedId(sinResultado[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    calcularStats(selectedId);
  }, [selectedId]);

  async function calcularStats(matchId: string) {
    setLoadingStats(true);
    const pronosSnap = await getDocs(collection(db, "pronosticos"));
    const delPartido = pronosSnap.docs
      .filter(d => d.data().matchId === matchId)
      .map(d => d.data());

    if (delPartido.length === 0) { setStats(null); setLoadingStats(false); return; }

    let votos = { local:0, empate:0, visita:0 };
    let sumL = 0, sumV = 0;
    let masAbultado = { score:"", diff:0, quien:"" };
    let optimista = { score:"", total:0, quien:"" };
    const conteoScores: Record<string,number> = {};

    const partido = partidos.find(p => p.id === matchId);

    for (const p of delPartido) {
      const { mL, mV } = p;
      if (mL === null || mV === null) continue;
      if (mL > mV) votos.local++;
      else if (mV > mL) votos.visita++;
      else votos.empate++;
      sumL += mL; sumV += mV;
      const score = `${mL}-${mV}`;
      conteoScores[score] = (conteoScores[score] || 0) + 1;
      const diff = Math.abs(mL - mV);
      if (diff > masAbultado.diff) masAbultado = { score, diff, quien: p.userId };
      const total = mL + mV;
      if (total > optimista.total) optimista = { score, total, quien: p.userId };
    }

    const n = delPartido.length;
    const promedioL = n > 0 ? sumL/n : 0;
    const promedioV = n > 0 ? sumV/n : 0;
    const masVotadoScore = Object.entries(conteoScores).sort((a,b) => b[1]-a[1])[0];

    const usuariosSnap = await getDocs(collection(db, "usuarios"));
    const usuariosMap: Record<string,string> = {};
    usuariosSnap.docs.forEach(d => { usuariosMap[d.id] = d.data().nick || "Usuario"; });

    const totalVotos = votos.local + votos.empate + votos.visita;
    const maxVotos = Math.max(votos.local, votos.empate, votos.visita);
    const pctAcuerdo = totalVotos > 0 ? Math.round(maxVotos/totalVotos*100) : 0;

    setStats({
      partido, votos, promedioL, promedioV, totalVotos, pctAcuerdo,
      masVotado: masVotadoScore ? { score:masVotadoScore[0], votos:masVotadoScore[1] } : null,
      masAbultado: { ...masAbultado, quien: usuariosMap[masAbultado.quien] || masAbultado.quien },
      optimista: { ...optimista, quien: usuariosMap[optimista.quien] || optimista.quien },
    });
    setLoadingStats(false);
  }

  function acuerdoConfig(votos: {local:number, empate:number, visita:number}) {
    const total = votos.local + votos.empate + votos.visita;
    if (total === 0) return { label:"¡Picante!", sub:"Cada uno en su propio mundo", icon:"🌶️", bg:"#fce4ec", color:"#c62828" };

    const valores = [votos.local, votos.empate, votos.visita].sort((a,b) => b-a);
    const pctMax = Math.round(valores[0]/total*100);
    const pct2do = Math.round(valores[1]/total*100);
    const pctTopDos = pctMax + pct2do;
    const diffTopDos = pctMax - pct2do;

    // Consenso claro: una sola opción domina con 80%+
    if (pctMax >= 80) return { label:"Consenso", sub:"El grupo lo tiene clarísimo", icon:"✅", bg:"#e8f5e9", color:"#2e7d32" };

    // Picante: nadie supera 35% solo (dispersión total), O dos opciones parejas (diff<=10pp) suman 80%+ (dos bandos reales)
    const dosBandos = diffTopDos <= 10 && pctTopDos >= 80;
    if (pctMax < 35 || dosBandos) {
      return { label:"¡Picante!", sub:"Cada uno en su propio mundo", icon:"🌶️", bg:"#fce4ec", color:"#c62828" };
    }

    return { label:"Peleado", sub:"Hay para todos los gustos 🤷", icon:"🤔", bg:"#fff8e1", color:"#f57f17" };
  }

  function Donut({ vL, vE, vV }: { vL:number, vE:number, vV:number }) {
    const total = vL+vE+vV;
    if (total===0) return null;
    const pL=vL/total, pE=vE/total, pV=vV/total;
    const r=38, cx=50, cy=50;

    function arc(startPct: number, endPct: number) {
      if (endPct - startPct < 0.0001) return null;
      // Full circle case
      if (endPct - startPct >= 0.9999) {
        return `M${cx},${cy-r} A${r},${r} 0 1,1 ${cx-0.001},${cy-r} Z`;
      }
      const a1=(startPct*2*Math.PI)-Math.PI/2;
      const a2=(endPct*2*Math.PI)-Math.PI/2;
      const x1=cx+r*Math.cos(a1), y1=cy+r*Math.sin(a1);
      const x2=cx+r*Math.cos(a2), y2=cy+r*Math.sin(a2);
      const lg=(endPct-startPct)>0.5?1:0;
      return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2} Z`;
    }

    const s1 = arc(0, pL);
    const s2 = arc(pL, pL+pE);
    const s3 = arc(pL+pE, pL+pE+pV);

    // Determine what % to show in center (largest segment)
    const maxPct = Math.max(pL, pE, pV);
    const maxLabel = maxPct===pL ? `${Math.round(pL*100)}%` : maxPct===pE ? `${Math.round(pE*100)}%` : `${Math.round(pV*100)}%`;
    const maxSub = maxPct===pL ? "local" : maxPct===pE ? "empate" : "visita";

    return (
      <svg viewBox="0 0 100 100" width={86} height={86}>
        {s1 && <path d={s1} fill={BORDO}/>}
        {s2 && <path d={s2} fill={MARFIL_DARK}/>}
        {s3 && <path d={s3} fill={MARFIL} stroke="#ddd" strokeWidth="0.5"/>}
        <circle cx={cx} cy={cy} r={22} fill="white"/>
        <text x={cx} y={cy-4} textAnchor="middle" fontSize={8} fill="#888">{maxSub}</text>
        <text x={cx} y={cy+8} textAnchor="middle" fontSize={12} fontWeight="bold" fill={BORDO}>
          {maxLabel}
        </text>
      </svg>
    );
  }

return (
    <div style={{ padding:12, background:MARFIL_LIGHT, flex:1 }}>
      <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
        style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${BORDO_LIGHT}`,
          borderRadius:8, fontSize:12, color:BORDO, background:MARFIL_LIGHT, marginBottom:10 }}>
        {partidos.map(p => (
          <option key={p.id} value={p.id}>
            {p.localN} vs {p.visitaN} — {p.fecha?.slice(5).replace("-","/")} {p.hora}
          </option>
        ))}
      </select>

      {loadingStats && (
        <div style={{ textAlign:"center", padding:30, color:"#888" }}>Calculando tendencias...</div>
      )}

      {!loadingStats && !stats && (
        <div style={{ textAlign:"center", padding:30 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>📊</div>
          <div style={{ fontSize:13, color:BORDO, fontWeight:600 }}>Sin pronósticos aún</div>
          <div style={{ fontSize:11, color:"#888", marginTop:4 }}>Nadie pronosticó este partido todavía</div>
        </div>
      )}

      {!loadingStats && stats && (() => {
        const ac = acuerdoConfig(stats.votos);
        const maxBar = Math.max(stats.promedioL, stats.promedioV, 2);
        return (
          <>
            <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5",
              padding:14, marginBottom:10 }}>
              <div style={{ background:ac.bg, borderRadius:10, padding:"12px 14px",
                display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ fontSize:36 }}>{ac.icon}</div>
                <div>
                  <div style={{ fontSize:19, fontWeight:700, color:ac.color }}>{ac.label}</div>
                  <div style={{ fontSize:11, color:ac.color, opacity:0.85, marginTop:1 }}>{ac.sub}</div>
                  <div style={{ fontSize:10, color:ac.color, opacity:0.6, marginTop:3 }}>
                    {stats.pctAcuerdo}% de acuerdo · {stats.totalVotos} pronósticos
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5",
              padding:14, marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:700, color:BORDO, marginBottom:10,
                textTransform:"uppercase", letterSpacing:"0.5px" }}>¿Quién gana?</div>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <Donut vL={stats.votos.local} vE={stats.votos.empate} vV={stats.votos.visita} />
                <div style={{ flex:1 }}>
                  {[
                    { label:`${stats.partido?.localN}`, color:BORDO, votos:stats.votos.local },
                    { label:"Empate", color:MARFIL_DARK, votos:stats.votos.empate },
                    { label:`${stats.partido?.visitaN}`, color:"#ccc", votos:stats.votos.visita },
                  ].map(row => (
                    <div key={row.label} style={{ display:"flex", alignItems:"center",
                      gap:7, marginBottom:8 }}>
                      <div style={{ width:10, height:10, borderRadius:"50%",
                        background:row.color, border: row.color==="#ccc"?"1px solid #bbb":"none",
                        flexShrink:0 }}/>
                      <div style={{ fontSize:11, color:"#555", flex:1 }}>{row.label}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:BORDO }}>
                        {stats.totalVotos > 0 ? Math.round(row.votos/stats.totalVotos*100) : 0}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5",
              padding:14, marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:700, color:BORDO, marginBottom:10,
                textTransform:"uppercase", letterSpacing:"0.5px" }}>⚽ Promedio de goles</div>
              {[
                { pais:stats.partido?.localN, avg:stats.promedioL },
                { pais:stats.partido?.visitaN, avg:stats.promedioV },
              ].map(row => (
                <div key={row.pais} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:5 }}>
                    <FlagImg pais={row.pais} size={16} />
                    <span style={{ fontSize:12, fontWeight:500, color:BORDO }}>{row.pais}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:BORDO, marginLeft:"auto" }}>
                      {row.avg.toFixed(1)}
                    </span>
                  </div>
                  <div style={{ width:"100%", height:10, background:"#eee", borderRadius:5, overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:5, background:BORDO,
                      width:`${Math.round(row.avg/maxBar*100)}%`,
                      transition:"width 0.3s ease" }}/>
                  </div>
                </div>
              ))}
            </div>

            {stats.masVotado && (
              <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5",
                padding:14, marginBottom:10 }}>
                <div style={{ fontSize:10, fontWeight:700, color:BORDO, marginBottom:10,
                  textTransform:"uppercase", letterSpacing:"0.5px" }}>🏆 Resultado más votado</div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                  background:MARFIL_LIGHT, borderRadius:8, padding:"10px 14px" }}>
                  <div>
                    <div style={{ fontSize:10, color:"#888", marginBottom:4 }}>
                      {stats.partido?.localN} — {stats.partido?.visitaN}
                    </div>
                    <div style={{ fontSize:26, fontWeight:700, color:BORDO }}>{stats.masVotado.score}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:24, fontWeight:700, color:BORDO }}>{stats.masVotado.votos}</div>
                    <div style={{ fontSize:10, color:"#888" }}>jugadores</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5",
              padding:14, marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:700, color:BORDO, marginBottom:10,
                textTransform:"uppercase", letterSpacing:"0.5px" }}>Más destacados</div>
              {[
                { icon:"📊", label:"Resultado más abultado", score:stats.masAbultado.score, quien:stats.masAbultado.quien },
                { icon:"😎", label:`El más optimista (${stats.optimista.total} goles)`, score:stats.optimista.score, quien:stats.optimista.quien },
              ].map(row => (
                <div key={row.label} style={{ display:"flex", alignItems:"center", gap:10,
                  padding:"9px 0", borderBottom:"0.5px solid #eee" }}
                  className="last-no-border">
                  <div style={{ fontSize:20, width:32, textAlign:"center" }}>{row.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:"#888" }}>{row.label}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:BORDO }}>{row.score || "—"}</div>
                  </div>
                  <div style={{ fontSize:11, color:"#aaa" }}>{row.quien || "—"}</div>
                </div>
              ))}
            </div>
          </>
        );
      })()}

      <PrediccionesTorneo />
    </div>
  );
}

function PrediccionesTorneo() {
  const [preds, setPreds] = useState<Record<string, Record<string,number>>>({});
  const [usuarios, setUsuarios] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, "predicciones")),
      getDocs(collection(db, "usuarios")),
    ]).then(([predsSnap, usuariosSnap]) => {
      const u: Record<string,string> = {};
      usuariosSnap.docs.forEach(d => { u[d.id] = d.data().nick || "?"; });
      setUsuarios(u);
      const p: Record<string, Record<string,number>> = {};
      predsSnap.docs.forEach(d => {
        const data = d.data();
        PREDICCIONES_CATEGORIAS.forEach(cat => {
          if (data[cat.id]) {
            if (!p[cat.id]) p[cat.id] = {};
            p[cat.id][data[cat.id]] = (p[cat.id][data[cat.id]] || 0) + 1;
          }
        });
      });
      setPreds(p);
      setLoading(false);
    });
  }, []);

  const total = Object.keys(usuarios).length;
  if (loading || Object.keys(preds).length === 0) return null;

  return (
    <div style={{ marginTop:10 }}>
      <div style={{ fontSize:10, fontWeight:700, color:BORDO, marginBottom:8,
        textTransform:"uppercase", letterSpacing:"0.5px" }}>
        🏆 Predicciones de la Copa
      </div>
      {PREDICCIONES_CATEGORIAS.map(cat => {
        const votos = preds[cat.id] || {};
        if (Object.keys(votos).length === 0) return null;
        const sorted = Object.entries(votos).sort((a,b) => b[1]-a[1]);
        const top = sorted[0];
        return (
          <div key={cat.id} style={{ background:"white", borderRadius:12,
            border:"0.5px solid #e0ddd5", padding:14, marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
              <span style={{ fontSize:16 }}>{cat.emoji}</span>
              <div style={{ fontSize:11, fontWeight:700, color:BORDO,
                textTransform:"uppercase", letterSpacing:"0.5px" }}>{cat.label}</div>
            </div>
            {sorted.slice(0, cat.id === "campeon" ? 5 : 3).map(([nombre, votos_n], i) => (
              <div key={nombre} style={{ display:"flex", alignItems:"center",
                gap:8, marginBottom:6 }}>
                <div style={{ width:20, height:20, borderRadius:"50%",
                  background: i===0?BORDO:MARFIL_LIGHT,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:10, fontWeight:600, color: i===0?MARFIL:BORDO,
                  flexShrink:0 }}>{i+1}</div>
                {cat.tipo === "pais" && <FlagImg pais={nombre} size={16} />}
                <span style={{ flex:1, fontSize:12, color:"#333" }}>{nombre}</span>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <div style={{ height:6, width:`${Math.round(votos_n/top[1]*60)}px`,
                    background: i===0?BORDO:MARFIL_DARK, borderRadius:3 }}/>
                  <span style={{ fontSize:11, color:"#888" }}>{votos_n}</span>
                </div>
              </div>
            ))}
            {total > 0 && (
              <div style={{ fontSize:10, color:"#aaa", marginTop:4 }}>
                {Object.keys(votos).length} opciones distintas · {Object.values(votos).reduce((a,b)=>a+b,0)} votos
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


function ImportarCSV({ onClose }: { onClose: ()=>void }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState<any[]>([]);
  const [datos, setDatos] = useState<any[]>([]);

  function parsearCSV(text: string): any[] {
    const lines = text.split("\n").filter(l => l.trim());
    const result: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g,""));
      if (cols.length < 6) continue;
      const [fecha,hora,fase,grupo,localN,visitaN] = cols;
      if (!fecha||!hora||!fase||!localN||!visitaN) continue;
      if (fecha.toLowerCase()==="fecha") continue;
      result.push({ fecha:fecha.trim(), hora:hora.trim().slice(0,5), fase:fase.trim(),
        grupo:grupo.trim(), localN:localN.trim(), visitaN:visitaN.trim(), gL:null, gV:null });
    }
    return result;
  }

  async function leerArchivo(file: File) {
    setMsg(""); setPreview([]); setDatos([]);
    try {
      const buf = await file.arrayBuffer();
      const decoder = new TextDecoder("utf-8");
      let text = decoder.decode(buf);
      if (text.charCodeAt(0)===0xFEFF) text=text.slice(1);
      const parsed = parsearCSV(text);
      if (parsed.length===0) { setMsg("No se encontraron datos."); return; }
      setDatos(parsed); setPreview(parsed.slice(0,5));
      setMsg(`✓ ${parsed.length} partidos detectados. Revisá la previa y confirmá.`);
    } catch { setMsg("Error al leer el archivo."); }
  }

  async function importar() {
    if (datos.length===0) return;
    setLoading(true); setMsg("Importando...");
    try {
      let ok = 0;
      for (const p of datos) {
        await addDoc(collection(db,"partidos"), { ...p, createdAt:serverTimestamp() });
        ok++;
        if (ok%10===0) setMsg(`Importando... ${ok}/${datos.length}`);
      }
      setMsg(`✓ ${ok} partidos importados.`);
      setPreview([]); setDatos([]);
    } catch { setMsg("Error al guardar. Intentá de nuevo."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5", padding:14, marginBottom:10 }}>
      <div style={{ fontSize:12, fontWeight:600, color:BORDO, marginBottom:8 }}>📊 Importar desde CSV</div>
      <div style={{ background:MARFIL_LIGHT, border:`0.5px solid ${BORDO_LIGHT}`, borderRadius:6,
        padding:"8px 10px", marginBottom:10, fontSize:10, color:BORDO_DARK }}>
        Subí el archivo <strong>.csv</strong> con columnas: Fecha, Horario, Fase, Grupo, País Local, País Visitante
      </div>
      <input type="file" accept=".csv"
        onChange={e => e.target.files?.[0] && leerArchivo(e.target.files[0])}
        style={{ fontSize:12, marginBottom:10, width:"100%" }} />
      {preview.length > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:10, color:"#888", marginBottom:4 }}>Previa (primeros 5):</div>
          {preview.map((p,i) => (
            <div key={i} style={{ fontSize:10, padding:"3px 0", borderBottom:"0.5px solid #eee", color:"#333" }}>
              {p.fecha} · {p.hora} · {p.fase} {p.grupo?`Gr.${p.grupo}`:""} · {p.localN} vs {p.visitaN}
            </div>
          ))}
        </div>
      )}
      {msg && <div style={{ fontSize:11, color:msg.startsWith("✓")?VERDE:msg.startsWith("Importando")?BORDO:ROJO, marginBottom:8 }}>{msg}</div>}
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onClose} style={{ flex:1, background:"none", border:"1px solid #ccc", borderRadius:6, padding:8, fontSize:12, color:"#666" }}>Cancelar</button>
        <button onClick={importar} disabled={datos.length===0||loading}
          style={{ flex:2, background:BORDO, color:MARFIL, border:"none", borderRadius:6, padding:8, fontSize:12, fontWeight:600, opacity:datos.length===0||loading?0.4:1 }}>
          {loading?"Importando...":`Importar ${datos.length>0?datos.length:""} partidos`}
        </button>
      </div>
    </div>
  );
}

function TeamAutocomplete({ value, onChange, placeholder }: { value:string, onChange:(v:string)=>void, placeholder:string }) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [equiposDB, setEquiposDB] = useState<string[]>([]);

  useEffect(() => {
    getDocs(collection(db, "equipos")).then(snap => {
      setEquiposDB(snap.docs.map(d => d.data().nombre));
    });
  }, []);

  const todosLosEquipos = [...new Set([...Object.keys(PAISES), ...equiposDB])].sort();

  function handleInput(val: string) {
    setQuery(val);
    if (val.length < 2) { setSuggestions([]); return; }
    const filtered = todosLosEquipos.filter(e =>
      e.toLowerCase().includes(val.toLowerCase()) && e !== "Por definir"
    ).slice(0, 6);
    setSuggestions(filtered);
  }

  function select(nombre: string) {
    setQuery(nombre);
    onChange(nombre);
    setSuggestions([]);
  }

  return (
    <div style={{ position:"relative" }}>
      <input
        value={query}
        onChange={e => handleInput(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle(), paddingLeft:10 }}
      />
      {suggestions.length > 0 && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:20,
          background:"white", border:`1px solid ${BORDO_LIGHT}`, borderRadius:6,
          boxShadow:"0 4px 12px rgba(0,0,0,0.15)", overflow:"hidden" }}>
          {suggestions.map(s => (
            <div key={s} onMouseDown={e => { e.preventDefault(); select(s); }}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px",
                borderBottom:"0.5px solid #eee", cursor:"pointer" }}>
              <FlagImg pais={s} size={18} />
              <span style={{ fontSize:13, color:BORDO }}>{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GestionEquipos({ onBack }: { onBack:()=>void }) {
  const [equipos, setEquipos] = useState<any[]>([]);
  const [nombre, setNombre] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return onSnapshot(collection(db, "equipos"), snap => {
      setEquipos(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    });
  }, []);

  async function agregar() {
    if (!nombre.trim()) return;
    setLoading(true);
    await addDoc(collection(db, "equipos"), {
      nombre: nombre.trim(),
      imageUrl: imageUrl.trim() || "",
      createdAt: serverTimestamp()
    });
    setNombre(""); setImageUrl("");
    setMsg("✓ Equipo agregado");
    setLoading(false);
    setTimeout(() => setMsg(""), 3000);
  }

  async function eliminar(id: string) {
    await deleteDoc(doc(db, "equipos", id));
  }

  return (
    <div style={{ padding:12, background:MARFIL_LIGHT, flex:1 }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:BORDO,
        fontSize:12, marginBottom:12, display:"flex", alignItems:"center", gap:4 }}>
        ← Volver al panel
      </button>
      <div style={{ fontSize:12, fontWeight:600, color:BORDO, marginBottom:10 }}>⚽ Gestión de equipos</div>
      <div style={{ fontSize:10, color:"#888", marginBottom:12 }}>
        Agregá equipos para usar en futuros prodes (Champions, ligas, etc.)
        Los países del Mundial ya están disponibles automáticamente.
      </div>

      {msg && <div style={{ background:VERDE, color:"white", borderRadius:6,
        padding:"8px 12px", fontSize:12, marginBottom:10 }}>{msg}</div>}

      <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5", padding:14, marginBottom:10 }}>
        <div style={{ fontSize:12, fontWeight:600, color:BORDO, marginBottom:10 }}>➕ Nuevo equipo</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div>
            <div style={{ fontSize:10, color:"#888", marginBottom:3 }}>Nombre del equipo</div>
            <input value={nombre} onChange={e=>setNombre(e.target.value)}
              placeholder="Ej: Real Madrid" style={inputStyle()} />
          </div>
          <div>
            <div style={{ fontSize:10, color:"#888", marginBottom:3 }}>URL del escudo (opcional)</div>
            <input value={imageUrl} onChange={e=>setImageUrl(e.target.value)}
              placeholder="https://i.imgur.com/..." style={inputStyle()} />
          </div>
          {imageUrl && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <img src={imageUrl} alt="preview" style={{ width:32, height:32, objectFit:"contain", borderRadius:4 }}
                onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
              <span style={{ fontSize:11, color:"#888" }}>Preview del escudo</span>
            </div>
          )}
          <button onClick={agregar} disabled={!nombre.trim()||loading}
            style={{ background:BORDO, color:MARFIL, border:"none", borderRadius:6,
              padding:10, fontSize:13, fontWeight:600, opacity:!nombre.trim()?0.4:1 }}>
            {loading?"Guardando...":"Agregar equipo"}
          </button>
        </div>
      </div>

      {equipos.length > 0 && (
        <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5", overflow:"hidden" }}>
          <div style={{ background:BORDO_DARK, padding:"8px 12px" }}>
            <span style={{ color:MARFIL, fontSize:12, fontWeight:600 }}>Equipos cargados ({equipos.length})</span>
          </div>
          {equipos.map((e, i) => (
            <div key={e.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
              borderBottom: i<equipos.length-1?"0.5px solid #eee":"none" }}>
              {e.imageUrl
                ? <img src={e.imageUrl} alt={e.nombre} style={{ width:26, height:26, objectFit:"contain", borderRadius:3 }} />
                : <div style={{ width:26, height:26, background:MARFIL, borderRadius:3,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:10, color:BORDO, fontWeight:600 }}>{e.nombre.slice(0,2).toUpperCase()}</div>
              }
              <span style={{ flex:1, fontSize:13 }}>{e.nombre}</span>
              <button onClick={() => eliminar(e.id)}
                style={{ background:"none", border:`1px solid ${ROJO}`, borderRadius:4,
                  padding:"3px 8px", fontSize:11, color:ROJO, cursor:"pointer" }}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function FormPartido({ onSave, onCancel, initial }: { onSave:(d:any)=>void, onCancel:()=>void, initial?:any }) {
  const [form, setForm] = useState({
    fecha:initial?.fecha||"", hora:initial?.hora||"",
    fase:initial?.fase||"Grupos", grupo:initial?.grupo||"",
    localN:initial?.localN||"", visitaN:initial?.visitaN||"",
  });
  const set = (k:string,v:string) => setForm(f=>({...f,[k]:v}));
  const fases = ["Grupos","Round of 32","Octavos","Cuartos","Semifinal","Tercer puesto","Final"];
  return (
    <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5", padding:14, marginBottom:10 }}>
      <div style={{ fontSize:12, fontWeight:600, color:BORDO, marginBottom:10 }}>
        {initial?"✏️ Editar partido":"➕ Nuevo partido"}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <div><div style={{ fontSize:10, color:"#888", marginBottom:3 }}>Fecha</div>
            <input type="date" value={form.fecha} onChange={e=>set("fecha",e.target.value)} style={inputStyle()} /></div>
          <div><div style={{ fontSize:10, color:"#888", marginBottom:3 }}>Horario</div>
            <input type="time" value={form.hora} onChange={e=>set("hora",e.target.value)} style={inputStyle()} /></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <div><div style={{ fontSize:10, color:"#888", marginBottom:3 }}>Fase</div>
            <select value={form.fase} onChange={e=>set("fase",e.target.value)} style={{...inputStyle(),padding:"0 6px"}}>
              {fases.map(f=><option key={f}>{f}</option>)}</select></div>
          <div><div style={{ fontSize:10, color:"#888", marginBottom:3 }}>Grupo</div>
            <input placeholder="A" value={form.grupo} onChange={e=>set("grupo",e.target.value)} style={inputStyle()} /></div>
        </div>
        <div><div style={{ fontSize:10, color:"#888", marginBottom:3 }}>País / Equipo local</div>
          <TeamAutocomplete value={form.localN} onChange={v=>set("localN",v)} placeholder="Buscá un equipo..." /></div>
        <div><div style={{ fontSize:10, color:"#888", marginBottom:3 }}>País / Equipo visitante</div>
          <TeamAutocomplete value={form.visitaN} onChange={v=>set("visitaN",v)} placeholder="Buscá un equipo..." /></div>
        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          <button onClick={onCancel} style={{ flex:1, background:"none", border:`1px solid ${BORDO_LIGHT}`, borderRadius:6, padding:9, fontSize:12, color:BORDO }}>Cancelar</button>
          <button onClick={()=>onSave(form)} style={{ flex:2, background:BORDO, color:MARFIL, border:"none", borderRadius:6, padding:9, fontSize:12, fontWeight:600 }}>
            {initial?"Guardar cambios":"Agregar partido"}</button>
        </div>
      </div>
    </div>
  );
}

function FormResultado({ partidos, onClose }: { partidos:any[], onClose:()=>void }) {
  const [matchId, setMatchId] = useState("");
  const [gL, setGL] = useState("");
  const [gV, setGV] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const sinResultado = partidos.filter(p => p.gL===undefined||p.gL===null);

  async function guardar() {
    if (!matchId||gL===""||gV==="") return;
    setSaving(true);
    const gLNum=parseInt(gL), gVNum=parseInt(gV);
    await setDoc(doc(db,"partidos",matchId), { gL:gLNum, gV:gVNum }, { merge:true });
    await calcularPuntosPartido(matchId, gLNum, gVNum);
    setMsg("✓ Resultado guardado y puntos calculados");
    setMatchId(""); setGL(""); setGV(""); setSaving(false);
    setTimeout(()=>setMsg(""),4000);
  }

  return (
    <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5", padding:14, marginBottom:10 }}>
      <div style={{ fontSize:12, fontWeight:600, color:BORDO, marginBottom:10 }}>✏️ Cargar resultado</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        <div><div style={{ fontSize:10, color:"#888", marginBottom:3 }}>Partido</div>
          <select value={matchId} onChange={e=>setMatchId(e.target.value)} style={{...inputStyle(),padding:"0 6px"}}>
            <option value="">Seleccioná un partido...</option>
            {sinResultado.map(p=><option key={p.id} value={p.id}>{p.localN} vs {p.visitaN} ({p.fecha})</option>)}
          </select></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <div><div style={{ fontSize:10, color:"#888", marginBottom:3 }}>Goles local</div>
            <input type="number" min="0" max="20" value={gL} onChange={e=>setGL(e.target.value)} placeholder="0" style={{...inputStyle(),textAlign:"center"}} /></div>
          <div><div style={{ fontSize:10, color:"#888", marginBottom:3 }}>Goles visitante</div>
            <input type="number" min="0" max="20" value={gV} onChange={e=>setGV(e.target.value)} placeholder="0" style={{...inputStyle(),textAlign:"center"}} /></div>
        </div>
        <button onClick={guardar} disabled={saving||!matchId||gL===""||gV===""} style={{ background:BORDO, color:MARFIL, border:"none", borderRadius:6, padding:10, fontSize:13, fontWeight:600, opacity:(!matchId||gL===""||gV==="")?0.4:1 }}>
          {saving?"Guardando...":"Guardar resultado"}</button>
        {msg&&<div style={{ color:VERDE, fontSize:12, textAlign:"center" }}>{msg}</div>}
        <button onClick={onClose} style={{ background:"none", border:"none", fontSize:11, color:"#888" }}>Cerrar</button>
      </div>
    </div>
  );
}

function ResultadosPremios({ onClose }: { onClose:()=>void }) {
  const [resultados, setResultados] = useState<Record<string,string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [yaCalculado, setYaCalculado] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "config", "resultados_premios")).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setResultados(data);
        setYaCalculado(data.calculado === true);
      }
    });
  }, []);

  async function guardarYCalcular() {
    const sinCompletar = PREDICCIONES_CATEGORIAS.filter(c => !resultados[c.id]);
    if (sinCompletar.length > 0) {
      setMsg(`Falta cargar: ${sinCompletar.map(c => c.label).join(", ")}`);
      return;
    }
    setSaving(true);
    setMsg("Calculando puntos...");
    await calcularPuntosPredicciones(resultados);
    setMsg("✓ Resultados guardados y puntos calculados");
    setYaCalculado(true);
    setSaving(false);
  }

  return (
    <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5", padding:14, marginBottom:10 }}>
      <div style={{ fontSize:12, fontWeight:600, color:BORDO, marginBottom:10 }}>🏆 Resultados de premios</div>
      {yaCalculado && (
        <div style={{ background:"#e8f5e9", borderRadius:6, padding:"8px 10px",
          fontSize:11, color:VERDE, marginBottom:10 }}>
          ✓ Ya se calcularon los puntos. Podés actualizar si hay correcciones.
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {PREDICCIONES_CATEGORIAS.map(cat => (
          <div key={cat.id}>
            <div style={{ fontSize:10, color:"#888", marginBottom:3 }}>
              {cat.emoji} {cat.label} ({cat.pts} pts)
            </div>
            {cat.tipo === "pais" ? (
              <TeamAutocomplete
                value={resultados[cat.id] || ""}
                onChange={v => setResultados(r => ({...r, [cat.id]: v}))}
                placeholder="Buscá el país ganador..."
              />
            ) : (
              <PlayerAutocomplete
                value={resultados[cat.id] || ""}
                onChange={v => setResultados(r => ({...r, [cat.id]: v}))}
                categoria={cat.id}
              />
            )}
          </div>
        ))}
      </div>
      {msg && (
        <div style={{ fontSize:11, color: msg.startsWith("✓")?VERDE:ROJO,
          marginTop:10, textAlign:"center" }}>{msg}</div>
      )}
      <div style={{ display:"flex", gap:8, marginTop:12 }}>
        <button onClick={onClose} style={{ flex:1, background:"none",
          border:`1px solid #ccc`, borderRadius:6, padding:9, fontSize:12, color:"#111" }}>
          Cancelar
        </button>
        <button onClick={guardarYCalcular} disabled={saving}
          style={{ flex:2, background:BORDO, color:MARFIL, border:"none",
            borderRadius:6, padding:9, fontSize:12, fontWeight:600, opacity:saving?0.7:1 }}>
          {saving ? "Calculando..." : "Guardar y calcular puntos"}
        </button>
      </div>
    </div>
  );
}

function GestionAdmins({ onBack }: { onBack: ()=>void }) {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const q = query(collection(db, "usuarios"), orderBy("pts", "desc"));
    return onSnapshot(q, snap => {
      setUsuarios(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    });
  }, []);

  async function toggleAdmin(userId: string, esAdmin: boolean) {
    setLoading(true);
    await setDoc(doc(db, "usuarios", userId), { isAdmin: !esAdmin }, { merge: true });
    setMsg(!esAdmin ? "✓ Admin asignado" : "✓ Admin removido");
    setLoading(false);
    setTimeout(() => setMsg(""), 3000);
  }

  const admins = usuarios.filter(u => u.isAdmin);

  return (
    <div style={{ padding:12, background:MARFIL_LIGHT, flex:1 }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:BORDO,
        fontSize:12, marginBottom:12, display:"flex", alignItems:"center", gap:4 }}>
        ← Volver al panel
      </button>
      <div style={{ fontSize:12, fontWeight:600, color:BORDO, marginBottom:4 }}>🛡️ Gestión de administradores</div>
      <div style={{ fontSize:10, color:"#888", marginBottom:12 }}>
        Admins activos: {admins.length}/5
      </div>

      {msg && <div style={{ background:VERDE, color:"white", borderRadius:6,
        padding:"8px 12px", fontSize:12, marginBottom:10 }}>{msg}</div>}

      <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5", overflow:"hidden" }}>
        {usuarios.length === 0 && (
          <div style={{ padding:20, textAlign:"center", fontSize:12, color:"#aaa" }}>
            No hay usuarios registrados aún
          </div>
        )}
        {usuarios.map((u, i) => (
          <div key={u.id} style={{ display:"flex", alignItems:"center", gap:10,
            padding:"10px 14px",
            borderBottom: i < usuarios.length-1 ? "0.5px solid #eee" : "none" }}>
            <div style={{ width:34, height:34, borderRadius:"50%", border:`1.5px solid ${BORDO}`,
              overflow:"hidden", background:MARFIL, flexShrink:0,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              {u.photoURL
                ? <img src={u.photoURL} alt={u.nick} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <span style={{ fontSize:12, fontWeight:500, color:BORDO }}>{(u.ini||"?").slice(0,2)}</span>
              }
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:500 }}>{u.nick || "Sin nick"}</div>
              <div style={{ fontSize:10, color:"#888" }}>{u.email}</div>
            </div>
            {u.isAdmin && (
              <span style={{ background:BORDO, color:MARFIL, fontSize:9,
                padding:"2px 7px", borderRadius:20, marginRight:4 }}>Admin</span>
            )}
            <button
              onClick={() => toggleAdmin(u.id, u.isAdmin)}
              disabled={loading || (!u.isAdmin && admins.length >= 5)}
              style={{
                background: u.isAdmin ? "none" : BORDO,
                color: u.isAdmin ? ROJO : MARFIL,
                border: u.isAdmin ? `1px solid ${ROJO}` : "none",
                borderRadius:6, fontSize:11, padding:"5px 10px", fontWeight:600,
                opacity: (!u.isAdmin && admins.length >= 5) ? 0.4 : 1,
                cursor: (!u.isAdmin && admins.length >= 5) ? "not-allowed" : "pointer"
              }}>
              {u.isAdmin ? "Quitar" : "Hacer admin"}
            </button>
          </div>
        ))}
      </div>
      {admins.length >= 5 && (
        <div style={{ fontSize:10, color:ROJO, marginTop:8, textAlign:"center" }}>
          Límite de 5 admins alcanzado. Remové uno para agregar otro.
        </div>
      )}
    </div>
  );
}

function AdminPanel({ onBack }: { onBack:()=>void }) {
  const [partidos, setPartidos] = useState<any[]>([]);
  const [vista, setVista] = useState<"menu"|"nuevo"|"resultado"|"lista"|"csv"|"admins"|"equipos"|"premios">("menu");
  const [editando, setEditando] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<string|null>(null);
  const [confirmBorrarTodo, setConfirmBorrarTodo] = useState(false);
  const [confirmCerrarJornada, setConfirmCerrarJornada] = useState(false);
  const [confirmReinicio, setConfirmReinicio] = useState(false);
  const [lockHoras, setLockHoras] = useState("1");
  const [lockHorasGuardado, setLockHorasGuardado] = useState("1");
  const [guardandoLock, setGuardandoLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getDoc(doc(db, "config", "app")).then(snap => {
      if (snap.exists() && snap.data().lockHoras !== undefined) {
        const val = String(snap.data().lockHoras);
        setLockHoras(val);
        setLockHorasGuardado(val);
      }
    });
  }, []);

  async function guardarLockHoras() {
    setGuardandoLock(true);
    await setDoc(doc(db, "config", "app"), { lockHoras: Number(lockHoras) }, { merge: true });
    setLockHorasGuardado(lockHoras);
    setGuardandoLock(false);
  }

  const [recalculando, setRecalculando] = useState(false);
  const [recalculoMsg, setRecalculoMsg] = useState("");

  async function recalcularAciertoHistorico() {
    setRecalculando(true);
    setRecalculoMsg("");
    try {
      const partidosSnap = await getDocs(query(collection(db, "partidos"), orderBy("fecha"), orderBy("hora")));
      const partidosOrdenados: { id:string, gL:number, gV:number }[] = [];
      partidosSnap.docs.forEach(d => {
        const p = d.data();
        if (p.gL !== null && p.gL !== undefined && p.gV !== null && p.gV !== undefined) {
          partidosOrdenados.push({ id: d.id, gL: p.gL, gV: p.gV });
        }
      });
      const totalPartidosConResultado = partidosOrdenados.length;

      const pronosSnap = await getDocs(collection(db, "pronosticos"));
      const pronosPorUsuario: Record<string, Record<string, {mL:number, mV:number}>> = {};
      pronosSnap.docs.forEach(d => {
        const { userId, matchId, mL, mV } = d.data();
        if (mL === null || mV === null || mL === undefined || mV === undefined) return;
        if (!pronosPorUsuario[userId]) pronosPorUsuario[userId] = {};
        pronosPorUsuario[userId][matchId] = { mL, mV };
      });

      const usuariosSnap = await getDocs(collection(db, "usuarios"));
      await Promise.all(usuariosSnap.docs.map(d => {
        const misPronos = pronosPorUsuario[d.id] || {};
        let golesAcertados = 0, golesPronosticados = 0, exactos = 0, aciertosResultado = 0;
        let rachaActual = 0, rachaMasLarga = 0, ceroRacha = 0;

        // Recorre en orden cronologico para que las rachas (consecutivos) sean correctas
        partidosOrdenados.forEach(real => {
          const prono = misPronos[real.id];
          const tienePronostico = !!prono;
          const pts = tienePronostico ? (calcPtsNuevo(real.gL, real.gV, prono.mL, prono.mV) ?? 0) : 0;

          if (tienePronostico) {
            golesPronosticados += 2;
            if (prono.mL === real.gL) golesAcertados++;
            if (prono.mV === real.gV) golesAcertados++;
            if (pts >= 1) aciertosResultado++;
          }
          if (pts === 3) { exactos++; rachaActual++; } else { rachaActual = 0; }
          rachaMasLarga = Math.max(rachaMasLarga, rachaActual);
          ceroRacha = pts === 0 ? ceroRacha + 1 : 0;
        });

        const acierto = golesPronosticados > 0 ? Math.round((golesAcertados/golesPronosticados)*100) : 0;
        const pctExactos = totalPartidosConResultado > 0 ? Math.round((exactos/totalPartidosConResultado)*100) : 0;
        const pctAciertoResultado = totalPartidosConResultado > 0 ? Math.round((aciertosResultado/totalPartidosConResultado)*100) : 0;

        return setDoc(d.ref, {
          golesAcertados, golesPronosticados, acierto,
          partidosConResultado: totalPartidosConResultado,
          aciertosResultado, pctExactos, pctAciertoResultado,
          rachaActual, rachaMasLarga, ceroRacha,
        }, { merge:true });
      }));

      setRecalculoMsg(`✓ Recalculado para ${usuariosSnap.docs.length} jugadores`);
    } catch (e) {
      setRecalculoMsg("✗ Error al recalcular, probá de nuevo");
    }
    setRecalculando(false);
  }

  useEffect(() => {
    const q = query(collection(db,"partidos"), orderBy("fecha"), orderBy("hora"));
    return onSnapshot(q, snap => setPartidos(snap.docs.map(d=>({id:d.id,...d.data()}))));
  }, []);

  async function guardarPartido(form: any) {
    if (editando) {
      await setDoc(doc(db,"partidos",editando.id), {...form,updatedAt:serverTimestamp()},{merge:true});
      setMsg("✓ Partido actualizado");
    } else {
      await addDoc(collection(db,"partidos"), {...form,gL:null,gV:null,createdAt:serverTimestamp()});
      setMsg("✓ Partido agregado");
    }
    setVista("menu"); setEditando(null);
    setTimeout(()=>setMsg(""),3000);
  }

  async function eliminar(id: string) {
    await deleteDoc(doc(db,"partidos",id));
    setConfirmDelete(null); setMsg("Partido eliminado");
    setTimeout(()=>setMsg(""),3000);
  }

  async function borrarTodo() {
    setLoading(true);
    const snap = await getDocs(collection(db,"partidos"));
    for (const d of snap.docs) await deleteDoc(doc(db,"partidos",d.id));
    setConfirmBorrarTodo(false); setMsg("✓ Todos los partidos eliminados.");
    setLoading(false); setTimeout(()=>setMsg(""),3000);
  }

  async function reiniciarPuntajes() {
    setLoading(true);
    const snap = await getDocs(collection(db, "usuarios"));
    for (const d of snap.docs) {
      await setDoc(d.ref, { pts:0, hoy:0, mov:0, rachaActual:0, rachaMasLarga:0, exactos:0, acierto:0, golesAcertados:0, golesPronosticados:0, ceroRacha:0, partidosConResultado:0, aciertosResultado:0, pctExactos:0, pctAciertoResultado:0, pos:0 }, { merge:true });
    }
    setConfirmReinicio(false);
    setMsg("✓ Puntuación reiniciada para todos.");
    setLoading(false);
    setTimeout(() => setMsg(""), 4000);
  }

  async function exportarCSV() {
    const [pronosSnap, partidosSnap, usuariosSnap] = await Promise.all([
      getDocs(collection(db, "pronosticos")),
      getDocs(collection(db, "partidos")),
      getDocs(collection(db, "usuarios")),
    ]);
    const partidos: Record<string,any> = {};
    partidosSnap.docs.forEach(d => { partidos[d.id] = d.data(); });
    const usuarios: Record<string,string> = {};
    usuariosSnap.docs.forEach(d => { usuarios[d.id] = d.data().nick || "Sin nick"; });

    const rows = ["Nick,Partido,Local,Visitante,Resultado Real,Pronóstico,Puntos"];
    pronosSnap.docs.forEach(d => {
      const p = d.data();
      const partido = partidos[p.matchId];
      if (!partido) return;
      const resultadoReal = partido.gL !== null && partido.gL !== undefined ? `${partido.gL}-${partido.gV}` : "Sin resultado";
      rows.push(`"${usuarios[p.userId]||"?"}","${partido.localN} vs ${partido.visitaN}","${partido.localN}","${partido.visitaN}","${resultadoReal}","${p.mL}-${p.mV}","${p.pts ?? ""}"`);
    });

    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "prode_resultados.csv";
    a.click(); URL.revokeObjectURL(url);
    setMsg("✓ CSV descargado");
    setTimeout(() => setMsg(""), 3000);
  }

  async function cerrarJornada() {
    setLoading(true);
    const snap = await getDocs(collection(db,"usuarios"));
    for (const d of snap.docs) await setDoc(d.ref,{hoy:0},{merge:true});
    setConfirmCerrarJornada(false); setMsg("✓ Jornada cerrada. +Hoy reseteado.");
    setLoading(false); setTimeout(()=>setMsg(""),4000);
  }

  return (
    <div style={{ padding:12, background:MARFIL_LIGHT, flex:1 }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:BORDO, fontSize:12, marginBottom:12, display:"flex", alignItems:"center", gap:4 }}>← Volver al perfil</button>
      <div style={{ fontSize:12, fontWeight:600, color:BORDO, marginBottom:10 }}>🛡️ Panel de administrador</div>

      {msg&&<div style={{ background:msg.startsWith("✓")?VERDE:ROJO, color:"white", borderRadius:6, padding:"8px 12px", fontSize:12, marginBottom:10 }}>{msg}</div>}

      {vista==="nuevo"||editando ? (
        <FormPartido onSave={guardarPartido} onCancel={()=>{setVista("menu");setEditando(null);}} initial={editando} />
      ) : vista==="resultado" ? (
        <FormResultado partidos={partidos} onClose={()=>setVista("menu")} />
      ) : vista==="admins" ? (
        <GestionAdmins onBack={() => setVista("menu")} />
      ) : vista==="equipos" ? (
        <GestionEquipos onBack={() => setVista("menu")} />
      ) : vista==="premios" ? (
        <ResultadosPremios onClose={() => setVista("menu")} />
      ) : vista==="csv" ? (
        <ImportarCSV onClose={()=>setVista("menu")} />
      ) : vista==="lista" ? (
        <div>
          <div style={{ fontSize:12, fontWeight:600, color:BORDO, marginBottom:8 }}>📋 Partidos ({partidos.length})</div>
          {partidos.map((p) => (
            <div key={p.id} style={{ background:"white", borderRadius:8, border:"0.5px solid #e0ddd5", padding:"10px 12px", marginBottom:6 }}>
              {confirmDelete===p.id ? (
                <div>
                  <div style={{ fontSize:12, color:ROJO, marginBottom:8 }}>¿Eliminar {p.localN} vs {p.visitaN}?</div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setConfirmDelete(null)} style={{ flex:1, background:"none", border:"1px solid #ccc", borderRadius:6, padding:7, fontSize:11 }}>Cancelar</button>
                    <button onClick={()=>eliminar(p.id)} style={{ flex:1, background:ROJO, color:"white", border:"none", borderRadius:6, padding:7, fontSize:11, fontWeight:600 }}>Eliminar</button>
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:500 }}><FlagImg pais={p.localN} size={14}/> {p.localN} vs {p.visitaN} <FlagImg pais={p.visitaN} size={14}/></div>
                    <div style={{ fontSize:10, color:"#888" }}>{p.fecha} · {p.hora} · {p.fase} {p.grupo?`· Gr.${p.grupo}`:""}</div>
                    {p.gL!==null&&p.gL!==undefined&&<div style={{ fontSize:10, color:VERDE }}>Resultado: {p.gL}-{p.gV}</div>}
                  </div>
                  <button onClick={()=>setEditando(p)} style={{ background:"none", border:`1px solid ${BORDO_LIGHT}`, borderRadius:4, padding:"4px 8px", fontSize:11, color:BORDO }}>✏️</button>
                  <button onClick={()=>setConfirmDelete(p.id)} style={{ background:"none", border:`1px solid ${ROJO}`, borderRadius:4, padding:"4px 8px", fontSize:11, color:ROJO }}>🗑️</button>
                </div>
              )}
            </div>
          ))}
          <button onClick={()=>setVista("menu")} style={{ background:"none", border:"none", fontSize:11, color:"#888", marginTop:4 }}>← Volver</button>
        </div>
      ) : (
        <>
          {confirmBorrarTodo&&(
            <div style={{ background:"white", borderRadius:12, border:`1.5px solid ${ROJO}`, padding:16, marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:600, color:ROJO, marginBottom:6 }}>⚠️ ¿Eliminar todos los partidos?</div>
              <div style={{ fontSize:11, color:"#666", marginBottom:12 }}>Se borrarán {partidos.length} partidos. No se puede deshacer.</div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setConfirmBorrarTodo(false)} style={{ flex:1, background:"none", border:"1px solid #ccc", borderRadius:6, padding:9, fontSize:12 }}>Cancelar</button>
                <button onClick={borrarTodo} disabled={loading} style={{ flex:1, background:ROJO, color:"white", border:"none", borderRadius:6, padding:9, fontSize:12, fontWeight:600 }}>
                  {loading?"Borrando...":"Eliminar todo"}</button>
              </div>
            </div>
          )}

          {confirmReinicio && (
            <div style={{ background:"white", borderRadius:12, border:`1.5px solid ${ROJO}`, padding:16, marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:600, color:ROJO, marginBottom:6 }}>⚠️ ¿Reiniciar todos los puntajes?</div>
              <div style={{ fontSize:11, color:"#666", marginBottom:12 }}>Se pondrán en 0 los puntos, rachas y posiciones de todos. No se puede deshacer. Exportá el CSV antes si querés guardar los resultados.</div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setConfirmReinicio(false)} style={{ flex:1, background:"none", border:"1px solid #ccc", borderRadius:6, padding:9, fontSize:12 }}>Cancelar</button>
                <button onClick={reiniciarPuntajes} disabled={loading} style={{ flex:1, background:ROJO, color:"white", border:"none", borderRadius:6, padding:9, fontSize:12, fontWeight:600 }}>
                  {loading?"Reiniciando...":"Sí, reiniciar"}
                </button>
              </div>
            </div>
          )}

          <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5", overflow:"hidden", marginBottom:10 }}>
            <div style={{ background:BORDO_DARK, padding:"8px 12px" }}><span style={{ color:MARFIL, fontSize:12, fontWeight:600 }}>📊 Datos</span></div>
            <div onClick={exportarCSV} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderBottom:"0.5px solid #eee", cursor:"pointer" }}>
              <span style={{ fontSize:16 }}>⬇️</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:500, color:"#111" }}>Exportar resultados CSV</div>
                <div style={{ fontSize:10, color:"#888" }}>Descarga pronósticos y puntajes</div>
              </div>
              <span style={{ color:"#ccc", fontSize:16 }}>›</span>
            </div>
            <div onClick={() => setConfirmReinicio(true)} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", cursor:"pointer" }}>
              <span style={{ fontSize:16 }}>🔄</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:500, color:ROJO }}>Reiniciar puntuación</div>
                <div style={{ fontSize:10, color:"#888" }}>Pone todos los puntajes en 0</div>
              </div>
              <span style={{ color:"#ccc", fontSize:16 }}>›</span>
            </div>
          </div>

          <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5", overflow:"hidden", marginBottom:10 }}>
            <div style={{ background:BORDO_DARK, padding:"8px 12px" }}><span style={{ color:MARFIL, fontSize:12, fontWeight:600 }}>🔒 Pronósticos</span></div>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px" }}>
              <span style={{ fontSize:16 }}>🕐</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:500 }}>Bloquear antes del partido</div>
                <div style={{ fontSize:10, color:"#888" }}>Horas antes del inicio</div>
              </div>
              <select value={lockHoras} onChange={e=>setLockHoras(e.target.value)} style={{ fontSize:11, border:`1px solid ${BORDO_LIGHT}`, borderRadius:4, padding:"3px 5px", color:BORDO, background:MARFIL_LIGHT }}>
                <option value="1">1 hora</option><option value="2">2 horas</option>
                <option value="3">3 horas</option><option value="0">Al inicio</option>
              </select>
              {lockHoras !== lockHorasGuardado && (
                <button onClick={guardarLockHoras} disabled={guardandoLock}
                  style={{ background:BORDO, color:MARFIL, border:"none", borderRadius:5,
                    padding:"5px 10px", fontSize:11, fontWeight:600, cursor:"pointer",
                    opacity:guardandoLock?0.6:1 }}>
                  {guardandoLock ? "..." : "Guardar"}
                </button>
              )}
            </div>
            {lockHoras === lockHorasGuardado && (
              <div style={{ padding:"0 14px 10px", fontSize:10, color:VERDE }}>✓ Guardado, aplica a todos los partidos</div>
            )}
          </div>

          <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5", overflow:"hidden", marginBottom:10 }}>
            <div style={{ background:BORDO_DARK, padding:"8px 12px" }}><span style={{ color:MARFIL, fontSize:12, fontWeight:600 }}>🎯 Estadísticas</span></div>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px" }}>
              <span style={{ fontSize:16 }}>📊</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:500 }}>Estadísticas de acierto</div>
                <div style={{ fontSize:10, color:"#888" }}>Recalcula % goles, % exactos y % acierto con todo lo jugado</div>
              </div>
              <button onClick={recalcularAciertoHistorico} disabled={recalculando}
                style={{ background:BORDO, color:MARFIL, border:"none", borderRadius:5,
                  padding:"6px 10px", fontSize:11, fontWeight:600, cursor:"pointer",
                  opacity:recalculando?0.6:1, whiteSpace:"nowrap" }}>
                {recalculando ? "Calculando..." : "Recalcular"}
              </button>
            </div>
            {recalculoMsg && (
              <div style={{ padding:"0 14px 10px", fontSize:10, color:recalculoMsg.startsWith("✓")?VERDE:ROJO }}>{recalculoMsg}</div>
            )}
          </div>

          <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5", overflow:"hidden", marginBottom:10 }}>
            <div style={{ background:BORDO_DARK, padding:"8px 12px" }}><span style={{ color:MARFIL, fontSize:12, fontWeight:600 }}>⚽ Partidos</span></div>
            {[
              { icon:"📊", label:"Importar desde CSV", sub:"Cargá el archivo de una vez", action:()=>setVista("csv") },
              { icon:"➕", label:"Agregar partido", sub:"Cargar uno por uno", action:()=>setVista("nuevo") },
              { icon:"📋", label:`Ver partidos (${partidos.length})`, sub:"Editar o eliminar", action:()=>setVista("lista") },
              { icon:"✏️", label:"Cargar resultado", sub:"Actualizar marcador real", action:()=>setVista("resultado") },
              { icon:"🏆", label:"Resultados de premios", sub:"Balón, Bota, Guante, Joven, Campeón", action:()=>setVista("premios") },
              { icon:"🗑️", label:"Eliminar todos", sub:"Borra todo y empezá de nuevo", danger:true, action:()=>setConfirmBorrarTodo(true) },
            ].map((row,i,arr)=>(
              <div key={row.label} onClick={row.action} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderBottom:i<arr.length-1?"0.5px solid #eee":"none", cursor:"pointer" }}>
                <span style={{ fontSize:16 }}>{row.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:(row as any).danger?ROJO:"#111" }}>{row.label}</div>
                  <div style={{ fontSize:10, color:"#888" }}>{row.sub}</div>
                </div>
                <span style={{ color:"#ccc", fontSize:16 }}>›</span>
              </div>
            ))}
          </div>

          <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5", overflow:"hidden" }}>
            <div style={{ background:BORDO_DARK, padding:"8px 12px" }}><span style={{ color:MARFIL, fontSize:12, fontWeight:600 }}>👥 Usuarios</span></div>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderBottom:"0.5px solid #eee", cursor:"pointer" }} onClick={() => setVista("admins")}>
              <span style={{ fontSize:16 }}>🛡️</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:500, color:"#111" }}>Asignar administradores</div>
                <div style={{ fontSize:10, color:"#888" }}>Hasta 5 admins en total</div>
              </div>
              <span style={{ color:"#ccc", fontSize:16 }}>›</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderBottom:"0.5px solid #eee", cursor:"pointer" }} onClick={() => setVista("equipos")}>
              <span style={{ fontSize:16 }}>🏟️</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:500, color:"#111" }}>Gestión de equipos</div>
                <div style={{ fontSize:10, color:"#888" }}>Para futuros prodes (Champions, ligas...)</div>
              </div>
              <span style={{ color:"#ccc", fontSize:16 }}>›</span>
            </div>
            <div style={{ padding:"11px 14px" }}>
              {confirmCerrarJornada ? (
                <div>
                  <div style={{ fontSize:12, color:BORDO, fontWeight:500, marginBottom:6 }}>¿Cerrar jornada y resetear +Hoy para todos?</div>
                  <div style={{ fontSize:10, color:"#888", marginBottom:10 }}>Los puntos totales no cambian.</div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setConfirmCerrarJornada(false)} style={{ flex:1, background:"none", border:"1px solid #ccc", borderRadius:6, padding:8, fontSize:12, color:"#111" }}>Cancelar</button>
                    <button onClick={cerrarJornada} disabled={loading} style={{ flex:1, background:BORDO, color:MARFIL, border:"none", borderRadius:6, padding:8, fontSize:12, fontWeight:600 }}>
                      {loading?"Cerrando...":"Cerrar jornada"}</button>
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={()=>setConfirmCerrarJornada(true)}>
                  <span style={{ fontSize:16 }}>🏁</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:500, color:"#111" }}>Cerrar jornada</div>
                    <div style={{ fontSize:10, color:"#888" }}>Resetea el +Hoy de todos</div>
                  </div>
                  <span style={{ color:"#ccc", fontSize:16 }}>›</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


// Overlay de racha: "fuego" si rachaActual>=3 (exactos seguidos), "hielo" si ceroRacha>=3 (0pts seguidos)
// Juega 1 vez al montar (key cambia cuando cambia el tipo de racha) y deja un pulso permanente en el borde.
function RachaOverlay({ tipo, size }: { tipo: "fuego"|"hielo"|null, size: number }) {
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    setPlaying(true);
    const t = setTimeout(() => setPlaying(false), 1500);
    return () => clearTimeout(t);
  }, [tipo]);

  if (!tipo) return null;

  const isFuego = tipo === "fuego";
  const pulseColor = isFuego ? "#ff5a14" : "#bfe3ff";
  const ringShadow = isFuego ? "rgba(255,90,20,0.55)" : "rgba(190,225,255,0.85)";

  return (
    <>
      <style>{`
        @keyframes rachaShardFloat {
          0% { opacity:0; transform: translateY(0) scale(0.6) rotate(0deg); }
          15% { opacity:1; }
          100% { opacity:0; transform: translateY(-${size*0.3}px) scale(1.1) rotate(25deg); }
        }
        @keyframes rachaFlameUp {
          0% { opacity:0; transform: translateY(${size*0.1}px) scale(0.3) rotate(0deg); }
          20% { opacity:1; transform: translateY(${size*0.02}px) scale(0.85) rotate(-3deg); }
          45% { transform: translateY(-${size*0.07}px) scale(1.05) rotate(3deg); }
          70% { transform: translateY(-${size*0.19}px) scale(1) rotate(-2deg); opacity:0.9; }
          100% { opacity:0; transform: translateY(-${size*0.38}px) scale(0.55) rotate(4deg); }
        }
        @keyframes rachaIceIn {
          from { opacity:0; } to { opacity:1; }
        }
        @keyframes rachaIceOut {
          from { opacity:1; } to { opacity:0; }
        }
        @keyframes rachaPulse {
          0%, 100% { box-shadow: 0 0 0px 0px transparent; border-color:${BORDO}; }
          50% { box-shadow: 0 0 ${size*0.18}px ${size*0.06}px ${ringShadow}; border-color:${pulseColor}; }
        }
        .racha-pulse-${tipo} { animation: rachaPulse 1.8s ease-in-out infinite; }
      `}</style>
      <div className={`racha-pulse-${tipo}`} style={{ position:"absolute", inset:0, borderRadius:"50%", pointerEvents:"none" }} />
      {playing && isFuego && (
        <div style={{ position:"absolute", inset:-size*0.15, borderRadius:"50%", pointerEvents:"none", zIndex:0 }}>
          {[0, 0.06, 0.12].map((delay, i) => {
            const w = size * (i===1 ? 0.22 : 0.16);
            const h = size * (i===1 ? 0.4 : 0.3);
            const left = size * (i===0 ? 0.05 : i===1 ? 0.4 : 0.75) - w/2;
            return (
              <div key={i} style={{
                position:"absolute", bottom:1, left, width:w, height:h,
                opacity:0, transformOrigin:"bottom center",
                animation:`rachaFlameUp 1.3s ease-out ${delay}s forwards`,
              }}>
                <div style={{ position:"absolute", inset:0, borderRadius:"50% 50% 50% 50% / 65% 65% 35% 35%",
                  background:"linear-gradient(180deg, #ff3d00 0%, #ff7a1a 55%, #ffb238 100%)",
                  clipPath:"polygon(50% 0%, 78% 22%, 92% 55%, 78% 85%, 50% 100%, 22% 85%, 8% 55%, 22% 22%)" }} />
                <div style={{ position:"absolute", width:"55%", height:"55%", left:"22.5%", top:"38%",
                  background:"radial-gradient(ellipse at 50% 70%, #fff3b0 0%, #ffe066 50%, transparent 100%)",
                  borderRadius:"50%" }} />
              </div>
            );
          })}
        </div>
      )}
      {playing && !isFuego && (
        <div style={{
          position:"absolute", inset:0, borderRadius:"50%", pointerEvents:"none", zIndex:0,
          background:"radial-gradient(circle at 35% 30%, rgba(200,235,255,0.55) 0%, rgba(150,210,250,0.45) 45%, rgba(120,190,245,0.35) 100%)",
          boxShadow:"inset 0 0 12px rgba(255,255,255,0.8)",
          animation:"rachaIceIn 0.3s ease-out forwards, rachaIceOut 0.4s ease-in 1.0s forwards",
        }}>
          {["❄","❅"].map((s,i) => (
            <span key={i} style={{
              position:"absolute", fontSize:size*0.18,
              left: i===0 ? size*0.08 : undefined, right: i===1 ? size*0.05 : undefined,
              top: i===0 ? size*0.12 : size*0.3, opacity:0,
              animation:`rachaShardFloat 1.3s ease-out ${i*0.08}s forwards`,
            }}>{s}</span>
          ))}
        </div>
      )}
    </>
  );
}

function tipoRacha(ud: any): "fuego"|"hielo"|null {
  if (!ud) return null;
  if ((ud.rachaActual || 0) >= 3) return "fuego";
  if ((ud.ceroRacha || 0) >= 3) return "hielo";
  return null;
}


function PerfilAjeno({ uid, onBack }: { uid: string, onBack: ()=>void }) {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    return onSnapshot(doc(db,"usuarios",uid), snap => {
      if (snap.exists()) setUserData(snap.data());
    });
  }, [uid]);

  const ini = (userData?.nick||"U").slice(0,2).toUpperCase();

  return (
    <div style={{ padding:12, background:MARFIL_LIGHT, flex:1 }}>
      <div onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, cursor:"pointer" }}>
        <span style={{ fontSize:18, color:BORDO }}>‹</span>
        <span style={{ fontSize:13, color:BORDO, fontWeight:500 }}>Volver a la tabla</span>
      </div>

      {!userData && (
        <div style={{ padding:30, textAlign:"center", color:"#888", fontSize:12 }}>Cargando perfil...</div>
      )}

      {userData && (
        <>
          <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5",
            padding:"20px 16px", marginBottom:10, display:"flex", flexDirection:"column",
            alignItems:"center", gap:10 }}>
            <div style={{ position:"relative", width:72, height:72, flexShrink:0 }}>
              <div style={{ width:72, height:72, borderRadius:"50%", background:MARFIL,
                border:`3px solid ${BORDO}`, overflow:"hidden", flexShrink:0, position:"relative", zIndex:1 }}>
                {(userData.fotoPersonalizada || userData.photoURL)
                  ? <img src={userData.fotoPersonalizada || userData.photoURL} alt="Foto" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:26, fontWeight:600, color:BORDO }}>{ini}</div>
                }
              </div>
              <RachaOverlay tipo={tipoRacha(userData)} size={72} />
            </div>
            <div style={{ fontSize:18, fontWeight:600, color:BORDO }}>{userData.nick||"Sin nick"}</div>

            <div style={{ width:"100%", background:BORDO, borderRadius:8, padding:"10px 14px",
              display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:22 }}>🔥</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:MARFIL_DARK }}>Racha actual (exactos)</div>
                <div style={{ fontSize:18, fontWeight:600, color:MARFIL }}>{userData.rachaActual||0} seguidos</div>
              </div>
              <div style={{ width:1, background:BORDO_LIGHT, height:36, margin:"0 4px" }}/>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:11, color:MARFIL_DARK }}>Racha más larga</div>
                <div style={{ fontSize:18, fontWeight:600, color:MARFIL }}>{userData.rachaMasLarga||0}</div>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, width:"100%" }}>
              {[
                { val:userData.pts||0, lbl:"Puntos totales" },
                { val:userData.pos?`${userData.pos}°`:"—", lbl:"Posición actual" },
                { val:userData.exactos||0, lbl:"Resultados exactos" },
                { val:userData.acierto?`${userData.acierto}%`:"0%", lbl:"Acierto de goles" },
                { val:userData.pctExactos?`${userData.pctExactos}%`:"0%", lbl:"% resultados exactos" },
                { val:userData.pctAciertoResultado?`${userData.pctAciertoResultado}%`:"0%", lbl:"% acierto resultado" },
              ].map(s=>(
                <div key={s.lbl} style={{ background:MARFIL_LIGHT, borderRadius:8, padding:10,
                  textAlign:"center", border:"0.5px solid #e0ddd5" }}>
                  <div style={{ fontSize:20, fontWeight:600, color:BORDO }}>{s.val}</div>
                  <div style={{ fontSize:10, color:"#888", marginTop:2 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


function TabPerfil({ user, onLogout, isAdmin }: { user:any, onLogout:()=>void, isAdmin:boolean }) {
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPredicciones, setShowPredicciones] = useState(false);
  const [nick, setNick] = useState("");
  const [editingNick, setEditingNick] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState("");
  const ini = (nick||"U").slice(0,2).toUpperCase();
  const fotoMostrada = userData?.fotoPersonalizada || user?.photoURL || "";

  async function manejarCambioFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite re-seleccionar el mismo archivo despues
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      setErrorFoto("Elegí un archivo de imagen");
      return;
    }
    setErrorFoto("");
    setSubiendoFoto(true);
    try {
      const base64 = await comprimirImagenAFoto(file, 200, 0.7);
      // Limite de seguridad bien por debajo del 1MB de Firestore
      if (base64.length > 700_000) {
        setErrorFoto("La imagen quedó muy pesada, probá con otra foto");
        setSubiendoFoto(false);
        return;
      }
      await setDoc(doc(db, "usuarios", user.uid), { fotoPersonalizada: base64 }, { merge: true });
    } catch (err) {
      setErrorFoto("No se pudo procesar la imagen, probá de nuevo");
    }
    setSubiendoFoto(false);
  }

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db,"usuarios",user.uid), snap => {
      if (snap.exists()) { const d=snap.data(); setUserData(d); setNick(d.nick||""); }
    });
  }, [user]);

  async function saveNick() {
    if (!user||!nick.trim()) return;
    await setDoc(doc(db,"usuarios",user.uid), { nick:nick.trim(), ini:nick.trim().slice(0,2).toUpperCase() }, {merge:true});
    setEditingNick(false);
  }

  if (showAdmin) return <AdminPanel onBack={()=>setShowAdmin(false)} />;
  if (showPredicciones) return <MisPredicciones userId={user.uid} onBack={()=>setShowPredicciones(false)} />;

  return (
    <div style={{ padding:12, background:MARFIL_LIGHT, flex:1 }}>
      <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5",
        padding:"20px 16px", marginBottom:10, display:"flex", flexDirection:"column",
        alignItems:"center", gap:10 }}>
        <div style={{ position:"relative", width:72, height:72, flexShrink:0 }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:MARFIL,
            border:`3px solid ${BORDO}`, overflow:"hidden", flexShrink:0, position:"relative", zIndex:1 }}>
            {fotoMostrada
              ? <img src={fotoMostrada} alt="Foto" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:26, fontWeight:600, color:BORDO }}>{ini}</div>
            }
            {subiendoFoto && (
              <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,0.7)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:BORDO, fontWeight:600 }}>
                ...
              </div>
            )}
          </div>
          <RachaOverlay tipo={tipoRacha(userData)} size={72} />
          <label style={{ position:"absolute", bottom:-2, right:-2, width:26, height:26, borderRadius:"50%",
            background:BORDO, border:"2px solid white", display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", zIndex:3, fontSize:12 }}>
            ✏️
            <input type="file" accept="image/*" onChange={manejarCambioFoto} disabled={subiendoFoto}
              style={{ display:"none" }} />
          </label>
        </div>
        {errorFoto && <div style={{ fontSize:11, color:ROJO }}>{errorFoto}</div>}
        {editingNick ? (
          <div style={{ display:"flex", gap:8, width:"100%" }}>
            <input value={nick} onChange={e=>setNick(e.target.value)} style={{ flex:1, ...inputStyle() }} />
            <button onMouseDown={e => { e.preventDefault(); saveNick(); }} style={{ background:BORDO, color:MARFIL, border:"none", borderRadius:6, padding:"0 14px", fontSize:13, fontWeight:600 }}>OK</button>
          </div>
        ) : (
          <div onClick={()=>setEditingNick(true)} style={{ fontSize:18, fontWeight:600, color:BORDO, cursor:"pointer" }}>
            {nick||"Sin nick"} ✏️
          </div>
        )}
        {isAdmin&&<div style={{ background:BORDO, color:MARFIL, fontSize:11, padding:"3px 12px", borderRadius:20 }}>🛡️ Admin</div>}

        <div style={{ width:"100%", background:BORDO, borderRadius:8, padding:"10px 14px",
          display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:22 }}>🔥</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:MARFIL_DARK }}>Racha actual (exactos)</div>
            <div style={{ fontSize:18, fontWeight:600, color:MARFIL }}>{userData?.rachaActual||0} seguidos</div>
          </div>
          <div style={{ width:1, background:BORDO_LIGHT, height:36, margin:"0 4px" }}/>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:11, color:MARFIL_DARK }}>Racha más larga</div>
            <div style={{ fontSize:18, fontWeight:600, color:MARFIL }}>{userData?.rachaMasLarga||0}</div>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, width:"100%" }}>
          {[
            { val:userData?.pts||0, lbl:"Puntos totales" },
            { val:userData?.pos?`${userData.pos}°`:"—", lbl:"Posición actual" },
            { val:userData?.exactos||0, lbl:"Resultados exactos" },
            { val:userData?.acierto?`${userData.acierto}%`:"0%", lbl:"Acierto de goles" },
            { val:userData?.pctExactos?`${userData.pctExactos}%`:"0%", lbl:"% resultados exactos" },
            { val:userData?.pctAciertoResultado?`${userData.pctAciertoResultado}%`:"0%", lbl:"% acierto resultado" },
          ].map(s=>(
            <div key={s.lbl} style={{ background:MARFIL_LIGHT, borderRadius:8, padding:10,
              textAlign:"center", border:"0.5px solid #e0ddd5" }}>
              <div style={{ fontSize:20, fontWeight:600, color:BORDO }}>{s.val}</div>
              <div style={{ fontSize:10, color:"#888", marginTop:2 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div onClick={() => setShowPredicciones(true)}
        style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5",
          padding:"14px 16px", marginBottom:10, cursor:"pointer",
          display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:24 }}>🏆</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600, color:BORDO }}>Mis predicciones del torneo</div>
          <div style={{ fontSize:11, color:"#888", marginTop:2 }}>
            {prediccionesBloqueadas()
              ? "🔒 Predicciones cerradas"
              : "Campeón, Balón de Oro, Bota de Oro..."}
          </div>
        </div>
        <span style={{ color:"#ccc", fontSize:16 }}>›</span>
      </div>

      <div style={{ fontSize:12, fontWeight:600, color:BORDO, marginBottom:8 }}>⚙️ Cuenta</div>
      <div style={{ background:"white", borderRadius:12, border:"0.5px solid #e0ddd5", overflow:"hidden" }}>
        {[
          { icon:"👤", label:"Editar nick", action:()=>setEditingNick(true) },
          ...(isAdmin?[{ icon:"🛡️", label:"Panel de administrador", action:()=>setShowAdmin(true) }]:[]),
          { icon:"🚪", label:"Cerrar sesión", action:onLogout, danger:true },
        ].map((row,i,arr)=>(
          <div key={row.label} onClick={row.action} style={{ display:"flex", alignItems:"center",
            gap:12, padding:"14px 16px", borderBottom:i<arr.length-1?"0.5px solid #eee":"none",
            cursor:"pointer" }}>
            <span style={{ fontSize:18, minWidth:24, textAlign:"center" }}>{row.icon}</span>
            <span style={{ fontSize:14, color:(row as any).danger?ROJO:BORDO, fontWeight:500, flex:1 }}>{row.label}</span>
            <span style={{ color:"#ccc", fontSize:16 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}


export default function App() {
  const [activeTab, setActiveTab] = useState("partidos");
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lockHoras, setLockHorasState] = useState(1);
  const [horaArt, setHoraArt] = useState(horaART());
  const [viendoPerfilDe, setViendoPerfilDe] = useState<string|null>(null);
  const [fotoPersonalizadaHeader, setFotoPersonalizadaHeader] = useState("");

  useEffect(() => {
    if (!user) { setFotoPersonalizadaHeader(""); return; }
    return onSnapshot(doc(db, "usuarios", user.uid), snap => {
      setFotoPersonalizadaHeader(snap.exists() ? (snap.data().fotoPersonalizada || "") : "");
    });
  }, [user]);

  useEffect(() => {
    return onSnapshot(doc(db, "config", "app"), snap => {
      if (snap.exists() && snap.data().lockHoras !== undefined) {
        setLockHorasState(Number(snap.data().lockHoras));
      }
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setHoraArt(horaART()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async u => {
      setUser(u); setAuthLoading(false);
      if (u) {
        const ref = doc(db,"usuarios",u.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            nick: u.displayName?.split(" ")[0]||"Usuario",
            ini: (u.displayName||"U").slice(0,2).toUpperCase(),
            email: u.email, photoURL: u.photoURL||"",
            pts:0, hoy:0, mov:0, rachaActual:0, rachaMasLarga:0,
            exactos:0, acierto:0, golesAcertados:0, golesPronosticados:0, ceroRacha:0, partidosConResultado:0, aciertosResultado:0, pctExactos:0, pctAciertoResultado:0, createdAt:serverTimestamp()
          });
        } else {
          await setDoc(ref, { photoURL:u.photoURL||"" }, {merge:true});
        }
        const data = snap.exists() ? snap.data() : {};
        setIsAdmin(u.email==="juancruzheredia96@gmail.com" || data.isAdmin===true);
      }
    });
  }, []);

  async function handleLogout() { await signOut(auth); setUser(null); }

  const tabs = [
    { id:"partidos", icon:"⚽", label:"Partidos" },
    { id:"tabla",    icon:"🏆", label:"Tabla" },
    { id:"tendencias", icon:"📊", label:"Tendencias" },
    { id:"perfil",   icon:"👤", label:"Perfil" },
  ];

  return (
    <>
      <style>{css}</style>
      <div style={{ width:"100%", maxWidth:600, background:"white", height:"100vh",
        display:"flex", flexDirection:"column", overflowX:"hidden" }}>
        <div style={{ background:BORDO, padding:"10px 20px 6px",
          display:"flex", justifyContent:"space-between", flexShrink:0 }}>
          <span style={{ color:MARFIL, fontSize:11, fontWeight:500 }}>{horaArt}</span>
          <span></span>
        </div>
        <div style={{ background:BORDO, padding:"10px 16px 12px",
          display:"flex", alignItems:"center", gap:10 }}>
          
          <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", gap:3 }}>
            <div style={{ color:MARFIL, fontSize:15, fontWeight:600 }}>Prode Familiar</div>
            
          </div>
          <div onClick={()=>{ setActiveTab("perfil"); setViendoPerfilDe(null); }} style={{ marginLeft:"auto", width:32, height:32,
            background:BORDO_LIGHT, border:`2px solid ${MARFIL}`, borderRadius:"50%",
            overflow:"hidden", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            {(fotoPersonalizadaHeader || user?.photoURL)
              ? <img src={fotoPersonalizadaHeader || user.photoURL} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              : <span style={{ color:MARFIL, fontSize:12, fontWeight:600 }}>
                  {user?(user.displayName||"U").slice(0,2).toUpperCase():"?"}
                </span>
            }
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>
          {authLoading
            ? <div style={{ padding:40, textAlign:"center", color:"#aaa", background:MARFIL_LIGHT }}>Cargando...</div>
            : !user
              ? <LoginScreen />
              : <>
                  {activeTab==="partidos"&&<TabPartidos userId={user.uid} lockHoras={lockHoras} />}
                  {activeTab==="tabla"&&(
                    viendoPerfilDe
                      ? <PerfilAjeno uid={viendoPerfilDe} onBack={()=>setViendoPerfilDe(null)} />
                      : <TabTabla onSelectUser={(uid)=>setViendoPerfilDe(uid)} />
                  )}
                  {activeTab==="tendencias"&&<TabTendencias />}
                  {activeTab==="perfil"&&<TabPerfil user={user} onLogout={handleLogout} isAdmin={isAdmin} />}
                </>
          }
        </div>

        <div style={{ background:"white", borderTop:"0.5px solid #eee",
          display:"flex", justifyContent:"space-around", padding:"8px 0 12px", flexShrink:0 }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>{ setActiveTab(t.id); setViendoPerfilDe(null); }} style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              background:"none", border:"none", padding:"4px 10px",
              color:activeTab===t.id?BORDO:"#aaa" }}>
              <span style={{ fontSize:20 }}>{t.icon}</span>
              <span style={{ fontSize:10 }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
