import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Palette } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useUpdateBranding } from '@/hooks/queries'
import { PermissionGate } from '@/components/permission-gate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { extractErrorMessage } from '@/lib/utils'

interface Branding {
  logoUrl?: string
  primaryColor?: string
  customDomain?: string
}

export function BrandingCard() {
  const { workspace } = useAuth()
  const updateBranding = useUpdateBranding()
  const [branding, setBranding] = useState<Branding>({})

  useEffect(() => {
    const settings = (workspace?.settings ?? {}) as { branding?: Branding }
    setBranding(settings.branding ?? {})
  }, [workspace])

  function handleSave() {
    updateBranding.mutate(
      {
        logoUrl: branding.logoUrl || undefined,
        primaryColor: branding.primaryColor || undefined,
        customDomain: branding.customDomain || undefined,
      },
      {
        onSuccess: (updated) => {
          toast.success('Branding atualizado.')
          const settings = (updated as { settings?: { branding?: Branding } })?.settings
          if (settings?.branding) setBranding(settings.branding)
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-4 w-4" /> Branding (white-label)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <PermissionGate permission="workspace:manage" fallback={<p className="text-sm text-text-muted">Sem permissão pra editar o branding.</p>}>
          <div>
            <Label htmlFor="branding-logo">URL da logo</Label>
            <Input
              id="branding-logo"
              placeholder="https://..."
              value={branding.logoUrl ?? ''}
              onChange={(e) => setBranding((b) => ({ ...b, logoUrl: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="branding-color">Cor primária</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="branding-color"
                  placeholder="#1a73e8"
                  value={branding.primaryColor ?? ''}
                  onChange={(e) => setBranding((b) => ({ ...b, primaryColor: e.target.value }))}
                />
                {branding.primaryColor && (
                  <span className="h-8 w-8 shrink-0 rounded-md border border-border" style={{ backgroundColor: branding.primaryColor }} />
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="branding-domain">Domínio customizado</Label>
              <Input
                id="branding-domain"
                placeholder="crm.seucliente.com.br"
                value={branding.customDomain ?? ''}
                onChange={(e) => setBranding((b) => ({ ...b, customDomain: e.target.value }))}
              />
            </div>
          </div>
          <p className="text-[11px] text-text-faint">
            O domínio fica só salvo aqui — apontar DNS/proxy de verdade é passo de infraestrutura à parte.
          </p>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={updateBranding.isPending}>
              {updateBranding.isPending ? 'Salvando...' : 'Salvar branding'}
            </Button>
          </div>
        </PermissionGate>
      </CardContent>
    </Card>
  )
}
