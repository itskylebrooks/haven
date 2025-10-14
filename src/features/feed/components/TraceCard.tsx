import { Sparkles, MessagesSquare, Trash2 } from 'lucide-react'
// Temporarily avoid framer-motion on the card wrapper to prevent
// mount-time opacity/visibility issues during navigation.
import type { Trace } from '../../../lib/types'
import clsx from 'clsx'

type TraceCardProps = {
  trace: Trace
  timeLabel: string
  onResonate: (traceId: string) => void
  onReflect: (traceId: string) => void
  onOpenProfile: (author: string) => void
  hideReflect?: boolean
  onDelete?: (traceId: string) => void
  canDelete?: boolean
}

const TraceCard = ({
  trace,
  timeLabel,
  onResonate,
  onReflect,
  onOpenProfile,
  hideReflect,
  onDelete,
  canDelete,
}: TraceCardProps) => {
  return (
    <article>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onReflect(trace.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onReflect(trace.id)
          }
        }}
        className={clsx(
          'relative overflow-hidden rounded-2xl border border-white/5 bg-black/60 p-4 transition-colors hover:border-white/10',
        )}
      >
        <div className="mb-2 flex items-center justify-between text-sm text-neutral-400">
          <button
            onClick={(e) => {
              e.stopPropagation()
              const target = trace.authorUsername ?? trace.author
              onOpenProfile(target)
            }}
            className="font-medium text-neutral-100 transition hover:underline"
          >
            {trace.author}
          </button>
          <span>{timeLabel}</span>
        </div>

        <p className="text-[15px] leading-relaxed text-neutral-100">{trace.text}</p>
        {trace.image && (
          <div className="mt-3 overflow-hidden rounded-xl border border-white/5">
            <img src={trace.image} alt="" className="block h-auto w-full" />
          </div>
        )}

        <div className="mt-3 flex gap-4 text-sm text-neutral-400">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onResonate(trace.id)
            }}
            className="flex items-center gap-1 transition hover:text-white"
            aria-label="Resonate trace"
            aria-pressed={trace.resonates ?? false}
          >
            <span className="flex h-5 w-5 items-center justify-center" style={{ opacity: trace.resonates ? 1 : 0.75 }}>
              <Sparkles
                className={clsx(
                  'h-4 w-4',
                  trace.resonates ? 'fill-emerald-500 text-emerald-400' : '',
                )}
              />
            </span>
            Resonate
          </button>
          {!hideReflect && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onReflect(trace.id)
              }}
              className="flex items-center gap-1 transition hover:text-white"
              aria-label="Reflect on trace"
            >
              <MessagesSquare className="h-4 w-4" />
              Reflect
            </button>
          )}
          {canDelete && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(trace.id)
              }}
              className="flex items-center gap-1 transition hover:text-white"
              aria-label="Delete trace"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default TraceCard
