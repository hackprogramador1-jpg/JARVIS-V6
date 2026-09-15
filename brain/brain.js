// ============================================================
// JARVIS V6 — BRAIN ORCHESTRATOR
// Versão: 1.0.0
// Função: conectar CORE + MEMORY
// ============================================================

import {
  analyzeRequest,
  getCoreState,
  getCoreInfo,
  setCoreState
} from "./core.js";

import {
  remember,
  learn,
  searchMemory,
  searchLearned,
  getMemoryStats,
  getOwner,
  initializeMemory
} from "./memory.js";


const BRAIN_VERSION = "1.0.0";

let initialized = false;


// ============================================================
// INICIALIZAÇÃO
// ============================================================

export function initializeBrain(owner = null) {

  if (owner) {
    initializeMemory(owner);
  }

  initialized = true;

  setCoreState("idle");

  return getBrainState();
}


// ============================================================
// ESTADO DO CÉREBRO
// ============================================================

export function getBrainState() {

  return {

    active: initialized,

    version: BRAIN_VERSION,

    core:
      getCoreState(),

    memory:
      getMemoryStats(),

    owner:
      getOwner(),

    timestamp:
      new Date().toISOString()
  };
}


// ============================================================
// ANÁLISE COMPLETA
// ============================================================

export function think(input) {

  if (!initialized) {
    initializeBrain();
  }

  const text =
    String(input || "").trim();

  if (!text) {

    return {
      ok: false,
      error: "Entrada vazia."
    };
  }


  const analysis =
    analyzeRequest(text);


  // ----------------------------------------------------------
  // CONSULTAR MEMÓRIA
  // ----------------------------------------------------------

  const memories =
    searchMemory(text, 10);

  const learned =
    searchLearned(text, 10);


  // ----------------------------------------------------------
  // CONTEXTO
  // ----------------------------------------------------------

  const context = {

    memories,

    learned,

    owner:
      getOwner(),

    memoryStats:
      getMemoryStats()
  };


  // ----------------------------------------------------------
  // RESULTADO DO PENSAMENTO
  // ----------------------------------------------------------

  return {

    ok: true,

    brain: "JARVIS",

    version:
      BRAIN_VERSION,

    input: text,

    analysis,

    context,

    hasMemory:
      memories.length > 0,

    hasLearnedKnowledge:
      learned.length > 0,

    timestamp:
      new Date().toISOString()
  };
}


// ============================================================
// LEMBRAR
// ============================================================

export function brainRemember(
  text,
  options = {}
) {

  if (!initialized) {
    initializeBrain();
  }

  return remember(
    text,
    {
      ...options,
      source:
        options.source || "user"
    }
  );
}


// ============================================================
// APRENDER
// ============================================================

export function brainLearn(
  text,
  options = {}
) {

  if (!initialized) {
    initializeBrain();
  }

  return learn(
    text,
    {
      ...options,
      source:
        options.source || "user"
    }
  );
}


// ============================================================
// PENSAMENTO COM MEMÓRIA
// ============================================================

export function prepareContext(input) {

  const thought =
    think(input);

  if (!thought.ok) {
    return thought;
  }


  return {

    input:
      thought.input,

    intent:
      thought.analysis.intent,

    action:
      thought.analysis.action,

    query:
      thought.analysis.query || null,

    target:
      thought.analysis.target || null,

    memories:
      thought.context.memories,

    learned:
      thought.context.learned,

    owner:
      thought.context.owner,

    memoryStats:
      thought.context.memoryStats,

    timestamp:
      thought.timestamp
  };
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseBrain() {

  const core =
    getCoreInfo();

  const memory =
    getMemoryStats();

  const owner =
    getOwner();


  return {

    ok: true,

    brain: {

      name:
        "JARVIS",

      version:
        BRAIN_VERSION,

      active:
        initialized
    },

    core,

    memory,

    owner,

    capabilities: [

      "reasoning",

      "memory",

      "learning",

      "intent_detection",

      "context",

      "command_routing"
    ],

    timestamp:
      new Date().toISOString()
  };
}


// ============================================================
// RESETAR ESTADO DA SESSÃO DO CÉREBRO
// ============================================================

export function resetBrainState() {

  initialized = false;

  setCoreState("idle");

  return {
    ok: true,
    active: false,
    timestamp:
      new Date().toISOString()
  };
    }
