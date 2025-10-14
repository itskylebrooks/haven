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
import EditProfileModal from './components/EditProfileModal'
import PeopleListModal from './components/PeopleListModal'
import type { HavenState, Mode, Reflection, Trace, TraceType } from './lib/types'
// storage local state not used; DB handles persistence
import { timeAgo, useMinuteTicker } from './lib/time'
import { pageVariants } from './lib/animation'
import { initDB, getStateForUser, addTrace as dbAddTrace, addReflection as dbAddReflection, toggleResonate as dbToggleResonate, setConnection as dbSetConnection, saveDraft as dbSaveDraft, loadDraft as dbLoadDraft, usernameToAuthorName, deleteTrace as dbDeleteTrace, listFriends, removeFriend, listFollowers, removeFollower, changeUsername } from './db/api'

// Hardcoded seeds removed in favor of DB

const HavenMinimal = () => {
  const [state, setState] = useState<HavenState>({ traces: [], connections: {} })
  const [mode, setMode] = useState<Mode>('circles')
  // viewUser stores a username when viewing other user
  const [viewUser, setViewUser] = useState<string | null>(null)
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [draftKind, setDraftKind] = useState<TraceType>('circle')
  const [draftImage, setDraftImage] = useState<string | null>(null)
  const [returnMode, setReturnMode] = useState<Mode>('circles')
  const [reflectionDraft, setReflectionDraft] = useState('')
  const [selfProfileKind, setSelfProfileKind] = useState<TraceType>('circle')
  const [otherProfileKind, setOtherProfileKind] = useState<TraceType>('signal')
  // removed edit state
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [peopleModal, setPeopleModal] = useState<{
    open: boolean
    title: string
    list: { id: string; name: string; handle: string }[]
    kind: 'friends' | 'followers'
  }>({ open: false, title: '', list: [], kind: 'friends' })
  const minuteTicker = useMinuteTicker()
  const [meUser, setMeUser] = useState<{ name: string; handle: string; bio?: string; circles?: number; signals?: number } | null>(null)
  const [otherUser, setOtherUser] = useState<{ name: string; handle: string; bio?: string; signalFollowers?: number } | null>(null)
  const [meUsername, setMeUsername] = useState('itskylebrooks')
  const mapAuthorToUsername = useCallback((author: string) => (author === 'Kyle Brooks' ? meUsername : author.toLowerCase()), [meUsername])

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
    [],
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
          setViewUser(username)
          setSelectedTraceId(null)
        }
        return
      }

      if (parts.length >= 2) {
        const id = parts[1]
        setSelectedTraceId(id)
        setViewUser(username.toLowerCase() === meUsername ? null : username)
        setMode('trace')
        return
      }
    },
    [],
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
    let list = filterForMode(mode)
    // Hide current user's own posts from the general feed (they appear on the profile page)
    if (mode !== 'profile') {
      list = list.filter((t) => mapAuthorToUsername(t.author) !== meUsername)
    }
    // Defensive: if list is unexpectedly empty but we have traces, fall back to all (respecting the same filter)
    if (list.length === 0 && state.traces.length > 0 && (mode === 'circles' || mode === 'signals')) {
      const fallback = [...state.traces]
        .filter((t) => (mode === 'circles' ? t.kind === 'circle' : t.kind === 'signal'))
        .sort((a, b) => b.createdAt - a.createdAt)
      // We're in circles|signals here; hide current user's posts from the general feed
      return fallback.filter((t) => mapAuthorToUsername(t.author) !== meUsername)
    }
    return list
  }, [mode, filterForMode, state.traces, meUsername, mapAuthorToUsername])

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
        const { getSetting } = await import('./db/api')
        const current = (await getSetting<string>('currentUser')) ?? meUsername
        setMeUsername(current)
        const snapshot = await getStateForUser(current)
        setState(snapshot)
      } catch {
        const snapshot = await getStateForUser(meUsername)
        setState(snapshot)
      }
      // load me user
      const { db } = await import('./db/dexie')
      const me = await db.users.get(meUsername)
      if (me) {
        // Compute actual counts
        const friendsCount = await db.connections.where('fromUser').equals(meUsername).count()
        const followersCount = await db.subscriptions.where('followee').equals(meUsername).count()
        setMeUser({
          name: usernameToAuthorName(me.id),
          handle: me.handle,
          bio: me.bio,
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
    const current = window.location.pathname
    if (current === '/' || current === '') {
      // default to circles
      window.history.replaceState({}, '', '/circles')
      applyRoute('/circles')
    } else {
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
      dbSaveDraft('composer', draft, draftKind)
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

    const newTrace: Trace = {
      id: randomId12(),
      author: meUser?.name ?? 'Kyle Brooks',
      text: draft.trim(),
      kind: draftKind,
      createdAt: Date.now(),
      reflections: [],
      image: draftImage ?? undefined,
    }

    setState((prev) => ({
      ...prev,
      traces: [newTrace, ...prev.traces],
    }))
    dbAddTrace(mapAuthorToUsername(newTrace.author), newTrace.text, newTrace.kind, newTrace.createdAt, newTrace.id, newTrace.image)
    setDraft('')
    setDraftImage(null)
    setComposerOpen(false)
    if (draftKind === 'signal') {
      setMode('signals')
    } else {
      setMode('circles')
    }
  }

  const handleResonate = async (traceId: string) => {
    const on = await dbToggleResonate(traceId, 'itskylebrooks')
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
      navigate(pathFor('trace', { user: mapAuthorToUsername(t.author), traceId }))
    }
  }

  // Post editing removed; only deletion is allowed

  const openAuthorProfile = (author: string) => {
    if (author === meUser?.name || author === 'Kyle Brooks') {
      setMode('profile')
      setViewUser(null)
      setSelfProfileKind('circle')
      navigate(pathFor('profile'))
      return
    }

    setReturnMode(mode)
    setViewUser(mapAuthorToUsername(author))
    setMode('user')
    navigate(pathFor('user', { user: mapAuthorToUsername(author) }))
  }

  const addReflection = (traceId: string) => {
    if (!reflectionDraft.trim()) return

    const newReflection: Reflection = {
      id: randomId12(),
      author: meUser?.name ?? 'Kyle Brooks',
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

  const selectedTrace = selectedTraceId
    ? state.traces.find((trace) => trace.id === selectedTraceId) ?? null
    : null

  const otherUserTraces = useMemo(() => {
    if (!viewUser) return []
    const display = usernameToAuthorName(viewUser)
    return sortedTraces.filter((trace) => trace.author === display)
  }, [sortedTraces, viewUser])

  // Load other user's profile when viewUser changes
  useEffect(() => {
    ;(async () => {
      if (!viewUser) {
        setOtherUser(null)
        return
      }
      const { db } = await import('./db/dexie')
      const u = await db.users.get(viewUser.toLowerCase())
      if (u) {
        const followersCount = await db.subscriptions.where('followee').equals(viewUser.toLowerCase()).count()
        setOtherUser({ name: u.name, handle: u.handle, bio: u.bio, signalFollowers: followersCount })
      } else setOtherUser(null)
    })()
  }, [viewUser])

  const handleBack = () => {
    window.history.back()
  }

  const toggleConnection = async () => {
    if (!viewUser) return
    const username = viewUser.toLowerCase()
    const willConnect = !state.connections[viewUser]
    await dbSetConnection('itskylebrooks', username, willConnect)
    setState((prev) => ({
      ...prev,
      connections: {
        ...prev.connections,
        [viewUser]: willConnect,
      },
    }))
    // Update counts
    const { db } = await import('./db/dexie')
    const friendsCount = await db.connections.where('fromUser').equals(meUsername).count()
    setMeUser((prev) => prev ? { ...prev, circles: friendsCount } : prev)
    if (viewUser === meUsername) {
      // If connecting to self? But shouldn't happen
    } else {
      const otherFollowersCount = await db.subscriptions.where('followee').equals(username).count()
      setOtherUser((prev) => prev ? { ...prev, signalFollowers: otherFollowersCount } : prev)
    }
  }

  // Default profile tab for other users depends on connection
  useEffect(() => {
    if (mode === 'user' && viewUser) {
      const connected = !!state.connections[viewUser]
      setOtherProfileKind(connected ? 'circle' : 'signal')
    }
  }, [mode, viewUser, state.connections])

  const resetDemoData = async () => {
    const { db } = await import('./db/dexie')
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
            initial={pageVariants.initial}
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
              />
              {/* Edit profile button moved up to the header row */}
              <div className="flex justify-center">
                <ProfileSwitcher
                  current={selfProfileKind}
                  onChange={setSelfProfileKind}
                />
              </div>
              <section className="space-y-4">
                {sortedTraces
                  .filter((trace) => trace.author === meUser.name)
                  .filter((trace) => trace.kind === selfProfileKind)
                  .map((trace) => (
                    <TraceCard
                      key={trace.id}
                      trace={trace}
                      timeLabel={formatTime(trace.createdAt)}
                      onResonate={handleResonate}
                      onReflect={openTraceDetail}
                      onOpenProfile={openAuthorProfile}
                      onDelete={async (id) => {
                        await dbDeleteTrace(id)
                        setState((prev) => ({ ...prev, traces: prev.traces.filter((t) => t.id !== id) }))
                      }}
                      canDelete={trace.author === 'Kyle Brooks'}
                    />
                  ))}
                {sortedTraces.filter((trace) => trace.author === meUser.name && trace.kind === selfProfileKind).length === 0 && (
                  <EmptyState message="Your traces will live here when you share them." />
                )}
              </section>
            </div>
          </motion.div>
        )}

        {mode === 'user' && otherUser && (
          <motion.div
            key={`user-${otherUser.name}`}
            initial={pageVariants.initial}
            animate={pageVariants.animate}
            exit={pageVariants.exit}
          >
            <UserProfile
              profile={{
                name: otherUser.name,
                handle: otherUser.handle,
                bio: otherUser.bio ?? '',
                signalFollowers: otherUser.signalFollowers ?? 0,
              }}
              traces={otherUserTraces}
              connected={!!(viewUser && state.connections[viewUser])}
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
                onDelete={async (id) => {
                  await dbDeleteTrace(id)
                  setSelectedTraceId(null)
                  // remove from state
                  setState((prev) => ({ ...prev, traces: prev.traces.filter((t) => t.id !== id) }))
                  handleBack()
                }}
                      canDelete={selectedTrace.author === 'Kyle Brooks'}
              />
              <section className="space-y-4">
                <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-400">
                  Reflections
                </h3>
                <div className="space-y-3">
                  {(selectedTrace.reflections ?? []).length === 0 && (
                    <div className="rounded-xl border border-white/5 bg-black/5 px-4 py-3 text-sm text-neutral-400">
                      No reflections yet. Leave the first one.
                    </div>
                  )}
                  {(selectedTrace.reflections ?? []).map((reflection) => (
                    <div
                      key={reflection.id}
                      className="rounded-xl border border-white/5 bg-black/60 p-3 pl-4"
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
                  className="space-y-3 rounded-xl border border-white/10 bg-black/70 p-4"
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
                    className="h-24 w-full resize-none rounded-lg border border-white/10 bg-black p-3 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
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
            onClose={() => setEditProfileOpen(false)}
            onSave={async (name, bio, username) => {
              const { updateUserProfile } = await import('./db/api')
              if (username !== meUsername) {
                try {
                  await changeUsername(meUsername, username)
                  setMeUsername(username)
                } catch (e) {
                  alert('Username already exists')
                  return
                }
              }
              await updateUserProfile(username, { name, bio })
              setMeUser((prev) => (prev ? { ...prev, name, bio, handle: `@${username}` } : prev))
              setEditProfileOpen(false)
              // if on profile route, update URL
              if (mode === 'profile') {
                navigate(`/${username}`)
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
              setViewUser(username)
              navigate(`/${username}`)
            }}
            onRemove={async (username) => {
              if (peopleModal.kind === 'friends') {
                await removeFriend(meUsername, username)
              } else {
                await removeFollower(meUsername, username)
              }
              // refresh list
              const list = peopleModal.kind === 'friends' ? await listFriends(meUsername) : await listFollowers(meUsername)
              setPeopleModal((p) => ({ ...p, list }))
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit modal removed: deletion only */}

      <footer className="border-t border-white/5 py-6 text-center text-xs text-neutral-600">
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

export default HavenMinimal
