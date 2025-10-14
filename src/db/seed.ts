import { db } from './dexie'
import type { DBTrace, DBUser, DBReflection, DBResonate, DBSubscription } from './types'

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
    { id: 'sage', name: 'Sage Marin', handle: '@sage', bio: 'cartographer of attention' },
    { id: 'ravi', name: 'Ravi Kapoor', handle: '@ravi', bio: 'tea, typography, and tiny tools' },
    { id: 'faye', name: 'Faye Liu', handle: '@faye', bio: 'collecting gentle thunderstorms' },
    { id: 'orion', name: 'Orion Hale', handle: '@orion', bio: 'night-walker, sky listener' },
    { id: 'nora', name: 'Nora Ellis', handle: '@nora', bio: 'urban naturalist; moss maximalist' },
    { id: 'juno', name: 'Juno Park', handle: '@juno', bio: 'software symphonies and soft mornings' },
    { id: 'aria', name: 'Aria Wilde', handle: '@aria', bio: 'notes between notes' },
    { id: 'sol', name: 'Sol Rivera', handle: '@sol', bio: 'sunrise chaser, sunset saver' },
    { id: 'basil', name: 'Basil Stone', handle: '@basil', bio: 'plants have personalities' },
    { id: 'ivy', name: 'Ivy Rhodes', handle: '@ivy', bio: 'storyteller in lowercase' },
    { id: 'cato', name: 'Cato Wynn', handle: '@cato', bio: 'maps, margins, and meaning' },
    { id: 'paz', name: 'Paz Méndez', handle: '@paz', bio: 'quiet tech for loud worlds' },
    { id: 'uma', name: 'Uma Das', handle: '@uma', bio: 'curious about everything slow' },
    { id: 'kian', name: 'Kian Moss', handle: '@kian', bio: 'audio tinkerer; room tone enjoyer' },
    { id: 'sora', name: 'Sora Kim', handle: '@sora', bio: 'paper crafts and pixel dust' },
    { id: 'remy', name: 'Remy Cho', handle: '@remy', bio: 'the tiniest optimizations' },
    { id: 'tala', name: 'Tala Noor', handle: '@tala', bio: 'desert rain archivist' },
    { id: 'zeno', name: 'Zeno Quinn', handle: '@zeno', bio: 'paradoxes and porch coffee' },
    { id: 'mina', name: 'Mina Farah', handle: '@mina', bio: 'letters to the future self' },
    { id: 'arlo', name: 'Arlo Vance', handle: '@arlo', bio: 'bikes, bread, and balance' },
    { id: 'cleo', name: 'Cleo Hart', handle: '@cleo', bio: 'art school dropout; color theorist' },
    { id: 'zev', name: 'Zev Adler', handle: '@zev', bio: 'slow computing advocate' },
    { id: 'yara', name: 'Yara Sousa', handle: '@yara', bio: 'front porch philosopher' },
    { id: 'indie', name: 'Indie Moore', handle: '@indie', bio: 'independent as advertised' },
    { id: 'lotus', name: 'Lotus Tran', handle: '@lotus', bio: 'water, wind, and whitespace' },
    { id: 'cal', name: 'Cal Rivers', handle: '@cal', bio: 'rest is productive' },
    { id: 'dune', name: 'Dune Ortega', handle: '@dune', bio: 'sand library librarian' },
    { id: 'mara', name: 'Mara Zaid', handle: '@mara', bio: 'small talk, big heart' },
    { id: 'odin', name: 'Odin Rue', handle: '@odin', bio: 'maker of simple tools' },
    { id: 'piper', name: 'Piper Nash', handle: '@piper', bio: 'gentle provocations' },
    
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
      text: 'Stillness teaches what noise hides. I keep finding new corners of quiet I didn\'t know I needed.',
      kind: 'circle',
      offset: 2 * HOURS,
      reflections: [
        {
          author: 'ava',
          text: 'Saving this line for when the city gets loud.',
          offset: 90 * MINUTES,
        },
        {
          author: 'milo',
          text: 'Design note: negative space is emotional space.',
          offset: 100 * MINUTES,
        },
      ],
    },
    {
      author: 'milo',
      text: 'Design is how silence looks when it’s visual. If the interface is calm, the person can be too.',
      kind: 'signal',
      offset: 5 * HOURS,
      reflections: [
        { author: 'ravi', text: 'Tea UI: fewer buttons, more breath.', offset: 30 * MINUTES },
      ],
    },
    {
      author: 'ava',
      text: 'Every morning is a soft reset. I write one sentence I don\'t show anyone and it changes the tone of the day.',
      kind: 'circle',
      offset: 8 * HOURS,
      reflections: [
        { author: 'lena', text: 'Keeping this ritual, thank you.', offset: 20 * MINUTES },
        { author: 'ivy', text: 'Lowercase mornings, uppercase evenings.', offset: 45 * MINUTES },
      ],
    },
    {
      author: 'eli',
      text: 'Silence is a tool, not a void. The best mixes leave room for breath and surprise.',
      kind: 'signal',
      offset: 24 * HOURS,
      reflections: [
        { author: 'kian', text: 'Room tone is character, not noise.', offset: 35 * MINUTES },
      ],
    },
    {
      author: 'noah',
      text: 'Small conversations are where meaning hides. Community is a mosaic: tiny tiles, patient hands.',
      kind: 'circle',
      offset: 48 * HOURS,
      reflections: [
        { author: 'paz', text: 'Civic tech should feel like this.', offset: 50 * MINUTES },
      ],
    },
    {
      author: 'itskylebrooks',
      text: 'Pausing to notice who I miss. Writing their names down is a way of calling them in, gently.',
      kind: 'circle',
      offset: 3 * HOURS,
      reflections: [
        { author: 'lena', text: 'A quiet roll call of care.', offset: 25 * MINUTES },
        { author: 'sage', text: 'Attention maps to affection.', offset: 33 * MINUTES },
      ],
    },
    {
      author: 'itskylebrooks',
      text: 'Letting signals be invitations, not interruptions. If it can\'t wait, it probably isn\'t for me.',
      kind: 'signal',
      offset: 12 * HOURS,
      reflections: [
        { author: 'milo', text: 'Designing for latency of life.', offset: 40 * MINUTES },
      ],
    },
    { author: 'sage', text: 'Attention is the rarest spice. Share it generously and watch conversations simmer instead of boil.', kind: 'circle', offset: 6 * HOURS, reflections: [ { author: 'noah', text: 'Slow recipes, strong flavors.', offset: 28 * MINUTES } ] },
    { author: 'ravi', text: 'Tuned my kettle to whistle in C. Mornings now harmonize, and the day resolves on a warm note.', kind: 'signal', offset: 7 * HOURS, reflections: [ { author: 'aria', text: 'Tea in 4/4 time.', offset: 22 * MINUTES } ] },
    { author: 'faye', text: 'Clouds rehearsed all afternoon and finally performed at dusk. The encore was a hush that made the streetlights blush.', kind: 'circle', offset: 10 * HOURS },
    { author: 'orion', text: 'Streetlights are just stars we installed because we were lonely. I walk under them like constellations I can edit.', kind: 'circle', offset: 22 * HOURS, reflections: [ { author: 'yara', text: 'Public astronomy.', offset: 48 * MINUTES } ] },
    { author: 'nora', text: 'Found a garden growing in the cracks of my schedule. Watered it with ten minutes of nothing in particular.', kind: 'signal', offset: 14 * HOURS },
    { author: 'juno', text: 'Refactoring my routine. Fewer notifications, more notations. The compiler approves: fewer warnings, clearer days.', kind: 'circle', offset: 15 * HOURS },
    { author: 'aria', text: 'Practiced the rest between notes today. It played me back, softly and on key.', kind: 'circle', offset: 16 * HOURS },
    { author: 'sol', text: 'Sunrise today felt like an apology letter. The signature was written in orange and gold.', kind: 'signal', offset: 18 * HOURS },
    { author: 'basil', text: 'My basil prefers jazz to lo-fi. Respect. The leaves curl toward sax solos like sun.', kind: 'circle', offset: 20 * HOURS },
    { author: 'ivy', text: 'Typing softer improved my prose. Strange and true. My keyboard stops shouting and my sentences listen.', kind: 'signal', offset: 26 * HOURS },
    { author: 'cato', text: 'Margins are where the book breathes. I started leaving margins in my day, and the plot thickened.', kind: 'circle', offset: 30 * HOURS },
    { author: 'paz', text: 'Technology should whisper, not shout. The best features arrive like a friend, not a salesperson.', kind: 'signal', offset: 32 * HOURS },
    { author: 'uma', text: 'Every good question is a doorway. Today I stood in a few and enjoyed the threshold.', kind: 'circle', offset: 34 * HOURS },
    { author: 'kian', text: 'Room tone report: optimistic. The silence had a smile in it.', kind: 'signal', offset: 36 * HOURS },
    { author: 'sora', text: 'Folded a crane from a meeting agenda. It flew better than the meeting. Still landed safely.', kind: 'circle', offset: 38 * HOURS },
    { author: 'remy', text: 'Saved 40ms and gained a minute of peace. It adds up when the app stops trying too hard.', kind: 'signal', offset: 40 * HOURS },
    { author: 'tala', text: 'Desert air remembers rain like a promise. When it arrives, everyone steps outside to read it together.', kind: 'circle', offset: 42 * HOURS },
    { author: 'zeno', text: 'Halfway to never arriving, fully here. Motion without rush feels like a good paradox.', kind: 'signal', offset: 44 * HOURS },
    { author: 'mina', text: 'Wrote myself a letter I can only read slowly. Every comma is a breath I needed.', kind: 'circle', offset: 46 * HOURS },
    { author: 'arlo', text: 'Bike chain finally quiet. So is my head. Maintenance is meditation with wrenches.', kind: 'signal', offset: 50 * HOURS },
    { author: 'cleo', text: 'Colors argue until you give them space to listen. The palette apologized and the canvas forgave.', kind: 'circle', offset: 52 * HOURS },
    { author: 'zev', text: 'My computer sighed when I closed 12 tabs. I did too. Multitasking is just coordinated forgetting.', kind: 'signal', offset: 54 * HOURS },
    { author: 'yara', text: 'Front porch office hours. BYO breeze. The agenda is neighbors and nectarines.', kind: 'circle', offset: 56 * HOURS },
    { author: 'indie', text: 'Collaborating with solitude today. We paired on a plan and shipped nothing on purpose.', kind: 'signal', offset: 58 * HOURS },
    { author: 'lotus', text: 'Whitespace is a form of kindness. I added some to my calendar and felt seen.', kind: 'circle', offset: 60 * HOURS },
    { author: 'cal', text: 'Rest is a radical strategy meeting. The agenda item is doing less and trusting more.', kind: 'signal', offset: 62 * HOURS },
    { author: 'dune', text: 'There are libraries in dunes; you just have to listen. The index is written by wind.', kind: 'circle', offset: 64 * HOURS },
    { author: 'mara', text: 'I practice small talk like scales on a piano. One day I\'ll improvise kindness without thinking.', kind: 'signal', offset: 66 * HOURS },
    { author: 'odin', text: 'Built a tool that does less, better. The hardest part was deleting features I didn\'t need.', kind: 'circle', offset: 68 * HOURS },
    { author: 'piper', text: 'A gentle provocation: log off for lunch. Your sandwich has been trying to talk to you for years.', kind: 'signal', offset: 70 * HOURS },
    
  ]

  const n = now()
  const traces: DBTrace[] = seedTraces.map((t) => ({
    id: randId(),
    author: t.author,
    text: t.text,
    kind: t.kind,
    createdAt: n - t.offset,
  }))
  const authorToTraceIds: Record<string, string[]> = {}
  for (const tr of traces) {
    if (!authorToTraceIds[tr.author]) authorToTraceIds[tr.author] = []
    authorToTraceIds[tr.author].push(tr.id)
  }

  // Use a single transaction and a lightweight lock to prevent concurrent seeding
  await db.transaction('rw', db.settings, db.users, db.traces, db.reflections, db.resonates, db.connections, db.subscriptions, async () => {
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
    // Make @itskylebrooks have 7 friends (mutual connections)
    const friendPairs = ['lena','milo','ava','eli','noah','sage','ravi']
    const connections = friendPairs.flatMap((u, i) => [
      { fromUser: 'itskylebrooks', toUser: u, createdAt: n - (i + 1) * HOURS },
      { fromUser: u, toUser: 'itskylebrooks', createdAt: n - (i + 1) * HOURS },
    ])
    await db.connections.bulkPut(connections)

    // Make @itskylebrooks have 20 followers
    const followerIds = [
      'lena','milo','ava','eli','noah','sage','ravi','faye','orion','nora',
      'juno','aria','sol','basil','ivy','cato','paz','uma','kian','sora',
    ]
    const subscriptions = [
      ...followerIds.map((f, i) => ({ follower: f, followee: 'itskylebrooks', createdAt: n - (i + 1) * MINUTES })),
      // And a few that Kyle follows
      { follower: 'itskylebrooks', followee: 'lena', createdAt: n - 3 * HOURS },
      { follower: 'itskylebrooks', followee: 'milo', createdAt: n - 4 * HOURS },
      { follower: 'itskylebrooks', followee: 'ava', createdAt: n - 5 * HOURS },
      { follower: 'itskylebrooks', followee: 'sage', createdAt: n - 6 * HOURS },
      { follower: 'itskylebrooks', followee: 'ravi', createdAt: n - 7 * HOURS },
    ]
    await db.subscriptions.bulkPut(subscriptions)

    // Resonate interactions (likes) to simulate activity
    const chooseLatest = (author: string) => {
      const list = authorToTraceIds[author] || []
      return list[list.length - 1]
    }
    const resonatePairs: Array<{ who: string; onAuthor: string; agoMin: number }> = [
      { who: 'lena', onAuthor: 'itskylebrooks', agoMin: 5 },
      { who: 'milo', onAuthor: 'itskylebrooks', agoMin: 7 },
      { who: 'ava', onAuthor: 'itskylebrooks', agoMin: 9 },
      { who: 'eli', onAuthor: 'itskylebrooks', agoMin: 12 },
      { who: 'noah', onAuthor: 'itskylebrooks', agoMin: 14 },

      { who: 'sage', onAuthor: 'lena', agoMin: 18 },
      { who: 'ravi', onAuthor: 'lena', agoMin: 20 },
      { who: 'faye', onAuthor: 'milo', agoMin: 21 },
      { who: 'orion', onAuthor: 'milo', agoMin: 22 },
      { who: 'juno', onAuthor: 'ava', agoMin: 24 },
      { who: 'aria', onAuthor: 'ava', agoMin: 25 },

      { who: 'sol', onAuthor: 'eli', agoMin: 27 },
      { who: 'basil', onAuthor: 'eli', agoMin: 28 },
      { who: 'ivy', onAuthor: 'noah', agoMin: 30 },
      { who: 'cato', onAuthor: 'noah', agoMin: 31 },

      { who: 'paz', onAuthor: 'sage', agoMin: 33 },
      { who: 'uma', onAuthor: 'ravi', agoMin: 34 },
      { who: 'kian', onAuthor: 'faye', agoMin: 35 },
      { who: 'sora', onAuthor: 'orion', agoMin: 36 },
      { who: 'remy', onAuthor: 'juno', agoMin: 37 },
      { who: 'tala', onAuthor: 'aria', agoMin: 38 },
      { who: 'zeno', onAuthor: 'sol', agoMin: 39 },
      { who: 'mina', onAuthor: 'basil', agoMin: 40 },
      { who: 'arlo', onAuthor: 'ivy', agoMin: 41 },
      { who: 'cleo', onAuthor: 'cato', agoMin: 42 },
      { who: 'zev', onAuthor: 'paz', agoMin: 43 },
      { who: 'yara', onAuthor: 'uma', agoMin: 44 },
      { who: 'indie', onAuthor: 'kian', agoMin: 45 },
      { who: 'lotus', onAuthor: 'sora', agoMin: 46 },
      { who: 'cal', onAuthor: 'remy', agoMin: 47 },
      { who: 'dune', onAuthor: 'tala', agoMin: 48 },
      { who: 'mara', onAuthor: 'zeno', agoMin: 49 },
      { who: 'odin', onAuthor: 'mina', agoMin: 50 },
      { who: 'piper', onAuthor: 'arlo', agoMin: 51 },
    ]

    const resonates: DBResonate[] = resonatePairs
      .map(({ who, onAuthor, agoMin }) => {
        const traceId = chooseLatest(onAuthor)
        if (!traceId || who === onAuthor) return undefined
        return { userId: who, traceId, createdAt: n - agoMin * MINUTES }
      })
      .filter(Boolean) as DBResonate[]

    if (resonates.length) await db.resonates.bulkPut(resonates)

    // Extra cross-subscriptions to simulate graph density
    const moreSubs: DBSubscription[] = [
      { follower: 'lena', followee: 'ava', createdAt: n - 90 * MINUTES },
      { follower: 'milo', followee: 'eli', createdAt: n - 100 * MINUTES },
      { follower: 'ava', followee: 'lena', createdAt: n - 110 * MINUTES },
      { follower: 'eli', followee: 'noah', createdAt: n - 120 * MINUTES },
      { follower: 'noah', followee: 'milo', createdAt: n - 130 * MINUTES },
      { follower: 'sage', followee: 'ravi', createdAt: n - 140 * MINUTES },
      { follower: 'ravi', followee: 'sage', createdAt: n - 150 * MINUTES },
      { follower: 'faye', followee: 'orion', createdAt: n - 160 * MINUTES },
      { follower: 'orion', followee: 'nora', createdAt: n - 170 * MINUTES },
      { follower: 'nora', followee: 'faye', createdAt: n - 180 * MINUTES },
      { follower: 'juno', followee: 'aria', createdAt: n - 190 * MINUTES },
      { follower: 'aria', followee: 'juno', createdAt: n - 200 * MINUTES },
      { follower: 'sol', followee: 'basil', createdAt: n - 210 * MINUTES },
      { follower: 'basil', followee: 'ivy', createdAt: n - 220 * MINUTES },
      { follower: 'ivy', followee: 'cato', createdAt: n - 230 * MINUTES },
    ]
    await db.subscriptions.bulkPut(moreSubs)

    // Mark as seeded and release lock
    await db.settings.put({ key: 'seeded', value: true })
    await db.settings.delete('seeding')
  })
}
