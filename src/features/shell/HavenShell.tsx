import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TopBar from '../navigation/components/TopBar'
import Feed from '../feed/components/Feed'
import ComposerModal from '../composer/components/ComposerModal'
import UserProfile from '../profile/components/UserProfile'
import ProfileHeader from '../profile/components/ProfileHeader'
import TraceCard from '../feed/components/TraceCard'
import EmptyState from '../feed/components/EmptyState'
import ProfileSwitcher from '../profile/components/ProfileSwitcher'
import EditProfileModal from '../profile/components/EditProfileModal'
import PeopleListModal from '../people/components/PeopleListModal'
import type { HavenState, Mode, Reflection, Trace, TraceType, ComposerKind } from '../../lib/types'
import { timeAgo, useMinuteTicker } from '../../lib/time'
import { pageVariants } from '../../lib/animation'
import {
  initDB,
  getStateForUser,
  addTrace as dbAddTrace,
  addReflection as dbAddReflection,
  deleteReflection as dbDeleteReflection,
  toggleResonate as dbToggleResonate,
  setConnection as dbSetConnection,
  setSubscription as dbSetSubscription,
  saveDraft as dbSaveDraft,
  loadDraft as dbLoadDraft,
  usernameToAuthorName,
  deleteTrace as dbDeleteTrace,
  listFriends,
  removeFriend,
  listFollowers,
  removeFollower,
  listFollowing,
  changeUsername,
  authorToUsername,
  refreshAuthorNameMap,
} from '../../db/api'

// Hardcoded seeds removed in favor of DB

