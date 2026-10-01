type OpenAIResult = {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
  model: string;
};

function extractText(payload: any): string {
  if (
    typeof payload?.output_text === "string" &&
    payload.output_text.trim()
  ) {
    return payload.output_text;
  }

  const parts: string[] = [];

  for (const item of payload?.output ?? []) {
    if (item?.type !== "message") continue;

    for (const content of item?.content ?? []) {
      if (
        content?.type === "output_text" &&
        typeof content?.text === "string"
      ) {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim();
}

export async function runOpenAIPrompt(
  input: string,
  options: {
    apiKey: string;
    model: string;
  }
): Promise<OpenAIResult> {
  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${options.apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: options.model,
        input: [
          {
            role: "user",
            content: input
          }
        ],
        max_output_tokens: 2000
      })
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      `Falha na OpenAI (${response.status})`;

    throw new Error(message);
  }

  return {
    text:
      extractText(payload) ||
      "A API retornou uma resposta sem texto.",
    model:
      payload?.model ||
      options.model,
    inputTokens:
      payload?.usage?.input_tokens,
    outputTokens:
      payload?.usage?.output_tokens
  };
}
