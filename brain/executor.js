// ============================================================
// JARVIS V6 — EXECUTOR
// Versão: 1.0.0
// Função: executar planos produzidos pelo cérebro
// ============================================================

import {
  createPlan,
  getNextStep,
  startPlanStep,
  completePlanStep,
  failPlanStep,
  isPlanComplete
} from "./planner.js";

import {
  executeTool
} from "./tools.js";

import {
  searchMemory,
  remember
} from "./memory.js";

import {
  searchKnowledge
} from "./knowledge.js";

import {
  registerExecution,
  registerResult,
  registerError,
  returnToIdle
} from "./state.js";

import {
  decide
} from "./decision.js";

const EXECUTOR_VERSION = "1.0.0";


// ============================================================
// UTILITÁRIOS
// ============================================================

function now() {
  return new Date().toISOString();
}


// ============================================================
// EXECUTAR FERRAMENTA
// ============================================================

async function executeToolStep(
  plan,
  currentStep
) {

  const action =
    currentStep.action;

  let result;


  if (
    action ===
    "getCurrentTime"
  ) {

    result =
      await executeTool(
        "time"
      );
  }

  else if (
    action ===
    "getCurrentDate"
  ) {

    result =
      await executeTool(
        "date"
      );
  }

  else if (
    action ===
    "getDeviceStatus"
  ) {

    result =
      await executeTool(
        "status"
      );
  }

  else if (
    action ===
    "searchWeb"
  ) {

    result =
      await executeTool(
        "search",
        plan.input,
        {

          query:
            currentStep.data?.query
        }
      );
  }

  else if (
    action ===
    "openApp"
  ) {

    result =
      await executeTool(
        "openApp",
        plan.input,
        {

          target:
            currentStep.data?.target
        }
      );
  }

  else {

    result = {

      ok: false,

      error:
        `Ferramenta "${action}" ainda não possui executor.`
    };
  }


  return result;
}


// ============================================================
// EXECUTAR MEMÓRIA
// ============================================================

async function executeMemoryStep(
  plan,
  currentStep
) {

  const query =
    plan.input;


  const results =
    searchMemory(
      query
    );


  return {

    ok: true,

    query,

    results,

    count:
      results.length,

    action:
      currentStep.action,

    tool:
      "memory",

    timestamp:
      now()
  };
}


// ============================================================
// EXECUTAR CONHECIMENTO
// ============================================================

async function executeKnowledgeStep(
  plan,
  currentStep
) {

  const query =
    plan.input;


  const results =
    searchKnowledge(
      query
    );


  return {

    ok: true,

    query,

    results,

    count:
      results.length,

    action:
      currentStep.action,

    tool:
      "knowledge",

    timestamp:
      now()
  };
}


// ============================================================
// EXECUTAR ETAPA
// ============================================================

async function executeStep(
  plan,
  currentStep
) {

  const started =
    startPlanStep(
      plan,
      currentStep.id
    );


  registerExecution(
    currentStep.action,
    plan.input
  );


  let result;


  try {

    switch (
      currentStep.type
    ) {

      case "tool":

        result =
          await executeToolStep(
            started,
            currentStep
          );

        break;


      case "memory":

        result =
          await executeMemoryStep(
            started,
            currentStep
          );

        break;


      case "brain":

        result = {

          ok: true,

          action:
            "inspectBrain",

          message:
            "Estado do cérebro disponível.",

          timestamp:
            now()
        };

        break;


      case "command":

        result =
          await executeToolStep(
            started,
            currentStep
          );

        break;


      case "ai":

        result = {

          ok: true,

          requiresAI:
            true,

          action:
            currentStep.action,

          input:
            plan.input,

          message:
            "Esta etapa deve ser processada pelo motor de IA.",

          timestamp:
            now()
        };

        break;


      default:

        result = {

          ok: false,

          error:
            `Tipo de etapa "${currentStep.type}" desconhecido.`,

          timestamp:
            now()
        };
    }


    if (
      result?.ok === false
    ) {

      return {

        ok: false,

        plan:
          failPlanStep(
            started,
            currentStep.id,
            result.error
          ),

        result
      };
    }


    const completed =
      completePlanStep(
        started,
        currentStep.id,
        result
      );


    registerResult(
      result
    );


    return {

      ok: true,

      plan:
        completed,

      result
    };

  } catch (error) {

    const failed =
      failPlanStep(
        started,
        currentStep.id,
        error
      );


    registerError(
      error
    );


    return {

      ok: false,

      plan:
        failed,

      error:
        error?.message ||
        "Erro durante execução."
    };
  }
}


