// ============================================================
// JARVIS V6 — AUTOMATION CONTROL
// Controle central das automações
// ============================================================

import {
  initializeAutomationRunner,
  activateAutomationRunner,
  deactivateAutomationRunner,
  executeAutomation,
  executeSimpleAutomation,
  cancelRunningAutomation,
  getAutomationRunnerStatus,
  getAutomationRunnerOverview,
  diagnoseAutomationRunner,
  getAutomationRunnerInfo
} from "./automation-runner.js";

import {
  getAutomationHistory,
  getLastAutomation,
  searchAutomationMemory,
  favoriteAutomation,
  unfavoriteAutomation,
  isAutomationFavorite,
  getAutomationMemoryStats
} from "./automation-memory.js";

import {
  emit
} from "./events.js";

export const AUTOMATION_CONTROL_VERSION = "1.0.0";

let initialized = false;
let active = false;

// ============================================================
// INICIALIZAÇÃO
// ============================================================

export function initializeAutomationControl() {
  try {
    initializeAutomationRunner();

    initialized = true;

    emit("system:ready", {
      module: "automation-control",
      version: AUTOMATION_CONTROL_VERSION
    });

    return {
      ok: true,
      initialized: true,
      version: AUTOMATION_CONTROL_VERSION
    };

  } catch (error) {
    return {
      ok: false,
      initialized: false,
      error: error?.message || "Erro ao inicializar controle de automações."
    };
  }
}

// ============================================================
// ATIVAR
// ============================================================

export function activateAutomationControl() {
  if (!initialized) {
    initializeAutomationControl();
  }

  activateAutomationRunner();

  active = true;

  return {
    ok: true,
    active: true
  };
}

// ============================================================
// DESATIVAR
// ============================================================

export function deactivateAutomationControl() {
  deactivateAutomationRunner();

  active = false;

  return {
    ok: true,
    active: false
  };
}

// ============================================================
// EXECUTAR AUTOMAÇÃO
// ============================================================

export async function runAutomationControl(
  automation,
  options = {}
) {
  if (!automation) {
    return {
      ok: false,
      error: "Automação não informada."
    };
  }

  if (!initialized) {
    initializeAutomationControl();
  }

  if (!active) {
    activateAutomationControl();
  }

  try {
    const result = await executeAutomation(
      automation,
      options
    );

    emit("execution:completed", {
      source: "automation-control",
      automation,
      result
    });

    return {
      ok: result?.ok !== false,
      automation,
      result
    };

  } catch (error) {
    return {
      ok: false,
      error: error?.message || "Erro ao executar automação."
    };
  }
}

// ============================================================
// AUTOMAÇÃO SIMPLES
// ============================================================

export async function runSimpleAutomationControl(
  name,
  steps = [],
  options = {}
) {
  if (!name) {
    return {
      ok: false,
      error: "Nome da automação é obrigatório."
    };
  }

  if (!Array.isArray(steps)) {
    return {
      ok: false,
      error: "As etapas precisam estar em um array."
    };
  }

  if (!initialized) {
    initializeAutomationControl();
  }

  if (!active) {
    activateAutomationControl();
  }

  try {
    const result = await executeSimpleAutomation(
      name,
      steps,
      options
    );

    return {
      ok: result?.ok !== false,
      result
    };

  } catch (error) {
    return {
      ok: false,
      error: error?.message || "Erro na automação."
    };
  }
}

// ============================================================
// CANCELAR
// ============================================================

export function cancelAutomationControl() {
  const result = cancelRunningAutomation();

  emit("execution:completed", {
    source: "automation-control",
    action: "cancel",
    result
  });

  return result;
}

// ============================================================
// HISTÓRICO
// ============================================================

export function getAutomationHistoryData(limit = 50) {
  return getAutomationHistory(limit);
}

export function getLastAutomationExecuted() {
  return getLastAutomation();
}

export function searchAutomations(query) {
  return searchAutomationMemory(query);
}

// ============================================================
// FAVORITOS
// ============================================================

export function favoriteAutomationById(id) {
  return favoriteAutomation(id);
}

export function unfavoriteAutomationById(id) {
  return unfavoriteAutomation(id);
}

export function checkAutomationFavorite(id) {
  return isAutomationFavorite(id);
}

// ============================================================
// STATUS
// ============================================================

export function getAutomationControlStatus() {
  return {
    ok: true,
    version: AUTOMATION_CONTROL_VERSION,
    initialized,
    active,
    runner: getAutomationRunnerStatus(),
    overview: getAutomationRunnerOverview(),
    memory: getAutomationMemoryStats()
  };
}

// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseAutomationControl() {
  let runner;

  try {
    runner = diagnoseAutomationRunner();
  } catch (error) {
    runner = {
      ok: false,
      error: error?.message || "Falha no diagnóstico."
    };
  }

  return {
    ok: runner?.ok !== false,
    version: AUTOMATION_CONTROL_VERSION,
    initialized,
    active,
    runner,
    memory: getAutomationMemoryStats()
  };
}

// ============================================================
// INFORMAÇÕES
// ============================================================

export function getAutomationControlInfo() {
  return {
    version: AUTOMATION_CONTROL_VERSION,

    initialized,

    active,

    runner: getAutomationRunnerInfo(),

    memory: getAutomationMemoryStats()
  };
}

// ============================================================
// TESTE
// ============================================================

export async function testAutomationControl() {
  try {
    initializeAutomationControl();
    activateAutomationControl();

    const status = getAutomationControlStatus();

    return {
      ok: status?.ok !== false,
      control: true,
      status
    };

  } catch (error) {
    return {
      ok: false,
      control: false,
      error: error?.message || "Teste de automação falhou."
    };
  }
}

// ============================================================
// AUTO-INICIALIZAÇÃO
// ============================================================

initializeAutomationControl();
