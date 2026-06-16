import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { SERVICE_INFO, SERVICES, MAX_TURNOS_POR_DIA, isSameDay, turnosSeSuperponen } from "../hooks/useTurnos";

// ── Horarios de trabajo disponibles ──
const HORA_INICIO = 9;   // 9:00
const HORA_FIN    = 19;  // 19:00
const DIAS_LABORABLES = [1,2,3,4,5];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_CORTOS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DIAS_LARGOS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

const pad = n => String(n).padStart(2,"0");
const formatPrecio = p => "$" + p.toLocaleString("es-AR");

// Genera slots de tiempo cada 30min dentro del horario de trabajo
const generarSlots = (duracionMin) => {
  const slots = [];
  for (let h = HORA_INICIO; h < HORA_FIN; h++) {
    for (let m = 0; m < 60; m += 30) {
      const inicio = h * 60 + m;
      const fin = inicio + duracionMin;
      if (fin <= HORA_FIN * 60) {
        slots.push({ hora: `${pad(h)}:${pad(m)}`, inicioMin: inicio, finMin: fin });
      }
    }
  }
  return slots;
};

// Calcula slots disponibles para un día dado
const slotsDisponibles = (date, duracion, turnos) => {
  const slots = generarSlots(duracion);
  return slots.filter(slot => {
    const fechaSlot = new Date(date);
    fechaSlot.setHours(Math.floor(slot.inicioMin/60), slot.inicioMin%60, 0, 0);
    const conflicto = turnos.find(t =>
      isSameDay(t.date, date) &&
      t.status !== "cancelado" &&
      turnosSeSuperponen(fechaSlot, duracion, t.date, t.duration)
    );
    return !conflicto;
  });
};

// Genera los próximos 30 días laborables
const proximosDias = () => {
  const dias = [];
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  let d = new Date(hoy);
  while (dias.length < 30) {
    if (DIAS_LABORABLES.includes(d.getDay())) dias.push(new Date(d));
    d.setDate(d.getDate()+1);
  }
  return dias;
};

const STEP = { SERVICE:1, DAY:2, TIME:3, FORM:4, SUCCESS:5 };

