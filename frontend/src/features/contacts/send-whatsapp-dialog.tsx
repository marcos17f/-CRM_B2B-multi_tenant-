import { useState } from 'react'
import { toast } from 'sonner'
import type { Contact } from '@/api/types'
import { useSendWhatsapp } from '@/hooks/queries'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { extractErrorMessage } from '@/lib/utils'

export function SendWhatsappDialog({
  open,
  onOpenChange,
  contact,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: Contact
}) {
  const sendWhatsapp = useSendWhatsapp()
  const [message, setMessage] = useState('')

  function handleSend() {
    if (!message.trim()) {
      toast.error('Escreva uma mensagem.')
      return
    }
    sendWhatsapp.mutate(
      { contactId: contact.id, message },
      {
        onSuccess: () => {
          toast.success('Mensagem enviada.')
          setMessage('')
          onOpenChange(false)
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar WhatsApp para {contact.firstName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-text-faint">{contact.phone}</p>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escreva a mensagem..." className="min-h-[100px]" />
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={sendWhatsapp.isPending}>
            {sendWhatsapp.isPending ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
