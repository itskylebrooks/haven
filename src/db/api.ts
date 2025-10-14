import { db } from './dexie'
import type { DBTrace } from './types'
import type { HavenState, Trace, Reflection, TraceType } from '../lib/types'
import { seedIfEmpty } from './seed'

export const CURRENT_USER = 'itskylebrooks'

const toTrace = (t: DBTrace): Trace => ({
  id: t.id,
  author: usernameToAuthorName(t.author),
  authorUsername: t.author,
  text: t.text,
  kind: t.kind,
  createdAt: t.createdAt,
  reflections: [],
})

let authorNameMap: Record<string, string> = {}

export const authorToUsername = (author: string) => {
  if (author === 'Kyle Brooks') return 'itskylebrooks'
  return author.toLowerCase()
}

export const usernameToAuthorName = (username: string) => {
  return authorNameMap[username.toLowerCase()] ?? username
}

export const refreshAuthorNameMap = async () => {
  const users = await db.users.toArray()
  const next: Record<string, string> = {}
  for (const u of users) next[u.id.toLowerCase()] = u.name || u.id
  authorNameMap = next
}

export const initDB = async (): Promise<void> => {
  await seedIfEmpty()
  await refreshAuthorNameMap()
  await dedupeTraces()
}

// Remove duplicate traces (same author, kind, and text) keeping the newest
export const dedupeTraces = async (): Promise<void> => {
  const traces = await db.traces.toArray()
  if (!traces.length) return

  const keyFor = (t: DBTrace) => `${t.author}|${t.kind}|${t.text.trim()}`
  const map = new Map<string, DBTrace[]>()
  for (const t of traces) {
    const k = keyFor(t)
    const list = map.get(k)
    if (list) list.push(t)
    else map.set(k, [t])
  }

  const toDelete = new Set<string>()
  for (const [, list] of map) {
    if (list.length <= 1) continue
    // Keep the newest by createdAt; delete others
    list.sort((a, b) => b.createdAt - a.createdAt)
    for (let i = 1; i < list.length; i++) toDelete.add(list[i].id)
  }
  if (toDelete.size === 0) return

  const ids = Array.from(toDelete)
  await db.transaction('rw', db.traces, db.reflections, db.resonates, async () => {
    // Delete related reflections and resonates, then traces
    const allRefs = await db.reflections.where('traceId').anyOf(ids).toArray()
    for (const r of allRefs) await db.reflections.delete(r.id)
    const allRes = await db.resonates.where('traceId').anyOf(ids).toArray()
    for (const res of allRes) if (res.id != null) await db.resonates.delete(res.id)
    for (const id of ids) await db.traces.delete(id)
  })
}

export const getStateForUser = async (userId: string): Promise<HavenState> => {
  const [dbTraces, userResonates, dbReflections, dbConnections, users] = await Promise.all([
    db.traces.orderBy('createdAt').reverse().toArray(),
    db.resonates.where('userId').equals(userId).toArray(),
    db.reflections.toArray(),
    db.connections.where('fromUser').equals(userId).toArray(),
    db.users.toArray(),
  ])

  const nameMap: Record<string, string> = {}
  users.forEach(u => { nameMap[u.id.toLowerCase()] = u.name || u.id })

  const resonateSet = new Set(userResonates.map((r) => r.traceId))
  const reflectionsByTrace = dbReflections.reduce<Record<string, Reflection[]>>((acc, r) => {
    const list = acc[r.traceId] || (acc[r.traceId] = [])
    const display = nameMap[r.author.toLowerCase()] ?? r.author
    list.push({ id: r.id, author: display, text: r.text, createdAt: r.createdAt })
    return acc
  }, {})

  const traces: Trace[] = dbTraces.map((t) => ({
    ...toTrace(t),
    author: nameMap[t.author.toLowerCase()] ?? t.author,
    authorUsername: t.author,
    resonates: resonateSet.has(t.id),
    reflections: (reflectionsByTrace[t.id] || []).sort((a, b) => a.createdAt - b.createdAt),
  }))

  const connections: HavenState['connections'] = {}
  dbConnections.forEach((c) => (connections[c.toUser.toLowerCase()] = true))

  return { traces, connections }
}

export const addTrace = async (
  authorUsername: string,
  text: string,
  kind: TraceType,
  createdAt: number,
  id: string,
  image?: string,
) => {
  const doc: DBTrace = { id, author: authorUsername, text, kind, createdAt, image }
  await db.traces.put(doc)
}

export const addReflection = async (
  traceId: string,
  authorUsername: string,
  text: string,
  createdAt: number,
  id: string,
) => {
  await db.reflections.put({ id, traceId, author: authorUsername, text, createdAt })
}

export const toggleResonate = async (
  traceId: string,
  userId: string,
): Promise<boolean> => {
  const existing = await db.resonates.where({ userId, traceId }).first()
  if (existing) {
    await db.resonates.delete(existing.id!)
    return false
  }
  await db.resonates.add({ userId, traceId, createdAt: Date.now() })
  return true
}

