import { AlertTriangle, RefreshCw, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ErrorStateProps {
  title?: string
  message?: string
  ticker?: string
  onRetry?: () => void
  showSearch?: boolean
  className?: string
}

const SUGGESTIONS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'JPM', 'TSLA', 'AMZN', 'META']

export default function ErrorState({
  title = 'Unable to load data',
  message,
  ticker,
  onRetry,
  showSearch = true,
  className = '',
}: ErrorStateProps) {
  const navigate = useNavigate()

  const isNotFound = message?.toLowerCase().includes('no data') ||
    message?.toLowerCase().includes('not found') ||
    message?.toLowerCase().includes('delisted')

  return (
    <div className={`flex flex-col items-center justify-center py-20 text-center ${className}`}>
      <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-900/40 flex items-center justify-center mb-4">
        <AlertTriangle size={20} className="text-red-400" />
      </div>

      <h3 className="text-sm font-medium text-gray-200 mb-2">{title}</h3>

      {ticker && (
        <p className="text-xs font-mono text-accent/60 mb-1">
          Ticker: <span className="text-accent">{ticker}</span>
        </p>
      )}

      {isNotFound ? (
        <p className="text-xs text-muted/60 max-w-xs mb-6">
          This ticker may be delisted, unavailable on yfinance, or incorrectly formatted.
          Try a major exchange-listed symbol (e.g. AAPL, MSFT).
        </p>
      ) : (
        <p className="text-xs text-muted/60 max-w-xs mb-6">
          {message || 'The data source returned an error. This may be a temporary API issue.'}
        </p>
      )}

      <div className="flex items-center gap-3 flex-wrap justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface border border-border rounded-lg text-xs text-gray-300 hover:border-accent/40 transition-colors"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        )}
        {showSearch && (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 border border-accent/25 rounded-lg text-xs text-accent hover:bg-accent/15 transition-colors"
          >
            <Search size={12} />
            Search another ticker
          </button>
        )}
      </div>

      {showSearch && (
        <div className="mt-8">
          <p className="text-[10px] font-mono text-muted/40 uppercase tracking-widest mb-3">Suggested tickers</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGESTIONS.map(t => (
              <button
                key={t}
                onClick={() => navigate(`/?ticker=${t}`)}
                className="font-mono text-xs px-3 py-1.5 bg-surface border border-border rounded-md text-accent/80 hover:border-accent/40 hover:text-accent transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