const HavenShell = () => {
  const [state, setState] = useState<HavenState>({ traces: [], connections: {}, connectedBy: {}, following: {} })
  // Initialize mode from current pathname to avoid flash where "Circles" briefly appears
  const initialPath = typeof window !== 'undefined' ? window.location.pathname : '/circles'
  const guessInitialMode = (path: string): Mode => {
    const parts = path.replace(/^\/+/, '').split('/')
    if (parts[0] === '' || parts[0] === 'circles') return 'circles'
    if (parts[0] === 'signals') return 'signals'
    if (parts.length === 1) return parts[0] === '' ? 'circles' : 'user'
    return 'trace'
  }
  const [mode, setMode] = useState<Mode>(() => guessInitialMode(initialPath))
  // viewUser stores a username when viewing other user
  const [viewUser, setViewUser] = useState<string | null>(null)
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [draftKind, setDraftKind] = useState<ComposerKind>('circle')
  const [draftImage, setDraftImage] = useState<string | null>(null)
  const [returnMode, setReturnMode] = useState<Mode>('circles')
  const [reflectionDraft, setReflectionDraft] = useState('')
  const reflectionInputRef = useRef<HTMLTextAreaElement | null>(null)
  const maxReflectionLen = 512

  useEffect(() => {
    const el = reflectionInputRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = Math.min(200, el.scrollHeight) + 'px'
  }, [reflectionDraft])
  const [selfProfileKind, setSelfProfileKind] = useState<TraceType>('circle')
  const [otherProfileKind, setOtherProfileKind] = useState<TraceType>('signal')
  // removed edit state
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [peopleModal, setPeopleModal] = useState<{
    open: boolean
    title: string
    list: { id: string; name: string; handle: string }[]
    kind: 'friends' | 'followers' | 'creators'
  }>({ open: false, title: '', list: [], kind: 'friends' })
  const minuteTicker = useMinuteTicker()
  const [meUser, setMeUser] = useState<{ name: string; handle: string; bio?: string; avatar?: string | null; circles?: number; signals?: number } | null>(null)
  const [otherUser, setOtherUser] = useState<{ name: string; handle: string; bio?: string; avatar?: string | null; signalFollowers?: number } | null>(null)
  const [meUsername, setMeUsername] = useState('itskylebrooks')
  const currentDisplayName = meUser?.name ?? usernameToAuthorName(meUsername) ?? meUsername
  const normalizedMeUsername = meUsername.toLowerCase()

  const pathFor = useCallback(
    (m: Mode, opts?: { user?: string; traceId?: string }) => {
      switch (m) {
        case 'circles':
          return '/circles'
        case 'signals':
          return '/signals'
        case 'profile':
          return `/${meUsername}`
        case 'user':
          return `/${(opts?.user ?? '').toLowerCase()}`
        case 'trace':
          return `/${(opts?.user ?? '').toLowerCase()}/${opts?.traceId ?? ''}`
      }
    },
    [meUsername],
  )

  const applyRoute = useCallback(
    (pathname: string) => {
      const parts = pathname.replace(/^\/+/, '').split('/')
      if (parts[0] === '' || parts[0] === 'circles') {
        setMode('circles')
        setViewUser(null)
        setSelectedTraceId(null)
        return
      }
      if (parts[0] === 'signals') {
        setMode('signals')
        setViewUser(null)
        setSelectedTraceId(null)
        return
      }

      const username = decodeURIComponent(parts[0])
      if (parts.length === 1) {
        if (username.toLowerCase() === meUsername) {
          setMode('profile')
          setViewUser(null)
          setSelectedTraceId(null)
          setSelfProfileKind('circle')
        } else {
          setMode('user')
          setViewUser(username.toLowerCase())
          setSelectedTraceId(null)
        }
        return
      }

      if (parts.length >= 2) {
        const id = parts[1]
        const normalizedUsername = username.toLowerCase()
        setSelectedTraceId(id)
        setViewUser(normalizedUsername === meUsername ? null : normalizedUsername)
        setMode('trace')
        return
      }
    },
    [meUsername],
  )

  const navigate = useCallback(
    (path: string) => {
      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path)
        applyRoute(path)
      }
    },
    [applyRoute],
  )

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

  const feedTraces = useMemo(() => {
    const normalizedMe = meUsername.toLowerCase()
    let list = filterForMode(mode)
    // In Circles, only show posts from people with mutual connection
    if (mode === 'circles') {
      list = list.filter((trace) => {
        const authorUsername = trace.authorUsername?.toLowerCase()
        if (!authorUsername) return false
        return Boolean(state.connections[authorUsername] && (state.connectedBy?.[authorUsername] ?? false))
      })
    }
    // In Signals, only show posts from creators I follow
    if (mode === 'signals') {
      list = list.filter((trace) => {
        const authorUsername = trace.authorUsername?.toLowerCase()
        if (!authorUsername) return false
        return Boolean(state.following?.[authorUsername])
      })
    }
    // Hide current user's own posts from the general feed (they appear on the profile page)
    if (mode !== 'profile') {
      list = list.filter((trace) => trace.authorUsername?.toLowerCase() !== normalizedMe)
    }
    // No fallback; if empty, show empty state per mode
    return list
  }, [mode, filterForMode, state.traces, state.connections, state.connectedBy, state.following, meUsername])

  const formatTime = useCallback(
    (createdAt: number) => {
      void minuteTicker
      return timeAgo(createdAt)
    },
    [minuteTicker],
  )

  useEffect(() => {
    ;(async () => {
      await initDB()
      // determine current user from settings if present
      try {
        const { getSetting } = await import('../../db/api')
        const current = (await getSetting<string>('currentUser')) ?? meUsername
        setMeUsername(current)
        const snapshot = await getStateForUser(current)
        setState(snapshot)
      } catch {
        const snapshot = await getStateForUser(meUsername)
        setState(snapshot)
      }
      // load me user
      const { db } = await import('../../db/dexie')
      const me = await db.users.get(meUsername)
      if (me) {
        // Compute actual counts
        const friendsCount = await db.connections.where('fromUser').equals(meUsername).count()
        const followersCount = await db.subscriptions.where('followee').equals(meUsername).count()
        setMeUser({
          name: usernameToAuthorName(me.id),
          handle: me.handle,
          bio: me.bio,
          avatar: me.avatar ?? null,
          circles: friendsCount,
          signals: followersCount,
        })
      }
      // load composer draft
      const draftDoc = await dbLoadDraft('composer')
      if (draftDoc) {
        setDraft(draftDoc.text)
        setDraftKind(draftDoc.kind)
      }
    })()
  }, [])

  // Init + back/forward routing
  useEffect(() => {
    // Ensure the in-memory mode matches the URL on mount without triggering a visible tab change
    const current = window.location.pathname
    if (current === '/' || current === '') {
      window.history.replaceState({}, '', '/circles')
      applyRoute('/circles')
    } else {
      // applyRoute will set the correct mode/view synchronously
      applyRoute(current)
    }

    const onPop = () => applyRoute(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [applyRoute])
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

  // Save draft to DB
  useEffect(() => {
    if (!composerOpen) return
    const id = window.setTimeout(() => {
      dbSaveDraft('composer', draft, (draftKind === 'both' ? 'signal' : draftKind))
    }, 300)
    return () => window.clearTimeout(id)
  }, [composerOpen, draft, draftKind])

  const randomId12 = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let out = ''
    for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)]
    return out
  }

  const handleCreateTrace = () => {
    if (!draft.trim()) return

    const authorUsername = meUsername
    const authorName = currentDisplayName
    const base = {
      author: authorName,
      authorUsername,
      text: draft.trim(),
      createdAt: Date.now(),
      reflections: [] as Reflection[],
      image: draftImage ?? undefined,
    }

    if (draftKind === 'both') {
      const tCircle: Trace = { id: randomId12(), kind: 'circle', ...base }
      const tSignal: Trace = { id: randomId12(), kind: 'signal', ...base }
      setState((prev) => ({ ...prev, traces: [tCircle, tSignal, ...prev.traces] }))
      dbAddTrace(authorUsername, tCircle.text, tCircle.kind, tCircle.createdAt, tCircle.id, tCircle.image)
      dbAddTrace(authorUsername, tSignal.text, tSignal.kind, tSignal.createdAt, tSignal.id, tSignal.image)
    } else {
      const newTrace: Trace = { id: randomId12(), kind: draftKind, ...base }
      setState((prev) => ({ ...prev, traces: [newTrace, ...prev.traces] }))
      dbAddTrace(authorUsername, newTrace.text, newTrace.kind, newTrace.createdAt, newTrace.id, newTrace.image)
    }
    setDraft('')
    setDraftImage(null)
    setComposerOpen(false)
  }

  const handleResonate = async (traceId: string) => {
    const on = await dbToggleResonate(traceId, meUsername)
    setState((prev) => ({
      ...prev,
      traces: prev.traces.map((trace) =>
        trace.id === traceId ? { ...trace, resonates: on } : trace,
      ),
    }))
  }

  const openTraceDetail = (traceId: string) => {
    setReturnMode(mode === 'trace' ? returnMode : mode)
    setSelectedTraceId(traceId)
    setMode('trace')
    setReflectionDraft('')
    const t = state.traces.find((x) => x.id === traceId)
    if (t) {
      navigate(pathFor('trace', { user: t.authorUsername ?? meUsername, traceId }))
    }
  }

  // Post editing removed; only deletion is allowed

  const openAuthorProfile = (identifier: string) => {
    const normalizedMe = meUsername.toLowerCase()
    const trimmed = identifier.trim()
    const lower = trimmed.toLowerCase()
    const match = state.traces.find(
      (trace) =>
        trace.authorUsername?.toLowerCase() === lower ||
        trace.author.toLowerCase() === lower,
    )
    const resolvedUsername =
      match?.authorUsername ??
      (trimmed === meUser?.name ? meUsername : authorToUsername(trimmed))

    if (resolvedUsername.toLowerCase() === normalizedMe) {
      setMode('profile')
      setViewUser(null)
      setSelfProfileKind('circle')
      navigate(pathFor('profile'))
      return
    }

    setReturnMode(mode)
    setViewUser(resolvedUsername.toLowerCase())
    setMode('user')
    navigate(pathFor('user', { user: resolvedUsername }))
  }

  const addReflection = (traceId: string) => {
    if (!reflectionDraft.trim()) return

    const reflectionAuthor = meUser?.name ?? usernameToAuthorName(meUsername) ?? meUsername
    const newReflection: Reflection = {
      id: randomId12(),
      author: reflectionAuthor,
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
    dbAddReflection(traceId, meUsername, newReflection.text, newReflection.createdAt, newReflection.id)
    setReflectionDraft('')
  }

  const deleteReflection = (traceId: string, reflectionId: string) => {
    setState((prev) => ({
      ...prev,
      traces: prev.traces.map((trace) =>
        trace.id === traceId
          ? { ...trace, reflections: (trace.reflections ?? []).filter(r => r.id !== reflectionId) }
          : trace,
      ),
    }))
    dbDeleteReflection(reflectionId)
  }

  const startReply = (author: string) => {
    const prefix = `@${author} `
    if (!reflectionDraft.startsWith(prefix)) setReflectionDraft(prefix)
    setTimeout(() => reflectionInputRef.current?.focus(), 0)
  }

  const selectedTrace = selectedTraceId
    ? state.traces.find((trace) => trace.id === selectedTraceId) ?? null
    : null

  const otherUserTraces = useMemo(() => {
    if (!viewUser) return []
    const normalized = viewUser.toLowerCase()
    return sortedTraces.filter((trace) => trace.authorUsername?.toLowerCase() === normalized)
  }, [sortedTraces, viewUser])

  // Load other user's profile when viewUser changes
  useEffect(() => {
    ;(async () => {
      if (!viewUser) {
        setOtherUser(null)
        return
      }
      const { db } = await import('../../db/dexie')
      const u = await db.users.get(viewUser.toLowerCase())
      if (u) {
        const followersCount = await db.subscriptions.where('followee').equals(viewUser.toLowerCase()).count()
        setOtherUser({ name: u.name, handle: u.handle, bio: u.bio, avatar: u.avatar ?? null, signalFollowers: followersCount })
      } else setOtherUser(null)
    })()
  }, [viewUser])

  const handleBack = () => {
    window.history.back()
  }

  const toggleConnection = async () => {
    if (!viewUser) return
    const username = viewUser.toLowerCase()
    const willConnect = !state.connections[username]
    await dbSetConnection(meUsername, username, willConnect)
    setState((prev) => ({
      ...prev,
      connections: {
        ...prev.connections,
        [username]: willConnect,
      },
    }))
    // Update my friends count (outgoing connections count)
    const { db } = await import('../../db/dexie')
    const friendsCount = await db.connections.where('fromUser').equals(meUsername).count()
    setMeUser((prev) => (prev ? { ...prev, circles: friendsCount } : prev))
  }

  const toggleFollow = async () => {
    if (!viewUser) return
    const username = viewUser.toLowerCase()
    const willFollow = !Boolean(state.following?.[username])
    await dbSetSubscription(meUsername, username, willFollow)
    setState((prev) => ({
      ...prev,
      following: { ...(prev.following ?? {}), [username]: willFollow },
    }))
    // Update other user's followers count
    const { db } = await import('../../db/dexie')
    const followersCount = await db.subscriptions.where('followee').equals(username).count()
    setOtherUser((prev) => (prev ? { ...prev, signalFollowers: followersCount } : prev))
  }

  // Default profile tab for other users depends on mutual connection
  useEffect(() => {
    if (mode === 'user' && viewUser) {
      const u = viewUser.toLowerCase()
      const connected = Boolean(state.connections[u] && (state.connectedBy?.[u] ?? false))
      setOtherProfileKind(connected ? 'circle' : 'signal')
    }
  }, [mode, viewUser, state.connections, state.connectedBy])

  const resetDemoData = async () => {
    const { db } = await import('../../db/dexie')
    await db.delete()
    await initDB()
    const snapshot = await getStateForUser(meUsername)
    setState(snapshot)
  }

  // TopBar is always consistent; per-design back buttons live within profile pages

  const footerAction =
    mode === 'profile'
      ? {
          label: 'Reset demo data',
          action: resetDemoData,
        }
      : null

  return (
    <div className="flex min-h-screen flex-col bg-black font-sans text-neutral-100">
      <TopBar
        mode={mode}
        // If we're viewing a trace, prefer highlighting the tab that matches
        // the trace's kind (signal vs circle). Otherwise TopBar will derive
        // from the mode.
        activeTab={selectedTrace ? (selectedTrace.kind === 'signal' ? 'signals' : 'circles') : undefined}
        onSelectTab={(tab) => {
          setMode(tab)
          setViewUser(null)
          setSelectedTraceId(null)
          navigate(pathFor(tab))
        }}
        onOpenComposer={() => setComposerOpen(true)}
        title={mode === 'user' ? otherUser?.name ?? '' : mode === 'trace' ? 'Trace' : undefined}
      />

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {mode === 'circles' && (
            <motion.div
              key="circles"
              // Avoid mounting pages invisible; don't use the initial variant
              initial={false}
              animate={pageVariants.animate}
              exit={pageVariants.exit}
            >
            <Feed
              traces={feedTraces}
              currentUsername={meUsername}
              currentDisplayName={currentDisplayName}
              onResonate={handleResonate}
              onReflect={openTraceDetail}
              onOpenProfile={openAuthorProfile}
              formatTime={formatTime}
              emptyMessage="Your circles are quiet for now."
              onDelete={async (id) => {
                await dbDeleteTrace(id)
                setState((prev) => ({ ...prev, traces: prev.traces.filter((t) => t.id !== id) }))
              }}
            />
          </motion.div>
        )}

        {mode === 'signals' && (
          <motion.div
            key="signals"
            initial={false}
            animate={pageVariants.animate}
            exit={pageVariants.exit}
          >
            <Feed
              traces={feedTraces}
              currentUsername={meUsername}
              currentDisplayName={currentDisplayName}
              onResonate={handleResonate}
              onReflect={openTraceDetail}
              onOpenProfile={openAuthorProfile}
              formatTime={formatTime}
              emptyMessage="Signals will appear as the world speaks up."
              onDelete={async (id) => {
                await dbDeleteTrace(id)
                setState((prev) => ({ ...prev, traces: prev.traces.filter((t) => t.id !== id) }))
              }}
            />
          </motion.div>
        )}

        {mode === 'profile' && meUser && (
          <motion.div
            key="profile"
            initial={false}
            animate={pageVariants.animate}
            exit={pageVariants.exit}
          >
            <div className="mx-auto w-full max-w-xl space-y-8 px-4 py-10">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <button
                    onClick={handleBack}
                    className="text-sm text-neutral-400 transition hover:text-white"
                    aria-label="Go back"
                  >
                    ← Back
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => setEditProfileOpen(true)}
                    className="inline-flex items-center rounded-full border border-white/10 px-3 py-1 text-sm text-neutral-200 transition hover:bg-white/10"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
              <ProfileHeader
                name={meUser.name}
                handle={meUser.handle}
                bio={meUser.bio ?? ''}
                avatar={meUser.avatar ?? null}
                variant="self"
                circles={meUser.circles ?? 0}
                signals={meUser.signals ?? 0}
                onShowFriends={async () => {
                  const friends = await listFriends(meUsername)
                  setPeopleModal({
                    open: true,
                    title: 'Friends',
                    list: friends,
                    kind: 'friends',
                  })
                }}
                onShowFollowers={async () => {
                  const followers = await listFollowers(meUsername)
                  setPeopleModal({
                    open: true,
                    title: 'Followers',
                    list: followers,
                    kind: 'followers',
                  })
                }}
                onShowCreators={async () => {
                  const creators = await listFollowing(meUsername)
                  setPeopleModal({
                    open: true,
                    title: 'Creators',
                    list: creators,
                    kind: 'creators',
                  })
                }}
              />
              {/* Edit profile button moved up to the header row */}
              <div className="flex justify-center">
                <ProfileSwitcher current={selfProfileKind} onChange={setSelfProfileKind} />
              </div>
              <section className="space-y-4">
                <AnimatePresence mode="popLayout">
                {sortedTraces
                  .filter((trace) => trace.authorUsername?.toLowerCase() === normalizedMeUsername)
                  .filter((trace) => trace.kind === selfProfileKind)
                  .map((trace) => (
                    <motion.div
                      key={trace.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } }}
                      exit={{ opacity: 0, y: -8, transition: { duration: 0.14 } }}
                    >
                      <TraceCard
                        trace={trace}
                        timeLabel={formatTime(trace.createdAt)}
                        onResonate={handleResonate}
                        onReflect={openTraceDetail}
                        onOpenProfile={openAuthorProfile}
                        onDelete={async (id) => {
                          await dbDeleteTrace(id)
                          setState((prev) => ({ ...prev, traces: prev.traces.filter((t) => t.id !== id) }))
                        }}
                        canDelete={trace.authorUsername?.toLowerCase() === normalizedMeUsername}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {sortedTraces.filter((trace) => trace.authorUsername?.toLowerCase() === normalizedMeUsername && trace.kind === selfProfileKind).length === 0 && (
                  <EmptyState message="Your traces will live here when you share them." />
                )}
              </section>
            </div>
          </motion.div>
        )}

        {mode === 'user' && otherUser && (
          <motion.div
            key={`user-${otherUser.name}`}
            initial={false}
            animate={pageVariants.animate}
            exit={pageVariants.exit}
          >
            <UserProfile
              profile={{
                name: otherUser.name,
                handle: otherUser.handle,
                bio: otherUser.bio ?? '',
                avatar: otherUser.avatar ?? null,
                signalFollowers: otherUser.signalFollowers ?? 0,
              }}
              traces={otherUserTraces}
              connected={!!(viewUser && state.connections[viewUser.toLowerCase()] && (state.connectedBy?.[viewUser.toLowerCase()] ?? false))}
              requested={!!(viewUser && state.connections[viewUser.toLowerCase()] && !(state.connectedBy?.[viewUser.toLowerCase()] ?? false))}
              onConnectToggle={toggleConnection}
              followed={!!(viewUser && state.following?.[viewUser.toLowerCase()])}
              onFollowToggle={toggleFollow}
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
            initial={false}
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
                onDelete={async (id) => {
                  await dbDeleteTrace(id)
                  setSelectedTraceId(null)
                  // remove from state
                  setState((prev) => ({ ...prev, traces: prev.traces.filter((t) => t.id !== id) }))
                  handleBack()
                }}
                canDelete={selectedTrace.authorUsername?.toLowerCase() === normalizedMeUsername}
              />
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-neutral-300">Reflections</h3>
                  <span className="text-xs text-neutral-500">
                    {(selectedTrace.reflections ?? []).length}
                  </span>
                </div>

                {(selectedTrace.reflections ?? []).length === 0 ? (
                  <div className="rounded-lg bg-white/5 px-4 py-3 text-sm text-neutral-400">
                    No reflections yet. Be the first.
                  </div>
                ) : (
                  <div className="divide-y divide-white/10 rounded-lg border border-white/10 bg-black/40">
                    {(selectedTrace.reflections ?? []).map((reflection) => {
                      const isMine = reflection.author.trim().toLowerCase() === currentDisplayName.trim().toLowerCase()
                      return (
                        <div key={reflection.id} className="p-4">
                          <div className="mb-1 flex items-center justify-between text-xs text-neutral-500">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openAuthorProfile(reflection.author)}
                                className="text-neutral-300 transition hover:underline"
                              >
                                {reflection.author}
                              </button>
                              <span className="h-1 w-1 rounded-full bg-neutral-600" />
                              <span>{formatTime(reflection.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => startReply(reflection.author)}
                                className="text-neutral-400 hover:text-neutral-200"
                              >
                                Reply
                              </button>
                              {isMine && (
                                <button
                                  type="button"
                                  onClick={() => deleteReflection(selectedTrace.id, reflection.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed text-neutral-100">{reflection.text}</p>
                        </div>
                      )
                    })}
                  </div>
                )}

                <form
                  className="rounded-lg border border-white/10 bg-black/40 p-3"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (!reflectionDraft.trim()) return
                    addReflection(selectedTrace.id)
                  }}
                >
                  <div className="flex items-end justify-between gap-3">
                    <div className="flex-1">
                      <textarea
                        id="reflection-input"
                        ref={reflectionInputRef}
                        value={reflectionDraft}
                        maxLength={maxReflectionLen}
                        onChange={(event) => setReflectionDraft(event.target.value)}
                        placeholder="Share a reflection…"
                        className="w-full resize-none bg-transparent text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
                        rows={1}
                        aria-label="Add reflection"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-neutral-500">
                        {Math.max(0, maxReflectionLen - reflectionDraft.length)} left
                      </span>
                      <button
                        type="submit"
                        disabled={!reflectionDraft.trim()}
                        className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-neutral-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-neutral-700"
                      >
                        Reflect
                      </button>
                    </div>
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
            image={draftImage}
            onImageChange={setDraftImage}
            title="Leave a Trace"
            submitLabel="Post"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editProfileOpen && meUser && (
          <EditProfileModal
            isOpen={editProfileOpen}
            name={meUser.name}
            bio={meUser.bio}
            username={meUsername}
            avatar={meUser.avatar ?? null}
            onClose={() => setEditProfileOpen(false)}
            onSave={async (name, bio, username, avatar) => {
              const { updateUserProfile } = await import('../../db/api')
              const nextUsername = username.trim()
              if (!nextUsername) {
                alert('Username cannot be empty')
                return
              }
              const previousUsername = meUsername
              const previousUsernameNormalized = previousUsername.toLowerCase()
              const nextUsernameNormalized = nextUsername.toLowerCase()
              const previousDisplayName =
                meUser?.name ?? usernameToAuthorName(previousUsername) ?? previousUsername

              if (nextUsername !== previousUsername) {
                try {
                  await changeUsername(previousUsername, nextUsername)
                  setMeUsername(nextUsername)
                } catch (error) {
                  alert('Username already exists')
                  return
                }
              }

              await updateUserProfile(nextUsername, { name, bio, avatar: avatar ?? undefined })
              await refreshAuthorNameMap()

              setMeUser((prev) =>
                prev ? { ...prev, name, bio, avatar: avatar ?? null, handle: `@${nextUsername}` } : prev,
              )
              setState((prev) => ({
                ...prev,
                traces: prev.traces.map((trace) => {
                  const authorUsername = trace.authorUsername?.toLowerCase()
                  const matchesPrevious =
                    authorUsername === previousUsernameNormalized ||
                    (!authorUsername && trace.author === previousDisplayName)
                  const matchesNext =
                    authorUsername === nextUsernameNormalized ||
                    (!authorUsername && trace.author === name)

                  if (matchesPrevious) {
                    return { ...trace, author: name, authorUsername: nextUsername }
                  }
                  if (matchesNext) {
                    return { ...trace, author: name }
                  }
                  return trace
                }),
              }))

              setEditProfileOpen(false)
              if (mode === 'profile') {
                navigate(`/${nextUsername}`)
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {peopleModal.open && (
          <PeopleListModal
            isOpen={peopleModal.open}
            title={peopleModal.title}
            people={peopleModal.list}
            onClose={() => setPeopleModal((p) => ({ ...p, open: false }))}
            onOpenProfile={(username) => {
              setPeopleModal((p) => ({ ...p, open: false }))
              setMode('user')
              setViewUser(username.toLowerCase())
              navigate(`/${username}`)
            }}
            onRemove={async (username) => {
              if (peopleModal.kind === 'friends') {
                await removeFriend(meUsername, username)
                const list = await listFriends(meUsername)
                setPeopleModal((p) => ({ ...p, list }))
              } else if (peopleModal.kind === 'followers') {
                await removeFollower(meUsername, username)
                const list = await listFollowers(meUsername)
                setPeopleModal((p) => ({ ...p, list }))
              } else {
                // creators -> unfollow
                await dbSetSubscription(meUsername, username, false)
                const list = await listFollowing(meUsername)
                setPeopleModal((p) => ({ ...p, list }))
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit modal removed: deletion only */}

      <footer className="border-t border-white/10 py-6 text-center text-xs text-neutral-400">
        Haven · v0.0.1 prototype
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

export default HavenShell
