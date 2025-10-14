import { Radio, Users, VenetianMask } from 'lucide-react'

type ProfileHeaderProps = {
  name: string
  handle: string
  bio: string
  avatar?: string | null
  variant: 'self' | 'other'
  circles?: number
  signals?: number
  signalFollowers?: number
  connected?: boolean
  onConnectToggle?: () => void
  showConnect?: boolean
  gradientFrom?: string
  gradientTo?: string
  onShowFriends?: () => void
  onShowFollowers?: () => void
}

const ProfileHeader = ({
  name,
  handle,
  bio,
  avatar,
  variant,
  circles,
  signals,
  signalFollowers,
  connected,
  onConnectToggle,
  showConnect,
  gradientFrom = 'from-amber-400/30',
  gradientTo = 'to-purple-500/30',
  onShowFriends,
  onShowFollowers,
}: ProfileHeaderProps) => (
  <div className="space-y-3 text-center">
    <div className={`mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full border border-white/10 ${avatar ? 'bg-neutral-900' : 'bg-neutral-800'}`}>
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-neutral-200/90">
          <VenetianMask className="h-8 w-8" />
        </div>
      )}
    </div>
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
        {handle}
      </p>
      <h2 className="text-xl font-semibold text-white">{name}</h2>
    </div>
    <p className="text-sm text-neutral-400">{bio}</p>

      {variant === 'self' ? (
      <div className="flex justify-center gap-4 text-sm text-neutral-400">
        <button
          onClick={onShowFriends}
          className="rounded-full border border-white/10 px-3 py-1 hover:bg-white/10"
        >
          <Users className="mr-1 inline h-4 w-4" />
          {circles ?? 0} Friends
        </button>
        <button
          onClick={onShowFollowers}
          className="rounded-full border border-white/10 px-3 py-1 hover:bg-white/10"
        >
          <Radio className="mr-1 inline h-4 w-4" />
          {signals ?? 0} Followers
        </button>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-2 text-sm text-neutral-400">
        <span>
          <Radio className="mr-1 inline h-4 w-4" />
          {signalFollowers} Followers
        </span>
        {showConnect && (
          <button
            onClick={onConnectToggle}
            className={`rounded-full border border-white/10 px-4 py-1 text-sm font-medium transition ${
              connected
                ? 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {connected ? 'Connected' : 'Connect'}
          </button>
        )}
      </div>
    )}
  </div>
)

export default ProfileHeader