// ============================================================
// EXECUTAR PLANO COMPLETO
// ============================================================

export async function executePlan(
  plan
) {

  if (
    !plan ||
    !Array.isArray(
      plan.steps
    )
  ) {

    return {

      ok: false,

      error:
        "Plano inválido."
    };
  }


  let currentPlan =
    plan;

  const results = [];


  while (
    !isPlanComplete(
      currentPlan
    )
  ) {

    const next =
      getNextStep(
        currentPlan
      );


    if (!next) {
      break;
    }


    const execution =
      await executeStep(
        currentPlan,
        next
      );


    currentPlan =
      execution.plan ||
      currentPlan;


    results.push(
      execution
    );


    if (
      !execution.ok
    ) {

      return {

        ok: false,

        plan:
          currentPlan,

        results,

        error:
          execution.error ||
          execution.result?.error ||
          "Falha na execução."
      };
    }


    // --------------------------------------------------------
    // ETAPA DE IA
    // --------------------------------------------------------

    if (
      execution.result?.requiresAI
    ) {

      return {

        ok: true,

        requiresAI:
          true,

        plan:
          currentPlan,

        results,

        input:
          plan.input
      };
    }
  }


  returnToIdle();


  return {

    ok:
      isPlanComplete(
        currentPlan
      ),

    completed:
      isPlanComplete(
        currentPlan
      ),

    plan:
      currentPlan,

    results,

    timestamp:
      now(),

    version:
      EXECUTOR_VERSION
  };
}


// ============================================================
// DECIDIR + PLANEJAR + EXECUTAR
// ============================================================

export async function executeRequest(
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
    decision.plan ||
    createPlan(
      input
    );


  const execution =
    await executePlan(
      plan
    );


  return {

    ok:
      execution.ok,

    input:
      String(input || ""),

    decision,

    plan:
      execution.plan,

    execution,

    timestamp:
      now()
  };
}


// ============================================================
// EXECUTAR UMA AÇÃO DIRETA
// ============================================================

export async function executeAction(
  action,
  data = {}
) {

  const fakePlan = {

    id:
      "DIRECT-" +
      Date.now(),

    input:
      data.input ||
      "",

    steps: [

      {

        id:
          "DIRECT-STEP-" +
          Date.now(),

        type:
          data.type ||
          "tool",

        action,

        data,

        status:
          "pending"
      }
    ],

    status:
      "ready"
  };


  return executePlan(
    fakePlan
  );
}


// ============================================================
// TESTAR EXECUTOR
// ============================================================

export async function testExecutor() {

  const tests = [

    "que horas são",

    "que dia é hoje",

    "qual o status do sistema"
  ];


  const results = [];


  for (
    const input
    of tests
  ) {

    try {

      const result =
        await executeRequest(
          input
        );


      results.push({

        input,

        ok:
          result.ok,

        intent:
          result.decision?.analysis?.intent ||
          null,

        route:
          result.decision?.analysis?.route ||
          null,

        steps:
          result.plan?.steps?.length ||
          0
      });

    } catch (error) {

      results.push({

        input,

        ok: false,

        error:
          error?.message ||
          "Erro"
      });
    }
  }


  return {

    ok:
      results.every(
        item =>
          item.ok
      ),

    version:
      EXECUTOR_VERSION,

    results,

    timestamp:
      now()
  };
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export async function diagnoseExecutor() {

  try {

    const result =
      await executeAction(
        "getCurrentTime"
      );


    return {

      ok:
        Boolean(result),

      version:
        EXECUTOR_VERSION,

      test:
        result,

      timestamp:
        now()
    };

  } catch (error) {

    return {

      ok: false,

      version:
        EXECUTOR_VERSION,

      error:
        error?.message ||
        "Erro no executor.",

      timestamp:
        now()
    };
  }
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getExecutorInfo() {

  return {

    name:
      "JARVIS EXECUTOR",

    version:
      EXECUTOR_VERSION,

    capabilities: [

      "execução de planos",

      "execução de ferramentas",

      "memória",

      "conhecimento",

      "comandos",

      "estado do cérebro",

      "integração com IA",

      "diagnóstico"
    ],

    timestamp:
      now()
  };
  }
