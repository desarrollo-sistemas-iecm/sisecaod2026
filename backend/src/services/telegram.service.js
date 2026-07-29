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

function escapeHtml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function barraProgreso(porcentaje, longitud = 10) {
  const llenos = Math.round((porcentaje / 100) * longitud);
  return '▓'.repeat(llenos) + '░'.repeat(longitud - llenos);
}

function formatSessionLine(line) {
  if (line.includes('— IP:')) {
    const ipParts = line.split('— IP:');
    const mainPart = ipParts[0].trim();
    const ip = ipParts[1] ? ipParts[1].trim() : '::1';

    const userParts = mainPart.split(' — ');
    const nameAndUser = userParts[0].trim();
    const details = userParts[1] ? userParts[1].trim() : '';

    const userMatch = nameAndUser.match(/\(([^)]+)\)/);
    const usuario = userMatch ? userMatch[1] : nameAndUser;

    return `  • <code>${escapeHtml(usuario)}</code> — ${escapeHtml(details)} — IP: <code>${escapeHtml(ip)}</code>`;
  }
  return `  • <code>${escapeHtml(line)}</code>`;
}

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
  const start = new Date(now.getTime() - 1 * 60 * 1000); // 1 minuto
  const formatTime = (d) => d.toTimeString().split(' ')[0].slice(0, 8); // HH:mm:ss
  const rangeStr = `${formatTime(start)} - ${formatTime(now)}`;

  const listLogins = loginUsers.length > 0
    ? '\n' + loginUsers.map(formatSessionLine).join('\n')
    : '  • Ninguna';
    
  const listLogouts = logoutUsers.length > 0
    ? '\n' + logoutUsers.map(formatSessionLine).join('\n')
    : '  • Ninguno';

  const mensaje = `${emoji} <b>[${ambiente.toUpperCase()}]</b>\n` +
    `📊 <b>Resumen de Sesiones - SISECAOD</b>\n` +
    `🕐 <b>${rangeStr}</b>\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    `🟢 <b>Iniciadas (${loginUsers.length})</b>${listLogins}\n\n` +
    `🔴 <b>Cerradas (${logoutUsers.length})</b>${listLogouts}`;

  try {
    await enviarMensajeTelegram(mensaje);
    try {
      const { logger } = require('../config/logger');
      logger.info('Telegram: Resumen de sesiones enviado con éxito.');
    } catch (logErr) {
      console.log('Telegram: Resumen de sesiones enviado con éxito.');
    }
    // Vaciar listas
    loginUsers = [];
    logoutUsers = [];
  } catch (err) {
    try {
      const { logger } = require('../config/logger');
      logger.error('Error enviando resumen de sesiones a Telegram: ' + err.message);
    } catch (logErr) {
      console.error('Error enviando resumen de sesiones a Telegram:', err.message);
    }
  }
}

// Lógica de programación exacta para el resumen de 1 minuto (cada minuto exacto xx:yy:00)
function iniciarProgramadorSesiones() {
  const now = new Date();
  const ms = now.getMilliseconds();
  const s = now.getSeconds();

  // Calcular los segundos restantes para el siguiente minuto exacto
  const delayMs = (60 * 1000) - (s * 1000) - ms;

  setTimeout(() => {
    enviarResumenSesiones();
    setInterval(enviarResumenSesiones, 1 * 60 * 1000);
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
    const barra = barraProgreso(pct, 10);

    const mensaje = `${emoji} <b>[${ambiente.toUpperCase()}]</b>\n` +
      `📈 <b>Avance Global de Captura - SISECAOD</b>\n` +
      `🕐 Reporte cada 1 min\n` +
      `━━━━━━━━━━━━━━━\n\n` +
      `[${barra}] <b>${Math.round(pct)}%</b>\n\n` +
      `📦 Total: <b>${total.toLocaleString()}</b>   ✅ Capturadas: <b>${capturadas.toLocaleString()}</b>   ⏳ Pendientes: <b>${pendientes.toLocaleString()}</b>`;

    await enviarMensajeTelegram(mensaje);
    try {
      const { logger } = require('../config/logger');
      logger.info('Telegram: Avance global de captura enviado con éxito.');
    } catch (logErr) {
      console.log('Telegram: Avance global de captura enviado con éxito.');
    }
  } catch (err) {
    try {
      const { logger } = require('../config/logger');
      logger.error('Error enviando avance global a Telegram: ' + err.message);
    } catch (logErr) {
      console.error('Error enviando avance global a Telegram:', err.message);
    }
  }
}

// Iniciar el temporizador para enviar avance cada 1 minuto
setInterval(enviarAvanceGlobal, 1 * 60 * 1000);

async function enviarAlertaWarn(message) {
  const ambiente = process.env.NODE_ENV || 'desconocido';
  const emoji = AMBIENTE_EMOJI[ambiente] || '⚙️';
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const mensaje = `${emoji} <b>[${ambiente.toUpperCase()}]</b>\n` +
    `⚠️ <b>Aviso / Advertencia - SISECAOD</b>\n` +
    `🕐 ${timestamp}\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    `${escapeHtml(message)}`;

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
  
  const mensaje = `${emoji} <b>[${ambiente.toUpperCase()}]</b>\n` +
    `🚨 <b>ERROR CRÍTICO - SISECAOD</b>\n` +
    `🕐 ${timestamp}\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    `<pre>${escapeHtml(message)}</pre>`;

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
      parse_mode: 'HTML'
    });
  } catch (err) {
    try {
      const { logger } = require('../config/logger');
      logger.error('Error enviando mensaje a Telegram: ' + err.message);
    } catch (logErr) {
      console.error('Error enviando mensaje a Telegram:', err.message);
    }
  }
}

module.exports = {
  registrarEvento,
  enviarAlertaWarn,
  enviarAlertaError,
  enviarResumenSesiones,
  enviarAvanceGlobal,
  escapeHtml,
  barraProgreso
};
