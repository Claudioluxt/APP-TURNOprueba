import { useState, useEffect } from "react";
import { SERVICES, SERVICE_INFO, DURATIONS, DIAS_LABORABLES } from "../hooks/useTurnos";

const s = {
  wrap: { maxWidth:680, margin:"0 auto" },
  card: { background:"rgba(255,252,245,0.96)", borderRadius:18, padding:"30px 32px", boxShadow:"0 8px 40px rgba(100,70,40,0.13)", border:"1px solid rgba(168,130,90,0.15)" },
  header: { display:"flex", alignItems:"center", gap:16, marginBottom:20 },
  backBtn: { background:"transparent", border:"none", color:"#8a6a44", cursor:"pointer", fontSize:14, fontFamily:"inherit", padding:"6px 10px", borderRadius:6 },
  title: { margin:0, fontSize:22, color:"#2a1a0e", fontWeight:700 },
  bizError: { background:"#fde8e8", border:"1.5px solid #e53e3e", borderRadius:10, padding:"12px 16px", fontSize:14, color:"#7a1a1a", marginBottom:20, lineHeight:1.5 },
  grid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 },
  field: { display:"flex", flexDirection:"column", gap:6 },
  label: { fontSize:12, color:"#7a5a3a", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" },
  input: { background:"#fef8f0", border:"1.5px solid #e0c8a8", borderRadius:9, padding:"11px 14px", fontSize:15, color:"#2a1a0e", fontFamily:"inherit", outline:"none" },
  inputError: { borderColor:"#e53e3e" },
  errorMsg: { fontSize:11, color:"#e53e3e" },
  warnMsg: { fontSize:11, color:"#e07a00" },
  durationPicker: { display:"flex", gap:8, flexWrap:"wrap" },
  durBtn: { background:"#f0e8db", border:"2px solid transparent", borderRadius:8, padding:"9px 18px", fontSize:14, cursor:"pointer", fontFamily:"inherit", fontWeight:600, color:"#6b4a2a" },
  durBtnActive: { background:"#3d2b1f", color:"#f0d9b5", border:"2px solid #3d2b1f" },
  statusRow: { display:"flex", gap:10 },
  statusBtn: { display:"inline-flex", alignItems:"center", gap:6, border:"2px solid transparent", borderRadius:20, padding:"8px 16px", fontSize:13, cursor:"pointer", fontFamily:"inherit", fontWeight:600 },
  statusDot: { width:7, height:7, borderRadius:"50%", display:"inline-block" },
  footer: { display:"flex", justifyContent:"flex-end", gap:12, marginTop:28, paddingTop:20, borderTop:"1px solid #ecdcc8" },
  cancelBtn: { background:"transparent", border:"1.5px solid #d0b890", borderRadius:9, padding:"11px 22px", color:"#8a6a44", fontSize:14, cursor:"pointer", fontFamily:"inherit", fontWeight:600 },
  submitBtn: { background:"linear-gradient(135deg,#3d2b1f,#6b4226)", border:"none", borderRadius:9, padding:"11px 28px", color:"#f0d9b5", fontSize:14, cursor:"pointer", fontFamily:"inherit", fontWeight:700, letterSpacing:"0.05em", boxShadow:"0 3px 12px rgba(61,43,31,0.3)" },
  priceHint: { fontSize:12, color:"#8a6a44", fontStyle:"italic", marginTop:2 },
};

const statusColors = {
  confirmado: { bg:"#d4f4e7", text:"#1a7a4a", dot:"#27ae60" },
  pendiente:  { bg:"#fef5dc", text:"#7a5a0a", dot:"#f0a500" },
  cancelado:  { bg:"#fde8e8", text:"#7a1a1a", dot:"#e53e3e" },
};

const emptyForm = { name:"", email:"", phone:"", service:SERVICES[0], duration:SERVICE_INFO[SERVICES[0]].duracion, date:"", time:"", status:"confirmado" };

