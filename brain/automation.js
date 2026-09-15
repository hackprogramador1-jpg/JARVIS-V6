// ============================================================
// JARVIS V6 — AUTOMATION ENGINE
// Motor de automações e fluxos
// ============================================================

import {
  addTask,
  findTask,
  getTasks,
  beginTask,
  finishTask,
  markTaskFailed,
  stopTask,
  getNextTask,
  getTaskOverview
} from "./task-manager.js";

import {
  emit,
  EVENTS
} from "./events.js";

import {
  getBrainState
} from "./state.js";


// ============================================================
// VERSÃO
// ============================================================

export const AUTOMATION_VERSION = "1.0.0";


// ============================================================
// ESTADO
// ============================================================

let automationState = {
  active: false,
  running: false,
  currentAutomation: null,
  currentStep: null,
  startedAt: null,
  updatedAt: null,
  error: null
};


// ============================================================
// UTILITÁRIOS
// ============================================================

function createId() {

  return (
    "AUTO-" +
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
// INICIALIZAR
// ============================================================

export function initializeAutomation() {

  automationState = {

    active: true,

    running: false,

    currentAutomation: null,

    currentStep: null,

    startedAt: now(),

    updatedAt: now(),

    error: null

  };


  return {

    ok: true,

    state:
      automationState

  };
}


// ============================================================
// ATIVAR
// ============================================================

export function activateAutomation() {

  automationState.active = true;

  automationState.updatedAt = now();

  automationState.error = null;


  return {

    ok: true,

    active: true

  };
}


// ============================================================
// DESATIVAR
// ============================================================

export function deactivateAutomation() {

  if (
    automationState.running
  ) {

    return {

      ok: false,

      error:
        "Existe uma automação em execução."

    };
  }


  automationState.active = false;

  automationState.updatedAt = now();


  return {

    ok: true,

    active: false

  };
}


// ============================================================
// CRIAR AUTOMAÇÃO
// ============================================================

export function createAutomation(
  name,
  steps = [],
  options = {}
) {

  if (
    typeof name !== "string" ||
    !name.trim()
  ) {

    return {

      ok: false,

      error:
        "Nome da automação inválido."

    };
  }


  if (
    !Array.isArray(steps) ||
    steps.length === 0
  ) {

    return {

      ok: false,

      error:
        "A automação precisa possuir pelo menos uma etapa."

    };
  }


  const automation = {

    id:
      createId(),

    name:
      name.trim(),

    description:
      options.description || "",

    steps:
      steps.map(
        (step, index) => ({

          id:
            step.id ||
            `STEP-${index + 1}`,

          name:
            step.name ||
            `Etapa ${index + 1}`,

          type:
            step.type ||
            "task",

          action:
            step.action ||
            null,

          input:
            step.input ||
            null,

          status:
            "pending",

          result:
            null,

          error:
            null

        })
      ),

    status:
      "created",

    createdAt:
      now(),

    updatedAt:
      now(),

    metadata:
      options.metadata || {}

  };


  return {

    ok: true,

    automation

  };
}


// ============================================================
// INICIAR AUTOMAÇÃO
// ============================================================

export async function runAutomation(
  automation,
  options = {}
) {

  if (!automation) {

    return {

      ok: false,

      error:
        "Automação inválida."

    };
  }


  if (
    !automation.steps ||
    !Array.isArray(automation.steps)
  ) {

    return {

      ok: false,

      error:
        "A automação não possui etapas válidas."

    };
  }


  if (
    !automationState.active
  ) {

    activateAutomation();
  }


  if (
    automationState.running
  ) {

    return {

      ok: false,

      error:
        "Outra automação já está em execução."

    };
  }


  automationState.running = true;

  automationState.currentAutomation =
    automation.id || null;

  automationState.startedAt =
    now();

  automationState.updatedAt =
    now();

  automationState.error = null;


  automation.status =
    "running";


  emit(
    EVENTS.PLAN_STARTED,
    {
      automation
    }
  );


  const results = [];


  try {

    for (
      let index = 0;
      index < automation.steps.length;
      index++
    ) {

      const step =
        automation.steps[index];


      automationState.currentStep =
        step.id;


      automationState.updatedAt =
        now();


      step.status =
        "running";


      let result;


      try {

        result =
          await executeAutomationStep(
            step,
            options
          );


        step.result =
          result;

        step.status =
          "completed";


        results.push({

          step:
            step.id,

          ok: true,

          result

        });

      } catch (error) {

        step.status =
          "failed";

        step.error =
          error?.message ||
          String(error);


        results.push({

          step:
            step.id,

          ok: false,

          error:
            step.error

        });


        if (
          options.stopOnError !== false
        ) {

          throw error;
        }
      }
    }


    automation.status =
      "completed";


    automation.updatedAt =
      now();


    automationState.running =
      false;

    automationState.currentStep =
      null;

    automationState.currentAutomation =
      null;

    automationState.updatedAt =
      now();


    emit(
      EVENTS.PLAN_COMPLETED,
      {
        automation,
        results
      }
    );


    return {

      ok: true,

      automation,

      results

    };

  } catch (error) {

    automation.status =
      "failed";


    automation.error =
      error?.message ||
      String(error);


    automation.updatedAt =
      now();


    automationState.running =
      false;

    automationState.currentStep =
      null;

    automationState.currentAutomation =
      null;

    automationState.error =
      automation.error;

    automationState.updatedAt =
      now();


    emit(
      EVENTS.SYSTEM_ERROR,
      {
        source:
          "automation",

        error:
          automation.error
      }
    );


    return {

      ok: false,

      automation,

      results,

      error:
        automation.error

    };
  }
}


// ============================================================
// EXECUTAR UMA ETAPA
// ============================================================

async function executeAutomationStep(
  step,
  options = {}
) {

  if (!step) {

    throw new Error(
      "Etapa inválida."
    );
  }


  const type =
    String(
      step.type || "task"
    ).toLowerCase();


  // ----------------------------------------------------------
  // TAREFA
  // ----------------------------------------------------------

  if (
    type === "task"
  ) {

    const title =
      step.input ||
      step.name;


    const created =
      addTask(
        title,
        {
          priority:
            options.priority ||
            "normal",

          category:
            options.category ||
            "automation"
        }
      );


    if (!created.ok) {

      throw new Error(
        created.error ||
        "Não foi possível criar a tarefa."
      );
    }


    if (
      options.executeTasks
    ) {

      beginTask(
        created.task.id
      );


      finishTask(
        created.task.id,
        {
          automated: true
        }
      );
    }


    return {

      type: "task",

      task:
        created.task

    };
  }


  // ----------------------------------------------------------
  // ESPERAR
  // ----------------------------------------------------------

  if (
    type === "wait"
  ) {

    const milliseconds =
      Number(
        step.input || 1000
      );


    const safeMilliseconds =
      Math.max(
        0,
        Math.min(
          milliseconds,
          options.maxWait ||
            30000
        )
      );


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          safeMilliseconds
        )
    );


    return {

      type: "wait",

      milliseconds:
        safeMilliseconds

    };
  }


  // ----------------------------------------------------------
  // FUNÇÃO CUSTOMIZADA
  // ----------------------------------------------------------

  if (
    type === "function"
  ) {

    if (
      typeof step.action !==
      "function"
    ) {

      throw new Error(
        "A etapa function não possui uma função válida."
      );
    }


    return await step.action(
      step.input
    );
  }


  // ----------------------------------------------------------
  // LOG
  // ----------------------------------------------------------

  if (
    type === "log"
  ) {

    const message =
      String(
        step.input || ""
      );


    console.log(
      "[JARVIS AUTOMATION]",
      message
    );


    return {

      type: "log",

      message

    };
  }


  // ----------------------------------------------------------
  // DEFAULT
  // ----------------------------------------------------------

  return {

    type,

    input:
      step.input,

    action:
      step.action,

    handled: false

  };
}


