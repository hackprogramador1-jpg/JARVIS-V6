// ============================================================
// JARVIS V6 — ENGINE
// Motor principal de execução
// ============================================================

import {
  initializeSystem,
  getSystemStatus,
  diagnoseSystem
} from "./system.js";

import {
  routeRequest
} from "./router.js";

import {
  askAI
} from "./ai.js";

import {
  executeFromText
} from "./command.js";

import {
  createSession,
  getSessionContext,
  registerUserMessage,
  registerAssistantMessage
} from "./session.js";

import {
  emit,
  EVENTS
} from "./events.js";

import {
  getBrainState,
  setBrainStatus,
  activateBrain,
  returnToIdle,
  registerInput,
  registerResponse,
  registerError
} from "./state.js";

import {
  getSettings
} from "./settings.js";


// ============================================================
// VERSÃO
// ============================================================

export const ENGINE_VERSION = "1.0.0";


// ============================================================
// ESTADO
// ============================================================

let initialized = false;

let engineStatus =
  "offline";

let lastInput =
  null;

let lastOutput =
  null;

let lastError =
  null;

let initializedAt =
  null;


// ============================================================
// INICIALIZAÇÃO
// ============================================================

export function initializeEngine(
  owner = null
) {

  try {

    initializeSystem(owner);

    createSession();

    initialized =
      true;

    engineStatus =
      "online";

    initializedAt =
      new Date().toISOString();

    lastError =
      null;


    emit(
      EVENTS.SYSTEM_READY,
      {
        engine:
          ENGINE_VERSION,

        timestamp:
          initializedAt
      }
    );


    return {

      ok: true,

      status:
        engineStatus,

      version:
        ENGINE_VERSION,

      initializedAt

    };

  } catch (error) {

    initialized =
      false;

    engineStatus =
      "error";

    lastError =
      error.message;


    emit(
      EVENTS.SYSTEM_ERROR,
      {
        error:
          error.message
      }
    );


    return {

      ok: false,

      error:
        error.message

    };
  }
}


// ============================================================
// VERIFICAR INICIALIZAÇÃO
// ============================================================

function ensureEngine() {

  if (!initialized) {

    initializeEngine();
  }

  return initialized;
}


// ============================================================
// PROCESSAR ENTRADA COMPLETA
// ============================================================

export async function processInput(
  input,
  options = {}
) {

  if (
    typeof input !== "string" ||
    !input.trim()
  ) {

    return {

      ok: false,

      error:
        "Entrada vazia."
    };
  }


  ensureEngine();


  const text =
    input.trim();


  lastInput =
    text;

  lastError =
    null;


  activateBrain();

  setBrainStatus(
    "listening"
  );

  registerInput(
    text
  );


  emit(
    EVENTS.INPUT,
    {
      input:
        text,

      timestamp:
        new Date().toISOString()
    }
  );


  try {

    setBrainStatus(
      "thinking"
    );

    emit(
      EVENTS.THINKING,
      {
        input:
          text
      }
    );


    const result =
      await routeRequest(
        text,
        {
          ...options,

          settings:
            getSettings(),

          session:
            getSessionContext()

        }
      );


    lastOutput =
      result;


    if (
      result?.response
    ) {

      registerAssistantMessage(
        result.response
      );

      registerResponse(
        result.response
      );
    }


    emit(
      EVENTS.EXECUTION_COMPLETED,
      {
        input:
          text,

        result
      }
    );


    return {

      ok:
        result?.ok !== false,

      input:
        text,

      result,

      response:
        result?.response ||
        result?.result?.response ||
        null

    };

  } catch (error) {

    lastError =
      error.message;


    registerError(
      error.message
    );


    emit(
      EVENTS.SYSTEM_ERROR,
      {
        error:
          error.message,

        input:
          text
      }
    );


    return {

      ok: false,

      input:
        text,

      error:
        error.message

    };

  } finally {

    returnToIdle();
  }
}


// ============================================================
// CHAT DIRETO COM IA
// ============================================================

