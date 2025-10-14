import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { TraceType } from '../lib/types'
import { modalVariants } from '../lib/animation'

type ComposerModalProps = {
  isOpen: boolean
  draft: string
  kind: TraceType
  onDraftChange: (value: string) => void
  onKindChange: (value: TraceType) => void
  onClose: () => void
  onPost: () => void
}

const ComposerModal = ({
  isOpen,
  draft,
  kind,
  onDraftChange,
  onKindChange,
  onClose,
  onPost,
}: ComposerModalProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => textareaRef.current?.focus(), 10)
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={modalVariants.backdrop.initial}
      animate={modalVariants.backdrop.animate}
      exit={modalVariants.backdrop.exit}
    >
      <motion.div
        className="w-[90%] max-w-md space-y-4 rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-lg"
        initial={modalVariants.panel.initial}
        animate={modalVariants.panel.animate}
        exit={modalVariants.panel.exit}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Leave a Trace</h3>
          <button
            onClick={onClose}
            className="text-sm text-neutral-400 transition hover:text-white"
          >
            Esc
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="What’s on your mind?"
          className="h-32 w-full resize-none rounded-lg border border-white/10 bg-neutral-950 p-3 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
          aria-label="Trace editor"
        />
        <div className="flex items-center justify-between">
          <select
            value={kind}
            onChange={(event) => onKindChange(event.target.value as TraceType)}
            className="rounded-md border border-white/10 bg-neutral-950 px-2 py-1 text-sm text-neutral-300 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
            aria-label="Trace visibility"
          >
            <option value="circle">Circle</option>
            <option value="signal">Signal</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm text-neutral-400 transition hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={onPost}
              className="rounded-md bg-white px-4 py-1.5 text-sm font-medium text-neutral-950 transition hover:bg-white/80"
            >
              Post
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ComposerModal
