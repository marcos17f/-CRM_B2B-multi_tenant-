import { useState } from 'react'
import { toast } from 'sonner'
import { MessageCircle } from 'lucide-react'
import { useWhatsappConnection, useConnectWhatsapp, useDisconnectWhatsapp } from '@/hooks/queries'
import { PermissionGate } from '@/components/permission-gate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { extractErrorMessage } from '@/lib/utils'

export function WhatsappCard() {
  const { data: connection, isLoading } = useWhatsappConnection()
  const connect = useConnectWhatsapp()
  const disconnect = useDisconnectWhatsapp()

  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [displayPhone, setDisplayPhone] = useState('')

  function handleConnect() {
    if (!phoneNumberId.trim() || !accessToken.trim()) {
      toast.error('Preencha phoneNumberId e accessToken (do painel de desenvolvedor da Meta).')
      return
    }
    connect.mutate(
      { phoneNumberId, accessToken, displayPhone: displayPhone || undefined },
      {
        onSuccess: () => {
          toast.success('WhatsApp conectado.')
          setPhoneNumberId('')
          setAccessToken('')
          setDisplayPhone('')
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
      },
    )
  }

  function handleDisconnect() {
    if (!confirm('Desconectar o WhatsApp deste workspace?')) return
    disconnect.mutate(undefined, {
      onSuccess: () => toast.success('WhatsApp desconectado.'),
      onError: (err) => toast.error(extractErrorMessage(err)),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </CardTitle>
        {connection && <Badge variant="accent">Conectado</Badge>}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <Skeleton className="h-24 w-full" />}

        {!isLoading && connection && (
          <>
            <div className="text-sm">
              <p className="text-text">{connection.displayPhone ?? connection.externalId}</p>
              <p className="text-xs text-text-faint">Cloud API oficial da Meta — envio e recebimento via /whatsapp/send e webhook.</p>
            </div>
            <PermissionGate permission="integrations:manage">
              <div className="flex justify-end">
                <Button size="sm" variant="destructive" onClick={handleDisconnect} disabled={disconnect.isPending}>
                  Desconectar
                </Button>
              </div>
            </PermissionGate>
          </>
        )}

        {!isLoading && !connection && (
          <PermissionGate permission="integrations:manage" fallback={<p className="text-sm text-text-muted">WhatsApp não conectado neste workspace.</p>}>
            <p className="text-xs text-text-faint">
              Conecte com a <strong>API oficial da Meta (Cloud API)</strong> — sem QR code. Pegue o phoneNumberId e o accessToken no painel de
              desenvolvedor da Meta (Business Manager → WhatsApp → Configuração da API).
            </p>
            <div>
              <Label htmlFor="wa-phone-id">Phone Number ID</Label>
              <Input id="wa-phone-id" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="wa-token">Access Token</Label>
              <Input id="wa-token" type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="wa-display">Número (exibição, opcional)</Label>
              <Input id="wa-display" placeholder="+55 11 91234-5678" value={displayPhone} onChange={(e) => setDisplayPhone(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleConnect} disabled={connect.isPending}>
                {connect.isPending ? 'Conectando...' : 'Conectar'}
              </Button>
            </div>
          </PermissionGate>
        )}
      </CardContent>
    </Card>
  )
}
