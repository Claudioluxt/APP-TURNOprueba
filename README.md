# ✦ AURA MASAJES — Sistema de Turnos

Aplicación web para gestión de turnos de sala de masajes, construida con React + Vite y base de datos Supabase.

---

## 🚀 Cómo correr el proyecto en local

### 1. Requisitos previos
- [Node.js](https://nodejs.org) instalado (versión LTS)
- Cuenta en [Supabase](https://supabase.com) con el proyecto configurado

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Supabase
Abrí `src/App.jsx` y reemplazá las credenciales al inicio del archivo:
```js
const SUPABASE_URL = "https://TU_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "TU_PUBLISHABLE_KEY";
```
Encontrás estos valores en Supabase → **Settings → API Keys → Publishable key**.

### 4. Iniciar la app
```bash
npm run dev
```
Abrí el navegador en **http://localhost:5173**

### 5. Detener la app
```
Ctrl + C  →  Y  →  Enter
```

---

## 🗄️ Base de datos — Script SQL

Si necesitás crear la tabla desde cero, ejecutá esto en **Supabase → SQL Editor**:

```sql
create table turnos (
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
create policy "Allow all" on turnos for all using (true);
```

---

## 📦 Subir cambios a GitHub

```bash
git add .
git commit -m "descripción del cambio"
git push
```

Si GitHub rechaza el push (error de rebase o conflicto):
```bash
git push --force
```

---

## 🌐 Desplegar en Netlify

### Primera vez
1. Entrá a [netlify.com](https://netlify.com)
2. **Add new site → Import from Git → GitHub**
3. Seleccioná el repositorio `APP-TURNO`
4. Configurá:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click en **Deploy**

### Actualizaciones
Cada `git push` actualiza Netlify automáticamente en 1-2 minutos.

### Build manual
```bash
npm run build
```
Genera la carpeta `dist/` lista para subir.

---

## ⚠️ Solución de errores comunes

### Error: `createClient has already been declared`
El import de Supabase está duplicado en `App.jsx`. Dejá solo esta línea al inicio:
```js
import { createClient } from "@supabase/supabase-js";
```

### Error: `PARSE_ERROR` o tokens inesperados
El archivo `App.jsx` quedó corrupto por un rebase. Solución:
```bash
git rebase --abort
git add .
git commit -m "fix App.jsx"
git push --force
```

### Error: `rejected - fetch first`
GitHub tiene cambios que no tenés localmente:
```bash
git pull --rebase origin main
git push
```
Si falla, usá `git push --force`.

### Error: `Authentication failed`
Usá un **Personal Access Token** en lugar de tu contraseña:
- GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic)
- Marcá el permiso `repo`
- Usá el token como contraseña al hacer `git push`

---

## 📋 Reglas de negocio configuradas

| Configuración | Valor |
|---|---|
| Turnos máximos por día | 8 |
| Días laborables | Lunes a viernes |
| Camillas simultáneas | 1 |

Para modificar estos valores, editá las constantes al inicio de `src/App.jsx`:
```js
const MAX_TURNOS_POR_DIA = 8;
const DIAS_LABORABLES = [1, 2, 3, 4, 5]; // 1=lun, 5=vie
```

---

## 💆 Servicios disponibles

| Servicio | Duración | Precio |
|---|---|---|
| Masaje Intensivo | 45 min | $30.000 |
| Ritual Aura | 120 min | $47.000 |
| Craneofacial | 45 min | $29.000 |
| Descontracturante Cuerpo Completo | 60 min | $33.000 |
| Aura Integral | 60 min | $35.000 |
| Masaje Deportivo | 70 min | $37.000 |

Para agregar o modificar servicios, editá el objeto `SERVICES` y `SERVICE_INFO` en `src/App.jsx`.

---

## 📁 Estructura del proyecto

```
serenitas/
├── src/
│   └── App.jsx          ← Toda la aplicación
├── index.html           ← Título de la pestaña del browser
├── package.json         ← Dependencias
└── vite.config.js       ← Configuración de Vite
```
