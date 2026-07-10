# Comparativa de Vistas y Accesos por Usuario: SISECAOD (Legacy PHP)

Este documento contiene el desglose visual e institucional del comportamiento de la interfaz y los módulos disponibles en el sistema legacy de PHP (`http://localhost/2026/se_daod_V2/login.php`) al iniciar sesión con las cuentas proporcionadas de Administrador (`admin`) y Capturista Distrital (`dist3_2`).

---

## 1. Administrador Central (`admin` / `12345`)

Al ingresar con el perfil de Administrador, el sistema despliega la totalidad de los paneles operativos y de reportería consolidada.

### A. Elementos Visuales del Encabezado e Interfaz
* **Identificación del Usuario:** En la esquina superior derecha del header se muestra el texto `administrador`.
* **Selectores de Filtros (Dashboard):** 
  * Un dropdown interactivo para filtrar el **año fiscal**.
  * Un dropdown interactivo para seleccionar el **distrito a consultar** (todos los distritos del 1 al 33 o vista general).
* **Gráfica de Avance:** Se renderiza una gráfica interactiva en 3D (desarrollada con Highcharts) bajo el título **"Actividades completadas"**, que grafica el porcentaje acumulado de avance físico por cada uno de los 33 distritos.

### B. Módulos Operativos (Tarjetas de Acceso)
El dashboard del administrador presenta cuatro tarjetas rectangulares principales:
1. **IMPORTAR CATÁLOGO DE ACT. / MÓDULO SETTINGS:** 
   * Permite configurar el calendario de captura.
   * Cuenta con formularios para delimitar el mes a reportar, definir las fechas de apertura (`fecha_inicio`) y de cierre (`fecha_fin`), y forzar el estado del sistema.
2. **ACTIVIDADES A DESARROLLAR EN EL MES QUE SE REPORTA:** 
   * Muestra la tabla de las metas vigentes.
   * Permite al administrador crear **"Actividades Adicionales"** manualmente y modificar las fechas/plazos de cada actividad.
3. **SEGUIMIENTO DE ACTIVIDADES:** 
   * Despliega la tabla maestra de cumplimiento de todos los distritos.
   * Muestra de forma inmediata si cada tarea fue capturada, omitida o completada.
4. **REPORTES:**
   * Redirección a la consola de descargas.

### C. Menú de Reportes Disponibles
El administrador tiene acceso exclusivo a los reportes consolidados y estadísticas globales:
* **Reporte de los 33 órganos desconcentrados:** Exportación completa de la matriz de cumplimientos de todos los distritos.
* **Reporte Actividades pendientes por capturar:** Listado de actividades del catálogo que aún no han sido registradas por algún distrito.
* **Número de actividades realizadas por distrito:** Conteo simple por distrito.
* **Actividades realizadas:** Filtro global de actividades con estatus positivo ("SI").
* **Reporte Trimestral:** Consolidado estructurado por bloques de 3 meses.
* **Reporte de Actividades Históricas (Años anteriores):** Consulta de base de datos de ejercicios previos.

---

## 2. Capturista del Distrito 3 (`dist3_2` / `67890`)

Al iniciar sesión con esta cuenta, el sistema asume de forma automática el distrito `3` y limita severamente las consultas del usuario, removiendo selectores de filtros y resguardando la información de otros distritos.

### A. Elementos Visuales del Encabezado e Interfaz
* **Identificación del Usuario:** En la esquina superior derecha del header se muestra el texto `distrito 3 captura`.
* **Restricción de Privacidad:** No se muestra la gráfica 3D de avance de los 33 distritos ni los dropdowns de selección de año o distrito (el usuario se encuentra bloqueado a su distrito de captura).

### B. Módulos Operativos (Tarjetas de Acceso)
El capturista visualiza únicamente tres tarjetas en su panel (el módulo de importación y settings queda oculto):
1. **ACTIVIDADES A DESARROLLAR EN EL MES QUE SE REPORTA:**
   * La tabla inicia vacía.
   * Requiere que el usuario elija un responsable específico de la lista (`Selecciona un responsable`).
   * Al seleccionar, se listan sus actividades del distrito y habilita la visualización de soportes y la impresión de fichas de cumplimiento.
2. **SEGUIMIENTO DE ACTIVIDADES:**
   * **Área de captura real:** Permite registrar si el distrito realizó o no cada actividad mensual del catálogo.
   * Si se selecciona **"SI"**: Se deben registrar campos obligatorios (tipo de documento, folio del oficio y fecha de entrega).
   * Si se selecciona **"NO"**: Se deshabilita el soporte documental y se le obliga a escribir una justificación exhaustiva de incumplimiento en el campo de observaciones.
3. **REPORTES:**
   * Acceso directo para descargar los cortes de su distrito.

### C. Menú de Reportes Disponibles (Acotados al Distrito 3)
El capturista solo puede exportar archivos correspondientes al ID de su distrito (Distrito 3):
* **Reporte Mensual de Actividades a Capturar:** Formato de guía para conocer lo pendiente.
* **Reporte Mensual de Actividades Desarrolladas:** Acuse con firmas de lo completado en el mes.
* **Reporte Actividades pendientes por capturar:** Listado interno de metas pendientes.
* **Reporte de Avance:** Resumen estadístico simple.
* **Reporte Histórico por Mes:** Consolidado mensual acumulado de su distrito.

---

## 3. Resumen de Diferencias de Acceso (Matriz de Vistas)

| Módulo / Vista | Administrador (`admin`) | Capturista (`dist3_2`) | Tipo de Restricción |
| :--- | :---: | :---: | :--- |
| **Gráfica de Avance 3D** | ✅ Visible | ❌ Oculto | Interfaz y Privacidad |
| **Selectores de Año y Distrito** | ✅ Visible | ❌ Oculto | Interfaz y Privacidad |
| **Módulo de Settings / Fechas de Captura** | ✅ CRUD | ❌ Oculto | Seguridad de Fechas |
| **Creación de Actividades Adicionales** | ✅ Permitido | ❌ Oculto | Privilegio de Catálogo |
| **Selección de Responsables de Área** | ✅ Opcional | ⚠️ Obligatorio en catálogo | Flujo de Trabajo |
| **Captura de Avances (SI/NO)** | ✅ Permitido | ⚠️ Permitido (Solo Distrito 3 y periodo abierto) | Regla de Negocio Temporal |
| **Reporte Consolidado (33 Órganos)** | ✅ Permitido | ❌ Oculto | Privacidad |
| **Descarga de Reporte del Distrito** | ✅ De cualquier Distrito | ⚠️ Solo de Distrito 3 | Privacidad por SQL Join |
