// ============================================================
// JARVIS V6 — ORCHESTRATOR
// Orquestrador central do sistema
// ============================================================

import {
  processInput,
  processChat,
  processCommand
} from "./engine.js";

import {
  processNaturalInput
} from "./natural.js";

import {
  runSimpleAutomation
} from "./automation.js";

import {
  getAutomationState
} from "./automation.js";

import {
  getTaskOverview
} from "./task-manager.js";

import {
  getBrainState
} from "./state.js";

import {
  emit,
  EVENTS
} from "./events.js";


// ============================================================
// VERSÃO
// ============================================================

export const ORCHESTRATOR_VERSION = "1.0.0";


// ============================================================
// ESTADO
// ============================================================

let orchestratorState = {

  active: false,

  processing: false,

  currentInput: null,

  currentRoute: null,

  lastResult: null,

  lastError: null,

  processedRequests: 0,

  startedAt: null,

  updatedAt: null

};


// ============================================================
// UTILITÁRIO
// ============================================================

function now() {

  return new Date().toISOString();

}


// ============================================================
// INICIALIZAR
// ============================================================

export function initializeOrchestrator() {

  orchestratorState = {

    active: true,

    processing: false,

    currentInput: null,

    currentRoute: null,

    lastResult: null,

    lastError: null,

    processedRequests: 0,

    startedAt: now(),

    updatedAt: now()

  };


  return {

    ok: true,

    state:
      getOrchestratorState()

  };

}


// ============================================================
// ATIVAR
// ============================================================

export function activateOrchestrator() {

  orchestratorState.active =
    true;

  orchestratorState.updatedAt =
    now();

  orchestratorState.lastError =
    null;


  return {

    ok: true,

    active: true

  };

}


// ============================================================
// DESATIVAR
// ============================================================

export function deactivateOrchestrator() {

  if (
    orchestratorState.processing
  ) {

    return {

      ok: false,

      error:
        "O orquestrador está processando uma solicitação."

    };

  }


  orchestratorState.active =
    false;

  orchestratorState.updatedAt =
    now();


  return {

    ok: true,

    active: false

  };

}


// ============================================================
// PROCESSAMENTO PRINCIPAL
// ============================================================

export async function orchestrate(
  input,
  options = {}
) {

  const text =
    String(
      input || ""
    ).trim();


  if (!text) {

    return {

      ok: false,

      error:
        "Entrada vazia."

    };

  }


  if (
    !orchestratorState.active
  ) {

    initializeOrchestrator();

  }


  if (
    orchestratorState.processing
  ) {

    return {

      ok: false,

      error:
        "O JARVIS já está processando outra solicitação."

    };

  }


  orchestratorState.processing =
    true;

  orchestratorState.currentInput =
    text;

  orchestratorState.updatedAt =
    now();

  orchestratorState.lastError =
    null;


  emit(
    EVENTS.THINKING,
    {
      input:
        text
    }
  );


  try {

    let result;


    // --------------------------------------------------------
    // MODO NATURAL
    // --------------------------------------------------------

    if (
      options.natural !== false
    ) {

      result =
        await processNaturalInput(
          text,
          options
        );

    }


    // --------------------------------------------------------
    // FALLBACK PARA CHAT
    // --------------------------------------------------------

    if (
      !result ||
      result.handled === false
    ) {

      result =
        await processInput(
          text,
          options
        );

    }


    orchestratorState.lastResult =
      result;

    orchestratorState.processedRequests +=
      1;

    orchestratorState.updatedAt =
      now();


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

      result

    };

  } catch (error) {

    const message =
      error?.message ||
      String(error);


    orchestratorState.lastError =
      message;


    orchestratorState.updatedAt =
      now();


    emit(
      EVENTS.SYSTEM_ERROR,
      {
        source:
          "orchestrator",

        error:
          message
      }
    );


    return {

      ok: false,

      input:
        text,

      error:
        message

    };

  } finally {

    orchestratorState.processing =
      false;

    orchestratorState.currentInput =
      null;

    orchestratorState.currentRoute =
      null;

    orchestratorState.updatedAt =
      now();

  }

}


// ============================================================
// PROCESSAR CHAT
// ============================================================

