import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useQuizStore, usePlayerLevel, type TopicMastery, type SessionResult } from '../store/useQuizStore'
import { TOPICS, QUESTIONS, DIFFICULTY_CONFIG, type TopicId, type Difficulty, getLevelFromXP } from '../data/quizData'
import { FICHES } from '../data/fichesData'
import {
  BookOpen, Zap, Trophy, Target, BarChart2, Clock, Star,
  ChevronRight, RotateCcw, Award, Flame, TrendingUp, Shield, Swords, GalleryHorizontal,
  AlertTriangle, CheckCircle2, Activity, Calculator,
} from 'lucide-react'

const FICHES_COUNT = FICHES.length

// ─── Readiness label ──────────────────────────────────────────────────────────

function readinessLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Prêt pour BNP Paribas AM', color: '#10b981' }
  if (score >= 75) return { label: 'Analyste Senior — Très fort', color: '#22c55e' }
  if (score >= 60) return { label: 'Analyste — Niveau solide', color: '#84cc16' }
  if (score >= 45) return { label: 'En progression — Continuez', color: '#eab308' }
  if (score >= 25) return { label: 'Initié — À travailler', color: '#f97316' }
  return { label: 'Débutant — Commencez !', color: '#ef4444' }
}

// ─── Radial progress gauge ────────────────────────────────────────────────────

function RadialGauge({ value, size = 120 }: { value: number; size?: number }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const filled = (value / 100) * circumference
  const { color } = readinessLabel(value)

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#242424" strokeWidth={8}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
    </svg>
  )
}

// ─── XP progress bar ──────────────────────────────────────────────────────────

function XPBar() {
  const totalXP = useQuizStore(s => s.player.totalXP)
  const level = getLevelFromXP(totalXP)
  const next = level.level < 10
    ? { minXP: level.maxXP + 1, label: '' }
    : null

  const pct = next
    ? Math.min(100, ((totalXP - level.minXP) / (level.maxXP - level.minXP)) * 100)
    : 100

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-accent">{level.label}</span>
        <span className="text-muted font-mono">{totalXP} XP</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      {next && (
        <div className="text-[10px] text-muted/50 font-mono text-right">
          {level.maxXP - totalXP} XP → niveau suivant
        </div>
      )}
    </div>
  )
}

// ─── Topic card ───────────────────────────────────────────────────────────────

interface TopicCardProps {
  topicId: TopicId
  mastery: number
  attempted: number
  correct: number
  onQuickQuiz: () => void
}

