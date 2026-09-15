// ============================================================
// JARVIS V6 — CORE / CÉREBRO CENTRAL
// Versão: 1.0.0
// Função: interpretar solicitações e encaminhá-las
// ============================================================

const CORE_VERSION = "1.0.0";

const INTENTS = Object.freeze({
  CHAT: "chat",
  TIME: "time",
  DATE: "date",
  SEARCH: "search",
  OPEN_APP: "open_app",
  BRAIN: "brain",
  MEMORY: "memory",
  LEARNING: "learning",
  STATUS: "status",
  UNKNOWN: "unknown"
});

const CORE_STATES = Object.freeze({
  IDLE: "idle",
  ANALYZING: "analyzing",
  EXECUTING: "executing",
  RESPONDING: "responding",
  ERROR: "error"
});

let coreState = CORE_STATES.IDLE;

let lastRequest = null;
let lastIntent = INTENTS.UNKNOWN;

const stateListeners = new Set();


// ============================================================
// NORMALIZAÇÃO
// ============================================================

function normalizeText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}


// ============================================================
// ESTADO DO CÉREBRO
// ============================================================

export function getCoreState() {
  return {
    version: CORE_VERSION,
    state: coreState,
    lastIntent,
    lastRequest,
    active: true,
    timestamp: new Date().toISOString()
  };
}


export function setCoreState(state) {
  if (!Object.values(CORE_STATES).includes(state)) {
    return getCoreState();
  }

  coreState = state;

  const snapshot = getCoreState();

  stateListeners.forEach(listener => {
    try {
      listener(snapshot);
    } catch {
      // Um listener com erro não pode derrubar o cérebro.
    }
  });

  return snapshot;
}


export function onCoreStateChange(listener) {
  if (typeof listener !== "function") {
    return () => {};
  }

  stateListeners.add(listener);

  return () => {
    stateListeners.delete(listener);
  };
}


// ============================================================
// PALAVRAS-CHAVE
// ============================================================

const groups = {

  time: [
    "que horas sao",
    "qual a hora",
    "me diga a hora",
    "hora atual",
    "horas agora",
    "horario agora"
  ],

  date: [
    "que dia e hoje",
    "qual a data",
    "data de hoje",
    "data atual",
    "dia de hoje"
  ],

  search: [
    "pesquise",
    "pesquisa",
    "procure",
    "buscar",
    "busque",
    "pesquisar na internet",
    "pesquise na internet",
    "pesquisa na internet"
  ],

  brain: [
    "abra seu cerebro",
    "mostrar seu cerebro",
    "mostre seu cerebro",
    "analise seu cerebro",
    "abrir cerebro",
    "estado do cerebro",
    "como esta seu cerebro"
  ],

  memory: [
    "lembre que",
    "lembre-se que",
    "guarde que",
    "memorize que",
    "salve na memoria",
    "minha memoria"
  ],

  learning: [
    "aprenda",
    "aprenda que",
    "aprenda isso",
    "ensine",
    "vou te ensinar"
  ],

  status: [
    "status",
    "como voce esta",
    "como esta voce",
    "estado do sistema",
    "estado do jarvis"
  ]
};


// ============================================================
// DETECÇÃO DE INTENÇÃO
// ============================================================

function containsAny(text, values) {
  return values.some(value => text.includes(value));
}


function detectTime(text) {
  return containsAny(text, groups.time);
}


function detectDate(text) {
  return containsAny(text, groups.date);
}


function detectSearch(text) {
  return containsAny(text, groups.search);
}


function detectBrain(text) {
  return containsAny(text, groups.brain);
}


function detectMemory(text) {
  return containsAny(text, groups.memory);
}


function detectLearning(text) {
  return containsAny(text, groups.learning);
}


function detectStatus(text) {
  return containsAny(text, groups.status);
}


