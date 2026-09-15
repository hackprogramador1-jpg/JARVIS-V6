// ============================================================
// JARVIS V6 — REASONING ENGINE
// Versão: 1.0.0
// Função: decidir como cada solicitação deve ser processada
// ============================================================

import {
  think,
  prepareContext,
  getBrainState
} from "./brain.js";

const REASONING_VERSION = "1.0.0";

const ROUTES = Object.freeze({
  DEVICE: "device",
  MEMORY: "memory",
  WEB: "web",
  COMMAND: "command",
  AI: "ai",
  BRAIN: "brain",
  UNKNOWN: "unknown"
});


// ============================================================
// PRIORIDADES
// ============================================================

const PRIORITY = Object.freeze({
  CRITICAL: 100,
  HIGH: 80,
  NORMAL: 50,
  LOW: 20
});


// ============================================================
// CLASSIFICAR ROTA
// ============================================================

function selectRoute(analysis) {

  if (!analysis) {
    return ROUTES.UNKNOWN;
  }

  switch (analysis.intent) {

    case "time":
    case "date":
    case "status":
      return ROUTES.DEVICE;

    case "search":
      return ROUTES.WEB;

    case "open_app":
      return ROUTES.COMMAND;

    case "memory":
    case "learning":
      return ROUTES.MEMORY;

    case "brain":
      return ROUTES.BRAIN;

    case "chat":
      return ROUTES.AI;

    default:
      return ROUTES.UNKNOWN;
  }
}


// ============================================================
// DETERMINAR PRIORIDADE
// ============================================================

function calculatePriority(
  analysis,
  context
) {

  if (!analysis) {
    return PRIORITY.LOW;
  }

  if (
    analysis.intent === "open_app" ||
    analysis.intent === "time" ||
    analysis.intent === "date"
  ) {
    return PRIORITY.HIGH;
  }

  if (
    context?.hasMemory ||
    context?.hasLearnedKnowledge
  ) {
    return PRIORITY.HIGH;
  }

  if (analysis.intent === "search") {
    return PRIORITY.NORMAL;
  }

  return PRIORITY.NORMAL;
}


// ============================================================
// DECIDIR SE PRECISA DA IA
// ============================================================

function requiresAI(route) {

  return (
    route === ROUTES.AI
  );
}


// ============================================================
// DECIDIR SE PRECISA DA WEB
// ============================================================

function requiresWeb(route) {

  return (
    route === ROUTES.WEB
  );
}


// ============================================================
// DECISÃO PRINCIPAL
// ============================================================

export function reason(input) {

  const text =
    String(input || "").trim();

  if (!text) {

    return {
      ok: false,
      error: "Entrada vazia."
    };
  }


  const thought =
    think(text);

  if (!thought.ok) {
    return thought;
  }


  const route =
    selectRoute(
      thought.analysis
    );


  const priority =
    calculatePriority(
      thought.analysis,
      thought
    );


  return {

    ok: true,

    input: text,

    route,

    priority,

    intent:
      thought.analysis.intent,

    action:
      thought.analysis.action,

    query:
      thought.analysis.query || null,

    target:
      thought.analysis.target || null,

    requiresAI:
      requiresAI(route),

    requiresWeb:
      requiresWeb(route),

    hasMemory:
      thought.hasMemory,

    hasLearnedKnowledge:
      thought.hasLearnedKnowledge,

    context:
      thought.context,

    timestamp:
      new Date().toISOString()
  };
}


// ============================================================
// PLANO DE EXECUÇÃO
// ============================================================

export function createPlan(input) {

  const decision =
    reason(input);

  if (!decision.ok) {
    return decision;
  }


  const steps = [];


  switch (decision.route) {

    case ROUTES.DEVICE:

      steps.push({
        order: 1,
        type: "device",
        action:
          decision.action
      });

      break;


    case ROUTES.MEMORY:

      steps.push({
        order: 1,
        type: "memory",
        action:
          decision.action
      });

      break;


    case ROUTES.WEB:

      steps.push({
        order: 1,
        type: "web",
        action: "SEARCH_WEB",
        query:
          decision.query
      });

      break;


    case ROUTES.COMMAND:

      steps.push({
        order: 1,
        type: "command",
        action:
          decision.action,
        target:
          decision.target
      });

      break;


    case ROUTES.BRAIN:

      steps.push({
        order: 1,
        type: "brain",
        action:
          "BRAIN_OPERATION"
      });

      break;


    case ROUTES.AI:

      if (decision.hasMemory) {

        steps.push({
          order: 1,
          type: "memory",
          action:
            "LOAD_CONTEXT"
        });
      }


      if (
        decision.hasLearnedKnowledge
      ) {

        steps.push({
          order:
            steps.length + 1,
          type: "knowledge",
          action:
            "LOAD_LEARNED_KNOWLEDGE"
        });
      }


      steps.push({
        order:
          steps.length + 1,
        type: "ai",
        action:
          "ASK_AI"
      });

      break;


    default:

      steps.push({
        order: 1,
        type: "unknown",
        action:
          "REQUEST_CLARIFICATION"
      });

      break;
  }


  return {

    ok: true,

    input:
      decision.input,

    route:
      decision.route,

    priority:
      decision.priority,

    steps,

    timestamp:
      new Date().toISOString()
  };
}


// ============================================================
// PREPARAR CONTEXTO PARA O RACIOCÍNIO
// ============================================================

export function prepareReasoningContext(
  input
) {

  const context =
    prepareContext(input);

  if (!context.ok) {
    return context;
  }


  return {

    ok: true,

    input:
      context.input,

    intent:
      context.intent,

    action:
      context.action,

    route:
      selectRoute({
        intent:
          context.intent
      }),

    query:
      context.query,

    target:
      context.target,

    memories:
      context.memories,

    learned:
      context.learned,

    owner:
      context.owner,

    memoryStats:
      context.memoryStats,

    timestamp:
      context.timestamp
  };
}


// ============================================================
// ANALISAR NECESSIDADE DE PESQUISA
// ============================================================

export function shouldSearchWeb(
  input
) {

  const decision =
    reason(input);

  if (!decision.ok) {
    return false;
  }

  return (
    decision.route ===
    ROUTES.WEB
  );
}


// ============================================================
// ANALISAR NECESSIDADE DE MEMÓRIA
// ============================================================

export function shouldUseMemory(
  input
) {

  const decision =
    reason(input);

  if (!decision.ok) {
    return false;
  }

  return (
    decision.hasMemory ||
    decision.hasLearnedKnowledge ||
    decision.route ===
      ROUTES.MEMORY ||
    decision.route ===
      ROUTES.AI
  );
}


// ============================================================
// ANALISAR NECESSIDADE DE EXECUÇÃO
// ============================================================

export function shouldExecuteCommand(
  input
) {

  const decision =
    reason(input);

  if (!decision.ok) {
    return false;
  }

  return (
    decision.route ===
    ROUTES.COMMAND
  );
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function getReasoningInfo() {

  return {

    name:
      "JARVIS REASONING ENGINE",

    version:
      REASONING_VERSION,

    active:
      true,

    routes: [
      ROUTES.DEVICE,
      ROUTES.MEMORY,
      ROUTES.WEB,
      ROUTES.COMMAND,
      ROUTES.AI,
      ROUTES.BRAIN
    ],

    core:
      getBrainState(),

    timestamp:
      new Date().toISOString()
  };
}


// ============================================================
// EXPORTA ROTAS
// ============================================================

export {
  ROUTES,
  PRIORITY
};
