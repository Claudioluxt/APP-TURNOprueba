import { useState } from "react";
import { useTurnos, SERVICES, SERVICE_INFO } from "../hooks/useTurnos"; 

const s = {
  container: { background: "#fdfbf6", padding: "24px", borderRadius: "12px", color: "#2c3e32", maxWidth: "500px", margin: "0 auto", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" },
  header: { display: "flex", alignItems: "center", gap: 16, marginBottom: 24 },
  backBtn: { background: "transparent", border: "none", color: "#5a4a35", cursor: "pointer", fontSize: 14, fontWeight: 600 },
  title: { fontSize: 20, fontWeight: 700, margin: 0, color: "#1a251d" },
  form: { display: "flex", flexDirection: "column", gap: 18 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 700, color: "#5a4a35", textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { padding: "12px", borderRadius: "8px", border: "1px solid rgba(212,175,55,0.4)", background: "rgba(212,175,55,0.05)", color: "#1a251d", fontSize: 14, outline: "none", fontFamily: "inherit" },
  inputError: { border: "1px solid #e74c3c", background: "rgba(231,76,60,0.1)" },
  errorText: { color: "#e74c3c", fontSize: 11, marginTop: 4, textAlign: "center" },
  submitBtn: { background: "#d4af37", color: "#1a251d", border: "none", padding: "14px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", marginTop: 10, fontSize: 15, textTransform: "uppercase", boxShadow: "0 4px 10px rgba(212,175,55,0.3)" }
};

export default function TurnoForm({ user, rol, onVolver, onGuardado }) {
  const { save } = useTurnos(user); 

  const [formData, setFormData] = useState({
    nombre: user?.user_metadata?.full_name || "",
    correo: user?.email || "",
    telefono: "",
    servicio: "",
    fecha: "",
    hora: ""
  });

  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let nuevosErrores = {};
    if (!formData.nombre.trim()) nuevosErrores.nombre = "Nombre requerido";
    if (!formData.correo.trim()) nuevosErrores.correo = "Correo requerido";
    if (!formData.telefono.trim()) nuevosErrores.telefono = "Teléfono requerido";
    if (!formData.servicio) nuevosErrores.servicio = "Servicio requerido";
    if (!formData.fecha) nuevosErrores.fecha = "Fecha requerida";
    if (!formData.hora) nuevosErrores.hora = "Hora requerida";

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setLoading(true);
    
    try {
      const duracionServicio = SERVICE_INFO[formData.servicio]?.duracion || 120; 

      const result = await save({
        name: formData.nombre,
        email: formData.correo,
        phone: formData.telefono,
        service: formData.servicio,
        duration: duracionServicio,
        status: "pendiente",
        date: formData.fecha,
        time: formData.hora
      });

      if (result.error) {
        setErrores({ hora: result.error }); 
        setLoading(false);
        return;
      }
      
      alert("¡Turno reservado con éxito!");
      if (onGuardado) onGuardado();
      
    } catch (err) {
      console.error("Error guardando turno:", err);
      alert("Hubo un error al registrar el turno. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onVolver}>← Volver</button>
        <h2 style={s.title}>Nuevo Turno</h2>
      </div>

      <form onSubmit={handleSubmit} style={s.form}>
        
        <div style={s.field}>
          <label style={s.label}>NOMBRE *</label>
          <input 
            type="text" name="nombre" value={formData.nombre} onChange={handleChange} 
            placeholder="Ej: María González" style={{ ...s.input, ...(errores.nombre ? s.inputError : {}) }}
          />
          {errores.nombre && <span style={s.errorText}>{errores.nombre}</span>}
        </div>

        <div style={s.field}>
          <label style={s.label}>CORREO *</label>
          <input 
            type="email" name="correo" value={formData.correo} onChange={handleChange} 
            placeholder="Ej: correo@ejemplo.com" style={{ ...s.input, ...(errores.correo ? s.inputError : {}) }}
          />
          {errores.correo && <span style={s.errorText}>{errores.correo}</span>}
        </div>

        <div style={s.field}>
          <label style={s.label}>TELÉFONO *</label>
          <input 
            type="tel" name="telefono" value={formData.telefono} onChange={handleChange} 
            placeholder="Ej: 3482536380" style={{ ...s.input, ...(errores.telefono ? s.inputError : {}) }}
          />
          {errores.telefono && <span style={s.errorText}>{errores.telefono}</span>}
        </div>

        <div style={s.field}>
          <label style={s.label}>SERVICIO *</label>
          <select 
            name="servicio" value={formData.servicio} onChange={handleChange}
            style={{ ...s.input, ...(errores.servicio ? s.inputError : {}) }}
          >
            <option value="">Seleccionar servicio...</option>
            {SERVICES?.map((srv) => (
              <option key={srv} value={srv}>
                {srv} {SERVICE_INFO?.[srv]?.precio ? `- $${SERVICE_INFO[srv].precio.toLocaleString("es-AR")}` : ""}
              </option>
            ))}
          </select>
          {errores.servicio && <span style={s.errorText}>{errores.servicio}</span>}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ ...s.field, flex: 1 }}>
            <label style={s.label}>FECHA *</label>
            <input 
              type="date" name="fecha" value={formData.fecha} onChange={handleChange} 
              style={{ ...s.input, ...(errores.fecha ? s.inputError : {}) }}
            />
            {errores.fecha && <span style={s.errorText}>{errores.fecha}</span>}
          </div>

          <div style={{ ...s.field, flex: 1 }}>
            <label style={s.label}>HORA *</label>
            <input 
              type="time" name="hora" value={formData.hora} onChange={handleChange} 
              style={{ ...s.input, ...(errores.hora ? s.inputError : {}) }}
            />
            {errores.hora && <span style={s.errorText}>{errores.hora}</span>}
          </div>
        </div>

        <button type="submit" style={s.submitBtn} disabled={loading}>
          {loading ? "PROCESANDO..." : (rol === "admin" ? "GUARDAR TURNO" : "RESERVAR TURNO")}
        </button>
      </form>
    </div>
  );
}