function detectOpenApp(text) {
  const apps = [
    "youtube",
    "whatsapp",
    "instagram",
    "facebook",
    "discord",
    "gmail",
    "spotify",
    "google maps",
    "maps",
    "google"
  ];

  for (const app of apps) {
    if (
      text.includes(`abra o ${app}`) ||
      text.includes(`abra ${app}`) ||
      text.includes(`abrir ${app}`) ||
      text.includes(`abre ${app}`)
    ) {
      return {
        intent: INTENTS.OPEN_APP,
        target: app
      };
    }
  }

  return null;
}


// ============================================================
// EXTRAÇÃO DE PESQUISA
// ============================================================

function extractSearchQuery(text) {
  const patterns = [
    "pesquise na internet",
    "pesquisar na internet",
    "pesquisa na internet",
    "pesquise",
    "pesquisa",
    "procure",
    "buscar",
    "busque"
  ];

  for (const pattern of patterns) {
    if (text.startsWith(pattern)) {
      return text
        .slice(pattern.length)
        .trim();
    }
  }

  return text;
}


// ============================================================
// INTERPRETADOR PRINCIPAL
// ============================================================

export function analyzeRequest(input) {

  const originalText =
    String(input || "").trim();

  const text =
    normalizeText(originalText);

  setCoreState(CORE_STATES.ANALYZING);

  if (!text) {
    lastIntent = INTENTS.UNKNOWN;

    const result = {
      ok: false,
      intent: INTENTS.UNKNOWN,
      action: null,
      text: "",
      reason: "empty_request"
    };

    lastRequest = result;

    setCoreState(CORE_STATES.IDLE);

    return result;
  }


  // ----------------------------------------------------------
  // HORA
  // ----------------------------------------------------------

  if (detectTime(text)) {

    const result = {
      ok: true,
      intent: INTENTS.TIME,
      action: "GET_TIME",
      text: originalText
    };

    lastIntent = result.intent;
    lastRequest = result;

    return result;
  }


  // ----------------------------------------------------------
  // DATA
  // ----------------------------------------------------------

  if (detectDate(text)) {

    const result = {
      ok: true,
      intent: INTENTS.DATE,
      action: "GET_DATE",
      text: originalText
    };

    lastIntent = result.intent;
    lastRequest = result;

    return result;
  }


  // ----------------------------------------------------------
  // CÉREBRO
  // ----------------------------------------------------------

  if (detectBrain(text)) {

    const result = {
      ok: true,
      intent: INTENTS.BRAIN,
      action: "OPEN_BRAIN",
      text: originalText
    };

    lastIntent = result.intent;
    lastRequest = result;

    return result;
  }


  // ----------------------------------------------------------
  // MEMÓRIA
  // ----------------------------------------------------------

  if (detectMemory(text)) {

    const result = {
      ok: true,
      intent: INTENTS.MEMORY,
      action: "SAVE_MEMORY",
      text: originalText,
      content: originalText
    };

    lastIntent = result.intent;
    lastRequest = result;

    return result;
  }


  // ----------------------------------------------------------
  // APRENDIZADO
  // ----------------------------------------------------------

  if (detectLearning(text)) {

    const result = {
      ok: true,
      intent: INTENTS.LEARNING,
      action: "LEARN",
      text: originalText,
      content: originalText
    };

    lastIntent = result.intent;
    lastRequest = result;

    return result;
  }


  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  if (detectStatus(text)) {

    const result = {
      ok: true,
      intent: INTENTS.STATUS,
      action: "GET_STATUS",
      text: originalText
    };

    lastIntent = result.intent;
    lastRequest = result;

    return result;
  }


  // ----------------------------------------------------------
  // APLICATIVOS
  // ----------------------------------------------------------

  const appCommand =
    detectOpenApp(text);

  if (appCommand) {

    const result = {
      ok: true,
      intent: INTENTS.OPEN_APP,
      action: "OPEN_APP",
      target: appCommand.target,
      text: originalText
    };

    lastIntent = result.intent;
    lastRequest = result;

    return result;
  }


  // ----------------------------------------------------------
  // PESQUISA
  // ----------------------------------------------------------

  if (detectSearch(text)) {

    const query =
      extractSearchQuery(text);

    const result = {
      ok: true,
      intent: INTENTS.SEARCH,
      action: "SEARCH_WEB",
      query,
      text: originalText
    };

    lastIntent = result.intent;
    lastRequest = result;

    return result;
  }


  // ----------------------------------------------------------
  // CONVERSAÇÃO
  // ----------------------------------------------------------

  const result = {
    ok: true,
    intent: INTENTS.CHAT,
    action: "ASK_AI",
    text: originalText
  };

  lastIntent = result.intent;
  lastRequest = result;

  return result;
}