export const setConnection = async (
  from: string,
  to: string,
  connected: boolean,
) => {
  const existing = await db.connections.where({ fromUser: from, toUser: to }).first()
  const existingReverse = await db.connections.where({ fromUser: to, toUser: from }).first()
  if (connected) {
    if (!existing) await db.connections.add({ fromUser: from, toUser: to, createdAt: Date.now() })
    if (!existingReverse) await db.connections.add({ fromUser: to, toUser: from, createdAt: Date.now() })
  } else {
    if (existing) await db.connections.delete(existing.id!)
    if (existingReverse) await db.connections.delete(existingReverse.id!)
  }
}

export const saveDraft = async (key: string, text: string, kind: TraceType) => {
  await db.drafts.put({ key, text, kind, updatedAt: Date.now() })
}

export const loadDraft = async (key: string) => {
  return db.drafts.get(key)
}

export const setSetting = async (key: string, value: unknown) => {
  await db.settings.put({ key, value })
}

export const getSetting = async <T = unknown>(key: string): Promise<T | undefined> => {
  const item = await db.settings.get(key)
  return item?.value as T | undefined
}

export const deleteTrace = async (id: string) => {
  await db.traces.delete(id)
}

export const listFriends = async (username: string) => {
  const connections = await db.connections.where('fromUser').equals(username).toArray()
  const friendUsernames = connections.map(c => c.toUser)
  const friends = await db.users.where('id').anyOf(friendUsernames).toArray()
  return friends.map(f => ({ id: f.id, name: f.name, handle: f.handle }))
}

export const removeFriend = async (from: string, to: string) => {
  const existing = await db.connections.where({ fromUser: from, toUser: to }).first()
  if (existing) await db.connections.delete(existing.id!)
  const existingReverse = await db.connections.where({ fromUser: to, toUser: from }).first()
  if (existingReverse) await db.connections.delete(existingReverse.id!)
}

export const listFollowers = async (username: string) => {
  const subscriptions = await db.subscriptions.where('followee').equals(username).toArray()
  const followerUsernames = subscriptions.map(s => s.follower)
  const followers = await db.users.where('id').anyOf(followerUsernames).toArray()
  return followers.map(f => ({ id: f.id, name: f.name, handle: f.handle }))
}

export const removeFollower = async (follower: string, followee: string) => {
  const existing = await db.subscriptions.where({ follower, followee }).first()
  if (existing) await db.subscriptions.delete(existing.id!)
}

export const changeUsername = async (oldUsername: string, newUsername: string) => {
  // Check if new username exists
  const existing = await db.users.get(newUsername)
  if (existing) throw new Error('Username already exists')

  // Update user
  const user = await db.users.get(oldUsername)
  if (!user) throw new Error('User not found')
  await db.users.delete(oldUsername)
  await db.users.put({ ...user, id: newUsername, handle: `@${newUsername}` })

  // Update traces
  const traces = await db.traces.where('author').equals(oldUsername).toArray()
  for (const trace of traces) {
    await db.traces.update(trace.id, { author: newUsername })
  }

  // Update reflections
  const reflections = await db.reflections.where('author').equals(oldUsername).toArray()
  for (const reflection of reflections) {
    await db.reflections.update(reflection.id, { author: newUsername })
  }

  // Update resonates
  const resonates = await db.resonates.where('userId').equals(oldUsername).toArray()
  for (const resonate of resonates) {
    await db.resonates.update(resonate.id!, { userId: newUsername })
  }

  // Update connections
  const connectionsFrom = await db.connections.where('fromUser').equals(oldUsername).toArray()
  for (const conn of connectionsFrom) {
    await db.connections.update(conn.id!, { fromUser: newUsername })
  }
  const connectionsTo = await db.connections.where('toUser').equals(oldUsername).toArray()
  for (const conn of connectionsTo) {
    await db.connections.update(conn.id!, { toUser: newUsername })
  }

  // Update subscriptions
  const subscriptionsFollower = await db.subscriptions.where('follower').equals(oldUsername).toArray()
  for (const sub of subscriptionsFollower) {
    await db.subscriptions.update(sub.id!, { follower: newUsername })
  }
  const subscriptionsFollowee = await db.subscriptions.where('followee').equals(oldUsername).toArray()
  for (const sub of subscriptionsFollowee) {
    await db.subscriptions.update(sub.id!, { followee: newUsername })
  }

  // Update settings if current user
  const currentUser = await getSetting<string>('currentUser')
  if (currentUser === oldUsername) {
    await setSetting('currentUser', newUsername)
  }
}

export const updateUserProfile = async (username: string, updates: { name?: string; bio?: string; avatar?: string }) => {
  const user = await db.users.get(username)
  if (!user) throw new Error('User not found')
  await db.users.update(username, updates)
}
