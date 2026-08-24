import { BadRequestException } from '@nestjs/common';

export interface GeminiMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GenerateReplyParams {
  apiKey: string;
  model: string;
  systemInstruction: string;
  history: GeminiMessage[];
  searchGrounding?: boolean;
}

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

/**
 * Cliente fino pra API REST do Gemini (generativelanguage.googleapis.com) — sem SDK,
 * mesmo espírito do whatsapp-graph-client.ts: menos superfície pra desatualizar.
 */
export async function generateGeminiReply(params: GenerateReplyParams): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${params.apiKey}`;

  const body: Record<string, unknown> = {
    contents: params.history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    systemInstruction: { parts: [{ text: params.systemInstruction }] },
    generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
  };
  if (params.searchGrounding) {
    body.tools = [{ google_search: {} }];
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => null)) as GeminiResponse | null;

  if (!response.ok) {
    throw new BadRequestException(`Falha ao chamar o Gemini: ${data?.error?.message ?? response.statusText}`);
  }
  if (data?.promptFeedback?.blockReason) {
    throw new BadRequestException(`Gemini bloqueou a resposta: ${data.promptFeedback.blockReason}`);
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text.trim()) {
    throw new BadRequestException('Gemini não retornou texto na resposta.');
  }
  return text.trim();
}
