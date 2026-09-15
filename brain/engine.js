// ============================================================
// JARVIS V6 — ENGINE
// Núcleo central de execução do sistema
// ============================================================

import {
  initializeSystem,
  getSystemStatus,
  diagnoseSystem,
  restartSystem
} from "./system.js";

import {
  routeRequest,
  analyzeOnly,
  planOnly,
  contextOnly
} from "./router.js";

import {
  askAI,
  diagnoseAI,
  getAIInfo
} from "./ai.js";

import {
  executeFromText,
  diagnoseCommand
} from "./command.js";

import {
  initializeSession,
  createSession,
  getSession,
  registerUserMessage,
  registerAssistantMessage
} from "./session.js";

import {
  initializeVoiceManager,
  getVoiceManagerStatus,
  diagnoseVoiceManager
} from "./voice-manager.js";

import {
  initializeAutomationControl,
  getAutomationControlStatus,
  diagnoseAutomationControl
} from "./automation-control.js";

import {
  initializeWorkflowManager,
  getWorkflowManagerStatus,
  diagnoseWorkflowManager
} from "./workflow-manager.js";

import {
  initializeControl,
  getControlStatus,
  diagnoseControl
} from "./control.js";

import {
  emit
} from "./events.js";

import {
  getBrainState
} from "./state.js";

import {
  getSettings
} from "./settings.js";

export const ENGINE_VERSION = "2.0.0";

let initialized = false;
let running = false;

// ============================================================
// INICIALIZAÇÃO
// ============================================================

export function initializeEngine(owner = null) {
  try {
    initializeSystem(owner);

    initializeSession();
    createSession();

    initializeControl();
    initializeVoiceManager();
    initializeAutomationControl();
    initializeWorkflowManager();

    initialized = true;
    running = true;

    emit("system:ready", {
      module: "engine",
      version: ENGINE_VERSION
    });

    return {
      ok: true,
      initialized: true,
      running: true,
      version: ENGINE_VERSION
    };

  } catch (error) {
    initialized = false;
    running = false;

    emit("system:error", {
      module: "engine",
      error: error?.message
    });

    return {
      ok: false,
      initialized: false,
      running: false,
      error: error?.message || "Erro ao inicializar engine."
    };
  }
}

// ============================================================
// PROCESSAR ENTRADA PRINCIPAL
// ============================================================

export async function processInput(input, options = {}) {
  if (!input || typeof input !== "string") {
    return {
      ok: false,
      error: "Entrada inválida."
    };
  }

  if (!initialized) {
    initializeEngine(options.owner || null);
  }

  if (!running) {
    return {
      ok: false,
      error: "Engine está pausada."
    };
  }

  try {
    emit("input", {
      source: "engine",
      input
    });

    const result = await routeRequest(input, options);

    return {
      ok: result?.ok !== false,
      input,
      result
    };

  } catch (error) {
    emit("system:error", {
      module: "engine",
      error: error?.message
    });

    return {
      ok: false,
      input,
      error: error?.message || "Erro ao processar entrada."
    };
  }
}

// ============================================================
// CHAT COM IA
// ============================================================

export async function processChat(message, options = {}) {
  if (!message || typeof message !== "string") {
    return {
      ok: false,
      error: "Mensagem inválida."
    };
  }

  if (!initialized) {
    initializeEngine(options.owner || null);
  }

  try {
    registerUserMessage(message);

    emit("ai:request", {
      source: "engine",
      message
    });

    const result = await askAI(message, options);

    if (result?.response) {
      registerAssistantMessage(result.response);

      emit("ai:response", {
        source: "engine",
        response: result.response
      });
    }

    return {
      ok: result?.ok !== false,
      ...result
    };

  } catch (error) {
    return {
      ok: false,
      error: error?.message || "Erro ao conversar com a IA."
    };
  }
}

// ============================================================
// COMANDO DIRETO
// ============================================================

