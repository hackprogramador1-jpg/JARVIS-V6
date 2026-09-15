// ============================================================
// JARVIS V6 — TOOL ENGINE
// Versão: 1.0.0
// Função: ferramentas reais utilizadas pelo cérebro
// ============================================================

const TOOLS_VERSION = "1.0.0";


// ============================================================
// REGISTRO DAS FERRAMENTAS
// ============================================================

const TOOLS = {

  time: {
    name: "time",
    description: "Obtém a hora atual do dispositivo.",
    category: "context"
  },

  date: {
    name: "date",
    description: "Obtém a data atual do dispositivo.",
    category: "context"
  },

  status: {
    name: "status",
    description: "Obtém o estado atual do dispositivo e navegador.",
    category: "context"
  },

  search: {
    name: "search",
    description: "Pesquisa informações na internet.",
    category: "web"
  },

  openApp: {
    name: "openApp",
    description: "Solicita abertura de aplicativo ou serviço.",
    category: "device"
  },

  memory: {
    name: "memory",
    description: "Consulta a memória do JARVIS.",
    category: "brain"
  },

  knowledge: {
    name: "knowledge",
    description: "Consulta o conhecimento do JARVIS.",
    category: "brain"
  },

  brain: {
    name: "brain",
    description: "Consulta informações internas do cérebro.",
    category: "system"
  }
};


// ============================================================
// UTILITÁRIO
// ============================================================

function now() {
  return new Date().toISOString();
}


// ============================================================
// LISTAR FERRAMENTAS
// ============================================================

export function getTools() {

  return Object.values(TOOLS);
}


// ============================================================
// VERIFICAR FERRAMENTA
// ============================================================

export function hasTool(name) {

  return Boolean(
    TOOLS[name]
  );
}


// ============================================================
// HORA
// ============================================================

export function getCurrentTime() {

  const date =
    new Date();

  return {

    ok: true,

    value:
      date.toLocaleTimeString(
        "pt-BR",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }
      ),

    timestamp:
      date.toISOString(),

    tool:
      "time"
  };
}


// ============================================================
// DATA
// ============================================================

export function getCurrentDate() {

  const date =
    new Date();

  return {

    ok: true,

    value:
      date.toLocaleDateString(
        "pt-BR",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        }
      ),

    day:
      date.toLocaleDateString(
        "pt-BR",
        {
          weekday: "long"
        }
      ),

    timestamp:
      date.toISOString(),

    tool:
      "date"
  };
}


// ============================================================
// DATA + HORA
// ============================================================

export function getDateTime() {

  const date =
    new Date();

  return {

    ok: true,

    time:
      getCurrentTime().value,

    date:
      getCurrentDate().value,

    day:
      getCurrentDate().day,

    iso:
      date.toISOString(),

    timeZone:
      Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone,

    tool:
      "datetime"
  };
}


// ============================================================
// STATUS DO DISPOSITIVO
// ============================================================

export async function getDeviceStatus() {

  let battery = null;

  try {

    if (
      navigator.getBattery
    ) {

      const info =
        await navigator.getBattery();

      battery = {

        level:
          Math.round(
            info.level * 100
          ),

        charging:
          info.charging
      };
    }

  } catch {
    battery = null;
  }


  return {

    ok: true,

    online:
      navigator.onLine,

    language:
      navigator.language,

    platform:
      navigator.platform,

    userAgent:
      navigator.userAgent,

    screen: {

      width:
        window.screen?.width ||
        null,

      height:
        window.screen?.height ||
        null
    },

    battery,

    timeZone:
      Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone,

    timestamp:
      now(),

    tool:
      "status"
  };
}


// ============================================================
// PESQUISA WEB
// ============================================================

export async function searchWeb(
  query,
  options = {}
) {

  const text =
    String(query || "")
      .trim();

  if (!text) {

    return {

      ok: false,

      error:
        "Consulta de pesquisa vazia.",

      tool:
        "search"
    };
  }


  const endpoint =
    options.endpoint ||
    "/api/search";


  try {

    const response =
      await fetch(
        endpoint,
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              query:
                text
            })
        }
      );


    const raw =
      await response.text();

    let data = null;

    try {

      data =
        raw
          ? JSON.parse(raw)
          : null;

    } catch {

      data = null;
    }


    if (!response.ok) {

      return {

        ok: false,

        error:
          data?.error ||
          `Pesquisa indisponível. HTTP ${response.status}.`,

        tool:
          "search",

        query:
          text
      };
    }


    return {

      ok: true,

      query:
        text,

      results:
        data?.results ||
        data?.answer ||
        data?.data ||
        [],

      source:
        data?.source ||
        "JARVIS WEB SEARCH",

      timestamp:
        now(),

      tool:
        "search"
    };

  } catch (error) {

    return {

      ok: false,

      error:
        error?.message ||
        "Não foi possível realizar a pesquisa.",

      tool:
        "search",

      query:
        text
    };
  }
}


