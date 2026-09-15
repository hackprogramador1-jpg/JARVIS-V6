// ============================================================
// JARVIS V6 — REALTIME API
// Versão: 1.0.0
// ============================================================

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY;


// ============================================================
// ERRO
// ============================================================

function sendError(
  res,
  status,
  message,
  details = null
) {

  return res.status(status).json({

    ok: false,

    error: message,

    details:
      process.env.NODE_ENV === "development"
        ? details
        : undefined,

    timestamp:
      new Date().toISOString()
  });
}


// ============================================================
// HANDLER
// ============================================================

export default async function handler(
  req,
  res
) {

  if (
    req.method !== "POST"
  ) {

    return sendError(
      res,
      405,
      "Método não permitido."
    );
  }


  if (!OPENAI_API_KEY) {

    return sendError(
      res,
      500,
      "OPENAI_API_KEY não configurada."
    );
  }


  try {

    const body =
      req.body || {};


    const action =
      typeof body.action === "string"
        ? body.action
        : "status";


    // ========================================================
    // STATUS
    // ========================================================

    if (
      action === "status"
    ) {

      return res.status(200).json({

        ok: true,

        realtime: {

          available: true,

          provider:
            "OpenAI",

          configured: true,

          api:
            "realtime"

        },

        timestamp:
          new Date().toISOString()
      });
    }


    // ========================================================
    // CONFIGURAÇÃO
    // ========================================================

    if (
      action === "config"
    ) {

      return res.status(200).json({

        ok: true,

        realtime: {

          configured: true,

          provider:
            "OpenAI",

          mode:
            "server",

          note:
            "A comunicação realtime será conectada pelo cliente quando o módulo de voz for ativado."

        },

        timestamp:
          new Date().toISOString()
      });
    }


    // ========================================================
    // AÇÃO DESCONHECIDA
    // ========================================================

    return sendError(
      res,
      400,
      "Ação realtime desconhecida."
    );


  } catch (error) {

    console.error(
      "JARVIS REALTIME ERROR:",
      error
    );


    return sendError(
      res,
      500,
      "Erro interno no módulo realtime.",
      error?.message
    );
  }
}
