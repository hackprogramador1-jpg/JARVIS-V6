// ============================================================
// JARVIS V6 — WORKFLOW MANAGER
// Centraliza criação, execução e memória de workflows
// ============================================================

import {
  initializeWorkflow,
  activateWorkflow,
  deactivateWorkflow,
  createWorkflow,
  runWorkflow,
  runSimpleWorkflow,
  getWorkflowState,
  getWorkflowOverview,
  cancelWorkflow,
  testWorkflow,
  diagnoseWorkflow,
  getWorkflowInfo
} from "./workflow.js";

import {
  recordWorkflow,
  getWorkflowHistory,
  getLastWorkflow,
  searchWorkflowMemory,
  favoriteWorkflow,
  unfavoriteWorkflow,
  isWorkflowFavorite,
  getWorkflowMemoryStats,
  exportWorkflowMemory,
  diagnoseWorkflowMemory,
  getWorkflowMemoryInfo
} from "./workflow-memory.js";

import { emit } from "./events.js";

export const WORKFLOW_MANAGER_VERSION = "1.0.0";

// ============================================================
// INICIALIZAÇÃO
// ============================================================

export function initializeWorkflowManager() {
  initializeWorkflow();
  activateWorkflow();

  emit("system:ready", {
    module: "workflow-manager",
    version: WORKFLOW_MANAGER_VERSION
  });

  return {
    ok: true,
    version: WORKFLOW_MANAGER_VERSION,
    active: true
  };
}

// ============================================================
// ATIVAÇÃO
// ============================================================

export function activateWorkflowManager() {
  initializeWorkflow();
  activateWorkflow();

  return {
    ok: true,
    active: true
  };
}

export function deactivateWorkflowManager() {
  deactivateWorkflow();

  return {
    ok: true,
    active: false
  };
}

// ============================================================
// CRIAR WORKFLOW
// ============================================================

export function addWorkflow(name, steps = [], options = {}) {
  if (!name || typeof name !== "string") {
    return {
      ok: false,
      error: "Nome do workflow é obrigatório."
    };
  }

  if (!Array.isArray(steps)) {
    return {
      ok: false,
      error: "As etapas precisam estar em um array."
    };
  }

  const workflow = createWorkflow(name, steps, options);

  emit("plan:created", {
    source: "workflow-manager",
    workflow
  });

  return {
    ok: true,
    workflow
  };
}

// ============================================================
// EXECUTAR WORKFLOW
// ============================================================

export async function executeWorkflow(workflow, options = {}) {
  if (!workflow) {
    return {
      ok: false,
      error: "Workflow não informado."
    };
  }

  try {
    const result = await runWorkflow(workflow, options);

    // Salva automaticamente no histórico
    recordWorkflow(workflow, result);

    emit("plan:completed", {
      source: "workflow-manager",
      workflow,
      result
    });

    return {
      ok: result?.ok !== false,
      workflow,
      result
    };

  } catch (error) {
    const errorMessage =
      error?.message || "Erro ao executar workflow.";

    const failure = {
      ok: false,
      error: errorMessage
    };

    recordWorkflow(workflow, failure);

    return failure;
  }
}

// ============================================================
// WORKFLOW SIMPLES
// ============================================================

export async function executeSimpleWorkflow(
  name,
  steps = [],
  options = {}
) {
  if (!name) {
    return {
      ok: false,
      error: "Nome do workflow é obrigatório."
    };
  }

  try {
    const result = await runSimpleWorkflow(
      name,
      steps,
      options
    );

    const workflow =
      result?.workflow ||
      {
        name,
        steps
      };

    recordWorkflow(workflow, result);

    return {
      ok: result?.ok !== false,
      workflow,
      result
    };

  } catch (error) {
    return {
      ok: false,
      error: error?.message || "Erro no workflow."
    };
  }
}

// ============================================================
// BUSCAR WORKFLOWS
// ============================================================

export function listWorkflows(limit = 50) {
  return getWorkflowHistory(limit);
}

export function findWorkflows(query) {
  return searchWorkflowMemory(query);
}

export function getLastWorkflowExecuted() {
  return getLastWorkflow();
}

// ============================================================
// FAVORITOS
// ============================================================

export function favoriteWorkflowById(id) {
  return favoriteWorkflow(id);
}

export function unfavoriteWorkflowById(id) {
  return unfavoriteWorkflow(id);
}

export function checkWorkflowFavorite(id) {
  return isWorkflowFavorite(id);
}

// ============================================================
// CANCELAMENTO
// ============================================================

export function cancelCurrentWorkflow() {
  return cancelWorkflow();
}

// ============================================================
// STATUS
// ============================================================

export function getWorkflowManagerStatus() {
  return {
    ok: true,
    version: WORKFLOW_MANAGER_VERSION,
    workflow: getWorkflowState(),
    overview: getWorkflowOverview(),
    memory: getWorkflowMemoryStats()
  };
}

// ============================================================
// MEMÓRIA
// ============================================================

export function getWorkflowHistoryData(limit = 50) {
  return getWorkflowHistory(limit);
}

export function getWorkflowStats() {
  return getWorkflowMemoryStats();
}

export function exportWorkflows() {
  return exportWorkflowMemory();
}

// ============================================================
// TESTE
// ============================================================

export async function testWorkflowManager() {
  try {
    initializeWorkflowManager();

    const test = await testWorkflow();

    return {
      ok: test?.ok !== false,
      manager: true,
      workflow: test
    };

  } catch (error) {
    return {
      ok: false,
      manager: false,
      error: error?.message || "Falha no teste."
    };
  }
}

// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseWorkflowManager() {
  const workflow = diagnoseWorkflow();
  const memory = diagnoseWorkflowMemory();

  return {
    ok:
      workflow?.ok !== false &&
      memory?.ok !== false,

    version: WORKFLOW_MANAGER_VERSION,

    workflow,
    memory
  };
}

// ============================================================
// INFORMAÇÕES
// ============================================================

export function getWorkflowManagerInfo() {
  return {
    version: WORKFLOW_MANAGER_VERSION,

    manager: {
      initialized: true,
      centralized: true
    },

    workflow: getWorkflowInfo(),

    memory: getWorkflowMemoryInfo()
  };
}

// ============================================================
// AUTO-INICIALIZAÇÃO
// ============================================================

initializeWorkflowManager();
