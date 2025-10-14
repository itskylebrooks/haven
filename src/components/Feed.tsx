import type { Trace } from '../lib/types'
import TraceCard from './TraceCard'
import EmptyState from './EmptyState'

type FeedProps = {
  traces: Trace[]
  onResonate: (traceId: string) => void
  onReflect: (traceId: string) => void
  onOpenProfile: (author: string) => void
  formatTime: (createdAt: number) => string
  emptyMessage: string
}

const Feed = ({
  traces,
  onResonate,
  onReflect,
  onOpenProfile,
  formatTime,
  emptyMessage,
}: FeedProps) => (
  <main className="mx-auto w-full max-w-xl space-y-6 px-4 py-6">
    {traces.length === 0 ? (
      <EmptyState message={emptyMessage} />
    ) : (
      traces.map((trace) => (
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
    {traces.length > 0 && (
      <p className="pt-10 text-center text-sm text-neutral-500">
        You’re all caught up.
      </p>
    )}
  </main>
)

export default Feed
