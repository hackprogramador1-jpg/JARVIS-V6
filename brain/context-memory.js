// ============================================================
// JARVIS V6 — CONTEXT MEMORY
// Versão: 1.0.0
// Função: montar o contexto completo para o cérebro
// ============================================================

import {
  getMemory,
  searchMemory,
  searchLearned,
  getMemoryStats
} from "./memory.js";

import {
  searchKnowledge,
  getKnowledgeStats
} from "./knowledge.js";

import {
  getBrainState,
  getRecentEvents,
  getBrainCounters
} from "./state.js";

import {
  getDateTime,
  getDeviceStatus
} from "./tools.js";

const CONTEXT_MEMORY_VERSION = "1.0.0";


// ============================================================
// UTILITÁRIOS
// ============================================================

function now() {
  return new Date().toISOString();
}

function clean(value) {
  return String(value || "").trim();
}


// ============================================================
// CONTEXTO DA PERGUNTA
// ============================================================

export function buildQuestionContext(
  input,
  options = {}
) {

  const question =
    clean(input);

  if (!question) {

    return {

      ok: false,

      error:
        "Pergunta vazia."
    };
  }


  const memoryResults =
    searchMemory(
      question
    );

  const learnedResults =
    searchLearned(
      question
    );

  const knowledgeResults =
    searchKnowledge(
      question
    );


  const limit =
    Number(
      options.limit ||
      10
    );


  return {

    ok: true,

    question,

    memory:
      memoryResults
        .slice(-limit),

    learned:
      learnedResults
        .slice(-limit),

    knowledge:
      knowledgeResults
        .slice(-limit),

    timestamp:
      now()
  };
}


// ============================================================
// CONTEXTO TEMPORAL
// ============================================================

export function buildTimeContext() {

  return getDateTime();
}


// ============================================================
// CONTEXTO DO DISPOSITIVO
// ============================================================

export async function buildDeviceContext() {

  return getDeviceStatus();
}


// ============================================================
// CONTEXTO DO CÉREBRO
// ============================================================

export function buildBrainContext() {

  return {

    state:
      getBrainState(),

    events:
      getRecentEvents(20),

    counters:
      getBrainCounters(),

    timestamp:
      now()
  };
}


// ============================================================
// CONTEXTO DE MEMÓRIA
// ============================================================

export function buildMemoryContext() {

  return {

    memory:
      getMemory(),

    stats:
      getMemoryStats(),

    timestamp:
      now()
  };
}


// ============================================================
// CONTEXTO DE CONHECIMENTO
// ============================================================

export function buildKnowledgeContext() {

  return {

    stats:
      getKnowledgeStats(),

    timestamp:
      now()
  };
}


// ============================================================
// CONTEXTO COMPLETO
// ============================================================

export async function buildFullContext(
  input,
  options = {}
) {

  const questionContext =
    buildQuestionContext(
      input,
      options
    );

  const timeContext =
    buildTimeContext();

  const deviceContext =
    await buildDeviceContext();

  const brainContext =
    buildBrainContext();

  const memoryContext =
    buildMemoryContext();

  const knowledgeContext =
    buildKnowledgeContext();


  return {

    version:
      CONTEXT_MEMORY_VERSION,

    question:
      questionContext,

    time:
      timeContext,

    device:
      deviceContext,

    brain:
      brainContext,

    memory:
      memoryContext,

    knowledge:
      knowledgeContext,

    generatedAt:
      now()
  };
}


// ============================================================
// CONTEXTO REDUZIDO PARA IA
// ============================================================