function TopicCard({ topicId, mastery, attempted, correct, onQuickQuiz }: TopicCardProps) {
  const topic = TOPICS.find(t => t.id === topicId)!
  const questionsAvailable = QUESTIONS.filter(q => q.topic === topicId).length
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : null

  const borderOpacity = mastery > 0 ? Math.max(0.3, mastery / 100) : 0.15

  return (
    <div
      className="relative rounded-xl border bg-card p-4 cursor-pointer group transition-all duration-200 hover:scale-[1.01]"
      style={{
        borderColor: `${topic.accent}${Math.round(borderOpacity * 255).toString(16).padStart(2, '0')}`,
      }}
      onClick={onQuickQuiz}
    >
      {/* Topic number + title */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded border"
            style={{ color: topic.accent, borderColor: `${topic.accent}40` }}
          >
            {topic.number}
          </span>
          <span className="text-sm font-medium text-gray-200 leading-tight">{topic.title}</span>
        </div>
        <span className="text-[11px] font-mono font-bold" style={{ color: topic.accent }}>
          {mastery}%
        </span>
      </div>

      {/* Mastery bar */}
      <div className="h-1 bg-border rounded-full mb-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${mastery}%`, backgroundColor: topic.accent }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-[10px] text-muted font-mono">
        <span>{questionsAvailable} questions</span>
        {accuracy !== null && (
          <span className={accuracy >= 70 ? 'text-accent' : accuracy >= 50 ? 'text-warning' : 'text-danger'}>
            {accuracy}% correct
          </span>
        )}
        {accuracy === null && <span>Non tenté</span>}
      </div>

      {/* Hover CTA */}
      <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity duration-200">
        <span className="text-xs font-mono text-white flex items-center gap-1.5">
          <Zap size={12} /> Démarrer
        </span>
      </div>
    </div>
  )
}

// ─── Mode card ────────────────────────────────────────────────────────────────

interface ModeCardProps {
  icon: React.ElementType
  title: string
  subtitle: string
  accent: string
  onClick: () => void
  badge?: string
}

function ModeCard({ icon: Icon, title, subtitle, accent, onClick, badge }: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-opacity-60 text-left w-full transition-all duration-200 hover:scale-[1.01] group"
      style={{ '--accent-color': accent } as React.CSSProperties}
    >
      <div className="p-2.5 rounded-lg border flex-shrink-0" style={{ borderColor: `${accent}30`, backgroundColor: `${accent}10` }}>
        <Icon size={18} style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-200">{title}</span>
          {badge && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-warning/30 text-warning bg-warning/10">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted mt-0.5">{subtitle}</p>
      </div>
      <ChevronRight size={14} className="text-muted/40 group-hover:text-muted transition-colors flex-shrink-0" />
    </button>
  )
}

// ─── Badge list ───────────────────────────────────────────────────────────────

const BADGE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'first-level':    { label: 'Premier niveau', icon: Star, color: '#22c55e' },
  'credit-analyst': { label: 'Credit Analyst', icon: BarChart2, color: '#3b82f6' },
  'director':       { label: 'Director', icon: Award, color: '#a855f7' },
  'bnp-ready':      { label: 'BNP AM Ready', icon: Trophy, color: '#f59e0b' },
  'streak-5':       { label: 'Série de 5', icon: Flame, color: '#f97316' },
  'streak-10':      { label: 'Série de 10', icon: Flame, color: '#ef4444' },
  'streak-20':      { label: 'Série de 20', icon: Flame, color: '#dc2626' },
  '50-questions':   { label: '50 questions', icon: BookOpen, color: '#06b6d4' },
  '200-questions':  { label: '200 questions', icon: BookOpen, color: '#8b5cf6' },
  'lf-master':      { label: 'Maître LF', icon: Shield, color: '#f59e0b' },
}

// ─── Session trend chart ──────────────────────────────────────────────────────

