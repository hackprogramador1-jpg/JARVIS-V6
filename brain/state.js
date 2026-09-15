// ============================================================
// JARVIS V6 — BRAIN STATE
// Versão: 1.0.0
// Função: estado ativo e reativo do cérebro
// ============================================================

const STATE_VERSION = "1.0.0";

const MAX_EVENTS = 100;

const STATE_KEY =
  "JARVIS_V6_BRAIN_STATE";


// ============================================================
// ESTADOS
// ============================================================

export const BRAIN_STATES = {

  IDLE: "idle",

  LISTENING: "listening",

  ANALYZING: "analyzing",

  THINKING: "thinking",

  PLANNING: "planning",

  EXECUTING: "executing",

  SEARCHING: "searching",

  RESPONDING: "responding",

  LEARNING: "learning",

  ERROR: "error"
};


// ============================================================
// ESTADO PADRÃO
// ============================================================

const DEFAULT_STATE = {

  version:
    STATE_VERSION,

  status:
    BRAIN_STATES.IDLE,

  active: false,

  currentInput:
    null,

  currentIntent:
    null,

  currentAction:
    null,

  currentTask:
    null,

  currentTool:
    null,

  currentPlan:
    null,

  lastResult:
    null,

  lastError:
    null,

  startedAt:
    null,

  updatedAt:
    null,

  events:
    [],

  counters: {

    inputs:
      0,

    thoughts:
      0,

    plans:
      0,

    executions:
      0,

    searches:
      0,

    responses:
      0,

    errors:
      0,

    learnings:
      0
  }
};


// ============================================================
// UTILITÁRIO
// ============================================================

function now() {

  return new Date()
    .toISOString();
}


// ============================================================
// CARREGAR
// ============================================================

function loadState() {

  try {

    const saved =
      localStorage.getItem(
        STATE_KEY
      );

    if (!saved) {

      return structuredClone(
        DEFAULT_STATE
      );
    }

    const parsed =
      JSON.parse(saved);

    return {

      ...structuredClone(
        DEFAULT_STATE
      ),

      ...parsed,

      counters: {

        ...DEFAULT_STATE.counters,

        ...(parsed.counters || {})
      },

      events:
        Array.isArray(
          parsed.events
        )
          ? parsed.events
          : []
    };

  } catch {

    return structuredClone(
      DEFAULT_STATE
    );
  }
}


// ============================================================
// SALVAR
// ============================================================

function saveState(state) {

  localStorage.setItem(
    STATE_KEY,
    JSON.stringify(state)
  );

  return state;
}


// ============================================================
// OBTER ESTADO
// ============================================================

export function getBrainState() {

  return loadState();
}


// ============================================================
// ALTERAR ESTADO
// ============================================================

export function setBrainStatus(
  status,
  details = {}
) {

  const state =
    loadState();

  state.status =
    status;

  state.updatedAt =
    now();

  if (
    details &&
    typeof details === "object"
  ) {

    Object.assign(
      state,
      details
    );
  }

  saveState(state);

  return state;
}


// ============================================================
// ATIVAR CÉREBRO
// ============================================================

export function activateBrain() {

  const state =
    loadState();

  state.active =
    true;

  if (!state.startedAt) {

    state.startedAt =
      now();
  }

  state.updatedAt =
    now();

  state.status =
    BRAIN_STATES.IDLE;

  return saveState(
    state
  );
}


// ============================================================
// DESATIVAR CÉREBRO
// ============================================================

export function deactivateBrain() {

  const state =
    loadState();

  state.active =
    false;

  state.status =
    BRAIN_STATES.IDLE;

  state.updatedAt =
    now();

  return saveState(
    state
  );
}


// ============================================================
// REGISTRAR EVENTO
// ============================================================

export function addBrainEvent(
  type,
  data = {}
) {

  const state =
    loadState();

  const event = {

    id:
      "EVENT-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 7),

    type,

    data,

    timestamp:
      now()
  };

  state.events.push(
    event
  );

  if (
    state.events.length >
    MAX_EVENTS
  ) {

    state.events =
      state.events.slice(
        -MAX_EVENTS
      );
  }

  state.updatedAt =
    now();

  saveState(state);

  return event;
}


// ============================================================
// ENTRADA RECEBIDA
// ============================================================

export function registerInput(
  input,
  analysis = {}
) {

  const state =
    loadState();

  state.active =
    true;

  state.status =
    BRAIN_STATES.ANALYZING;

  state.currentInput =
    String(input || "");

  state.currentIntent =
    analysis.intent ||
    null;

  state.currentAction =
    analysis.action ||
    null;

  state.currentTask =
    analysis.query ||
    analysis.target ||
    null;

  state.lastError =
    null;

  state.counters.inputs++;

  state.updatedAt =
    now();

  saveState(state);

  addBrainEvent(
    "input_received",
    {

      input:
        state.currentInput,

      intent:
        state.currentIntent,

      action:
        state.currentAction
    }
  );

  return state;
}


// ============================================================
// PENSAMENTO
// ============================================================

