import { useState, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────────
//  🔧 CONFIGURACIÓN SUPABASE
//  Reemplazá estos valores con los de tu proyecto
// ─────────────────────────────────────────────
const SUPABASE_URL = 'https://cyrinitjjbdcswakbqli.supabase.co'
const SUPABASE_ANON_KEY = "sb_publishable_FDD0GpFO814XI6DiCe9bxg_k92hHvlx";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const isConfigured = !SUPABASE_URL.includes("TU_PROJECT_ID") && !SUPABASE_ANON_KEY.includes("TU_ANON_KEY");

// ─────────────────────────────────────────────

const DURATIONS = [30, 45, 60, 90, 120];
const SERVICES = [
  "Masaje Intensivo",
  "Ritual Aura",
  "Craneofacial",
  "Descontracturante Cuerpo Completo",
  "Aura Integral",
  "Masaje Deportivo",
];

const SERVICE_INFO = {
  "Masaje Intensivo":               { duracion: 45,  precio: 30000 },
  "Ritual Aura":                    { duracion: 120, precio: 47000 },
  "Craneofacial":                   { duracion: 45,  precio: 29000 },
  "Descontracturante Cuerpo Completo": { duracion: 60, precio: 33000 },
  "Aura Integral":                  { duracion: 60,  precio: 35000 },
  "Masaje Deportivo":               { duracion: 70,  precio: 37000 },
};

const formatPrecio = (p) => "$" + p.toLocaleString("es-AR");

const formatTime = (date) => date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
const formatDate = (date) => date.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short" });

const rowToAppt = (row) => ({
  id: row.id, name: row.name, email: row.email, phone: row.phone,
  service: row.service, duration: row.duration, status: row.status,
  date: new Date(row.date),
});

const statusColors = {
  confirmado: { bg: "#d4f4e7", text: "#1a7a4a", dot: "#27ae60" },
  pendiente:  { bg: "#fef5dc", text: "#7a5a0a", dot: "#f0a500" },
  cancelado:  { bg: "#fde8e8", text: "#7a1a1a", dot: "#e53e3e" },
};

// Genera los días del mes para el calendario (con padding de semana)
const getCalDays = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
};

