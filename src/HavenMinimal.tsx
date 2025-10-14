import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TopBar from './components/TopBar'
import Feed from './components/Feed'
import ComposerModal from './components/ComposerModal'
import UserProfile from './components/UserProfile'
import ProfileHeader from './components/ProfileHeader'
import TraceCard from './components/TraceCard'
import EmptyState from './components/EmptyState'
import ProfileSwitcher from './components/profile/ProfileSwitcher'
import type {
  HavenState,
  Mode,
  Reflection,
  Trace,
  TraceType,
  User,
} from './lib/types'
import { loadState, saveState, clearState } from './lib/storage'
import { timeAgo, useMinuteTicker } from './lib/time'
import { pageVariants } from './lib/animation'

const HOURS = 60 * 60 * 1000
const MINUTES = 60 * 1000

type SeedTrace = {
  author: string
  text: string
  kind: TraceType
  offset: number
  reflections?: { author: string; text: string; offset: number }[]
}

const SEED_TRACES_TEMPLATE: SeedTrace[] = [
  {
    author: 'Lena',
    text: 'Stillness teaches what noise hides.',
    kind: 'circle',
    offset: 2 * HOURS,
    reflections: [
      {
        author: 'Ava',
        text: 'Saving this line for when the city gets loud.',
        offset: 90 * MINUTES,
      },
    ],
  },
  {
    author: 'Milo',
    text: 'Design is how silence looks when it’s visual.',
    kind: 'signal',
    offset: 5 * HOURS,
  },
  {
    author: 'Ava',
    text: 'Every morning is a soft reset.',
    kind: 'circle',
    offset: 8 * HOURS,
  },
  {
    author: 'Eli',
    text: 'Silence is a tool, not a void.',
    kind: 'signal',
    offset: 24 * HOURS,
  },
  {
    author: 'Noah',
    text: 'Small conversations are where meaning hides.',
    kind: 'circle',
    offset: 48 * HOURS,
  },
  {
    author: 'You',
    text: 'Pausing to notice who I miss.',
    kind: 'circle',
    offset: 3 * HOURS,
  },
  {
    author: 'You',
    text: 'Letting signals be invitations, not interruptions.',
    kind: 'signal',
    offset: 12 * HOURS,
  },
]

const createSeedState = (): HavenState => {
  const now = Date.now()

  const traces: Trace[] = SEED_TRACES_TEMPLATE.map((template, index) => {
    const reflections: Reflection[] =
      template.reflections?.map((reflection, reflectionIndex) => ({
        id: `seed-reflection-${index}-${reflectionIndex}`,
        author: reflection.author,
        text: reflection.text,
        createdAt: now - reflection.offset,
      })) ?? []

    return {
      id: `seed-trace-${index}`,
      author: template.author,
      text: template.text,
      kind: template.kind,
      createdAt: now - template.offset,
      reflections,
    }
  })

  return {
    traces,
    connections: {},
  }
}

const OTHER_PROFILES = {
  Lena: {
    name: 'Lena',
    handle: '@lena',
    bio: 'photographer of quiet things',
    signalFollowers: 128,
    gradientFrom: 'from-rose-400/30',
    gradientTo: 'to-amber-400/30',
  },
  Milo: {
    name: 'Milo',
    handle: '@milo',
    bio: 'designer of invisible systems',
    signalFollowers: 204,
    gradientFrom: 'from-sky-400/30',
    gradientTo: 'to-purple-500/30',
  },
  Ava: {
    name: 'Ava',
    handle: '@ava',
    bio: 'writer and listener',
    signalFollowers: 176,
    gradientFrom: 'from-violet-400/30',
    gradientTo: 'to-blue-500/30',
  },
  Eli: {
    name: 'Eli',
    handle: '@eli',
    bio: 'sound engineer of silent rooms',
    signalFollowers: 96,
    gradientFrom: 'from-emerald-400/30',
    gradientTo: 'to-teal-400/30',
  },
  Noah: {
    name: 'Noah',
    handle: '@noah',
    bio: 'curating small, steady communities',
    signalFollowers: 143,
    gradientFrom: 'from-amber-400/30',
    gradientTo: 'to-emerald-400/30',
  },
} as const

