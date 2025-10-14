import { Sparkles, MessagesSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Trace } from '../lib/types'
import clsx from 'clsx'
import { cardTransition } from '../lib/animation'

type TraceCardProps = {
  trace: Trace
  timeLabel: string
  onResonate: (traceId: string) => void
  onReflect: (traceId: string) => void
  onOpenProfile: (author: string) => void
  hideReflect?: boolean
}

const TraceCard = ({
  trace,
  timeLabel,
  onResonate,
  onReflect,
  onOpenProfile,
  hideReflect,
}: TraceCardProps) => {
  return (
    <motion.article
      layout
      initial={cardTransition.initial}
      animate={cardTransition.animate}
      transition={cardTransition.animate.transition}
    >
      <div
        className={clsx(
          'relative overflow-hidden rounded-2xl border border-white/5 bg-neutral-950/60 p-4 transition-colors hover:border-white/10',
        )}
      >
        <div className="mb-2 flex items-center justify-between text-sm text-neutral-400">
          <button
            onClick={() => onOpenProfile(trace.author)}
            className="font-medium text-neutral-100 transition hover:underline"
          >
            {trace.author}
          </button>
          <span>{timeLabel}</span>
        </div>

        <p className="text-[15px] leading-relaxed text-neutral-100">{trace.text}</p>

        <div className="mt-3 flex gap-4 text-sm text-neutral-400">
          <motion.button
            onClick={() => onResonate(trace.id)}
            className="flex items-center gap-1 transition hover:text-white"
            aria-label="Resonate trace"
            aria-pressed={trace.resonates ?? false}
            whileTap={{ scale: 0.96 }}
          >
            <motion.span
              animate={
                trace.resonates
                  ? { scale: 1.1, opacity: 1 }
                  : { scale: 1, opacity: 0.75 }
              }
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="flex h-5 w-5 items-center justify-center"
            >
              <Sparkles
                className={clsx(
                  'h-4 w-4',
                  trace.resonates ? 'fill-emerald-500 text-emerald-400' : '',
                )}
              />
            </motion.span>
            Resonate
          </motion.button>
          {!hideReflect && (
            <button
              onClick={() => onReflect(trace.id)}
              className="flex items-center gap-1 transition hover:text-white"
              aria-label="Reflect on trace"
            >
              <MessagesSquare className="h-4 w-4" />
              Reflect
            </button>
          )}
        </div>
      </div>
    </motion.article>
  )
}

export default TraceCard
