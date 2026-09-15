// ============================================================
// JARVIS V6 — SESSION MANAGER
// Versão: 1.0.0
// ============================================================

export const SESSION_VERSION = "1.0.0";

const SESSION_KEY =
  "JARVIS_V6_SESSION";

const MAX_MESSAGES = 100;


// ============================================================
// CRIAR ID
// ============================================================

function createId() {

  return (
    "session_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}


// ============================================================
// ESTADO PADRÃO
// ============================================================

function createDefaultSession() {

  const now =
    new Date().toISOString();

  return {

    id:
      createId(),

    active:
      true,

    startedAt:
      now,

    updatedAt:
      now,

    messages: [],

    lastInput:
      null,

    lastResponse:
      null,

    metadata: {}

  };
}


// ============================================================
// CARREGAR
// ============================================================

function loadSession() {

  try {

    const saved =
      localStorage.getItem(
        SESSION_KEY
      );

    if (!saved) {

      return createDefaultSession();
    }

    const parsed =
      JSON.parse(
        saved
      );

    return {

      ...createDefaultSession(),

      ...parsed,

      messages:
        Array.isArray(
          parsed.messages
        )
          ? parsed.messages
          : []

    };

  } catch (error) {

    console.error(
      "JARVIS SESSION LOAD ERROR:",
      error
    );

    return createDefaultSession();
  }
}


// ============================================================
// SALVAR
// ============================================================

function saveSession(
  session
) {

  try {

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(
        session
      )
    );

    return true;

  } catch (error) {

    console.error(
      "JARVIS SESSION SAVE ERROR:",
      error
    );

    return false;
  }
}


// ============================================================
// SESSÃO ATUAL
// ============================================================

let session =
  loadSession();


// ============================================================
// OBTER SESSÃO
// ============================================================

export function getSession() {

  return {

    ...session,

    messages:
      [...session.messages],

    metadata:
      {
        ...session.metadata
      }

  };
}


// ============================================================
// NOVA SESSÃO
// ============================================================

export function createSession(
  metadata = {}
) {

  session =
    createDefaultSession();


  session.metadata =
    {
      ...metadata
    };


  saveSession(
    session
  );


  return getSession();
}


// ============================================================
// ATIVAR SESSÃO
// ============================================================

export function activateSession() {

  session.active =
    true;

  session.updatedAt =
    new Date().toISOString();


  saveSession(
    session
  );


  return getSession();
}


// ============================================================
// ENCERRAR SESSÃO
// ============================================================

export function closeSession() {

  session.active =
    false;

  session.updatedAt =
    new Date().toISOString();


  saveSession(
    session
  );


  return getSession();
}


// ============================================================
// ADICIONAR MENSAGEM
// ============================================================

export function addMessage(
  role,
  content,
  metadata = {}
) {

  if (
    !content ||
    typeof content !== "string"
  ) {

    return null;
  }


  const message = {

    id:
      createId(),

    role:
      role || "user",

    content:
      content.trim(),

    timestamp:
      new Date().toISOString(),

    metadata:
      {
        ...metadata
      }

  };


  session.messages.push(
    message
  );


  // Limitar histórico
  if (
    session.messages.length >
    MAX_MESSAGES
  ) {

    session.messages =
      session.messages.slice(
        -MAX_MESSAGES
      );
  }


  if (
    message.role === "user"
  ) {

    session.lastInput =
      message.content;
  }


  if (
    message.role === "assistant"
  ) {

    session.lastResponse =
      message.content;
  }


  session.updatedAt =
    new Date().toISOString();


  saveSession(
    session
  );


  return message;
}


// ============================================================
// REGISTRAR ENTRADA
// ============================================================

export function registerUserMessage(
  content,
  metadata = {}
) {

  return addMessage(
    "user",
    content,
    metadata
  );
}


// ============================================================
// REGISTRAR RESPOSTA
// ============================================================

export function registerAssistantMessage(
  content,
  metadata = {}
) {

  return addMessage(
    "assistant",
    content,
    metadata
  );
}


// ============================================================
// HISTÓRICO
// ============================================================

export function getMessages(
  limit = MAX_MESSAGES
) {

  const safeLimit =
    Math.max(
      1,
      Math.min(
        Number(limit) || MAX_MESSAGES,
        MAX_MESSAGES
      )
    );


  return session.messages
    .slice(
      -safeLimit
    );
}


// ============================================================
// ÚLTIMA MENSAGEM
// ============================================================

export function getLastMessage() {

  if (
    !session.messages.length
  ) {

    return null;
  }


  return session.messages[
    session.messages.length - 1
  ];
}


// ============================================================
// LIMPAR HISTÓRICO
// ============================================================

export function clearMessages() {

  session.messages = [];

  session.lastInput =
    null;

  session.lastResponse =
    null;

  session.updatedAt =
    new Date().toISOString();


  saveSession(
    session
  );


  return getSession();
}


// ============================================================
// METADADOS
// ============================================================

export function setSessionMetadata(
  key,
  value
) {

  if (
    !key
  ) {

    return false;
  }


  session.metadata[
    key
  ] = value;


  session.updatedAt =
    new Date().toISOString();


  saveSession(
    session
  );


  return true;
}


export function getSessionMetadata(
  key
) {

  if (
    !key
  ) {

    return {
      ...session.metadata
    };
  }


  return session.metadata[
    key
  ];
}


// ============================================================
// CONTEXTO PARA IA
// ============================================================

export function getSessionContext(
  limit = 20
) {

  return {

    sessionId:
      session.id,

    active:
      session.active,

    messages:
      getMessages(
        limit
      ),

    lastInput:
      session.lastInput,

    lastResponse:
      session.lastResponse,

    startedAt:
      session.startedAt,

    updatedAt:
      session.updatedAt

  };
}


// ============================================================
// EXPORTAR
// ============================================================

export function exportSession() {

  return JSON.stringify(
    getSession(),
    null,
    2
  );
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseSession() {

  return {

    ok: true,

    version:
      SESSION_VERSION,

    active:
      session.active,

    sessionId:
      session.id,

    messageCount:
      session.messages.length,

    startedAt:
      session.startedAt,

    updatedAt:
      session.updatedAt

  };
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getSessionInfo() {

  return {

    name:
      "JARVIS Session Manager",

    version:
      SESSION_VERSION,

    storage:
      "localStorage",

    maxMessages:
      MAX_MESSAGES,

    capabilities: [

      "session",

      "conversation-history",

      "metadata",

      "context",

      "export"

    ]

  };
}
