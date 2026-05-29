import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Trash2 } from 'lucide-react'

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

interface Props {
  children: ReactNode
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleClearStorage = () => {
    if (!confirm('Clear all saved data (watchlist, memos, settings)? This cannot be undone.')) return
    try {
      // Wipe TGA-related localStorage keys
      Object.keys(localStorage)
        .filter(k => k.startsWith('tga-'))
        .forEach(k => localStorage.removeItem(k))
      window.location.href = '/'
    } catch {
      window.location.reload()
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const err = this.state.error
    const stack = err?.stack || err?.message || 'Unknown error'

    return (
      <div className="min-h-screen bg-background text-slate-100 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded bg-rose-950/30 border border-rose-700/50">
              <AlertTriangle size={20} className="text-rose-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-100">Something broke.</h1>
              <p className="text-xs text-muted">An unexpected error crashed the page. Your saved data is safe.</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-md p-4 mb-4">
            <div className="text-[10px] uppercase tracking-wider text-muted mb-2 font-semibold">Error message</div>
            <code className="text-xs text-rose-300 font-mono break-words">{err?.message || 'Unknown'}</code>
          </div>

          {stack !== err?.message && (
            <details className="bg-card border border-border rounded-md p-4 mb-4">
              <summary className="text-[10px] uppercase tracking-wider text-muted cursor-pointer font-semibold">
                Stack trace (dev info)
              </summary>
              <pre className="text-[10px] text-muted/80 font-mono mt-2 max-h-60 overflow-auto whitespace-pre-wrap">
                {stack}
              </pre>
            </details>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { this.handleReset(); window.location.reload() }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-card border border-border-strong hover:border-slate-400 rounded-md transition"
            >
              <RefreshCw size={12} /> Reload page
            </button>
            <button
              onClick={() => { window.location.href = '/' }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-card border border-border-strong hover:border-slate-400 rounded-md transition"
            >
              <Home size={12} /> Back home
            </button>
            <button
              onClick={this.handleClearStorage}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-rose-950/20 border border-rose-700/50 hover:bg-rose-950/40 text-rose-300 rounded-md transition"
              title="If reload doesn't fix it, your saved data may be corrupted — wipe it"
            >
              <Trash2 size={12} /> Clear saved data &amp; go home
            </button>
          </div>

          <p className="text-[10px] text-muted/60 mt-6 text-center font-mono">
            If this keeps happening, copy the error above and report it.
          </p>
        </div>
      </div>
    )
  }
}
