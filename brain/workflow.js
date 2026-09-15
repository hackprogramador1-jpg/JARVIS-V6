// ============================================================
// JARVIS V6 — WORKFLOW ENGINE
// Sistema de fluxos multi-etapas
// ============================================================

import {
  executeAutomation
} from "./automation-runner.js";

import {
  getAutomationHistory,
  searchAutomationMemory
} from "./automation-memory.js";

import {
  emit,
  EVENTS
} from "./events.js";


// ============================================================
// VERSÃO
// ============================================================

export const WORKFLOW_VERSION = "1.0.0";


// ============================================================
// ESTADO
// ============================================================

let workflowState = {
  active: true,
  running: false,
  currentWorkflow: null,
  currentStep: null,
  totalWorkflows: 0,
  completedWorkflows: 0,
  failedWorkflows: 0,
  lastResult: null,
  lastError: null,
  updatedAt: null
};


// ============================================================
// UTILITÁRIOS
// ============================================================

function now() {
  return new Date().toISOString();
}


function createId() {

  return (
    "WF-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );

}


// ============================================================
// INICIALIZAR
// ============================================================

export function initializeWorkflow() {

  workflowState = {

    active: true,

    running: false,

    currentWorkflow: null,

    currentStep: null,

    totalWorkflows: 0,

    completedWorkflows: 0,

    failedWorkflows: 0,

    lastResult: null,

    lastError: null,

    updatedAt: now()

  };


  return {

    ok: true,

    state:
      getWorkflowState()

  };

}


// ============================================================
// ATIVAR
// ============================================================

export function activateWorkflow() {

  workflowState.active = true;

  workflowState.updatedAt = now();

  workflowState.lastError = null;


  return {

    ok: true,

    active: true

  };

}


// ============================================================
// DESATIVAR
// ============================================================

export function deactivateWorkflow() {

  if (workflowState.running) {

    return {

      ok: false,

      error:
        "Existe um workflow em execução."

    };

  }


  workflowState.active = false;

  workflowState.updatedAt = now();


  return {

    ok: true,

    active: false

  };

}


// ============================================================
// CRIAR WORKFLOW
// ============================================================

export function createWorkflow(
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
        "Nome do workflow inválido."

    };

  }


  if (
    !Array.isArray(steps) ||
    steps.length === 0
  ) {

    return {

      ok: false,

      error:
        "O workflow precisa possuir etapas."

    };

  }


  const workflow = {

    id:
      createId(),

    name:
      name.trim(),

    description:
      options.description || "",

    stopOnError:
      options.stopOnError !== false,

    createdAt:
      now(),

    updatedAt:
      now(),

    steps:
      steps.map(
        (step, index) => ({

          id:
            step.id ||
            `WF-STEP-${index + 1}`,

          name:
            step.name ||
            `Etapa ${index + 1}`,

          type:
            step.type ||
            "task",

          input:
            step.input ??
            null,

          action:
            step.action ??
            null,

          options:
            step.options ||
            {},

          status:
            "pending",

          result:
            null,

          error:
            null

        })
      ),

    metadata:
      options.metadata || {}

  };


  return {

    ok: true,

    workflow

  };

}


// ============================================================
// CONVERTER WORKFLOW → AUTOMAÇÃO
// ============================================================

function workflowToAutomation(
  workflow
) {

  return {

    id:
      workflow.id,

    name:
      workflow.name,

    description:
      workflow.description,

    steps:
      workflow.steps.map(
        step => ({

          id:
            step.id,

          name:
            step.name,

          type:
            step.type,

          input:
            step.input,

          action:
            step.action,

          status:
            step.status,

          result:
            step.result,

          error:
            step.error

        })
      ),

    status:
      "created",

    createdAt:
      workflow.createdAt,

    updatedAt:
      now(),

    metadata:
      workflow.metadata

  };

}


// ============================================================
// EXECUTAR WORKFLOW
// ============================================================

