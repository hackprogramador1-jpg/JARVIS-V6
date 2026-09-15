// ============================================================
// JARVIS V6 — SYSTEM CONTROLLER
// Versão: 1.0.0
// ============================================================

import {
  initializeBrain,
  getBrainState,
  diagnoseBrain
} from "./brain.js";

import {
  getCoreInfo
} from "./core.js";

import {
  getReasoningInfo
} from "./reasoning.js";

import {
  getDecisionInfo
} from "./decision.js";

import {
  getPlannerInfo
} from "./planner.js";

import {
  getExecutorInfo
} from "./executor.js";

import {
  getMemoryHealth
} from "./memory.js";

import {
  getKnowledgeInfo
} from "./knowledge.js";

import {
  getLearningInfo
} from "./learning.js";

import {
  getContextInfo
} from "./context.js";

import {
  getToolsInfo
} from "./tools.js";

import {
  getContextMemoryInfo
} from "./context-memory.js";

import {
  getBrainStateInfo
} from "./state.js";


// ============================================================
// VERSÃO
// ============================================================

export const SYSTEM_VERSION = "1.0.0";


// ============================================================
// ESTADO DO SISTEMA
// ============================================================

let systemInitialized = false;

let systemStartedAt = null;


// ============================================================
// INICIALIZAR SISTEMA
// ============================================================

export function initializeSystem(
  owner = null
) {

  try {

    initializeBrain(owner);

    systemInitialized = true;

    systemStartedAt =
      systemStartedAt ||
      new Date().toISOString();


    return {

      ok: true,

      initialized: true,

      version:
        SYSTEM_VERSION,

      startedAt:
        systemStartedAt
    };


  } catch (error) {

    console.error(
      "JARVIS SYSTEM INIT ERROR:",
      error
    );


    return {

      ok: false,

      initialized: false,

      error:
        error?.message ||
        "Falha ao inicializar sistema."
    };
  }
}


// ============================================================
// STATUS GERAL
// ============================================================

export function getSystemStatus() {

  return {

    system:
      "JARVIS V6",

    version:
      SYSTEM_VERSION,

    initialized:
      systemInitialized,

    startedAt:
      systemStartedAt,

    brain:
      getBrainState(),

    timestamp:
      new Date().toISOString()
  };
}


// ============================================================
// DIAGNÓSTICO COMPLETO
// ============================================================

export function diagnoseSystem() {

  const modules = {

    core:
      getCoreInfo(),

    brain:
      diagnoseBrain(),

    reasoning:
      getReasoningInfo(),

    decision:
      getDecisionInfo(),

    planner:
      getPlannerInfo(),

    executor:
      getExecutorInfo(),

    memory:
      getMemoryHealth(),

    knowledge:
      getKnowledgeInfo(),

    learning:
      getLearningInfo(),

    context:
      getContextInfo(),

    tools:
      getToolsInfo(),

    contextMemory:
      getContextMemoryInfo(),

    state:
      getBrainStateInfo()
  };


  const values =
    Object.values(
      modules
    );


  const healthy =
    values.filter(
      item =>
        item?.ok !== false
    ).length;


  const total =
    values.length;


  return {

    ok:
      healthy === total,

    system:
      "JARVIS V6",

    version:
      SYSTEM_VERSION,

    initialized:
      systemInitialized,

    modules,

    summary: {

      healthy,

      total,

      percentage:
        total
          ? Math.round(
              (healthy / total) * 100
            )
          : 0

    },

    timestamp:
      new Date().toISOString()
  };
}


// ============================================================
// SNAPSHOT DO SISTEMA
// ============================================================

export function getSystemSnapshot() {

  return {

    status:
      getSystemStatus(),

    brain:
      getBrainState(),

    diagnostics:
      diagnoseSystem(),

    timestamp:
      new Date().toISOString()
  };
}


// ============================================================
// VERIFICAR SE ESTÁ ONLINE
// ============================================================

export function isSystemOnline() {

  if (
    !systemInitialized
  ) {

    return false;
  }


  const state =
    getBrainState();


  return Boolean(
    state
  );
}


// ============================================================
// REINICIAR ESTADO DA SESSÃO
// ============================================================

export function restartSystem(
  owner = null
) {

  systemInitialized = false;

  systemStartedAt = null;


  return initializeSystem(
    owner
  );
}


// ============================================================
// INFORMAÇÕES DO SISTEMA
// ============================================================

export function getSystemInfo() {

  return {

    name:
      "JARVIS",

    system:
      "JARVIS V6",

    version:
      SYSTEM_VERSION,

    architecture:
      "Core + Brain + Reasoning + Decision + Planner + Executor",

    modules: [

      "core",

      "brain",

      "reasoning",

      "decision",

      "planner",

      "executor",

      "memory",

      "knowledge",

      "learning",

      "context",

      "tools",

      "context-memory",

      "state",

      "system"

    ],

    initialized:
      systemInitialized
  };
    }
