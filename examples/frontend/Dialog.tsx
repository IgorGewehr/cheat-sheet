'use client'

import { useEffect, useRef } from 'react'

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="
        backdrop:bg-black/50
        rounded-xl p-0 max-w-md w-full
        animate-in fade-in zoom-in-95
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {children}
      </div>
    </dialog>
  )
}

// Uso:
// <Dialog open={isOpen} onClose={() => setIsOpen(false)} title="Confirmar">
//   <p>Tem certeza?</p>
//   <Button onClick={handleConfirm}>Sim</Button>
// </Dialog>