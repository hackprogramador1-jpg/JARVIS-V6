// ============================================================
// JARVIS V6 — WEB SEARCH API
// Versão: 1.0.0
// ============================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const MODEL =
  process.env.JARVIS_MODEL ||
  "gpt-5.6-luna";


// ============================================================
// ERRO
// ============================================================

function sendError(res, status, message, details = null) {

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
// EXTRAIR TEXTO
// ============================================================

function extractText(data) {

  if (
    typeof data?.output_text === "string" &&
    data.output_text.trim()
  ) {

    return data.output_text.trim();
  }


  const parts = [];


  for (
    const item of data?.output || []
  ) {

    for (
      const content of item?.content || []
    ) {

      if (
        typeof content?.text === "string"
      ) {

        parts.push(
          content.text
        );

      } else if (
        typeof content?.text?.value === "string"
      ) {

        parts.push(
          content.text.value
        );
      }
    }
  }


  return parts
    .join("\n")
    .trim();
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


    const query =
      typeof body.query === "string"
        ? body.query.trim()
        : "";


    if (!query) {

      return sendError(
        res,
        400,
        "Consulta não informada."
      );
    }


    if (
      query.length > 4000
    ) {

      return sendError(
        res,
        400,
        "Consulta muito grande."
      );
    }


    const prompt = `
Você é o mecanismo de pesquisa do JARVIS.

Pesquise na internet usando as ferramentas disponíveis.

Consulta do usuário:
${query}

REGRAS:
- Priorize informações atuais.
- Responda em português do Brasil.
- Seja objetivo.
- Diferencie fatos de opiniões.
- Quando houver fontes, mencione as fontes relevantes.
- Não invente resultados.
`;


    const response =
      await fetch(
        "https://api.openai.com/v1/responses",
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${OPENAI_API_KEY}`
          },

          body:
            JSON.stringify({

              model:
                MODEL,

              input:
                prompt,

              tools: [

                {

                  type:
                    "web_search"
                }

              ]

            })
        }
      );


    const data =
      await response.json();


    if (
      !response.ok
    ) {

      return sendError(
        res,
        response.status,
        "Erro na pesquisa web.",
        data
      );
    }


    const result =
      extractText(data);


    if (!result) {

      return sendError(
        res,
        502,
        "A pesquisa não retornou resultado."
      );
    }


    return res.status(200).json({

      ok: true,

      query,

      result,

      model:
        MODEL,

      responseId:
        data.id ||
        null,

      usage:
        data.usage ||
        null,

      timestamp:
        new Date().toISOString()
    });


  } catch (error) {

    console.error(
      "JARVIS SEARCH ERROR:",
      error
    );


    return sendError(
      res,
      500,
      "Erro interno na pesquisa.",
      error?.message
    );
  }
}