export async function runWorkflow(
  workflow,
  options = {}
) {

  if (!workflow) {

    return {

      ok: false,

      error:
        "Workflow inválido."

    };

  }


  if (
    !Array.isArray(
      workflow.steps
    ) ||
    workflow.steps.length === 0
  ) {

    return {

      ok: false,

      error:
        "Workflow sem etapas."

    };

  }


  if (!workflowState.active) {

    activateWorkflow();

  }


  if (workflowState.running) {

    return {

      ok: false,

      error:
        "Outro workflow já está em execução."

    };

  }


  workflowState.running =
    true;

  workflowState.currentWorkflow =
    workflow.id;

  workflowState.currentStep =
    null;

  workflowState.totalWorkflows += 1;

  workflowState.updatedAt =
    now();

  workflowState.lastError =
    null;


  emit(
    EVENTS.PLAN_CREATED,
    {
      source:
        "workflow",

      workflow
    }
  );


  try {

    const automation =
      workflowToAutomation(
        workflow
      );


    const result =
      await executeAutomation(
        automation,
        {
          ...options,

          stopOnError:
            workflow.stopOnError,

          executeTasks:
            options.executeTasks === true
        }
      );


    workflow.updatedAt =
      now();


    workflowState.lastResult =
      result;


    if (result.ok) {

      workflowState.completedWorkflows +=
        1;

    } else {

      workflowState.failedWorkflows +=
        1;

      workflowState.lastError =
        result.error ||
        "Workflow falhou.";

    }


    workflowState.running =
      false;

    workflowState.currentWorkflow =
      null;

    workflowState.currentStep =
      null;

    workflowState.updatedAt =
      now();


    return {

      ok:
        result.ok !== false,

      workflow,

      result

    };

  } catch (error) {

    const message =
      error?.message ||
      String(error);


    workflowState.failedWorkflows +=
      1;

    workflowState.lastError =
      message;

    workflowState.lastResult =
      null;


    workflowState.running =
      false;

    workflowState.currentWorkflow =
      null;

    workflowState.currentStep =
      null;

    workflowState.updatedAt =
      now();


    emit(
      EVENTS.SYSTEM_ERROR,
      {
        source:
          "workflow",

        error:
          message
      }
    );


    return {

      ok: false,

      workflow,

      error:
        message

    };

  }

}


// ============================================================
// EXECUTAR WORKFLOW SIMPLES
// ============================================================

export async function runSimpleWorkflow(
  name,
  steps,
  options = {}
) {

  const created =
    createWorkflow(
      name,
      steps,
      options
    );


  if (!created.ok) {

    return created;

  }


  return await runWorkflow(
    created.workflow,
    options
  );

}


// ============================================================
// HISTÓRICO
// ============================================================

export function getWorkflowHistory(
  options = {}
) {

  return getAutomationHistory(
    options
  );

}


// ============================================================
// BUSCA
// ============================================================

export function searchWorkflows(
  query
) {

  return searchAutomationMemory(
    query
  );

}


// ============================================================
// STATUS
// ============================================================

export function getWorkflowState() {

  return {
    ...workflowState
  };

}


// ============================================================
// VISÃO GERAL
// ============================================================

export function getWorkflowOverview() {

  return {

    ok: true,

    workflow:
      getWorkflowState(),

    history:
      getWorkflowHistory({
        limit: 10
      })

  };

}


// ============================================================
// CANCELAMENTO
// ============================================================

export function requestWorkflowCancellation() {

  if (!workflowState.running) {

    return {

      ok: false,

      error:
        "Nenhum workflow está em execução."

    };

  }


  workflowState.lastError =
    "Cancelamento solicitado.";

  workflowState.updatedAt =
    now();


  return {

    ok: true,

    requested: true

  };

}


// ============================================================
// TESTE
// ============================================================

export async function testWorkflow() {

  const result =
    await runSimpleWorkflow(

      "Workflow de teste",

      [

        {

          name:
            "Criar tarefa",

          type:
            "task",

          input:
            "Executar teste do workflow"

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
            "Workflow finalizado."

        }

      ]

    );


  return {

    ok:
      result.ok !== false,

    result,

    state:
      getWorkflowState()

  };

}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseWorkflow() {

  return {

    ok: true,

    version:
      WORKFLOW_VERSION,

    active:
      workflowState.active,

    running:
      workflowState.running,

    total:
      workflowState.totalWorkflows,

    completed:
      workflowState.completedWorkflows,

    failed:
      workflowState.failedWorkflows,

    currentWorkflow:
      workflowState.currentWorkflow,

    currentStep:
      workflowState.currentStep,

    lastError:
      workflowState.lastError,

    timestamp:
      now()

  };

}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getWorkflowInfo() {

  return {

    name:
      "JARVIS Workflow Engine",

    version:
      WORKFLOW_VERSION,

    capabilities: [

      "workflow creation",

      "multi-step workflows",

      "workflow execution",

      "automation integration",

      "workflow history",

      "workflow search",

      "workflow status",

      "workflow diagnostics"

    ]

  };

      }
