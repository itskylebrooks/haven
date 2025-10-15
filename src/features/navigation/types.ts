import type { TraceType } from '../../lib/types'

export type PersonSummary = {
  username: string
  name: string
  handle: string
}

export type CircleNotification =
  | {
      id: string
      type: 'resonate'
      user: PersonSummary
      traceId: string
      traceText: string
      createdAt: number
    }
  | {
      id: string
      type: 'reflection'
      user: PersonSummary
      traceId: string
      traceText: string
      text: string
      createdAt: number
    }
  | {
      id: string
      type: 'connection'
      user: PersonSummary
      createdAt: number
    }

export type SignalReflection = {
  id: string
  author: PersonSummary
  text: string
  createdAt: number
}

export type SignalNotification = {
  traceId: string
  traceText: string
  traceKind: TraceType
  resonateCount: number
  reflections: SignalReflection[]
  latestActivity: number
}

export type NotificationsState = {
  circles: CircleNotification[]
  signals: SignalNotification[]
}
