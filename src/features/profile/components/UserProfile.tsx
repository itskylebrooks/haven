import type { Trace, TraceType } from '../../../lib/types'
import TraceCard from '../../feed/components/TraceCard'
import ProfileHeader from './ProfileHeader'
import ProfileSwitcher from './ProfileSwitcher'

type UserProfileProps = {
  profile: {
    name: string
    handle: string
    bio: string
    avatar?: string | null
    signalFollowers: number
  }
  traces: Trace[]
  connected: boolean
  requested?: boolean
  followed?: boolean
  onConnectToggle: () => void
  onFollowToggle: () => void
  onResonate: (traceId: string) => void
  onReflect: (traceId: string) => void
  onOpenProfile: (author: string) => void
  formatTime: (createdAt: number) => string
  filterKind: TraceType
  onChangeFilter: (kind: TraceType) => void
}

const UserProfile = ({
  profile,
  traces,
  connected,
  requested,
  followed,
  onConnectToggle,
  onFollowToggle,
  onResonate,
  onReflect,
  onOpenProfile,
  formatTime,
  filterKind,
  onChangeFilter,
}: UserProfileProps) => {
  const visibleTraces = traces
    .filter((trace) => trace.kind === filterKind)
    .filter((trace) => (trace.kind === 'circle' ? connected : true))
    .sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 px-4 py-10">
      <div className="mb-2">
        <button
          onClick={() => window.history.back()}
          className="text-sm text-neutral-400 transition hover:text-white"
          aria-label="Go back"
        >
          ← Back
        </button>
      </div>
      <ProfileHeader
        name={profile.name}
        handle={profile.handle}
        bio={profile.bio}
        avatar={profile.avatar}
        variant="other"
        signals={visibleTraces.filter((trace) => trace.kind === 'signal').length}
        signalFollowers={profile.signalFollowers}
        connected={connected}
        requested={requested}
        onConnectToggle={onConnectToggle}
        followed={followed}
        onFollowToggle={onFollowToggle}
        showConnect
      />



      <div className="flex justify-center">
        <ProfileSwitcher current={filterKind} onChange={onChangeFilter} />
      </div>

      <section className="space-y-4">
        {visibleTraces.length === 0 ? (
          <p className="rounded-xl border border-white/5 bg-black/60 p-4 text-sm text-neutral-400">
            {filterKind === 'circle' && !connected
              ? 'Circles are mutual. Connect to see each other’s Circles.'
              : 'No traces yet.'}
          </p>
        ) : (
          visibleTraces.map((trace) => (
            <TraceCard
              key={trace.id}
              trace={trace}
              timeLabel={formatTime(trace.createdAt)}
              onResonate={onResonate}
              onReflect={onReflect}
              onOpenProfile={onOpenProfile}
            />
          ))
        )}
      </section>
    </div>
  )
}

export default UserProfile
