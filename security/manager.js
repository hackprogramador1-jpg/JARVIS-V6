// ============================================================
// JARVIS V6 — SECURITY MANAGER
// Gerenciador central de segurança
// ============================================================

import {
  initializeOwner,
  getOwnerProfile,
  isOwnerAuthenticated,
  authorize,
  logoutOwner,
  diagnoseSecurity
} from "./owner.js";

import {
  getSettings
} from "../brain/settings.js";


// ============================================================
// VERSÃO
// ============================================================

export const SECURITY_MANAGER_VERSION = "1.0.0";


// ============================================================
// PERMISSÕES
// ============================================================

export const PERMISSIONS = {

  CORE:
    "core",

  BRAIN:
    "brain",

  MEMORY:
    "memory",

  KNOWLEDGE:
    "knowledge",

  SETTINGS:
    "settings",

  SENSITIVE_COMMAND:
    "sensitive_command"

};


// ============================================================
// ESTADO
// ============================================================

let initialized =
  false;

let lastAuthorization =
  null;

let lastError =
  null;


// ============================================================
// INICIALIZAR
// ============================================================

export function initializeSecurity(
  owner = null
) {

  try {

    const profile =
      initializeOwner(
        owner
      );


    initialized =
      true;

    lastError =
      null;


    return {

      ok: true,

      profile,

      authenticated:
        isOwnerAuthenticated()

    };

  } catch (error) {

    initialized =
      false;

    lastError =
      error.message;


    return {

      ok: false,

      error:
        lastError

    };
  }
}


// ============================================================
// PERFIL DO PROPRIETÁRIO
// ============================================================

export function getSecurityOwner() {

  return getOwnerProfile();
}


// ============================================================
// VERIFICAR AUTENTICAÇÃO
// ============================================================

export function isAuthenticated() {

  return isOwnerAuthenticated();
}


// ============================================================
// AUTORIZAR
// ============================================================

export function checkPermission(
  permission
) {

  if (
    !permission
  ) {

    return {

      ok: false,

      authorized: false,

      error:
        "Permissão não informada."
    };
  }


  try {

    const result =
      authorize(
        permission
      );


    lastAuthorization =
      {
        permission,

        authorized:
          result?.ok !== false,

        timestamp:
          new Date().toISOString()
      };


    return {

      ok:
        result?.ok !== false,

      authorized:
        result?.ok !== false,

      permission,

      result

    };

  } catch (error) {

    lastError =
      error.message;


    lastAuthorization =
      {
        permission,

        authorized:
          false,

        timestamp:
          new Date().toISOString(),

        error:
          error.message
      };


    return {

      ok: false,

      authorized: false,

      permission,

      error:
        error.message

    };
  }
}


// ============================================================
// EXIGIR PERMISSÃO
// ============================================================

export function requirePermission(
  permission
) {

  const result =
    checkPermission(
      permission
    );


  if (
    !result.authorized
  ) {

    throw new Error(
      "Acesso não autorizado."
    );
  }


  return true;
}


// ============================================================
// EXECUTAR COM AUTORIZAÇÃO
// ============================================================

export async function secureExecute(
  permission,
  callback
) {

  if (
    typeof callback !==
    "function"
  ) {

    return {

      ok: false,

      error:
        "Callback inválido."
    };
  }


  const authorization =
    checkPermission(
      permission
    );


  if (
    !authorization.authorized
  ) {

    return {

      ok: false,

      authorized: false,

      error:
        "Ação bloqueada por segurança.",

      permission

    };
  }


  try {

    const result =
      await callback();


    return {

      ok: true,

      authorized: true,

      permission,

      result

    };

  } catch (error) {

    lastError =
      error.message;


    return {

      ok: false,

      authorized: true,

      permission,

      error:
        error.message

    };
  }
}


// ============================================================
// PERMISSÕES RÁPIDAS
// ============================================================

export function canAccessCore() {

  return checkPermission(
    PERMISSIONS.CORE
  ).authorized;
}


export function canAccessBrain() {

  return checkPermission(
    PERMISSIONS.BRAIN
  ).authorized;
}


export function canManageMemory() {

  return checkPermission(
    PERMISSIONS.MEMORY
  ).authorized;
}


export function canManageKnowledge() {

  return checkPermission(
    PERMISSIONS.KNOWLEDGE
  ).authorized;
}


export function canManageSettings() {

  return checkPermission(
    PERMISSIONS.SETTINGS
  ).authorized;
}


export function canExecuteSensitiveCommand() {

  return checkPermission(
    PERMISSIONS.SENSITIVE_COMMAND
  ).authorized;
}


// ============================================================
// LOGOUT
// ============================================================

export function logout() {

  try {

    const result =
      logoutOwner();


    return {

      ok:
        result?.ok !== false

    };

  } catch (error) {

    lastError =
      error.message;


    return {

      ok: false,

      error:
        error.message

    };
  }
}


// ============================================================
// ESTADO DE SEGURANÇA
// ============================================================

export function getSecurityManagerState() {

  return {

    ok:
      initialized,

    version:
      SECURITY_MANAGER_VERSION,

    initialized,

    authenticated:
      isAuthenticated(),

    owner:
      getSecurityOwner(),

    lastAuthorization,

    lastError,

    settings:

      getSettings()

  };
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseSecurityManager() {

  const security =
    diagnoseSecurity();


  return {

    ok:
      initialized &&
      security?.ok !== false,

    manager: {

      version:
        SECURITY_MANAGER_VERSION,

      initialized,

      authenticated:
        isAuthenticated()

    },

    security,

    lastAuthorization,

    lastError,

    timestamp:
      new Date().toISOString()

  };
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getSecurityManagerInfo() {

  return {

    name:
      "JARVIS Security Manager",

    version:
      SECURITY_MANAGER_VERSION,

    capabilities: [

      "authentication state",

      "permission checking",

      "secure execution",

      "owner management",

      "sensitive command protection",

      "security diagnostics"

    ]

  };
    }