export default function TurnoForm({ selected, onBack, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selected) {
      const d = selected.date;
      const pad = n => String(n).padStart(2,"0");
      setForm({
        name: selected.name, email: selected.email, phone: selected.phone,
        service: selected.service, duration: selected.duration, status: selected.status,
        date: `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,
        time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [selected]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nombre requerido";
    if (!form.email.includes("@")) e.email = "Email inválido";
    if (form.phone.length < 8) e.phone = "Teléfono inválido";
    if (!form.date) e.date = "Fecha requerida";
    if (!form.time) e.time = "Hora requerida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    const result = await onSave(form, selected?.id);
    setSaving(false);
    if (result?.error) setErrors(e => ({ ...e, business: result.error }));
  };

  const esFinDeSemana = form.date && !DIAS_LABORABLES.includes(new Date(form.date+"T12:00").getDay());

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.header}>
          <button style={s.backBtn} onClick={onBack}>← Volver</button>
          <h2 style={s.title}>{selected ? "Editar Turno" : "Nuevo Turno"}</h2>
        </div>

        {errors.business && <div style={s.bizError}>⚠️ {errors.business}</div>}

        <div style={s.grid}>
          <div style={s.field}>
            <label style={s.label}>Nombre *</label>
            <input style={{...s.input,...(errors.name?s.inputError:{})}} placeholder="Ej: María González"
              value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
            {errors.name && <span style={s.errorMsg}>{errors.name}</span>}
          </div>

          <div style={s.field}>
            <label style={s.label}>Correo *</label>
            <input style={{...s.input,...(errors.email?s.inputError:{})}} placeholder="cliente@email.com"
              value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
            {errors.email && <span style={s.errorMsg}>{errors.email}</span>}
          </div>

          <div style={s.field}>
            <label style={s.label}>Teléfono *</label>
            <input style={{...s.input,...(errors.phone?s.inputError:{})}} placeholder="+54 11 1234-5678"
              value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
            {errors.phone && <span style={s.errorMsg}>{errors.phone}</span>}
          </div>

          <div style={s.field}>
            <label style={s.label}>Servicio</label>
            <select style={s.input} value={form.service} onChange={e=>{
              const svc = e.target.value;
              setForm(f=>({...f, service:svc, duration: SERVICE_INFO[svc]?.duracion || f.duration}));
            }}>
              {SERVICES.map(sv=><option key={sv} value={sv}>{sv} — ${SERVICE_INFO[sv].precio.toLocaleString("es-AR")}</option>)}
            </select>
            <span style={s.priceHint}>⏱ Duración sugerida: {SERVICE_INFO[form.service]?.duracion} min</span>
          </div>

          <div style={s.field}>
            <label style={s.label}>Fecha *</label>
            <input type="date" style={{...s.input,...(errors.date?s.inputError:{})}}
              value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
            {errors.date && <span style={s.errorMsg}>{errors.date}</span>}
            {esFinDeSemana && <span style={s.warnMsg}>⚠️ Fin de semana — no se trabaja</span>}
          </div>

          <div style={s.field}>
            <label style={s.label}>Hora *</label>
            <input type="time" style={{...s.input,...(errors.time?s.inputError:{})}}
              value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/>
            {errors.time && <span style={s.errorMsg}>{errors.time}</span>}
          </div>

          <div style={{...s.field, gridColumn:"1 / -1"}}>
            <label style={s.label}>Duración del Turno</label>
            <div style={s.durationPicker}>
              {DURATIONS.map(d=>(
                <button key={d} style={{...s.durBtn,...(form.duration===d?s.durBtnActive:{})}}
                  onClick={()=>setForm(f=>({...f,duration:d}))}>{d} min</button>
              ))}
            </div>
          </div>

          <div style={{...s.field, gridColumn:"1 / -1"}}>
            <label style={s.label}>Estado</label>
            <div style={s.statusRow}>
              {["confirmado","pendiente","cancelado"].map(st=>{
                const sc = statusColors[st];
                return (
                  <button key={st} style={{...s.statusBtn, background:form.status===st?sc.bg:"#f5f0eb", color:form.status===st?sc.text:"#9a8e7f", borderColor:form.status===st?sc.dot:"transparent"}}
                    onClick={()=>setForm(f=>({...f,status:st}))}>
                    <span style={{...s.statusDot, background:sc.dot}}/>{st}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={s.footer}>
          <button style={s.cancelBtn} onClick={onBack}>Cancelar</button>
          <button style={s.submitBtn} onClick={handleSubmit} disabled={saving}>
            {saving ? "Guardando..." : selected ? "Guardar Cambios" : "Registrar Turno"}
          </button>
        </div>
      </div>
    </div>
  );
}