// ============================================================
// EXECUTAR AUTOMATIZAÇÃO SIMPLES
// ============================================================

export async function runSimpleAutomation(
  name,
  steps,
  options = {}
) {

  const created =
    createAutomation(
      name,
      steps,
      options
    );


  if (!created.ok) {

    return created;
  }


  return await runAutomation(
    created.automation,
    options
  );
}


// ============================================================
// CANCELAR AUTOMAÇÃO
// ============================================================

export function cancelAutomation() {

  if (
    !automationState.running
  ) {

    return {

      ok: false,

      error:
        "Nenhuma automação está em execução."

    };
  }


  automationState.running =
    false;

  automationState.currentStep =
    null;

  automationState.currentAutomation =
    null;

  automationState.error =
    "Automação cancelada.";

  automationState.updatedAt =
    now();


  return {

    ok: true,

    cancelled: true

  };
}


// ============================================================
// STATUS
// ============================================================

export function getAutomationState() {

  return {

    ...automationState

  };
}


// ============================================================
// RESUMO
// ============================================================

export function getAutomationOverview() {

  return {

    ok: true,

    automation:
      getAutomationState(),

    tasks:
      getTaskOverview(),

    brain:
      getBrainState()

  };
}


// ============================================================
// COMANDOS NATURAIS
// ============================================================

