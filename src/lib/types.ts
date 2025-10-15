export type TraceType = 'circle' | 'signal'
// Kind used by the composer UI (supports posting to both)
export type ComposerKind = TraceType | 'both'

export type Reflection = {
  id: string
  author: string
  text: string
  createdAt: number
}

export type Trace = {
  id: string
  author: string
  authorUsername?: string
  text: string
  kind: TraceType
  createdAt: number
  resonates?: boolean
  reflections?: Reflection[]
  image?: string
}

export type Mode = 'circles' | 'signals' | 'profile' | 'user' | 'trace'

export type User = {
  name: string
  handle: string
  bio: string
  circles: number
  signals: number
}

export type HavenState = {
  traces: Trace[]
  // Outgoing connection requests (I connected to them)
  connections: Record<string, boolean>
  // Incoming connections (they connected to me)
  connectedBy?: Record<string, boolean>
  // People I follow (their signals appear in my feed)
  following?: Record<string, boolean>
}
