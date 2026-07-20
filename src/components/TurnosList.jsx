import { useState, useEffect } from "react";
import { isToday, formatDate, formatTime, formatPrecio, SERVICE_INFO, DURATIONS, MAX_TURNOS_POR_DIA } from "../hooks/useTurnos";

const statusColors = {
  confirmado: { bg:"#d4f4e7", text:"#1a7a4a", dot:"#27ae60" },
  pendiente:  { bg:"#fef5dc", text:"#7a5a0a", dot:"#f0a500" },
  cancelado:  { bg:"#fde8e8", text:"#7a1a1a", dot:"#e53e3e" },
};

const s = {
  statsRow: { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:14, marginBottom:18 },
  statCard: { background:"rgba(255,255,255,0.9)", borderRadius:14, padding:"18px 14px", textAlign:"center", boxShadow:"0 2px 12px rgba(44,62,50,0.08)", border:"1px solid rgba(212,175,55,0.2)" },
  statIcon: { fontSize:22, marginBottom:6 },
  statValue: { fontSize:28, fontWeight:700, color:"#1a251d", lineHeight:1 },
  statLabel: { fontSize:11, color:"#5a6e5a", letterSpacing:"0.08em", textTransform:"uppercase", marginTop:4 },
  statSub: { fontSize:10, fontWeight:700, marginTop:2 },
  alertaBanner: { background:"#fde8e8", border:"1.5px solid #e53e3e", borderRadius:10, padding:"12px 18px", fontSize:14, color:"#7a1a1a", marginBottom:14 },
  filterBanner: { background:"#fef5dc", border:"1.5px solid #f0a500", borderRadius:10, padding:"10px 18px", fontSize:13, color:"#7a5a0a", marginBottom:14, display:"flex", alignItems:"center", justifyContent:"space-between" },
  filterClear: { background:"transparent", border:"none", color:"#7a5a0a", cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:13 },
  searchRow: { display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" },
  searchWrap: { display:"flex", alignItems:"center", flex:1, minWidth:250, background:"rgba(255,255,255,0.9)", borderRadius:12, border:"1px solid rgba(212,175,55,0.3)", padding:"10px 16px", boxShadow:"0 2px 8px rgba(44,62,50,0.06)" },
  searchInput: { flex:1, border:"none", background:"transparent", fontSize:15, color:"#1a251d", fontFamily:"inherit", outline:"none" },
  clearBtn: { background:"rgba(229,62,62,0.08)", border:"1.5px solid rgba(229,62,62,0.25)", borderRadius:10, padding:"10px 16px", color:"#c0392b", fontSize:13, cursor:"pointer", fontFamily:"inherit", fontWeight:600, whiteSpace:"nowrap" },
  list: { display:"flex", flexDirection:"column", gap:14 },
  empty: { textAlign:"center", padding:"60px 20px", background:"rgba(255,255,255,0.6)", borderRadius:16, border:"2px dashed rgba(212,175,55,0.3)" },
  card: { background:"rgba(255,255,255,0.95)", borderRadius:14, padding:"18px 20px", display:"flex", gap:16, boxShadow:"0 2px 16px rgba(44,62,50,0.06)", border:"1px solid rgba(212,175,55,0.15)" },
  cardHoy: { border:"2px solid #d4af37", boxShadow:"0 2px 20px rgba(212,175,55,0.15)" },
  cardDateBox: { background:"linear-gradient(135deg, #2c3e32, #1a251d)", borderRadius:10, padding:"10px 12px", textAlign:"center", minWidth:85 },
  cardDateBoxHoy: { background:"linear-gradient(135deg, #d4af37, #b5952f)" },
  hoyTag: { background:"rgba(255,255,255,0.2)", color:"#fff", fontSize:9, fontWeight:800, letterSpacing:"0.15em", borderRadius:4, padding:"2px 6px", display:"inline-block" },
  cardDateDay: { color:"#fff", fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase" },
  cardDateTime: { color:"#fff", fontSize:20, fontWeight:700 },
  cardBody: { flex:1 },
  cardTop: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10, flexWrap:"wrap", gap:10 },
  cardName: { fontSize:17, fontWeight:700, color:"#1a251d" },
  cardService: { fontSize:13, color:"#5a6e5a", marginTop:2, fontStyle:"italic" },
  statusBadge: { display:"inline-flex", alignItems:"center", gap:5, borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:600 },
  statusDot: { width:7, height:7, borderRadius:"50%", display:"inline-block" },
  chips: { display:"flex", flexWrap:"wrap", gap:8 },
  chip: { background:"#f4f7f4", border:"1px solid #e2e8e2", borderRadius:20, padding:"4px 10px", fontSize:12, color:"#2c3e32", display:"inline-flex", alignItems:"center", gap:4 },
  chipClickable: { cursor:"pointer" },
  editHint: { fontSize:11, opacity:0.6 },
  durEditor: { display:"flex", alignItems:"center", gap:6, marginTop:10, background:"#f4f7f4", borderRadius:8, padding:"8px 12px", border:"1px solid #d4af37", flexWrap:"wrap" },
  durBtn: { background:"#fff", border:"1.5px solid transparent", borderRadius:6, padding:"4px 10px", fontSize:12, color:"#2c3e32", cursor:"pointer", fontFamily:"inherit", fontWeight:600 },
  durBtnActive: { background:"#2c3e32", color:"#d4af37", border:"1.5px solid #2c3e32" },
  durCancel: { background:"transparent", border:"none", cursor:"pointer", color:"#5a6e5a", fontSize:14, padding:"2px 6px", fontFamily:"inherit" },
  actions: { display:"flex", gap:8 },
  actionBtn: { background:"#f4f7f4", border:"1px solid #e2e8e2", borderRadius:8, padding:"8px 12px", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, fontWeight:600, color:"#1a251d" },
};

export default function TurnosList({ appointments, loading, rol, search, setSearch, filterHoy, setFilterHoy, onEdit, onDelete, onUpdateDuration, onClearAll, user }) {
  // ... [MANTENER EL RESTO DE LA LÓGICA DEL COMPONENTE EXACTAMENTE IGUAL HASTA EL RETURN] ...
  const [isMobile, setIsMobile] = useState(window.innerWidth < 650);
  const [editingDur, setEditingDur] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 650);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const turnosHoyGlobales = appointments.filter(a => isToday(a.date) && a.status !== "cancelado");
  const cupoLibre = MAX_TURNOS_POR_DIA - turnosHoyGlobales.length;

  const misTurnos = rol === "cliente"
    ? appointments.filter(a => a.email.toLowerCase() === user?.email?.toLowerCase())
    : appointments;

  const turnosHoyVisibles = misTurnos.filter(a => isToday(a.date) && a.status !== "cancelado");

  const filtered = misTurnos
    .filter(a => {
      const ms = a.name.toLowerCase().includes(search.toLowerCase()) || a.service.toLowerCase().includes(search.toLowerCase());
      return ms && (!filterHoy || isToday(a.date));
    })
    .sort((a,b) => a.date - b.date);

  const handleDurChange = async (id, dur) => {
    const err = await onUpdateDuration(id, dur);
    if (!err) setEditingDur(null);
  };

  return (
    <>
      <div style={s.statsRow}>
        {[
          { label: rol === "cliente" ? "Mis Turnos" : "Total Turnos", value: misTurnos.length, icon: "📋" },
          { label: "Confirmados", value: misTurnos.filter(a => a.status === "confirmado").length, icon: "✅" },
          { label: "Pendientes", value: misTurnos.filter(a => a.status === "pendiente").length, icon: "⏳" },
          { label: rol === "cliente" ? "Mis Turnos Hoy" : "Turnos Hoy", value: turnosHoyVisibles.length, icon: "📅",
            sub: `${cupoLibre} lugar${cupoLibre !== 1 ? "es" : ""} libre${cupoLibre !== 1 ? "s" : ""}`,
            subColor: cupoLibre === 0 ? "#e53e3e" : cupoLibre <= 2 ? "#f0a500" : "#27ae60", clickable: true },
        ].map(st => (
          <div key={st.label} style={{ ...s.statCard, cursor: st.clickable ? "pointer" : "default", outline: st.clickable && filterHoy ? "2px solid #d4af37" : "none" }}
            onClick={() => st.clickable && setFilterHoy(f => !f)}>
            <div style={s.statIcon}>{st.icon}</div>
            <div style={s.statValue}>{st.value}</div>
            <div style={s.statLabel}>{st.label}</div>
            {st.sub && <div style={{ ...s.statSub, color: st.subColor }}>{st.sub}</div>}
          </div>
        ))}
      </div>

      {cupoLibre === 0 && <div style={s.alertaBanner}>⚠️ <strong>Agenda completa para hoy</strong> — Límite de {MAX_TURNOS_POR_DIA} turnos alcanzado.</div>}
      {filterHoy && <div style={s.filterBanner}>📅 Mostrando solo turnos de hoy <button style={s.filterClear} onClick={() => setFilterHoy(false)}>✕ Ver todos</button></div>}

      <div style={s.searchRow}>
        <div style={s.searchWrap}>
          <span style={{ fontSize: 16, marginRight: 10 }}>🔍</span>
          <input id="search-turnos" name="search-turnos" style={s.searchInput} placeholder="Buscar por nombre o servicio..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {rol === "admin" && appointments.length > 0 && (
          <button style={s.clearBtn} onClick={onClearAll}>🗑 Limpiar todo</button>
        )}
      </div>

      <div style={s.list}>
        {loading && <div style={s.empty}><div style={{ fontSize: 36, marginBottom: 10 }}>⏳</div><div style={{ color: "#5a6e5a" }}>Cargando turnos...</div></div>}
        {!loading && filtered.length === 0 && (
          <div style={s.empty}><div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div><div style={{ fontFamily: "Georgia,serif", fontSize: 18, color: "#5a6e5a" }}>{filterHoy ? "No hay turnos para hoy" : "No hay turnos registrados"}</div></div>
        )}
        
        {!loading && filtered.map(appt => {
          const sc = statusColors[appt.status] || statusColors.pendiente;
          const esHoy = isToday(appt.date);
          
          return (
            <div key={appt.id} style={{ 
              ...s.card, 
              ...(esHoy ? s.cardHoy : {}),
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "flex-start" 
            }}>
              
              <div style={{ 
                ...s.cardDateBox, 
                ...(esHoy ? s.cardDateBoxHoy : {}),
                display: isMobile ? "flex" : "block",
                justifyContent: "space-between",
                alignItems: "center",
                padding: isMobile ? "12px 16px" : "10px 12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {esHoy && <div style={{ ...s.hoyTag, marginBottom: isMobile ? 0 : 4 }}>HOY</div>}
                  <div style={s.cardDateDay}>{formatDate(appt.date)}</div>
                </div>
                <div style={{ ...s.cardDateTime, marginTop: isMobile ? 0 : 2 }}>{formatTime(appt.date)}</div>
              </div>
              
              <div style={s.cardBody}>
                <div style={s.cardTop}>
                  <div>
                    <div style={s.cardName}>{appt.name}</div>
                    <div style={s.cardService}>{appt.service}</div>
                  </div>
                  <span style={{ ...s.statusBadge, background: sc.bg, color: sc.text }}>
                    <span style={{ ...s.statusDot, background: sc.dot }} />{appt.status}
                  </span>
                </div>
                <div style={s.chips}>
                  <span style={s.chip}>📧 {appt.email}</span>
                  <span style={s.chip}>📞 {appt.phone}</span>
                  <span style={{ ...s.chip, ...(rol !== "cliente" ? s.chipClickable : {}) }} onClick={() => rol !== "cliente" && setEditingDur(editingDur === appt.id ? null : appt.id)}>
                    ⏱ {appt.duration} min {rol !== "cliente" && <span style={s.editHint}>✏️</span>}
                  </span>
                  {SERVICE_INFO[appt.service] && <span style={s.chip}>💰 {formatPrecio(SERVICE_INFO[appt.service].precio)}</span>}
                </div>
                {editingDur === appt.id && (
                  <div style={s.durEditor}>
                    <span style={{ fontSize: 13, color: "#5a6e5a", marginRight: 8 }}>Cambiar duración:</span>
                    {DURATIONS.map(d => (
                      <button key={d} type="button" style={{ ...s.durBtn, ...(appt.duration === d ? s.durBtnActive : {}) }} onClick={() => handleDurChange(appt.id, d)}>{d}m</button>
                    ))}
                    <button type="button" style={s.durCancel} onClick={() => setEditingDur(null)}>✕</button>
                  </div>
                )}
              </div>
              
              <div style={{ 
                ...s.actions, 
                flexDirection: isMobile ? "row" : "column",
                marginTop: isMobile ? 8 : 0,
                borderTop: isMobile ? "1px solid rgba(212,175,55,0.15)" : "none",
                paddingTop: isMobile ? 16 : 0
              }}>
                <button 
                  style={{ ...s.actionBtn, flex: isMobile ? 1 : "none" }} 
                  onClick={() => onEdit(appt)}
                >
                  ✏️ {isMobile ? "Editar" : ""}
                </button>
                {rol === "admin" && (
                  <button 
                    style={{ ...s.actionBtn, color: "#e53e3e", flex: isMobile ? 1 : "none" }} 
                    onClick={() => onDelete(appt.id)}
                  >
                    🗑 {isMobile ? "Eliminar" : ""}
                  </button>
                )}
              </div>
              
            </div>
          );
        })}
      </div>
    </>
  );
}