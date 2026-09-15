// ============================================================
// JARVIS V6 — NATURAL COMMAND PROCESSOR
// Interpretação de comandos em linguagem natural
// ============================================================

import {
  analyzeRequest
} from "./core.js";

import {
  decide
} from "./decision.js";

import {
  executeFromText
} from "./command.js";

import {
  processChat
} from "./engine.js";

import {
  executeControlAction
} from "./control.js";

import {
  emit,
  EVENTS
} from "./events.js";


// ============================================================
// VERSÃO
// ============================================================

export const NATURAL_VERSION = "1.0.0";


// ============================================================
// NORMALIZAÇÃO
// ============================================================

function normalize(text) {

  return String(text || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}


// ============================================================
// DETECTAR CONTROLE DO SISTEMA
// ============================================================

function detectControlCommand(
  text
) {

  const value =
    normalize(text);


  if (
    value.includes("desligue a voz") ||
    value.includes("desativar voz") ||
    value.includes("desative a voz") ||
    value.includes("pare a voz")
  ) {

    return "voice_off";
  }


  if (
    value.includes("ative a voz") ||
    value.includes("ativar voz") ||
    value.includes("ligue a voz") ||
    value.includes("ligar voz")
  ) {

    return "voice_on";
  }


  if (
    value.includes("pare de ouvir") ||
    value.includes("parar de ouvir") ||
    value.includes("pare a escuta")
  ) {

    return "stop_listening";
  }


  if (
    value.includes("comece a ouvir") ||
    value.includes("comecar a ouvir") ||
    value.includes("inicie a escuta") ||
    value.includes("iniciar escuta")
  ) {

    return "listen";
  }


  if (
    value === "pause" ||
    value.includes("pause o jarvis") ||
    value.includes("pausar o jarvis")
  ) {

    return "pause";
  }


  if (
    value.includes("retome o jarvis") ||
    value.includes("retomar o jarvis") ||
    value === "resume"
  ) {

    return "resume";
  }


  if (
    value.includes("reinicie o jarvis") ||
    value.includes("reiniciar o jarvis") ||
    value === "restart"
  ) {

    return "restart";
  }


  if (
    value.includes("desligue o jarvis") ||
    value.includes("desligar o jarvis") ||
    value === "shutdown"
  ) {

    return "shutdown";
  }


  if (
    value.includes("ative o jarvis") ||
    value.includes("ativar o jarvis") ||
    value === "activate"
  ) {

    return "activate";
  }


  return null;
}


// ============================================================
// DETECTAR COMANDO NATURAL
// ============================================================

export function detectNaturalCommand(
  input
) {

  const text =
    String(input || "")
      .trim();


  if (!text) {

    return {

      ok: false,

      type:
        "empty"

    };
  }


  const control =
    detectControlCommand(
      text
    );


  if (control) {

    return {

      ok: true,

      type:
        "control",

      action:
        control,

      input:
        text

    };
  }


  const analysis =
    analyzeRequest(
      text
    );


  return {

    ok: true,

    type:
      "brain",

    intent:
      analysis?.intent ||
      "unknown",

    action:
      analysis?.action ||
      null,

    query:
      analysis?.query ||
      null,

    target:
      analysis?.target ||
      null,

    analysis

  };
}


// ============================================================
// EXECUTAR COMANDO NATURAL
// ============================================================

export async function executeNaturalCommand(
  input,
  options = {}
) {

  const detected =
    detectNaturalCommand(
      input
    );


  if (!detected.ok) {

    return {

      ok: false,

      error:
        "Não foi possível interpretar a entrada."
    };
  }


  emit(
    EVENTS.DECISION,
    {
      input,

      type:
        detected.type,

      intent:
        detected.intent ||

        null,

      action:
        detected.action ||

        null

    }
  );


  // ----------------------------------------------------------
  // CONTROLE
  // ----------------------------------------------------------

  if (
    detected.type ===
    "control"
  ) {

    const result =
      executeControlAction(
        detected.action
      );


    return {

      ok:
        result?.ok !== false,

      type:
        "control",

      action:
        detected.action,

      result

    };
  }


  // ----------------------------------------------------------
  // COMANDO DO CÉREBRO
  // ----------------------------------------------------------

  const decision =
    decide(
      input,
      options
    );


  if (
    decision?.decision ===
      "command" ||

    decision?.decision ===
      "answer" ||

    detected.intent ===
      "time" ||

    detected.intent ===
      "date" ||

    detected.intent ===
      "status" ||

    detected.intent ===
      "open_app" ||

    detected.intent ===
      "search"
  ) {

    const commandResult =
      await executeFromText(
        input,
        options
      );


    if (
      commandResult?.ok !== false
    ) {

      return {

        ok: true,

        type:
          "command",

        intent:
          detected.intent,

        action:
          detected.action,

        result:
          commandResult

      };
    }
  }


  // ----------------------------------------------------------
  // IA
  // ----------------------------------------------------------

  const aiResult =
    await processChat(
      input,
      options
    );


  return {

    ok:
      aiResult?.ok !== false,

    type:
      "ai",

    intent:
      detected.intent,

    response:
      aiResult?.response ||
      "",

    result:
      aiResult

  };
}


// ============================================================
// PROCESSAR FRASE
// ============================================================

export async function processNaturalInput(
  input,
  options = {}
) {

  if (
    typeof input !==
    "string" ||
    !input.trim()
  ) {

    return {

      ok: false,

      error:
        "Entrada inválida."
    };
  }


  try {

    return await executeNaturalCommand(
      input,
      options
    );

  } catch (error) {

    emit(
      EVENTS.SYSTEM_ERROR,
      {
        source:
          "natural",

        error:
          error.message
      }
    );


    return {

      ok: false,

      error:
        error.message

    };
  }
}


// ============================================================
// TESTE
// ============================================================

export async function testNatural() {

  const tests = [

    "Que horas são?",

    "Que dia é hoje?",

    "Abra o YouTube.",

    "Pesquise inteligência artificial.",

    "Qual o status do sistema?"

  ];


  const results = [];


  for (
    const input
    of tests
  ) {

    results.push({

      input,

      detected:
        detectNaturalCommand(
          input
        )

    });
  }


  return {

    ok: true,

    tests:
      results

  };
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseNatural() {

  return {

    ok: true,

    version:
      NATURAL_VERSION,

    capabilities: [

      "natural language detection",

      "control commands",

      "brain command routing",

      "AI fallback",

      "voice-compatible input"

    ],

    timestamp:
      new Date().toISOString()

  };
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getNaturalInfo() {

  return {

    name:
      "JARVIS Natural Command Processor",

    version:
      NATURAL_VERSION,

    purpose:
      "Transformar linguagem natural em ações do JARVIS.",

    capabilities: [

      "natural commands",

      "control commands",

      "brain routing",

      "AI routing",

      "voice integration"

    ]

  };
      }
