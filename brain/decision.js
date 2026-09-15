// ============================================================
// JARVIS V6 — DECISION ENGINE
// Versão: 1.0.0
// Função: decidir a melhor ação para cada solicitação
// ============================================================

import {
  reason
} from "./reasoning.js";

import {
  createPlan
} from "./planner.js";

import {
  buildAIContext
} from "./context-memory.js";

import {
  getBrainState
} from "./state.js";

const DECISION_VERSION = "1.0.0";


// ============================================================
// TIPOS DE DECISÃO
// ============================================================

export const DECISIONS = {

  ANSWER:
    "answer",

  SEARCH:
    "search",

  COMMAND:
    "command",

  MEMORY:
    "memory",

  LEARN:
    "learn",

  BRAIN:
    "brain",

  AI:
    "ai",

  CLARIFY:
    "clarify"
};


// ============================================================
// UTILITÁRIOS
// ============================================================

function now() {

  return new Date()
    .toISOString();
}


function clean(value) {

  return String(
    value || ""
  ).trim();
}


// ============================================================
// DECISÃO PRINCIPAL
// ============================================================

export async function decide(
  input,
  options = {}
) {

  const text =
    clean(input);


  if (!text) {

    return {

      ok: false,

      decision:
        DECISIONS.CLARIFY,

      reason:
        "Nenhuma solicitação foi recebida.",

      timestamp:
        now()
    };
  }


  const analysis =
    reason(text);


  const context =
    await buildAIContext(
      text,
      options
    );


  let decision =
    DECISIONS.AI;


  let explanation =
    "A solicitação será processada pela inteligência.";


  // ----------------------------------------------------------
  // HORA / DATA
  // ----------------------------------------------------------

  if (
    analysis.intent ===
      "time" ||
    analysis.intent ===
      "date"
  ) {

    decision =
      DECISIONS.ANSWER;

    explanation =
      "A informação pode ser obtida diretamente do contexto temporal do dispositivo.";
  }


  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  else if (
    analysis.intent ===
    "status"
  ) {

    decision =
      DECISIONS.ANSWER;

    explanation =
      "O estado pode ser obtido diretamente do dispositivo.";
  }


  // ----------------------------------------------------------
  // PESQUISA
  // ----------------------------------------------------------

  else if (
    analysis.intent ===
      "search" ||
    analysis.route ===
      "web"
  ) {

    decision =
      DECISIONS.SEARCH;

    explanation =
      "A solicitação precisa de informações externas e atualizadas.";
  }


  // ----------------------------------------------------------
  // APLICATIVO / COMANDO
  // ----------------------------------------------------------

  else if (
    analysis.intent ===
      "open_app" ||
    analysis.route ===
      "command"
  ) {

    decision =
      DECISIONS.COMMAND;

    explanation =
      "A solicitação corresponde a uma ação no dispositivo.";
  }


  // ----------------------------------------------------------
  // MEMÓRIA
  // ----------------------------------------------------------

  else if (
    analysis.intent ===
      "memory" ||
    analysis.route ===
      "memory"
  ) {

    decision =
      DECISIONS.MEMORY;

    explanation =
      "A solicitação requer consulta ou gerenciamento da memória.";
  }


  // ----------------------------------------------------------
  // APRENDIZADO
  // ----------------------------------------------------------

  else if (
    analysis.intent ===
      "learning"
  ) {

    decision =
      DECISIONS.LEARN;

    explanation =
      "A solicitação envolve aprendizado ou evolução do conhecimento.";
  }


  // ----------------------------------------------------------
  // CÉREBRO
  // ----------------------------------------------------------

  else if (
    analysis.intent ===
      "brain" ||
    analysis.route ===
      "brain"
  ) {

    decision =
      DECISIONS.BRAIN;

    explanation =
      "A solicitação requer acesso às informações internas do cérebro.";
  }


  return {

    ok: true,

    input:
      text,

    decision,

    explanation,

    analysis,

    context,

    timestamp:
      now(),

    version:
      DECISION_VERSION
  };
}


// ============================================================
// DECIDIR E CRIAR PLANO
// ============================================================

export async function decideAndPlan(
  input,
  options = {}
) {

  const decision =
    await decide(
      input,
      options
    );


  if (!decision.ok) {

    return decision;
  }


  const plan =
    createPlan(
      input
    );


  return {

    ...decision,

    plan
  };
}


// ============================================================
// VERIFICAR SE PRECISA DE IA
// ============================================================

export async function needsAI(
  input
) {

  const result =
    await decide(
      input
    );


  return (
    result.decision ===
      DECISIONS.AI
  );
}


// ============================================================
// VERIFICAR SE PRECISA DE PESQUISA
// ============================================================

export async function needsWebSearch(
  input
) {

  const result =
    await decide(
      input
    );


  return (
    result.decision ===
      DECISIONS.SEARCH
  );
}


// ============================================================
// VERIFICAR SE É COMANDO
// ============================================================

export async function needsCommand(
  input
) {

  const result =
    await decide(
      input
    );


  return (
    result.decision ===
      DECISIONS.COMMAND
  );
}


// ============================================================
// VERIFICAR SE ENVOLVE MEMÓRIA
// ============================================================

export async function needsMemory(
  input
) {

  const result =
    await decide(
      input
    );


  return (
    result.decision ===
      DECISIONS.MEMORY
  );
}


// ============================================================
// EXPLICAR DECISÃO
// ============================================================

export async function explainDecision(
  input
) {

  const result =
    await decide(
      input
    );


  if (!result.ok) {

    return {

      ok: false,

      explanation:
        result.reason
    };
  }


  return {

    ok: true,

    decision:
      result.decision,

    explanation:
      result.explanation,

    intent:
      result.analysis?.intent ||
      null,

    route:
      result.analysis?.route ||
      null,

    timestamp:
      now()
  };
}


// ============================================================
// DECISÃO COM ESTADO DO CÉREBRO
// ============================================================

export async function getDecisionState(
  input
) {

  const result =
    await decide(
      input
    );


  return {

    brain:
      getBrainState(),

    decision:
      result,

    timestamp:
      now()
  };
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export async function diagnoseDecision() {

  try {

    const tests = [

      "que horas são",

      "que dia é hoje",

      "pesquise inteligência artificial",

      "abra o YouTube",

      "o que você sabe sobre tecnologia",

      "mostre seu cérebro",

      "explique o que é inteligência artificial"
    ];


    const results = [];


    for (
      const test
      of tests
    ) {

      const result =
        await decide(
          test
        );


      results.push({

        input:
          test,

        decision:
          result.decision,

        intent:
          result.analysis?.intent ||
          null,

        route:
          result.analysis?.route ||
          null
      });
    }


    return {

      ok: true,

      version:
        DECISION_VERSION,

      tests:
        results,

      timestamp:
        now()
    };

  } catch (error) {

    return {

      ok: false,

      version:
        DECISION_VERSION,

      error:
        error?.message ||
        "Erro no motor de decisão.",

      timestamp:
        now()
    };
  }
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getDecisionInfo() {

  return {

    name:
      "JARVIS DECISION ENGINE",

    version:
      DECISION_VERSION,

    decisions:
      Object.values(
        DECISIONS
      ),

    purpose:
      "Determinar a melhor rota para cada solicitação.",

    timestamp:
      now()
  };
    }