export default function App() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [view, setView] = useState("list");
  const [filterHoy, setFilterHoy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editingDuration, setEditingDuration] = useState(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedCalDay, setSelectedCalDay] = useState(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", service: SERVICES[0],
    duration: 60, date: "", time: "", status: "confirmado",
  });
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientSort, setClientSort] = useState("name");

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("turnos").select("*").order("date", { ascending: true });
    if (error) setDbError(error.message);
    else setAppointments(data.map(rowToAppt));
    setLoading(false);
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

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
    const dateObj = new Date(`${form.date}T${form.time}`);
    const payload = { name: form.name, email: form.email, phone: form.phone, service: form.service, duration: form.duration, status: form.status, date: dateObj.toISOString() };
    if (selected) {
      const { error } = await supabase.from("turnos").update(payload).eq("id", selected.id);
      if (error) { setDbError(error.message); return; }
      showSuccess("Turno actualizado correctamente");
    } else {
      const { error } = await supabase.from("turnos").insert([payload]);
      if (error) { setDbError(error.message); return; }
      showSuccess("Turno registrado exitosamente");
    }
    await fetchAppointments();
    setView("list");
    setSelected(null);
    setForm({ name: "", email: "", phone: "", service: SERVICES[0], duration: 60, date: "", time: "", status: "confirmado" });
  };

  const openEdit = (appt) => {
    const d = appt.date;
    const pad = n => String(n).padStart(2, "0");
    setSelected(appt);
    setForm({
      name: appt.name, email: appt.email, phone: appt.phone,
      service: appt.service, duration: appt.duration, status: appt.status,
      date: `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    });
    setView("form");
  };

  const updateDuration = async (id, dur) => {
    const { error } = await supabase.from("turnos").update({ duration: dur }).eq("id", id);
    if (error) { setDbError(error.message); return; }
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, duration: dur } : a));
    setEditingDuration(null);
    showSuccess("Duración actualizada");
  };

  const deleteAppt = async (id) => {
    const { error } = await supabase.from("turnos").delete().eq("id", id);
    if (error) { setDbError(error.message); return; }
    setAppointments(prev => prev.filter(a => a.id !== id));
    showSuccess("Turno eliminado");
  };

  const clearAllData = async () => {
    if (!window.confirm("¿Eliminar TODOS los turnos? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from("turnos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) { setDbError(error.message); return; }
    setAppointments([]);
    showSuccess("Todos los turnos fueron eliminados");
  };

  const filtered = appointments
    .filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.service.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.date - b.date);

  // ── Pantalla de configuración pendiente ──
  if (!isConfigured) {
    return (
      <div style={styles.root}>
        <div style={styles.bgTexture} />
        <header style={styles.header}>
          <div style={styles.headerInner}>
            <div>
              <div style={styles.logo}>✦ SERENITAS</div>
              <div style={styles.logoSub}>Sistema de Turnos · Sala de Masajes</div>
            </div>
          </div>
        </header>
        <main style={styles.main}>
          <div style={styles.setupCard}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
            <h2 style={styles.setupTitle}>Configuración de Supabase</h2>
            <p style={styles.setupText}>
              Para activar la base de datos, reemplazá las credenciales en la parte superior del archivo <code style={styles.code}>App.jsx</code>:
            </p>
            <div style={styles.setupSteps}>
              <div style={styles.step}><span style={styles.stepNum}>1</span> Creá una cuenta en <strong>supabase.com</strong> (es gratis)</div>
              <div style={styles.step}><span style={styles.stepNum}>2</span> Creá un nuevo proyecto</div>
              <div style={styles.step}><span style={styles.stepNum}>3</span> Andá a <strong>SQL Editor</strong> y ejecutá el script de abajo</div>
              <div style={styles.step}><span style={styles.stepNum}>4</span> Copiá la <strong>Project URL</strong> y la <strong>anon key</strong> desde <em>Project Settings → API</em></div>
              <div style={styles.step}><span style={styles.stepNum}>5</span> Pegálas en las variables <code style={styles.code}>SUPABASE_URL</code> y <code style={styles.code}>SUPABASE_ANON_KEY</code></div>
            </div>
            <div style={styles.sqlBlock}>
              <div style={styles.sqlTitle}>📋 Script SQL — ejecutar en Supabase SQL Editor</div>
              <pre style={styles.sqlCode}>{`create table turnos (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  phone text not null,
  service text not null,
  duration integer not null default 60,
  status text not null default 'pendiente',
  date timestamptz not null,
  created_at timestamptz default now()
);

-- Permitir acceso público (ajustá según necesites)
alter table turnos enable row level security;
create policy "Allow all" on turnos for all using (true);`}</pre>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={s.root}>
      <div style={s.bgTexture} />

      <header style={s.header}>
        <div style={s.headerInner}>
          <div>
            <div style={styles.logo}>✦ SERENITAS</div>
            <div style={styles.logoSub}>Sistema de Turnos · Sala de Masajes</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={s.storageBadge}>🟢 Supabase conectado</div>
            <button style={s.newBtn} onClick={() => { setSelected(null); setForm({ name:"",email:"",phone:"",service:SERVICES[0],duration:60,date:"",time:"",status:"confirmado"}); setErrors({}); setView("form"); }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Nuevo Turno
            </button>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div style={s.tabBar}>
        <div style={s.tabInner}>
          {[["list","📋 Turnos"],["calendar","📅 Calendario"],["clients","👥 Clientes"]].map(([v, label]) => (
            <button key={v} style={{ ...s.tab, ...(view === v || (view === "form" && v === "list") ? s.tabActive : {}) }}
              onClick={() => setView(v === "list" ? "list" : v)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {successMsg && <div style={s.toast}>{successMsg}</div>}
      {dbError && (
        <div style={{ ...s.toast, background: "#e53e3e" }}>
          ❌ {dbError}
          <button onClick={() => setDbError(null)} style={{ marginLeft: 12, background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      )}

      <main style={s.main}>

        {/* ═══ VISTA LISTA ═══ */}
        {view === "list" && (
          <>
            <div style={styles.statsRow}>
              {[
                { label: "Total Turnos", value: appointments.length, icon: "📋" },
                { label: "Confirmados", value: appointments.filter(a=>a.status==="confirmado").length, icon: "✅" },
                { label: "Pendientes",  value: appointments.filter(a=>a.status==="pendiente").length,  icon: "⏳" },
                { label: "Hoy", value: appointments.filter(a=>{const t=new Date();return a.date.toDateString()===t.toDateString()}).length, icon: "📅" },
              ].map(s => (
                <div key={s.label} style={styles.statCard}>
                  <div style={styles.statIcon}>{s.icon}</div>
                  <div style={styles.statValue}>{s.value}</div>
                  <div style={styles.statLabel}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
              <div style={{ ...styles.searchWrap, marginBottom: 0, flex: 1 }}>
                <span style={styles.searchIcon}>🔍</span>
                <input style={styles.searchInput} placeholder="Buscar por nombre o servicio..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {appointments.length>0 && <button style={s.clearBtn} onClick={clearAllData}>🗑 Limpiar todo</button>}
            </div>

            <div style={styles.list}>
              {loading && (
                <div style={styles.empty}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>⏳</div>
                  <div style={{ color: "#7a6e5f", fontFamily: "Georgia, serif" }}>Cargando turnos...</div>
                </div>
              )}
              {!loading && filtered.length === 0 && (
                <div style={styles.empty}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#7a6e5f" }}>No hay turnos registrados</div>
                </div>
              )}
              {!loading && filtered.map(appt => {
                const sc = statusColors[appt.status] || statusColors.pendiente;
                return (
                  <div key={appt.id} style={styles.card}>
                    <div style={styles.cardLeft}>
                      <div style={styles.cardDate}>
                        <div style={styles.cardDateDay}>{formatDate(appt.date)}</div>
                        <div style={styles.cardDateTime}>{formatTime(appt.date)}</div>
                      </div>
                    </div>
                    <div style={s.cardBody}>
                      <div style={s.cardTop}>
                        <div><div style={s.cardName}>{appt.name}</div><div style={s.cardService}>{appt.service}</div></div>
                        <span style={{ ...s.statusBadge, background:sc.bg, color:sc.text }}><span style={{ ...s.statusDot, background:sc.dot }}/>{appt.status}</span>
                      </div>
                      <div style={s.cardInfo}>
                        <span style={s.infoChip}>📧 {appt.email}</span>
                        <span style={s.infoChip}>📞 {appt.phone}</span>
                        <span style={s.infoChip} onClick={()=>setEditingDuration(appt.id)}>⏱ {appt.duration} min <span style={s.editHint}>✏️</span></span>
                      </div>
                      {editingDuration===appt.id && (
                        <div style={s.durationEditor}>
                          <span style={{fontSize:13,color:"#7a6e5f",marginRight:8}}>Cambiar duración:</span>
                          {DURATIONS.map(d=><button key={d} style={{...s.durBtn,...(appt.duration===d?s.durBtnActive:{})}} onClick={()=>updateDuration(appt.id,d)}>{d}m</button>)}
                          <button style={s.durCancel} onClick={()=>setEditingDuration(null)}>✕</button>
                        </div>
                      )}
                    </div>
                    <div style={s.cardActions}>
                      <button style={s.actionBtn} onClick={()=>openEdit(appt)}>✏️</button>
                      <button style={{...s.actionBtn,color:"#e53e3e"}} onClick={()=>deleteAppt(appt.id)}>🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ═══ VISTA FORMULARIO ═══ */}
        {view === "form" && (
          <div style={s.formWrap}>
            <div style={s.formCard}>
              <div style={s.formHeader}>
                <button style={s.backBtn} onClick={()=>setView("list")}>← Volver</button>
                <h2 style={s.formTitle}>{selected?"Editar Turno":"Nuevo Turno"}</h2>
              </div>
              {errors.business && <div style={s.bizError}>⚠️ {errors.business}</div>}
              <div style={s.formGrid}>
                <div style={s.field}><label style={s.label}>Nombre del Cliente *</label>
                  <input style={{...s.input,...(errors.name?s.inputError:{})}} placeholder="Ej: María González" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
                  {errors.name&&<span style={s.errorMsg}>{errors.name}</span>}</div>
                <div style={s.field}><label style={s.label}>Correo Electrónico *</label>
                  <input style={{...s.input,...(errors.email?s.inputError:{})}} placeholder="cliente@email.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
                  {errors.email&&<span style={s.errorMsg}>{errors.email}</span>}</div>
                <div style={s.field}><label style={s.label}>Teléfono *</label>
                  <input style={{...s.input,...(errors.phone?s.inputError:{})}} placeholder="+54 11 1234-5678" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
                  {errors.phone&&<span style={s.errorMsg}>{errors.phone}</span>}</div>
                <div style={s.field}><label style={s.label}>Tipo de Masaje</label>
                  <select style={s.input} value={form.service} onChange={e=>{ const svc=e.target.value; const info=SERVICE_INFO[svc]; setForm(f=>({...f,service:svc,duration:info?info.duracion:f.duration})); }}>
                    {SERVICES.map(sv=><option key={sv} value={sv}>{sv}{SERVICE_INFO[sv] ? " — " + formatPrecio(SERVICE_INFO[sv].precio) : ""}</option>)}</select></div>
                <div style={s.field}><label style={s.label}>Fecha *</label>
                  <input type="date" style={{...s.input,...(errors.date?s.inputError:{})}} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
                  {errors.date&&<span style={s.errorMsg}>{errors.date}</span>}
                  {form.date&&!DIAS_LABORABLES.includes(new Date(form.date+"T12:00").getDay())&&<span style={{...s.errorMsg,color:"#e07a00"}}>⚠️ Fin de semana — no se trabaja</span>}</div>
                <div style={s.field}><label style={s.label}>Hora *</label>
                  <input type="time" style={{...s.input,...(errors.time?s.inputError:{})}} value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/>
                  {errors.time&&<span style={s.errorMsg}>{errors.time}</span>}</div>
                <div style={{...s.field,gridColumn:"1 / -1"}}><label style={s.label}>Duración del Turno</label>
                  <div style={s.durationPicker}>{DURATIONS.map(d=><button key={d} style={{...s.durPickerBtn,...(form.duration===d?s.durPickerActive:{})}} onClick={()=>setForm(f=>({...f,duration:d}))}>{d} min</button>)}</div></div>
                <div style={{...s.field,gridColumn:"1 / -1"}}><label style={s.label}>Estado</label>
                  <div style={{display:"flex",gap:10}}>{["confirmado","pendiente","cancelado"].map(st=>{const sc=statusColors[st];return(
                    <button key={st} style={{...s.statusBtn,background:form.status===st?sc.bg:"#f5f0eb",color:form.status===st?sc.text:"#9a8e7f",borderColor:form.status===st?sc.dot:"transparent"}} onClick={()=>setForm(f=>({...f,status:st}))}>
                      <span style={{...s.statusDot,background:sc.dot}}/>{st}</button>);})}</div></div>
              </div>
              <div style={s.formFooter}>
                <button style={s.cancelBtn} onClick={()=>setView("list")}>Cancelar</button>
                <button style={s.submitBtn} onClick={handleSubmit}>{selected?"Guardar Cambios":"Registrar Turno"}</button>
              </div>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Nombre del Cliente *</label>
                  <input style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
                    placeholder="Ej: María González" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  {errors.name && <span style={styles.errorMsg}>{errors.name}</span>}
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Correo Electrónico *</label>
                  <input style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
                    placeholder="cliente@email.com" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  {errors.email && <span style={styles.errorMsg}>{errors.email}</span>}
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Teléfono *</label>
                  <input style={{ ...styles.input, ...(errors.phone ? styles.inputError : {}) }}
                    placeholder="+54 11 1234-5678" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  {errors.phone && <span style={styles.errorMsg}>{errors.phone}</span>}
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Tipo de Masaje</label>
                  <select style={styles.input} value={form.service}
                    onChange={e => setForm(f => ({ ...f, service: e.target.value }))}>
                    {SERVICES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Fecha *</label>
                  <input type="date" style={{ ...styles.input, ...(errors.date ? styles.inputError : {}) }}
                    value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  {errors.date && <span style={styles.errorMsg}>{errors.date}</span>}
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Hora *</label>
                  <input type="time" style={{ ...styles.input, ...(errors.time ? styles.inputError : {}) }}
                    value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                  {errors.time && <span style={styles.errorMsg}>{errors.time}</span>}
                </div>
              ))}
            </div>

            {/* Panel del día seleccionado */}
            {selectedCalDay && (
              <div style={s.calDayPanel}>
                <div style={s.calDayPanelHeader}>
                  <div>
                    <div style={s.calDayPanelTitle}>
                      {selectedCalDay.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}
                    </div>
                    <div style={s.calDayPanelSub}>
                      {turnosDelDiaSeleccionado.filter(a=>a.status!=="cancelado").length} turno{turnosDelDiaSeleccionado.filter(a=>a.status!=="cancelado").length!==1?"s":""} activo{turnosDelDiaSeleccionado.filter(a=>a.status!=="cancelado").length!==1?"s":""} · {MAX_TURNOS_POR_DIA - turnosDelDiaSeleccionado.filter(a=>a.status!=="cancelado").length} lugar{MAX_TURNOS_POR_DIA - turnosDelDiaSeleccionado.filter(a=>a.status!=="cancelado").length!==1?"es":""} libre{MAX_TURNOS_POR_DIA - turnosDelDiaSeleccionado.filter(a=>a.status!=="cancelado").length!==1?"s":""}
                    </div>
                  </div>
                  <button style={s.calNewBtn} onClick={()=>{
                    const pad = n=>String(n).padStart(2,"0");
                    const d = selectedCalDay;
                    setSelected(null);
                    setForm({name:"",email:"",phone:"",service:SERVICES[0],duration:60,date:`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,time:"",status:"confirmado"});
                    setErrors({});
                    setView("form");
                  }}>+ Nuevo turno este día</button>
                </div>

                {turnosDelDiaSeleccionado.length === 0 ? (
                  <div style={s.calEmpty}>🌿 Sin turnos para este día</div>
                ) : (
                  <div style={s.calDayList}>
                    {turnosDelDiaSeleccionado.map(appt => {
                      const sc = statusColors[appt.status]||statusColors.pendiente;
                      return (
                        <div key={appt.id} style={s.calApptRow}>
                          <div style={s.calApptTime}>{formatTime(appt.date)}<div style={s.calApptDur}>{appt.duration}m</div></div>
                          <div style={s.calApptInfo}>
                            <div style={s.calApptName}>{appt.name}</div>
                            <div style={s.calApptService}>{appt.service}{SERVICE_INFO[appt.service] ? " · " + formatPrecio(SERVICE_INFO[appt.service].precio) : ""}</div>
                          </div>
                          <span style={{...s.statusBadge,background:sc.bg,color:sc.text,fontSize:11}}>
                            <span style={{...s.statusDot,background:sc.dot}}/>{appt.status}
                          </span>
                          <button style={s.actionBtn} onClick={()=>openEdit(appt)}>✏️</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ VISTA CLIENTES ═══ */}
        {view === "clients" && (() => {
          // Consolidar clientes únicos por email
          const clientMap = {};
          appointments.forEach(a => {
            const key = a.email.toLowerCase();
            if (!clientMap[key]) {
              clientMap[key] = { name: a.name, email: a.email, phone: a.phone, turnos: [], services: new Set() };
            }
            clientMap[key].turnos.push(a);
            clientMap[key].services.add(a.service);
          });

          const clients = Object.values(clientMap).map(c => ({
            ...c,
            total: c.turnos.length,
            activos: c.turnos.filter(t => t.status !== "cancelado").length,
            ultimoTurno: c.turnos.sort((a,b) => b.date - a.date)[0].date,
            services: [...c.services],
          }));

          const sorted = [...clients]
            .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.email.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch))
            .sort((a, b) => {
              if (clientSort === "name") return a.name.localeCompare(b.name);
              if (clientSort === "total") return b.total - a.total;
              if (clientSort === "ultimo") return b.ultimoTurno - a.ultimoTurno;
              return 0;
            });

          const exportCSV = () => {
            const header = ["Nombre","Email","Teléfono","Total turnos","Turnos activos","Último turno","Servicios"];
            const rows = sorted.map(c => [
              c.name, c.email, c.phone, c.total, c.activos,
              c.ultimoTurno.toLocaleDateString("es-AR"),
              c.services.join(" / ")
            ]);
            const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = "clientes-serenitas.csv"; a.click();
            URL.revokeObjectURL(url);
          };

          return (
            <div>
              {/* Header de clientes */}
              <div style={s.clientsHeader}>
                <div>
                  <div style={s.clientsTitle}>👥 Clientes registrados</div>
                  <div style={s.clientsSub}>{clients.length} cliente{clients.length !== 1 ? "s" : ""} únicos · {appointments.length} turno{appointments.length !== 1 ? "s" : ""} en total</div>
                </div>
                <button style={s.exportBtn} onClick={exportCSV}>⬇ Exportar CSV</button>
              </div>

              {/* Buscador y ordenamiento */}
              <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
                <div style={{ ...s.searchWrap, marginBottom:0, flex:1, minWidth:200 }}>
                  <span style={s.searchIcon}>🔍</span>
                  <input style={s.searchInput} placeholder="Buscar por nombre, email o teléfono..." value={clientSearch} onChange={e=>setClientSearch(e.target.value)} />
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  {[["name","A–Z"],["total","Más turnos"],["ultimo","Último turno"]].map(([val,label]) => (
                    <button key={val} style={{ ...s.sortBtn, ...(clientSort===val ? s.sortBtnActive : {}) }} onClick={()=>setClientSort(val)}>{label}</button>
                  ))}
                </div>
              </div>

              {/* Stats rápidas */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
                {[
                  { label:"Clientes únicos", value: clients.length, icon:"👤" },
                  { label:"Recaudación total", value: formatPrecio(appointments.filter(a=>a.status!=="cancelado").reduce((acc,a)=>acc+(SERVICE_INFO[a.service]?.precio||0),0)), icon:"💰", small:true },
                  { label:"Clientes recurrentes", value: clients.filter(c=>c.total>1).length, icon:"🔄" },
                  { label:"Servicio más elegido", value: (() => { const cnt = {}; appointments.forEach(a=>{ cnt[a.service]=(cnt[a.service]||0)+1; }); return Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0]?.[0]?.split(" ")[1] || "—"; })(), icon:"💆", small:true },
                ].map(st => (
                  <div key={st.label} style={s.statCard}>
                    <div style={s.statIcon}>{st.icon}</div>
                    <div style={{ ...s.statValue, fontSize: st.small ? 16 : 28 }}>{st.value}</div>
                    <div style={s.statLabel}>{st.label}</div>
                  </div>
                ))}
              </div>

              {/* Tabla */}
              {sorted.length === 0 ? (
                <div style={s.empty}><div style={{fontSize:48,marginBottom:12}}>👤</div><div style={{fontFamily:"Georgia,serif",fontSize:18,color:"#7a6e5f"}}>Sin clientes encontrados</div></div>
              ) : (
                <div style={s.clientTable}>
                  <div style={s.clientTableHead}>
                    <div style={{flex:2}}>Cliente</div>
                    <div style={{flex:2}}>Contacto</div>
                    <div style={{flex:2,fontSize:11}}>Servicios</div>
                    <div style={{flex:"0 0 80px",textAlign:"center"}}>Turnos</div>
                    <div style={{flex:"0 0 100px",textAlign:"right"}}>Acumulado</div>
                    <div style={{flex:"0 0 110px",textAlign:"right"}}>Último turno</div>
                  </div>
                  {sorted.map((c, i) => (
                    <div key={c.email} style={{ ...s.clientRow, ...(i%2===0?{}:{background:"rgba(240,232,219,0.3)"}) }}>
                      <div style={{flex:2}}>
                        <div style={s.clientName}>{c.name}</div>
                        {c.total > 1 && <span style={s.recurrentBadge}>🔄 recurrente</span>}
                      </div>
                      <div style={{flex:2}}>
                        <div style={s.clientContact}>📧 {c.email}</div>
                        <div style={s.clientContact}>📞 {c.phone}</div>
                      </div>
                      <div style={{flex:2}}>
                        {c.services.map(sv => <div key={sv} style={s.serviceTag}>{sv}</div>)}
                      </div>
                      <div style={{flex:"0 0 80px",textAlign:"center"}}>
                        <div style={s.turnosNum}>{c.activos}</div>
                        {c.activos !== c.total && <div style={{fontSize:10,color:"#9a8060"}}>{c.total} total</div>}
                      </div>
                      <div style={{flex:"0 0 100px",textAlign:"right"}}>
                        <div style={{...s.clientContact, fontWeight:700, color:"#6b4226"}}>{formatPrecio(c.turnos.filter(t=>t.status!=="cancelado").reduce((acc,a)=>acc+(SERVICE_INFO[a.service]?.precio||0),0))}</div>
                        <div style={{fontSize:10,color:"#9a8060"}}>acumulado</div>
                      </div>
                      <div style={{flex:"0 0 110px",textAlign:"right"}}>
                        <div style={s.clientContact}>{c.ultimoTurno.toLocaleDateString("es-AR",{day:"2-digit",month:"short",year:"numeric"})}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

      </main>
    </div>
  );
}

const styles = {
  root: { minHeight: "100vh", background: "#faf6f0", fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif", position: "relative", overflow: "hidden" },
  bgTexture: { position: "fixed", inset: 0, backgroundImage: "radial-gradient(ellipse at 20% 20%, #e8ddd0 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, #d4c9bc 0%, transparent 60%)", pointerEvents: "none", zIndex: 0 },
  header: { background: "linear-gradient(135deg, #3d2b1f 0%, #6b4226 100%)", boxShadow: "0 4px 24px rgba(61,43,31,0.25)", position: "relative", zIndex: 10 },
  headerInner: { maxWidth: 900, margin: "0 auto", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { color: "#f0d9b5", fontSize: 26, fontWeight: 700, letterSpacing: "0.18em", fontFamily: "'Palatino Linotype', Georgia, serif" },
  logoSub: { color: "#b89060", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 2 },
  storageBadge: { background: "rgba(255,255,255,0.12)", color: "#a8e6b8", borderRadius: 20, padding: "5px 12px", fontSize: 11, letterSpacing: "0.06em", border: "1px solid rgba(168,230,184,0.3)" },
  newBtn: { background: "linear-gradient(135deg, #c8873a, #a0622a)", color: "#fff9f0", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, letterSpacing: "0.05em", boxShadow: "0 2px 12px rgba(168,90,36,0.35)" },
  toast: { position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", background: "#27ae60", color: "#fff", borderRadius: 8, padding: "12px 28px", fontSize: 14, fontFamily: "inherit", zIndex: 100, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 8 },
  main: { maxWidth: 900, margin: "0 auto", padding: "28px 20px 60px", position: "relative", zIndex: 1 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 },
  statCard: { background: "rgba(255,252,245,0.85)", borderRadius: 14, padding: "18px 14px", textAlign: "center", boxShadow: "0 2px 12px rgba(100,70,40,0.1)", border: "1px solid rgba(168,130,90,0.15)" },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: 700, color: "#3d2b1f", lineHeight: 1 },
  statLabel: { fontSize: 11, color: "#9a8060", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 },
  searchWrap: { display: "flex", alignItems: "center", background: "rgba(255,252,245,0.9)", borderRadius: 12, border: "1px solid rgba(168,130,90,0.2)", padding: "10px 16px", marginBottom: 18, boxShadow: "0 2px 8px rgba(100,70,40,0.06)" },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, border: "none", background: "transparent", fontSize: 15, color: "#3d2b1f", fontFamily: "inherit", outline: "none" },
  clearBtn: { background: "rgba(229,62,62,0.08)", border: "1.5px solid rgba(229,62,62,0.25)", borderRadius: 10, padding: "10px 16px", color: "#c0392b", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, whiteSpace: "nowrap" },
  list: { display: "flex", flexDirection: "column", gap: 14 },
  empty: { textAlign: "center", padding: "60px 20px", background: "rgba(255,252,245,0.7)", borderRadius: 16, border: "2px dashed rgba(168,130,90,0.2)" },
  card: { background: "rgba(255,252,245,0.92)", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 16, boxShadow: "0 2px 16px rgba(100,70,40,0.09)", border: "1px solid rgba(168,130,90,0.12)" },
  cardLeft: { minWidth: 90 },
  cardDate: { background: "linear-gradient(135deg, #3d2b1f, #6b4226)", borderRadius: 10, padding: "10px 12px", textAlign: "center" },
  cardDateDay: { color: "#f0d9b5", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" },
  cardDateTime: { color: "#fff", fontSize: 20, fontWeight: 700, marginTop: 2, letterSpacing: "0.04em" },
  cardBody: { flex: 1 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  cardName: { fontSize: 17, fontWeight: 700, color: "#2a1a0e", letterSpacing: "0.01em" },
  cardService: { fontSize: 13, color: "#8a6a44", marginTop: 2, fontStyle: "italic" },
  statusBadge: { display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em" },
  statusDot: { width: 7, height: 7, borderRadius: "50%", display: "inline-block" },
  cardInfo: { display: "flex", flexWrap: "wrap", gap: 8 },
  infoChip: { background: "#f0e8db", borderRadius: 20, padding: "4px 10px", fontSize: 12, color: "#6b4a2a", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 },
  editHint: { fontSize: 11, opacity: 0.6 },
  durationEditor: { display: "flex", alignItems: "center", gap: 6, marginTop: 10, background: "#fef8f0", borderRadius: 8, padding: "8px 12px", border: "1px solid #e0c8a8", flexWrap: "wrap" },
  durBtn: { background: "#f0e8db", border: "1.5px solid transparent", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#6b4a2a", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 },
  durBtnActive: { background: "#3d2b1f", color: "#f0d9b5", border: "1.5px solid #3d2b1f" },
  durCancel: { background: "transparent", border: "none", cursor: "pointer", color: "#9a7a5a", fontSize: 14, padding: "2px 6px", fontFamily: "inherit" },
  cardActions: { display: "flex", flexDirection: "column", gap: 6 },
  actionBtn: { background: "#f0e8db", border: "none", borderRadius: 8, padding: "7px 10px", fontSize: 15, cursor: "pointer" },
  formWrap: { maxWidth: 680, margin: "0 auto" },
  formCard: { background: "rgba(255,252,245,0.96)", borderRadius: 18, padding: "30px 32px", boxShadow: "0 8px 40px rgba(100,70,40,0.13)", border: "1px solid rgba(168,130,90,0.15)" },
  formHeader: { display: "flex", alignItems: "center", gap: 16, marginBottom: 28 },
  backBtn: { background: "transparent", border: "none", color: "#8a6a44", cursor: "pointer", fontSize: 14, fontFamily: "inherit", padding: "6px 10px", borderRadius: 6 },
  formTitle: { margin: 0, fontSize: 22, color: "#2a1a0e", fontWeight: 700, letterSpacing: "0.02em" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, color: "#7a5a3a", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" },
  input: { background: "#fef8f0", border: "1.5px solid #e0c8a8", borderRadius: 9, padding: "11px 14px", fontSize: 15, color: "#2a1a0e", fontFamily: "inherit", outline: "none" },
  inputError: { borderColor: "#e53e3e" },
  errorMsg: { fontSize: 11, color: "#e53e3e" },
  durationPicker: { display: "flex", gap: 8, flexWrap: "wrap" },
  durPickerBtn: { background: "#f0e8db", border: "2px solid transparent", borderRadius: 8, padding: "9px 18px", fontSize: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, color: "#6b4a2a" },
  durPickerActive: { background: "#3d2b1f", color: "#f0d9b5", border: "2px solid #3d2b1f" },
  statusBtn: { display: "inline-flex", alignItems: "center", gap: 6, border: "2px solid transparent", borderRadius: 20, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, letterSpacing: "0.04em" },
  formFooter: { display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 28, paddingTop: 20, borderTop: "1px solid #ecdcc8" },
  cancelBtn: { background: "transparent", border: "1.5px solid #d0b890", borderRadius: 9, padding: "11px 22px", color: "#8a6a44", fontSize: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 },
  submitBtn: { background: "linear-gradient(135deg, #3d2b1f, #6b4226)", border: "none", borderRadius: 9, padding: "11px 28px", color: "#f0d9b5", fontSize: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, letterSpacing: "0.05em", boxShadow: "0 3px 12px rgba(61,43,31,0.3)" },
  setupCard: { background: "rgba(255,252,245,0.96)", borderRadius: 18, padding: "40px 36px", maxWidth: 680, margin: "0 auto", boxShadow: "0 8px 40px rgba(100,70,40,0.13)", border: "1px solid rgba(168,130,90,0.15)", textAlign: "center" },
  setupTitle: { fontSize: 24, color: "#2a1a0e", margin: "0 0 12px", fontWeight: 700 },
  setupText: { color: "#6b4a2a", fontSize: 15, lineHeight: 1.6, marginBottom: 24 },
  setupSteps: { textAlign: "left", background: "#fef8f0", borderRadius: 12, padding: "20px 24px", marginBottom: 24, border: "1px solid #e0c8a8" },
  step: { display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12, fontSize: 14, color: "#4a3020", lineHeight: 1.5 },
  stepNum: { background: "#3d2b1f", color: "#f0d9b5", borderRadius: "50%", width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  sqlBlock: { background: "#1e1410", borderRadius: 12, padding: "20px", textAlign: "left" },
  sqlTitle: { color: "#f0d9b5", fontSize: 13, marginBottom: 12, letterSpacing: "0.04em" },
  sqlCode: { color: "#c8a870", fontSize: 12, fontFamily: "monospace", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.7 },
  code: { background: "#f0e8db", borderRadius: 4, padding: "1px 6px", fontSize: 13, color: "#6b4226", fontFamily: "monospace" },
};
