import { isToday, formatDate, formatTime, formatPrecio, SERVICE_INFO, DURATIONS, MAX_TURNOS_POR_DIA } from "../hooks/useTurnos";

const statusColors = {
  confirmado: { bg:"#d4f4e7", text:"#1a7a4a", dot:"#27ae60" },
  pendiente:  { bg:"#fef5dc", text:"#7a5a0a", dot:"#f0a500" },
  cancelado:  { bg:"#fde8e8", text:"#7a1a1a", dot:"#e53e3e" },
};

const s = {
  statsRow: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:18 },
  statCard: { background:"rgba(255,252,245,0.85)", borderRadius:14, padding:"18px 14px", textAlign:"center", boxShadow:"0 2px 12px rgba(100,70,40,0.1)", border:"1px solid rgba(168,130,90,0.15)" },
  statIcon: { fontSize:22, marginBottom:6 },
  statValue: { fontSize:28, fontWeight:700, color:"#3d2b1f", lineHeight:1 },
  statLabel: { fontSize:11, color:"#9a8060", letterSpacing:"0.08em", textTransform:"uppercase", marginTop:4 },
  statSub: { fontSize:10, fontWeight:700, marginTop:2 },
  alertaBanner: { background:"#fde8e8", border:"1.5px solid #e53e3e", borderRadius:10, padding:"12px 18px", fontSize:14, color:"#7a1a1a", marginBottom:14 },
  filterBanner: { background:"#fef5dc", border:"1.5px solid #f0a500", borderRadius:10, padding:"10px 18px", fontSize:13, color:"#7a5a0a", marginBottom:14, display:"flex", alignItems:"center", justifyContent:"space-between" },
  filterClear: { background:"transparent", border:"none", color:"#7a5a0a", cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:13 },
  searchRow: { display:"flex", gap:10, marginBottom:18 },
  searchWrap: { display:"flex", alignItems:"center", flex:1, background:"rgba(255,252,245,0.9)", borderRadius:12, border:"1px solid rgba(168,130,90,0.2)", padding:"10px 16px", boxShadow:"0 2px 8px rgba(100,70,40,0.06)" },
  searchInput: { flex:1, border:"none", background:"transparent", fontSize:15, color:"#3d2b1f", fontFamily:"inherit", outline:"none" },
  clearBtn: { background:"rgba(229,62,62,0.08)", border:"1.5px solid rgba(229,62,62,0.25)", borderRadius:10, padding:"10px 16px", color:"#c0392b", fontSize:13, cursor:"pointer", fontFamily:"inherit", fontWeight:600, whiteSpace:"nowrap" },
  list: { display:"flex", flexDirection:"column", gap:14 },
  empty: { textAlign:"center", padding:"60px 20px", background:"rgba(255,252,245,0.7)", borderRadius:16, border:"2px dashed rgba(168,130,90,0.2)" },
  card: { background:"rgba(255,252,245,0.92)", borderRadius:14, padding:"18px 20px", display:"flex", alignItems:"flex-start", gap:16, boxShadow:"0 2px 16px rgba(100,70,40,0.09)", border:"1px solid rgba(168,130,90,0.12)" },
  cardHoy: { border:"2px solid #c8873a", boxShadow:"0 2px 20px rgba(200,135,58,0.18)" },
  cardDateBox: { background:"linear-gradient(135deg,#3d2b1f,#6b4226)", borderRadius:10, padding:"10px 12px", textAlign:"center", minWidth:85 },
  cardDateBoxHoy: { background:"linear-gradient(135deg,#a0622a,#c8873a)" },
  hoyTag: { background:"rgba(255,255,255,0.2)", color:"#fff", fontSize:9, fontWeight:800, letterSpacing:"0.15em", borderRadius:4, padding:"2px 6px", marginBottom:4, display:"inline-block" },
  cardDateDay: { color:"#f0d9b5", fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase" },
  cardDateTime: { color:"#fff", fontSize:20, fontWeight:700, marginTop:2 },
  cardBody: { flex:1 },
  cardTop: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 },
  cardName: { fontSize:17, fontWeight:700, color:"#2a1a0e" },
  cardService: { fontSize:13, color:"#8a6a44", marginTop:2, fontStyle:"italic" },
  statusBadge: { display:"inline-flex", alignItems:"center", gap:5, borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:600 },
  statusDot: { width:7, height:7, borderRadius:"50%", display:"inline-block" },
  chips: { display:"flex", flexWrap:"wrap", gap:8 },
  chip: { background:"#f0e8db", borderRadius:20, padding:"4px 10px", fontSize:12, color:"#6b4a2a", display:"inline-flex", alignItems:"center", gap:4 },
  chipClickable: { cursor:"pointer" },
  editHint: { fontSize:11, opacity:0.6 },
  durEditor: { display:"flex", alignItems:"center", gap:6, marginTop:10, background:"#fef8f0", borderRadius:8, padding:"8px 12px", border:"1px solid #e0c8a8", flexWrap:"wrap" },
  durBtn: { background:"#f0e8db", border:"1.5px solid transparent", borderRadius:6, padding:"4px 10px", fontSize:12, color:"#6b4a2a", cursor:"pointer", fontFamily:"inherit", fontWeight:600 },
  durBtnActive: { background:"#3d2b1f", color:"#f0d9b5", border:"1.5px solid #3d2b1f" },
  durCancel: { background:"transparent", border:"none", cursor:"pointer", color:"#9a7a5a", fontSize:14, padding:"2px 6px", fontFamily:"inherit" },
  actions: { display:"flex", flexDirection:"column", gap:6 },
  actionBtn: { background:"#f0e8db", border:"none", borderRadius:8, padding:"7px 10px", fontSize:15, cursor:"pointer" },
};