export async function processChat(
  message,
  options = {}
) {

  if (
    typeof message !== "string" ||
    !message.trim()
  ) {

    return {

      ok: false,

      error:
        "Mensagem vazia."
    };
  }


  ensureEngine();


  const text =
    message.trim();


  lastInput =
    text;

  lastError =
    null;


  activateBrain();

  setBrainStatus(
    "thinking"
  );


  try {

    emit(
      EVENTS.AI_REQUEST,
      {
        message:
          text
      }
    );


    const result =
      await askAI(
        text,
        {
          ...options,

          settings:
            getSettings()
        }
      );


    if (
      result?.response
    ) {

      lastOutput =
        result.response;

      registerResponse(
        result.response
      );


      emit(
        EVENTS.AI_RESPONSE,
        {
          response:
            result.response
        }
      );

    }


    return {

      ok:
        result?.ok !== false,

      response:
        result?.response ||
        "",

      memoryToSave:
        result?.memoryToSave ||
        null,

      model:
        result?.model ||
        null,

      responseId:
        result?.responseId ||
        null

    };

  } catch (error) {

    lastError =
      error.message;


    registerError(
      error.message
    );


    return {

      ok: false,

      error:
        error.message

    };

  } finally {

    returnToIdle();
  }
}


// ============================================================
// EXECUTAR COMANDO
// ============================================================

export async function processCommand(
  input,
  options = {}
) {

  if (
    typeof input !== "string" ||
    !input.trim()
  ) {

    return {

      ok: false,

      error:
        "Comando vazio."
    };
  }


  ensureEngine();


  const text =
    input.trim();


  lastInput =
    text;


  activateBrain();

  setBrainStatus(
    "executing"
  );


  try {

    const result =
      await executeFromText(
        text,
        options
      );


    lastOutput =
      result;


    return {

      ok:
        result?.ok !== false,

      result

    };

  } catch (error) {

    lastError =
      error.message;


    registerError(
      error.message
    );


    return {

      ok: false,

      error:
        error.message

    };

  } finally {

    returnToIdle();
  }
}


// ============================================================
// REGISTRAR MENSAGEM MANUAL
// ============================================================

export function addUserMessage(
  message
) {

  ensureEngine();


  return registerUserMessage(
    message
  );
}


// ============================================================
// REGISTRAR RESPOSTA MANUAL
// ============================================================

export function addAssistantMessage(
  message
) {

  ensureEngine();


  return registerAssistantMessage(
    message
  );
}


// ============================================================
// STATUS DO ENGINE
// ============================================================

export function getEngineStatus() {

  return {

    ok:
      initialized &&
      engineStatus === "online",

    version:
      ENGINE_VERSION,

    initialized,

    status:
      engineStatus,

    initializedAt,

    lastInput,

    lastOutput,

    lastError,

    brain:
      getBrainState(),

    settings:
      getSettings()

  };
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseEngine() {

  const system =
    diagnoseSystem();


  return {

    ok:
      initialized &&
      system?.ok !== false,

    engine: {

      initialized,

      status:
        engineStatus,

      version:
        ENGINE_VERSION

    },

    system,

    brain:
      getBrainState(),

    lastError,

    timestamp:
      new Date().toISOString()

  };
}


// ============================================================
// REINICIAR ENGINE
// ============================================================

export function restartEngine(
  owner = null
) {

  initialized =
    false;

  engineStatus =
    "offline";

  lastInput =
    null;

  lastOutput =
    null;

  lastError =
    null;


  return initializeEngine(
    owner
  );
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getEngineInfo() {

  return {

    name:
      "JARVIS V6 Engine",

    version:
      ENGINE_VERSION,

    purpose:
      "Motor central de execução do JARVIS.",

    capabilities: [

      "system initialization",

      "request routing",

      "AI chat",

      "command execution",

      "session integration",

      "brain state integration",

      "event integration",

      "settings integration",

      "diagnostics"

    ]

  };
        }
