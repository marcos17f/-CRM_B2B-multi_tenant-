import { useState } from 'react'
import { toast } from 'sonner'
import { Bot, CheckCircle2 } from 'lucide-react'
import { useAiSettings, useUpdateAiSettings } from '@/hooks/queries'
import { PermissionGate } from '@/components/permission-gate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { extractErrorMessage } from '@/lib/utils'

const MODEL_OPTIONS = ['gemini-3.6-flash', 'gemini-3.6-pro']

export function AiSettingsCard() {
  const { data: settings, isLoading } = useAiSettings()
  const update = useUpdateAiSettings()
  const [apiKeyInput, setApiKeyInput] = useState('')

  function toggle(field: 'enabled' | 'agentEnabled' | 'thinkingMode' | 'searchGrounding', value: boolean) {
    update.mutate({ [field]: value }, { onError: (err) => toast.error(extractErrorMessage(err)) })
  }

  function saveApiKey() {
    if (!apiKeyInput.trim()) {
      toast.error('Cole a API key do Gemini.')
      return
    }
    update.mutate(
      { apiKey: apiKeyInput, lgpdConsent: true },
      {
        onSuccess: () => {
          toast.success('Chave salva.')
          setApiKeyInput('')
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
      },
    )
  }

  function changeModel(model: string) {
    update.mutate({ model }, { onError: (err) => toast.error(extractErrorMessage(err)) })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-accent-2" /> Central de I.A.
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <Skeleton className="h-40 w-full" />}

        {!isLoading && settings && (
          <PermissionGate permission="ai:manage" fallback={<p className="text-sm text-text-muted">Sem permissão pra editar a Central de I.A.</p>}>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div>
                <p className="text-sm text-text">Recursos de IA ativos</p>
                <p className="text-xs text-text-faint">Chave geral — desliga tudo de uma vez</p>
              </div>
              <Switch checked={settings.enabled} onCheckedChange={(v) => toggle('enabled', v)} />
            </div>

            <div>
              <Label htmlFor="gemini-key">API key do Google Gemini</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="gemini-key"
                  type="password"
                  placeholder={settings.hasApiKey ? '•••••••••••••••••••• (já configurada)' : 'Cole a chave aqui'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                />
                <Button size="sm" variant="secondary" onClick={saveApiKey} disabled={update.isPending}>
                  Salvar
                </Button>
              </div>
              {settings.hasApiKey && (
                <p className="mt-1 text-xs text-accent flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Chave configurada
                </p>
              )}
            </div>

            <div>
              <Label>Modelo</Label>
              <div className="flex gap-2">
                {MODEL_OPTIONS.map((m) => (
                  <Button
                    key={m}
                    size="sm"
                    variant={settings.model === m ? 'default' : 'secondary'}
                    onClick={() => changeModel(m)}
                    disabled={update.isPending}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div>
                <p className="text-sm text-text">Modo pensamento</p>
                <p className="text-xs text-text-faint">Raciocínio passo a passo antes de responder</p>
              </div>
              <Switch checked={settings.thinkingMode} onCheckedChange={(v) => toggle('thinkingMode', v)} />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div>
                <p className="text-sm text-text">Google Search Grounding</p>
                <p className="text-xs text-text-faint">Conecta o modelo à web pra validar informações</p>
              </div>
              <Switch checked={settings.searchGrounding} onCheckedChange={(v) => toggle('searchGrounding', v)} />
            </div>

            <div className="flex items-center justify-between rounded-md border border-accent/30 bg-accent/5 px-3 py-2">
              <div>
                <p className="text-sm text-text">Agente autônomo no WhatsApp</p>
                <p className="text-xs text-text-faint">
                  {settings.hasApiKey
                    ? 'Responde clientes sozinho — mensagens automáticas ficam marcadas como "Sistema/IA" no histórico.'
                    : 'Configure a API key acima primeiro.'}
                </p>
              </div>
              <Switch
                checked={settings.agentEnabled}
                disabled={!settings.hasApiKey || !settings.enabled}
                onCheckedChange={(v) => toggle('agentEnabled', v)}
              />
            </div>

            <p className="text-[11px] text-text-faint">
              Ao salvar a chave você confirma que está ciente de que as mensagens dos clientes são enviadas ao Google (Gemini) pra
              processamento — trate isso conforme a LGPD antes de habilitar o agente.
            </p>
          </PermissionGate>
        )}
      </CardContent>
    </Card>
  )
}