// ============================================================
// ABRIR SERVIÇO / APLICATIVO
// ============================================================

export function openApp(
  target
) {

  const value =
    String(target || "")
      .trim()
      .toLowerCase();


  const urls = {

    google:
      "https://www.google.com",

    youtube:
      "https://www.youtube.com",

    whatsapp:
      "https://web.whatsapp.com",

    instagram:
      "https://www.instagram.com",

    facebook:
      "https://www.facebook.com",

    discord:
      "https://discord.com/app",

    gmail:
      "https://mail.google.com",

    spotify:
      "https://open.spotify.com",

    maps:
      "https://www.google.com/maps"
  };


  const url =
    urls[value];


  if (!url) {

    return {

      ok: false,

      target:
        value,

      error:
        "Aplicativo ou serviço não registrado.",

      tool:
        "openApp"
    };
  }


  try {

    const opened =
      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );


    if (!opened) {

      window.location.href =
        url;
    }


    return {

      ok: true,

      target:
        value,

      url,

      tool:
        "openApp",

      timestamp:
        now()
    };

  } catch (error) {

    return {

      ok: false,

      target:
        value,

      error:
        error?.message ||
        "Não foi possível abrir o serviço.",

      tool:
        "openApp"
    };
  }
}


// ============================================================
// NORMALIZAÇÃO
// ============================================================

function normalize(value) {

  return String(
    value || ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}


// ============================================================
// DETECTOR DE FERRAMENTA
// ============================================================

export function detectTool(
  input
) {

  const text =
    normalize(input);


  if (
    /\b(que horas|horas|hora|horario)\b/
      .test(text)
  ) {

    return "time";
  }


  if (
    /\b(data de hoje|que dia|qual dia|data)\b/
      .test(text)
  ) {

    return "date";
  }


  if (
    /\b(status|estado do sistema|situacao do sistema)\b/
      .test(text)
  ) {

    return "status";
  }


  if (
    /\b(pesquise|pesquisar|procure|buscar|busque|pesquisa)\b/
      .test(text)
  ) {

    return "search";
  }


  if (
    /\b(abre|abrir|abra|acessar|acesse)\b/
      .test(text)
  ) {

    return "openApp";
  }


  if (
    /\b(memoria|lembra|lembranca)\b/
      .test(text)
  ) {

    return "memory";
  }


  if (
    /\b(conhecimento|o que voce sabe|o que voce conhece)\b/
      .test(text)
  ) {

    return "knowledge";
  }


  if (
    /\b(cerebro|nucleo|brain)\b/
      .test(text)
  ) {

    return "brain";
  }


  return null;
}


// ============================================================
// EXTRAIR CONSULTA DE PESQUISA
// ============================================================

export function extractSearchQuery(
  input
) {

  const text =
    String(input || "")
      .trim();


  return text
    .replace(
      /^(jarvis[\s,:-]*)?/i,
      ""
    )
    .replace(
      /^(pesquise|pesquisar|pesquisa|procure|procurar|busque|buscar)\s+/i,
      ""
    )
    .trim();
}


// ============================================================
// EXECUTOR DE FERRAMENTAS
// ============================================================

export async function executeTool(
  name,
  input,
  options = {}
) {

  switch (name) {

    case "time":

      return getCurrentTime();


    case "date":

      return getCurrentDate();


    case "status":

      return getDeviceStatus();


    case "search":

      return searchWeb(
        options.query ||
        extractSearchQuery(input),
        options
      );


    case "openApp":

      return openApp(
        options.target ||
        input
      );


    default:

      return {

        ok: false,

        error:
          `Ferramenta "${name}" não possui executor neste módulo.`,

        tool:
          name,

        timestamp:
          now()
      };
  }
}


// ============================================================
// INFORMAÇÕES DO MOTOR
// ============================================================

export function getToolsInfo() {

  return {

    name:
      "JARVIS TOOL ENGINE",

    version:
      TOOLS_VERSION,

    tools:
      Object.keys(TOOLS),

    categories: [

      "context",

      "web",

      "device",

      "brain",

      "system"
    ],

    timestamp:
      now()
  };
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseTools() {

  const available = [];

  const unavailable = [];


  for (
    const [name, tool]
    of Object.entries(TOOLS)
  ) {

    if (
      typeof tool === "object"
    ) {

      available.push(name);

    } else {

      unavailable.push(name);
    }
  }


  return {

    ok:
      unavailable.length === 0,

    version:
      TOOLS_VERSION,

    available,

    unavailable,

    browserSupportsFetch:
      typeof fetch === "function",

    browserSupportsSpeech:
      Boolean(
        window.SpeechRecognition ||
        window.webkitSpeechRecognition
      ),

    timestamp:
      now()
  };
      }
