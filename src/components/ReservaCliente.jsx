import { useState } from "react";
import { useTurnos, SERVICES, SERVICE_INFO } from "../hooks/useTurnos";

const s = {
  // Reutiliza tus estilos base (s.root, s.card, s.input, s.submitBtn)
  root: { minHeight:"100vh", background:"#faf6f0", padding: "40px 20px", fontFamily:"Georgia,serif" },
  card: { background:"#fff", borderRadius:18, padding:"30px", maxWidth:500, margin:"0 auto", boxShadow:"0 8px 40px rgba(100,70,40,0.13)" },
  title: { fontSize:24, color:"#2a1a0e", textAlign:"center", marginBottom:20 },
  field: { display:"flex", flexDirection:"column", gap:6, marginBottom:16 },
  input: { padding:"11px 14px", border:"1px solid #e0c8a8", borderRadius:8, width:"100%", boxSizing:"border-box" },
  btn: { background:"#3d2b1f", color:"#f0d9b5", padding:"12px", border:"none", borderRadius:8, width:"100%", cursor:"pointer", fontWeight:"bold", marginTop:10 },
  success: { textAlign:"center", color:"#27ae60", padding:40, fontSize:18 }
};

export default function ReservaCliente() {
  const { save, dbError } = useTurnos();
  const [form, setForm] = useState({ name:"", email:"", phone:"", service:SERVICES[0], date:"", time:"" });
  const [status, setStatus] = useState("idle"); // idle, loading, success

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    
    const duracionSugerida = SERVICE_INFO[form.service].duracion;
    const payload = { ...form, duration: duracionSugerida, status: "pendiente" };
    
    const result = await save(payload);
    
    if (result.error) {
      alert("Error: " + result.error);
      setStatus("idle");
    } else {
      setStatus("success");
    }
  };

  if (status === "success") {
    return (
      <div style={s.root}>
        <div style={s.card}>
          <div style={s.success}>
            <h2>¡Turno Solicitado! ✅</h2>
            <p>Hemos recibido tu solicitud. Nos contactaremos pronto para confirmar tu asistencia.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.root}>
      <div style={s.card}>
        <h2 style={s.title}>Reservar Turno - Aura Masajes</h2>
        {dbError && <p style={{color:"red"}}>{dbError}</p>}
        
        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label>Nombre y Apellido</label>
            <input required style={s.input} value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          </div>
          
          <div style={s.field}>
            <label>Email</label>
            <input required type="email" style={s.input} value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
          </div>

          <div style={s.field}>
            <label>Teléfono (WhatsApp)</label>
            <input required type="tel" style={s.input} value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
          </div>

          <div style={s.field}>
            <label>Servicio</label>
            <select style={s.input} value={form.service} onChange={e=>setForm({...form, service:e.target.value})}>
              {SERVICES.map(s => (
                <option key={s} value={s}>{s} - ${SERVICE_INFO[s].precio.toLocaleString("es-AR")}</option>
              ))}
            </select>
          </div>

          <div style={{display:"flex", gap:10}}>
            <div style={{...s.field, flex:1}}>
              <label>Fecha</label>
              <input required type="date" min={new Date().toISOString().split("T")[0]} style={s.input} value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
            </div>
            <div style={{...s.field, flex:1}}>
              <label>Hora</label>
              <input required type="time" style={s.input} value={form.time} onChange={e=>setForm({...form, time:e.target.value})} />
            </div>
          </div>

          <button type="submit" style={s.btn} disabled={status === "loading"}>
            {status === "loading" ? "Procesando..." : "Solicitar Turno"}
          </button>
        </form>
      </div>
    </div>
  );
}