// ============================================================
// EXECUÇÃO
// ============================================================

export async function processRequest(
  input,
  handlers = {}
) {

  const analysis =
    analyzeRequest(input);

  if (!analysis.ok) {
    return analysis;
  }

  setCoreState(
    CORE_STATES.EXECUTING
  );


  try {

    let result;


    switch (analysis.intent) {

      case INTENTS.TIME:

        if (typeof handlers.time === "function") {
          result =
            await handlers.time(analysis);
        }
        break;


      case INTENTS.DATE:

        if (typeof handlers.date === "function") {
          result =
            await handlers.date(analysis);
        }
        break;


      case INTENTS.SEARCH:

        if (typeof handlers.search === "function") {
          result =
            await handlers.search(
              analysis.query,
              analysis
            );
        }
        break;


      case INTENTS.OPEN_APP:

        if (typeof handlers.openApp === "function") {
          result =
            await handlers.openApp(
              analysis.target,
              analysis
            );
        }
        break;


      case INTENTS.BRAIN:

        if (typeof handlers.brain === "function") {
          result =
            await handlers.brain(analysis);
        }
        break;


      case INTENTS.MEMORY:

        if (typeof handlers.memory === "function") {
          result =
            await handlers.memory(
              analysis.content,
              analysis
            );
        }
        break;


      case INTENTS.LEARNING:

        if (typeof handlers.learning === "function") {
          result =
            await handlers.learning(
              analysis.content,
              analysis
            );
        }
        break;


      case INTENTS.STATUS:

        if (typeof handlers.status === "function") {
          result =
            await handlers.status(analysis);
        }
        break;


      case INTENTS.CHAT:

        if (typeof handlers.chat === "function") {
          result =
            await handlers.chat(
              analysis.text,
              analysis
            );
        }
        break;


      default:
        break;
    }


    // Nenhum executor configurado ainda.
    if (typeof result === "undefined") {

      result = {
        ok: true,
        pending: true,
        intent: analysis.intent,
        action: analysis.action,
        message:
          "A capacidade ainda não está conectada ao núcleo."
      };
    }


    setCoreState(
      CORE_STATES.RESPONDING
    );

    return {
      ok: true,
      analysis,
      result
    };

  } catch (error) {

    setCoreState(
      CORE_STATES.ERROR
    );

    return {
      ok: false,
      analysis,
      error:
        error?.message ||
        "Erro desconhecido no núcleo."
    };
  }
}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

export function initializeCore() {

  coreState =
    CORE_STATES.IDLE;

  lastRequest = null;
  lastIntent = INTENTS.UNKNOWN;

  return getCoreState();
}


// ============================================================
// INFORMAÇÕES DO NÚCLEO
// ============================================================

export function getCoreInfo() {

  return {
    name: "JARVIS CORE",
    version: CORE_VERSION,
    active: true,
    state: coreState,

    capabilities: [
      INTENTS.CHAT,
      INTENTS.TIME,
      INTENTS.DATE,
      INTENTS.SEARCH,
      INTENTS.OPEN_APP,
      INTENTS.BRAIN,
      INTENTS.MEMORY,
      INTENTS.LEARNING,
      INTENTS.STATUS
    ],

    architecture:
      "JARVIS V6 CORE",

    timestamp:
      new Date().toISOString()
  };
        }
