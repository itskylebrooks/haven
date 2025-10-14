import Dexie, { type Table } from 'dexie'
import type {
  DBUser,
  DBTrace,
  DBReflection,
  DBResonate,
  DBConnection,
  DBSubscription,
  DBSetting,
  DBDraft,
} from './types'

export class HavenDB extends Dexie {
  users!: Table<DBUser, string>
  traces!: Table<DBTrace, string>
  reflections!: Table<DBReflection, string>
  resonates!: Table<DBResonate, number>
  connections!: Table<DBConnection, number>
  subscriptions!: Table<DBSubscription, number>
  settings!: Table<DBSetting, string>
  drafts!: Table<DBDraft, string>

  constructor() {
    super('haven-db')
    this.version(1).stores({
      users: 'id',
      traces: 'id, author, kind, createdAt',
      reflections: 'id, traceId, author, createdAt',
      resonates: '++id, [userId+traceId], userId, traceId, createdAt',
      connections: '++id, [fromUser+toUser], fromUser, toUser, createdAt',
      subscriptions: '++id, [follower+followee], follower, followee, createdAt',
      settings: 'key',
      drafts: 'key, updatedAt',
    })
  }
}

export const db = new HavenDB()
