// Reusable UI primitives — single source of truth for buttons, cards, badges, etc.
// Goal: consistency + zero custom one-off styles in pages.

import { ReactNode, ButtonHTMLAttributes, forwardRef } from 'react'
import { LucideIcon } from 'lucide-react'

// ─── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  iconRight?: LucideIcon
  loading?: boolean
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:   'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent',
  secondary: 'bg-card hover:bg-surface text-slate-100 border-border-strong hover:border-slate-500',
  ghost:     'bg-transparent hover:bg-surface text-muted hover:text-slate-100 border-transparent',
  danger:    'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-700/50 hover:border-rose-600',
  success:   'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-700/50 hover:border-emerald-600',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-[11px] gap-1',
  sm: 'px-2.5 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'sm', icon: Icon, iconRight: IconRight, loading, fullWidth, className = '', children, disabled, ...rest }, ref) => {
    const sizeIcon = size === 'xs' ? 11 : size === 'sm' ? 12 : size === 'md' ? 14 : 16
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-medium rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...rest}
      >
        {loading ? (
          <span className="animate-spin inline-block w-3 h-3 border border-current/30 border-t-current rounded-full" />
        ) : (
          Icon && <Icon size={sizeIcon} />
        )}
        {children}
        {IconRight && <IconRight size={sizeIcon} />}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  onClick?: () => void
}

const CARD_PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

export function Card({ children, className = '', padding = 'md', hover = false, onClick }: CardProps) {
  const Component = onClick ? 'button' : 'div'
  return (
    <Component
      onClick={onClick}
      className={`bg-card border border-border rounded-lg ${CARD_PADDING[padding]} ${
        hover ? 'transition-colors hover:border-slate-500 hover:bg-surface' : ''
      } ${onClick ? 'text-left w-full block' : ''} ${className}`}
    >
      {children}
    </Component>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon?: LucideIcon
  iconColor?: string
  title: string
  subtitle?: string | ReactNode
  action?: ReactNode
}

export function SectionHeader({ icon: Icon, iconColor = 'text-slate-400', title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon size={13} className={`shrink-0 ${iconColor}`} />}
        <h2 className="text-[11px] font-semibold text-slate-300 uppercase tracking-widest">{title}</h2>
        {subtitle && (
          <span className="text-[11px] text-muted font-normal normal-case tracking-normal truncate">— {subtitle}</span>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeColor = 'slate' | 'emerald' | 'amber' | 'rose' | 'violet' | 'blue' | 'sky'
type BadgeVariant = 'subtle' | 'solid' | 'outline'

interface BadgeProps {
  children: ReactNode
  color?: BadgeColor
  variant?: BadgeVariant
  icon?: LucideIcon
  className?: string
}

const BADGE_SUBTLE: Record<BadgeColor, string> = {
  slate:   'bg-slate-700/40 text-slate-300 border-slate-600/50',
  emerald: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  amber:   'bg-amber-900/40 text-amber-300 border-amber-700/50',
  rose:    'bg-rose-900/40 text-rose-300 border-rose-700/50',
  violet:  'bg-violet-900/40 text-violet-300 border-violet-700/50',
  blue:    'bg-blue-900/40 text-blue-300 border-blue-700/50',
  sky:     'bg-sky-900/40 text-sky-300 border-sky-700/50',
}

const BADGE_OUTLINE: Record<BadgeColor, string> = {
  slate:   'bg-transparent text-slate-300 border-slate-600',
  emerald: 'bg-transparent text-emerald-400 border-emerald-700/60',
  amber:   'bg-transparent text-amber-400 border-amber-700/60',
  rose:    'bg-transparent text-rose-400 border-rose-700/60',
  violet:  'bg-transparent text-violet-400 border-violet-700/60',
  blue:    'bg-transparent text-blue-400 border-blue-700/60',
  sky:     'bg-transparent text-sky-400 border-sky-700/60',
}

const BADGE_SOLID: Record<BadgeColor, string> = {
  slate:   'bg-slate-600 text-slate-100 border-transparent',
  emerald: 'bg-emerald-600 text-white border-transparent',
  amber:   'bg-amber-600 text-white border-transparent',
  rose:    'bg-rose-600 text-white border-transparent',
  violet:  'bg-violet-600 text-white border-transparent',
  blue:    'bg-blue-600 text-white border-transparent',
  sky:     'bg-sky-600 text-white border-transparent',
}

export function Badge({ children, color = 'slate', variant = 'subtle', icon: Icon, className = '' }: BadgeProps) {
  const map = variant === 'solid' ? BADGE_SOLID : variant === 'outline' ? BADGE_OUTLINE : BADGE_SUBTLE
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${map[color]} ${className}`}>
      {Icon && <Icon size={10} />}
      {children}
    </span>
  )
}

// ─── Stat ─────────────────────────────────────────────────────────────────────

interface StatProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  highlight?: 'good' | 'warn' | 'danger' | 'neutral'
  align?: 'left' | 'right' | 'center'
}

const STAT_HIGHLIGHT = {
  good:    'text-emerald-400',
  warn:    'text-amber-400',
  danger:  'text-rose-400',
  neutral: 'text-slate-100',
}

export function Stat({ label, value, hint, highlight = 'neutral', align = 'left' }: StatProps) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  return (
    <div className={alignClass}>
      <div className="text-[9px] text-muted uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`text-sm font-mono ${STAT_HIGHLIGHT[highlight]}`}>{value}</div>
      {hint && <div className="text-[10px] text-muted mt-0.5">{hint}</div>}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 px-6 border border-dashed border-border rounded-lg ${className}`}>
      <Icon size={28} className="text-muted mx-auto mb-3" />
      <h3 className="text-sm font-medium text-slate-200 mb-1">{title}</h3>
      {description && <p className="text-xs text-muted mb-4 max-w-md mx-auto leading-relaxed">{description}</p>}
      {action && <div className="flex items-center justify-center gap-2">{action}</div>}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string
  variant?: 'success' | 'info' | 'warn' | 'error'
  icon?: LucideIcon
}

const TOAST_VARIANT = {
  success: 'bg-emerald-900/90 border-emerald-600/50 text-emerald-100',
  info:    'bg-violet-900/90 border-violet-600/50 text-violet-100',
  warn:    'bg-amber-900/90 border-amber-600/50 text-amber-100',
  error:   'bg-rose-900/90 border-rose-600/50 text-rose-100',
}

export function Toast({ message, variant = 'info', icon: Icon }: ToastProps) {
  return (
    <div className={`fixed top-16 right-6 z-50 border rounded-md shadow-soft px-3 py-2 text-xs flex items-center gap-2 ${TOAST_VARIANT[variant]}`}>
      {Icon && <Icon size={12} />}
      {message}
    </div>
  )
}

// ─── Inline metric (label + value on one row) ────────────────────────────────

interface MetricRowProps {
  label: string
  value: ReactNode
  hint?: string
}

export function MetricRow({ label, value, hint }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 text-xs">
      <span className="text-muted">{label}</span>
      <span className="font-mono text-slate-100">
        {value}
        {hint && <span className="text-muted ml-1.5">{hint}</span>}
      </span>
    </div>
  )
}