export function registerThought(
  thought
) {

  const state =
    loadState();

  state.status =
    BRAIN_STATES.THINKING;

  state.counters.thoughts++;

  state.updatedAt =
    now();

  saveState(state);

  addBrainEvent(
    "thought",

    {

      thought:
        String(
          thought || ""
        )
    }
  );

  return state;
}


// ============================================================
// PLANO
// ============================================================

export function registerPlan(
  plan
) {

  const state =
    loadState();

  state.status =
    BRAIN_STATES.PLANNING;

  state.currentPlan =
    plan || null;

  state.counters.plans++;

  state.updatedAt =
    now();

  saveState(state);

  addBrainEvent(
    "plan_created",
    {

      planId:
        plan?.id ||
        null,

      steps:
        Array.isArray(
          plan?.steps
        )
          ? plan.steps.length
          : 0
    }
  );

  return state;
}


// ============================================================
// EXECUÇÃO
// ============================================================

export function registerExecution(
  tool,
  task = null
) {

  const state =
    loadState();

  state.status =
    BRAIN_STATES.EXECUTING;

  state.currentTool =
    tool ||
    null;

  state.currentTask =
    task ||
    state.currentTask;

  state.counters.executions++;

  if (
    tool === "search" ||
    tool === "searchWeb"
  ) {

    state.counters.searches++;
  }

  state.updatedAt =
    now();

  saveState(state);

  addBrainEvent(
    "execution_started",
    {

      tool:
        tool ||
        null,

      task:
        task ||
        null
    }
  );

  return state;
}


// ============================================================
// PESQUISA
// ============================================================

export function registerSearch(
  query
) {

  const state =
    loadState();

  state.status =
    BRAIN_STATES.SEARCHING;

  state.currentTool =
    "search";

  state.currentTask =
    String(
      query || ""
    );

  state.counters.searches++;

  state.updatedAt =
    now();

  saveState(state);

  addBrainEvent(
    "web_search",
    {

      query:
        String(
          query || ""
        )
    }
  );

  return state;
}


// ============================================================
// RESULTADO
// ============================================================

export function registerResult(
  result
) {

  const state =
    loadState();

  state.lastResult =
    result;

  state.currentTool =
    null;

  state.updatedAt =
    now();

  saveState(state);

  addBrainEvent(
    "result_received",
    {

      result
    }
  );

  return state;
}


// ============================================================
// RESPOSTA
// ============================================================

export function registerResponse(
  response
) {

  const state =
    loadState();

  state.status =
    BRAIN_STATES.RESPONDING;

  state.lastResult =
    response;

  state.counters.responses++;

  state.updatedAt =
    now();

  saveState(state);

  addBrainEvent(
    "response_generated",
    {

      response:
        String(
          response || ""
        )
    }
  );

  return state;
}


// ============================================================
// APRENDIZADO
// ============================================================

export function registerLearning(
  data
) {

  const state =
    loadState();

  state.status =
    BRAIN_STATES.LEARNING;

  state.counters.learnings++;

  state.updatedAt =
    now();

  saveState(state);

  addBrainEvent(
    "learning",

    data || {}
  );

  return state;
}


// ============================================================
// ERRO
// ============================================================

export function registerError(
  error
) {

  const state =
    loadState();

  state.status =
    BRAIN_STATES.ERROR;

  state.lastError =
    String(
      error?.message ||
      error ||
      "Erro desconhecido."
    );

  state.counters.errors++;

  state.updatedAt =
    now();

  saveState(state);

  addBrainEvent(
    "error",
    {

      error:
        state.lastError
    }
  );

  return state;
}


// ============================================================
// VOLTAR PARA OCIOSO
// ============================================================

export function returnToIdle() {

  const state =
    loadState();

  state.status =
    BRAIN_STATES.IDLE;

  state.currentTool =
    null;

  state.currentTask =
    null;

  state.updatedAt =
    now();

  return saveState(
    state
  );
}


// ============================================================
// HISTÓRICO RECENTE
// ============================================================

export function getRecentEvents(
  limit = 20
) {

  const state =
    loadState();

  return state.events
    .slice(
      -Math.max(
        1,
        Number(limit) || 20
      )
    );
}


// ============================================================
// CONTADORES
// ============================================================

export function getBrainCounters() {

  const state =
    loadState();

  return {

    ...state.counters
  };
}


// ============================================================
// LIMPAR ESTADO
// ============================================================

export function clearBrainState() {

  const fresh =
    structuredClone(
      DEFAULT_STATE
    );

  saveState(fresh);

  return fresh;
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseBrainState() {

  try {

    const state =
      loadState();

    return {

      ok: true,

      version:
        STATE_VERSION,

      active:
        state.active,

      status:
        state.status,

      events:
        state.events.length,

      counters:
        state.counters,

      lastError:
        state.lastError,

      timestamp:
        now()
    };

  } catch (error) {

    return {

      ok: false,

      version:
        STATE_VERSION,

      error:
        error?.message ||
        "Erro no estado do cérebro.",

      timestamp:
        now()
    };
  }
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getBrainStateInfo() {

  return {

    name:
      "JARVIS BRAIN STATE",

    version:
      STATE_VERSION,

    states:
      Object.values(
        BRAIN_STATES
      ),

    maxEvents:
      MAX_EVENTS,

    timestamp:
      now()
  };
      }
