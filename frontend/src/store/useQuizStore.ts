import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  QuizQuestion,
  TopicId,
  Difficulty,
  TOPICS,
  getLevelFromXP,
  DIFFICULTY_CONFIG,
  getRandomQuestions,
  getQuestionsByTopic,
  getQuestionsByDifficulty,
  getQuestionsByTopicAndDifficulty,
  QUESTIONS,
} from '../data/quizData'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface TopicMastery {
  score: number           // 0–100
  attempted: number
  correct: number
  lastAttempted: string | null
}

export interface PlayerProfile {
  name: string
  totalXP: number
  streak: number
  bestStreak: number
  totalSessions: number
  totalQuestions: number
  totalCorrect: number
  badges: string[]
  createdAt: string
}

export interface SessionConfig {
  mode: 'topic' | 'mixed' | 'difficulty' | 'exam' | 'boss' | 'problems'
  topicId?: TopicId
  difficulty?: Difficulty
  questionCount: number
}

export interface SessionQuestion {
  question: QuizQuestion
  userAnswer: number | null
  isCorrect: boolean | null
  xpEarned: number
  timeSpent: number
}

export interface ActiveSession {
  config: SessionConfig
  questions: QuizQuestion[]
  currentIndex: number
  answered: SessionQuestion[]
  startTime: number
  streakInSession: number
  xpEarned: number
}

export interface SessionResult {
  id: string
  date: string
  config: SessionConfig
  totalQuestions: number
  correct: number
  xpEarned: number
  duration: number  // seconds
}

// ─── Store ─────────────────────────────────────────────────────────────────────

// Per-question answer stored with the completed session result
export interface CompletedAnswer {
  isCorrect: boolean | null
  question: { topic: string; difficulty: string; question: string; explanation: string }
}

// Result stored atomically in Zustand when a session finishes — survives StrictMode remounts
export interface CompletedResult {
  answers: CompletedAnswer[]
  correct: number
  total: number
  xpEarned: number
  prevXP: number   // player XP before this session
  duration: number
}

interface QuizStore {
  player: PlayerProfile
  topicMastery: Record<TopicId, TopicMastery>
  overallReadiness: number
  sessionHistory: SessionResult[]
  session: ActiveSession | null
  completedResult: CompletedResult | null  // set atomically with session=null on finish
  questionStartTime: number

  setPlayerName: (name: string) => void
  resetProgress: () => void

  startSession: (config: SessionConfig) => void
  answerQuestion: (optionIndex: number) => { isCorrect: boolean; xpEarned: number; explanation: string }
  advanceQuestion: () => void
  finishSession: (answers: CompletedAnswer[]) => void  // ends session + stores result atomically
  clearCompletedResult: () => void
  abandonSession: () => void
  markQuestionStart: () => void
}

// ─── Initial state ─────────────────────────────────────────────────────────────

function buildInitialMastery(): Record<TopicId, TopicMastery> {
  const result = {} as Record<TopicId, TopicMastery>
  for (const topic of TOPICS) {
    result[topic.id] = { score: 0, attempted: 0, correct: 0, lastAttempted: null }
  }
  return result
}

function buildInitialPlayer(): PlayerProfile {
  return {
    name: '',
    totalXP: 0,
    streak: 0,
    bestStreak: 0,
    totalSessions: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    badges: [],
    createdAt: new Date().toISOString(),
  }
}

// ─── Scoring logic ─────────────────────────────────────────────────────────────

function computeXP(question: QuizQuestion, isCorrect: boolean, streakInSession: number): number {
  const base = DIFFICULTY_CONFIG[question.difficulty].points
  if (!isCorrect) return 0

  let multiplier = 1.0
  if (streakInSession >= 10) multiplier = 2.0
  else if (streakInSession >= 5) multiplier = 1.5
  else if (streakInSession >= 3) multiplier = 1.25

  return Math.round(base * multiplier)
}

// Non-linear mastery update: correct +10, incorrect -5, clamped 0–100
function updateMasteryScore(current: number, isCorrect: boolean): number {
  const delta = isCorrect ? 10 : -5
  return Math.max(0, Math.min(100, current + delta))
}

// Weighted average across topics
function computeOverallReadiness(mastery: Record<TopicId, TopicMastery>): number {
  let totalWeight = 0
  let weightedScore = 0
  for (const topic of TOPICS) {
    weightedScore += mastery[topic.id].score * topic.weight
    totalWeight += topic.weight
  }
  return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0
}

