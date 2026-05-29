import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useQuizStore, type CompletedAnswer } from '../store/useQuizStore'
import { TOPICS, DIFFICULTY_CONFIG, getTopic, getLevelFromXP } from '../data/quizData'
import {
  CheckCircle, XCircle, ChevronRight, ArrowLeft,
  Zap, Flame, Trophy, BookOpen, Star, Calculator, PenLine,
  HelpCircle, Lightbulb, ChevronDown, ChevronUp,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type OptionState = 'idle' | 'selected-correct' | 'selected-wrong' | 'reveal-correct'

// ─── Option button ────────────────────────────────────────────────────────────

function OptionButton({
  label, letter, state, onClick, disabled,
}: {
  label: string; letter: string; state: OptionState; onClick: () => void; disabled: boolean
}) {
  let borderColor = '#242424'
  let bgColor = 'transparent'
  let textColor = '#d1d5db'
  let letterBg = '#1a1a1a'
  let letterColor = '#6b7280'

  if (state === 'selected-correct') {
    borderColor = '#10b981'; bgColor = 'rgba(16,185,129,0.10)'; textColor = '#d1fae5'
    letterBg = 'rgba(16,185,129,0.25)'; letterColor = '#10b981'
  } else if (state === 'selected-wrong') {
    borderColor = '#ef4444'; bgColor = 'rgba(239,68,68,0.10)'; textColor = '#fecaca'
    letterBg = 'rgba(239,68,68,0.25)'; letterColor = '#ef4444'
  } else if (state === 'reveal-correct') {
    borderColor = '#10b98150'; bgColor = 'rgba(16,185,129,0.05)'; textColor = '#6ee7b7'
    letterBg = 'rgba(16,185,129,0.15)'; letterColor = '#10b981'
  }

  return (
    <button
      className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm flex items-start gap-3 transition-all duration-150 ${!disabled && state === 'idle' ? 'cursor-pointer hover:border-accent/40 active:scale-[0.99]' : 'cursor-default'}`}
      style={{ borderColor, backgroundColor: bgColor, color: textColor }}
      onClick={!disabled && state === 'idle' ? onClick : undefined}
    >
      <span
        className="flex-shrink-0 w-6 h-6 rounded-md text-[11px] font-mono font-bold flex items-center justify-center mt-0.5"
        style={{ backgroundColor: letterBg, color: letterColor }}
      >
        {letter}
      </span>
      <span className="flex-1 leading-relaxed">{label}</span>
      {state === 'selected-correct' && <CheckCircle size={16} className="text-accent flex-shrink-0 mt-0.5" />}
      {state === 'selected-wrong' && <XCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />}
      {state === 'reveal-correct' && <CheckCircle size={16} style={{ color: '#10b981', opacity: 0.6 }} className="flex-shrink-0 mt-0.5" />}
    </button>
  )
}

// ─── XP pop ───────────────────────────────────────────────────────────────────

function XPPop({ xp, show }: { xp: number; show: boolean }) {
  return (
    <div
      className="absolute top-2 right-4 pointer-events-none font-mono font-bold text-accent text-sm transition-all duration-500 flex items-center gap-1"
      style={{ opacity: show ? 1 : 0, transform: show ? 'translateY(-10px)' : 'translateY(0)' }}
    >
      <Zap size={12} /> +{xp} XP
    </div>
  )
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({ total, current, answers }: {
  total: number; current: number; answers: { isCorrect: boolean | null }[]
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {Array.from({ length: total }).map((_, i) => {
        const ans = answers[i]
        let bg = '#1e1e1e'
        if (ans) bg = ans.isCorrect ? '#10b981' : '#ef4444'
        else if (i === current) bg = '#f59e0b'
        return (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{ width: i === current ? 16 : 8, height: 8, backgroundColor: bg }}
          />
        )
      })}
    </div>
  )
}

// ─── Hint panel ───────────────────────────────────────────────────────────────

function HintPanel({ explanation }: { explanation: string }) {
  const [open, setOpen] = useState(false)

  const hint = (() => {
    const first = explanation.split('. ')[0]
    return first.length > 200 ? first.slice(0, 200) + '…' : first + '.'
  })()

  return (
    <div className="rounded-xl border border-amber-900/25 bg-amber-950/10 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-2.5 flex items-center gap-2 text-xs text-amber-400/60 hover:text-amber-400 transition-colors"
      >
        <Lightbulb size={11} />
        <span className="font-mono">Rappel de cours</span>
        <span className="ml-auto">{open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 border-t border-amber-900/20 pt-2">
          <p className="text-xs text-amber-200/55 leading-relaxed">{hint}</p>
        </div>
      )}
    </div>
  )
}

// ─── Explanation panel ────────────────────────────────────────────────────────

function ExplanationPanel({
  isCorrect, wasSkipped, xpEarned, explanation,
}: {
  isCorrect: boolean; wasSkipped: boolean; xpEarned: number; explanation: string
}) {
  const lines = explanation.split('\n')
  const formulaLines: string[] = []
  const textLines: string[] = []
  lines.forEach(line => {
    const t = line.trim()
    if (/^[A-Z].{0,30}=\s|^→\s|^\(\d|^Étape\s\d/.test(t) && t.length < 120) {
      formulaLines.push(t)
    } else {
      textLines.push(line)
    }
  })

  const borderColor = wasSkipped ? '#f59e0b40' : isCorrect ? '#10b98140' : '#ef444440'
  const bg = wasSkipped ? 'rgba(245,158,11,0.04)' : isCorrect ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)'

  return (
    <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor, backgroundColor: bg }}>
      <div className="flex items-center gap-3">
        {wasSkipped ? (
          <><HelpCircle size={18} className="text-warning flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-warning">Réponse révélée</p>
              <p className="text-[10px] text-muted font-mono">−5% maîtrise · lisez l'explication</p>
            </div></>
        ) : isCorrect ? (
          <><CheckCircle size={18} className="text-accent flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-accent">Bonne réponse !</p>
              {xpEarned > 0 && <p className="text-[10px] text-muted font-mono">+{xpEarned} XP gagné</p>}
            </div></>
        ) : (
          <><XCircle size={18} className="text-danger flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-danger">Réponse incorrecte</p>
              <p className="text-[10px] text-muted font-mono">−5% maîtrise sur ce topic</p>
            </div></>
        )}
      </div>

      <div className="border-t border-white/5 pt-3 space-y-3">
        <div className="flex items-center gap-1.5 mb-1">
          <BookOpen size={11} className="text-muted" />
          <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Explication</span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
          {textLines.join('\n').trim()}
        </p>
        {formulaLines.length > 0 && (
          <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2.5 space-y-1">
            {formulaLines.map((line, i) => (
              <p key={i} className="text-xs font-mono text-accent/80">{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Next button (no countdown — user advances manually) ──────────────────────

function NextButton({ isLast, onNext }: { isLast: boolean; onNext: () => void }) {
  return (
    <button
      onClick={onNext}
      className="w-full py-3.5 rounded-xl border border-accent/30 bg-accent/15 text-accent font-medium text-sm flex items-center justify-center gap-2 hover:bg-accent/25 active:scale-[0.99] transition-all duration-150"
    >
      {isLast
        ? <><Trophy size={14} /> Voir les résultats</>
        : <>Question suivante <ChevronRight size={14} /></>}
    </button>
  )
}

// ─── Session complete screen ──────────────────────────────────────────────────

function CompleteScreen({
  correct, total, xpEarned, prevXP, newXP, streak, duration, onReturnHub, onRetry, answers,
}: {
  correct: number; total: number; xpEarned: number; prevXP: number; newXP: number
  streak: number; duration: number
  onReturnHub: () => void; onRetry: () => void
  answers: CompletedAnswer[]
}) {
  const pct = Math.round((correct / total) * 100)
  const prevLevel = getLevelFromXP(prevXP)
  const newLevel = getLevelFromXP(newXP)
  const leveledUp = newLevel.level > prevLevel.level
  const mins = Math.floor(duration / 60)
  const secs = duration % 60
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const wrongAnswers = answers.filter(a => a.isCorrect === false)

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-6 py-12 overflow-y-auto">
      <div className="max-w-md w-full space-y-5">

        {/* Score */}
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <div
            className="w-20 h-20 mx-auto rounded-full border-4 flex items-center justify-center"
            style={{
              borderColor: pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444',
              backgroundColor: `${pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'}14`,
            }}
          >
            <span className="text-2xl font-bold" style={{ color: pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>
              {pct}%
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-100">
              {pct >= 80 ? 'Excellent !' : pct >= 60 ? 'Bien joué !' : pct >= 40 ? 'Continuez !' : 'À retravailler'}
            </h2>
            <p className="text-sm text-muted mt-1">{correct} / {total} bonnes réponses</p>
          </div>

          {leveledUp && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <Star size={18} className="text-accent flex-shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-accent">Niveau supérieur !</p>
                <p className="text-xs text-muted">{prevLevel.label} → {newLevel.label}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { label: 'XP gagnés', value: `+${xpEarned}`, color: '#10b981' },
              { label: 'Série', value: streak > 0 ? `${streak}🔥` : '—', color: '#f97316' },
              { label: 'Durée', value: `${mins}m${secs.toString().padStart(2, '0')}s`, color: '#6b7280' },
            ].map(s => (
              <div key={s.label} className="bg-background rounded-lg p-3 text-center">
                <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] text-muted font-mono">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wrong answers */}
        {wrongAnswers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono text-muted uppercase tracking-wider">
              À retravailler ({wrongAnswers.length})
            </p>
            {wrongAnswers.map((a, i) => {
              const topicMeta = TOPICS.find(t => t.id === a.question.topic)
              const diffMeta = DIFFICULTY_CONFIG[a.question.difficulty as keyof typeof DIFFICULTY_CONFIG]
              const open = expandedIdx === i
              return (
                <div key={i} className="bg-card border border-danger/20 rounded-xl overflow-hidden">
                  <button
                    className="w-full text-left px-4 py-3 flex items-start gap-2"
                    onClick={() => setExpandedIdx(open ? null : i)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted font-mono mb-1 flex items-center gap-2">
                        <span style={{ color: topicMeta?.accent }}>{topicMeta?.title ?? a.question.topic}</span>
                        <span>·</span>
                        <span style={{ color: diffMeta?.color }}>{diffMeta?.label}</span>
                      </p>
                      <p className="text-sm text-gray-300 leading-relaxed">{a.question.question}</p>
                    </div>
                    <span className="flex-shrink-0 mt-1 text-muted/30">
                      {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </span>
                  </button>
                  {open && (
                    <div className="px-4 pb-4 border-t border-border/30 pt-3">
                      <p className="text-xs text-gray-400 leading-relaxed">{a.question.explanation}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pb-8">
          <button
            onClick={onReturnHub}
            className="py-3 rounded-xl border border-border text-sm text-muted hover:text-gray-200 flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft size={14} /> Tableau de bord
          </button>
          <button
            onClick={onRetry}
            className="py-3 rounded-xl bg-accent/20 border border-accent/30 text-accent text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent/30 transition-colors"
          >
            <Zap size={14} /> Rejouer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main QuizSession ─────────────────────────────────────────────────────────

export default function QuizSession() {
  const navigate = useNavigate()
  const {
    session, player, completedResult,
    answerQuestion, advanceQuestion, finishSession, clearCompletedResult,
    abandonSession, markQuestionStart,
  } = useQuizStore()

  // Per-question UI state
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [wasSkipped, setWasSkipped]         = useState(false)
  const [showExpl, setShowExpl]             = useState(false)
  const [lastResult, setLastResult]         = useState<{ isCorrect: boolean; xpEarned: number; explanation: string } | null>(null)
  const [showXP, setShowXP]                 = useState(false)

  const [mounted, setMounted] = useState(false)
  const explainRef = useRef<HTMLDivElement>(null)

  // Redirect only on mount — if session is active when we arrive, we're good;
  // if not (direct URL or expired), go back to hub.
  useEffect(() => {
    if (!session && !completedResult) navigate('/quiz')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  // Reset per-question state whenever we advance to a new question
  useEffect(() => {
    markQuestionStart()
    setSelectedOption(null)
    setWasSkipped(false)
    setShowExpl(false)
    setLastResult(null)
    setShowXP(false)
  }, [session?.currentIndex])

  // Keyboard shortcuts (disabled once session is done)
  const isAnsweredRef = useRef(false)
  useEffect(() => {
    if (!session) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (!isAnsweredRef.current && ['1', '2', '3', '4'].includes(e.key)) {
        handleOptionClick(parseInt(e.key) - 1)
      }
      if ((e.key === ' ' || e.key === 'Enter') && isAnsweredRef.current) {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [session])

  // ── Complete screen (Zustand state — survives StrictMode remounts) ────────────
  if (completedResult) {
    return (
      <CompleteScreen
        correct={completedResult.correct}
        total={completedResult.total}
        xpEarned={completedResult.xpEarned}
        prevXP={completedResult.prevXP}
        newXP={player.totalXP}
        streak={player.streak}
        duration={completedResult.duration}
        onReturnHub={() => { clearCompletedResult(); navigate('/quiz') }}
        onRetry={() => { clearCompletedResult(); navigate('/quiz') }}
        answers={completedResult.answers}
      />
    )
  }

  if (!session) return <div className="min-h-screen bg-background" />

  const currentQ    = session.questions[session.currentIndex]
  const isLastQ     = session.currentIndex >= session.questions.length - 1
  const isAnswered  = selectedOption !== null
  const topic       = getTopic(currentQ?.topic)
  const diffCfg     = DIFFICULTY_CONFIG[currentQ?.difficulty]
  const questionNum = session.currentIndex + 1
  const totalQ      = session.questions.length
  const progress    = (questionNum / totalQ) * 100

  isAnsweredRef.current = isAnswered

  function handleOptionClick(idx: number, skip = false) {
    if (isAnswered) return
    setSelectedOption(skip ? currentQ.answer : idx)
    if (skip) setWasSkipped(true)

    const result = answerQuestion(skip ? -1 : idx)
    setLastResult(result)

    if (result.xpEarned > 0) {
      setShowXP(true)
      setTimeout(() => setShowXP(false), 1400)
    }

    setShowExpl(true)
    setTimeout(() => explainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60)
  }

  function handleSkip() { handleOptionClick(currentQ.answer, true) }

  function handleNext() {
    if (!session) return
    if (isLastQ) {
      // Build per-question answers array and close the session atomically
      const all: CompletedAnswer[] = session.answered.map(a => ({
        isCorrect: a.isCorrect,
        question: {
          topic: a.question.topic,
          difficulty: a.question.difficulty,
          question: a.question.question,
          explanation: a.question.explanation,
        },
      }))
      finishSession(all)  // one Zustand set(): session=null + completedResult=set
    } else {
      advanceQuestion()
    }
  }

  function getOptionState(idx: number): OptionState {
    if (selectedOption === null) return 'idle'
    if (wasSkipped)                                                      return idx === currentQ.answer ? 'reveal-correct' : 'idle'
    if (idx === currentQ.answer && selectedOption !== currentQ.answer)   return 'reveal-correct'
    if (idx === selectedOption   && selectedOption === currentQ.answer)  return 'selected-correct'
    if (idx === selectedOption   && selectedOption !== currentQ.answer)  return 'selected-wrong'
    return 'idle'
  }

  if (!currentQ) return null

  return (
    <div className={`min-h-screen bg-background flex flex-col transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

      {/* Header */}
      <header className="border-b border-border/30 px-6 py-4 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => { navigate('/quiz'); abandonSession() }}
            className="text-muted/50 hover:text-muted transition-colors flex items-center gap-1.5 text-xs font-mono flex-shrink-0"
          >
            <ArrowLeft size={12} /> Quitter
          </button>

          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-muted">
              <span>{questionNum} / {totalQ}</span>
              {session.streakInSession >= 3 && (
                <span className="flex items-center gap-1 text-warning">
                  <Flame size={10} /> {session.streakInSession} série
                </span>
              )}
            </div>
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Zap size={11} className="text-accent" />
            <span className="text-xs font-mono text-accent">{session.xpEarned} XP</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-7 space-y-5">

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border"
              style={{ color: topic.accent, borderColor: `${topic.accent}30`, backgroundColor: `${topic.accent}08` }}>
              {topic.number} — {topic.title}
            </span>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border"
              style={{ color: diffCfg.color, borderColor: `${diffCfg.color}30`, backgroundColor: `${diffCfg.color}08` }}>
              {diffCfg.label}
            </span>
            {currentQ.type === 'fill' && (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-blue-800/40 text-blue-400 bg-blue-950/20">
                <PenLine size={9} /> Texte à trou
              </span>
            )}
            {currentQ.type === 'calc' && (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-violet-800/40 text-violet-400 bg-violet-950/20">
                <Calculator size={9} /> Calcul
              </span>
            )}
            <span className="text-[10px] font-mono text-muted/40 ml-auto">{diffCfg.points} pts</span>
          </div>

          {/* Progress dots */}
          <ProgressDots total={totalQ} current={session.currentIndex} answers={session.answered} />

          {/* Question */}
          <div className="relative bg-card border border-border rounded-2xl p-6">
            <XPPop xp={lastResult?.xpEarned ?? 0} show={showXP} />
            {currentQ.type === 'fill' ? (
              <p className="text-base text-gray-100 leading-relaxed font-medium">
                {currentQ.question.split('___').map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="inline-block mx-1 px-3 py-0.5 rounded bg-blue-950/40 border border-blue-700/40 text-blue-300 font-mono text-sm">___</span>
                    )}
                  </span>
                ))}
              </p>
            ) : (
              <p className="text-base text-gray-100 leading-relaxed font-medium">{currentQ.question}</p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2">
            {currentQ.options.map((opt, i) => (
              <OptionButton
                key={i}
                label={opt}
                letter={['A', 'B', 'C', 'D'][i]}
                state={getOptionState(i)}
                onClick={() => handleOptionClick(i)}
                disabled={isAnswered}
              />
            ))}
          </div>

          {/* Skip */}
          {!isAnswered && (
            <button
              onClick={handleSkip}
              className="w-full py-2.5 rounded-xl border border-border/25 text-xs text-muted/40 hover:text-muted/70 hover:border-border/50 flex items-center justify-center gap-1.5 transition-colors"
            >
              <HelpCircle size={12} />
              Je ne sais pas — voir la réponse
            </button>
          )}

          {/* Keyboard hint */}
          {!isAnswered && (
            <p className="text-center text-[10px] font-mono text-muted/20">
              Touches 1–4 pour répondre · Espace / Entrée pour avancer
            </p>
          )}

          {/* Explanation */}
          {showExpl && lastResult && (
            <div ref={explainRef}>
              <ExplanationPanel
                isCorrect={lastResult.isCorrect}
                wasSkipped={wasSkipped}
                xpEarned={lastResult.xpEarned}
                explanation={lastResult.explanation}
              />
            </div>
          )}

          {/* Next — only appears after answering, user advances manually */}
          {isAnswered && (
            <NextButton isLast={isLastQ} onNext={handleNext} />
          )}

          <div className="pb-8" />
        </div>
      </main>
    </div>
  )
}