function SessionTrendChart({ sessions }: { sessions: SessionResult[] }) {
  const ordered = [...sessions].reverse().slice(-8)
  if (ordered.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-muted/30 text-xs font-mono">
        Aucune session
      </div>
    )
  }
  return (
    <div className="flex items-end gap-1.5 h-20 pt-2">
      {ordered.map((s, i) => {
        const pct = s.totalQuestions > 0 ? Math.round((s.correct / s.totalQuestions) * 100) : 0
        const color = pct >= 70 ? '#10b981' : pct >= 50 ? '#eab308' : '#ef4444'
        const barH = Math.max(6, (pct / 100) * 56)
        return (
          <div key={s.id} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-card border border-border rounded px-2 py-1 text-[10px] text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {s.correct}/{s.totalQuestions} · +{s.xpEarned} XP
            </div>
            <div className="w-full rounded-sm transition-all duration-500" style={{ height: barH, backgroundColor: color }} />
            <span className="text-[9px] font-mono" style={{ color }}>{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Weak topics panel ────────────────────────────────────────────────────────

function WeakTopicsPanel({
  topicMastery,
  onLaunch,
}: {
  topicMastery: Record<TopicId, TopicMastery>
  onLaunch: (topicId: TopicId) => void
}) {
  const attempted = TOPICS.filter(t => (topicMastery[t.id]?.attempted ?? 0) > 0)
  const weak = attempted
    .filter(t => (topicMastery[t.id]?.score ?? 0) < 80)
    .sort((a, b) => (topicMastery[a.id]?.score ?? 0) - (topicMastery[b.id]?.score ?? 0))
    .slice(0, 5)

  const notStarted = TOPICS.filter(t => (topicMastery[t.id]?.attempted ?? 0) === 0).slice(0, Math.max(0, 5 - weak.length))

  if (weak.length === 0 && notStarted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
        <CheckCircle2 size={28} className="text-accent" />
        <p className="text-sm text-accent font-medium">Tous les topics maîtrisés</p>
        <p className="text-xs text-muted/50">Score ≥ 80% partout</p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {weak.map(topic => {
        const m = topicMastery[topic.id]
        return (
          <button
            key={topic.id}
            onClick={() => onLaunch(topic.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/40 bg-card hover:border-border/70 transition-colors group text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-300 truncate pr-1">{topic.title}</span>
                <span className="text-[11px] font-mono font-bold flex-shrink-0" style={{ color: topic.accent }}>
                  {m?.score ?? 0}%
                </span>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${m?.score ?? 0}%`, backgroundColor: topic.accent }} />
              </div>
            </div>
            <ChevronRight size={12} className="text-muted/30 group-hover:text-accent transition-colors flex-shrink-0" />
          </button>
        )
      })}
      {notStarted.map(topic => (
        <button
          key={topic.id}
          onClick={() => onLaunch(topic.id)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-border/25 bg-card/40 hover:border-border/50 transition-colors group text-left"
        >
          <div className="flex-1 min-w-0">
            <span className="text-xs text-muted/60 truncate">{topic.title}</span>
          </div>
          <span className="text-[9px] font-mono text-muted/30">non tenté</span>
          <ChevronRight size={11} className="text-muted/20 group-hover:text-muted transition-colors flex-shrink-0" />
        </button>
      ))}
    </div>
  )
}

// ─── Topic accuracy heatmap row ───────────────────────────────────────────────

function TopicHeatmapRow({ topicMastery }: { topicMastery: Record<TopicId, TopicMastery> }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {TOPICS.map(topic => {
        const m = topicMastery[topic.id]
        const opacity = !m || m.attempted === 0 ? 0.08 : Math.max(0.15, m.score / 100)
        return (
          <div
            key={topic.id}
            title={`${topic.title}: ${m?.score ?? 0}%`}
            className="h-3 rounded-sm flex-1 min-w-[14px]"
            style={{ backgroundColor: topic.accent, opacity }}
          />
        )
      })}
    </div>
  )
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ResetConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-card border border-border rounded-xl p-6 max-w-xs w-full mx-4 space-y-4">
        <h3 className="text-base font-semibold text-gray-100">Réinitialiser la progression ?</h3>
        <p className="text-sm text-muted">
          Toute la progression, les XP et les badges seront effacés. Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-border text-sm text-muted hover:text-gray-200 transition-colors">
            Annuler
          </button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-lg bg-danger/20 border border-danger/30 text-danger text-sm hover:bg-danger/30 transition-colors">
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Name modal ───────────────────────────────────────────────────────────────

function NameModal({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-card border border-border rounded-xl p-8 max-w-sm w-full mx-4 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-100 mb-2">Bienvenue !</h2>
          <p className="text-sm text-muted">
            Entrez votre prénom pour personnaliser votre profil. Ce profil suivra votre progression vers l'entretien BNP Paribas AM LL&PD.
          </p>
        </div>
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && value.trim() && onSubmit(value.trim())}
          className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-muted/40 focus:outline-none focus:border-accent transition-colors"
          placeholder="Votre prénom..."
          maxLength={30}
        />
        <button
          onClick={() => value.trim() && onSubmit(value.trim())}
          disabled={!value.trim()}
          className="w-full py-3 rounded-lg bg-accent/20 border border-accent/30 text-accent font-medium text-sm hover:bg-accent/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Commencer l'entraînement
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuizPage() {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)

  const { player, topicMastery, overallReadiness, sessionHistory, startSession, setPlayerName, resetProgress } = useQuizStore()
  const levelInfo = usePlayerLevel()

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (mounted && !player.name) {
      setShowNameModal(true)
    }
  }, [mounted, player.name])

  const { label: readinessText, color: readinessColor } = readinessLabel(overallReadiness)

  function launchSession(config: Parameters<typeof startSession>[0]) {
    startSession(config)
    navigate('/quiz/session')
  }

  function handleNameSubmit(name: string) {
    setPlayerName(name)
    setShowNameModal(false)
  }

  const recentSessions = sessionHistory.slice(0, 5)
  const totalTopicsAttempted = Object.values(topicMastery).filter(m => m.attempted > 0).length
  const avgAccuracy = player.totalQuestions > 0
    ? Math.round((player.totalCorrect / player.totalQuestions) * 100)
    : 0

  const topicsMastered = Object.values(topicMastery).filter(m => (m?.score ?? 0) >= 80).length
  const totalDurationSecs = sessionHistory.reduce((acc, s) => acc + s.duration, 0)
  const totalDurationMin = Math.round(totalDurationSecs / 60)
  const avgSessionScore = sessionHistory.length > 0
    ? Math.round(sessionHistory.reduce((acc, s) => acc + (s.totalQuestions > 0 ? s.correct / s.totalQuestions : 0), 0) / sessionHistory.length * 100)
    : 0

  return (
    <div
      className={`min-h-screen bg-background transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Name modal on first visit */}
      {showNameModal && <NameModal onSubmit={handleNameSubmit} />}
      {showReset && (
        <ResetConfirm
          onConfirm={() => { resetProgress(); setShowReset(false) }}
          onCancel={() => setShowReset(false)}
        />
      )}

      {/* Header */}
      <header className="border-b border-border/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-xs font-mono text-muted/60 hover:text-muted transition-colors"
          >
            TGA
          </button>
          <span className="w-px h-3 bg-border" />
          <span className="text-xs font-mono text-accent/80">Interview Prep</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted/40">
            {player.name || 'Profil'}
          </span>
          <button
            onClick={() => setShowReset(true)}
            className="text-[10px] font-mono text-muted/30 hover:text-danger/60 transition-colors flex items-center gap-1"
          >
            <RotateCcw size={10} /> Reset
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ── Player Profile ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Readiness gauge */}
          <div className="col-span-1 bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <RadialGauge value={overallReadiness} size={110} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-100">{overallReadiness}%</span>
                <span className="text-[9px] font-mono text-muted uppercase tracking-wider">prêt</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium" style={{ color: readinessColor }}>{readinessText}</p>
              <p className="text-[10px] text-muted/50 mt-1 font-mono">Objectif : BNP Paribas AM LL&PD</p>
            </div>
          </div>

          {/* Player stats */}
          <div className="col-span-1 bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-100">
                  {player.name || 'Anonyme'}
                </p>
                <p className="text-xs font-mono text-accent">{levelInfo.label}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <Flame size={14} className="text-warning" />
                  <span className="text-sm font-bold text-warning">{player.streak}</span>
                </div>
                <p className="text-[10px] text-muted font-mono">série</p>
              </div>
            </div>
            <XPBar />
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: 'Sessions', value: player.totalSessions },
                { label: 'Questions', value: player.totalQuestions },
                { label: 'Précision', value: `${avgAccuracy}%` },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-sm font-bold text-gray-200">{s.value}</p>
                  <p className="text-[9px] text-muted font-mono">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Badges + quick stats */}
          <div className="col-span-1 bg-card border border-border rounded-xl p-6 space-y-3">
            <p className="text-xs font-mono text-muted uppercase tracking-wider">Badges</p>
            {player.badges.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
                <Trophy size={24} className="text-muted/20 mb-2" />
                <p className="text-xs text-muted/40">Complétez des quizs pour débloquer des badges</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {player.badges.map(b => {
                  const meta = BADGE_META[b] ?? { label: b, icon: Star, color: '#10b981' }
                  const Icon = meta.icon
                  return (
                    <div
                      key={b}
                      title={meta.label}
                      className="p-1.5 rounded-lg border"
                      style={{ borderColor: `${meta.color}30`, backgroundColor: `${meta.color}10` }}
                    >
                      <Icon size={14} style={{ color: meta.color }} />
                    </div>
                  )
                })}
              </div>
            )}

            <div className="pt-2 border-t border-border/50 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Topics tentés</span>
                <span className="font-mono text-gray-300">{totalTopicsAttempted} / {TOPICS.length}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Meilleure série</span>
                <span className="font-mono text-warning">{player.bestStreak}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Launch ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-mono text-muted uppercase tracking-wider mb-3">Modes de jeu</p>
            <div className="space-y-2">
              <ModeCard
                icon={Zap}
                title="Quiz Rapide"
                subtitle="10 questions aléatoires — tous niveaux"
                accent="#10b981"
                onClick={() => launchSession({ mode: 'mixed', questionCount: 10 })}
              />
              <ModeCard
                icon={Shield}
                title="Leveraged Finance"
                subtitle="Focus LL&PD — questions critiques pour l'entretien"
                accent="#f59e0b"
                badge="BNPP AM"
                onClick={() => launchSession({ mode: 'topic', topicId: 'leveraged-finance', questionCount: 10 })}
              />
              <ModeCard
                icon={Target}
                title="Mode Analyste"
                subtitle="Questions niveau Analyst & Senior uniquement"
                accent="#3b82f6"
                onClick={() => launchSession({ mode: 'difficulty', difficulty: 'analyst', questionCount: 10 })}
              />
              <ModeCard
                icon={Swords}
                title="Boss Mode"
                subtitle="Senior + Expert — simuler les questions difficiles d'entretien"
                accent="#ef4444"
                badge="Hard"
                onClick={() => launchSession({ mode: 'boss', questionCount: 12 })}
              />
              <ModeCard
                icon={BookOpen}
                title="Examen Blanc"
                subtitle="30 questions équilibrées sur tous les travaux"
                accent="#8b5cf6"
                onClick={() => launchSession({ mode: 'exam', questionCount: 30 })}
              />
              <ModeCard
                icon={Calculator}
                title="Problèmes Quantitatifs"
                subtitle="Calculs LBO, WACC, DCF, DSCR — exercices chiffrés"
                accent="#f97316"
                badge="Calcul"
                onClick={() => launchSession({ mode: 'problems', questionCount: 10 })}
              />
              <ModeCard
                icon={GalleryHorizontal}
                title="Fiches de révision"
                subtitle={`${FICHES_COUNT} fiches — flip cards sur les concepts clés`}
                accent="#06b6d4"
                onClick={() => navigate('/quiz/fiches')}
              />
            </div>
          </div>

          {/* Recent history */}
          <div>
            <p className="text-xs font-mono text-muted uppercase tracking-wider mb-3">Historique récent</p>
            {recentSessions.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <TrendingUp size={24} className="text-muted/20 mx-auto mb-3" />
                <p className="text-sm text-muted/50">Aucune session pour le moment</p>
                <p className="text-xs text-muted/30 mt-1">Démarrez votre premier quiz !</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSessions.map(s => {
                  const pct = Math.round((s.correct / s.totalQuestions) * 100)
                  const modeLabel: Record<string, string> = {
                    mixed: 'Quiz Rapide', topic: 'Topic', difficulty: 'Niveau',
                    exam: 'Examen', boss: 'Boss Mode', problems: 'Problèmes',
                  }
                  return (
                    <div key={s.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-300">
                          {modeLabel[s.config.mode] ?? s.config.mode}
                          {s.config.topicId && ` — ${TOPICS.find(t => t.id === s.config.topicId)?.title ?? ''}`}
                        </p>
                        <p className="text-[10px] text-muted font-mono">
                          {new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${pct >= 70 ? 'text-accent' : pct >= 50 ? 'text-warning' : 'text-danger'}`}>
                          {pct}%
                        </p>
                        <p className="text-[10px] text-muted font-mono">+{s.xpEarned} XP</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Metrics & Progression ────────────────────────────────────────── */}
        <div className="space-y-4">
          <p className="text-xs font-mono text-muted uppercase tracking-wider">Analyse de progression</p>

          {/* Quick stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                icon: CheckCircle2,
                label: 'Topics maîtrisés',
                value: `${topicsMastered} / ${TOPICS.length}`,
                color: topicsMastered > 0 ? '#10b981' : '#6b7280',
                sub: 'score ≥ 80%',
              },
              {
                icon: Activity,
                label: 'Précision moy. / session',
                value: sessionHistory.length > 0 ? `${avgSessionScore}%` : '—',
                color: avgSessionScore >= 70 ? '#10b981' : avgSessionScore >= 50 ? '#eab308' : '#6b7280',
                sub: `${sessionHistory.length} session${sessionHistory.length > 1 ? 's' : ''}`,
              },
              {
                icon: Flame,
                label: 'Meilleure série',
                value: player.bestStreak > 0 ? `${player.bestStreak}` : '—',
                color: '#f97316',
                sub: 'réponses consécutives',
              },
              {
                icon: Clock,
                label: 'Temps total',
                value: totalDurationMin > 0 ? `${totalDurationMin} min` : '—',
                color: '#8b5cf6',
                sub: `${player.totalQuestions} questions répondues`,
              },
            ].map(stat => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: `${stat.color}15`, border: `1px solid ${stat.color}25` }}>
                    <Icon size={14} style={{ color: stat.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-none mb-1" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-[10px] text-gray-300 leading-tight">{stat.label}</p>
                    <p className="text-[9px] text-muted/50 font-mono mt-0.5">{stat.sub}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Heatmap + session trend + weak topics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Session trend */}
            <div className="md:col-span-2 bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={13} className="text-accent" />
                  <p className="text-xs font-mono text-muted uppercase tracking-wider">Tendance des sessions</p>
                </div>
                <span className="text-[10px] text-muted/40 font-mono">8 dernières</span>
              </div>
              <SessionTrendChart sessions={sessionHistory} />
              {sessionHistory.length > 0 && (
                <div className="pt-2 border-t border-border/40">
                  <p className="text-[10px] text-muted/50 font-mono mb-2">Maîtrise par topic</p>
                  <TopicHeatmapRow topicMastery={topicMastery} />
                  <div className="flex justify-between text-[9px] text-muted/30 font-mono mt-1">
                    <span>non tenté</span>
                    <span>maîtrisé</span>
                  </div>
                </div>
              )}
            </div>

            {/* Weak topics */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={13} className="text-warning" />
                <p className="text-xs font-mono text-muted uppercase tracking-wider">Points à renforcer</p>
              </div>
              <WeakTopicsPanel
                topicMastery={topicMastery}
                onLaunch={(topicId) => launchSession({ mode: 'topic', topicId, questionCount: 7 })}
              />
            </div>
          </div>
        </div>

        {/* ── Topics Grid ──────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-mono text-muted uppercase tracking-wider">Les 12 Travaux + Leveraged Finance</p>
            <p className="text-[10px] text-muted/40 font-mono">{QUESTIONS.length} questions au total</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {TOPICS.map(topic => (
              <TopicCard
                key={topic.id}
                topicId={topic.id}
                mastery={topicMastery[topic.id]?.score ?? 0}
                attempted={topicMastery[topic.id]?.attempted ?? 0}
                correct={topicMastery[topic.id]?.correct ?? 0}
                onQuickQuiz={() => launchSession({ mode: 'topic', topicId: topic.id, questionCount: 7 })}
              />
            ))}
          </div>
        </div>

        {/* ── Difficulty selector ──────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-mono text-muted uppercase tracking-wider mb-3">Par niveau</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG[Difficulty]][]).map(([diff, cfg]) => (
              <button
                key={diff}
                onClick={() => launchSession({ mode: 'difficulty', difficulty: diff, questionCount: 8 })}
                className="p-4 rounded-xl border border-border bg-card text-left hover:scale-[1.02] transition-all duration-200 group"
              >
                <p className="text-xs font-mono mb-1" style={{ color: cfg.color }}>{cfg.label}</p>
                <p className="text-[11px] text-muted">
                  {QUESTIONS.filter(q => q.difficulty === diff).length} questions
                </p>
                <p className="text-[10px] text-muted/40 mt-1 font-mono">{cfg.points} pts / bonne réponse</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="pb-8 text-center">
          <p className="text-xs text-muted/25 font-mono">
            Les réponses incorrectes réduisent votre score de maîtrise — la progression est non-linéaire.
          </p>
        </div>
      </div>
    </div>
  )
}
