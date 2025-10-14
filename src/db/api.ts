import { db } from './dexie'
import type { DBTrace } from './types'
import type { HavenState, Trace, Reflection, TraceType } from '../lib/types'
import { seedIfEmpty } from './seed'

export const CURRENT_USER = 'itskylebrooks'

const toTrace = (t: DBTrace): Trace => ({
  id: t.id,
  author: usernameToAuthorName(t.author),
  text: t.text,
  kind: t.kind,
  createdAt: t.createdAt,
  reflections: [],
})

const authorNameMap: Record<string, string> = {
  itskylebrooks: 'You',
  lena: 'Lena',
  milo: 'Milo',
  ava: 'Ava',
  eli: 'Eli',
  noah: 'Noah',
}

export const authorToUsername = (author: string) => {
  if (author === 'You') return 'itskylebrooks'
  return author.toLowerCase()
}

export const usernameToAuthorName = (username: string) => {
  return authorNameMap[username.toLowerCase()] ?? username
}

export const initDB = async (): Promise<void> => {
  await seedIfEmpty()
}

export const getStateForUser = async (userId: string): Promise<HavenState> => {
  const [dbTraces, userResonates, dbReflections, dbConnections] = await Promise.all([
    db.traces.orderBy('createdAt').reverse().toArray(),
    db.resonates.where('userId').equals(userId).toArray(),
    db.reflections.toArray(),
    db.connections.where('fromUser').equals(userId).toArray(),
  ])

  const resonateSet = new Set(userResonates.map((r) => r.traceId))
  const reflectionsByTrace = dbReflections.reduce<Record<string, Reflection[]>>((acc, r) => {
    const list = acc[r.traceId] || (acc[r.traceId] = [])
    list.push({ id: r.id, author: usernameToAuthorName(r.author), text: r.text, createdAt: r.createdAt })
    return acc
  }, {})

  const traces: Trace[] = dbTraces.map((t) => ({
    ...toTrace(t),
    resonates: resonateSet.has(t.id),
    reflections: (reflectionsByTrace[t.id] || []).sort((a, b) => a.createdAt - b.createdAt),
  }))

  const connections: HavenState['connections'] = {}
  dbConnections.forEach((c) => (connections[usernameToAuthorName(c.toUser)] = true))

  return { traces, connections }
}

export const addTrace = async (
  authorUsername: string,
  text: string,
  kind: TraceType,
  createdAt: number,
  id: string,
) => {
  const doc: DBTrace = { id, author: authorUsername, text, kind, createdAt }
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

