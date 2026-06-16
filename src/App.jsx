import { useState, useEffect } from "react";
import { supabase, isConfigured, getRol } from "./lib/supabase";
import { useTurnos } from "./hooks/useTurnos";
import Login from "./components/Login";
import Header from "./components/Header";
import TurnosList from "./components/TurnosList";
import TurnoForm from "./components/TurnoForm";
import Calendario from "./components/Calendario";
import Clientes from "./components/Clientes";
import PortalCliente from "./components/PortalCliente";

const s = {
  root: { minHeight:"100vh", background:"#faf6f0", fontFamily:"'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif", position:"relative" },
  bgTexture: { position:"fixed", inset:0, backgroundImage:"radial-gradient(ellipse at 20% 20%,#e8ddd0 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,#d4c9bc 0%,transparent 60%)", pointerEvents:"none", zIndex:0 },
  tabBar: { background:"rgba(255,252,245,0.95)", borderBottom:"1px solid rgba(168,130,90,0.2)", position:"relative", zIndex:9 },
  tabInner: { maxWidth:900, margin:"0 auto", padding:"0 20px", display:"flex", gap:4 },
  tab: { background:"transparent", border:"none", borderBottom:"3px solid transparent", padding:"14px 20px", fontSize:14, fontFamily:"inherit", cursor:"pointer", color:"#9a8060", fontWeight:600, letterSpacing:"0.04em" },
  tabActive: { color:"#3d2b1f", borderBottomColor:"#c8873a" },
  toast: { position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", background:"#27ae60", color:"#fff", borderRadius:8, padding:"12px 28px", fontSize:14, fontFamily:"inherit", zIndex:100, boxShadow:"0 4px 16px rgba(0,0,0,0.15)", display:"flex", alignItems:"center", gap:8 },
  main: { maxWidth:900, margin:"0 auto", padding:"28px 20px 60px", position:"relative", zIndex:1 },
  noAccess: { textAlign:"center", padding:"80px 20px" },
  noAccessTitle: { fontSize:22, color:"#2a1a0e", fontWeight:700, marginBottom:12 },
  noAccessText: { color:"#8a6a44", fontSize:15 },
  configCard: { background:"rgba(255,252,245,0.96)", borderRadius:18, padding:"40px 36px", maxWidth:600, margin:"60px auto", boxShadow:"0 8px 40px rgba(100,70,40,0.13)", border:"1px solid rgba(168,130,90,0.15)", textAlign:"center" },
};

const esPortalPublico = () =>
  window.location.pathname === "/reservar" ||
  window.location.hash === "#/reservar" ||
  window.location.search.includes("portal=1");

export default function App() {
  const [user, setUser]         = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView]         = useState("list");
  const [selected, setSelected] = useState(null);
  const [filterHoy, setFilterHoy] = useState(false);
  const [search, setSearch]     = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientSort, setClientSort]     = useState("name");
  const [toast, setToast]       = useState("");

  const { appointments, loading, dbError, setDbError, save, remove, updateDuration, clearAll } = useTurnos(user);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 1. Mostrar portal público si entran por el link de reserva
  if (esPortalPublico()) return <PortalCliente />;

  // 2. Pantalla de carga mientras se verifica la sesión
  if (authLoading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(160deg,#2a1a0e,#6b4226)" }}>
      <div style={{ color:"#f0d9b5", fontSize:28, fontFamily:"Georgia,serif", letterSpacing:"0.1em" }}>✦ AURA MASAJES</div>
    </div>
  );

  // 3. Pantalla de Login si no hay nadie conectado
  if (!user) return <Login />;

  if (!isConfigured) return (
    <div style={s.root}>
      <div style={s.bgTexture}/>
      <div style={s.configCard}>
        <div style={{fontSize:48,marginBottom:16}}>⚙️</div>
        <div style={{fontSize:22,fontWeight:700,color:"#2a1a0e",marginBottom:12}}>Configurá Supabase</div>
      </div>
    </div>
  );

  // 4. AHORA SÍ: El usuario está logueado correctamente, verificamos su rol
  const rol = getRol(user?.email);

  // ─── BLOQUEO EXCLUSIVO PARA CLIENTES ───
  if (rol === "cliente") {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header user={user} onNuevoTurno={() => {}} />
        <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
          <PortalCliente />
        </div>
      </div>
    );
  }
  // ─────────────────────────────────────────

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3500); };

  const handleSave = async (form, selectedId) => {
    const result = await save(form, selectedId);
    if (!result.error) {
      showToast(selectedId ? "Turno actualizado ✓" : "Turno registrado ✓");
      setView("list"); setSelected(null);
    }
    return result;
  };

  const handleDelete = async (id) => {
    const err = await remove(id);
    if (err) setDbError(err);
    else showToast("Turno eliminado");
  };

  const handleUpdateDuration = async (id, dur) => {
    const err = await updateDuration(id, dur);
    if (err) setDbError(err);
    else showToast("Duración actualizada ✓");
    return err;
  };

  const handleClearAll = async () => {
    if (!window.confirm("¿Eliminar TODOS los turnos?")) return;
    const err = await clearAll();
    if (err) setDbError(err);
    else showToast("Todos los turnos eliminados");
  };

  const handleNewForDay = (date) => {
    const pad = n=>String(n).padStart(2,"0");
    setSelected({ _prefillDate:`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}` });
    setView("form");
  };

  const handleEdit = (appt) => { setSelected(appt); setView("form"); };

  const tabs = [
    { id:"list",     label:"📋 Turnos" },
    { id:"calendar", label:"📅 Calendario" },
    ...(rol==="admin" ? [{ id:"clients", label:"👥 Clientes" }] : []),
  ];

  return (
    <div style={s.root}>
      <div style={s.bgTexture}/>
      <Header user={user} onNuevoTurno={()=>{ setSelected(null); setView("form"); }}/>

      <div style={s.tabBar}>
        <div style={s.tabInner}>
          {tabs.map(t=>(
            <button key={t.id}
              style={{...s.tab,...(view===t.id||(view==="form"&&t.id==="list")?s.tabActive:{})}}
              onClick={()=>setView(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {toast && <div style={s.toast}>{toast}</div>}
      {dbError && (
        <div style={{...s.toast,background:"#e53e3e"}}>
          ❌ {dbError}
          <button onClick={()=>setDbError(null)} style={{marginLeft:12,background:"transparent",border:"none",color:"#fff",cursor:"pointer",fontSize:16}}>✕</button>
        </div>
      )}

      <main style={s.main}>
        {view==="list" && (
          <TurnosList appointments={appointments} loading={loading} rol={rol}
            search={search} setSearch={setSearch}
            filterHoy={filterHoy} setFilterHoy={setFilterHoy}
            onEdit={handleEdit} onDelete={handleDelete}
            onUpdateDuration={handleUpdateDuration} onClearAll={handleClearAll}/>
        )}
        {view==="form" && (
          <TurnoForm selected={selected?._prefillDate?null:selected}
            prefillDate={selected?._prefillDate}
            onBack={()=>{ setView("list"); setSelected(null); }}
            onSave={handleSave}/>
        )}
        {view==="calendar" && (
          <Calendario appointments={appointments} onEdit={handleEdit} onNewForDay={handleNewForDay}/>
        )}
        {view==="clients" && rol==="admin" && (
          <Clientes appointments={appointments} search={clientSearch} setSearch={setClientSearch} sort={clientSort} setSort={setClientSort}/>
        )}
        {view==="clients" && rol!=="admin" && (
          <div style={s.noAccess}>
            <div style={s.noAccessTitle}>🔒 Acceso restringido</div>
            <div style={s.noAccessText}>Solo el administrador puede ver esta sección.</div>
          </div>
        )}
      </main>
    </div>
  );
}