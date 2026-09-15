// ============================================================
// JARVIS V6 — TASK MANAGER
// Gerenciador inteligente de tarefas
// ============================================================

import {
  createTask,
  getTask,
  listTasks,
  startTask,
  completeTask,
  failTask,
  cancelTask,
  deleteTask,
  getNextTask as getNextTaskFromStorage,
  getTaskStats
} from "./tasks.js";

import {
  emit,
  EVENTS
} from "./events.js";


// ============================================================
// VERSÃO
// ============================================================

export const TASK_MANAGER_VERSION = "1.0.0";


// ============================================================
// CRIAR TAREFA
// ============================================================

export function addTask(
  title,
  options = {}
) {

  if (
    typeof title !== "string" ||
    !title.trim()
  ) {

    return {
      ok: false,
      error: "Título da tarefa inválido."
    };
  }


  const task =
    createTask(
      title.trim(),
      options
    );


  emit(
    EVENTS.TASK_CREATED,
    {
      task
    }
  );


  return {
    ok: true,
    task
  };
}


// ============================================================
// BUSCAR TAREFA
// ============================================================

export function findTask(
  id
) {

  const task =
    getTask(id);


  if (!task) {

    return {
      ok: false,
      error: "Tarefa não encontrada."
    };
  }


  return {
    ok: true,
    task
  };
}


// ============================================================
// LISTAR TAREFAS
// ============================================================

export function getTasks(
  options = {}
) {

  return {
    ok: true,

    tasks:
      listTasks(options)
  };
}


// ============================================================
// INICIAR TAREFA
// ============================================================

export function beginTask(
  id
) {

  const task =
    startTask(id);


  if (!task) {

    return {
      ok: false,
      error: "Tarefa não encontrada."
    };
  }


  return {
    ok: true,
    task
  };
}


// ============================================================
// CONCLUIR TAREFA
// ============================================================

export function finishTask(
  id,
  result = null
) {

  const task =
    completeTask(
      id,
      result
    );


  if (!task) {

    return {
      ok: false,
      error: "Tarefa não encontrada."
    };
  }


  emit(
    EVENTS.TASK_COMPLETED,
    {
      task
    }
  );


  return {
    ok: true,
    task
  };
}


// ============================================================
// MARCAR COMO FALHA
// ============================================================

export function markTaskFailed(
  id,
  error
) {

  const task =
    failTask(
      id,
      error
    );


  if (!task) {

    return {
      ok: false,
      error: "Tarefa não encontrada."
    };
  }


  return {
    ok: true,
    task
  };
}


// ============================================================
// CANCELAR TAREFA
// ============================================================

export function stopTask(
  id
) {

  const task =
    cancelTask(id);


  if (!task) {

    return {
      ok: false,
      error: "Tarefa não encontrada."
    };
  }


  return {
    ok: true,
    task
  };
}


// ============================================================
// EXCLUIR TAREFA
// ============================================================

export function removeTask(
  id
) {

  const result =
    deleteTask(id);


  if (
    result === false
  ) {

    return {
      ok: false,
      error: "Não foi possível excluir a tarefa."
    };
  }


  return {
    ok: true,
    deleted: true
  };
}


// ============================================================
// PRÓXIMA TAREFA
// ============================================================

export function getNextTask() {

  const task =
    getNextTaskFromStorage();


  return {
    ok: true,

    task:
      task || null
  };
}


// ============================================================
// RESUMO DAS TAREFAS
// ============================================================

export function getTaskOverview() {

  const stats =
    getTaskStats();


  return {
    ok: true,

    stats
  };
}


// ============================================================
// PROCESSAR COMANDO DE TAREFA
// ============================================================

export async function processTaskCommand(
  input
) {

  const text =
    String(
      input || ""
    ).trim();


  if (!text) {

    return {
      ok: false,
      error: "Comando vazio."
    };
  }


  const normalized =
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );


  // ----------------------------------------------------------
  // CRIAR TAREFA
  // ----------------------------------------------------------

  if (
    normalized.startsWith(
      "crie uma tarefa"
    ) ||
    normalized.startsWith(
      "criar tarefa"
    ) ||
    normalized.startsWith(
      "adicione uma tarefa"
    ) ||
    normalized.startsWith(
      "adicionar tarefa"
    )
  ) {

    let title =
      text;


    title =
      title.replace(
        /^crie uma tarefa\s*/i,
        ""
      );


    title =
      title.replace(
        /^criar tarefa\s*/i,
        ""
      );


    title =
      title.replace(
        /^adicione uma tarefa\s*/i,
        ""
      );


    title =
      title.replace(
        /^adicionar tarefa\s*/i,
        ""
      );


    title =
      title.trim();


    if (!title) {

      return {
        ok: false,
        error:
          "Informe o título da tarefa."
      };
    }


    return addTask(
      title
    );
  }


  // ----------------------------------------------------------
  // LISTAR TAREFAS
  // ----------------------------------------------------------

  if (
    normalized.includes(
      "minhas tarefas"
    ) ||
    normalized.includes(
      "listar tarefas"
    ) ||
    normalized.includes(
      "tarefas pendentes"
    )
  ) {

    return getTasks();
  }


  // ----------------------------------------------------------
  // PRÓXIMA TAREFA
  // ----------------------------------------------------------

  if (
    normalized.includes(
      "proxima tarefa"
    ) ||
    normalized.includes(
      "proxima missao"
    )
  ) {

    return getNextTask();
  }


  // ----------------------------------------------------------
  // RESUMO
  // ----------------------------------------------------------

  if (
    normalized.includes(
      "status das tarefas"
    ) ||
    normalized.includes(
      "resumo das tarefas"
    )
  ) {

    return getTaskOverview();
  }


  return {
    ok: false,

    handled: false,

    error:
      "Comando de tarefa não reconhecido."
  };
}


// ============================================================
// TESTE DO GERENCIADOR
// ============================================================

export function testTaskManager() {

  const created =
    addTask(
      "Teste do sistema JARVIS",
      {
        priority:
          "high",

        category:
          "system"
      }
    );


  const tasks =
    getTasks();


  return {

    ok: true,

    created,

    tasks

  };
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseTaskManager() {

  return {

    ok: true,

    version:
      TASK_MANAGER_VERSION,

    stats:
      getTaskStats(),

    timestamp:
      new Date().toISOString()

  };
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getTaskManagerInfo() {

  return {

    name:
      "JARVIS Task Manager",

    version:
      TASK_MANAGER_VERSION,

    capabilities: [

      "create tasks",

      "find tasks",

      "list tasks",

      "start tasks",

      "complete tasks",

      "fail tasks",

      "cancel tasks",

      "delete tasks",

      "next task",

      "task priority",

      "task statistics",

      "natural task commands"

    ]

  };
    }
