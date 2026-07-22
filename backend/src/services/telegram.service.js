const axios = require('axios');

const AMBIENTE_EMOJI = {
  local: '💻',
  development: '🧪',
  production: '🚨'
};

// Listas en memoria para registrar qué usuarios iniciaron o cerraron sesión
let loginUsers = [];
let logoutUsers = [];

// Map en memoria para deduplicar alertas de errores (5 minutos)
const recentErrors = new Map();

function registrarEvento(tipo, mensaje) {
  if (tipo === 'sesiones' && mensaje) {
    if (mensaje.includes('🟢 LOGIN')) {
      const part = mensaje.split('LOGIN  ➜  ')[1] || mensaje.split('LOGIN ➜ ')[1] || mensaje;
      loginUsers.push(part.trim());
    } else if (mensaje.includes('🔴 LOGOUT')) {
      const part = mensaje.split('LOGOUT ➜  ')[1] || mensaje.split('LOGOUT ➜ ')[1] || mensaje;
      logoutUsers.push(part.trim());
    }
  }
}

async function enviarResumenSesiones() {
  const total = loginUsers.length + logoutUsers.length;
  if (total === 0) return; // no mandar si no hubo actividad de sesiones

  const ambiente = process.env.NODE_ENV || 'desconocido';
  const emoji = AMBIENTE_EMOJI[ambiente] || '⚙️';
  
  const now = new Date();
  const start = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutos
  const formatTime = (d) => d.toTimeString().split(' ')[0].slice(0, 8); // HH:mm:ss
  const rangeStr = `${formatTime(start)} - ${formatTime(now)}`;

  const listLogins = loginUsers.length > 0
    ? '\n' + loginUsers.map(u => `  • ${u}`).join('\n')
    : ' Ninguno';
    
  const listLogouts = logoutUsers.length > 0
    ? '\n' + logoutUsers.map(u => `  • ${u}`).join('\n')
    : ' Ninguno';

  const mensaje = `${emoji} *[${ambiente.toUpperCase()}]*\n` +
    `📊 *Resumen de Sesiones - SISECAOD*\n` +
    `🕐 Periodo (10 min): ${rangeStr}\n\n` +
    `🟢 Sesiones iniciadas: ${loginUsers.length}${listLogins}\n` +
    `🔴 Sesiones cerradas: ${listLogouts}`;

  try {
    await enviarMensajeTelegram(mensaje);
    // Vaciar listas
    loginUsers = [];
    logoutUsers = [];
  } catch (err) {
    console.error('Error enviando resumen de sesiones a Telegram:', err.message);
  }
}

// Lógica de programación exacta para el resumen de 10 minutos (xx:00:00, xx:10:00, xx:20:00, etc.)
function iniciarProgramadorSesiones() {
  const now = new Date();
  const ms = now.getMilliseconds();
  const s = now.getSeconds();
  const m = now.getMinutes();

  // Calcular los minutos restantes para la siguiente decena exacta
  const next10Min = Math.ceil((m + 0.1) / 10) * 10;
  const diffMinutes = next10Min - m;
  const delayMs = (diffMinutes * 60 * 1000) - (s * 1000) - ms;

  setTimeout(() => {
    enviarResumenSesiones();
    setInterval(enviarResumenSesiones, 10 * 60 * 1000);
  }, delayMs);
}

iniciarProgramadorSesiones();

// Reporte de avance global cada 2 minutos
async function enviarAvanceGlobal() {
  try {
    const { settingsService } = require('./settings.service');
    const { reportesService } = require('./reportes.service');

    const activePeriod = await settingsService.getPeriodoActivo();
    const anio = activePeriod?.anio || new Date().getFullYear();
    const json = await reportesService.getAvanceGrafica({ anio, distrito: 'todos', perfil: null, clave: null });
    
    let total = 0;
    let capturadas = 0;
    for (const d of json) {
      for (const m of d.meses) {
        total += m.actTotal;
        capturadas += m.actReg;
      }
    }
    const pct = total > 0 ? (capturadas * 100) / total : 0;
    const pendientes = total - capturadas;

    const ambiente = process.env.NODE_ENV || 'desconocido';
    const emoji = AMBIENTE_EMOJI[ambiente] || '⚙️';

    const mensaje = `${emoji} *[${ambiente.toUpperCase()}]*\n` +
      `📈 *Avance Global de Captura - SISECAOD*\n` +
      `🕐 Reporte cada 2 min\n\n` +
      `📊 Porcentaje: *${Math.round(pct)}%*\n` +
      `📦 Total actividades: *${total.toLocaleString()}*\n` +
      `✅ Capturadas: *${capturadas.toLocaleString()}*\n` +
      `⏳ Pendientes: *${pendientes.toLocaleString()}*`;

    await enviarMensajeTelegram(mensaje);
  } catch (err) {
    console.error('Error enviando avance global a Telegram:', err.message);
  }
}

// Iniciar el temporizador para enviar avance cada 2 minutos
setInterval(enviarAvanceGlobal, 2 * 60 * 1000);

async function enviarAlertaWarn(message) {
  const ambiente = process.env.NODE_ENV || 'desconocido';
  const emoji = AMBIENTE_EMOJI[ambiente] || '⚙️';
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const mensaje = `${emoji} *[${ambiente.toUpperCase()}]*\n` +
    `⚠️ *Aviso / Advertencia - SISECAOD*\n` +
    `🕐 ${timestamp}\n\n` +
    `${message}`;

  await enviarMensajeTelegram(mensaje);
}

async function enviarAlertaError(message) {
  const ambiente = process.env.NODE_ENV || 'desconocido';
  const emoji = AMBIENTE_EMOJI[ambiente] || '⚙️';
  
  const claveDedup = `${ambiente}:${message}`;
  const now = Date.now();

  if (recentErrors.has(claveDedup)) {
    const lastSent = recentErrors.get(claveDedup);
    if (now - lastSent < 5 * 60 * 1000) {
      return;
    }
  }
  recentErrors.set(claveDedup, now);

  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  
  const mensaje = `${emoji} *[${ambiente.toUpperCase()}]*\n` +
    `🔴 *Error de Servidor - SISECAOD*\n` +
    `🕐 ${timestamp}\n\n` +
    `${message}`;

  await enviarMensajeTelegram(mensaje);
}

async function enviarMensajeTelegram(text) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return;

    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    console.error('Error enviando mensaje a Telegram:', err.message);
  }
}

module.exports = {
  registrarEvento,
  enviarAlertaWarn,
  enviarAlertaError,
  enviarResumenSesiones,
  enviarAvanceGlobal
};
