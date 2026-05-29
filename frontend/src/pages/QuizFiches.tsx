import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Check, X, BookOpen, Shuffle } from 'lucide-react'
import { FICHES, type Fiche } from '../data/fichesData'
import { TOPICS, type TopicId } from '../data/quizData'

// ── Flip card ────────────────────────────────────────────────────────────────

function FlipCard({ fiche, onKnow, onDontKnow }: {
  fiche: Fiche
  onKnow: () => void
  onDontKnow: () => void
}) {
  const [flipped, setFlipped] = useState(false)

  const handleFlip = () => setFlipped(f => !f)

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      {/* Card */}
      <div
        className="w-full cursor-pointer"
        style={{ perspective: '1200px' }}
        onClick={handleFlip}
      >
        <div
          className="relative transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: 280,
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl border border-border/40 bg-card p-8 flex flex-col justify-between"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono text-muted/50 uppercase tracking-widest">
                {TOPICS.find(t => t.id === fiche.topic)?.title ?? fiche.topic}
              </span>
              <span className="text-[10px] font-mono text-muted/30">cliquer pour retourner</span>
            </div>
            <p className="text-xl text-gray-100 font-light leading-relaxed text-center flex-1 flex items-center justify-center">
              {fiche.front}
            </p>
            <div className="flex justify-center mt-4">
              {fiche.tags?.map(tag => (
                <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded border border-border/20 text-muted/40 mr-1.5">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-card p-8 flex flex-col justify-between"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono text-accent/60 uppercase tracking-widest">Réponse</span>
              <span className="text-[10px] font-mono text-muted/30">cliquer pour retourner</span>
            </div>
            <div className="flex-1 overflow-auto">
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">
                {fiche.back}
              </p>
              {fiche.formula && (
                <div className="mt-4 p-3 rounded-xl border border-accent/20 bg-accent/5">
                  <p className="text-xs font-mono text-accent/80 whitespace-pre-line leading-relaxed">
                    {fiche.formula}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons — only visible when flipped */}
      <div
        className={`flex gap-4 w-full transition-all duration-300 ${flipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onDontKnow() }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-red-800/40 bg-red-950/20 text-red-400 hover:bg-red-950/40 transition-colors text-sm font-medium"
        >
          <X size={15} />
          À revoir
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onKnow() }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-800/40 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40 transition-colors text-sm font-medium"
        >
          <Check size={15} />
          Je sais
        </button>
      </div>
    </div>
  )
}

// ── Topic filter bar ──────────────────────────────────────────────────────────

function TopicBar({
  selected,
  onChange,
  counts,
}: {
  selected: TopicId | 'all'
  onChange: (t: TopicId | 'all') => void
  counts: Record<string, number>
}) {
  const availableTopics = TOPICS.filter(t => (counts[t.id] ?? 0) > 0)

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onChange('all')}
        className={`text-xs px-3 py-1.5 rounded-full border font-mono transition-colors ${
          selected === 'all'
            ? 'border-accent/50 bg-accent/10 text-accent'
            : 'border-border/30 text-muted/60 hover:text-muted'
        }`}
      >
        Tout ({Object.values(counts).reduce((a, b) => a + b, 0)})
      </button>
      {availableTopics.map(topic => (
        <button
          key={topic.id}
          onClick={() => onChange(topic.id as TopicId)}
          className={`text-xs px-3 py-1.5 rounded-full border font-mono transition-colors ${
            selected === topic.id
              ? 'border-accent/50 bg-accent/10 text-accent'
              : 'border-border/30 text-muted/60 hover:text-muted'
          }`}
        >
          {topic.title} ({counts[topic.id] ?? 0})
        </button>
      ))}
    </div>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ known, total }: { known: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((known / total) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-card rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-accent tabular-nums">{pct}%</span>
    </div>
  )
}

// ── Session complete screen ───────────────────────────────────────────────────

function SessionComplete({ known, unknown, total, onRestart, onReviewWrong, hasWrong }: {
  known: number
  unknown: number
  total: number
  onRestart: () => void
  onReviewWrong: () => void
  hasWrong: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-8">
      <div className="p-6 rounded-full border border-accent/20 bg-accent/5">
        <BookOpen size={40} className="text-accent" />
      </div>
      <div>
        <h2 className="text-2xl font-light text-gray-100 mb-2">Session terminée</h2>
        <p className="text-sm text-muted">{total} fiches parcourues</p>
      </div>
      <div className="flex gap-8">
        <div className="text-center">
          <p className="text-3xl font-light text-emerald-400">{known}</p>
          <p className="text-xs text-muted font-mono mt-1">maîtrisées</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-light text-red-400">{unknown}</p>
          <p className="text-xs text-muted font-mono mt-1">à revoir</p>
        </div>
      </div>
      <div className="flex gap-3">
        {hasWrong && (
          <button
            onClick={onReviewWrong}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-800/40 bg-red-950/20 text-red-400 hover:bg-red-950/40 transition-colors text-sm"
          >
            <RotateCcw size={14} />
            Revoir les fiches difficiles
          </button>
        )}
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm"
        >
          <RotateCcw size={14} />
          Recommencer
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function QuizFiches() {
  const navigate = useNavigate()

  const [topicFilter, setTopicFilter] = useState<TopicId | 'all'>('all')
  const [shuffled, setShuffled] = useState(false)
  const [idx, setIdx] = useState(0)
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set())
  const [unknownIds, setUnknownIds] = useState<Set<string>>(new Set())
  const [reviewMode, setReviewMode] = useState(false) // reviewing only unknowns

  const baseDeck = topicFilter === 'all'
    ? FICHES
    : FICHES.filter(f => f.topic === topicFilter)

  const [deck, setDeck] = useState<Fiche[]>(() => baseDeck)

  const topicCounts: Record<string, number> = {}
  for (const f of FICHES) {
    topicCounts[f.topic] = (topicCounts[f.topic] ?? 0) + 1
  }

  const activeDeck = reviewMode
    ? deck.filter(f => unknownIds.has(f.id))
    : deck

  const done = idx >= activeDeck.length
  const currentFiche = done ? null : activeDeck[idx]

  const handleTopicChange = useCallback((t: TopicId | 'all') => {
    setTopicFilter(t)
    const base = t === 'all' ? FICHES : FICHES.filter(f => f.topic === t)
    setDeck(base)
    setIdx(0)
    setKnownIds(new Set())
    setUnknownIds(new Set())
    setReviewMode(false)
  }, [])

  const handleShuffle = useCallback(() => {
    const base = topicFilter === 'all' ? FICHES : FICHES.filter(f => f.topic === topicFilter)
    const shuffledDeck = [...base].sort(() => Math.random() - 0.5)
    setDeck(shuffledDeck)
    setIdx(0)
    setKnownIds(new Set())
    setUnknownIds(new Set())
    setReviewMode(false)
    setShuffled(s => !s)
  }, [topicFilter])

  const advance = () => setIdx(i => i + 1)

  const handleKnow = () => {
    if (!currentFiche) return
    setKnownIds(s => new Set([...s, currentFiche.id]))
    advance()
  }

  const handleDontKnow = () => {
    if (!currentFiche) return
    setUnknownIds(s => new Set([...s, currentFiche.id]))
    advance()
  }

  const handlePrev = () => setIdx(i => Math.max(0, i - 1))
  const handleNext = () => setIdx(i => Math.min(activeDeck.length - 1, i + 1))

  const handleRestart = () => {
    setIdx(0)
    setKnownIds(new Set())
    setUnknownIds(new Set())
    setReviewMode(false)
  }

  const handleReviewWrong = () => {
    setIdx(0)
    setKnownIds(new Set())
    setReviewMode(true)
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/30 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quiz')}
            className="p-2 rounded-lg hover:bg-card transition-colors text-muted hover:text-gray-200"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="w-px h-4 bg-border/40" />
          <span className="text-sm font-light text-gray-200">Fiches de révision</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
              shuffled
                ? 'border-accent/30 bg-accent/10 text-accent'
                : 'border-border/30 text-muted hover:text-gray-200 hover:border-border/60'
            }`}
          >
            <Shuffle size={12} />
            Mélanger
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Topic filter */}
        <TopicBar selected={topicFilter} onChange={handleTopicChange} counts={topicCounts} />

        {/* Progress */}
        {activeDeck.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-muted/60">
              <span>
                {reviewMode ? 'Mode révision' : 'Progression'} — {Math.min(idx + 1, activeDeck.length)} / {activeDeck.length}
              </span>
              <span>{knownIds.size} maîtrisées · {unknownIds.size} à revoir</span>
            </div>
            <ProgressBar known={knownIds.size} total={activeDeck.length} />
          </div>
        )}

        {/* Card or complete */}
        {activeDeck.length === 0 ? (
          <div className="text-center py-16 text-muted text-sm">
            Aucune fiche disponible pour ce filtre.
          </div>
        ) : done ? (
          <SessionComplete
            known={knownIds.size}
            unknown={unknownIds.size}
            total={activeDeck.length}
            onRestart={handleRestart}
            onReviewWrong={handleReviewWrong}
            hasWrong={unknownIds.size > 0}
          />
        ) : (
          <>
            {currentFiche && (
              <FlipCard
                key={currentFiche.id}
                fiche={currentFiche}
                onKnow={handleKnow}
                onDontKnow={handleDontKnow}
              />
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={idx === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border/30 text-xs text-muted hover:text-gray-200 hover:border-border/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
                Précédente
              </button>
              <div className="flex gap-1">
                {activeDeck.map((f, i) => (
                  <button
                    key={f.id}
                    onClick={() => setIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === idx
                        ? 'bg-accent'
                        : knownIds.has(f.id)
                        ? 'bg-emerald-600/50'
                        : unknownIds.has(f.id)
                        ? 'bg-red-600/50'
                        : 'bg-border/40'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={handleNext}
                disabled={idx >= activeDeck.length - 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border/30 text-xs text-muted hover:text-gray-200 hover:border-border/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Suivante
                <ChevronRight size={14} />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