export default function TurnosList({ appointments, loading, rol, search, setSearch, filterHoy, setFilterHoy, onEdit, onDelete, onUpdateDuration, onClearAll }) {
  const turnosHoy = appointments.filter(a => isToday(a.date) && a.status !== "cancelado");
  const cupoLibre = MAX_TURNOS_POR_DIA - turnosHoy.length;

  const filtered = appointments
    .filter(a => {
      const ms = a.name.toLowerCase().includes(search.toLowerCase()) || a.service.toLowerCase().includes(search.toLowerCase());
      return ms && (!filterHoy || isToday(a.date));
    })
    .sort((a,b) => a.date - b.date);

  const [editingDur, setEditingDur] = React.useState(null);

  const handleDurChange = async (id, dur) => {
    const err = await onUpdateDuration(id, dur);
    if (!err) setEditingDur(null);
  };

  return (
    <>
      <div style={s.statsRow}>
        {[
          { label:"Total Turnos", value:appointments.length, icon:"📋" },
          { label:"Confirmados", value:appointments.filter(a=>a.status==="confirmado").length, icon:"✅" },
          { label:"Pendientes", value:appointments.filter(a=>a.status==="pendiente").length, icon:"⏳" },
          { label:"Turnos Hoy", value:turnosHoy.length, icon:"📅",
            sub:`${cupoLibre} lugar${cupoLibre!==1?"es":""} libre${cupoLibre!==1?"s":""}`,
            subColor: cupoLibre===0?"#e53e3e":cupoLibre<=2?"#f0a500":"#27ae60", clickable:true },
        ].map(st=>(
          <div key={st.label} style={{...s.statCard, cursor:st.clickable?"pointer":"default", outline:st.clickable&&filterHoy?"2px solid #c8873a":"none"}}
            onClick={()=>st.clickable&&setFilterHoy(f=>!f)}>
            <div style={s.statIcon}>{st.icon}</div>
            <div style={s.statValue}>{st.value}</div>
            <div style={s.statLabel}>{st.label}</div>
            {st.sub && <div style={{...s.statSub, color:st.subColor}}>{st.sub}</div>}
          </div>
        ))}
      </div>

      {cupoLibre===0 && <div style={s.alertaBanner}>⚠️ <strong>Agenda completa para hoy</strong> — Límite de {MAX_TURNOS_POR_DIA} turnos alcanzado.</div>}
      {filterHoy && <div style={s.filterBanner}>📅 Mostrando solo turnos de hoy <button style={s.filterClear} onClick={()=>setFilterHoy(false)}>✕ Ver todos</button></div>}

      <div style={s.searchRow}>
        <div style={s.searchWrap}>
          <span style={{fontSize:16, marginRight:10}}>🔍</span>
          <input style={s.searchInput} placeholder="Buscar por nombre o servicio..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        {rol==="admin" && appointments.length>0 && (
          <button style={s.clearBtn} onClick={onClearAll}>🗑 Limpiar todo</button>
        )}
      </div>

      <div style={s.list}>
        {loading && <div style={s.empty}><div style={{fontSize:36,marginBottom:10}}>⏳</div><div style={{color:"#7a6e5f"}}>Cargando turnos...</div></div>}
        {!loading && filtered.length===0 && (
          <div style={s.empty}><div style={{fontSize:48,marginBottom:12}}>🌿</div><div style={{fontFamily:"Georgia,serif",fontSize:18,color:"#7a6e5f"}}>{filterHoy?"No hay turnos para hoy":"No hay turnos registrados"}</div></div>
        )}
        {!loading && filtered.map(appt=>{
          const sc = statusColors[appt.status]||statusColors.pendiente;
          const esHoy = isToday(appt.date);
          return (
            <div key={appt.id} style={{...s.card,...(esHoy?s.cardHoy:{})}}>
              <div style={{...s.cardDateBox,...(esHoy?s.cardDateBoxHoy:{})}}>
                {esHoy && <div style={s.hoyTag}>HOY</div>}
                <div style={s.cardDateDay}>{formatDate(appt.date)}</div>
                <div style={s.cardDateTime}>{formatTime(appt.date)}</div>
              </div>
              <div style={s.cardBody}>
                <div style={s.cardTop}>
                  <div>
                    <div style={s.cardName}>{appt.name}</div>
                    <div style={s.cardService}>{appt.service}</div>
                  </div>
                  <span style={{...s.statusBadge,background:sc.bg,color:sc.text}}>
                    <span style={{...s.statusDot,background:sc.dot}}/>{appt.status}
                  </span>
                </div>
                <div style={s.chips}>
                  <span style={s.chip}>📧 {appt.email}</span>
                  <span style={s.chip}>📞 {appt.phone}</span>
                  <span style={{...s.chip,...s.chipClickable}} onClick={()=>setEditingDur(editingDur===appt.id?null:appt.id)}>
                    ⏱ {appt.duration} min <span style={s.editHint}>✏️</span>
                  </span>
                  {SERVICE_INFO[appt.service] && <span style={s.chip}>💰 {formatPrecio(SERVICE_INFO[appt.service].precio)}</span>}
                </div>
                {editingDur===appt.id && (
                  <div style={s.durEditor}>
                    <span style={{fontSize:13,color:"#7a6e5f",marginRight:8}}>Cambiar duración:</span>
                    {DURATIONS.map(d=>(
                      <button key={d} style={{...s.durBtn,...(appt.duration===d?s.durBtnActive:{})}} onClick={()=>handleDurChange(appt.id,d)}>{d}m</button>
                    ))}
                    <button style={s.durCancel} onClick={()=>setEditingDur(null)}>✕</button>
                  </div>
                )}
              </div>
              <div style={s.actions}>
                <button style={s.actionBtn} onClick={()=>onEdit(appt)}>✏️</button>
                {rol==="admin" && <button style={{...s.actionBtn,color:"#e53e3e"}} onClick={()=>onDelete(appt.id)}>🗑</button>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// Need React import for useState
import React from "react";
