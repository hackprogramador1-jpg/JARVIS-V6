// ============================================================
// JARVIS V6 — COMMAND ENGINE
// Versão: 1.0.0
// ============================================================

import {
  executeAction
} from "./executor.js";

import {
  analyzeRequest
} from "./core.js";

import {
  decide
} from "./decision.js";

import {
  registerExecution,
  registerError
} from "./state.js";


// ============================================================
// VERSÃO
// ============================================================

export const COMMAND_VERSION = "1.0.0";


// ============================================================
// COMANDOS SUPORTADOS
// ============================================================

export const COMMANDS = {

  TIME:
    "time",

  DATE:
    "date",

  STATUS:
    "status",

  SEARCH:
    "search",

  OPEN_APP:
    "openApp",

  MEMORY:
    "memory",

  KNOWLEDGE:
    "knowledge",

  BRAIN:
    "brain"

};


// ============================================================
// NORMALIZAR COMANDO
// ============================================================

function normalizeCommand(
  command
) {

  if (
    typeof command !== "string"
  ) {

    return null;
  }


  const normalized =
    command
      .trim()
      .toLowerCase();


  const aliases = {

    "hora":
      COMMANDS.TIME,

    "que horas":
      COMMANDS.TIME,

    "data":
      COMMANDS.DATE,

    "hoje":
      COMMANDS.DATE,

    "status":
      COMMANDS.STATUS,

    "pesquisa":
      COMMANDS.SEARCH,

    "pesquisar":
      COMMANDS.SEARCH,

    "buscar":
      COMMANDS.SEARCH,

    "abrir":
      COMMANDS.OPEN_APP,

    "memoria":
      COMMANDS.MEMORY,

    "memória":
      COMMANDS.MEMORY,

    "conhecimento":
      COMMANDS.KNOWLEDGE,

    "cerebro":
      COMMANDS.BRAIN,

    "cérebro":
      COMMANDS.BRAIN

  };


  return (
    aliases[normalized] ||
    normalized
  );
}


// ============================================================
// EXECUTAR COMANDO DIRETO
// ============================================================

export async function executeCommand(
  command,
  data = {},
  options = {}
) {

  const normalized =
    normalizeCommand(
      command
    );


  if (!normalized) {

    return {

      ok: false,

      error:
        "Comando inválido."
    };
  }


  try {

    const result =
      await executeAction(
        normalized,
        data
      );


    registerExecution({

      type:
        "command",

      command:
        normalized,

      result

    });


    return {

      ok:
        result?.ok !== false,

      command:
        normalized,

      result

    };


  } catch (error) {

    registerError(
      error
    );


    return {

      ok: false,

      command:
        normalized,

      error:
        error?.message ||
        "Erro ao executar comando."

    };
  }
}


// ============================================================
// EXECUTAR A PARTIR DE TEXTO
// ============================================================

export async function executeFromText(
  input,
  options = {}
) {

  if (
    typeof input !== "string" ||
    !input.trim()
  ) {

    return {

      ok: false,

      error:
        "Entrada vazia."
    };
  }


  try {

    const analysis =
      analyzeRequest(
        input
      );


    const decision =
      decide(
        input,
        options
      );


    // --------------------------------------------------------
    // SE FOR COMANDO
    // --------------------------------------------------------

    if (
      decision?.decision ===
        "command" ||
      decision?.action ===
        "command" ||
      analysis?.intent ===
        "open_app"
    ) {

      return executeCommand(

        analysis.action ||
        analysis.intent ||
        "status",

        {

          query:
            analysis.query,

          target:
            analysis.target,

          input

        },

        options

      );
    }


    // --------------------------------------------------------
    // NÃO É COMANDO
    // --------------------------------------------------------

    return {

      ok: false,

      handled:
        false,

      reason:
        "A entrada não corresponde a um comando direto.",

      analysis,

      decision

    };


  } catch (error) {

    registerError(
      error
    );


    return {

      ok: false,

      error:
        error?.message ||
        "Falha ao analisar comando."

    };
  }
}


// ============================================================
// VERIFICAR COMANDO
// ============================================================

export function isCommand(
  command
) {

  const normalized =
    normalizeCommand(
      command
    );


  return Object.values(
    COMMANDS
  ).includes(
    normalized
  );
}


// ============================================================
// LISTAR COMANDOS
// ============================================================

export function getCommands() {

  return Object.values(
    COMMANDS
  );
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseCommand() {

  return {

    ok: true,

    version:
      COMMAND_VERSION,

    commands:
      getCommands(),

    count:
      getCommands().length,

    timestamp:
      new Date().toISOString()

  };
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getCommandInfo() {

  return {

    name:
      "JARVIS Command Engine",

    version:
      COMMAND_VERSION,

    role:
      "Executar comandos diretos do sistema.",

    commands:
      getCommands()

  };
}
