// ============================================================
// JARVIS V6 — CENTRAL ROUTER
// Versão: 1.0.0
// ============================================================

import {
  analyzeRequest
} from "./core.js";

import {
  reason
} from "./reasoning.js";

import {
  decide
} from "./decision.js";

import {
  createPlan
} from "./planner.js";

import {
  executeRequest
} from "./executor.js";

import {
  buildFullContext
} from "./context-memory.js";

import {
  registerInput,
  registerThought,
  registerPlan,
  registerExecution,
  registerResult,
  registerError,
  returnToIdle
} from "./state.js";


// ============================================================
// VERSÃO
// ============================================================

export const ROUTER_VERSION = "1.0.0";


// ============================================================
// PROCESSAR COMANDO
// ============================================================

export async function routeRequest(
  input,
  options = {}
) {

  const startedAt =
    Date.now();


  if (
    typeof input !== "string" ||
    !input.trim()
  ) {

    return {

      ok: false,

      error:
        "Comando vazio."
    };
  }


  const text =
    input.trim();


  try {

    // --------------------------------------------------------
    // 1. REGISTRAR ENTRADA
    // --------------------------------------------------------

    registerInput(
      text
    );


    // --------------------------------------------------------
    // 2. ANALISAR
    // --------------------------------------------------------

    const analysis =
      analyzeRequest(
        text
      );


    // --------------------------------------------------------
    // 3. RACIOCINAR
    // --------------------------------------------------------

    const reasoning =
      reason(
        text,
        options
      );


    registerThought(
      reasoning
    );


    // --------------------------------------------------------
    // 4. TOMAR DECISÃO
    // --------------------------------------------------------

    const decision =
      decide(
        text,
        options
      );


    // --------------------------------------------------------
    // 5. MONTAR CONTEXTO
    // --------------------------------------------------------

    const context =
      buildFullContext(
        text,
        options
      );


    // --------------------------------------------------------
    // 6. CRIAR PLANO
    // --------------------------------------------------------

    const plan =
      createPlan(
        text,
        options
      );


    registerPlan(
      plan
    );


    // --------------------------------------------------------
    // 7. EXECUTAR
    // --------------------------------------------------------

    const result =
      await executeRequest(
        text,
        {

          ...options,

          analysis,

          reasoning,

          decision,

          context,

          plan
        }
      );


    registerExecution(
      result
    );


    registerResult(
      result
    );


    returnToIdle();


    // --------------------------------------------------------
    // RESPOSTA FINAL
    // --------------------------------------------------------

    return {

      ok:
        result?.ok !== false,

      input:
        text,

      analysis,

      reasoning,

      decision,

      plan,

      result,

      elapsed:
        Date.now() - startedAt,

      timestamp:
        new Date().toISOString()
    };


  } catch (error) {

    console.error(
      "JARVIS ROUTER ERROR:",
      error
    );


    registerError(
      error
    );


    returnToIdle();


    return {

      ok: false,

      input:
        text,

      error:
        error?.message ||
        "Erro ao processar comando.",

      elapsed:
        Date.now() - startedAt,

      timestamp:
        new Date().toISOString()
    };
  }
}


// ============================================================
// SOMENTE ANALISAR
// ============================================================

export function analyzeOnly(
  input
) {

  const analysis =
    analyzeRequest(
      input
    );

  const reasoning =
    reason(
      input
    );

  const decision =
    decide(
      input
    );


  return {

    ok: true,

    input,

    analysis,

    reasoning,

    decision
  };
}


// ============================================================
// SOMENTE CRIAR PLANO
// ============================================================

export function planOnly(
  input,
  options = {}
) {

  const plan =
    createPlan(
      input,
      options
    );


  return {

    ok: true,

    input,

    plan
  };
}


// ============================================================
// CONTEXTO DO COMANDO
// ============================================================

export function contextOnly(
  input,
  options = {}
) {

  return {

    ok: true,

    input,

    context:
      buildFullContext(
        input,
        options
      )
  };
}


// ============================================================
// TESTE DO ROUTER
// ============================================================

export async function testRouter() {

  const tests = [

    "que horas são",

    "qual é a data de hoje",

    "qual é o status do sistema",

    "pesquise inteligência artificial",

    "abra o YouTube",

    "lembre que eu gosto de tecnologia",

    "como está o cérebro"
  ];


  const results = [];


  for (
    const test
    of tests
  ) {

    try {

      results.push({

        input:
          test,

        result:
          analyzeOnly(
            test
          )

      });

    } catch (error) {

      results.push({

        input:
          test,

        ok: false,

        error:
          error?.message
      });
    }
  }


  return {

    ok: true,

    tests:
      results
  };
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseRouter() {

  return {

    ok: true,

    version:
      ROUTER_VERSION,

    module:
      "central-router",

    capabilities: [

      "input",

      "analysis",

      "reasoning",

      "decision",

      "context",

      "planning",

      "execution",

      "result"

    ],

    timestamp:
      new Date().toISOString()
  };
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getRouterInfo() {

  return {

    name:
      "JARVIS Central Router",

    version:
      ROUTER_VERSION,

    role:
      "Orquestrar o processamento de comandos.",

    flow: [

      "input",

      "core",

      "reasoning",

      "decision",

      "context",

      "planner",

      "executor",

      "result"

    ]
  };
      }
