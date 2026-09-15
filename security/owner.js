// ============================================================
// JARVIS V6 — OWNER SECURITY
// Versão: 1.0.0
// Função: identidade e autorização do proprietário
// ============================================================

const SECURITY_VERSION = "1.0.0";

const OWNER_KEY =
  "JARVIS_V6_OWNER_PROFILE";

const SESSION_KEY =
  "JARVIS_V6_OWNER_SESSION";

const OWNER_NAME =
  "Fernando";


// ============================================================
// UTILITÁRIOS
// ============================================================

function now() {
  return new Date().toISOString();
}


function createId(prefix = "JARVIS") {

  return (
    prefix +
    "-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}


// ============================================================
// PERFIL DO PROPRIETÁRIO
// ============================================================

function getStoredOwner() {

  try {

    const saved =
      localStorage.getItem(
        OWNER_KEY
      );

    if (!saved) {
      return null;
    }

    return JSON.parse(saved);

  } catch {

    return null;
  }
}


// ============================================================
// CRIAR PERFIL
// ============================================================

export function initializeOwner() {

  const existing =
    getStoredOwner();

  if (existing) {
    return existing;
  }

  const owner = {

    id:
      createId("OWNER"),

    name:
      OWNER_NAME,

    role:
      "owner",

    system:
      "JARVIS",

    createdAt:
      now(),

    updatedAt:
      now()
  };

  localStorage.setItem(
    OWNER_KEY,
    JSON.stringify(owner)
  );

  return owner;
}


// ============================================================
// OBTER PROPRIETÁRIO
// ============================================================

export function getOwnerProfile() {

  return (
    getStoredOwner() ||
    initializeOwner()
  );
}


// ============================================================
// VERIFICAR IDENTIDADE DECLARADA
// ============================================================

export function isOwnerName(name) {

  const value =
    String(name || "")
      .trim()
      .toLowerCase();

  return (
    value ===
    OWNER_NAME.toLowerCase()
  );
}


// ============================================================
// SESSÃO DO PROPRIETÁRIO
// ============================================================

function getOwnerSession() {

  try {

    const saved =
      localStorage.getItem(
        SESSION_KEY
      );

    if (!saved) {
      return null;
    }

    const session =
      JSON.parse(saved);

    if (
      !session ||
      !session.id ||
      !session.createdAt
    ) {
      return null;
    }

    return session;

  } catch {

    return null;
  }
}


// ============================================================
// INICIAR SESSÃO PROTEGIDA
// ============================================================

export function createOwnerSession() {

  const owner =
    getOwnerProfile();

  const session = {

    id:
      createId("SESSION"),

    ownerId:
      owner.id,

    role:
      "owner",

    authenticated:
      true,

    createdAt:
      now(),

    lastActivity:
      now()
  };

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session)
  );

  return session;
}


// ============================================================
// ATUALIZAR SESSÃO
// ============================================================

export function refreshOwnerSession() {

  const session =
    getOwnerSession();

  if (!session) {
    return null;
  }

  session.lastActivity =
    now();

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session)
  );

  return session;
}


// ============================================================
// VERIFICAR SESSÃO
// ============================================================

export function isOwnerAuthenticated() {

  const session =
    getOwnerSession();

  if (!session) {
    return false;
  }

  return (
    session.authenticated === true &&
    session.role === "owner"
  );
}


// ============================================================
// AUTORIZAÇÃO DO NÚCLEO
// ============================================================

export function canAccessCore() {

  return (
    isOwnerAuthenticated()
  );
}


// ============================================================
// AUTORIZAÇÃO DO CÉREBRO
// ============================================================

export function canAccessBrain() {

  return (
    isOwnerAuthenticated()
  );
}


// ============================================================
// AUTORIZAÇÃO DA MEMÓRIA
// ============================================================

export function canManageMemory() {

  return (
    isOwnerAuthenticated()
  );
}


// ============================================================
// AUTORIZAÇÃO DO CONHECIMENTO
// ============================================================

export function canManageKnowledge() {

  return (
    isOwnerAuthenticated()
  );
}


// ============================================================
// AUTORIZAÇÃO DE CONFIGURAÇÕES
// ============================================================

export function canManageSettings() {

  return (
    isOwnerAuthenticated()
  );
}


// ============================================================
// AUTORIZAÇÃO DE COMANDOS SENSÍVEIS
// ============================================================

export function canExecuteSensitiveCommand() {

  return (
    isOwnerAuthenticated()
  );
}


// ============================================================
// VERIFICAÇÃO CENTRAL
// ============================================================

export function authorize(permission) {

  if (
    !isOwnerAuthenticated()
  ) {

    return {

      allowed: false,

      permission,

      reason:
        "Acesso restrito ao proprietário.",

      timestamp:
        now()
    };
  }

  return {

    allowed: true,

    permission,

    role:
      "owner",

    timestamp:
      now()
  };
}


// ============================================================
// ENCERRAR SESSÃO
// ============================================================

export function logoutOwner() {

  localStorage.removeItem(
    SESSION_KEY
  );

  return true;
}


// ============================================================
// STATUS DE SEGURANÇA
// ============================================================

export function getSecurityState() {

  const owner =
    getOwnerProfile();

  const session =
    getOwnerSession();

  return {

    version:
      SECURITY_VERSION,

    system:
      "JARVIS",

    owner: {

      id:
        owner?.id || null,

      name:
        owner?.name || OWNER_NAME,

      role:
        owner?.role || "owner"
    },

    session: {

      active:
        Boolean(session),

      authenticated:
        Boolean(
          session?.authenticated
        ),

      role:
        session?.role || null,

      createdAt:
        session?.createdAt || null,

      lastActivity:
        session?.lastActivity || null
    },

    coreAccess:
      canAccessCore(),

    brainAccess:
      canAccessBrain(),

    memoryAccess:
      canManageMemory(),

    knowledgeAccess:
      canManageKnowledge(),

    settingsAccess:
      canManageSettings(),

    sensitiveCommands:
      canExecuteSensitiveCommand(),

    timestamp:
      now()
  };
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseSecurity() {

  try {

    const owner =
      getOwnerProfile();

    const session =
      getOwnerSession();

    return {

      ok: true,

      version:
        SECURITY_VERSION,

      ownerConfigured:
        Boolean(owner),

      ownerName:
        owner?.name || null,

      sessionActive:
        Boolean(session),

      authenticated:
        Boolean(
          session?.authenticated
        ),

      protectedCore:
        true,

      protectedBrain:
        true,

      protectedMemory:
        true,

      protectedKnowledge:
        true,

      timestamp:
        now()
    };

  } catch (error) {

    return {

      ok: false,

      version:
        SECURITY_VERSION,

      error:
        error?.message ||
        "Erro no módulo de segurança.",

      timestamp:
        now()
    };
  }
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getSecurityInfo() {

  return {

    name:
      "JARVIS OWNER SECURITY",

    version:
      SECURITY_VERSION,

    owner:
      OWNER_NAME,

    protectedAreas: [

      "core",

      "brain",

      "memory",

      "knowledge",

      "settings",

      "sensitive_commands"
    ],

    timestamp:
      now()
  };
    }
