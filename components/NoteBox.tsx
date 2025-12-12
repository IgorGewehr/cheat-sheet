type NoteBoxProps = {
  type: 'info' | 'success' | 'warning' | 'danger'
  title?: string
  children: React.ReactNode
}

const config = {
  info: {
    bg: 'bg-accent/10',
    border: 'border-accent',
    icon: '💡',
  },
  success: {
    bg: 'bg-success/10',
    border: 'border-success',
    icon: '✅',
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning',
    icon: '⚠️',
  },
  danger: {
    bg: 'bg-danger/10',
    border: 'border-danger',
    icon: '🚨',
  },
}

export default function NoteBox({ type, title, children }: NoteBoxProps) {
  const { bg, border, icon } = config[type]

  return (
    <div className={`${bg} border-l-4 ${border} p-4 rounded-r-lg my-4`}>
      {title && (
        <div className="font-bold mb-2 flex items-center gap-2">
          <span>{icon}</span>
          <span>{title}</span>
        </div>
      )}
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  )
}
