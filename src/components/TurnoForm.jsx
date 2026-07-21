import { useState, useEffect } from "react";
import { SERVICES, SERVICE_INFO, DURATIONS, DIAS_LABORABLES } from "../hooks/useTurnos";

// ── Paleta Aura Masajes ──────────────────────
const C = {
  bg:        "#faf6f0",
  card:      "rgba(255,252,245,0.97)",
  border:    "#e0c8a8",
  borderFocus:"#c8873a",
  label:     "#7a5a3a",
  text:      "#2a1a0e",
  textSub:   "#8a6a44",
  inputBg:   "#fef8f0",
  accent:    "#c8873a",
  accentDark:"#3d2b1f",
  accentGrad:"linear-gradient(135deg,#3d2b1f,#6b4226)",
  error:     "#e53e3e",
  errorBg:   "#fde8e8",
  warn:      "#e07a00",
  green:     "#27ae60",
  greenBg:   "#d4f4e7",
  amber:     "#f0a500",
  amberBg:   "#fef5dc",
};

const statusColors = {
  confirmado: { bg: C.greenBg,  text: "#1a7a4a", dot: C.green  },
  pendiente:  { bg: C.amberBg,  text: "#7a5a0a", dot: C.amber  },
  cancelado:  { bg: C.errorBg,  text: "#7a1a1a", dot: C.error  },
};

const emptyForm = {
  name: "", email: "", phone: "",
  service: SERVICES[0],
  duration: SERVICE_INFO[SERVICES[0]].duracion,
  date: "", time: "",
  status: "confirmado",
};