// ─── Zustand store ────────────────────────────────────────────────────────────

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      player: buildInitialPlayer(),
      topicMastery: buildInitialMastery(),
      overallReadiness: 0,
      sessionHistory: [],
      session: null,
      completedResult: null,
      questionStartTime: Date.now(),

      setPlayerName: (name) =>
        set(state => ({ player: { ...state.player, name } })),

      resetProgress: () =>
        set({
          player: buildInitialPlayer(),
          topicMastery: buildInitialMastery(),
          overallReadiness: 0,
          sessionHistory: [],
          session: null,
        }),

      startSession: (config) => {
        let pool: QuizQuestion[] = []

        if (config.mode === 'topic' && config.topicId) {
          pool = config.difficulty
            ? getQuestionsByTopicAndDifficulty(config.topicId, config.difficulty)
            : getQuestionsByTopic(config.topicId)
        } else if (config.mode === 'difficulty' && config.difficulty) {
          pool = getQuestionsByDifficulty(config.difficulty)
        } else if (config.mode === 'exam') {
          // Balanced exam: pick from each topic proportionally
          const perTopic = Math.max(1, Math.floor(config.questionCount / TOPICS.length))
          for (const topic of TOPICS) {
            const tq = getQuestionsByTopic(topic.id)
            pool.push(...getRandomQuestions(perTopic, tq))
          }
        } else if (config.mode === 'boss') {
          // Boss mode: senior + expert only
          pool = QUESTIONS.filter(q => q.difficulty === 'senior' || q.difficulty === 'expert')
        } else if (config.mode === 'problems') {
          // Problems mode: calc-type questions only
          pool = QUESTIONS.filter(q => q.type === 'calc')
        } else {
          // mixed
          pool = QUESTIONS
        }

        const questions = getRandomQuestions(config.questionCount, pool)

        set({
          completedResult: null,  // clear previous result when starting fresh
          session: {
            config,
            questions,
            currentIndex: 0,
            answered: [],
            startTime: Date.now(),
            streakInSession: 0,
            xpEarned: 0,
          },
          questionStartTime: Date.now(),
        })
      },

      markQuestionStart: () => set({ questionStartTime: Date.now() }),

      advanceQuestion: () => {
        const { session } = get()
        if (!session) return
        set({
          session: { ...session, currentIndex: session.currentIndex + 1 },
          questionStartTime: Date.now(),
        })
      },

      answerQuestion: (optionIndex) => {
        const { session, questionStartTime, player, topicMastery } = get()
        if (!session) return { isCorrect: false, xpEarned: 0, explanation: '' }

        const question = session.questions[session.currentIndex]
        const isCorrect = optionIndex === question.answer
        const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)

        const newStreak = isCorrect ? session.streakInSession + 1 : 0
        const xpEarned = computeXP(question, isCorrect, newStreak)

        const answered: SessionQuestion = {
          question,
          userAnswer: optionIndex,
          isCorrect,
          xpEarned,
          timeSpent,
        }

        // Update mastery
        const prevMastery = topicMastery[question.topic]
        const newMasteryScore = updateMasteryScore(prevMastery.score, isCorrect)
        const newTopicMastery: Record<TopicId, TopicMastery> = {
          ...topicMastery,
          [question.topic]: {
            score: newMasteryScore,
            attempted: prevMastery.attempted + 1,
            correct: prevMastery.correct + (isCorrect ? 1 : 0),
            lastAttempted: new Date().toISOString(),
          },
        }

        const newOverallReadiness = computeOverallReadiness(newTopicMastery)

        // Update session — do NOT increment currentIndex here.
        // currentIndex advances only when the user explicitly clicks "Next" (advanceQuestion).
        const updatedSession: ActiveSession = {
          ...session,
          answered: [...session.answered, answered],
          streakInSession: newStreak,
          xpEarned: session.xpEarned + xpEarned,
        }

        // Update player XP and streak
        const newTotalXP = player.totalXP + xpEarned
        const newBestStreak = Math.max(player.bestStreak, newStreak)
        const newBadges = computeBadges(player.badges, player, newTotalXP, newStreak, topicMastery, newTopicMastery)

        set({
          session: updatedSession,
          topicMastery: newTopicMastery,
          overallReadiness: newOverallReadiness,
          questionStartTime: Date.now(),
          player: {
            ...player,
            totalXP: newTotalXP,
            streak: newStreak,
            bestStreak: newBestStreak,
            totalQuestions: player.totalQuestions + 1,
            totalCorrect: player.totalCorrect + (isCorrect ? 1 : 0),
            badges: newBadges,
          },
        })

        return { isCorrect, xpEarned, explanation: question.explanation }
      },

      // Atomically closes the session AND stores the completed result in one set() call.
      // Both session=null and completedResult are committed in the same Zustand update,
      // so there is never an intermediate render with session=null but no result to show.
      finishSession: (answers) => {
        const { session, player, sessionHistory } = get()
        if (!session) return

        const duration = Math.round((Date.now() - session.startTime) / 1000)
        const correct = answers.filter(a => a.isCorrect === true).length
        const prevXP = player.totalXP - session.xpEarned  // XP before this session

        const sessionResult: SessionResult = {
          id: `session-${Date.now()}`,
          date: new Date().toISOString(),
          config: session.config,
          totalQuestions: answers.length,
          correct,
          xpEarned: session.xpEarned,
          duration,
        }

        set({
          session: null,
          completedResult: { answers, correct, total: answers.length, xpEarned: session.xpEarned, prevXP, duration },
          sessionHistory: [sessionResult, ...sessionHistory].slice(0, 50),
          player: { ...player, totalSessions: player.totalSessions + 1 },
        })
      },

      clearCompletedResult: () => set({ completedResult: null }),

      abandonSession: () => set({ session: null, completedResult: null }),
    }),

    {
      name: 'tga-quiz-store',
      version: 1,
      // Only persist the durable data — session state and UI results are ephemeral
      partialize: (state) => ({
        player: state.player,
        topicMastery: state.topicMastery,
        overallReadiness: state.overallReadiness,
        sessionHistory: state.sessionHistory,
      }),
      // Merge stored topicMastery with initial state so topics added after the user's
      // first session (e.g. 'clo', 'actualite') are never undefined.
      merge: (persisted, current) => {
        const stored = persisted as Partial<typeof current>
        return {
          ...current,
          ...stored,
          topicMastery: {
            ...current.topicMastery,
            ...(stored.topicMastery ?? {}),
          },
        }
      },
    }
  )
)

