import { useState } from "react";
import { isToday, isSameDay, formatTime, formatPrecio, SERVICE_INFO, MAX_TURNOS_POR_DIA } from "../hooks/useTurnos";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_CORTOS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DIAS_LABORABLES = [1,2,3,4,5];

const getCalDays = (y, m) => {
  const first = new Date(y,m,1).getDay();
  const total = new Date(y,m+1,0).getDate();
  const cells = [];
  for (let i=0;i<first;i++) cells.push(null);
  for (let d=1;d<=total;d++) cells.push(new Date(y,m,d));
  return cells;
};

const statusColors = {
  confirmado: { bg:"#d4f4e7", text:"#1a7a4a", dot:"#27ae60" },
  pendiente:  { bg:"#fef5dc", text:"#7a5a0a", dot:"#f0a500" },
  cancelado:  { bg:"#fde8e8", text:"#7a1a1a", dot:"#e53e3e" },
};

const s = {
  calHeader: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 },
  calTitle: { fontSize:22, fontWeight:700, color:"#2a1a0e" },
  navBtn: { background:"rgba(255,252,245,0.9)", border:"1.5px solid #e0c8a8", borderRadius:8, width:38, height:38, fontSize:20, cursor:"pointer", color:"#6b4226" },
  grid: { display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:6, marginBottom:16 },
  dayHeader: { textAlign:"center", fontSize:12, fontWeight:700, color:"#9a8060", letterSpacing:"0.08em", textTransform:"uppercase", padding:"8px 0" },
  cell: { background:"rgba(255,252,245,0.85)", borderRadius:10, padding:"10px 8px", minHeight:70, border:"1.5px solid rgba(168,130,90,0.12)", display:"flex", flexDirection:"column", alignItems:"center", gap:4 },
  cellHoy: { border:"2px solid #c8873a", background:"rgba(200,135,58,0.08)" },
  cellSelected: { border:"2px solid #3d2b1f", background:"rgba(61,43,31,0.06)", boxShadow:"0 2px 12px rgba(61,43,31,0.12)" },
  cellWeekend: { background:"rgba(200,190,180,0.2)", opacity:0.5 },
  dayNum: { fontSize:16, fontWeight:700, color:"#2a1a0e" },
  badge: { borderRadius:10, padding:"2px 8px", fontSize:11, fontWeight:700, color:"#fff" },
  libre: { fontSize:10, color:"#9a8060", letterSpacing:"0.06em" },
  legend: { display:"flex", gap:20, flexWrap:"wrap", marginBottom:20, padding:"12px 16px", background:"rgba(255,252,245,0.8)", borderRadius:10, border:"1px solid rgba(168,130,90,0.15)" },
  panel: { background:"rgba(255,252,245,0.96)", borderRadius:16, padding:"24px", boxShadow:"0 4px 24px rgba(100,70,40,0.1)", border:"1px solid rgba(168,130,90,0.18)" },
  panelHeader: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18, flexWrap:"wrap", gap:12 },
  panelTitle: { fontSize:18, fontWeight:700, color:"#2a1a0e", textTransform:"capitalize" },
  panelSub: { fontSize:13, color:"#8a6a44", marginTop:4 },
  newBtn: { background:"linear-gradient(135deg,#3d2b1f,#6b4226)", color:"#f0d9b5", border:"none", borderRadius:8, padding:"9px 18px", fontSize:13, fontFamily:"inherit", cursor:"pointer", fontWeight:600 },
  emptyPanel: { textAlign:"center", padding:"32px", color:"#9a8060", fontSize:16, fontFamily:"Georgia,serif" },
  apptList: { display:"flex", flexDirection:"column", gap:10 },
  apptRow: { display:"flex", alignItems:"center", gap:12, background:"#fef8f0", borderRadius:10, padding:"12px 14px", border:"1px solid #ecdcc8" },
  apptTime: { textAlign:"center", minWidth:44 },
  apptDur: { fontSize:11, color:"#9a8060", marginTop:2 },
  apptInfo: { flex:1 },
  apptName: { fontWeight:700, color:"#2a1a0e", fontSize:15 },
  apptService: { fontSize:12, color:"#8a6a44", fontStyle:"italic", marginTop:2 },
  statusBadge: { display:"inline-flex", alignItems:"center", gap:5, borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:600 },
  statusDot: { width:7, height:7, borderRadius:"50%", display:"inline-block" },
  actionBtn: { background:"#f0e8db", border:"none", borderRadius:8, padding:"7px 10px", fontSize:15, cursor:"pointer" },
};

