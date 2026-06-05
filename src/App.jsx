import { useState, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────────
//  🔧 CONFIGURACIÓN SUPABASE
// ─────────────────────────────────────────────
const SUPABASE_URL = 'https://cyrinitjjbdcswakbqli.supabase.co'
const SUPABASE_ANON_KEY = "sb_publishable_FDD0GpFO814XI6DiCe9bxg_k92hHvlx";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const isConfigured =
  !SUPABASE_URL.includes("TU_PROJECT_ID") &&
  !SUPABASE_ANON_KEY.includes("TU_ANON_KEY");

// ─────────────────────────────────────────────
//  REGLAS DE NEGOCIO
// ─────────────────────────────────────────────
const MAX_TURNOS_POR_DIA = 8;
const DIAS_LABORABLES = [1, 2, 3, 4, 5]; // 0=dom, 1=lun ... 6=sab
const DIAS_NOMBRES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const DURATIONS = [30, 45, 60, 90, 120];
const SERVICES = ["Masaje Relajante", "Masaje Deportivo", "Masaje Descontracturante", "Masaje con Piedras Calientes", "Reflexología"];

const formatTime = (date) => date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
const formatDate = (date) => date.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short" });
const isSameDay = (a, b) => a.toDateString() === b.toDateString();
const isToday = (date) => isSameDay(date, new Date());

// Verifica si dos turnos se solapan en el tiempo
const turnosSeSuperponen = (fechaA, durA, fechaB, durB) => {
  const inicioA = fechaA.getTime();
  const finA = inicioA + durA * 60000;
  const inicioB = fechaB.getTime();
  const finB = inicioB + durB * 60000;
  return inicioA < finB && finA > inicioB;
};

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

export default function App() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [view, setView] = useState("list");
  const [filterHoy, setFilterHoy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editingDuration, setEditingDuration] = useState(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", service: SERVICES[0],
    duration: 60, date: "", time: "", status: "confirmado",
  });
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  // ── Validaciones de negocio ──
  const validateBusiness = (dateObj, durationMin, excludeId = null) => {
    const diaSemana = dateObj.getDay();

    // 1. Día laborable
    if (!DIAS_LABORABLES.includes(diaSemana)) {
      return `No se trabaja los ${DIAS_NOMBRES[diaSemana]}. Solo se aceptan turnos de lunes a viernes.`;
    }

    // 2. Límite de turnos por día (solo turnos activos, no cancelados)
    const turnosDelDia = appointments.filter(a =>
      isSameDay(a.date, dateObj) &&
      a.status !== "cancelado" &&
      a.id !== excludeId
    );
    if (turnosDelDia.length >= MAX_TURNOS_POR_DIA) {
      return `El día ${formatDate(dateObj)} ya tiene ${MAX_TURNOS_POR_DIA} turnos agendados (máximo permitido).`;
    }

    // 3. Superposición horaria
    const conflicto = appointments.find(a =>
      a.id !== excludeId &&
      a.status !== "cancelado" &&
      isSameDay(a.date, dateObj) &&
      turnosSeSuperponen(dateObj, durationMin, a.date, a.duration)
    );
    if (conflicto) {
      return `Conflicto de horario con el turno de ${conflicto.name} a las ${formatTime(conflicto.date)} (${conflicto.duration} min).`;
    }

    return null;
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nombre requerido";
    if (!form.email.includes("@")) e.email = "Email inválido";
    if (form.phone.length < 8) e.phone = "Teléfono inválido";
    if (!form.date) e.date = "Fecha requerida";
    if (!form.time) e.time = "Hora requerida";

    if (form.date && form.time) {
      const dateObj = new Date(`${form.date}T${form.time}`);
      const bizError = validateBusiness(dateObj, form.duration, selected?.id);
      if (bizError) e.business = bizError;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const dateObj = new Date(`${form.date}T${form.time}`);
    const payload = {
      name: form.name, email: form.email, phone: form.phone,
      service: form.service, duration: form.duration,
      status: form.status, date: dateObj.toISOString(),
    };

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
    setErrors({});
    setView("form");
  };

  const updateDuration = async (id, dur) => {
    const appt = appointments.find(a => a.id === id);
    const bizError = validateBusiness(appt.date, dur, id);
    if (bizError) { setDbError(bizError); return; }
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

  // ── Turnos de hoy para el contador ──
  const turnosHoy = appointments.filter(a => isToday(a.date) && a.status !== "cancelado");
  const cupoHoyUsado = turnosHoy.length;
  const cupoHoyLibre = MAX_TURNOS_POR_DIA - cupoHoyUsado;

  const filtered = appointments
    .filter(a => {
      const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.service.toLowerCase().includes(search.toLowerCase());
      const matchHoy = !filterHoy || isToday(a.date);
      return matchSearch && matchHoy;
    })
    .sort((a, b) => a.date - b.date);

  // ── Pantalla de configuración ──
  if (!isConfigured) {
    return (
      <div style={styles.root}>
        <div style={styles.bgTexture} />
        <header style={styles.header}>
          <div style={styles.headerInner}>
            <div>
              <div style={styles.logo}>✦Relajate o te RELAJO</div>
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
              {["Creá una cuenta en supabase.com (es gratis)", "Creá un nuevo proyecto", "Andá a SQL Editor y ejecutá el script de abajo", "Copiá la Project URL y la anon key desde Project Settings → API", "Pegálas en las variables SUPABASE_URL y SUPABASE_ANON_KEY"].map((s, i) => (
                <div key={i} style={styles.step}><span style={styles.stepNum}>{i+1}</span> {s}</div>
              ))}
            </div>
            <div style={styles.sqlBlock}>
              <div style={styles.sqlTitle}>📋 Script SQL</div>
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
alter table turnos enable row level security;
create policy "Allow all" on turnos for all using (true);`}</pre>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <div style={styles.bgTexture} />

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <div style={styles.logo}>✦ NO LELE PANSA</div>
            <div style={styles.logoSub}>Sistema de Turnos · Sala de Masajes</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={styles.storageBadge}>🟢 Supabase conectado</div>
            <button style={styles.newBtn} onClick={() => {
              setSelected(null);
              setForm({ name:"",email:"",phone:"",service:SERVICES[0],duration:60,date:"",time:"",status:"confirmado"});
              setErrors({});
              setView("form");
            }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Nuevo Turno
            </button>
          </div>
        </div>
      </header>

      {successMsg && <div style={styles.toast}>{successMsg}</div>}
      {dbError && (
        <div style={{ ...styles.toast, background: "#e53e3e" }}>
          ❌ {dbError}
          <button onClick={() => setDbError(null)} style={{ marginLeft: 12, background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      )}

      <main style={styles.main}>
        {view === "list" && (
          <>
            {/* Stats */}
            <div style={styles.statsRow}>
              {[
                { label: "Total Turnos", value: appointments.length, icon: "📋" },
                { label: "Confirmados", value: appointments.filter(a=>a.status==="confirmado").length, icon: "✅" },
                { label: "Pendientes",  value: appointments.filter(a=>a.status==="pendiente").length, icon: "⏳" },
                { label: "Turnos Hoy",  value: cupoHoyUsado, icon: "📅", sub: `${cupoHoyLibre} lugar${cupoHoyLibre !== 1 ? "es" : ""} libre${cupoHoyLibre !== 1 ? "s" : ""}`, subColor: cupoHoyLibre === 0 ? "#e53e3e" : cupoHoyLibre <= 2 ? "#f0a500" : "#27ae60" },
              ].map(s => (
                <div key={s.label} style={{ ...styles.statCard, cursor: s.label === "Turnos Hoy" ? "pointer" : "default", outline: s.label === "Turnos Hoy" && filterHoy ? "2px solid #c8873a" : "none" }}
                  onClick={() => s.label === "Turnos Hoy" && setFilterHoy(f => !f)}>
                  <div style={styles.statIcon}>{s.icon}</div>
                  <div style={styles.statValue}>{s.value}</div>
                  <div style={styles.statLabel}>{s.label}</div>
                  {s.sub && <div style={{ fontSize: 10, color: s.subColor, fontWeight: 700, marginTop: 2 }}>{s.sub}</div>}
                </div>
              ))}
            </div>

            {/* Alerta cupo lleno hoy */}
            {cupoHoyLibre === 0 && (
              <div style={styles.alertaBanner}>
                ⚠️ <strong>Agenda completa para hoy</strong> — Se alcanzó el límite de {MAX_TURNOS_POR_DIA} turnos diarios.
              </div>
            )}

            {/* Filtro hoy activo */}
            {filterHoy && (
              <div style={styles.filterBanner}>
                📅 Mostrando solo turnos de hoy
                <button style={styles.filterClear} onClick={() => setFilterHoy(false)}>✕ Ver todos</button>
              </div>
            )}

            {/* Buscador */}
            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
              <div style={{ ...styles.searchWrap, marginBottom: 0, flex: 1 }}>
                <span style={styles.searchIcon}>🔍</span>
                <input style={styles.searchInput} placeholder="Buscar por nombre o servicio..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {appointments.length > 0 && (
                <button style={styles.clearBtn} onClick={clearAllData}>🗑 Limpiar todo</button>
              )}
            </div>

            {/* Lista */}
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
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#7a6e5f" }}>
                    {filterHoy ? "No hay turnos para hoy" : "No hay turnos registrados"}
                  </div>
                </div>
              )}
              {!loading && filtered.map(appt => {
                const sc = statusColors[appt.status] || statusColors.pendiente;
                const esHoy = isToday(appt.date);
                return (
                  <div key={appt.id} style={{ ...styles.card, ...(esHoy ? styles.cardHoy : {}) }}>
                    <div style={styles.cardLeft}>
                      <div style={{ ...styles.cardDate, ...(esHoy ? styles.cardDateHoy : {}) }}>
                        {esHoy && <div style={styles.cardHoyTag}>HOY</div>}
                        <div style={styles.cardDateDay}>{formatDate(appt.date)}</div>
                        <div style={styles.cardDateTime}>{formatTime(appt.date)}</div>
                      </div>
                    </div>
                    <div style={styles.cardBody}>
                      <div style={styles.cardTop}>
                        <div>
                          <div style={styles.cardName}>{appt.name}</div>
                          <div style={styles.cardService}>{appt.service}</div>
                        </div>
                        <span style={{ ...styles.statusBadge, background: sc.bg, color: sc.text }}>
                          <span style={{ ...styles.statusDot, background: sc.dot }} />
                          {appt.status}
                        </span>
                      </div>
                      <div style={styles.cardInfo}>
                        <span style={styles.infoChip}>📧 {appt.email}</span>
                        <span style={styles.infoChip}>📞 {appt.phone}</span>
                        <span style={styles.infoChip} onClick={() => setEditingDuration(appt.id)} title="Click para editar">
                          ⏱ {appt.duration} min <span style={styles.editHint}>✏️</span>
                        </span>
                      </div>
                      {editingDuration === appt.id && (
                        <div style={styles.durationEditor}>
                          <span style={{ fontSize: 13, color: "#7a6e5f", marginRight: 8 }}>Cambiar duración:</span>
                          {DURATIONS.map(d => (
                            <button key={d}
                              style={{ ...styles.durBtn, ...(appt.duration === d ? styles.durBtnActive : {}) }}
                              onClick={() => updateDuration(appt.id, d)}>{d}m</button>
                          ))}
                          <button style={styles.durCancel} onClick={() => setEditingDuration(null)}>✕</button>
                        </div>
                      )}
                    </div>
                    <div style={styles.cardActions}>
                      <button style={styles.actionBtn} title="Editar" onClick={() => openEdit(appt)}>✏️</button>
                      <button style={{ ...styles.actionBtn, color: "#e53e3e" }} title="Eliminar" onClick={() => deleteAppt(appt.id)}>🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {view === "form" && (
          <div style={styles.formWrap}>
            <div style={styles.formCard}>
              <div style={styles.formHeader}>
                <button style={styles.backBtn} onClick={() => setView("list")}>← Volver</button>
                <h2 style={styles.formTitle}>{selected ? "Editar Turno" : "Nuevo Turno"}</h2>
              </div>

              {/* Alerta de error de negocio */}
              {errors.business && (
                <div style={styles.bizError}>
                  ⚠️ {errors.business}
                </div>
              )}

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
                  {/* Aviso fin de semana en tiempo real */}
                  {form.date && !DIAS_LABORABLES.includes(new Date(form.date + "T12:00").getDay()) && (
                    <span style={{ ...styles.errorMsg, color: "#e07a00" }}>
                      ⚠️ Este día es fin de semana — no se trabaja
                    </span>
                  )}
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Hora *</label>
                  <input type="time" style={{ ...styles.input, ...(errors.time ? styles.inputError : {}) }}
                    value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                  {errors.time && <span style={styles.errorMsg}>{errors.time}</span>}
                </div>
                <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                  <label style={styles.label}>Duración del Turno</label>
                  <div style={styles.durationPicker}>
                    {DURATIONS.map(d => (
                      <button key={d}
                        style={{ ...styles.durPickerBtn, ...(form.duration === d ? styles.durPickerActive : {}) }}
                        onClick={() => setForm(f => ({ ...f, duration: d }))}>{d} min</button>
                    ))}
                  </div>
                </div>
                <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                  <label style={styles.label}>Estado</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {["confirmado", "pendiente", "cancelado"].map(s => {
                      const sc = statusColors[s];
                      return (
                        <button key={s}
                          style={{ ...styles.statusBtn, background: form.status === s ? sc.bg : "#f5f0eb", color: form.status === s ? sc.text : "#9a8e7f", borderColor: form.status === s ? sc.dot : "transparent" }}
                          onClick={() => setForm(f => ({ ...f, status: s }))}>
                          <span style={{ ...styles.statusDot, background: sc.dot }} />{s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div style={styles.formFooter}>
                <button style={styles.cancelBtn} onClick={() => setView("list")}>Cancelar</button>
                <button style={styles.submitBtn} onClick={handleSubmit}>
                  {selected ? "Guardar Cambios" : "Registrar Turno"}
                </button>
              </div>
            </div>
          </div>
        )}
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
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 },
  statCard: { background: "rgba(255,252,245,0.85)", borderRadius: 14, padding: "18px 14px", textAlign: "center", boxShadow: "0 2px 12px rgba(100,70,40,0.1)", border: "1px solid rgba(168,130,90,0.15)", transition: "transform 0.15s" },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: 700, color: "#3d2b1f", lineHeight: 1 },
  statLabel: { fontSize: 11, color: "#9a8060", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 },
  alertaBanner: { background: "#fde8e8", border: "1.5px solid #e53e3e", borderRadius: 10, padding: "12px 18px", fontSize: 14, color: "#7a1a1a", marginBottom: 14 },
  filterBanner: { background: "#fef5dc", border: "1.5px solid #f0a500", borderRadius: 10, padding: "10px 18px", fontSize: 13, color: "#7a5a0a", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" },
  filterClear: { background: "transparent", border: "none", color: "#7a5a0a", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13 },
  searchWrap: { display: "flex", alignItems: "center", background: "rgba(255,252,245,0.9)", borderRadius: 12, border: "1px solid rgba(168,130,90,0.2)", padding: "10px 16px", marginBottom: 18, boxShadow: "0 2px 8px rgba(100,70,40,0.06)" },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, border: "none", background: "transparent", fontSize: 15, color: "#3d2b1f", fontFamily: "inherit", outline: "none" },
  clearBtn: { background: "rgba(229,62,62,0.08)", border: "1.5px solid rgba(229,62,62,0.25)", borderRadius: 10, padding: "10px 16px", color: "#c0392b", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, whiteSpace: "nowrap" },
  list: { display: "flex", flexDirection: "column", gap: 14 },
  empty: { textAlign: "center", padding: "60px 20px", background: "rgba(255,252,245,0.7)", borderRadius: 16, border: "2px dashed rgba(168,130,90,0.2)" },
  card: { background: "rgba(255,252,245,0.92)", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 16, boxShadow: "0 2px 16px rgba(100,70,40,0.09)", border: "1px solid rgba(168,130,90,0.12)" },
  cardHoy: { border: "2px solid #c8873a", boxShadow: "0 2px 20px rgba(200,135,58,0.18)" },
  cardLeft: { minWidth: 90 },
  cardDate: { background: "linear-gradient(135deg, #3d2b1f, #6b4226)", borderRadius: 10, padding: "10px 12px", textAlign: "center" },
  cardDateHoy: { background: "linear-gradient(135deg, #a0622a, #c8873a)" },
  cardHoyTag: { background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", borderRadius: 4, padding: "2px 6px", marginBottom: 4, display: "inline-block" },
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
  formHeader: { display: "flex", alignItems: "center", gap: 16, marginBottom: 20 },
  backBtn: { background: "transparent", border: "none", color: "#8a6a44", cursor: "pointer", fontSize: 14, fontFamily: "inherit", padding: "6px 10px", borderRadius: 6 },
  formTitle: { margin: 0, fontSize: 22, color: "#2a1a0e", fontWeight: 700, letterSpacing: "0.02em" },
  bizError: { background: "#fde8e8", border: "1.5px solid #e53e3e", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "#7a1a1a", marginBottom: 20, lineHeight: 1.5 },
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