export async function processAutomationCommand(
  input
) {

  const text =
    String(
      input || ""
    ).trim();


  if (!text) {

    return {

      ok: false,

      error:
        "Comando vazio."

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
  // STATUS
  // ----------------------------------------------------------

  if (
    normalized.includes(
      "status da automacao"
    ) ||
    normalized.includes(
      "status da automação"
    )
  ) {

    return getAutomationOverview();
  }


  // ----------------------------------------------------------
  // CANCELAR
  // ----------------------------------------------------------

  if (
    normalized.includes(
      "cancelar automacao"
    ) ||
    normalized.includes(
      "parar automacao"
    )
  ) {

    return cancelAutomation();
  }


  // ----------------------------------------------------------
  // PRÓXIMA TAREFA
  // ----------------------------------------------------------

  if (
    normalized.includes(
      "proxima tarefa"
    )
  ) {

    return getNextTask();
  }


  // ----------------------------------------------------------
  // LISTAR TAREFAS
  // ----------------------------------------------------------

  if (
    normalized.includes(
      "listar tarefas"
    )
  ) {

    return getTasks();
  }


  return {

    ok: false,

    handled: false,

    error:
      "Comando de automação não reconhecido."

  };
}


// ============================================================
// TESTE
// ============================================================

export async function testAutomation() {

  const automation =
    createAutomation(
      "Teste JARVIS",
      [

        {
          name:
            "Criar tarefa",

          type:
            "task",

          input:
            "Teste automático do JARVIS"

        },

        {
          name:
            "Aguardar",

          type:
            "wait",

          input:
            100

        },

        {
          name:
            "Finalizar",

          type:
            "log",

          input:
            "Automação concluída."

        }

      ]
    );


  if (!automation.ok) {

    return automation;
  }


  return await runAutomation(
    automation.automation
  );
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseAutomation() {

  return {

    ok: true,

    version:
      AUTOMATION_VERSION,

    active:
      automationState.active,

    running:
      automationState.running,

    currentAutomation:
      automationState.currentAutomation,

    currentStep:
      automationState.currentStep,

    error:
      automationState.error,

    timestamp:
      now()

  };
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getAutomationInfo() {

  return {

    name:
      "JARVIS Automation Engine",

    version:
      AUTOMATION_VERSION,

    capabilities: [

      "create automation",

      "execute automation",

      "multi-step workflows",

      "task automation",

      "wait steps",

      "function steps",

      "logging",

      "automation cancellation",

      "automation status",

      "natural automation commands"

    ]

  };
            }
