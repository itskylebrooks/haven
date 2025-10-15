import { Fragment, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { db } from '../../../db/dexie'
import { usernameToAuthorName } from '../../../db/api'
import type { TraceType } from '../../../lib/types'
import type { DBTrace, DBUser } from '../../../db/types'

type SearchPageProps = {
  meUsername: string
  friends: string[]
  following: string[]
  onOpenProfile: (identifier: string) => void
  onOpenTrace: (traceId: string) => void
  formatTime: (timestamp: number) => string
}

type ProfileResult = {
  id: string
  name: string
  handle: string
  bio?: string
}

type TraceResult = {
  id: string
  text: string
  authorUsername: string
  authorName: string
  createdAt: number
  kind: TraceType
}

type SearchResults = {
  profiles: ProfileResult[]
  circles: TraceResult[]
  friendSignals: TraceResult[]
  globalSignals: TraceResult[]
}

const createEmptyResults = (): SearchResults => ({
  profiles: [],
  circles: [],
  friendSignals: [],
  globalSignals: [],
})

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const includesFuzzy = (value: string, query: string): boolean => {
  if (!value) return false
  const lower = value.toLowerCase()
  if (lower.includes(query)) return true
  return lower.split(/\s+/).some((word) => word.startsWith(query))
}

const computeScore = (value: string, normalizedQuery: string): number => {
  if (!value) return Number.POSITIVE_INFINITY
  const lower = value.toLowerCase()
  const directIndex = lower.indexOf(normalizedQuery)
  if (directIndex >= 0) return directIndex
  const words = lower.split(/\s+/)
  for (let i = 0; i < words.length; i += 1) {
    if (words[i].startsWith(normalizedQuery)) return 200 + i
  }
  return 1000
}

const highlightMatches = (value: string, rawQuery: string, normalizedQuery: string) => {
  if (!rawQuery.trim()) return value
  const pattern = new RegExp(`(${escapeRegExp(rawQuery.trim())})`, 'ig')
  return value.split(pattern).map((segment, index) => {
    if (!segment.length) {
      return <Fragment key={`empty-${index}`} />
    }
    if (segment.toLowerCase() === normalizedQuery) {
      return (
        <span key={`match-${index}`} className="text-[var(--accent-color)]">
          {segment}
        </span>
      )
    }
    return (
      <Fragment key={`part-${index}`}>
        {segment}
      </Fragment>
    )
  })
}

const SearchPage = ({
  meUsername,
  friends,
  following,
  onOpenProfile,
  onOpenTrace,
  formatTime,
}: SearchPageProps) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>(() => createEmptyResults())
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [scope, setScope] = useState<'profiles' | 'circles' | 'friend-signals' | 'global-signals'>('profiles')

  const normalizedMe = useMemo(() => meUsername.toLowerCase(), [meUsername])
  const normalizedQuery = query.trim().toLowerCase()
  const hasQuery = normalizedQuery.length > 0

  useEffect(() => {
    if (!normalizedQuery) {
      setResults(createEmptyResults())
      setStatus('idle')
      return
    }
    setStatus('loading')
    let cancelled = false

    const timeout = window.setTimeout(() => {
      ;(async () => {
        const next = createEmptyResults()
        const friendSet = new Set(friends.map((f) => f.toLowerCase()))
        const followingSet = new Set(following.map((f) => f.toLowerCase()))

        const circleAuthors = new Set(friendSet)
        circleAuthors.add(normalizedMe)

        const closeSignalAuthors = new Set(circleAuthors)
        followingSet.forEach((id) => closeSignalAuthors.add(id))

        const profileMatches = await (async () => {
          try {
            return await db.users
              .filter((user: DBUser) => (user.visibility ?? 'public') === 'public' && (
                includesFuzzy(user.name ?? user.id, normalizedQuery) ||
                includesFuzzy(user.handle ?? `@${user.id}`, normalizedQuery) ||
                includesFuzzy(user.bio ?? '', normalizedQuery) ||
                includesFuzzy(user.id, normalizedQuery)
              ))
              .toArray()
          } catch {
            const fallback = await db.users.toArray()
            return fallback.filter(
              (user) =>
                (user.visibility ?? 'public') === 'public' &&
                (
                  includesFuzzy(user.name ?? user.id, normalizedQuery) ||
                  includesFuzzy(user.handle ?? `@${user.id}`, normalizedQuery) ||
                  includesFuzzy(user.bio ?? '', normalizedQuery) ||
                  includesFuzzy(user.id, normalizedQuery)
                ),
            )
          }
        })()

        next.profiles = profileMatches
          .map((user) => {
            const name = user.name || user.id
            const handle = user.handle ?? `@${user.id}`
            const score = Math.min(
              computeScore(name, normalizedQuery),
              computeScore(handle, normalizedQuery),
              computeScore(user.bio ?? '', normalizedQuery),
              computeScore(user.id, normalizedQuery),
            )
            return { id: user.id, name, handle, bio: user.bio, score }
          })
          .sort((a, b) => {
            if (a.score !== b.score) return a.score - b.score
            return a.name.localeCompare(b.name)
          })
          .slice(0, 8)
          .map(({ score, ...rest }) => rest)

        const traceMatches = await (async () => {
          try {
            return await db.traces
              .filter((trace: DBTrace) => includesFuzzy(trace.text, normalizedQuery))
              .toArray()
          } catch {
            const fallback = await db.traces.toArray()
            return fallback.filter((trace) => includesFuzzy(trace.text, normalizedQuery))
          }
        })()

        const allTraceResults = traceMatches
          .map((trace) => ({
            id: trace.id,
            text: trace.text,
            authorUsername: trace.author,
            authorName: usernameToAuthorName(trace.author) ?? trace.author,
            createdAt: trace.createdAt,
            kind: trace.kind,
            score: computeScore(trace.text, normalizedQuery),
          }))
          .sort((a, b) => {
            if (a.score !== b.score) return a.score - b.score
            return b.createdAt - a.createdAt
          })

        next.circles = allTraceResults
          .filter(
            (trace) =>
              trace.kind === 'circle' &&
              circleAuthors.has(trace.authorUsername.toLowerCase()),
          )
          .slice(0, 12)
          .map(({ score, ...rest }) => rest)

        const friendSignalResults = allTraceResults
          .filter(
            (trace) =>
              trace.kind === 'signal' &&
              closeSignalAuthors.has(trace.authorUsername.toLowerCase()),
          )
          .slice(0, 12)
          .map(({ score, ...rest }) => rest)

        next.friendSignals = friendSignalResults

        const friendSignalIds = new Set(friendSignalResults.map((trace) => trace.id))

        next.globalSignals = allTraceResults
          .filter(
            (trace) =>
              trace.kind === 'signal' &&
              !friendSignalIds.has(trace.id),
          )
          .slice(0, 12)
          .map(({ score, ...rest }) => rest)

        if (!cancelled) {
          setResults(next)
          setStatus('done')
        }
      })().catch((error) => {
        if (!cancelled) {
          console.error('Search failed', error)
          setResults(createEmptyResults())
          setStatus('done')
        }
      })
    }, 140)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [friends, following, normalizedMe, normalizedQuery])

  const hasAnyResults =
    results.profiles.length > 0 ||
    results.circles.length > 0 ||
    results.friendSignals.length > 0 ||
    results.globalSignals.length > 0

  const renderTraceResult = (trace: TraceResult, variant: 'circle' | 'friend-signal' | 'global-signal') => {
    const label =
      trace.kind === 'circle'
        ? 'Circle'
        : variant === 'friend-signal'
          ? 'Signal · you & friends'
          : 'Signal · everyone'
    return (
      <motion.button
        key={trace.id}
        type="button"
        onClick={() => onOpenTrace(trace.id)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        whileTap={{ scale: 0.98 }}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-[var(--accent-color)]/70 hover:bg-white/[0.08] focus-visible:border-[var(--accent-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]/40"
      >
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-neutral-500">
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-[var(--accent-color)]/30 bg-[hsl(var(--accent-hsl)_/_0.14)] px-2.5 py-0.5 font-semibold text-[var(--accent-color)]">
              {label}
            </span>
            <span>{formatTime(trace.createdAt)}</span>
          </span>
          <span className="inline-flex gap-1 text-neutral-400">
            <span>{trace.authorName}</span>
            <span className="text-neutral-500">{`@${trace.authorUsername}`}</span>
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-neutral-100">
          {highlightMatches(trace.text, query, normalizedQuery)}
        </p>
      </motion.button>
    )
  }

  const renderProfileResult = (profile: ProfileResult) => (
    <motion.button
      key={profile.id}
      type="button"
      onClick={() => onOpenProfile(profile.id)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.98 }}
      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-[var(--accent-color)]/70 hover:bg-white/[0.08] focus-visible:border-[var(--accent-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]/40"
    >
      <div className="flex items-center justify-between text-sm text-neutral-200">
        <span className="font-medium text-white">
          {highlightMatches(profile.name, query, normalizedQuery)}
        </span>
        <span className="text-sm text-neutral-400">{highlightMatches(profile.handle, query, normalizedQuery)}</span>
      </div>
      {profile.bio && (
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">
          {highlightMatches(profile.bio, query, normalizedQuery)}
        </p>
      )}
    </motion.button>
  )

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <div className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <label className="block text-sm font-medium text-neutral-200">Search</label>
        <p className="mt-1 text-sm text-neutral-500">Find friends, revisit circles, or surface signals that resonated.</p>
        <div className="relative mt-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Profiles, circles, signals..."
            className="w-full rounded-2xl border border-white/10 bg-black pl-8 pr-11 py-3 text-base text-white placeholder:text-neutral-500 transition focus:border-[var(--accent-color)] outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/[0.06] text-neutral-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]/40"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>
          )}
        </div>

        <div className="mt-4 flex rounded-full bg-white/5 p-1 text-xs font-medium">
          {([
            { key: 'profiles', label: 'Profiles', count: results.profiles.length },
            { key: 'circles', label: 'Circles', count: results.circles.length },
            { key: 'friend-signals', label: 'Signals', count: results.friendSignals.length },
            { key: 'global-signals', label: 'Global', count: results.globalSignals.length },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setScope(tab.key)}
              className={`flex-1 rounded-full px-3 py-1 transition border ${
                scope === tab.key ? 'border-white text-white' : 'border-transparent text-neutral-300 hover:bg-white/10'
              }`}
            >
              <span className="inline-flex items-center justify-center gap-1">
                {tab.label}
                {query && tab.count > 0 && (
                  <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-[hsl(var(--accent-hsl)_/_0.25)] px-1 text-[11px] font-semibold text-[var(--accent-color)]">
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
        {status === 'loading' && (
          <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-neutral-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent-color)]" />
            Seaching…
          </div>
        )}

        {!hasQuery && null}

        {hasQuery && status !== 'loading' && !hasAnyResults && null}

        {hasQuery && (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={scope}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
              className="mt-6"
            >
              {scope === 'profiles' && (
                results.profiles.length ? (
                  <motion.div layout className="grid gap-3">
                    <AnimatePresence>
                      {results.profiles.map((p) => (
                        <motion.div
                          key={p.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
                          exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
                        >
                          {renderProfileResult(p)}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : null
              )}
              {scope === 'circles' && (
                results.circles.length ? (
                  <motion.div layout className="grid gap-3">
                    <AnimatePresence>
                      {results.circles.map((t) => (
                        <motion.div
                          key={t.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
                          exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
                        >
                          {renderTraceResult(t, 'circle')}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : null
              )}
              {scope === 'friend-signals' && (
                results.friendSignals.length ? (
                  <motion.div layout className="grid gap-3">
                    <AnimatePresence>
                      {results.friendSignals.map((t) => (
                        <motion.div
                          key={t.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
                          exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
                        >
                          {renderTraceResult(t, 'friend-signal')}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : null
              )}
              {scope === 'global-signals' && (
                results.globalSignals.length ? (
                  <motion.div layout className="grid gap-3">
                    <AnimatePresence>
                      {results.globalSignals.map((t) => (
                        <motion.div
                          key={t.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
                          exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
                        >
                          {renderTraceResult(t, 'global-signal')}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : null
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

export default SearchPage
