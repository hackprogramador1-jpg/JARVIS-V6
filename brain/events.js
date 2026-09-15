// ============================================================
// JARVIS V6 — EVENT BUS
// Versão: 1.0.0
// ============================================================

export const EVENTS_VERSION = "1.0.0";

const MAX_EVENTS = 500;


// ============================================================
// EVENTOS PADRÃO
// ============================================================

export const EVENTS = {

  SYSTEM_READY:
    "system:ready",

  SYSTEM_ERROR:
    "system:error",

  INPUT:
    "input",

  THINKING:
    "thinking",

  DECISION:
    "decision",

  PLAN_CREATED:
    "plan:created",

  PLAN_STARTED:
    "plan:started",

  PLAN_COMPLETED:
    "plan:completed",

  EXECUTION_STARTED:
    "execution:started",

  EXECUTION_COMPLETED:
    "execution:completed",

  SEARCH_STARTED:
    "search:started",

  SEARCH_COMPLETED:
    "search:completed",

  AI_REQUEST:
    "ai:request",

  AI_RESPONSE:
    "ai:response",

  MEMORY_SAVED:
    "memory:saved",

  LEARNING:
    "learning",

  TASK_CREATED:
    "task:created",

  TASK_COMPLETED:
    "task:completed",

  VOICE_STARTED:
    "voice:started",

  VOICE_STOPPED:
    "voice:stopped"

};


// ============================================================
// LISTENERS
// ============================================================

const listeners =
  new Map();


// ============================================================
// HISTÓRICO
// ============================================================

let eventHistory = [];


// ============================================================
// ID
// ============================================================

function createEventId() {

  return (
    "evt_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}


// ============================================================
// REGISTRAR LISTENER
// ============================================================

export function on(
  event,
  callback
) {

  if (
    typeof event !== "string" ||
    typeof callback !== "function"
  ) {

    return () => {};
  }


  if (
    !listeners.has(event)
  ) {

    listeners.set(
      event,
      new Set()
    );
  }


  listeners
    .get(event)
    .add(callback);


  return () => {

    off(
      event,
      callback
    );

  };
}


// ============================================================
// REMOVER LISTENER
// ============================================================

export function off(
  event,
  callback
) {

  const set =
    listeners.get(event);


  if (!set) {

    return false;
  }


  const removed =
    set.delete(
      callback
    );


  if (
    set.size === 0
  ) {

    listeners.delete(
      event
    );
  }


  return removed;
}


// ============================================================
// REMOVER TODOS
// ============================================================

export function offAll(
  event = null
) {

  if (event) {

    listeners.delete(
      event
    );

    return;
  }


  listeners.clear();
}


// ============================================================
// EMIT
// ============================================================

export function emit(
  event,
  data = {}
) {

  const eventObject = {

    id:
      createEventId(),

    event,

    data,

    timestamp:
      new Date().toISOString()

  };


  eventHistory.push(
    eventObject
  );


  if (
    eventHistory.length >
    MAX_EVENTS
  ) {

    eventHistory =
      eventHistory.slice(
        -MAX_EVENTS
      );
  }


  const set =
    listeners.get(event);


  if (!set) {

    return eventObject;
  }


  for (
    const callback
    of [...set]
  ) {

    try {

      callback(
        eventObject
      );

    } catch (error) {

      console.error(
        "JARVIS EVENT LISTENER ERROR:",
        error
      );

    }
  }


  return eventObject;
}


// ============================================================
// EMIT ASSÍNCRONO
// ============================================================

export async function emitAsync(
  event,
  data = {}
) {

  const eventObject = {

    id:
      createEventId(),

    event,

    data,

    timestamp:
      new Date().toISOString()

  };


  eventHistory.push(
    eventObject
  );


  if (
    eventHistory.length >
    MAX_EVENTS
  ) {

    eventHistory =
      eventHistory.slice(
        -MAX_EVENTS
      );
  }


  const set =
    listeners.get(event);


  if (!set) {

    return eventObject;
  }


  for (
    const callback
    of [...set]
  ) {

    try {

      await callback(
        eventObject
      );

    } catch (error) {

      console.error(
        "JARVIS ASYNC EVENT ERROR:",
        error
      );

    }
  }


  return eventObject;
}


// ============================================================
// HISTÓRICO
// ============================================================

export function getEventHistory(
  limit = 50
) {

  const safeLimit =
    Math.max(
      1,
      Math.min(
        Number(limit) || 50,
        MAX_EVENTS
      )
    );


  return eventHistory.slice(
    -safeLimit
  );
}


// ============================================================
// LIMPAR HISTÓRICO
// ============================================================

export function clearEventHistory() {

  eventHistory = [];

  return true;
}


// ============================================================
// LISTAR EVENTOS ATIVOS
// ============================================================

export function getActiveEvents() {

  return [
    ...listeners.keys()
  ];
}


// ============================================================
// CONTAGEM DE LISTENERS
// ============================================================

export function getListenerCount(
  event = null
) {

  if (event) {

    return (
      listeners.get(event)
        ?.size || 0
    );
  }


  let total = 0;


  for (
    const set
    of listeners.values()
  ) {

    total += set.size;
  }


  return total;
}


// ============================================================
// TESTE
// ============================================================

export function testEvents() {

  const testEvent =
    "jarvis:test";


  let received =
    false;


  const unsubscribe =
    on(
      testEvent,
      () => {

        received = true;

      }
    );


  emit(
    testEvent,
    {
      test: true
    }
  );


  unsubscribe();


  return {

    ok:
      received === true,

    event:
      testEvent

  };
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseEvents() {

  return {

    ok: true,

    version:
      EVENTS_VERSION,

    registeredEvents:
      listeners.size,

    listeners:
      getListenerCount(),

    history:
      eventHistory.length,

    maxEvents:
      MAX_EVENTS,

    timestamp:
      new Date().toISOString()

  };
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getEventsInfo() {

  return {

    name:
      "JARVIS Event Bus",

    version:
      EVENTS_VERSION,

    maxEvents:
      MAX_EVENTS,

    events:
      Object.values(
        EVENTS
      ),

    capabilities: [

      "subscribe",

      "unsubscribe",

      "emit",

      "async-events",

      "history",

      "diagnostics"

    ]

  };
      }
