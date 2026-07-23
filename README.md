#  DAOD2026 – Sistema de Gestión de Actividades y Catálogo

## Índice
- [Visión General](#visión-general)
- [Características Principales](#características-principales)
- [Arquitectura](#arquitectura)
- [Instalación & Configuración](#instalación--configuración)
- [Compilación del Frontend (Vite/Vue)](#compilación-del-frontend-vitevue)
- [Ejecución del Backend (Node/Express)](#ejecución-del-backend-nodeexpress)
- [Flujos de Trabajo Implementados](#flujos-de-trabajo-implementados)
  - [Importación Normal de Catálogo](#importación-normal-de-catálogo)
  - [Importación con Desfase (Perfil 5)](#importación-con-desfase-perfil-5)
  - [Guardado de Avance Distrital (`seguimiento.service`)](#guardado-de-avance-distrital-seguimientoservice)
- [Seguridad y Control de Acceso](#seguridad-y-control-de-acceso)
- [Pruebas y Verificación](#pruebas-y-verificación)
- [Guía de Desarrollo y Extensión](#guía-de-desarrollo-y-extensión)
- [Licencia](#licencia)

---

## Visión General

DAOD2026 es una aplicación **full‑stack** (Node + Express en el backend, Vue 3 + Vite en el frontend) que permite a distintas áreas del SISECAO gestionar **catálogos de actividades**, **periodos de trabajo** y **seguimientos a nivel distrital**.  

El proyecto está pensado para ser **modular**, **seguro** y **extensible**:
- Cada perfil de usuario tiene permisos claramente delimitados mediante `roleGuard`.
- Los procesos críticos (importación de catálogos) usan transacciones SQL y confirmaciones explícitas para evitar pérdidas de datos.
- La UI aprovecha componentes reutilizables y está diseñada con una estética premium (gradientes, micro‑animaciones, tipografía Google Fonts).

---

## Características Principales

| Feature | Descripción | Tecnologías |
|---------|-------------|-------------|
| **Importación Normal** | Carga un Excel con actividades para el periodo activo con auto-detección de cabeceras. | `catalogo.service.importarExcel` → transacción SQL |
| **Importación con Desfase** | Permite cargar un Excel asignándole un **mes/año real** arbitrario (desfase). Sólo accesible al **Perfil 5 (Administrador de Configuración)**. Contiene modal de **doble confirmación** (`CONFIRMAR`). | `catalogo.service.importarExcelDesfase`, nueva ruta `/catalogo/importar-desfase` con `roleGuard(5)` |
| **Auto-detección de Cabeceras** | Determina dinámicamente si la primera fila de un Excel contiene títulos o datos directos para evitar omitir el primer registro (`13-03-1`). | `isHeaderRow` helper en `catalogo.service.js` |
| **Resumen de Avance en Dashboard** | KPIs con donuts circulares (SI/NO Realizadas) animados con GSAP. | Vue 3, GSAP, `/reportes/resumen-captura` |
| **Alertas & Bot de Telegram** | Notificaciones en tiempo real para errores 500 y advertencias 400 (con deduplicación de 5 min). Envía reportes cada 10 min (sesiones) y cada 2 min (avance global). | `telegram.service.js`, Axios, Winston log hooks |
| **CORS Dinámico** | Permite cualquier origen de red en desarrollo (como la IP del servidor `http://145.0.40.48`), manteniendo seguridad en producción. | Express CORS resolver |
| **Sesión Única (Single Session)** | Invalida y desconecta sesiones previas cuando se inicia sesión en un dispositivo nuevo mediante UUID de sesión en BD (`sesion_id`). | `auth.service.js`, Socket.io, JWT validation |
| **Middleware Fail-Closed** | Valida el `sesion_id` contra la BD en cada petición. Si la BD falla o da timeout, la petición se bloquea preventivamente. | `auth.middleware.js` |
| **Panel de Conexiones en Vivo** | Muestra en vivo quién está "En línea" (con indicador brillante pulsante), conteo radial animado y botón de desconexión forzada. | `UsuariosView.vue`, Socket.io-client, GSAP |

---

## Arquitectura

```
root
├─ backend/                 # API Node/Express
│   ├─ src/
│   │   ├─ config/          # DB pool / conexión, logger.js (ANSI colors)
│   │   ├─ controllers/     # catalogo, usuarios (desconectar), reportes
│   │   ├─ middlewares/     # auth (Fail-Closed sesion_id), roleGuard, validate
│   │   ├─ routes/          # catalogo, usuarios (put desconectar)
│   │   ├─ services/        # catalogo, auth (session UUID), telegram.service.js
│   │   ├─ socket.js        # Módulo de WebSockets (Socket.io)
│   │   └─ utils/          # response helpers
│   └─ public/             # <-- Vite output (static SPA)
│
├─ frontend/                # Vue 3 + Vite
│   ├─ src/
│   │   ├─ components/
│   │   │   └─ catalogo/ExcelUploader.vue   # reusable uploader
│   │   ├─ stores/
│   │   │   └─ auth.store.ts   # Conexión persistente Socket.io + auto-reconexión
│   │   ├─ views/
│   │   │   ├─ ImportarView.vue   # UI con tabs + modal
│   │   │   └─ UsuariosView.vue   # Tabla con badges en vivo, radiales GSAP
│   │   ├─ router/   # rutas vue
│   │   └─ layouts/  # DashboardLayout.vue etc.
│   └─ vite.config.js    # outDir -> ../backend/public
```

---

## Instalación & Configuración

1. **Clonar el repositorio**
   ```bash
   git clone <repo-url>
   cd daod2026
   ```
2. **Instalar dependencias (ambos lados)**
   ```bash
   # backend
   cd backend
   pnpm install

   # frontend
   cd ../frontend
   pnpm install
   ```
3. **Variables de entorno**
   - Copia `.env.example` a `.env.development` y completa los datos de conexión a SQL Server y JWT secret.
4. **Base de datos**
   - Ejecuta los scripts de migración que vienen en `backend/migrations/` (no incluidos en este diff) o usa el dump provisto.
5. **Compilar el frontend** (esto generará los archivos estáticos en `backend/public` con la configuración correcta de base path y variables de entorno):
   ```bash
   cd ../frontend

   # Para compilar hacia el Servidor de Desarrollo (http://145.0.40.48/daod2026)
   pnpm run build:desarrollo

   # Para compilar hacia el Servidor de Producción (https://aplicaciones.iecm.mx/daod2026)
   pnpm run build:produccion
   ```
6. **Arrancar ambos servidores** (en modo desarrollo local)
   ```bash
   # backend
   cd ../backend
   pnpm run dev

   # frontend (para hot‑reload en dev)
   cd ../frontend
   pnpm run dev
   ```
   En producción, solo el backend sirve los archivos estáticos generados.

---

## Compilación del Frontend (Vite/Vue)

`vite.config.js` está configurado para **exportar** el bundle directamente a la carpeta `../backend/public` del proyecto:
```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: '../backend/public',   // <‑‑ destino de los assets
    emptyOutDir: true
  }
})
```
Una vez ejecutado `pnpm run build` tendrás:
- `index.html`
- `assets/` (JS, CSS, imágenes)
- Todo listo para ser servido por Express mediante `express.static`.

---

## Ejecución del Backend (Node/Express)

En `backend/src/app.js` (o `server.js`) se incluye la lógica de **fallback** para SPA:
```js
// servir archivos estáticos
app.use(express.static(publicPath))

// fallback para Vue Router (history mode)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(publicPath, 'index.html'))
  }
  next()
})
```
Esto permite que cualquier ruta del cliente (por ejemplo `/dashboard`) sea atendida por `index.html` y luego manejada por Vue Router.

---

## Flujos de Trabajo Implementados

### Importación Normal de Catálogo
1. El usuario arrastra o selecciona un archivo Excel.
2. `ExcelUploader` valida extensión (`.xls/.xlsx`) y tamaño (< 5 MB).
3. Se envía a `POST /api/v1/catalogo/importar`.
4. `catalogo.service.importarExcel`:
   - Lee el workbook con **SheetJS**.
   - Limpia datos activos (`status = 0`).
   - Inserta cada fila dentro de una **transacción**.
   - Devuelve el número de registros insertados.
5. El UI muestra un *toast* de éxito.

### Importación con Desfase (Perfil 5)
1. Sólo usuarios con `perfil = 5` ven la pestaña **Importación con Desfase**.
2. Se seleccionan **Mes Real** y **Año Real** y luego el Excel.
3. Al hacer clic en **Importar con Desfase**, aparece un **modal de doble confirmación** que requiere escribir exactamente `CONFIRMAR`.
4. Cuando el texto coincide, el botón se habilita y al pulsarlo se llama a `POST /api/v1/catalogo/importar-desfase`.
5. En el backend (`catalogo.service.importarExcelDesfase`):
   - Recibe `mesReal` y `anoReal` como parámetros y los valida.
   - Usa esos valores en cada `INSERT` (en vez del periodo activo).
   - Ejecuta la misma lógica de limpieza y transacción que la importación normal.
6. Si un perfil distinto a 5 intenta la ruta, el middleware `roleGuard(5)` devuelve **403 Forbidden**.

### Guardado de Avance Distrital (`seguimiento.service.save`)
- Antes: el mes y año se obtenían de `sisecao_settings` (periodo activo).
- Ahora: la información se extrae **directamente** del registro de `sisecao_catactividad` que se está guardando, garantizando que el histórico sea fiel al periodo real de la actividad.
- Esto evita inconsistencias cuando se usan desfases.

### Auto-detección de Cabeceras en Excel
- Al cargar el archivo Excel, el sistema analiza la primera fila (`data[0]`) a través de la función `isHeaderRow`.
- Si detecta palabras clave (ej. *clave*, *folio*, *id*) o la fila no tiene números, la omite considerándola una cabecera de títulos e inicia la importación en la fila 2 (`index 1`).
- Si detecta que contiene datos directos (ej. `13-03-1`), arranca la importación inmediatamente en la fila 1 (`index 0`). Esto evita omitir datos válidos.

### Alertas y Reportes en Tiempo Real (Telegram)
- **Logger centralizado:** Winstom categoriza e imprime en consola con colores ANSI (`SESSION`=verde, `ACTION`=azul, `QUERY`=celeste, `WARN`=amarillo, `ERROR`=rojo, `SYSTEM`=púrpura).
- **Alertas inmediatas:** Errores 500 y advertencias de cliente 400 se envían inmediatamente al bot de Telegram. Los errores 500 cuentan con un mapa de deduplicación de 5 minutos en memoria.
- **Reportes periódicos:**
  - **Resumen de Sesiones:** Cada 10 minutos exactos del reloj del sistema (xx:00, xx:10, etc.) el bot envía una lista detallada de los usuarios que iniciaron y cerraron sesión.
  - **Avance Global:** Cada 2 minutos se consulta a la BD y se envía un reporte del porcentaje consolidado de avance, metas totales y capturas.

### Sesión Única y WebSockets (Socket.io)
- **Inicio de sesión único:** Al iniciar sesión, se genera un identificador UUIDv4 (`sesion_id`) que se almacena en la tabla de usuarios y se firma dentro del token JWT.
- **Expulsión en caliente:** Si el usuario tiene una sesión conectada en otro dispositivo, Socket.io le emite `sesion:invalidada` cerrando la sesión previa e invalidando su token.
- **Middleware Fail-Closed:** Cada petición HTTP autenticada compara el `sesion_id` del token JWT contra el de la base de datos. Si la consulta a la BD falla por cualquier motivo (caída, timeout de pool), la petición se bloquea con error 500.
- **Panel de Monitoreo:** En el módulo de usuarios, los administradores ven en tiempo real quién está en línea (con indicador pulsante/brillante). Cuenta con gráficos radiales de resumen animados por GSAP y botón para forzar la desconexión desde el backend.

---

## Seguridad y Control de Acceso

| Middleware | Función |
|------------|----------|
| `authMiddleware` | Verifica JWT y añade `req.user`.
| `roleGuard(...roles)` | Bloquea rutas a usuarios que no tengan uno de los `roles` especificados.
| `validateMiddleware` | Centraliza `express‑validator` y devuelve errores 400 con formato estándar.
| `errorHandler` (global) | Captura excepciones, respeta la propiedad `status` y oculta stack en producción.

**Importante**: La ruta `POST /catalogo/importar-desfase` está **solo** protegida por `roleGuard(5)`. Si se llama directamente sin JWT válido, el servidor responde `401`; con JWT válido pero rol ≠ 5, responde `403`.

---

## Pruebas y Verificación

1. **Unitarias** (Jest/Mocha) – *no incluidas en este diff* pero el proyecto tiene una carpeta `tests/` preparada.
2. **Pruebas Manuales** (documentadas en `walkthrough.md`):
   - Login como `superadmin` (perfil 5) → verifica pestaña *Desfase* y modal.
   - Login como `admin` (perfil 1) → la pestaña está oculta y el endpoint devuelve 403.
   - Importación normal y con desfase → comprobar que el número de rows insertados coincide.
3. **Verificación Automática** (6 puntos automatizados + 4 visuales) – se ejecutó al terminar el desarrollo y está registrado en `walkthrough.md`.

---

## Guía de Desarrollo y Extensión

- **Añadir nuevos endpoints**: crear controlador, servicio y registrar la ruta con `roleGuard` según el nivel de acceso.
- **Reutilizar `ExcelUploader`**: basta con importarlo y usar el evento `@upload="myHandler"`.
- **Cambiar el design system**: los estilos están basados en clases utilitarias dentro de `src/assets/css` (colores, tipografía `Inter`).  Modificar allí para impactar toda la UI.
- **Despliegue**: en producción copiar solo `backend/` (incluido `public/`) y ejecutar `pnpm start` tras `pnpm run build` del frontend.

---

## Vistas por Usuario

Este proyecto muestra claramente la **diferenciación de vistas y permisos** entre los distintos perfiles de usuario:

- **Administrador Central (perfil 1)**: Acceso completo a todos los módulos (importación de catálogo, configuración de periodos, reporte consolidado de los 33 distritos, creación/edición de actividades). Visualiza la gráfica de avance 3D y los filtros de año/distrito.
- **Capturista Distrital (perfil 3)**: Vista restringida al distrito asignado. No ve la gráfica global ni los filtros de selección. Sólo dispone de los módulos de **Actividades a Desarrollar**, **Seguimiento de Actividades** y **Reportes del propio distrito**.
- **Administrador de Configuración (perfil 5)**: Además de los permisos del Administrador, cuenta con la pestaña **Importación con Desfase** y el modal de doble confirmación para cargar catálogos de un periodo arbitrario.

La tabla resumida de accesos está disponible en el documento [vistas_por_usuario.md](file:///c:/xampp/htdocs/2026/daod2026/vistas_por_usuario.md) y se refleja en la UI mediante los guards de rutas y la lógica de `roleGuard`.

---

## Licencia

Este proyecto está bajo la **Licencia MIT**. Consulte el archivo `LICENSE` para más detalles.

---

*Generado por Bruno Corona Ing. especializado en desarrollo de aplicaciones web.*
