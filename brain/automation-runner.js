// ============================================================
// JARVIS V6 — AUTOMATION RUNNER
// Executor controlado de automações
// ============================================================

import {
  runAutomation,
  getAutomationState
} from "./automation.js";

import {
  recordAutomation
} from "./automation-memory.js";

import {
  emit,
  EVENTS
} from "./events.js";


// ============================================================
// VERSÃO
// ============================================================

export const AUTOMATION_RUNNER_VERSION = "1.0.0";


// ============================================================
// ESTADO
// ============================================================

let runnerState = {
  active: true,
  running: false,
  currentId: null,
  currentName: null,
  lastResult: null,
  lastError: null,
  executed: 0,
  completed: 0,
  failed: 0,
  startedAt: null,
  updatedAt: null
};


// ============================================================
// DATA/HORA
// ============================================================

function now() {
  return new Date().toISOString();
}


// ============================================================
// INICIALIZAR
// ============================================================

export function initializeAutomationRunner() {

  runnerState = {
    active: true,
    running: false,
    currentId: null,
    currentName: null,
    lastResult: null,
    lastError: null,
    executed: 0,
    completed: 0,
    failed: 0,
    startedAt: null,
    updatedAt: now()
  };

  return {
    ok: true,
    state: getAutomationRunnerState()
  };
}


// ============================================================
// ATIVAR
// ============================================================

export function activateAutomationRunner() {

  runnerState.active = true;
  runnerState.updatedAt = now();
  runnerState.lastError = null;

  return {
    ok: true,
    active: true
  };
}


// ============================================================
// DESATIVAR
// ============================================================

export function deactivateAutomationRunner() {

  if (runnerState.running) {

    return {
      ok: false,
      error:
        "O executor de automações está ocupado."
    };
  }

  runnerState.active = false;
  runnerState.updatedAt = now();

  return {
    ok: true,
    active: false
  };
}


// ============================================================
// EXECUTAR AUTOMAÇÃO
// ============================================================

export async function executeAutomation(
  automation,
  options = {}
) {

  if (!automation) {

    return {
      ok: false,
      error:
        "Automação não fornecida."
    };
  }


  if (!Array.isArray(automation.steps)) {

    return {
      ok: false,
      error:
        "A automação não possui etapas válidas."
    };
  }


  if (!runnerState.active) {
    activateAutomationRunner();
  }


  if (runnerState.running) {

    return {
      ok: false,
      error:
        "Outra automação já está sendo executada."
    };
  }


  runnerState.running = true;

  runnerState.currentId =
    automation.id || null;

  runnerState.currentName =
    automation.name || "Automação";

  runnerState.startedAt = now();

  runnerState.updatedAt = now();

  runnerState.lastError = null;

  runnerState.executed += 1;


  emit(
    EVENTS.PLAN_STARTED,
    {
      source: "automation-runner",
      automation
    }
  );


  try {

    const result =
      await runAutomation(
        automation,
        options
      );


    runnerState.lastResult =
      result;

    runnerState.updatedAt =
      now();


    if (result?.ok === false) {

      runnerState.failed += 1;

      runnerState.lastError =
        result.error ||
        result.automation?.error ||
        "Automação falhou.";

    } else {

      runnerState.completed += 1;

    }


    // --------------------------------------------------------
    // REGISTRAR NA MEMÓRIA
    // --------------------------------------------------------

    const memoryResult =
      recordAutomation(
        result?.automation ||
        automation,
        result
      );


    emit(
      EVENTS.PLAN_COMPLETED,
      {
        source: "automation-runner",
        automation,
        result,
        memory: memoryResult
      }
    );


    return {

      ok:
        result?.ok !== false,

      automation:
        result?.automation ||
        automation,

      results:
        result?.results ||
        [],

      memory:
        memoryResult,

      error:
        result?.error ||
        null

    };

  } catch (error) {

    const message =
      error?.message ||
      String(error);


    runnerState.failed += 1;

    runnerState.lastError =
      message;

    runnerState.updatedAt =
      now();


    const failedResult = {

      ok: false,

      automation,

      error:
        message

    };


    // --------------------------------------------------------
    // REGISTRAR FALHA NA MEMÓRIA
    // --------------------------------------------------------

    let memoryResult = null;


    try {

      memoryResult =
        recordAutomation(
          automation,
          failedResult
        );

    } catch {
      memoryResult = null;
    }


    emit(
      EVENTS.SYSTEM_ERROR,
      {
        source:
          "automation-runner",

        error:
          message
      }
    );


    return {

      ok: false,

      automation,

      error:
        message,

      memory:
        memoryResult

    };

  } finally {

    runnerState.running = false;

    runnerState.currentId = null;

    runnerState.currentName = null;

    runnerState.updatedAt = now();

  }
}


