interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-surface rounded ${className}`} />
  )
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-5 space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <SkeletonText lines={4} />
    </div>
  )
}

export function SkeletonChart({ className = '' }: SkeletonProps) {
  const heights = [45, 70, 55, 90, 40, 65, 80, 50, 75, 60, 85, 35]
  return (
    <div className={`bg-surface border border-border rounded-xl p-4 ${className}`}>
      <Skeleton className="h-3 w-40 mb-4" />
      <div className="flex items-end gap-1 h-32">
        {heights.map((h, i) => (
          <div
            key={i}
            className="flex-1 animate-pulse bg-surface rounded"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export function SkeletonRow({ className = '' }: SkeletonProps) {
  return (
    <div className={`flex items-center justify-between py-2 border-b border-border/40 ${className}`}>
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}
