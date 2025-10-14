import type { TraceType } from '../lib/types'

export type DBUser = {
  id: string // username (e.g., 'itskylebrooks')
  name: string
  handle: string // e.g., '@itskylebrooks'
  bio?: string
  avatar?: string
  circlesCount?: number
  signalsCount?: number
}

export type DBTrace = {
  id: string // 12-char id
  author: string // username
  text: string
  kind: TraceType
  createdAt: number
  expiresAt?: number
  image?: string // base64 data URL or remote URL
}

export type DBReflection = {
  id: string // 12-char id
  traceId: string
  author: string // username
  text: string
  createdAt: number
}

export type DBResonate = {
  id?: number
  userId: string // username of who resonated
  traceId: string
  createdAt: number
}

export type DBConnection = {
  id?: number
  fromUser: string
  toUser: string
  createdAt: number
}

export type DBSubscription = {
  id?: number
  follower: string
  followee: string
  createdAt: number
}

export type DBSetting = {
  key: string
  value: unknown
}

export type DBDraft = {
  key: string // e.g. 'composer'
  text: string
  kind: TraceType
  updatedAt: number
}