export default function TurnoForm({ selected, prefillDate, onBack, onSave }) {
  const [form, setForm]     = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selected && !selected._prefillDate) {
      const d   = selected.date;
      const pad = n => String(n).padStart(2, "0");
      setForm({
        name:     selected.name,
        email:    selected.email,
        phone:    selected.phone,
        service:  selected.service,
        duration: selected.duration,
        status:   selected.status,
        date: `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,
        time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      });
    } else {
      setForm({ ...emptyForm, date: prefillDate || "" });
    }
    setErrors({});
  }, [selected, prefillDate]);

  const validate = () => {
    const e = {};
    if (!form.name.trim())          e.name  = "Nombre requerido";
    if (!form.email.includes("@"))  e.email = "Email inválido";
    if (form.phone.length < 8)      e.phone = "Teléfono inválido";
    if (!form.date)                 e.date  = "Fecha requerida";
    if (!form.time)                 e.time  = "Hora requerida";
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

  const esFinDeSemana = form.date &&
    !DIAS_LABORABLES.includes(new Date(form.date + "T12:00").getDay());

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div style={sx.wrap}>
      <div style={sx.card}>

        {/* ── Encabezado ── */}
        <div style={sx.header}>
          <button style={sx.backBtn} onClick={onBack}>← Volver</button>
          <h2 style={sx.title}>
            {selected && !selected._prefillDate ? "Editar Turno" : "Nuevo Turno"}
          </h2>
        </div>

        {/* ── Error de negocio ── */}
        {errors.business && (
          <div style={sx.bizAlert}>⚠️ {errors.business}</div>
        )}

        {/* ── Grid de campos ── */}
        <div style={sx.grid}>

          {/* Nombre */}
          <Field label="Nombre del Cliente *" error={errors.name}>
            <input
              style={{ ...sx.input, ...(errors.name ? sx.inputErr : {}) }}
              placeholder="Ej: María González"
              value={form.name}
              onChange={e => setField("name", e.target.value)}
            />
          </Field>

          {/* Email */}
          <Field label="Correo Electrónico *" error={errors.email}>
            <input
              style={{ ...sx.input, ...(errors.email ? sx.inputErr : {}) }}
              placeholder="cliente@email.com"
              value={form.email}
              onChange={e => setField("email", e.target.value)}
            />
          </Field>

          {/* Teléfono */}
          <Field label="Teléfono *" error={errors.phone}>
            <input
              style={{ ...sx.input, ...(errors.phone ? sx.inputErr : {}) }}
              placeholder="+54 11 1234-5678"
              value={form.phone}
              onChange={e => setField("phone", e.target.value)}
            />
          </Field>

          {/* Servicio */}
          <Field label="Tipo de Masaje">
            <select
              style={sx.input}
              value={form.service}
              onChange={e => {
                const svc = e.target.value;
                setField("service", svc);
                if (SERVICE_INFO[svc]) setField("duration", SERVICE_INFO[svc].duracion);
              }}
            >
              {SERVICES.map(sv => (
                <option key={sv} value={sv}>
                  {sv} — ${SERVICE_INFO[sv].precio.toLocaleString("es-AR")}
                </option>
              ))}
            </select>
          </Field>

          {/* Fecha */}
          <Field label="Fecha *" error={errors.date}
            warn={esFinDeSemana ? "⚠️ Fin de semana — no se trabaja" : null}>
            <input
              type="date"
              style={{ ...sx.input, ...(errors.date ? sx.inputErr : {}) }}
              value={form.date}
              onChange={e => setField("date", e.target.value)}
            />
          </Field>

          {/* Hora */}
          <Field label="Hora *" error={errors.time}>
            <input
              type="time"
              style={{ ...sx.input, ...(errors.time ? sx.inputErr : {}) }}
              value={form.time}
              onChange={e => setField("time", e.target.value)}
            />
          </Field>

          {/* Duración — ocupa fila completa */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={sx.label}>Duración del Turno</label>
            <div style={sx.durRow}>
              {DURATIONS.map(d => (
                <button
                  key={d}
                  style={{ ...sx.durBtn, ...(form.duration === d ? sx.durBtnOn : {}) }}
                  onClick={() => setField("duration", d)}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Estado — ocupa fila completa */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={sx.label}>Estado</label>
            <div style={sx.statusRow}>
              {["confirmado", "pendiente", "cancelado"].map(st => {
                const sc = statusColors[st];
                return (
                  <button
                    key={st}
                    style={{
                      ...sx.statusBtn,
                      background:   form.status === st ? sc.bg   : "#f5f0eb",
                      color:        form.status === st ? sc.text : "#9a8e7f",
                      borderColor:  form.status === st ? sc.dot  : "transparent",
                    }}
                    onClick={() => setField("status", st)}
                  >
                    <span style={{ ...sx.dot, background: sc.dot }} />
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

        </div>{/* /grid */}

        {/* ── Footer ── */}
        <div style={sx.footer}>
          <button style={sx.cancelBtn} onClick={onBack}>Cancelar</button>
          <button
            style={{ ...sx.submitBtn, ...(saving ? sx.submitBtnDisabled : {}) }}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving
              ? "Guardando…"
              : selected && !selected._prefillDate
                ? "Guardar Cambios"
                : "Registrar Turno"}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── Componente auxiliar de campo ── */
function Field({ label, error, warn, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={sx.label}>{label}</label>
      {children}
      {error && <span style={sx.errorMsg}>{error}</span>}
      {warn  && <span style={sx.warnMsg}>{warn}</span>}
    </div>
  );
}

/* ── Estilos ── */
const sx = {
  wrap: {
    maxWidth: 680,
    margin: "0 auto",
  },
  card: {
    background:   C.card,
    borderRadius: 18,
    padding:      "30px 32px",
    boxShadow:    "0 8px 40px rgba(100,70,40,0.13)",
    border:       `1px solid rgba(168,130,90,0.15)`,
  },
  header: {
    display:       "flex",
    alignItems:    "center",
    gap:           16,
    marginBottom:  24,
  },
  backBtn: {
    background:   "transparent",
    border:       "none",
    color:        C.textSub,
    cursor:       "pointer",
    fontSize:     14,
    fontFamily:   "inherit",
    padding:      "6px 10px",
    borderRadius: 6,
  },
  title: {
    margin:      0,
    fontSize:    22,
    color:       C.text,
    fontWeight:  700,
    letterSpacing: "0.02em",
  },
  bizAlert: {
    background:   C.errorBg,
    border:       `1.5px solid ${C.error}`,
    borderRadius: 10,
    padding:      "12px 16px",
    fontSize:     14,
    color:        "#7a1a1a",
    marginBottom: 20,
    lineHeight:   1.5,
  },
  grid: {
    display:             "grid",
    gridTemplateColumns: "1fr 1fr",
    gap:                 18,
  },
  label: {
    fontSize:      12,
    color:         C.label,
    fontWeight:    600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom:  2,
  },
  input: {
    background:   C.inputBg,
    border:       `1.5px solid ${C.border}`,
    borderRadius: 9,
    padding:      "11px 14px",
    fontSize:     15,
    color:        C.text,
    fontFamily:   "inherit",
    outline:      "none",
    width:        "100%",
    boxSizing:    "border-box",
    transition:   "border-color 0.15s",
  },
  inputErr: {
    borderColor: C.error,
  },
  errorMsg: {
    fontSize: 11,
    color:    C.error,
  },
  warnMsg: {
    fontSize: 11,
    color:    C.warn,
  },
  // Duración
  durRow: {
    display:   "flex",
    gap:       8,
    flexWrap:  "wrap",
    marginTop: 6,
  },
  durBtn: {
    background:   "#f0e8db",
    border:       "2px solid transparent",
    borderRadius: 8,
    padding:      "9px 18px",
    fontSize:     14,
    cursor:       "pointer",
    fontFamily:   "inherit",
    fontWeight:   600,
    color:        "#6b4a2a",
    transition:   "all 0.15s",
  },
  durBtnOn: {
    background:  C.accentDark,
    color:       "#f0d9b5",
    border:      `2px solid ${C.accentDark}`,
  },
  // Estado
  statusRow: {
    display:   "flex",
    gap:       10,
    marginTop: 6,
    flexWrap:  "wrap",
  },
  statusBtn: {
    display:       "inline-flex",
    alignItems:    "center",
    gap:           6,
    border:        "2px solid transparent",
    borderRadius:  20,
    padding:       "8px 16px",
    fontSize:      13,
    cursor:        "pointer",
    fontFamily:    "inherit",
    fontWeight:    600,
    letterSpacing: "0.04em",
    transition:    "all 0.15s",
  },
  dot: {
    width:        7,
    height:       7,
    borderRadius: "50%",
    display:      "inline-block",
    flexShrink:   0,
  },
  // Footer
  footer: {
    display:        "flex",
    justifyContent: "flex-end",
    gap:            12,
    marginTop:      28,
    paddingTop:     20,
    borderTop:      `1px solid #ecdcc8`,
  },
  cancelBtn: {
    background:   "transparent",
    border:       `1.5px solid #d0b890`,
    borderRadius: 9,
    padding:      "11px 22px",
    color:        C.textSub,
    fontSize:     14,
    cursor:       "pointer",
    fontFamily:   "inherit",
    fontWeight:   600,
  },
  submitBtn: {
    background:    C.accentGrad,
    border:        "none",
    borderRadius:  9,
    padding:       "11px 28px",
    color:         "#f0d9b5",
    fontSize:      14,
    cursor:        "pointer",
    fontFamily:    "inherit",
    fontWeight:    700,
    letterSpacing: "0.05em",
    boxShadow:     "0 3px 12px rgba(61,43,31,0.3)",
    transition:    "opacity 0.15s",
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor:  "not-allowed",
  },
};