const s = {
  root: { minHeight:"100vh", background:"linear-gradient(160deg,#faf6f0 0%,#f0e8db 100%)", fontFamily:"'Palatino Linotype',Georgia,serif" },
  hero: { background:"linear-gradient(135deg,#3d2b1f 0%,#6b4226 100%)", padding:"32px 20px", textAlign:"center" },
  heroLogo: { color:"#f0d9b5", fontSize:28, fontWeight:700, letterSpacing:"0.18em", marginBottom:4 },
  heroSub: { color:"#b89060", fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:20 },
  heroTitle: { color:"#fff", fontSize:22, fontWeight:400, fontStyle:"italic", marginBottom:6 },
  heroDesc: { color:"rgba(255,255,255,0.7)", fontSize:13 },
  // Stepper
  stepper: { display:"flex", justifyContent:"center", gap:0, padding:"20px 20px 0", maxWidth:500, margin:"0 auto" },
  stepItem: { display:"flex", alignItems:"center", flex:1 },
  stepCircle: { width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, flexShrink:0, transition:"all 0.2s" },
  stepLine: { flex:1, height:2, transition:"all 0.2s" },
  stepLabel: { fontSize:10, textAlign:"center", marginTop:4, letterSpacing:"0.04em", textTransform:"uppercase" },
  // Main
  main: { maxWidth:600, margin:"0 auto", padding:"24px 16px 60px" },
  card: { background:"rgba(255,252,245,0.97)", borderRadius:18, padding:"28px 24px", boxShadow:"0 4px 24px rgba(100,70,40,0.12)", border:"1px solid rgba(168,130,90,0.15)", marginBottom:16 },
  sectionTitle: { fontSize:18, fontWeight:700, color:"#2a1a0e", marginBottom:6, marginTop:0 },
  sectionSub: { fontSize:13, color:"#8a6a44", marginBottom:20 },
  // Servicios
  serviceGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
  serviceCard: { borderRadius:12, border:"2px solid rgba(168,130,90,0.2)", padding:"16px", cursor:"pointer", transition:"all 0.15s", background:"#fef8f0" },
  serviceCardActive: { border:"2px solid #c8873a", background:"rgba(200,135,58,0.08)", boxShadow:"0 2px 12px rgba(200,135,58,0.2)" },
  serviceName: { fontWeight:700, color:"#2a1a0e", fontSize:14, marginBottom:6 },
  serviceDetail: { fontSize:12, color:"#8a6a44" },
  servicePrice: { fontSize:16, fontWeight:700, color:"#c8873a", marginTop:6 },
  // Días
  diasGrid: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 },
  diaCard: { borderRadius:10, border:"2px solid rgba(168,130,90,0.15)", padding:"12px 8px", cursor:"pointer", textAlign:"center", background:"#fef8f0", transition:"all 0.15s" },
  diaCardActive: { border:"2px solid #c8873a", background:"rgba(200,135,58,0.08)" },
  diaCardFull: { opacity:0.4, cursor:"not-allowed", background:"#f0e8db" },
  diaSemana: { fontSize:11, color:"#9a8060", textTransform:"uppercase", letterSpacing:"0.06em" },
  diaDia: { fontSize:22, fontWeight:700, color:"#2a1a0e", lineHeight:1.2 },
  diaMes: { fontSize:11, color:"#8a6a44" },
  diaLibres: { fontSize:10, fontWeight:700, marginTop:4, borderRadius:8, padding:"2px 6px", display:"inline-block" },
  // Slots
  slotsGrid: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 },
  slotBtn: { borderRadius:8, border:"2px solid rgba(168,130,90,0.2)", padding:"10px 6px", cursor:"pointer", textAlign:"center", background:"#fef8f0", fontSize:14, fontWeight:600, color:"#3d2b1f", fontFamily:"inherit", transition:"all 0.15s" },
  slotBtnActive: { border:"2px solid #c8873a", background:"rgba(200,135,58,0.08)", color:"#6b4226" },
  noSlots: { textAlign:"center", padding:"32px", color:"#9a8060", fontSize:15, fontFamily:"Georgia,serif" },
  // Formulario
  field: { display:"flex", flexDirection:"column", gap:6, marginBottom:16 },
  label: { fontSize:12, color:"#7a5a3a", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" },
  input: { background:"#fef8f0", border:"1.5px solid #e0c8a8", borderRadius:9, padding:"12px 14px", fontSize:15, color:"#2a1a0e", fontFamily:"inherit", outline:"none" },
  inputError: { borderColor:"#e53e3e" },
  errorMsg: { fontSize:11, color:"#e53e3e" },
  textarea: { background:"#fef8f0", border:"1.5px solid #e0c8a8", borderRadius:9, padding:"12px 14px", fontSize:14, color:"#2a1a0e", fontFamily:"inherit", outline:"none", resize:"vertical", minHeight:70 },
  // Resumen
  resumen: { background:"linear-gradient(135deg,rgba(61,43,31,0.05),rgba(107,66,38,0.08))", borderRadius:12, padding:"16px", marginBottom:20, border:"1px solid rgba(168,130,90,0.2)" },
  resumenRow: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, fontSize:14 },
  resumenLabel: { color:"#8a6a44" },
  resumenValue: { fontWeight:700, color:"#2a1a0e" },
  // Botones nav
  btnRow: { display:"flex", gap:10, marginTop:20 },
  btnBack: { background:"transparent", border:"1.5px solid #d0b890", borderRadius:9, padding:"12px 20px", color:"#8a6a44", fontSize:14, cursor:"pointer", fontFamily:"inherit", fontWeight:600, flex:1 },
  btnNext: { background:"linear-gradient(135deg,#c8873a,#a0622a)", border:"none", borderRadius:9, padding:"12px 20px", color:"#fff9f0", fontSize:14, cursor:"pointer", fontFamily:"inherit", fontWeight:700, flex:2, boxShadow:"0 3px 12px rgba(168,90,36,0.3)" },
  btnNextDisabled: { opacity:0.4, cursor:"not-allowed" },
  // Éxito
  successCard: { background:"rgba(255,252,245,0.97)", borderRadius:18, padding:"48px 28px", boxShadow:"0 4px 24px rgba(100,70,40,0.12)", border:"1px solid rgba(168,130,90,0.15)", textAlign:"center" },
  successIcon: { fontSize:64, marginBottom:16 },
  successTitle: { fontSize:24, fontWeight:700, color:"#1a7a4a", marginBottom:8 },
  successSub: { fontSize:15, color:"#3d2b1f", lineHeight:1.7, marginBottom:24 },
  successDetail: { background:"#fef8f0", borderRadius:12, padding:"16px", border:"1px solid #e0c8a8", textAlign:"left", marginBottom:24 },
  successRow: { display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:14 },
  nuevoBtn: { background:"linear-gradient(135deg,#3d2b1f,#6b4226)", border:"none", borderRadius:10, padding:"14px 28px", color:"#f0d9b5", fontSize:15, cursor:"pointer", fontFamily:"inherit", fontWeight:700 },
  // Loading
  loadingWrap: { textAlign:"center", padding:"60px 20px", color:"#8a6a44" },
};

