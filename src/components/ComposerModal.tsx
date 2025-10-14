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
  image?: string | null
  onImageChange?: (dataUrl: string | null) => void
  title?: string
  submitLabel?: string
}

const ComposerModal = ({
  isOpen,
  draft,
  kind,
  onDraftChange,
  onKindChange,
  onClose,
  onPost,
  image,
  onImageChange,
  title = 'Leave a Trace',
  submitLabel = 'Post',
}: ComposerModalProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
        className="w-[90%] max-w-md space-y-4 rounded-2xl border border-white/10 bg-black p-6 shadow-lg"
        initial={modalVariants.panel.initial}
        animate={modalVariants.panel.animate}
        exit={modalVariants.panel.exit}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="What’s on your mind?"
          className="h-32 w-full resize-none rounded-lg border border-white/10 bg-black p-3 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
          aria-label="Trace editor"
        />
        {typeof onImageChange === 'function' && (
          <div className="space-y-3">
            {image && (
              <div className="overflow-hidden rounded-xl border border-white/10">
                <img src={image} alt="" className="block h-auto w-full" />
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-neutral-200 hover:bg-white/10"
              >
                {image ? 'Change image' : 'Add image'}
              </button>
              {image && (
                <button
                  onClick={() => onImageChange(null)}
                  className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/10"
                >
                  Remove
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    onImageChange?.(reader.result as string)
                  }
                  reader.readAsDataURL(f)
                }}
              />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="inline-flex rounded-full border border-white/10 bg-black p-1 text-sm">
            {(['circle', 'signal'] as const).map((opt) => {
              const active = kind === opt
              return (
                <button
                  key={opt}
                  onClick={() => onKindChange(opt)}
                  className={
                    'px-3 py-1.5 rounded-full transition-colors ' +
                    (active ? 'bg-white text-neutral-900' : 'text-neutral-300 hover:text-white hover:bg-white/10')
                  }
                  aria-pressed={active}
                >
                  {opt === 'circle' ? 'Circles' : 'Signals'}
                </button>
              )
            })}
          </div>
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
              {submitLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ComposerModal
