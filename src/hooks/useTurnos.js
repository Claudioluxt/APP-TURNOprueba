import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const MAX_TURNOS_POR_DIA = 7;
export const DIAS_LABORABLES = [1, 2, 3, 4, 5];
export const DIAS_NOMBRES = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

export const SERVICES = [
  "Masaje Intensivo",
  "Ritual Aura",
  "Craneofacial",
  "Descontracturante Cuerpo Completo",
  "Aura Integral",
  "Masaje Deportivo",
];

export const SERVICE_INFO = {
  "Masaje Intensivo":                  { duracion: 120,   precio: 30000 },
  "Ritual Aura":                       { duracion: 120,  precio: 47000 },
  "Craneofacial":                      { duracion: 120,   precio: 29000 },
  "Descontracturante Cuerpo Completo": { duracion: 120,   precio: 33000 },
  "Aura Integral":                     { duracion: 120,   precio: 35000 },
  "Masaje Deportivo":                  { duracion: 120,  precio: 37000 },
};

export const DURATIONS = [ 90, 120];

export const formatTime  = (d) => d.toLocaleTimeString("es-AR", { hour:"2-digit", minute:"2-digit" });
export const formatDate  = (d) => d.toLocaleDateString("es-AR", { weekday:"short", day:"2-digit", month:"short" });
export const formatPrecio = (p) => "$" + p.toLocaleString("es-AR");
export const isSameDay   = (a, b) => a.toDateString() === b.toDateString();
export const isToday     = (d) => isSameDay(d, new Date());

export const rowToAppt = (row) => ({
  id: row.id, name: row.name, email: row.email, phone: row.phone,
  service: row.service, duration: row.duration, status: row.status,
  date: new Date(row.date),
});

export const turnosSeSuperponen = (fA, dA, fB, dB) => {
  const iA = fA.getTime(), eA = iA + dA * 60000;
  const iB = fB.getTime(), eB = iB + dB * 60000;
  return iA < eB && eA > iB;
};

export function useTurnos(user) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [dbError, setDbError]           = useState(null);

  const fetch = async () => {
    if (!user) {
      setAppointments([]);
      setLoading(false);
      return [];
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("turnos").select("*").order("date", { ascending: true });
    
    if (error) { 
      setDbError(error.message); 
      setLoading(false);
      return []; 
    }
    
    const mapeados = data.map(rowToAppt);
    setAppointments(mapeados);
    setLoading(false);
    return mapeados; 
  };

  useEffect(() => { fetch(); }, [user]);

  const validateBusiness = (dateObj, duration, excludeId = null, turnosFrescos) => {
    if (!DIAS_LABORABLES.includes(dateObj.getDay()))
      return `No se trabaja los ${DIAS_NOMBRES[dateObj.getDay()]}. Solo lunes a viernes.`;
    
    const delDia = turnosFrescos.filter(a =>
      isSameDay(a.date, dateObj) && a.status !== "cancelado" && a.id !== excludeId);
    
    if (delDia.length >= MAX_TURNOS_POR_DIA)
      return `El ${formatDate(dateObj)} ya tiene ${MAX_TURNOS_POR_DIA} turnos (máximo).`;
    
    const conflicto = turnosFrescos.find(a =>
      a.id !== excludeId && a.status !== "cancelado" &&
      isSameDay(a.date, dateObj) &&
      turnosSeSuperponen(dateObj, duration, a.date, a.duration));
      
    if (conflicto)
      return `Conflicto con ${conflicto.name} a las ${formatTime(conflicto.date)} (${conflicto.duration} min).`;
    return null;
  };

  const save = async (form, selectedId = null) => {
    const dateObj = new Date(`${form.date}T${form.time}`);
    
    const turnosFrescos = await fetch();
    const biz = validateBusiness(dateObj, form.duration, selectedId, turnosFrescos);
    
    if (biz) return { error: biz };
    
    const payload = {
      name: form.name, email: form.email, phone: form.phone,
      service: form.service, duration: form.duration,
      status: form.status, date: dateObj.toISOString(),
    };
    if (selectedId) {
      const { error } = await supabase.from("turnos").update(payload).eq("id", selectedId);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from("turnos").insert([payload]);
      if (error) return { error: error.message };
    }
    await fetch();
    return { error: null };
  };

  const remove = async (id) => {
    const { error } = await supabase.from("turnos").delete().eq("id", id);
    if (error) return error.message;
    setAppointments(prev => prev.filter(a => a.id !== id));
    return null;
  };

  const updateDuration = async (id, dur) => {
    const appt = appointments.find(a => a.id === id);
    
    const turnosFrescos = await fetch();
    const biz = validateBusiness(appt.date, dur, id, turnosFrescos);
    
    if (biz) return biz;
    const { error } = await supabase.from("turnos").update({ duration: dur }).eq("id", id);
    if (error) return error.message;
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, duration: dur } : a));
    return null;
  };

  const clearAll = async () => {
    const { error } = await supabase.from("turnos")
      .delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) return error.message;
    setAppointments([]);
    return null;
  };

  return { appointments, loading, dbError, setDbError, fetch, save, remove, updateDuration, clearAll };
}