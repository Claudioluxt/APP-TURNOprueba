import { formatTime, formatDate } from "../hooks/useTurnos";

const s = {
  list: { display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px" },
  card: { background: "#fdfbf6", padding: "16px", borderRadius: "10px", borderLeft: "4px solid #d4af37", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  dateBox: { display: "flex", flexDirection: "column", gap: "4px" },
  date: { fontSize: "14px", fontWeight: "700", color: "#1a251d", textTransform: "capitalize" },
  time: { fontSize: "18px", fontWeight: "800", color: "#d4af37" },
  infoBox: { flex: 1, marginLeft: "16px" },
  name: { fontSize: "15px", fontWeight: "700", color: "#1a251d", margin: "0 0 4px 0" },
  service: { fontSize: "13px", color: "#5a4a35", margin: "0 0 4px 0" },
  status: { display: "inline-block", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" },
  deleteBtn: { background: "rgba(231, 76, 60, 0.1)", color: "#e74c3c", border: "1px solid rgba(231, 76, 60, 0.3)", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer", marginTop: "12px", width: "100%" },
  empty: { textAlign: "center", padding: "40px 20px", color: "#5a4a35", fontSize: "14px" }
};

const getStatusStyle = (status) => {
  switch (status) {
    case "pendiente": return { background: "rgba(241, 196, 15, 0.2)", color: "#d35400" };
    case "confirmado": return { background: "rgba(46, 204, 113, 0.2)", color: "#27ae60" };
    case "cancelado": return { background: "rgba(231, 76, 60, 0.2)", color: "#c0392b" };
    default: return { background: "#eee", color: "#666" };
  }
};

export default function TurnosList({ turnos, rol, onEliminar }) {
  if (!turnos || turnos.length === 0) {
    return <div style={s.empty}>No hay turnos registrados.</div>;
  }

  return (
    <div style={s.list}>
      {turnos.map((turno) => (
        <div key={turno.id} style={s.card}>
          <div style={s.row}>
            <div style={s.dateBox}>
              <span style={s.date}>{formatDate(turno.date)}</span>
              <span style={s.time}>{formatTime(turno.date)}</span>
            </div>
            
            <div style={s.infoBox}>
              <h3 style={s.name}>{turno.name}</h3>
              <p style={s.service}>{turno.service} ({turno.duration} min)</p>
              <span style={{ ...s.status, ...getStatusStyle(turno.status) }}>
                {turno.status}
              </span>
            </div>
          </div>
          
          {(rol === "admin" || turno.status === "pendiente") && onEliminar && (
            <button 
              style={s.deleteBtn} 
              onClick={() => onEliminar(turno.id)}
            >
              {rol === "admin" ? "Eliminar Turno" : "Cancelar Reserva"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}