// ============================================================
// JARVIS V6 — PLANNER
// Versão: 1.0.0
// Função: planejar ações antes da execução
// ============================================================

import {
  reason,
  shouldSearchWeb,
  shouldUseMemory,
  shouldExecuteCommand
} from "./reasoning.js";

import {
  getDateTime,
  getDeviceStatus
} from "./tools.js";

const PLANNER_VERSION = "1.0.0";


// ============================================================
// UTILITÁRIO
// ============================================================

function createId() {

  return (
    "PLAN-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );
}


function now() {
  return new Date().toISOString();
}


// ============================================================
// CRIAR ETAPA
// ============================================================

function step(
  type,
  action,
  description,
  data = {}
) {

  return {

    id:
      createId(),

    type,

    action,

    description,

    data,

    status:
      "pending",

    createdAt:
      now()
  };
}


// ============================================================
// PLANEJAMENTO PRINCIPAL
// ============================================================

export function createPlan(input) {

  const analysis =
    reason(input);

  const steps = [];

  const {
    route,
    intent,
    action,
    query,
    target
  } = analysis;


  // ----------------------------------------------------------
  // CONTEXTO
  // ----------------------------------------------------------

  if (
    intent === "time" ||
    intent === "date"
  ) {

    steps.push(
      step(
        "tool",
        intent === "time"
          ? "getCurrentTime"
          : "getCurrentDate",

        intent === "time"
          ? "Obter a hora atual do dispositivo."
          : "Obter a data atual do dispositivo."
      )
    );
  }


  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  else if (
    intent === "status"
  ) {

    steps.push(
      step(
        "tool",
        "getDeviceStatus",
        "Consultar o estado atual do dispositivo."
      )
    );
  }


  // ----------------------------------------------------------
  // PESQUISA WEB
  // ----------------------------------------------------------

  else if (
    shouldSearchWeb(
      input
    ) ||
    route === "web"
  ) {

    steps.push(
      step(
        "tool",
        "searchWeb",

        "Pesquisar informações atualizadas na internet.",

        {
          query:
            query ||
            input
        }
      )
    );

    steps.push(
      step(
        "ai",
        "analyzeSearch",

        "Analisar os resultados encontrados e preparar uma resposta."
      )
    );
  }


  // ----------------------------------------------------------
  // ABRIR APLICATIVO
  // ----------------------------------------------------------

  else if (
    shouldExecuteCommand(
      input
    ) ||
    route === "command"
  ) {

    steps.push(
      step(
        "command",
        "openApp",

        "Executar o comando solicitado no dispositivo.",

        {
          target
        }
      )
    );
  }


  // ----------------------------------------------------------
  // MEMÓRIA
  // ----------------------------------------------------------

  else if (
    shouldUseMemory(
      input
    ) ||
    route === "memory"
  ) {

    steps.push(
      step(
        "memory",
        "searchMemory",

        "Consultar informações armazenadas na memória."
      )
    );

    steps.push(
      step(
        "ai",
        "generateMemoryResponse",

        "Usar a memória encontrada para responder."
      )
    );
  }


  // ----------------------------------------------------------
  // CÉREBRO
  // ----------------------------------------------------------

  else if (
    route === "brain"
  ) {

    steps.push(
      step(
        "brain",
        "inspectBrain",

        "Consultar o estado interno do cérebro."
      )
    );
  }


  // ----------------------------------------------------------
  // CONVERSA / IA
  // ----------------------------------------------------------

  else if (
    route === "ai"
  ) {

    steps.push(
      step(
        "ai",
        "think",

        "Processar a solicitação através do núcleo de inteligência."
      )
    );
  }


  // ----------------------------------------------------------
  // DESCONHECIDO
  // ----------------------------------------------------------

  else {

    steps.push(
      step(
        "ai",
        "clarify",

        "Analisar a solicitação e determinar a melhor ação."
      )
    );
  }


  return {

    id:
      createId(),

    input:
      String(input || ""),

    route,

    intent,

    action,

    query,

    target,

    priority:
      analysis.priority,

    steps,

    status:
      "ready",

    createdAt:
      now(),

    version:
      PLANNER_VERSION
  };
}


// ============================================================
// PLANO SIMPLES
// ============================================================

export function createSimplePlan(
  input
) {

  const plan =
    createPlan(input);

  return {

    ...plan,

    steps:
      plan.steps.map(
        item => ({
          action:
            item.action,

          description:
            item.description,

          status:
            item.status
        })
      )
  };
}


// ============================================================
// MARCAR ETAPA COMO EXECUTANDO
// ============================================================

export function startPlanStep(
  plan,
  stepId
) {

  if (
    !plan ||
    !Array.isArray(plan.steps)
  ) {

    return plan;
  }


  return {

    ...plan,

    status:
      "executing",

    steps:
      plan.steps.map(
        item => {

          if (
            item.id !== stepId
          ) {

            return item;
          }

          return {

            ...item,

            status:
              "executing",

            startedAt:
              now()
          };
        }
      )
  };
}


// ============================================================
// FINALIZAR ETAPA
// ============================================================

export function completePlanStep(
  plan,
  stepId,
  result = null
) {

  if (
    !plan ||
    !Array.isArray(plan.steps)
  ) {

    return plan;
  }


  const steps =
    plan.steps.map(
      item => {

        if (
          item.id !== stepId
        ) {

          return item;
        }

        return {

          ...item,

          status:
            "completed",

          result,

          completedAt:
            now()
        };
      }
    );


  const allCompleted =
    steps.every(
      item =>
        item.status ===
        "completed"
    );


  return {

    ...plan,

    steps,

    status:
      allCompleted
        ? "completed"
        : "executing",

    completedAt:
      allCompleted
        ? now()
        : undefined
  };
}


// ============================================================
// FALHAR ETAPA
// ============================================================

export function failPlanStep(
  plan,
  stepId,
  error
) {

  if (
    !plan ||
    !Array.isArray(plan.steps)
  ) {

    return plan;
  }


  return {

    ...plan,

    status:
      "error",

    steps:
      plan.steps.map(
        item => {

          if (
            item.id !== stepId
          ) {

            return item;
          }

          return {

            ...item,

            status:
              "error",

            error:
              String(
                error ||
                "Erro desconhecido."
              ),

            failedAt:
              now()
          };
        }
      ),

    failedAt:
      now()
  };
}


// ============================================================
// PRÓXIMA ETAPA
// ============================================================

export function getNextStep(
  plan
) {

  if (
    !plan ||
    !Array.isArray(plan.steps)
  ) {

    return null;
  }


  return (
    plan.steps.find(
      item =>
        item.status ===
        "pending"
    ) ||
    null
  );
}


// ============================================================
// VERIFICAR SE TERMINOU
// ============================================================

export function isPlanComplete(
  plan
) {

  if (
    !plan ||
    !Array.isArray(plan.steps)
  ) {

    return false;
  }


  return (
    plan.steps.length > 0 &&
    plan.steps.every(
      item =>
        item.status ===
        "completed"
    )
  );
}


// ============================================================
// RESUMO DO PLANO
// ============================================================

export function getPlanSummary(
  plan
) {

  if (!plan) {

    return {

      total: 0,

      pending: 0,

      executing: 0,

      completed: 0,

      errors: 0
    };
  }


  const steps =
    Array.isArray(plan.steps)
      ? plan.steps
      : [];


  return {

    total:
      steps.length,

    pending:
      steps.filter(
        item =>
          item.status ===
          "pending"
      ).length,

    executing:
      steps.filter(
        item =>
          item.status ===
          "executing"
      ).length,

    completed:
      steps.filter(
        item =>
          item.status ===
          "completed"
      ).length,

    errors:
      steps.filter(
        item =>
          item.status ===
          "error"
      ).length
  };
}


// ============================================================
// PRÉVIA DO PLANO
// ============================================================

export function previewPlan(
  input
) {

  const plan =
    createPlan(input);

  return {

    id:
      plan.id,

    input:
      plan.input,

    route:
      plan.route,

    intent:
      plan.intent,

    priority:
      plan.priority,

    steps:
      plan.steps.map(
        item => ({
          action:
            item.action,

          description:
            item.description
        })
      )
  };
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnosePlanner() {

  try {

    const testPlan =
      createPlan(
        "que horas são"
      );


    return {

      ok:
        Boolean(
          testPlan &&
          Array.isArray(
            testPlan.steps
          )
        ),

      version:
        PLANNER_VERSION,

      testIntent:
        testPlan.intent,

      testRoute:
        testPlan.route,

      testSteps:
        testPlan.steps.length,

      timestamp:
        now()
   
