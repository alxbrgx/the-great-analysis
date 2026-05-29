import { useState, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'

interface Props {
  title: string
  formula?: string
  description: string
  interpretation?: string
  size?: 'sm' | 'md'
}

export default function InfoTooltip({ title, formula, description, interpretation, size = 'sm' }: Props) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState<'top' | 'bottom'>('top')
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!visible || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setPos(rect.top < 220 ? 'bottom' : 'top')
  }, [visible])

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={ref}
        className="ml-0.5 text-muted/40 hover:text-muted transition-colors align-middle"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        tabIndex={0}
        aria-label={`Explanation: ${title}`}
      >
        <Info size={size === 'sm' ? 10 : 12} />
      </button>

      {visible && (
        <div
          className={`absolute z-50 w-72 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-3.5 shadow-2xl text-left pointer-events-none
            ${pos === 'top' ? 'bottom-full mb-2.5' : 'top-full mt-2.5'}
            left-1/2 -translate-x-1/2`}
          style={{ minWidth: '240px' }}
        >
          <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0d0d0d] border-[#2a2a2a] rotate-45
            ${pos === 'top' ? 'bottom-[-5px] border-r border-b' : 'top-[-5px] border-l border-t'}`}
          />

          <p className="text-xs font-semibold text-gray-100 mb-1.5">{title}</p>

          {formula && (
            <p className="text-xs font-mono text-accent/70 bg-black/50 px-2.5 py-1.5 rounded-lg mb-2.5 leading-relaxed border border-border/50">
              {formula}
            </p>
          )}

          <p className="text-xs text-gray-400 leading-relaxed">{description}</p>

          {interpretation && (
            <div className="mt-2.5 pt-2.5 border-t border-border/50">
              <p className="text-xs text-muted leading-relaxed">
                <span className="text-gray-400 font-medium">Read as: </span>
                {interpretation}
              </p>
            </div>
          )}
        </div>
      )}
    </span>
  )
}
