import { useState } from "react";
import { supabase } from "../lib/supabase";
import logoImg from "../assets/logo.png";

const s = {
  wrapper: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #2c3e32 0%, #1a251d 100%)", padding: 20 },
  card: { width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", alignItems: "center" },
  
  // Logo con efecto 3D y borde difuminado
  logoImg: { 
    width: 150, 
    height: 150, 
    borderRadius: "50%", 
    objectFit: "cover", 
    marginBottom: 35, 
    background: "#1a251d", 
    boxShadow: "0 0 20px 4px rgba(212, 175, 55, 0.4), 0 20px 40px rgba(0, 0, 0, 0.7), 0 15px 20px rgba(0, 0, 0, 0.5)" 
  },
  
  title: { color: "#d4af37", fontSize: 24, fontWeight: 400, letterSpacing: "0.15em", fontFamily: "'Palatino Linotype', Georgia, serif", textTransform: "uppercase", marginBottom: 35 },
  form: { width: "100%", display: "flex", flexDirection: "column", gap: 24 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { color: "#d4af37", fontSize: 13, letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 8 },
  input: { width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #d4af37", color: "#fff", fontSize: 16, padding: "8px 0", outline: "none", fontFamily: "inherit" },
  submitBtn: { background: "#d4af37", color: "#1a251d", border: "none", borderRadius: 8, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: "0.1em", marginTop: 10, textTransform: "uppercase", boxShadow: "0 4px 15px rgba(212, 175, 55, 0.2)" },
  googleBtn: { background: "#fff", color: "#333", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 15 },
  linksRow: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 24 },
  link: { color: "#d4af37", fontSize: 13, textDecoration: "none", cursor: "pointer" },
  errorMsg: { color: "#e74c3c", fontSize: 13, textAlign: "center", marginTop: 10, background: "rgba(231,76,60,0.1)", padding: "10px", borderRadius: 6, border: "1px solid rgba(231,76,60,0.3)" },
  successMsg: { color: "#2ecc71", fontSize: 13, textAlign: "center", marginTop: 10, background: "rgba(46,204,113,0.1)", padding: "10px", borderRadius: 6, border: "1px solid rgba(46,204,113,0.3)" }
};

export default function Login() {
  const [view, setView] = useState("login"); // 'login', 'register', 'forgot'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);

    try {
      if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error("Credenciales incorrectas o usuario no registrado.");
      } 
      else if (view === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw new Error(error.message);
        setMsg("Registro exitoso. Revisá tu correo para confirmar la cuenta.");
        setView("login");
      } 
      else if (view === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw new Error(error.message);
        setMsg("Te enviamos un enlace para restablecer la contraseña.");
        setView("login");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <img src={logoImg} alt="Aura Masajes" style={s.logoImg} />
        
        <h1 style={s.title}>
          {view === "login" && "Iniciar Sesión"}
          {view === "register" && "Crear Cuenta"}
          {view === "forgot" && "Recuperar Clave"}
        </h1>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>✉️ Correo Electrónico</label>
            <input type="email" required style={s.input} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          {view !== "forgot" && (
            <div style={s.field}>
              <label style={s.label}>🔒 Contraseña</label>
              <input type="password" required minLength={6} style={s.input} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}

          {error && <div style={s.errorMsg}>{error}</div>}
          {msg && <div style={s.successMsg}>{msg}</div>}

          <button type="submit" style={s.submitBtn} disabled={loading}>
            {loading ? "Procesando..." : (
              view === "login" ? "Entrar" :
              view === "register" ? "Registrarme" : "Enviar Enlace"
            )}
          </button>
        </form>

        {view === "login" && (
          <button onClick={handleGoogleLogin} style={s.googleBtn} disabled={loading}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" style={{width: 18, height: 18}} />
            Continuar con Google
          </button>
        )}

        <div style={s.linksRow}>
          {view === "login" ? (
            <>
              <span style={s.link} onClick={() => { setView("forgot"); setError(null); setMsg(null); }}>¿Olvidé mi contraseña?</span>
              <span style={{...s.link, textDecoration: "underline"}} onClick={() => { setView("register"); setError(null); setMsg(null); }}>Registrarse</span>
            </>
          ) : (
            <span style={{...s.link, textDecoration: "underline"}} onClick={() => { setView("login"); setError(null); setMsg(null); }}>
              ← Volver a Iniciar Sesión
            </span>
          )}
        </div>
      </div>
    </div>
  );
}