const ME: User = {
  name: 'You',
  handle: '@you',
  bio: 'learning to slow down',
  circles: 42,
  signals: 8,
}

const HavenMinimal = () => {
  const [state, setState] = useState<HavenState>(() => loadState(createSeedState()))
  const [mode, setMode] = useState<Mode>('circles')
  const [viewUser, setViewUser] = useState<string | null>(null)
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [draftKind, setDraftKind] = useState<TraceType>('circle')
  const [returnMode, setReturnMode] = useState<Mode>('circles')
  const [reflectionDraft, setReflectionDraft] = useState('')
  const [selfProfileKind, setSelfProfileKind] = useState<TraceType>('circle')
  const [otherProfileKind, setOtherProfileKind] = useState<TraceType>('signal')
  const minuteTicker = useMinuteTicker()

  const sortedTraces = useMemo(
    () => [...state.traces].sort((a, b) => b.createdAt - a.createdAt),
    [state.traces],
  )

  const filterForMode = useCallback(
    (currentMode: Mode) => {
      if (currentMode === 'signals') {
        return sortedTraces.filter((trace) => trace.kind === 'signal')
      }
      if (currentMode === 'circles') {
        return sortedTraces.filter((trace) => trace.kind === 'circle')
      }
      return sortedTraces
    },
    [sortedTraces],
  )

  const feedTraces = useMemo(() => filterForMode(mode), [mode, filterForMode])

  const formatTime = useCallback(
    (createdAt: number) => {
      void minuteTicker
      return timeAgo(createdAt)
    },
    [minuteTicker],
  )

  useEffect(() => {
    const handle = window.setTimeout(() => saveState(state), 280)
    return () => window.clearTimeout(handle)
  }, [state])

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'c' && !composerOpen) {
        const target = event.target as HTMLElement | null
        if (
          target?.tagName === 'INPUT' ||
          target?.tagName === 'TEXTAREA' ||
          target?.tagName === 'SELECT' ||
          target?.isContentEditable
        ) {
          return
        }
        event.preventDefault()
        setComposerOpen(true)
        setDraft('')
        setDraftKind(mode === 'signals' ? 'signal' : 'circle')
      }

      if (event.key === 'Escape' && composerOpen) {
        setComposerOpen(false)
      }
    }

    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [composerOpen, mode])

  const handleCreateTrace = () => {
    if (!draft.trim()) return

    const newTrace: Trace = {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `trace-${Date.now()}`,
      author: ME.name,
      text: draft.trim(),
      kind: draftKind,
      createdAt: Date.now(),
      reflections: [],
    }

    setState((prev) => ({
      ...prev,
      traces: [newTrace, ...prev.traces],
    }))
    setDraft('')
    setComposerOpen(false)
    if (draftKind === 'signal') {
      setMode('signals')
    } else {
      setMode('circles')
    }
  }

  const handleResonate = (traceId: string) => {
    setState((prev) => ({
      ...prev,
      traces: prev.traces.map((trace) =>
        trace.id === traceId
          ? {
              ...trace,
              resonates: !(trace.resonates ?? false),
            }
          : trace,
      ),
    }))
  }

  const openTraceDetail = (traceId: string) => {
    setReturnMode(mode === 'trace' ? returnMode : mode)
    setSelectedTraceId(traceId)
    setMode('trace')
    setReflectionDraft('')
  }

  const openAuthorProfile = (author: string) => {
    if (author === ME.name) {
      setMode('profile')
      setViewUser(null)
      setSelfProfileKind('circle')
      return
    }

    setReturnMode(mode)
    setViewUser(author)
    setMode('user')
  }

  const addReflection = (traceId: string) => {
    if (!reflectionDraft.trim()) return

    const newReflection: Reflection = {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `reflection-${Date.now()}`,
      author: ME.name,
      text: reflectionDraft.trim(),
      createdAt: Date.now(),
    }

    setState((prev) => ({
      ...prev,
      traces: prev.traces.map((trace) =>
        trace.id === traceId
          ? {
              ...trace,
              reflections: [...(trace.reflections ?? []), newReflection],
            }
          : trace,
      ),
    }))
    setReflectionDraft('')
  }

  const selectedTrace = selectedTraceId
    ? state.traces.find((trace) => trace.id === selectedTraceId) ?? null
    : null

  const otherProfileData =
    viewUser && viewUser in OTHER_PROFILES ? OTHER_PROFILES[viewUser as keyof typeof OTHER_PROFILES] : null

  const otherUserTraces = useMemo(() => {
    if (!viewUser) {
      return []
    }
    return sortedTraces.filter((trace) => trace.author === viewUser)
  }, [sortedTraces, viewUser])

  const handleBack = () => {
    const destination = returnMode
    setMode(destination)
    if (destination !== 'user') {
      setViewUser(null)
    }
    setSelectedTraceId(null)
    setReturnMode('circles')
  }

  const toggleConnection = () => {
    if (!viewUser) return
    setState((prev) => ({
      ...prev,
      connections: {
        ...prev.connections,
        [viewUser]: !prev.connections[viewUser],
      },
    }))
  }

  // Default profile tab for other users depends on connection
  useEffect(() => {
    if (mode === 'user' && viewUser) {
      const connected = !!state.connections[viewUser]
      setOtherProfileKind(connected ? 'circle' : 'signal')
    }
  }, [mode, viewUser, state.connections])

  const resetDemoData = () => {
    clearState()
    setState(createSeedState())
  }

  const canGoBack = mode === 'user' || mode === 'trace'

  const footerAction =
    mode === 'profile'
      ? {
          label: 'Reset demo data',
          action: resetDemoData,
        }
      : null

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 font-sans text-neutral-100">
      <TopBar
        mode={mode}
        onBack={handleBack}
        canGoBack={canGoBack}
        onSelectTab={(tab) => {
          setMode(tab)
          setViewUser(null)
          setSelectedTraceId(null)
        }}
        onOpenComposer={() => setComposerOpen(true)}
        title={mode === 'user' ? viewUser : mode === 'trace' ? 'Trace' : undefined}
      />

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {mode === 'circles' && (
            <motion.div
              key="circles"
              initial={pageVariants.initial}
              animate={pageVariants.animate}
              exit={pageVariants.exit}
            >
            <Feed
              traces={feedTraces}
              onResonate={handleResonate}
              onReflect={openTraceDetail}
              onOpenProfile={openAuthorProfile}
              formatTime={formatTime}
              emptyMessage="Your circles are quiet for now."
            />
          </motion.div>
        )}

        {mode === 'signals' && (
          <motion.div
            key="signals"
            initial={pageVariants.initial}
            animate={pageVariants.animate}
            exit={pageVariants.exit}
          >
            <Feed
              traces={feedTraces}
              onResonate={handleResonate}
              onReflect={openTraceDetail}
              onOpenProfile={openAuthorProfile}
              formatTime={formatTime}
              emptyMessage="Signals will appear as the world speaks up."
            />
          </motion.div>
        )}

        {mode === 'profile' && (
          <motion.div
            key="profile"
            initial={pageVariants.initial}
            animate={pageVariants.animate}
            exit={pageVariants.exit}
          >
            <div className="mx-auto w-full max-w-xl space-y-8 px-4 py-10">
              <ProfileHeader
                name={ME.name}
                handle={ME.handle}
                bio={ME.bio}
                variant="self"
                circles={ME.circles}
                signals={ME.signals}
              />
              <div className="flex justify-center">
                <ProfileSwitcher
                  current={selfProfileKind}
                  onChange={setSelfProfileKind}
                />
              </div>
              <section className="space-y-4">
                {sortedTraces
                  .filter((trace) => trace.author === ME.name)
                  .filter((trace) => trace.kind === selfProfileKind)
                  .map((trace) => (
                    <TraceCard
                      key={trace.id}
                      trace={trace}
                      timeLabel={formatTime(trace.createdAt)}
                      onResonate={handleResonate}
                      onReflect={openTraceDetail}
                      onOpenProfile={openAuthorProfile}
                    />
                  ))}
                {sortedTraces.filter((trace) => trace.author === ME.name && trace.kind === selfProfileKind).length === 0 && (
                  <EmptyState message="Your traces will live here when you share them." />
                )}
              </section>
            </div>
          </motion.div>
        )}

        {mode === 'user' && otherProfileData && (
          <motion.div
            key={`user-${otherProfileData.name}`}
            initial={pageVariants.initial}
            animate={pageVariants.animate}
            exit={pageVariants.exit}
          >
            <UserProfile
              profile={otherProfileData}
              traces={otherUserTraces}
              connected={!!state.connections[otherProfileData.name]}
              onConnectToggle={toggleConnection}
              onResonate={handleResonate}
              onReflect={openTraceDetail}
              onOpenProfile={openAuthorProfile}
              formatTime={formatTime}
              filterKind={otherProfileKind}
              onChangeFilter={setOtherProfileKind}
            />
          </motion.div>
        )}

        {mode === 'trace' && selectedTrace && (
          <motion.div
            key={`trace-${selectedTrace.id}`}
            initial={pageVariants.initial}
            animate={pageVariants.animate}
            exit={pageVariants.exit}
          >
            <div className="mx-auto w-full max-w-xl space-y-6 px-4 py-10">
              <TraceCard
                trace={selectedTrace}
                timeLabel={formatTime(selectedTrace.createdAt)}
                onResonate={handleResonate}
                onReflect={() => undefined}
                onOpenProfile={openAuthorProfile}
                hideReflect
              />
              <section className="space-y-4">
                <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-400">
                  Reflections
                </h3>
                <div className="space-y-3">
                  {(selectedTrace.reflections ?? []).length === 0 && (
                    <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-neutral-400">
                      No reflections yet. Leave the first one.
                    </div>
                  )}
                  {(selectedTrace.reflections ?? []).map((reflection) => (
                    <div
                      key={reflection.id}
                      className="rounded-xl border border-white/5 bg-neutral-950/60 p-3 pl-4"
                    >
                      <div className="mb-1 flex items-center justify-between text-xs text-neutral-500">
                        <button
                          onClick={() => openAuthorProfile(reflection.author)}
                          className="text-neutral-300 transition hover:underline"
                        >
                          {reflection.author}
                        </button>
                        <span>{formatTime(reflection.createdAt)}</span>
                      </div>
                      <p className="border-l border-white/10 pl-3 text-sm leading-relaxed text-neutral-200">
                        {reflection.text}
                      </p>
                    </div>
                  ))}
                </div>
                <form
                  className="space-y-3 rounded-xl border border-white/10 bg-neutral-950/70 p-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    addReflection(selectedTrace.id)
                  }}
                >
                  <label className="block text-sm text-neutral-400" htmlFor="reflection-input">
                    Reflect softly
                  </label>
                  <textarea
                    id="reflection-input"
                    value={reflectionDraft}
                    onChange={(event) => setReflectionDraft(event.target.value)}
                    placeholder="Add to the conversation…"
                    className="h-24 w-full resize-none rounded-lg border border-white/10 bg-neutral-950 p-3 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="rounded-md bg-white px-4 py-1.5 text-sm font-medium text-neutral-950 transition hover:bg-white/80"
                    >
                      Post reflection
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {composerOpen && (
          <ComposerModal
            isOpen={composerOpen}
            draft={draft}
            kind={draftKind}
            onDraftChange={setDraft}
            onKindChange={setDraftKind}
            onClose={() => setComposerOpen(false)}
            onPost={handleCreateTrace}
          />
        )}
      </AnimatePresence>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-neutral-600">
        Haven · v3 prototype
        {footerAction && (
          <button
            onClick={footerAction.action}
            className="ml-4 inline-flex items-center rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-neutral-200 transition hover:border-white/20 hover:text-white"
          >
            {footerAction.label}
          </button>
        )}
      </footer>
    </div>
  )
}

export default HavenMinimal