const StepIcon = ({ n, active, done }) => (
  <div style={{textAlign:"center"}}>
    <div style={{...s.stepCircle, background: done?"#c8873a":active?"#3d2b1f":"#e0c8a8", color: done||active?"#fff":"#9a8060"}}>
      {done ? "✓" : n}
    </div>
    <div style={{...s.stepLabel, color: active?"#3d2b1f":done?"#c8873a":"#b0a080"}}>
      {["","Servicio","Día","Horario","Datos"][n]}
    </div>
  </div>
);

export default function PortalCliente() {
  const [step, setStep] = useState(STEP.SERVICE);
  const [servicio, setServicio] = useState(null);
  const [dia, setDia] = useState(null);
  const [slot, setSlot] = useState(null);
  const [form, setForm] = useState({ name:"", phone:"", email:"", nota:"" });
  const [errors, setErrors] = useState({});
  const [turnos, setTurnos] = useState([]);
  const [loadingTurnos, setLoadingTurnos] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("turnos").select("id,date,duration,status")
      .then(({ data }) => {
        if (data) setTurnos(data.map(r => ({ ...r, date: new Date(r.date) })));
        setLoadingTurnos(false);
      });
  }, []);

  const dias = proximosDias();
  const svcInfo = servicio ? SERVICE_INFO[servicio] : null;
  const slots = dia && svcInfo ? slotsDisponibles(dia, svcInfo.duracion, turnos) : [];

  const turnosDelDia = (date) => turnos.filter(t => isSameDay(t.date, date) && t.status !== "cancelado").length;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nombre requerido";
    if (form.phone.length < 8) e.phone = "Teléfono inválido";
    if (!form.email.includes("@")) e.email = "Email inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const confirmar = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const [hh, mm] = slot.hora.split(":").map(Number);
    const fecha = new Date(dia);
    fecha.setHours(hh, mm, 0, 0);

    // VERIFICACIÓN EN TIEMPO REAL
    const { data } = await supabase.from("turnos").select("id,date,duration,status");
    const turnosActualizados = data ? data.map(r => ({ ...r, date: new Date(r.date) })) : [];
    
    const conflicto = turnosActualizados.find(t =>
      isSameDay(t.date, fecha) &&
      t.status !== "cancelado" &&
      turnosSeSuperponen(fecha, svcInfo.duracion, t.date, t.duration)
    );

    if (conflicto) {
      setErrors({ business: "⚠️ Este horario acaba de ser reservado por otra persona. Por favor, elegí otro." });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("turnos").insert([{
      name: form.name, email: form.email, phone: form.phone,
      service: servicio, duration: svcInfo.duracion,
      status: "confirmado", date: fecha.toISOString(),
      nota: form.nota || null,
    }]);
    
    setSubmitting(false);
    if (error) { setErrors({ business: error.message }); return; }
    setStep(STEP.SUCCESS);
  };

  const reiniciar = () => {
    setStep(STEP.SERVICE); setServicio(null); setDia(null); setSlot(null);
    setForm({ name:"", phone:"", email:"", nota:"" }); setErrors({});
    setLoadingTurnos(true);
    supabase.from("turnos").select("id,date,duration,status")
      .then(({ data }) => { if (data) setTurnos(data.map(r=>({...r,date:new Date(r.date)}))); setLoadingTurnos(false); });
  };

  if (loadingTurnos) return (
    <div style={s.root}>
      <div style={s.hero}><div style={s.heroLogo}>✦ AURA MASAJES</div></div>
      <div style={s.loadingWrap}><div style={{fontSize:32,marginBottom:12}}>🌿</div>Cargando disponibilidad...</div>
    </div>
  );

  return (
    <div style={s.root}>
      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroLogo}>✦ AURA MASAJES</div>
        <div style={s.heroSub}>Reservá tu turno</div>
        {step < STEP.SUCCESS && (
          <div style={s.heroTitle}>Elegí tu servicio y encontrá el horario ideal 💆</div>
        )}
      </div>

      {/* Stepper */}
      {step < STEP.SUCCESS && (
        <div style={{ background:"rgba(255,252,245,0.95)", borderBottom:"1px solid rgba(168,130,90,0.15)", paddingBottom:16 }}>
          <div style={{ maxWidth:400, margin:"0 auto", padding:"16px 20px 0", display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
            {[1,2,3,4].map((n,i) => (
              <div key={n} style={{ display:"flex", alignItems:"center", flex: i<3?1:"auto" }}>
                <StepIcon n={n} active={step===n} done={step>n}/>
                {i<3 && <div style={{ flex:1, height:2, background: step>n?"#c8873a":"#e0c8a8", margin:"0 4px", marginBottom:20 }}/>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={s.main}>

        {/* STEP 1 — Servicio */}
        {step===STEP.SERVICE && (
          <div style={s.card}>
            <h2 style={s.sectionTitle}>¿Qué servicio necesitás?</h2>
            <p style={s.sectionSub}>Seleccioná el tratamiento que querés reservar</p>
            <div style={s.serviceGrid}>
              {SERVICES.map(svc => {
                const info = SERVICE_INFO[svc];
                const active = servicio===svc;
                return (
                  <div key={svc} style={{...s.serviceCard,...(active?s.serviceCardActive:{})}} onClick={()=>setServicio(svc)}>
                    {active && <div style={{fontSize:16,marginBottom:4}}>✓</div>}
                    <div style={s.serviceName}>{svc}</div>
                    <div style={s.serviceDetail}>⏱ {info.duracion < 60 ? `${info.duracion} min` : info.duracion===120?"2 hs":`${info.duracion} min`}</div>
                    <div style={s.servicePrice}>{formatPrecio(info.precio)}</div>
                  </div>
                );
              })}
            </div>
            <div style={s.btnRow}>
              <button style={{...s.btnNext,...(!servicio?s.btnNextDisabled:{})}} disabled={!servicio}
                onClick={()=>{ setDia(null); setSlot(null); setStep(STEP.DAY); }}>
                Elegir día →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Día */}
        {step===STEP.DAY && (
          <div style={s.card}>
            <h2 style={s.sectionTitle}>¿Qué día te viene bien?</h2>
            <p style={s.sectionSub}>{servicio} · {svcInfo.duracion < 60 ? `${svcInfo.duracion} min` : "2 hs"} · {formatPrecio(svcInfo.precio)}</p>
            <div style={s.diasGrid}>
              {dias.map(d => {
                const ocupados = turnosDelDia(d);
                const libres = MAX_TURNOS_POR_DIA - ocupados;
                const lleno = libres <= 0;
                const active = dia && isSameDay(d, dia);
                return (
                  <div key={d.toISOString()}
                    style={{...s.diaCard,...(active?s.diaCardActive:{}),...(lleno?s.diaCardFull:{})}}
                    onClick={()=>!lleno&&(setDia(d),setSlot(null))}>
                    <div style={s.diaSemana}>{DIAS_CORTOS[d.getDay()]}</div>
                    <div style={s.diaDia}>{d.getDate()}</div>
                    <div style={s.diaMes}>{MESES[d.getMonth()].slice(0,3)}</div>
                    <div style={{...s.diaLibres, background: lleno?"#fde8e8": libres<=2?"#fef5dc":"#d4f4e7", color: lleno?"#e53e3e":libres<=2?"#7a5a0a":"#1a7a4a"}}>
                      {lleno?"Completo":`${libres} lugar${libres!==1?"es":""}`}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={s.btnRow}>
              <button style={s.btnBack} onClick={()=>setStep(STEP.SERVICE)}>← Volver</button>
              <button style={{...s.btnNext,...(!dia?s.btnNextDisabled:{})}} disabled={!dia}
                onClick={()=>{ setSlot(null); setStep(STEP.TIME); }}>
                Ver horarios →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Horario */}
        {step===STEP.TIME && (
          <div style={s.card}>
            <h2 style={s.sectionTitle}>¿A qué hora?</h2>
            <p style={s.sectionSub}>{dia?.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})} · {servicio}</p>
            {slots.length===0
              ? <div style={s.noSlots}>😔 No hay horarios disponibles para este día.<br/>Probá con otro día.</div>
              : <div style={s.slotsGrid}>
                  {slots.map(sl=>(
                    <button key={sl.hora}
                      style={{...s.slotBtn,...(slot?.hora===sl.hora?s.slotBtnActive:{})}}
                      onClick={()=>setSlot(sl)}>
                      {sl.hora}
                    </button>
                  ))}
                </div>
            }
            <div style={s.btnRow}>
              <button style={s.btnBack} onClick={()=>setStep(STEP.DAY)}>← Volver</button>
              <button style={{...s.btnNext,...(!slot?s.btnNextDisabled:{})}} disabled={!slot}
                onClick={()=>setStep(STEP.FORM)}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — Datos */}
        {step===STEP.FORM && (
          <div style={s.card}>
            <h2 style={s.sectionTitle}>Tus datos</h2>
            <p style={s.sectionSub}>Para confirmar tu reserva necesitamos estos datos</p>

            {/* Resumen */}
            <div style={s.resumen}>
              {[
                ["Servicio", servicio],
                ["Día", dia?.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})],
                ["Horario", `${slot?.hora} hs · ${svcInfo?.duracion} min`],
                ["Total", formatPrecio(svcInfo?.precio)],
              ].map(([l,v])=>(
                <div key={l} style={s.resumenRow}>
                  <span style={s.resumenLabel}>{l}</span>
                  <span style={s.resumenValue}>{v}</span>
                </div>
              ))}
            </div>

            {errors.business && <div style={{background:"#fde8e8",border:"1.5px solid #e53e3e",borderRadius:10,padding:"12px",fontSize:14,color:"#7a1a1a",marginBottom:16}}>⚠️ {errors.business}</div>}

            <div style={s.field}>
              <label style={s.label}>Nombre completo *</label>
              <input style={{...s.input,...(errors.name?s.inputError:{})}} placeholder="María González"
                value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
              {errors.name&&<span style={s.errorMsg}>{errors.name}</span>}
            </div>
            <div style={s.field}>
              <label style={s.label}>Teléfono *</label>
              <input style={{...s.input,...(errors.phone?s.inputError:{})}} placeholder="+54 11 1234-5678" type="tel"
                value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
              {errors.phone&&<span style={s.errorMsg}>{errors.phone}</span>}
            </div>
            <div style={s.field}>
              <label style={s.label}>Email *</label>
              <input style={{...s.input,...(errors.email?s.inputError:{})}} placeholder="vos@email.com" type="email"
                value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
              {errors.email&&<span style={s.errorMsg}>{errors.email}</span>}
            </div>
            <div style={s.field}>
              <label style={s.label}>Nota opcional</label>
              <textarea style={s.textarea} placeholder="¿Alguna preferencia o consulta? (opcional)"
                value={form.nota} onChange={e=>setForm(f=>({...f,nota:e.target.value}))}/>
            </div>

            <div style={s.btnRow}>
              <button style={s.btnBack} onClick={()=>setStep(STEP.TIME)}>← Volver</button>
              <button style={s.btnNext} onClick={confirmar} disabled={submitting}>
                {submitting?"Confirmando...":"✓ Confirmar reserva"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5 — Éxito */}
        {step===STEP.SUCCESS && (
          <div style={s.successCard}>
            <div style={s.successIcon}>🎉</div>
            <div style={s.successTitle}>¡Turno confirmado!</div>
            <div style={s.successSub}>
              Te esperamos, <strong>{form.name}</strong>. Tu turno quedó registrado correctamente.
            </div>
            <div style={s.successDetail}>
              {[
                ["Servicio", servicio],
                ["Día", dia?.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})],
                ["Horario", `${slot?.hora} hs`],
                ["Duración", `${svcInfo?.duracion} min`],
                ["Total", formatPrecio(svcInfo?.precio)],
                ["Teléfono", form.phone],
              ].map(([l,v])=>(
                <div key={l} style={s.successRow}>
                  <span style={{color:"#8a6a44"}}>{l}</span>
                  <span style={{fontWeight:700,color:"#2a1a0e"}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{color:"#8a6a44",fontSize:13,marginBottom:24,lineHeight:1.6}}>
              📞 Si necesitás cancelar o modificar tu turno, contactanos al <strong>3482-536380</strong>
            </div>
            <button style={s.nuevoBtn} onClick={reiniciar}>Reservar otro turno</button>
          </div>
        )}

      </div>
    </div>
  );
}