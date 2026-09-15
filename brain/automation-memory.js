// ============================================================
// JARVIS V6 — AUTOMATION MEMORY
// Memória das automações executadas
// ============================================================

const STORAGE_KEY = "JARVIS_V6_AUTOMATION_MEMORY";
const MAX_RECORDS = 500;

export const AUTOMATION_MEMORY_VERSION = "1.0.0";


// ============================================================
// ESTADO PADRÃO
// ============================================================

function defaultMemory() {
  return {
    automations: [],
    favorites: [],
    statistics: {
      total: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    }
  };
}


// ============================================================
// CARREGAR
// ============================================================

function loadMemory() {

  try {

    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return defaultMemory();
    }

    const data =
      JSON.parse(raw);

    return {
      ...defaultMemory(),
      ...data,
      statistics: {
        ...defaultMemory().statistics,
        ...(data.statistics || {})
      }
    };

  } catch {

    return defaultMemory();

  }

}


// ============================================================
// SALVAR
// ============================================================

function saveMemory(data) {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );

    return true;

  } catch {

    return false;

  }

}


// ============================================================
// ID
// ============================================================

function createId() {

  return (
    "AUTOMEM-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );

}


// ============================================================
// REGISTRAR AUTOMAÇÃO
// ============================================================

export function recordAutomation(
  automation,
  result = null
) {

  if (!automation) {

    return {
      ok: false,
      error: "Automação inválida."
    };

  }


  const data =
    loadMemory();


  const status =
    automation.status ||
    (result?.ok === false
      ? "failed"
      : "completed");


  const record = {

    id:
      createId(),

    automationId:
      automation.id || null,

    name:
      automation.name || "Automação",

    description:
      automation.description || "",

    status,

    steps:
      Array.isArray(automation.steps)
        ? automation.steps.length
        : 0,

    results:
      result?.results || [],

    error:
      automation.error ||
      result?.error ||
      null,

    createdAt:
      automation.createdAt ||
      new Date().toISOString(),

    executedAt:
      new Date().toISOString(),

    metadata:
      automation.metadata || {}

  };


  data.automations.unshift(
    record
  );


  if (
    data.automations.length >
    MAX_RECORDS
  ) {

    data.automations =
      data.automations.slice(
        0,
        MAX_RECORDS
      );

  }


  data.statistics.total += 1;


  if (status === "completed") {
    data.statistics.completed += 1;
  }

  if (status === "failed") {
    data.statistics.failed += 1;
  }

  if (status === "cancelled") {
    data.statistics.cancelled += 1;
  }


  saveMemory(data);


  return {
    ok: true,
    record
  };

}


// ============================================================
// LISTAR HISTÓRICO
// ============================================================

export function getAutomationHistory(
  options = {}
) {

  const data =
    loadMemory();


  let records =
    [...data.automations];


  if (options.status) {

    records =
      records.filter(
        item =>
          item.status ===
          options.status
      );

  }


  if (options.name) {

    const search =
      String(
        options.name
      )
        .toLowerCase()
        .trim();


    records =
      records.filter(
        item =>
          item.name
            .toLowerCase()
            .includes(search)
      );

  }


  const limit =
    Number(
      options.limit || 50
    );


  records =
    records.slice(
      0,
      Math.max(
        1,
        Math.min(
          limit,
          MAX_RECORDS
        )
      )
    );


  return {

    ok: true,

    records

  };

}


// ============================================================
// ÚLTIMA AUTOMAÇÃO
// ============================================================

export function getLastAutomation() {

  const data =
    loadMemory();


  return {

    ok: true,

    record:
      data.automations[0] ||
      null

  };

}


// ============================================================
// BUSCAR AUTOMAÇÕES
// ============================================================

export function searchAutomationMemory(
  query
) {

  const search =
    String(
      query || ""
    )
      .toLowerCase()
      .trim();


  if (!search) {

    return {
      ok: true,
      records: []
    };

  }


  const data =
    loadMemory();


  const records =
    data.automations.filter(
      item =>
        item.name
          .toLowerCase()
          .includes(search) ||

        item.description
          .toLowerCase()
          .includes(search)
    );


  return {

    ok: true,

    records

  };

}


// ============================================================
// FAVORITAR AUTOMAÇÃO
// ============================================================

export function favoriteAutomation(
  automationId
) {

  if (!automationId) {

    return {
      ok: false,
      error: "ID da automação inválido."
    };

  }


  const data =
    loadMemory();


  if (
    !data.favorites.includes(
      automationId
    )
  ) {

    data.favorites.push(
      automationId
    );

  }


  saveMemory(data);


  return {

    ok: true,

    favorite: true,

    automationId

  };

}


// ============================================================
// DESFAVORITAR
// ============================================================

export function unfavoriteAutomation(
  automationId
) {

  const data =
    loadMemory();


  data.favorites =
    data.favorites.filter(
      id =>
        id !== automationId
    );


  saveMemory(data);


  return {

    ok: true,

    favorite: false,

    automationId

  };

}


// ============================================================
// VERIFICAR FAVORITO
// ============================================================

export function isFavoriteAutomation(
  automationId
) {

  const data =
    loadMemory();


  return data.favorites.includes(
    automationId
  );

}


// ============================================================
// ESTATÍSTICAS
// ============================================================

export function getAutomationMemoryStats() {

  const data =
    loadMemory();


  return {

    ok: true,

    statistics: {
      ...data.statistics
    },

    favorites:
      data.favorites.length,

    storedRecords:
      data.automations.length

  };

}


// ============================================================
// EXPORTAR MEMÓRIA
// ============================================================

export function exportAutomationMemory() {

  const data =
    loadMemory();


  return {

    ok: true,

    version:
      AUTOMATION_MEMORY_VERSION,

    exportedAt:
      new Date().toISOString(),

    data

  };

}


// ============================================================
// LIMPAR HISTÓRICO
// ============================================================

export function clearAutomationHistory() {

  const data =
    loadMemory();


  data.automations = [];

  data.statistics = {

    total: 0,

    completed: 0,

    failed: 0,

    cancelled: 0

  };


  saveMemory(data);


  return {

    ok: true,

    cleared: true

  };

}


// ============================================================
// LIMPAR TUDO
// ============================================================

export function clearAutomationMemory() {

  try {

    localStorage.removeItem(
      STORAGE_KEY
    );

  } catch {

    // Ignorar erro de armazenamento

  }


  return {

    ok: true,

    cleared: true

  };

}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseAutomationMemory() {

  const data =
    loadMemory();


  return {

    ok: true,

    version:
      AUTOMATION_MEMORY_VERSION,

    records:
      data.automations.length,

    favorites:
      data.favorites.length,

    statistics:
      data.statistics,

    storageKey:
      STORAGE_KEY,

    timestamp:
      new Date().toISOString()

  };

}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getAutomationMemoryInfo() {

  return {

    name:
      "JARVIS Automation Memory",

    version:
      AUTOMATION_MEMORY_VERSION,

    capabilities: [

      "automation history",

      "automation search",

      "last automation",

      "favorites",

      "statistics",

      "memory export",

      "history cleanup"

    ]

  };

}
