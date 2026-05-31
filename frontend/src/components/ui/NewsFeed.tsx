import { useQuery } from '@tanstack/react-query'
import { getCompanyNews, getNewsByName } from '../../utils/api'
import { ExternalLink, Newspaper } from 'lucide-react'

interface Props {
  ticker?: string  // listed company: news looked up by stock symbol
  query?: string   // unlisted company: news searched by company name
  label?: string   // heading label (defaults to ticker / query)
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NewsFeed({ ticker, query, label }: Props) {
  const term = query ?? ticker ?? ''
  const heading = label ?? term
  const { data, isLoading } = useQuery({
    queryKey: ['news', query ? `q:${query}` : `t:${ticker}`],
    queryFn: () => (query ? getNewsByName(query) : getCompanyNews(ticker!)),
    staleTime: 300_000,
    enabled: !!term,
  })

  const articles = data?.articles ?? []

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <Newspaper size={14} className="text-muted" />
        <h2 className="text-sm font-medium text-gray-200">News — {heading}</h2>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-14 h-14 bg-surface rounded-lg shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-surface rounded w-3/4" />
                <div className="h-3 bg-surface rounded w-1/2" />
                <div className="h-2 bg-surface/60 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && articles.length === 0 && (
        <p className="text-xs text-muted py-4 text-center">No news available for {heading}.</p>
      )}

      <div className="divide-y divide-border/40">
        {articles.map((a: any, i: number) => (
          <a
            key={i}
            href={a.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-3 py-3 first:pt-0 last:pb-0 hover:bg-surface/40 transition-colors rounded group -mx-1 px-1"
          >
            {a.thumbnail && (
              <img
                src={a.thumbnail}
                alt=""
                className="w-14 h-14 object-cover rounded-lg shrink-0 bg-surface border border-border/40"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-200 leading-relaxed line-clamp-2 group-hover:text-accent transition-colors">
                {a.title}
              </p>
              {a.summary && (
                <p className="text-xs text-muted/70 leading-relaxed mt-1 line-clamp-2">{a.summary}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-muted/50">{a.publisher}</span>
                {a.publisher && a.published_at && <span className="text-muted/30">·</span>}
                <span className="text-xs text-muted/50">{timeAgo(a.published_at)}</span>
                <ExternalLink size={10} className="text-muted/30 ml-auto group-hover:text-accent transition-colors shrink-0" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