export async function buildAIContext(
  input,
  options = {}
) {

  const full =
    await buildFullContext(
      input,
      options
    );


  return {

    question:
      full.question,

    time: {

      date:
        full.time.date,

      time:
        full.time.time,

      day:
        full.time.day,

      timeZone:
        full.time.timeZone
    },

    device: {

      online:
        full.device.online,

      language:
        full.device.language,

      platform:
        full.device.platform,

      battery:
        full.device.battery
    },

    brain: {

      status:
        full.brain.state?.status,

      active:
        full.brain.state?.active,

      currentIntent:
        full.brain.state?.currentIntent,

      currentTask:
        full.brain.state?.currentTask
    },

    relevantMemory:
      full.question.memory,

    relevantLearning:
      full.question.learned,

    relevantKnowledge:
      full.question.knowledge,

    timestamp:
      full.generatedAt
  };
}


// ============================================================
// CONTEXTO PARA PESQUISA
// ============================================================

export async function buildSearchContext(
  query
) {

  const value =
    clean(query);


  const context =
    await buildAIContext(
      value
    );


  return {

    query:
      value,

    context,

    instruction:
      "Use informações atuais da pesquisa e considere o contexto local do dispositivo.",

    timestamp:
      now()
  };
}


// ============================================================
// CONTEXTO PARA COMANDO
// ============================================================

export async function buildCommandContext(
  command,
  target = null
) {

  const context =
    await buildAIContext(
      command
    );


  return {

    command:
      clean(command),

    target:
      clean(target),

    context,

    timestamp:
      now()
  };
}


// ============================================================
// CONTEXTO PARA APRENDIZADO
// ============================================================

export async function buildLearningContext(
  topic
) {

  const value =
    clean(topic);


  const context =
    await buildAIContext(
      value
    );


  return {

    topic:
      value,

    context,

    instruction:
      "Compare o novo conhecimento com o que o JARVIS já conhece antes de registrar aprendizado.",

    timestamp:
      now()
  };
}


// ============================================================
// RESUMO DE CONTEXTO
// ============================================================

export async function getContextSummary(
  input
) {

  const context =
    await buildAIContext(
      input
    );


  return {

    question:
      context.question?.question ||
      "",

    time:
      context.time?.time ||
      null,

    date:
      context.time?.date ||
      null,

    day:
      context.time?.day ||
      null,

    online:
      context.device?.online ??
      false,

    battery:
      context.device?.battery ||
      null,

    brainStatus:
      context.brain?.status ||
      null,

    memoryMatches:
      Array.isArray(
        context.relevantMemory
      )
        ? context.relevantMemory.length
        : 0,

    learnedMatches:
      Array.isArray(
        context.relevantLearning
      )
        ? context.relevantLearning.length
        : 0,

    knowledgeMatches:
      Array.isArray(
        context.relevantKnowledge
      )
        ? context.relevantKnowledge.length
        : 0,

    timestamp:
      context.timestamp
  };
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export async function diagnoseContextMemory() {

  try {

    const context =
      await buildFullContext(
        "teste do sistema"
      );


    return {

      ok: true,

      version:
        CONTEXT_MEMORY_VERSION,

      hasQuestion:
        Boolean(
          context.question
        ),

      hasTime:
        Boolean(
          context.time
        ),

      hasDevice:
        Boolean(
          context.device
        ),

      hasBrain:
        Boolean(
          context.brain
        ),

      hasMemory:
        Boolean(
          context.memory
        ),

      hasKnowledge:
        Boolean(
          context.knowledge
        ),

      timestamp:
        now()
    };

  } catch (error) {

    return {

      ok: false,

      version:
        CONTEXT_MEMORY_VERSION,

      error:
        error?.message ||
        "Erro ao montar contexto.",

      timestamp:
        now()
    };
  }
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getContextMemoryInfo() {

  return {

    name:
      "JARVIS CONTEXT MEMORY",

    version:
      CONTEXT_MEMORY_VERSION,

    capabilities: [

      "memória contextual",

      "conhecimento contextual",

      "estado do cérebro",

      "data e hora",

      "estado do dispositivo",

      "contexto de pesquisa",

      "contexto de comandos",

      "contexto de aprendizado"
    ],

    timestamp:
      now()
  };
}
