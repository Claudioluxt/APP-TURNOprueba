import { supabase, getRol } from "../lib/supabase";

const s = {
  header: { background:"linear-gradient(135deg,#3d2b1f 0%,#6b4226 100%)", boxShadow:"0 4px 24px rgba(61,43,31,0.25)", position:"relative", zIndex:10 },
  inner: { maxWidth:900, margin:"0 auto", padding:"16px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" },
  logo: { color:"#f0d9b5", fontSize:24, fontWeight:700, letterSpacing:"0.18em", fontFamily:"'Palatino Linotype',Georgia,serif" },
  logoSub: { color:"#b89060", fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", marginTop:1 },
  right: { display:"flex", alignItems:"center", gap:10 },
  rolBadge: { borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700, letterSpacing:"0.06em" },
  userInfo: { textAlign:"right" },
  userName: { color:"#f0d9b5", fontSize:13, fontWeight:600 },
  userEmail: { color:"#b89060", fontSize:11, marginTop:1 },
  avatar: { width:34, height:34, borderRadius:"50%", border:"2px solid #c8873a", objectFit:"cover" },
  avatarFallback: { width:34, height:34, borderRadius:"50%", border:"2px solid #c8873a", background:"#c8873a", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:14 },
  logoutBtn: { background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:8, padding:"7px 14px", color:"#f0d9b5", fontSize:12, fontFamily:"inherit", cursor:"pointer", fontWeight:600 },
  newBtn: { background:"linear-gradient(135deg,#c8873a,#a0622a)", color:"#fff9f0", border:"none", borderRadius:8, padding:"10px 18px", fontSize:13, fontFamily:"inherit", cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontWeight:600, boxShadow:"0 2px 12px rgba(168,90,36,0.35)" },
};

export default function Header({ user, onNuevoTurno }) {
  const rol = getRol(user?.email);
  const nombre = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";
  const avatar = user?.user_metadata?.avatar_url;

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Definir color y texto de la etiqueta según el rol
  let badgeStyle = { background: "rgba(200,200,200,0.15)", color: "#a0a0a0" };
  let rolText = "👤 Cliente";

  if (rol === "admin") {
    badgeStyle = { background: "rgba(200,135,58,0.25)", color: "#f0d9b5" };
    rolText = "👑 Admin";
  } else if (rol === "recepcionista") {
    badgeStyle = { background: "rgba(168,230,184,0.15)", color: "#a8e6b8" };
    rolText = "📋 Recepcionista";
  }

  return (
    <header style={s.header}>
      <div style={s.inner}>
        <div>
          <div style={s.logo}>✦ AURA MASAJES</div>
          <div style={s.logoSub}>Sistema de Turnos</div>
        </div>
        <div style={s.right}>
          <div style={s.userInfo}>
            <div style={s.userName}>{nombre}</div>
            <div style={s.userEmail}>
              <span style={{ ...s.rolBadge, ...badgeStyle }}>{rolText}</span>
            </div>
          </div>
          {avatar
            ? <img src={avatar} alt={nombre} style={s.avatar} />
            : <div style={s.avatarFallback}>{nombre[0].toUpperCase()}</div>
          }
          
          {/* Ocultamos el botón de nuevo turno administrativo si es cliente */}
          {rol !== "cliente" && (
            <button style={s.newBtn} onClick={onNuevoTurno}>
              <span style={{fontSize:16}}>+</span> Nuevo Turno
            </button>
          )}

          <button style={s.logoutBtn} onClick={handleLogout}>Salir</button>
        </div>
      </div>
    </header>
  );
}