// ============================================================
// EXECUTAR AUTOMATIZAÇÃO SIMPLES
// ============================================================

export async function executeSimpleAutomation(
  name,
  steps,
  options = {}
) {

  if (!name) {

    return {
      ok: false,
      error:
        "Nome da automação obrigatório."
    };
  }


  if (
    !Array.isArray(steps) ||
    steps.length === 0
  ) {

    return {
      ok: false,
      error:
        "A automação precisa possuir etapas."
    };
  }


  const automation = {

    id:
      `AUTO-RUN-${Date.now()}`,

    name:
      String(name).trim(),

    description:
      options.description || "",

    steps:
      steps.map(
        (step, index) => ({

          id:
            step.id ||
            `STEP-${index + 1}`,

          name:
            step.name ||
            `Etapa ${index + 1}`,

          type:
            step.type ||
            "task",

          action:
            step.action ||
            null,

          input:
            step.input ||
            null,

          status:
            "pending",

          result:
            null,

          error:
            null

        })
      ),

    status:
      "created",

    createdAt:
      now(),

    updatedAt:
      now(),

    metadata:
      options.metadata || {}

  };


  return await executeAutomation(
    automation,
    options
  );
}


// ============================================================
// STATUS
// ============================================================

export function getAutomationRunnerState() {

  return {
    ...runnerState
  };

}


// ============================================================
// VISÃO GERAL
// ============================================================

export function getAutomationRunnerOverview() {

  return {

    ok: true,

    runner:
      getAutomationRunnerState(),

    automation:
      getAutomationState()

  };

}


// ============================================================
// CANCELAR
// ============================================================

export function cancelRunningAutomation() {

  if (!runnerState.running) {

    return {
      ok: false,
      error:
        "Nenhuma automação está sendo executada."
    };
  }


  runnerState.lastError =
    "Solicitação de cancelamento enviada.";

  runnerState.updatedAt =
    now();


  return {

    ok: true,

    requested: true,

    message:
      "Cancelamento solicitado."

  };

}


// ============================================================
// TESTE
// ============================================================

export async function testAutomationRunner() {

  const result =
    await executeSimpleAutomation(
      "Teste do Automation Runner",
      [

        {
          name:
            "Criar tarefa",

          type:
            "task",

          input:
            "Executar teste do JARVIS"

        },

        {
          name:
            "Aguardar",

          type:
            "wait",

          input:
            100

        },

        {
          name:
            "Registrar",

          type:
            "log",

          input:
            "Runner finalizado."

        }

      ]
    );


  return {

    ok:
      result.ok !== false,

    result,

    state:
      getAutomationRunnerState()

  };

}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseAutomationRunner() {

  return {

    ok: true,

    version:
      AUTOMATION_RUNNER_VERSION,

    active:
      runnerState.active,

    running:
      runnerState.running,

    executed:
      runnerState.executed,

    completed:
      runnerState.completed,

    failed:
      runnerState.failed,

    currentId:
      runnerState.currentId,

    currentName:
      runnerState.currentName,

    lastError:
      runnerState.lastError,

    timestamp:
      now()

  };

}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getAutomationRunnerInfo() {

  return {

    name:
      "JARVIS Automation Runner",

    version:
      AUTOMATION_RUNNER_VERSION,

    capabilities: [

      "automation execution",

      "multi-step execution",

      "execution state",

      "success tracking",

      "failure tracking",

      "automation memory integration",

      "execution diagnostics"

    ]

  };

}
