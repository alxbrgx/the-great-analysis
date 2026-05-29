import { Clock } from 'lucide-react'

interface DataFreshnessProps {
  fetchedAt?: number   // unix timestamp (seconds)
  ttlSeconds?: number  // cache TTL so we can show "expires in X"
  className?: string
}

function timeAgo(ts: number): string {
  const seconds = Math.floor(Date.now() / 1000) - ts
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export default function DataFreshness({ fetchedAt, ttlSeconds = 600, className = '' }: DataFreshnessProps) {
  if (!fetchedAt) return null

  const ageSeconds = Math.floor(Date.now() / 1000) - fetchedAt
  const isCached = ageSeconds > 2  // fetched more than 2s ago → came from cache
  const isStale = ageSeconds > ttlSeconds * 0.8  // >80% of TTL elapsed

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Clock size={11} className={isStale ? 'text-amber-400/60' : 'text-muted/40'} />
      <span className={`text-[10px] font-mono ${isStale ? 'text-amber-400/60' : 'text-muted/40'}`}>
        {isCached ? `cached · ${timeAgo(fetchedAt)}` : 'live'}
      </span>
    </div>
  )
}
