import { motion } from 'framer-motion'
import { modalVariants } from '../../../lib/animation'

type Person = { id: string; name: string; handle: string }

type Props = {
  isOpen: boolean
  title: string
  people: Person[]
  onClose: () => void
  onOpenProfile: (username: string) => void
  onRemove: (username: string) => void
}

const PeopleListModal = ({ isOpen, title, people, onClose, onOpenProfile, onRemove }: Props) => {
  if (!isOpen) return null
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
          <button onClick={onClose} className="text-sm text-neutral-400 hover:text-white">Close</button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {people.length === 0 && (
            <p className="text-sm text-neutral-400">No one yet.</p>
          )}
          {people.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2">
              <div>
                <div className="text-neutral-100">{p.name}</div>
                <div className="text-xs text-neutral-500">{p.handle}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenProfile(p.id)}
                  className="rounded-full border border-white/10 px-3 py-1 text-sm text-neutral-200 hover:bg-white/10"
                >
                  Open
                </button>
                <button
                  onClick={() => onRemove(p.id)}
                  className="rounded-full border border-white/10 px-3 py-1 text-sm text-neutral-200 hover:bg-white/10"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default PeopleListModal
