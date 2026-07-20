import { useState, useEffect } from "react";
import { supabase, getRol } from "../lib/supabase";

// 1. Importamos los íconos y la nueva imagen de fondo
import wpIcon from "../assets/whatsapp.png";
import igIcon from "../assets/instagram.png";
import headerBg from "../assets/login.jpg";

const s = {
  // 2. Aplicamos la imagen como fondo (cover y centrada)
  header: { 
    backgroundImage: `url(${headerBg})`, 
    backgroundSize: "cover", 
    backgroundPosition: "center",
    boxShadow: "0 4px 24px rgba(26,37,29,0.5)", 
    position: "relative", 
    zIndex: 10 
  },
  
  // Agregamos un pequeño overlay oscuro interno para que los textos dorados sigan siendo legibles sobre la imagen
  inner: { maxWidth:900, margin:"0 auto", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", background: "rgba(26,37,29,0.3)", borderRadius: 12, backdropFilter: "blur(2px)" },
  
  logoImg: { width: 50, height: 50, borderRadius: "50%", border: "2px solid #d4af37", objectFit: "cover", background: "#1a251d", flexShrink: 0 },
  logoSub: { color:"#d4af37", fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", marginTop:1, opacity: 0.9 },
  socialBtn: { background: "rgba(212,175,55,0.15)", color: "#d4af37", padding: "4px 10px", borderRadius: 12, fontSize: 11, textDecoration: "none", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, whiteSpace: "nowrap" },

  rolBadge: { borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700, letterSpacing:"0.06em", display: "inline-block", marginTop: 4 },
  userName: { color:"#d4af37", fontSize:13, fontWeight:600 },
  avatar: { width:36, height:36, borderRadius:"50%", border:"2px solid #d4af37", objectFit:"cover", flexShrink: 0 },
  avatarFallback: { width:36, height:36, borderRadius:"50%", border:"2px solid #d4af37", background:"#d4af37", display:"flex", alignItems:"center", justifyContent:"center", color:"#1a251d", fontWeight:700, fontSize:14, flexShrink: 0 },
  
  logoutBtn: { background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:8, padding:"9px 14px", color:"#d4af37", fontSize:13, fontFamily:"inherit", cursor:"pointer", fontWeight:600, textAlign: "center" },
  newBtn: { background:"linear-gradient(135deg, #d4af37, #b5952f)", color:"#1a251d", border:"none", borderRadius:8, padding:"9px 16px", fontSize:13, fontFamily:"inherit", cursor:"pointer", display:"flex", alignItems:"center", justifyContent: "center", gap:6, fontWeight:700, boxShadow:"0 2px 12px rgba(212,175,55,0.25)" },
};

export default function Header({ user, onNuevoTurno }) {
  const rol = getRol(user?.email);
  const nombre = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";
  const avatar = user?.user_metadata?.avatar_url;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 650);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 650);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  let badgeBg = "rgba(168,230,184,0.15)";
  let badgeColor = "#a8e6b8";
  let rolText = "📋 Recepcionista";

  if (rol === "admin") {
    badgeBg = "rgba(212,175,55,0.2)";
    badgeColor = "#d4af37";
    rolText = "👑 Admin";
  } else if (rol === "cliente") {
    badgeBg = "rgba(255,255,255,0.15)";
    badgeColor = "#fff";
    rolText = "👤 Cliente";
  }

  return (
    <header style={s.header}>
      {/* Envolvimos el contenido en inner para darle un fondo semitransparente (overlay) y que no se pierda contra la imagen */}
      <div style={{ padding: "10px" }}>
        <div style={{ ...s.inner, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 18 : 0 }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 14, width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "center" : "flex-start" }}>
            <img src="/logo.png" alt="Aura Masajes" style={s.logoImg} onError={(e) => e.target.style.display = 'none'} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "center" : "flex-start" }}>
              <div style={{ color:"#d4af37", fontWeight:700, letterSpacing:"0.18em", fontFamily:"'Palatino Linotype',Georgia,serif", fontSize: isMobile ? 20 : 24 }}>
                AURA MASAJES
              </div>
              <div style={s.logoSub}>Sistema de Turnos</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
                
                <a href="https://wa.me/5493482536380" target="_blank" rel="noreferrer" style={s.socialBtn}>
                  <img src={wpIcon} alt="WhatsApp" style={{ width: 14, height: 14 }} /> WhatsApp
                </a>
                
                <a href="https://www.instagram.com/auramasajes.ctes" target="_blank" rel="noreferrer" style={s.socialBtn}>
                  <img src={igIcon} alt="Instagram" style={{ width: 14, height: 14 }} /> Instagram
                </a>
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: isMobile ? "100%" : "auto", alignItems: isMobile ? "stretch" : "flex-end" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: isMobile ? "center" : "flex-end" }}>
              <div style={{ textAlign: "right" }}>
                <div style={s.userName}>{nombre}</div>
                <div style={{ ...s.rolBadge, background: badgeBg, color: badgeColor }}>{rolText}</div>
              </div>
              {avatar ? <img src={avatar} alt={nombre} style={s.avatar} /> : <div style={s.avatarFallback}>{nombre[0].toUpperCase()}</div>}
            </div>
            
            <div style={{ display: "flex", gap: 8, flexDirection: isMobile ? "column" : "row" }}>
              <button style={s.newBtn} onClick={onNuevoTurno}>
                <span style={{fontSize:15}}>+</span> {rol === "cliente" ? "Reservar Turno" : "Nuevo Turno"}
              </button>
              <button style={s.logoutBtn} onClick={handleLogout}>Salir</button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}