// ============================================================
// JARVIS V6 — TASK MANAGER
// Versão: 1.0.0
// ============================================================

export const TASKS_VERSION = "1.0.0";

const TASKS_KEY =
  "JARVIS_V6_TASKS";

const MAX_TASKS = 500;


// ============================================================
// ID
// ============================================================

function createId() {

  return (
    "task_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}


// ============================================================
// CARREGAR
// ============================================================

function loadTasks() {

  try {

    const saved =
      localStorage.getItem(
        TASKS_KEY
      );

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {

    console.error(
      "JARVIS TASK LOAD ERROR:",
      error
    );

    return [];
  }
}


// ============================================================
// SALVAR
// ============================================================

function saveTasks(tasks) {

  try {

    localStorage.setItem(
      TASKS_KEY,
      JSON.stringify(tasks)
    );

    return true;

  } catch (error) {

    console.error(
      "JARVIS TASK SAVE ERROR:",
      error
    );

    return false;
  }
}


// ============================================================
// ESTADO
// ============================================================

let tasks =
  loadTasks();


// ============================================================
// CRIAR TAREFA
// ============================================================

export function createTask(
  title,
  options = {}
) {

  if (
    typeof title !== "string" ||
    !title.trim()
  ) {

    return {

      ok: false,

      error:
        "Título da tarefa inválido."
    };
  }


  if (
    tasks.length >= MAX_TASKS
  ) {

    tasks =
      tasks.slice(
        -(MAX_TASKS - 1)
      );
  }


  const now =
    new Date().toISOString();


  const task = {

    id:
      createId(),

    title:
      title.trim(),

    description:
      options.description ||
      "",

    status:
      "pending",

    priority:
      options.priority ||
      "normal",

    category:
      options.category ||
      "general",

    createdAt:
      now,

    updatedAt:
      now,

    startedAt:
      null,

    completedAt:
      null,

    error:
      null,

    result:
      null,

    metadata:
      options.metadata ||
      {}

  };


  tasks.push(
    task
  );


  saveTasks(
    tasks
  );


  return {

    ok: true,

    task

  };
}


// ============================================================
// BUSCAR TAREFA
// ============================================================

export function getTask(
  id
) {

  return tasks.find(
    task =>
      task.id === id
  ) || null;
}


// ============================================================
// LISTAR TAREFAS
// ============================================================

export function getTasks(
  filters = {}
) {

  let result =
    [...tasks];


  if (
    filters.status
  ) {

    result =
      result.filter(
        task =>
          task.status ===
          filters.status
      );
  }


  if (
    filters.category
  ) {

    result =
      result.filter(
        task =>
          task.category ===
          filters.category
      );
  }


  if (
    filters.priority
  ) {

    result =
      result.filter(
        task =>
          task.priority ===
          filters.priority
      );
  }


  if (
    filters.search
  ) {

    const search =
      String(
        filters.search
      )
        .toLowerCase()
        .trim();


    result =
      result.filter(
        task =>
          task.title
            .toLowerCase()
            .includes(search) ||

          task.description
            .toLowerCase()
            .includes(search)
      );
  }


  return result;
}


// ============================================================
// INICIAR TAREFA
// ============================================================

export function startTask(
  id
) {

  const task =
    getTask(id);


  if (!task) {

    return {

      ok: false,

      error:
        "Tarefa não encontrada."
    };
  }


  task.status =
    "running";

  task.startedAt =
    new Date().toISOString();

  task.updatedAt =
    new Date().toISOString();

  task.error =
    null;


  saveTasks(
    tasks
  );


  return {

    ok: true,

    task

  };
}


// ============================================================
// CONCLUIR TAREFA
// ============================================================

export function completeTask(
  id,
  result = null
) {

  const task =
    getTask(id);


  if (!task) {

    return {

      ok: false,

      error:
        "Tarefa não encontrada."
    };
  }


  task.status =
    "completed";

  task.completedAt =
    new Date().toISOString();

  task.updatedAt =
    new Date().toISOString();

  task.result =
    result;

  task.error =
    null;


  saveTasks(
    tasks
  );


  return {

    ok: true,

    task

  };
}


// ============================================================
// FALHAR TAREFA
// ============================================================

export function failTask(
  id,
  error
) {

  const task =
    getTask(id);


  if (!task) {

    return {

      ok: false,

      error:
        "Tarefa não encontrada."
    };
  }


  task.status =
    "failed";

  task.updatedAt =
    new Date().toISOString();

  task.error =
    String(
      error ||
      "Erro desconhecido."
    );


  saveTasks(
    tasks
  );


  return {

    ok: false,

    task

  };
}


// ============================================================
// CANCELAR
// ============================================================

export function cancelTask(
  id
) {

  const task =
    getTask(id);


  if (!task) {

    return {

      ok: false,

      error:
        "Tarefa não encontrada."
    };
  }


  task.status =
    "cancelled";

  task.updatedAt =
    new Date().toISOString();


  saveTasks(
    tasks
  );


  return {

    ok: true,

    task

  };
}


// ============================================================
// REMOVER
// ============================================================

export function deleteTask(
  id
) {

  const index =
    tasks.findIndex(
      task =>
        task.id === id
    );


  if (
    index === -1
  ) {

    return {

      ok: false,

      error:
        "Tarefa não encontrada."
    };
  }


  tasks.splice(
    index,
    1
  );


  saveTasks(
    tasks
  );


  return {

    ok: true
  };
}


// ============================================================
// LIMPAR CONCLUÍDAS
// ============================================================

export function clearCompletedTasks() {

  tasks =
    tasks.filter(
      task =>
        task.status !==
        "completed"
    );


  saveTasks(
    tasks
  );


  return {

    ok: true,

    remaining:
      tasks.length
  };
}


// ============================================================
// PRÓXIMA TAREFA
// ============================================================

export function getNextTask() {

  const pending =
    tasks.filter(
      task =>
        task.status ===
        "pending"
    );


  if (!pending.length) {

    return null;
  }


  const priorityOrder = {

    critical: 4,

    high: 3,

    normal: 2,

    low: 1

  };


  pending.sort(
    (a, b) =>
      (
        priorityOrder[b.priority] ||
        0
      ) -
      (
        priorityOrder[a.priority] ||
        0
      )
  );


  return pending[0];
}


// ============================================================
// ESTATÍSTICAS
// ============================================================

export function getTaskStats() {

  const stats = {

    total:
      tasks.length,

    pending: 0,

    running: 0,

    completed: 0,

    failed: 0,

    cancelled: 0

  };


  for (
    const task
    of tasks
  ) {

    if (
      Object.prototype.hasOwnProperty.call(
        stats,
        task.status
      )
    ) {

      stats[
        task.status
      ]++;
    }
  }


  return stats;
}


// ============================================================
// EXPORTAR
// ============================================================

export function exportTasks() {

  return JSON.stringify(
    tasks,
    null,
    2
  );
}


// ============================================================
// LIMPAR TUDO
// ============================================================

export function clearTasks() {

  tasks = [];

  saveTasks(
    tasks
  );


  return {

    ok: true
  };
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseTasks() {

  return {

    ok: true,

    version:
      TASKS_VERSION,

    total:
      tasks.length,

    stats:
      getTaskStats(),

    storage:
      "localStorage",

    timestamp:
      new Date().toISOString()

  };
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getTasksInfo() {

  return {

    name:
      "JARVIS Task Manager",

    version:
      TASKS_VERSION,

    maxTasks:
      MAX_TASKS,

    capabilities: [

      "create",

      "start",

      "complete",

      "fail",

      "cancel",

      "delete",

      "filter",

      "priority",

      "statistics",

      "export"

    ]

  };
          }
