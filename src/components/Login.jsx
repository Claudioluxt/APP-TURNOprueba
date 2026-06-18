import { supabase } from "../lib/supabase";

const s = {
  root: { minHeight:"100vh", background:"linear-gradient(160deg,#2a1a0e 0%,#6b4226 60%,#3d2b1f 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Palatino Linotype',Georgia,serif" },
  card: { background:"rgba(255,252,245,0.97)", borderRadius:20, padding:"48px 40px", maxWidth:400, width:"90%", textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.35)" },
  logo: { fontSize:32, fontWeight:700, color:"#3d2b1f", letterSpacing:"0.15em", marginBottom:4 },
  sub: { fontSize:12, color:"#b89060", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:32 },
  title: { fontSize:20, color:"#2a1a0e", fontWeight:600, marginBottom:8 },
  desc: { fontSize:14, color:"#8a6a44", lineHeight:1.6, marginBottom:32 },
  btn: {
    display:"flex", alignItems:"center", justifyContent:"center", gap:12,
    background:"#fff", border:"1.5px solid #e0c8a8", borderRadius:10,
    padding:"14px 24px", fontSize:15, fontFamily:"inherit", cursor:"pointer",
    color:"#2a1a0e", fontWeight:600, width:"100%",
    boxShadow:"0 2px 8px rgba(0,0,0,0.08)", transition:"all 0.2s",
  },
  googleIcon: { width:20, height:20 },
  footer: { marginTop:24, fontSize:11, color:"#b0a090" },
};

const GoogleIcon = () => (
  <svg style={s.googleIcon} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function Login() {
  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  return (
    <div style={s.root}>
      <div style={s.card}>
        <div style={s.logo}>✦ AURA MASAJES</div>
        <div style={s.sub}>Sistema de Turnos</div>
        <div style={s.title}>Bienvenido/a 💆</div>
        <div style={s.desc}>Iniciá sesión para acceder al panel de gestión de turnos.</div>
        <button style={s.btn} onClick={handleGoogle}>
          <GoogleIcon />
          Continuar con Google
        </button>
        <div style={s.footer}>Solo personal autorizado de Aura Masajes</div>
      </div>
    </div>
  );
}
