import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = 'https://pbldtsvgnqalkjkwukpz.supabase.co'
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBibGR0c3ZnbnFhbGtqa3d1a3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0ODEyMTEsImV4cCI6MjA5NzA1NzIxMX0.hUyZz6bOuJ2g1JOOkEYMKusPKd7HllFGfL4DtyCzufI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isConfigured =
  !SUPABASE_URL.includes("TU_PROJECT_ID") &&
  !SUPABASE_ANON_KEY.includes("TU_PUBLISHABLE_KEY");

/// ─── CONFIGURACIÓN DE TRES ROLES ────────────────
export const ADMIN_EMAILS = [
  "luxengabriel@gmail.com",
];

export const RECEPCIONISTA_EMAILS = [
  "Jimenaleguizamon91@gmail.com", 
];

export const getRol = (email) => {
  const mail = email?.toLowerCase();
  if (ADMIN_EMAILS.includes(mail)) return "admin";
  if (RECEPCIONISTA_EMAILS.includes(mail)) return "recepcionista";
  return "cliente";
};