export async function orchestrateChat(
  message,
  options = {}
) {

  if (
    !message ||
    !String(message).trim()
  ) {

    return {

      ok: false,

      error:
        "Mensagem vazia."

    };

  }


  if (
    !orchestratorState.active
  ) {

    initializeOrchestrator();

  }


  orchestratorState.currentRoute =
    "ai";


  try {

    const result =
      await processChat(
        String(message).trim(),
        options
      );


    orchestratorState.lastResult =
      result;

    orchestratorState.processedRequests +=
      1;

    orchestratorState.updatedAt =
      now();


    return {

      ok:
        result?.ok !== false,

      result

    };

  } catch (error) {

    const messageError =
      error?.message ||
      String(error);


    orchestratorState.lastError =
      messageError;


    return {

      ok: false,

      error:
        messageError

    };

  } finally {

    orchestratorState.currentRoute =
      null;

  }

}


// ============================================================
// PROCESSAR COMANDO
// ============================================================

export async function orchestrateCommand(
  command,
  data = {},
  options = {}
) {

  if (
    !command
  ) {

    return {

      ok: false,

      error:
        "Comando inválido."

    };

  }


  orchestratorState.currentRoute =
    "command";


  try {

    const result =
      await processCommand(
        command,
        data,
        options
      );


    orchestratorState.lastResult =
      result;

    orchestratorState.processedRequests +=
      1;

    orchestratorState.updatedAt =
      now();


    return {

      ok:
        result?.ok !== false,

      result

    };

  } catch (error) {

    const message =
      error?.message ||
      String(error);


    orchestratorState.lastError =
      message;


    return {

      ok: false,

      error:
        message

    };

  } finally {

    orchestratorState.currentRoute =
      null;

  }

}


// ============================================================
// EXECUTAR AUTOMAÇÃO
// ============================================================

export async function orchestrateAutomation(
  name,
  steps,
  options = {}
) {

  if (
    !name ||
    !Array.isArray(steps) ||
    steps.length === 0
  ) {

    return {

      ok: false,

      error:
        "Automação inválida."

    };

  }


  orchestratorState.currentRoute =
    "automation";

  orchestratorState.processing =
    true;


  try {

    const result =
      await runSimpleAutomation(
        name,
        steps,
        options
      );


    orchestratorState.lastResult =
      result;

    orchestratorState.processedRequests +=
      1;


    return result;

  } catch (error) {

    const message =
      error?.message ||
      String(error);


    orchestratorState.lastError =
      message;


    return {

      ok: false,

      error:
        message

    };

  } finally {

    orchestratorState.processing =
      false;

    orchestratorState.currentRoute =
      null;

    orchestratorState.updatedAt =
      now();

  }

}


// ============================================================
// STATUS COMPLETO
// ============================================================

export function getOrchestratorState() {

  return {

    ...orchestratorState

  };

}


// ============================================================
// VISÃO GERAL DO SISTEMA
// ============================================================

export function getOrchestratorOverview() {

  return {

    ok: true,

    orchestrator:
      getOrchestratorState(),

    brain:
      getBrainState(),

    automation:
      getAutomationState(),

    tasks:
      getTaskOverview()

  };

}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseOrchestrator() {

  const state =
    getOrchestratorState();


  return {

    ok: true,

    version:
      ORCHESTRATOR_VERSION,

    active:
      state.active,

    processing:
      state.processing,

    processedRequests:
      state.processedRequests,

    currentRoute:
      state.currentRoute,

    lastError:
      state.lastError,

    timestamp:
      now()

  };

}


// ============================================================
// TESTE
// ============================================================

export async function testOrchestrator() {

  const result =
    await orchestrate(
      "qual é o status do sistema",
      {
        natural: true
      }
    );


  return {

    ok:
      result.ok !== false,

    result,

    state:
      getOrchestratorState()

  };

}


// ============================================================
// REINICIAR
// ============================================================

export function restartOrchestrator() {

  if (
    orchestratorState.processing
  ) {

    return {

      ok: false,

      error:
        "Não é possível reiniciar durante um processamento."

    };

  }


  return initializeOrchestrator();

}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getOrchestratorInfo() {

  return {

    name:
      "JARVIS Orchestrator",

    version:
      ORCHESTRATOR_VERSION,

    capabilities: [

      "central request orchestration",

      "natural language routing",

      "AI chat routing",

      "command routing",

      "automation execution",

      "task integration",

      "brain integration",

      "event integration",

      "system diagnostics"

    ]

  };

      }
