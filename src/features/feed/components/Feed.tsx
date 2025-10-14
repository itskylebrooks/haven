import type { Trace } from '../../../lib/types'
import TraceCard from './TraceCard'
import EmptyState from './EmptyState'

type FeedProps = {
  traces: Trace[]
  currentUsername: string
  currentDisplayName?: string | null
  onResonate: (traceId: string) => void
  onReflect: (traceId: string) => void
  onOpenProfile: (author: string) => void
  formatTime: (createdAt: number) => string
  emptyMessage: string
  onDelete?: (traceId: string) => void
}

const Feed = ({
  traces,
  currentUsername,
  currentDisplayName,
  onResonate,
  onReflect,
  onOpenProfile,
  formatTime,
  emptyMessage,
  onDelete,
}: FeedProps) => {
  const normalizedUsername = currentUsername.trim().toLowerCase()

  return (
    <main className="mx-auto w-full max-w-xl space-y-6 px-4 py-6">
      {traces.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        traces.map((trace) => {
          const canDelete =
            trace.authorUsername?.toLowerCase() === normalizedUsername ||
            (currentDisplayName != null && trace.author === currentDisplayName)

          return (
            <TraceCard
              key={trace.id}
              trace={trace}
              timeLabel={formatTime(trace.createdAt)}
              onResonate={onResonate}
              onReflect={onReflect}
              onOpenProfile={onOpenProfile}
              onDelete={onDelete}
              canDelete={canDelete}
            />
          )
        })
      )}
      {traces.length > 0 && (
        <p className="pt-10 text-center text-sm text-neutral-500">You’re all caught up.</p>
      )}
    </main>
  )
}

export default Feed
