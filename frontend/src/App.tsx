import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './components/ui/Layout'

// Route-level code splitting — heavy pages (Plotly charts) load only when visited,
// keeping the initial bundle small for first-time visitors.
const GatewayPage = lazy(() => import('./pages/GatewayPage'))
const Home = lazy(() => import('./pages/Home'))
const FundamentalPage = lazy(() => import('./pages/FundamentalPage'))
const TechnicalPage = lazy(() => import('./pages/TechnicalPage'))
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'))
const DebtPage = lazy(() => import('./pages/DebtPage'))
const GuidePage = lazy(() => import('./pages/GuidePage'))
const ComparePage = lazy(() => import('./pages/ComparePage'))
const PrivateCreditPage = lazy(() => import('./pages/PrivateCreditPage'))
const QuizPage = lazy(() => import('./pages/QuizPage'))
const QuizSession = lazy(() => import('./pages/QuizSession'))
const QuizFiches = lazy(() => import('./pages/QuizFiches'))
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'))
const MemoPage = lazy(() => import('./pages/MemoPage'))
const CovenantTrackerPage = lazy(() => import('./pages/CovenantTrackerPage'))
const SponsorsPage = lazy(() => import('./pages/SponsorsPage'))

function PageFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <span className="flex items-center gap-2 text-muted text-xs font-mono tracking-wider">
        <span className="animate-spin inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full" />
        Loading…
      </span>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Home / Gateway — no Layout (custom landing) */}
        <Route path="/" element={<GatewayPage />} />

        {/* Quiz — full immersive experience, no Layout */}
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/quiz/session" element={<QuizSession />} />
        <Route path="/quiz/fiches" element={<QuizFiches />} />

        {/* All other pages share the unified Layout */}
        <Route element={<Layout />}>
          <Route path="/public" element={<Home />} />
          <Route path="/private" element={<PrivateCreditPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/memo/new" element={<MemoPage />} />
          <Route path="/memo/:memoId" element={<MemoPage />} />
          <Route path="/covenants/:dealId" element={<CovenantTrackerPage />} />
          <Route path="/sponsors" element={<SponsorsPage />} />
          <Route path="/fundamental/:ticker" element={<FundamentalPage />} />
          <Route path="/technical/:ticker" element={<TechnicalPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/debt/:ticker" element={<DebtPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/compare" element={<ComparePage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
