import { BadRequestException } from '@nestjs/common';

export interface SendTextMessageParams {
  graphApiVersion: string;
  phoneNumberId: string;
  accessToken: string;
  to: string;
  body: string;
}

interface GraphSendResponse {
  messages?: { id: string }[];
  error?: { message?: string };
}

/** Cliente fino pra Cloud API da Meta (WhatsApp Business Platform) — só envio de texto. */
export async function sendWhatsappTextMessage(params: SendTextMessageParams): Promise<{ wamid: string }> {
  const url = `https://graph.facebook.com/${params.graphApiVersion}/${params.phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: params.to,
      type: 'text',
      text: { body: params.body },
    }),
  });

  const data = (await response.json().catch(() => null)) as GraphSendResponse | null;

  if (!response.ok || !data?.messages?.[0]?.id) {
    throw new BadRequestException(`Falha ao enviar mensagem via WhatsApp: ${data?.error?.message ?? response.statusText}`);
  }

  return { wamid: data.messages[0].id };
}
