// ============================================================
// JARVIS V6 — WORKFLOW MEMORY
// Memória dos workflows executados
// ============================================================

const STORAGE_KEY = "JARVIS_V6_WORKFLOW_MEMORY";
const MAX_RECORDS = 500;

export const WORKFLOW_MEMORY_VERSION = "1.0.0";


// ============================================================
// MEMÓRIA PADRÃO
// ============================================================

function createDefaultMemory() {

  return {

    workflows: [],

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
// CARREGAR MEMÓRIA
// ============================================================

function loadMemory() {

  try {

    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );


    if (!raw) {

      return createDefaultMemory();

    }


    const parsed =
      JSON.parse(raw);


    const defaults =
      createDefaultMemory();


    return {

      ...defaults,

      ...parsed,

      workflows:
        Array.isArray(parsed.workflows)
          ? parsed.workflows
          : [],

      favorites:
        Array.isArray(parsed.favorites)
          ? parsed.favorites
          : [],

      statistics: {

        ...defaults.statistics,

        ...(parsed.statistics || {})

      }

    };

  } catch {

    return createDefaultMemory();

  }

}


// ============================================================
// SALVAR
// ============================================================

function saveMemory(
  data
) {

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

    "WFMEM-" +

    Date.now() +

    "-" +

    Math.random()
      .toString(36)
      .slice(2, 8)

  );

}


// ============================================================
// REGISTRAR WORKFLOW
// ============================================================

export function recordWorkflow(
  workflow,
  result = null
) {

  if (!workflow) {

    return {

      ok: false,

      error:
        "Workflow inválido."

    };

  }


  const data =
    loadMemory();


  const status =

    workflow.status ||

    result?.workflow?.status ||

    (
      result?.ok === false
        ? "failed"
        : "completed"
    );


  const record = {

    id:
      createId(),

    workflowId:
      workflow.id || null,

    name:
      workflow.name ||
      "Workflow",

    description:
      workflow.description || "",

    status,

    steps:
      Array.isArray(
        workflow.steps
      )
        ? workflow.steps.length
        : 0,

    results:
      result?.result?.results ||
      result?.results ||
      [],

    error:
      workflow.error ||
      result?.error ||
      null,

    createdAt:
      workflow.createdAt ||
      new Date().toISOString(),

    executedAt:
      new Date().toISOString(),

    metadata:
      workflow.metadata || {}

  };


  data.workflows.unshift(
    record
  );


  if (
    data.workflows.length >
    MAX_RECORDS
  ) {

    data.workflows =
      data.workflows.slice(
        0,
        MAX_RECORDS
      );

  }


  data.statistics.total += 1;


  if (
    status === "completed"
  ) {

    data.statistics.completed += 1;

  }


  if (
    status === "failed"
  ) {

    data.statistics.failed += 1;

  }


  if (
    status === "cancelled"
  ) {

    data.statistics.cancelled += 1;

  }


  saveMemory(
    data
  );


  return {

    ok: true,

    record

  };

}


// ============================================================
// HISTÓRICO
// ============================================================

export function getWorkflowHistory(
  options = {}
) {

  const data =
    loadMemory();


  let records =
    [...data.workflows];


  if (
    options.status
  ) {

    records =
      records.filter(

        item =>
          item.status ===
          options.status

      );

  }


  if (
    options.name
  ) {

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


  const safeLimit =
    Math.max(

      1,

      Math.min(
        limit,
        MAX_RECORDS
      )

    );


  records =
    records.slice(
      0,
      safeLimit
    );


  return {

    ok: true,

    records

  };

}


// ============================================================
// ÚLTIMO WORKFLOW
// ============================================================

export function getLastWorkflow() {

  const data =
    loadMemory();


  return {

    ok: true,

    workflow:
      data.workflows[0] ||
      null

  };

}


// ============================================================
// BUSCAR WORKFLOW
// ============================================================

export function searchWorkflowMemory(
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
    data.workflows.filter(

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
// FAVORITAR
// ============================================================

export function favoriteWorkflow(
  workflowId
) {

  if (!workflowId) {

    return {

      ok: false,

      error:
        "ID do workflow inválido."

    };

  }


  const data =
    loadMemory();


  if (
    !data.favorites.includes(
      workflowId
    )
  ) {

    data.favorites.push(
      workflowId
    );

  }


  saveMemory(
    data
  );


  return {

    ok: true,

    favorite: true,

    workflowId

  };

}


// ============================================================
// DESFAVORITAR
// ============================================================

export function unfavoriteWorkflow(
  workflowId
) {

  const data =
    loadMemory();


  data.favorites =
    data.favorites.filter(

      id =>
        id !== workflowId

    );


  saveMemory(
    data
  );


  return {

    ok: true,

    favorite: false,

    workflowId

  };

}


// ============================================================
// VERIFICAR FAVORITO
// ============================================================

export function isFavoriteWorkflow(
  workflowId
) {

  const data =
    loadMemory();


  return data.favorites.includes(
    workflowId
  );

}


// ============================================================
// ESTATÍSTICAS
// ============================================================

export function getWorkflowMemoryStats() {

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
      data.workflows.length

  };

}


// ============================================================
// EXPORTAR
// ============================================================

export function exportWorkflowMemory() {

  const data =
    loadMemory();


  return {

    ok: true,

    version:
      WORKFLOW_MEMORY_VERSION,

    exportedAt:
      new Date().toISOString(),

    data

  };

}


// ============================================================
// LIMPAR HISTÓRICO
// ============================================================

export function clearWorkflowHistory() {

  const data =
    loadMemory();


  data.workflows = [];


  data.statistics = {

    total: 0,

    completed: 0,

    failed: 0,

    cancelled: 0

  };


  saveMemory(
    data
  );


  return {

    ok: true,

    cleared: true

  };

}


// ============================================================
// LIMPAR TODA A MEMÓRIA
// ============================================================

export function clearWorkflowMemory() {

  try {

    localStorage.removeItem(
      STORAGE_KEY
    );

  } catch {

    // Ignorar falha de armazenamento

  }


  return {

    ok: true,

    cleared: true

  };

}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseWorkflowMemory() {

  const data =
    loadMemory();


  return {

    ok: true,

    version:
      WORKFLOW_MEMORY_VERSION,

    records:
      data.workflows.length,

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

export function getWorkflowMemoryInfo() {

  return {

    name:
      "JARVIS Workflow Memory",

    version:
      WORKFLOW_MEMORY_VERSION,

    capabilities: [

      "workflow history",

      "workflow search",

      "last workflow",

      "workflow favorites",

      "workflow statistics",

      "workflow export",

      "workflow history cleanup"

    ]

  };

        }
