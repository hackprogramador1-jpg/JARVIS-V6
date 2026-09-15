// ============================================================
// JARVIS V6 — DIAGNOSTIC API
// Diagnóstico básico do backend
// ============================================================

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Método não permitido."
    });
  }

  const checks = {
    api: true,
    timestamp: new Date().toISOString(),
    environment: {
      node: typeof process !== "undefined",
      openaiKeyConfigured: Boolean(
        process.env.OPENAI_API_KEY
      )
    }
  };

  return res.status(200).json({
    ok: true,
    service: "JARVIS V6",
    version: "1.0.0",
    status: "online",
    checks
  });
}
