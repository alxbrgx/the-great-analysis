import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Loader2 } from 'lucide-react'
import { searchTickers, TickerResult } from '../../utils/api'

interface TickerSearchProps {
  onSelect: (symbol: string, name?: string) => void
  placeholder?: string
  initialValue?: string
  className?: string
  autoFocus?: boolean
  compact?: boolean  // slim header variant
}

export default function TickerSearch({
  onSelect,
  placeholder = 'Search ticker or company — e.g. AAPL, Apple Inc.',
  initialValue = '',
  className = '',
  autoFocus = false,
  compact = false,
}: TickerSearchProps) {
  const [query, setQuery] = useState(initialValue)
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue)
  const [open, setOpen] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce the query by 220ms to reduce API calls
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 220)
    return () => clearTimeout(t)
  }, [query])

  const { data, isFetching } = useQuery({
    queryKey: ['ticker-search', debouncedQuery],
    queryFn: () => searchTickers(debouncedQuery),
    enabled: debouncedQuery.length >= 1,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })

  const results: TickerResult[] = data?.results ?? []

  const handleSelect = useCallback((r: TickerResult) => {
    setQuery(r.symbol)
    setOpen(false)
    setSelectedIdx(-1)
    onSelect(r.symbol, r.name)
  }, [onSelect])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIdx >= 0 && results[selectedIdx]) handleSelect(results[selectedIdx])
      else if (results[0]) handleSelect(results[0])
      else { setOpen(false); onSelect(query.trim().toUpperCase()) }
    }
    else if (e.key === 'Escape') { setOpen(false); setSelectedIdx(-1) }
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const showDropdown = open && debouncedQuery.length >= 1 && (results.length > 0 || isFetching)

  if (compact) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <div className={`flex items-center gap-2 bg-card border rounded-md px-2.5 py-1.5 transition ${showDropdown ? 'border-accent/60 rounded-b-none' : 'border-border focus-within:border-accent/40'}`}>
          {isFetching && debouncedQuery.length >= 1
            ? <Loader2 size={12} className="text-accent shrink-0 animate-spin" />
            : <Search size={12} className="text-muted shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder || 'Switch ticker…'}
            className="flex-1 bg-transparent text-xs text-slate-100 placeholder-muted/60 outline-none font-mono"
            value={query}
            autoComplete="off"
            onChange={e => { setQuery(e.target.value); setOpen(true); setSelectedIdx(-1) }}
            onFocus={() => { if (query.length >= 1) setOpen(true) }}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button onClick={() => { setQuery(''); setDebouncedQuery(''); setOpen(false) }} className="text-muted hover:text-slate-200 text-[10px] transition">✕</button>
          )}
        </div>
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 min-w-[280px] bg-card border border-accent/40 border-t-0 rounded-b-md overflow-hidden z-50 shadow-soft">
            {isFetching && results.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted flex items-center gap-2">
                <Loader2 size={11} className="animate-spin" /> Searching...
              </div>
            )}
            {results.map((r, i) => (
              <button
                key={r.symbol}
                className={`w-full px-3 py-2 flex items-center gap-2 text-left transition ${i === selectedIdx ? 'bg-accent/10' : 'hover:bg-surface'} ${i < results.length - 1 ? 'border-b border-border' : ''}`}
                onClick={() => handleSelect(r)}
              >
                <span className="font-mono text-accent text-xs font-semibold w-14 shrink-0">{r.symbol}</span>
                <span className="text-slate-200 text-xs truncate flex-1">{r.name}</span>
                <span className="text-muted text-[10px] shrink-0">{r.exchange}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className={`flex items-center bg-card border rounded-md px-3 py-2.5 gap-3 transition ${showDropdown ? 'border-accent rounded-b-none' : 'border-border focus-within:border-accent/60'}`}>
        {isFetching && debouncedQuery.length >= 1
          ? <Loader2 size={15} className="text-accent shrink-0 animate-spin" />
          : <Search size={15} className="text-muted shrink-0" />
        }
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="flex-1 bg-transparent text-slate-100 placeholder-muted outline-none text-sm"
          value={query}
          autoFocus={autoFocus}
          autoComplete="off"
          onChange={e => { setQuery(e.target.value); setOpen(true); setSelectedIdx(-1) }}
          onFocus={() => { if (query.length >= 1) setOpen(true) }}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setDebouncedQuery(''); setOpen(false) }}
            className="text-muted hover:text-slate-200 text-xs transition px-1"
          >
            ✕
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 bg-card border border-accent/40 border-t-0 rounded-b-md overflow-hidden z-50 shadow-soft">
          {isFetching && results.length === 0 && (
            <div className="px-4 py-3 text-xs text-muted flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" /> Searching...
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={r.symbol}
              className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition ${i === selectedIdx ? 'bg-accent/10' : 'hover:bg-surface'} ${i < results.length - 1 ? 'border-b border-border' : ''}`}
              onClick={() => handleSelect(r)}
            >
              <span className="font-mono text-accent text-sm font-semibold w-16 shrink-0">{r.symbol}</span>
              <span className="text-slate-200 text-sm truncate flex-1">{r.name}</span>
              <span className="text-muted text-xs shrink-0 capitalize">{r.type?.toLowerCase()}</span>
              <span className="text-muted text-xs shrink-0 w-16 text-right">{r.exchange}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