export async function processCommand(command, options = {}) {
  if (!command || typeof command !== "string") {
    return {
      ok: false,
      error: "Comando inválido."
    };
  }

  if (!initialized) {
    initializeEngine(options.owner || null);
  }

  try {
    const result = await executeFromText(
      command,
      options
    );

    return {
      ok: result?.ok !== false,
      command,
      result
    };

  } catch (error) {
    return {
      ok: false,
      command,
      error: error?.message || "Erro ao executar comando."
    };
  }
}

// ============================================================
// ANÁLISE
// ============================================================

export function analyzeInput(input) {
  return analyzeOnly(input);
}

// ============================================================
// PLANEJAMENTO
// ============================================================

export function planInput(input) {
  return planOnly(input);
}

// ============================================================
// CONTEXTO
// ============================================================

export function getInputContext(input) {
  return contextOnly(input);
}

// ============================================================
// MENSAGENS
// ============================================================

export function addUserMessage(message, metadata = {}) {
  return registerUserMessage(
    message,
    metadata
  );
}

export function addAssistantMessage(message, metadata = {}) {
  return registerAssistantMessage(
    message,
    metadata
  );
}

// ============================================================
// STATUS COMPLETO
// ============================================================

export function getEngineStatus() {
  return {
    ok: true,

    engine: {
      version: ENGINE_VERSION,
      initialized,
      running
    },

    system: getSystemStatus(),

    brain: getBrainState(),

    session: getSession(),

    settings: getSettings(),

    voice: getVoiceManagerStatus(),

    automation: getAutomationControlStatus(),

    workflow: getWorkflowManagerStatus()
  };
}

// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseEngine() {
  const results = {};

  try {
    results.system = diagnoseSystem();
  } catch (error) {
    results.system = {
      ok: false,
      error: error?.message
    };
  }

  try {
    results.ai = diagnoseAI();
  } catch (error) {
    results.ai = {
      ok: false,
      error: error?.message
    };
  }

  try {
    results.command = diagnoseCommand();
  } catch (error) {
    results.command = {
      ok: false,
      error: error?.message
    };
  }

  try {
    results.control = diagnoseControl();
  } catch (error) {
    results.control = {
      ok: false,
      error: error?.message
    };
  }

  try {
    results.voice = diagnoseVoiceManager();
  } catch (error) {
    results.voice = {
      ok: false,
      error: error?.message
    };
  }

  try {
    results.automation = diagnoseAutomationControl();
  } catch (error) {
    results.automation = {
      ok: false,
      error: error?.message
    };
  }

  try {
    results.workflow = diagnoseWorkflowManager();
  } catch (error) {
    results.workflow = {
      ok: false,
      error: error?.message
    };
  }

  const modules = Object.values(results);

  const healthy = modules.filter(
    module => module?.ok !== false
  ).length;

  return {
    ok: modules.every(
      module => module?.ok !== false
    ),

    version: ENGINE_VERSION,

    initialized,
    running,

    healthyModules: healthy,
    totalModules: modules.length,

    modules: results
  };
}

// ============================================================
// REINICIAR
// ============================================================

export function restartEngine(owner = null) {
  try {
    running = false;

    emit("system:error", {
      module: "engine",
      action: "restart"
    });

    restartSystem();

    initialized = false;

    return initializeEngine(owner);

  } catch (error) {
    return {
      ok: false,
      error: error?.message || "Erro ao reiniciar engine."
    };
  }
}

// ============================================================
// PARAR
// ============================================================

export function stopEngine() {
  running = false;

  emit("system:error", {
    module: "engine",
    action: "stop"
  });

  return {
    ok: true,
    running: false
  };
}

// ============================================================
// INFORMAÇÕES
// ============================================================

export function getEngineInfo() {
  return {
    version: ENGINE_VERSION,

    initialized,

    running,

    architecture: {
      system: true,
      router: true,
      ai: true,
      command: true,
      session: true,
      voice: true,
      automation: true,
      workflow: true,
      control: true
    },

    ai: getAIInfo()
  };
}

// ============================================================
// AUTO-INICIALIZAÇÃO
// ============================================================

initializeEngine();
