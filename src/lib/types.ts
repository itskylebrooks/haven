export type TraceType = 'circle' | 'signal'

export type Reflection = {
  id: string
  author: string
  text: string
  createdAt: number
}

export type Trace = {
  id: string
  author: string
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
  connections: Record<string, boolean>
}
