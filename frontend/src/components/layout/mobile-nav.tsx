import { useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Menu, X } from 'lucide-react'
import { NavLinks } from './nav-links'

/**
 * Gaveta de navegação pra telas < md — o Sidebar fica "hidden md:flex" (some no mobile),
 * então esse é o único jeito de navegar entre seções num celular/tablet.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 md:hidden" />
        <DialogPrimitive.Content className="fixed left-0 top-0 z-50 flex h-full w-64 max-w-[80vw] flex-col border-r border-border bg-sidebar shadow-2xl focus:outline-none md:hidden">
          <div className="flex items-center justify-between gap-2 px-5 h-14 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-black font-bold text-sm">
                M
              </div>
              <DialogPrimitive.Title asChild>
                <span className="font-semibold text-text tracking-tight">MarcosLab</span>
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close className="text-text-faint hover:text-text focus:outline-none">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          <NavLinks onNavigate={() => setOpen(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