export default function Calendario({ appointments, onEdit, onNewForDay, user, rol }) {
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  const navMes = (delta) => {
    let m = calMonth+delta, y = calYear;
    if (m<0) { m=11; y--; } if (m>11) { m=0; y++; }
    setCalMonth(m); setCalYear(y); setSelectedDay(null);
  };

  // Los globitos del calendario se cuentan globales para saber la ocupación real de los cupos
  const getTurnosDia = (date) => date
    ? appointments.filter(a => isSameDay(a.date, date) && a.status !== "cancelado")
    : [];

  // El panel lateral visual filtra los datos personales si es cliente
  const turnosDiaSeleccionado = selectedDay
    ? appointments
        .filter(a => isSameDay(a.date, selectedDay))
        .filter(a => rol === "cliente" ? a.email.toLowerCase() === user?.email?.toLowerCase() : true)
        .sort((a,b)=>a.date-b.date)
    : [];

  const activosGlobales = selectedDay ? appointments.filter(a => isSameDay(a.date, selectedDay) && a.status !== "cancelado").length : 0;
  const libres = MAX_TURNOS_POR_DIA - activosGlobales;

  return (
    <>
      <div style={s.calHeader}>
        <button style={s.navBtn} onClick={()=>navMes(-1)}>‹</button>
        <div style={s.calTitle}>{MESES[calMonth]} {calYear}</div>
        <button style={s.navBtn} onClick={()=>navMes(1)}>›</button>
      </div>

      <div style={s.grid}>
        {DIAS_CORTOS.map(d=><div key={d} style={s.dayHeader}>{d}</div>)}
        {getCalDays(calYear,calMonth).map((date,i)=>{
          if (!date) return <div key={`e-${i}`}/>;
          const laborable = DIAS_LABORABLES.includes(date.getDay());
          const turnos = getTurnosDia(date);
          const ocupados = turnos.length;
          const lleno = ocupados>=MAX_TURNOS_POR_DIA;
          const casiLleno = !lleno && (MAX_TURNOS_POR_DIA-ocupados)<=2;
          const esHoy = isToday(date);
          const isSel = selectedDay && isSameDay(date,selectedDay);
          const dotColor = laborable && ocupados>0 ? (lleno?"#e53e3e":casiLleno?"#f0a500":"#27ae60") : "transparent";

          return (
            <div key={date.toISOString()}
              style={{...s.cell,...(esHoy?s.cellHoy:{}),...(isSel?s.cellSelected:{}),...(!laborable?s.cellWeekend:{}), cursor:laborable?"pointer":"default"}}
              onClick={()=>laborable&&setSelectedDay(isSel?null:date)}>
              <div style={s.dayNum}>{date.getDate()}</div>
              {laborable && ocupados>0 && <div style={{...s.badge,background:dotColor}}>{ocupados}/{MAX_TURNOS_POR_DIA}</div>}
              {laborable && ocupados===0 && <div style={s.libre}>libre</div>}
            </div>
          );
        })}
      </div>

      <div style={s.legend}>
        {[["#27ae60","Con turnos, cupo disponible"],["#f0a500","Casi completo (≤2 lugares)"],["#e53e3e","Completo"]].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#7a6e5f"}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:c}}/>
            {l}
          </div>
        ))}
      </div>

      {selectedDay && (
        <div style={s.panel}>
          <div style={s.panelHeader}>
            <div>
              <div style={s.panelTitle}>{selectedDay.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}</div>
              <div style={s.panelSub}>{turnosDiaSeleccionado.length} turno(s) visible(s) · {libres} lugar(es) libre(s)</div>
            </div>
            <button style={s.newBtn} onClick={()=>onNewForDay(selectedDay)}>+ Nuevo turno este día</button>
          </div>

          {turnosDiaSeleccionado.length===0
            ? <div style={s.emptyPanel}>🌿 Sin turnos para este día</div>
            : <div style={s.apptList}>
                {turnosDiaSeleccionado.map(appt=>{
                  const sc = statusColors[appt.status]||statusColors.pendiente;
                  return (
                    <div key={appt.id} style={s.apptRow}>
                      <div style={s.apptTime}>
                        <div style={{fontWeight:700,color:"#2a1a0e"}}>{formatTime(appt.date)}</div>
                        <div style={s.apptDur}>{appt.duration}m</div>
                      </div>
                      <div style={s.apptInfo}>
                        <div style={s.apptName}>{appt.name}</div>
                        <div style={s.apptService}>{appt.service}{SERVICE_INFO[appt.service]?" · "+formatPrecio(SERVICE_INFO[appt.service].precio):""}</div>
                      </div>
                      <span style={{...s.statusBadge,background:sc.bg,color:sc.text}}>
                        <span style={{...s.statusDot,background:sc.dot}}/>{appt.status}
                      </span>
                      <button style={s.actionBtn} onClick={()=>onEdit(appt)}>✏️</button>
                    </div>
                  );
                })}
              </div>
          }
        </div>
      )}
    </>
  );
}
