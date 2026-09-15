// ============================================================
// JARVIS V6 — CONTEXT ENGINE
// Versão: 1.0.0
// Função: fornecer contexto real do dispositivo e ambiente
// ============================================================

const CONTEXT_VERSION = "1.0.0";


// ============================================================
// DATA/HORA
// ============================================================

function getDateTime() {

  const now = new Date();

  const timeZone =
    Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone || "UTC";

  return {

    iso:
      now.toISOString(),

    timestamp:
      now.getTime(),

    timeZone,

    locale:
      navigator.language || "pt-BR",

    date:
      now.toLocaleDateString(
        "pt-BR",
        {
          timeZone
        }
      ),

    time:
      now.toLocaleTimeString(
        "pt-BR",
        {
          timeZone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }
      ),

    dayOfWeek:
      now.toLocaleDateString(
        "pt-BR",
        {
          timeZone,
          weekday: "long"
        }
      )
  };
}


// ============================================================
// DISPOSITIVO
// ============================================================

function getDevice() {

  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection ||
    null;

  return {

    online:
      navigator.onLine,

    language:
      navigator.language ||
      "pt-BR",

    platform:
      navigator.platform ||
      "unknown",

    userAgent:
      navigator.userAgent ||
      "unknown",

    screen: {

      width:
        window.screen?.width ||
        null,

      height:
        window.screen?.height ||
        null,

      pixelRatio:
        window.devicePixelRatio ||
        1
    },

    connection: connection
      ? {

          type:
            connection.type ||
            null,

          effectiveType:
            connection.effectiveType ||
            null,

          downlink:
            connection.downlink ??
            null,

          rtt:
            connection.rtt ??
            null,

          saveData:
            connection.saveData ??
            false
        }
      : null
  };
}


// ============================================================
// BATERIA
// ============================================================

async function getBattery() {

  if (
    typeof navigator.getBattery !==
    "function"
  ) {

    return {

      supported: false,

      level: null,

      charging: null,

      chargingTime: null,

      dischargingTime: null
    };
  }


  try {

    const battery =
      await navigator.getBattery();

    return {

      supported: true,

      level:
        Math.round(
          battery.level * 100
        ),

      charging:
        Boolean(
          battery.charging
        ),

      chargingTime:
        Number.isFinite(
          battery.chargingTime
        )
          ? battery.chargingTime
          : null,

      dischargingTime:
        Number.isFinite(
          battery.dischargingTime
        )
          ? battery.dischargingTime
          : null
    };

  } catch {

    return {

      supported: false,

      level: null,

      charging: null,

      chargingTime: null,

      dischargingTime: null
    };
  }
}


// ============================================================
// NAVEGADOR
// ============================================================

function getBrowser() {

  return {

    cookiesEnabled:
      navigator.cookieEnabled,

    language:
      navigator.language,

    languages:
      Array.isArray(
        navigator.languages
      )
        ? navigator.languages
        : [],

    vendor:
      navigator.vendor ||
      null,

    userAgent:
      navigator.userAgent ||
      null
  };
}


// ============================================================
// VISIBILIDADE
// ============================================================

function getVisibility() {

  return {

    state:
      document.visibilityState,

    visible:
      document.visibilityState ===
      "visible",

    hidden:
      document.visibilityState ===
      "hidden"
  };
}


// ============================================================
// CONTEXTO COMPLETO
// ============================================================

export async function getContext() {

  const dateTime =
    getDateTime();

  const device =
    getDevice();

  const battery =
    await getBattery();

  const browser =
    getBrowser();

  const visibility =
    getVisibility();


  return {

    version:
      CONTEXT_VERSION,

    dateTime,

    device,

    battery,

    browser,

    visibility,

    timestamp:
      new Date().toISOString()
  };
}


// ============================================================
// HORA ATUAL
// ============================================================

export function getCurrentTime() {

  return getDateTime().time;
}


// ============================================================
// DATA ATUAL
// ============================================================

export function getCurrentDate() {

  return getDateTime().date;
}


// ============================================================
// DIA DA SEMANA
// ============================================================

export function getCurrentDay() {

  return getDateTime().dayOfWeek;
}


// ============================================================
// FUSO HORÁRIO
// ============================================================

export function getTimeZone() {

  return getDateTime().timeZone;
}


// ============================================================
// ONLINE/OFFLINE
// ============================================================

export function isOnline() {

  return Boolean(
    navigator.onLine
  );
}


// ============================================================
// ESTADO DO APARELHO
// ============================================================

export async function getDeviceState() {

  const context =
    await getContext();

  return {

    online:
      context.device.online,

    battery:
      context.battery,

    screen:
      context.device.screen,

    connection:
      context.device.connection,

    visibility:
      context.visibility
  };
}


// ============================================================
// RESUMO PARA A IA
// ============================================================

export async function getAIContext() {

  const context =
    await getContext();

  return {

    currentDate:
      context.dateTime.date,

    currentTime:
      context.dateTime.time,

    dayOfWeek:
      context.dateTime.dayOfWeek,

    timeZone:
      context.dateTime.timeZone,

    online:
      context.device.online,

    battery:
      context.battery.supported
        ? context.battery.level
        : null,

    charging:
      context.battery.supported
        ? context.battery.charging
        : null,

    devicePlatform:
      context.device.platform,

    language:
      context.device.language
  };
}


// ============================================================
// MONITORAMENTO DE CONECTIVIDADE
// ============================================================

export function watchConnection(
  callback
) {

  if (
    typeof callback !==
    "function"
  ) {

    return () => {};
  }


  const online = () => {

    callback({
      online: true,
      timestamp:
        new Date().toISOString()
    });

  };


  const offline = () => {

    callback({
      online: false,
      timestamp:
        new Date().toISOString()
    });

  };


  window.addEventListener(
    "online",
    online
  );

  window.addEventListener(
    "offline",
    offline
  );


  return () => {

    window.removeEventListener(
      "online",
      online
    );

    window.removeEventListener(
      "offline",
      offline
    );
  };
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export async function diagnoseContext() {

  try {

    const context =
      await getContext();

    return {

      ok: true,

      version:
        CONTEXT_VERSION,

      time:
        context.dateTime.time,

      date:
        context.dateTime.date,

      timeZone:
        context.dateTime.timeZone,

      online:
        context.device.online,

      battery:
        context.battery,

      visibility:
        context.visibility,

      timestamp:
        context.timestamp
    };

  } catch (error) {

    return {

      ok: false,

      version:
        CONTEXT_VERSION,

      error:
        error?.message ||
        "Erro ao obter contexto.",

      timestamp:
        new Date().toISOString()
    };
  }
}


// ============================================================
// INFORMAÇÕES DO MÓDULO
// ============================================================

export function getContextInfo() {

  return {

    name:
      "JARVIS CONTEXT ENGINE",

    version:
      CONTEXT_VERSION,

    capabilities: [

      "date",

      "time",

      "timezone",

      "battery",

      "connection",

      "device",

      "browser",

      "visibility"
    ],

    timestamp:
      new Date().toISOString()
  };
    }
