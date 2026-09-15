// ============================================================
// JARVIS V6 — AI BRIDGE
// Versão: 1.0.0
// ============================================================

import {
  getSessionContext,
  registerUserMessage,
  registerAssistantMessage
} from "./session.js";

import {
  getMemory,
  searchMemory,
  searchLearned
} from "./memory.js";

import {
  getKnowledge
} from "./knowledge.js";

import {
  getBrainState
} from "./state.js";

import {
  getContext
} from "./context.js";


// ============================================================
// VERSÃO
// ============================================================

export const AI_VERSION = "1.0.0";


// ============================================================
// CONFIGURAÇÃO
// ============================================================

const API_ENDPOINT =
  "/api/chat";


// ============================================================
// CONSTRUIR CONTEXTO
// ============================================================

export function buildAIRequestContext(
  message,
  options = {}
) {

  const memory =
    getMemory();

  const learned =
    searchLearned(
      message
    );

  const relevantMemory =
    searchMemory(
      message
    );

  const knowledge =
    getKnowledge();

  const brain =
    getBrainState();

  const deviceContext =
    getContext();

  const session =
    getSessionContext(
      options.historyLimit || 20
    );


  return {

    memory: {

      profile:
        memory.owner,

      relevant:
        relevantMemory,

      learned

    },

    knowledge,

    brain,

    device:
      deviceContext,

    session

  };
}


// ============================================================
// ENVIAR PARA IA
// ============================================================

export async function askAI(
  message,
  options = {}
) {

  if (
    typeof message !== "string" ||
    !message.trim()
  ) {

    return {

      ok: false,

      error:
        "Mensagem vazia."
    };
  }


  const text =
    message.trim();


  const context =
    buildAIRequestContext(
      text,
      options
    );


  registerUserMessage(
    text
  );


  try {

    const response =
      await fetch(
        API_ENDPOINT,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({

              message:
                text,

              memory:
                context.memory,

              knowledge:
                context.knowledge,

              brain:
                context.brain,

              session:
                context.session,

              context,

              clientDateTime:
                new Date().toISOString(),

              clientTimeZone:
                Intl.DateTimeFormat()
                  .resolvedOptions()
                  .timeZone

            })

        }
      );


    const data =
      await response.json();


    if (
      !response.ok ||
      data?.ok === false
    ) {

      return {

        ok: false,

        error:
          data?.error ||
          "Falha ao consultar a IA.",

        status:
          response.status

      };
    }


    const answer =
      data.response ||
      data.result ||
      "";


    if (!answer) {

      return {

        ok: false,

        error:
          "A IA não retornou uma resposta."
      };
    }


    registerAssistantMessage(
      answer,
      {

        model:
          data.model ||
          null,

        responseId:
          data.responseId ||
          null

      }
    );


    return {

      ok: true,

      response:
        answer,

      memoryToSave:
        data.memoryToSave ||
        null,

      model:
        data.model ||
        null,

      responseId:
        data.responseId ||
        null,

      usage:
        data.usage ||
        null

    };


  } catch (error) {

    console.error(
      "JARVIS AI BRIDGE ERROR:",
      error
    );


    return {

      ok: false,

      error:
        "Não foi possível conectar ao núcleo de IA.",

      details:
        error?.message ||
        null

    };
  }
}


// ============================================================
// PERGUNTA SIMPLES
// ============================================================

export async function chat(
  message,
  options = {}
) {

  return askAI(
    message,
    options
  );
}


// ============================================================
// TESTAR CONEXÃO
// ============================================================

export async function testAI() {

  return askAI(
    "Responda apenas: JARVIS ONLINE."
  );
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export async function diagnoseAI() {

  try {

    const result =
      await testAI();


    return {

      ok:
        result.ok === true,

      version:
        AI_VERSION,

      endpoint:
        API_ENDPOINT,

      connected:
        result.ok === true,

      response:
        result.response ||
        null,

      error:
        result.error ||
        null

    };


  } catch (error) {

    return {

      ok: false,

      version:
        AI_VERSION,

      endpoint:
        API_ENDPOINT,

      connected:
        false,

      error:
        error?.message ||
        "Falha no diagnóstico."

    };
  }
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getAIInfo() {

  return {

    name:
      "JARVIS AI Bridge",

    version:
      AI_VERSION,

    endpoint:
      API_ENDPOINT,

    capabilities: [

      "AI",

      "conversation",

      "memory-context",

      "knowledge-context",

      "session-context",

      "brain-context"

    ]

  };
        }