// ─── Badge logic ──────────────────────────────────────────────────────────────

function computeBadges(
  existing: string[],
  player: PlayerProfile,
  newXP: number,
  newStreak: number,
  oldMastery: Record<TopicId, TopicMastery>,
  newMastery: Record<TopicId, TopicMastery>
): string[] {
  const badges = new Set(existing)

  if (newXP >= 300 && !badges.has('first-level')) badges.add('first-level')
  if (newXP >= 1300 && !badges.has('credit-analyst')) badges.add('credit-analyst')
  if (newXP >= 4700 && !badges.has('director')) badges.add('director')
  if (newXP >= 12000 && !badges.has('bnp-ready')) badges.add('bnp-ready')
  if (newStreak >= 5 && !badges.has('streak-5')) badges.add('streak-5')
  if (newStreak >= 10 && !badges.has('streak-10')) badges.add('streak-10')
  if (newStreak >= 20 && !badges.has('streak-20')) badges.add('streak-20')
  if (player.totalQuestions >= 50 && !badges.has('50-questions')) badges.add('50-questions')
  if (player.totalQuestions >= 200 && !badges.has('200-questions')) badges.add('200-questions')

  // Check if any topic hits 80%
  for (const topic of TOPICS) {
    if (newMastery[topic.id].score >= 80 && oldMastery[topic.id].score < 80) {
      badges.add(`master-${topic.id}`)
    }
  }

  // Check leveraged finance mastery (most important for the role)
  if (newMastery['leveraged-finance'].score >= 80 && !badges.has('lf-master')) {
    badges.add('lf-master')
  }

  return Array.from(badges)
}

// ─── Selector hooks ───────────────────────────────────────────────────────────

export function useCurrentQuestion() {
  const session = useQuizStore(s => s.session)
  if (!session || session.currentIndex >= session.questions.length) return null
  return session.questions[session.currentIndex]
}

export function usePlayerLevel() {
  const totalXP = useQuizStore(s => s.player.totalXP)
  return getLevelFromXP(totalXP)
}
