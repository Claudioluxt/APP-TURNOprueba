import { formatPrecio, SERVICE_INFO } from "../hooks/useTurnos";

const s = {
  header: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 },
  title: { fontSize:22, fontWeight:700, color:"#2a1a0e" },
  sub: { fontSize:13, color:"#8a6a44", marginTop:4 },
  exportBtn: { background:"linear-gradient(135deg,#3d2b1f,#6b4226)", color:"#f0d9b5", border:"none", borderRadius:8, padding:"10px 18px", fontSize:13, fontFamily:"inherit", cursor:"pointer", fontWeight:600 },
  toolbar: { display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" },
  searchWrap: { display:"flex", alignItems:"center", flex:1, minWidth:200, background:"rgba(255,252,245,0.9)", borderRadius:12, border:"1px solid rgba(168,130,90,0.2)", padding:"10px 16px" },
  searchInput: { flex:1, border:"none", background:"transparent", fontSize:15, color:"#3d2b1f", fontFamily:"inherit", outline:"none" },
  sortBtn: { background:"rgba(255,252,245,0.9)", border:"1.5px solid #e0c8a8", borderRadius:8, padding:"9px 14px", fontSize:12, fontFamily:"inherit", cursor:"pointer", color:"#6b4a2a", fontWeight:600 },
  sortBtnActive: { background:"#3d2b1f", color:"#f0d9b5", borderColor:"#3d2b1f" },
  statsRow: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 },
  statCard: { background:"rgba(255,252,245,0.85)", borderRadius:14, padding:"18px 14px", textAlign:"center", boxShadow:"0 2px 12px rgba(100,70,40,0.1)", border:"1px solid rgba(168,130,90,0.15)" },
  statIcon: { fontSize:22, marginBottom:6 },
  statValue: { fontWeight:700, color:"#3d2b1f", lineHeight:1 },
  statLabel: { fontSize:11, color:"#9a8060", letterSpacing:"0.08em", textTransform:"uppercase", marginTop:4 },
  table: { background:"rgba(255,252,245,0.95)", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 16px rgba(100,70,40,0.09)", border:"1px solid rgba(168,130,90,0.15)" },
  thead: { display:"flex", gap:12, padding:"12px 18px", background:"linear-gradient(135deg,#3d2b1f,#6b4226)", color:"#f0d9b5", fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" },
  row: { display:"flex", gap:12, padding:"14px 18px", borderBottom:"1px solid rgba(168,130,90,0.1)", alignItems:"flex-start" },
  clientName: { fontWeight:700, color:"#2a1a0e", fontSize:15 },
  recBadge: { fontSize:10, background:"#d4f4e7", color:"#1a7a4a", borderRadius:10, padding:"2px 8px", fontWeight:600 },
  contact: { fontSize:12, color:"#6b4a2a", marginTop:2 },
  serviceTag: { fontSize:11, color:"#8a6a44", fontStyle:"italic", marginTop:2 },
  turnosNum: { fontSize:22, fontWeight:700, color:"#3d2b1f" },
  empty: { textAlign:"center", padding:"60px 20px", background:"rgba(255,252,245,0.7)", borderRadius:16, border:"2px dashed rgba(168,130,90,0.2)" },
};

export default function Clientes({ appointments, search, setSearch, sort, setSort }) {
  const clientMap = {};
  appointments.forEach(a => {
    const key = a.email.toLowerCase();
    if (!clientMap[key]) clientMap[key] = { name:a.name, email:a.email, phone:a.phone, turnos:[], services:new Set() };
    clientMap[key].turnos.push(a);
    clientMap[key].services.add(a.service);
  });

  const clients = Object.values(clientMap).map(c => ({
    ...c,
    total: c.turnos.length,
    activos: c.turnos.filter(t=>t.status!=="cancelado").length,
    ultimoTurno: c.turnos.sort((a,b)=>b.date-a.date)[0].date,
    services: [...c.services],
    acumulado: c.turnos.filter(t=>t.status!=="cancelado").reduce((acc,a)=>acc+(SERVICE_INFO[a.service]?.precio||0),0),
  }));

  const sorted = [...clients]
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
    .sort((a,b) => sort==="name" ? a.name.localeCompare(b.name) : sort==="total" ? b.total-a.total : b.ultimoTurno-a.ultimoTurno);

  const recaudacionTotal = appointments.filter(a=>a.status!=="cancelado").reduce((acc,a)=>acc+(SERVICE_INFO[a.service]?.precio||0),0);
  const servicioTop = (() => {
    const cnt={};
    appointments.forEach(a=>{cnt[a.service]=(cnt[a.service]||0)+1;});
    return Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0]?.[0]?.split(" ").slice(0,2).join(" ")||"—";
  })();

  const exportCSV = () => {
    const header = ["Nombre","Email","Teléfono","Total turnos","Activos","Acumulado","Último turno","Servicios"];
    const rows = sorted.map(c=>[c.name,c.email,c.phone,c.total,c.activos,c.acumulado,c.ultimoTurno.toLocaleDateString("es-AR"),c.services.join(" / ")]);
    const csv = [header,...rows].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="clientes-aura.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div style={s.header}>
        <div>
          <div style={s.title}>👥 Clientes registrados</div>
          <div style={s.sub}>{clients.length} cliente{clients.length!==1?"s":""} únicos · {appointments.length} turno{appointments.length!==1?"s":""} en total</div>
        </div>
        <button style={s.exportBtn} onClick={exportCSV}>⬇ Exportar CSV</button>
      </div>

      <div style={s.toolbar}>
        <div style={s.searchWrap}>
          <span style={{fontSize:16,marginRight:10}}>🔍</span>
          <input style={s.searchInput} placeholder="Buscar por nombre, email o teléfono..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[["name","A–Z"],["total","Más turnos"],["ultimo","Último turno"]].map(([val,label])=>(
            <button key={val} style={{...s.sortBtn,...(sort===val?s.sortBtnActive:{})}} onClick={()=>setSort(val)}>{label}</button>
          ))}
        </div>
      </div>

      <div style={s.statsRow}>
        {[
          {label:"Clientes únicos", value:clients.length, icon:"👤", big:true},
          {label:"Recurrentes", value:clients.filter(c=>c.total>1).length, icon:"🔄", big:true},
          {label:"Recaudación total", value:formatPrecio(recaudacionTotal), icon:"💰", big:false},
        ].map(st=>(
          <div key={st.label} style={s.statCard}>
            <div style={s.statIcon}>{st.icon}</div>
            <div style={{...s.statValue, fontSize:st.big?28:18}}>{st.value}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      {sorted.length===0
        ? <div style={s.empty}><div style={{fontSize:48,marginBottom:12}}>👤</div><div style={{fontFamily:"Georgia,serif",fontSize:18,color:"#7a6e5f"}}>Sin clientes</div></div>
        : <div style={s.table}>
            <div style={s.thead}>
              <div style={{flex:2}}>Cliente</div>
              <div style={{flex:2}}>Contacto</div>
              <div style={{flex:2}}>Servicios</div>
              <div style={{flex:"0 0 70px",textAlign:"center"}}>Turnos</div>
              <div style={{flex:"0 0 100px",textAlign:"right"}}>Acumulado</div>
              <div style={{flex:"0 0 110px",textAlign:"right"}}>Último turno</div>
            </div>
            {sorted.map((c,i)=>(
              <div key={c.email} style={{...s.row,...(i%2===0?{}:{background:"rgba(240,232,219,0.3)"})}}>
                <div style={{flex:2}}>
                  <div style={s.clientName}>{c.name}</div>
                  {c.total>1 && <span style={s.recBadge}>🔄 recurrente</span>}
                </div>
                <div style={{flex:2}}>
                  <div style={s.contact}>📧 {c.email}</div>
                  <div style={s.contact}>📞 {c.phone}</div>
                </div>
                <div style={{flex:2}}>{c.services.map(sv=><div key={sv} style={s.serviceTag}>{sv}</div>)}</div>
                <div style={{flex:"0 0 70px",textAlign:"center"}}>
                  <div style={s.turnosNum}>{c.activos}</div>
                  {c.activos!==c.total&&<div style={{fontSize:10,color:"#9a8060"}}>{c.total} total</div>}
                </div>
                <div style={{flex:"0 0 100px",textAlign:"right"}}>
                  <div style={{...s.contact,fontWeight:700,color:"#6b4226"}}>{formatPrecio(c.acumulado)}</div>
                </div>
                <div style={{flex:"0 0 110px",textAlign:"right"}}>
                  <div style={s.contact}>{c.ultimoTurno.toLocaleDateString("es-AR",{day:"2-digit",month:"short",year:"numeric"})}</div>
                </div>
              </div>
            ))}
          </div>
      }
    </>
  );
}
