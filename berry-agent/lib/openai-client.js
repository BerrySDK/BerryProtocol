import OpenAI from "openai";

export function createModelGateway(config) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const baseURL =
    process.env.OPENAI_BASE_URL ||
    (groqKey && !process.env.OPENAI_API_KEY
      ? "https://api.groq.com/openai/v1"
      : undefined);

  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  function resolveModel(kind = "default") {
    if (kind === "code") {
      return process.env.CODE_MODEL || process.env.OPENAI_MODEL || process.env.GROQ_MODEL || config.models.code || config.models.default;
    }

    return process.env.OPENAI_MODEL || process.env.GROQ_MODEL || config.models.default;
  }

  return {
    client,
    resolveModel,
  };
}
