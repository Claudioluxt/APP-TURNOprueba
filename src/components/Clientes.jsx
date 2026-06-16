import React from "react";
import { formatDate } from "../hooks/useTurnos";

const s = {
  // AJUSTE RESPONSIVE: Grilla fluida para las estadísticas
  statsRow: { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:14, marginBottom:18 },
  statCard: { background:"rgba(255,252,245,0.85)", borderRadius:14, padding:"18px 14px", textAlign:"center", boxShadow:"0 2px 12px rgba(100,70,40,0.1)", border:"1px solid rgba(168,130,90,0.15)" },
  statIcon: { fontSize:22, marginBottom:6 },
  statValue: { fontSize:28, fontWeight:700, color:"#3d2b1f", lineHeight:1 },
  statLabel: { fontSize:11, color:"#9a8060", letterSpacing:"0.08em", textTransform:"uppercase", marginTop:4 },
  
  // AJUSTE RESPONSIVE: flexWrap para que el buscador y el selector no colisionen
  searchRow: { display:"flex", gap:10, marginBottom:18, flexWrap: "wrap" },
  searchWrap: { display:"flex", alignItems:"center", flex:1, background:"rgba(255,252,245,0.9)", borderRadius:12, border:"1px solid rgba(168,130,90,0.2)", padding:"10px 16px", minWidth: 250 },
  searchInput: { flex:1, border:"none", background:"transparent", fontSize:15, color:"#3d2b1f", fontFamily:"inherit", outline:"none" },
  selectSort: { background:"rgba(255,252,245,0.9)", border:"1px solid rgba(168,130,90,0.2)", borderRadius:12, padding:"10px 16px", color:"#3d2b1f", fontSize:14, fontFamily:"inherit", outline:"none", flex: "1 1 200px" },
  
  // AJUSTE RESPONSIVE: Grilla fluida para las tarjetas de clientes
  list: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:16 },
  card: { background:"rgba(255,252,245,0.92)", borderRadius:14, padding:"20px", boxShadow:"0 2px 16px rgba(100,70,40,0.09)", border:"1px solid rgba(168,130,90,0.12)", display:"flex", flexDirection:"column", gap:12 },
  headerRow: { display:"flex", alignItems:"center", gap:12 },
  avatar: { width:42, height:42, borderRadius:"50%", background:"linear-gradient(135deg,#c8873a,#a0622a)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, flexShrink: 0 },
  name: { fontSize:16, fontWeight:700, color:"#2a1a0e" },
  email: { fontSize:12, color:"#8a6a44" },
  phone: { fontSize:12, color:"#8a6a44", marginTop:2 },
  divider: { height:1, background:"rgba(168,130,90,0.15)", margin:"4px 0" },
  infoRow: { display:"flex", justifyContent:"space-between", fontSize:13 },
  infoLabel: { color:"#9a8060" },
  infoValue: { fontWeight:600, color:"#3d2b1f" },
  empty: { textAlign:"center", padding:"60px 20px", background:"rgba(255,252,245,0.7)", borderRadius:16, border:"2px dashed rgba(168,130,90,0.2)", gridColumn:"1/-1" },
};

export default function Clientes({ appointments, search, setSearch, sort, setSort }) {
  // 1. Agrupar turnos por cliente (usando el email como ID único)
  const clientesMap = {};
  appointments.forEach(a => {
    const key = a.email.toLowerCase();
    if (!clientesMap[key]) {
      clientesMap[key] = {
        name: a.name,
        email: a.email,
        phone: a.phone,
        turnos: [],
      };
    }
    clientesMap[key].turnos.push(a);
  });

  // 2. Calcular métricas por cliente
  let clientes = Object.values(clientesMap).map(c => {
    c.turnos.sort((a,b) => b.date - a.date); // Ordenar del más nuevo al más viejo
    c.ultimoTurno = c.turnos[0].date;
    c.asistencias = c.turnos.filter(t => t.status === "confirmado").length;
    c.cancelaciones = c.turnos.filter(t => t.status === "cancelado").length;
    return c;
  });

  // 3. Aplicar filtro de búsqueda
  if (search) {
    const q = search.toLowerCase();
    clientes = clientes.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.email.toLowerCase().includes(q) || 
      c.phone.includes(q)
    );
  }

  // 4. Aplicar ordenamiento
  clientes.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "recent") return b.ultimoTurno - a.ultimoTurno;
    if (sort === "frequent") return b.asistencias - a.asistencias;
    return 0;
  });

  const totalClientes = Object.keys(clientesMap).length;
  const clientesActivos = clientes.filter(c => c.asistencias > 0).length;

  return (
    <>
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={s.statIcon}>👥</div>
          <div style={s.statValue}>{totalClientes}</div>
          <div style={s.statLabel}>Total Registrados</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statIcon}>⭐</div>
          <div style={s.statValue}>{clientesActivos}</div>
          <div style={s.statLabel}>Clientes Activos</div>
        </div>
      </div>

      <div style={s.searchRow}>
        <div style={s.searchWrap}>
          <span style={{ fontSize: 16, marginRight: 10 }}>🔍</span>
          <input style={s.searchInput} placeholder="Buscar por nombre, correo o teléfono..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={s.selectSort} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="name">Ordenar por Nombre</option>
          <option value="recent">Más recientes primero</option>
          <option value="frequent">Más frecuentes primero</option>
        </select>
      </div>

      <div style={s.list}>
        {clientes.length === 0 && (
          <div style={s.empty}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <div style={{ fontFamily: "Georgia,serif", fontSize: 18, color: "#7a6e5f" }}>No se encontraron clientes</div>
          </div>
        )}
        {clientes.map(c => (
          <div key={c.email} style={s.card}>
            <div style={s.headerRow}>
              <div style={s.avatar}>{c.name.charAt(0).toUpperCase()}</div>
              <div>
                <div style={s.name}>{c.name}</div>
                <div style={s.email}>📧 {c.email}</div>
                <div style={s.phone}>📞 {c.phone}</div>
              </div>
            </div>
            <div style={s.divider} />
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Último turno:</span>
              <span style={s.infoValue}>{formatDate(c.ultimoTurno)}</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Turnos completados:</span>
              <span style={{...s.infoValue, color:"#27ae60"}}>{c.asistencias}</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Cancelaciones:</span>
              <span style={{...s.infoValue, color: c.cancelaciones > 0 ? "#e53e3e" : "#3d2b1f"}}>{c.cancelaciones}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}