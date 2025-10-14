import { db } from './dexie'
import type { DBTrace, DBUser, DBReflection } from './types'

const HOURS = 60 * 60 * 1000
const MINUTES = 60 * 1000

const randId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

const now = () => Date.now()

export const seedIfEmpty = async () => {
  // Fast-path: if we've already seeded, bail
  const alreadySeeded = await db.settings.get('seeded')
  if (alreadySeeded) return

  const users: DBUser[] = [
    { id: 'itskylebrooks', name: 'Kyle Brooks', handle: '@itskylebrooks', bio: 'learning to slow down', circlesCount: 42, signalsCount: 8 },
    { id: 'lena', name: 'Lena', handle: '@lena', bio: 'photographer of quiet things' },
    { id: 'milo', name: 'Milo', handle: '@milo', bio: 'designer of invisible systems' },
    { id: 'ava', name: 'Ava', handle: '@ava', bio: 'writer and listener' },
    { id: 'eli', name: 'Eli', handle: '@eli', bio: 'sound engineer of silent rooms' },
    { id: 'noah', name: 'Noah', handle: '@noah', bio: 'curating small, steady communities' },
  ]

  const seedTraces: Array<{
    author: string
    text: string
    kind: 'circle' | 'signal'
    offset: number
    reflections?: { author: string; text: string; offset: number }[]
  }> = [
    {
      author: 'lena',
      text: 'Stillness teaches what noise hides.',
      kind: 'circle',
      offset: 2 * HOURS,
      reflections: [
        {
          author: 'ava',
          text: 'Saving this line for when the city gets loud.',
          offset: 90 * MINUTES,
        },
      ],
    },
    {
      author: 'milo',
      text: 'Design is how silence looks when it’s visual.',
      kind: 'signal',
      offset: 5 * HOURS,
    },
    {
      author: 'ava',
      text: 'Every morning is a soft reset.',
      kind: 'circle',
      offset: 8 * HOURS,
    },
    {
      author: 'eli',
      text: 'Silence is a tool, not a void.',
      kind: 'signal',
      offset: 24 * HOURS,
    },
    {
      author: 'noah',
      text: 'Small conversations are where meaning hides.',
      kind: 'circle',
      offset: 48 * HOURS,
    },
    {
      author: 'itskylebrooks',
      text: 'Pausing to notice who I miss.',
      kind: 'circle',
      offset: 3 * HOURS,
    },
    {
      author: 'itskylebrooks',
      text: 'Letting signals be invitations, not interruptions.',
      kind: 'signal',
      offset: 12 * HOURS,
    },
  ]

  const n = now()
  const traces: DBTrace[] = seedTraces.map((t) => ({
    id: randId(),
    author: t.author,
    text: t.text,
    kind: t.kind,
    createdAt: n - t.offset,
  }))

  // Use a single transaction and a lightweight lock to prevent concurrent seeding
  await db.transaction('rw', db.settings, db.users, db.traces, db.reflections, db.connections, db.subscriptions, async () => {
    const seeded = await db.settings.get('seeded')
    if (seeded) return

    // Acquire lock (primary key on settings.key ensures only one succeeds)
    try {
      await db.settings.add({ key: 'seeding', value: Date.now() })
    } catch {
      // Another seeding is in progress or completed
      return
    }

    await db.users.bulkPut(users)
    await db.traces.bulkPut(traces)

    const reflections: DBReflection[] = []
    for (let i = 0; i < seedTraces.length; i++) {
      const st = seedTraces[i]
      if (!st.reflections) continue
      const traceId = traces[i].id
      for (const r of st.reflections) {
        reflections.push({
          id: randId(),
          traceId,
          author: r.author,
          text: r.text,
          createdAt: n - r.offset,
        })
      }
    }
    if (reflections.length) await db.reflections.bulkPut(reflections)

    // Add connections and subscriptions
    const connections = [
      { fromUser: 'itskylebrooks', toUser: 'lena', createdAt: n - 1 * HOURS },
      { fromUser: 'lena', toUser: 'itskylebrooks', createdAt: n - 1 * HOURS },
      { fromUser: 'itskylebrooks', toUser: 'milo', createdAt: n - 2 * HOURS },
      { fromUser: 'milo', toUser: 'itskylebrooks', createdAt: n - 2 * HOURS },
    ]
    await db.connections.bulkPut(connections)

    const subscriptions = [
      { follower: 'ava', followee: 'itskylebrooks', createdAt: n - 30 * MINUTES },
      { follower: 'eli', followee: 'itskylebrooks', createdAt: n - 1 * HOURS },
      { follower: 'noah', followee: 'itskylebrooks', createdAt: n - 2 * HOURS },
      { follower: 'itskylebrooks', followee: 'lena', createdAt: n - 3 * HOURS },
      { follower: 'itskylebrooks', followee: 'milo', createdAt: n - 4 * HOURS },
      { follower: 'itskylebrooks', followee: 'ava', createdAt: n - 5 * HOURS },
    ]
    await db.subscriptions.bulkPut(subscriptions)

    // Mark as seeded and release lock
    await db.settings.put({ key: 'seeded', value: true })
    await db.settings.delete('seeding')
  })
}
